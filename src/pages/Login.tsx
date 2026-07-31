import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Leaf, User, Shield, Eye, EyeOff, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useGeolocation } from "@/hooks/useGeolocation";
import { toast } from "sonner";

type Role = "consumer" | "farmer" | "admin";

const Login = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [role, setRole] = useState<Role>("consumer");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signUp, signIn, user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { lat, lng, getLocation } = useGeolocation();

  // Silently try to get location on mount
  useEffect(() => {
    getLocation();
  }, []);

  if (user) {
    navigate("/");
    return null;
  }

  const handleSubmit = async () => {
    if (!email || !password) {
      toast.error(t("fill_all_fields"));
      return;
    }
    setSubmitting(true);
    try {
      if (isSignup) {
        if (!fullName) { toast.error(t("enter_name")); setSubmitting(false); return; }
        const { error } = await signUp(email, password, fullName, role);
        if (error) throw error;
        toast.success(t("account_created"));
      } else {
        const { error } = await signIn(email, password, { lat, lng });
        if (error) throw error;
        toast.success(t("welcome_back_msg"));
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err.message || t("auth_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  const roles: { id: Role; label: string; icon: any; desc: string }[] = [
    { id: "consumer", label: t("consumer"), icon: User, desc: t("buy_fresh") },
    { id: "farmer", label: t("farmer"), icon: Leaf, desc: t("sell_crops") },
    { id: "admin", label: t("admin_role"), icon: Shield, desc: t("manage_platform") },
  ];

  return (
    <div className="flex min-h-[calc(100vh-65px)] items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl hero-gradient">
            <Leaf className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-foreground">
            {isSignup ? t("create_account") : t("welcome_back")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isSignup ? t("join_today") : t("sign_in_to")}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6 card-shadow">
          {isSignup && (
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-foreground">{t("i_am_a")}</label>
              <div className="grid grid-cols-3 gap-2">
                {roles.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setRole(id)}
                    className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-xs font-medium transition-colors ${
                      role === id ? "border-primary bg-primary/5 text-primary" : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {isSignup && (
              <input
                id="signup-name"
                placeholder={t("full_name")}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border bg-muted/30 px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
              />
            )}
            <input
              id="login-email"
              placeholder={t("email")}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border bg-muted/30 px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
            />
            <div className="relative">
              <input
                id="login-password"
                placeholder={t("password")}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                className="w-full rounded-lg border bg-muted/30 px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-muted-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button id="submit-btn" variant="hero" className="w-full" size="lg" onClick={handleSubmit} disabled={submitting}>
              {submitting ? t("please_wait") : isSignup ? t("sign_up") : t("sign_in")}
            </Button>
          </div>

          {/* Location status indicator */}
          <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className={`h-3 w-3 ${lat ? "text-primary" : "text-muted-foreground"}`} />
            {lat ? (
              <span className="text-primary font-medium">{t("location_enabled")}: {lat.toFixed(4)}°, {lng?.toFixed(4)}°</span>
            ) : (
              <span>{t("location_not_tracked")}</span>
            )}
          </div>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {isSignup ? t("already_have_account") : t("dont_have_account")}{" "}
            <button onClick={() => setIsSignup(!isSignup)} className="font-medium text-primary hover:underline">
              {isSignup ? t("sign_in") : t("sign_up")}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
