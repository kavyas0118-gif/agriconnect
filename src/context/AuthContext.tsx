import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { logLoginToSheets, logLogoutToSheets } from "@/lib/sheetsService";

type AppRole = "consumer" | "farmer" | "admin";

interface LocationData {
  lat: number | null;
  lng: number | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  profile: { full_name: string | null; phone: string | null; city: string | null; state: string | null } | null;
  loading: boolean;
  location: LocationData;
  setLocation: (loc: LocationData) => void;
  signUp: (email: string, password: string, fullName: string, role: AppRole) => Promise<{ error: any }>;
  signIn: (email: string, password: string, location?: LocationData) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [profile, setProfile] = useState<AuthContextType["profile"]>(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<LocationData>({ lat: null, lng: null });

  const fetchUserData = async (userId: string) => {
    const [roleRes, profileRes] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
      supabase.from("profiles").select("full_name, phone, city, state").eq("user_id", userId).maybeSingle(),
    ]);
    if (roleRes.data) setRole(roleRes.data.role);
    if (profileRes.data) setProfile(profileRes.data);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => fetchUserData(session.user.id), 0);
      } else {
        setRole(null);
        setProfile(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchUserData(session.user.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, selectedRole: AppRole) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role: selectedRole },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string, loc?: LocationData) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.user) {
      const loginTime = new Date().toISOString();
      
      // Strict backend tracking without storing in localStorage
      await supabase.from("profiles").update({ updated_at: loginTime }).eq("user_id", data.user.id);
      
      // Log to Google Sheets integration strictly
      logLoginToSheets({
        id: data.user.id,
        name: data.user.user_metadata?.full_name || email.split("@")[0],
        email: data.user.email || email,
        loginTime,
        lat: loc?.lat ?? null,
        lng: loc?.lng ?? null,
      });
    }
    return { error };
  };

  const signOut = async () => {
    if (user) {
      logLogoutToSheets({
        id: user.id,
        logoutTime: new Date().toISOString(),
      });
    }
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, role, profile, loading, location, setLocation, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
