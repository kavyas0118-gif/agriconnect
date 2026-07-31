import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Users, ShoppingBag, BarChart3, Shield, Loader2, Download, LogIn, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Link } from "react-router-dom";
import LocationTracker from "@/components/LocationTracker";
import * as XLSX from "xlsx";

const COLORS = ["hsl(153, 51%, 30%)", "hsl(85, 40%, 50%)", "hsl(30, 42%, 64%)", "hsl(0, 84%, 60%)"];

type AdminTab = "overview" | "users" | "orders" | "analytics";

const Admin = () => {
  const { user, role } = useAuth();
  const { t } = useLanguage();
  const [tab, setTab] = useState<AdminTab>("overview");

  const { data: allProfiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*, user_roles(role)");
      if (error) throw error;
      return data || [];
    },
    enabled: role === "admin",
  });

  const { data: allOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*, order_items(*, products(name)), profiles:buyer_id(full_name)");
      if (error) throw error;
      return data || [];
    },
    enabled: role === "admin",
  });

  if (!user || role !== "admin") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Shield className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">{t("admin_access_required")}</p>
        <Link to="/login"><Button variant="hero">{t("login_as_admin")}</Button></Link>
      </div>
    );
  }

  // Calculate real metrics directly from database fetches
  const ordersByStatus = [
    { name: "Delivered", value: allOrders.filter((o: any) => o.status === "delivered").length },
    { name: "Shipped", value: allOrders.filter((o: any) => o.status === "shipped").length },
    { name: "Packed", value: allOrders.filter((o: any) => o.status === "packed").length },
    { name: "Pending", value: allOrders.filter((o: any) => o.status === "pending").length },
  ].filter(o => o.value > 0);

  const totalRevenue = allOrders.reduce((s: number, o: any) => s + Number(o.total_amount), 0);

  // Active Users calculation based on recent updated_at records
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const activeLoginsToday = allProfiles.filter((p: any) => new Date(p.updated_at) >= today).length;

  // Real data for platform growth (signups over last 7 days)
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return {
      date: d,
      day: d.toLocaleDateString("en-US", { weekday: "short" }),
      signups: 0
    };
  });

  allProfiles.forEach((p: any) => {
    const createdDate = new Date(p.created_at);
    createdDate.setHours(0,0,0,0);
    const dayMatch = last7Days.find(d => d.date.getTime() === createdDate.getTime());
    if (dayMatch) dayMatch.signups++;
  });

  // Export strictly database user & order information dynamically
  const handleExportExcel = () => {
    const exportData = allProfiles.map((p: any) => ({
      [t("name")]: p.full_name || "—",
      [t("role")]: p.user_roles?.[0]?.role || "consumer",
      [t("location")]: [p.city, p.state].filter(Boolean).join(", ") || "—",
      [t("joined")]: new Date(p.created_at).toLocaleDateString(),
      "Last Activity": new Date(p.updated_at).toLocaleString(),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");

    const ordersData = allOrders.map((o: any) => ({
      "Order ID": o.id.slice(0, 8).toUpperCase(),
      [t("buyer")]: o.profiles?.full_name || "—",
      [t("total")]: `₹${o.total_amount}`,
      [t("status")]: o.status,
      [t("date")]: new Date(o.created_at || Date.now()).toLocaleDateString(),
    }));
    const ws2 = XLSX.utils.json_to_sheet(ordersData);
    XLSX.utils.book_append_sheet(wb, ws2, "Orders");

    XLSX.writeFile(wb, `FARM2HOME_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const tabs: { id: AdminTab; label: string }[] = [
    { id: "overview", label: t("overview") },
    { id: "users", label: t("users") },
    { id: "orders", label: t("orders") },
    { id: "analytics", label: t("login_analytics") },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="hero-gradient py-8">
        <div className="container mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary-foreground" />
            <div>
              <h1 className="font-serif text-2xl font-bold text-primary-foreground md:text-3xl">{t("admin_panel")}</h1>
              <p className="text-primary-foreground/80">{t("platform_management")}</p>
            </div>
          </div>
          <Button
            id="download-report-btn"
            variant="gold"
            size="sm"
            onClick={handleExportExcel}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {t("download_report")}
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stat Cards strictly driven by query length */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Users, label: t("total_users"), value: profilesLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : allProfiles.length.toString() },
            { icon: ShoppingBag, label: t("total_orders"), value: ordersLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : allOrders.length.toString() },
            { icon: BarChart3, label: t("revenue"), value: ordersLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : `₹${totalRevenue.toLocaleString()}` },
            { icon: LogIn, label: t("total_logins_today"), value: profilesLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : activeLoginsToday.toString() },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-xl border bg-card p-5 card-shadow flex flex-col justify-center">
              <Icon className="h-6 w-6 text-primary mb-2" />
              <div className="text-2xl font-bold text-foreground h-8 items-center flex">{value}</div>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Location Tracker */}
        <div className="mb-8 max-w-2xl">
          <h2 className="mb-4 font-serif text-lg font-semibold text-foreground">Admin Live Tracker Tool</h2>
          <LocationTracker showMap={true} />
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b overflow-x-auto">
          {tabs.map((t_) => (
            <button key={t_.id} onClick={() => setTab(t_.id)}
              className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-[1px] transition-colors whitespace-nowrap ${tab === t_.id ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>
              {t_.label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
           <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border bg-card p-6 card-shadow text-center flex flex-col justify-center items-center h-[300px]">
               <Activity className="h-10 w-10 text-muted-foreground mb-3" />
               <h3 className="font-serif text-lg font-semibold text-foreground mb-1">Live Analytics Driven</h3>
               <p className="text-sm text-muted-foreground">Historical revenue charts require historical data models. Only real DB orders are used for sums.</p>
            </div>
            
            <div className="rounded-xl border bg-card p-6 card-shadow">
               <h3 className="mb-4 font-serif text-lg font-semibold text-foreground">{t("orders_by_status")}</h3>
               {ordersByStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                     <Pie data={ordersByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {ordersByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                     </Pie>
                     <Tooltip />
                  </PieChart>
                  </ResponsiveContainer>
               ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">No recent order data available realistically.</div>
               )}
            </div>
         </div>
        )}

        {tab === "users" && (
          <div className="rounded-xl border bg-card card-shadow overflow-hidden">
            {profilesLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("user_label")}</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("location")}</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("role")}</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("joined")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allProfiles.map((p: any) => (
                      <tr key={p.id} className="border-t hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{p.full_name || "—"}</td>
                        <td className="px-4 py-3 text-foreground">{[p.city, p.state].filter(Boolean).join(", ") || "—"}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary capitalize">
                            {p.user_roles?.[0]?.role || "consumer"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {allProfiles.length === 0 && (
                      <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">No users yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === "orders" && (
          <div className="rounded-xl border bg-card card-shadow overflow-hidden">
            {ordersLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("order_label")}</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("buyer")}</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("total")}</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allOrders.map((o: any) => (
                      <tr key={o.id} className="border-t hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{o.id.slice(0, 8).toUpperCase()}</td>
                        <td className="px-4 py-3 text-foreground">{o.profiles?.full_name || "—"}</td>
                        <td className="px-4 py-3 font-medium text-foreground">₹{o.total_amount}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                            o.status === "delivered" ? "bg-primary/20 text-primary" : o.status === "shipped" ? "bg-accent/20 text-foreground" : "bg-farm-gold/20 text-farm-earth"
                          }`}>{o.status}</span>
                        </td>
                      </tr>
                    ))}
                    {allOrders.length === 0 && (
                      <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">{t("no_orders")}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === "analytics" && (
          <div className="grid gap-6">
            <div className="rounded-xl border bg-card p-6 card-shadow">
              <h3 className="mb-4 font-serif text-lg font-semibold text-foreground">Platform Signups (Last 7 Days)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={last7Days}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(40, 20%, 88%)" />
                  <XAxis dataKey="day" fontSize={12} />
                  <YAxis fontSize={12} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="signups" fill="hsl(153, 51%, 30%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border bg-card p-4 card-shadow text-center">
                 <p className="text-xl font-bold text-primary">{allProfiles.filter((p: any) => p.user_roles?.[0]?.role === "farmer").length}</p>
                 <p className="text-xs text-muted-foreground mt-1">Real Farmers Onboarded</p>
              </div>
              <div className="rounded-xl border bg-card p-4 card-shadow text-center">
                 <p className="text-xl font-bold text-primary">{allProfiles.filter((p: any) => p.user_roles?.[0]?.role === "consumer").length}</p>
                 <p className="text-xs text-muted-foreground mt-1">Real Active Customers</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
