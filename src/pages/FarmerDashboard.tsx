import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Package, TrendingUp, IndianRupee, BarChart3, Truck, Edit, Trash2, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const earningsData = [
  { month: "Oct", earnings: 12000 }, { month: "Nov", earnings: 18000 },
  { month: "Dec", earnings: 15000 }, { month: "Jan", earnings: 22000 },
  { month: "Feb", earnings: 28000 }, { month: "Mar", earnings: 35000 },
];

const FarmerDashboard = () => {
  const { user, profile, role } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"overview" | "crops" | "orders">("overview");
  const [showAddCrop, setShowAddCrop] = useState(false);
  const [newCrop, setNewCrop] = useState({ name: "", price: "", quantity: "", unit: "kg", category: "vegetables", is_organic: false, description: "" });

  const { data: myProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ["farmer-products", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("farmer_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: myOrders = [] } = useQuery({
    queryKey: ["farmer-orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*, order_items(*, products(name))").eq("farmer_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const addProduct = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("products").insert({
        farmer_id: user!.id,
        name: newCrop.name,
        price: Number(newCrop.price),
        quantity: Number(newCrop.quantity),
        unit: newCrop.unit,
        category: newCrop.category,
        is_organic: newCrop.is_organic,
        description: newCrop.description,
        location: profile?.city || "",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Crop added!");
      setShowAddCrop(false);
      setNewCrop({ name: "", price: "", quantity: "", unit: "kg", category: "vegetables", is_organic: false, description: "" });
      queryClient.invalidateQueries({ queryKey: ["farmer-products"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Crop deleted");
      queryClient.invalidateQueries({ queryKey: ["farmer-products"] });
    },
  });

  if (!user || role !== "farmer") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Please log in as a farmer to access this dashboard.</p>
        <Link to="/login"><Button variant="hero">Login as Farmer</Button></Link>
      </div>
    );
  }

  const statusColor: Record<string, string> = {
    pending: "bg-farm-gold/20 text-farm-earth",
    packed: "bg-primary/10 text-primary",
    shipped: "bg-accent/20 text-accent-foreground",
    delivered: "bg-primary/20 text-primary",
  };

  const totalEarnings = myOrders.reduce((s: number, o: any) => s + Number(o.total_amount), 0);
  const pendingOrders = myOrders.filter((o: any) => o.status === "pending").length;

  const cropSales = myProducts.map((p: any) => ({ name: p.name, sales: Number(p.quantity) }));

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="hero-gradient py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <div className="text-4xl">👨‍🌾</div>
            <div>
              <h1 className="font-serif text-2xl font-bold text-primary-foreground md:text-3xl">Welcome back, {profile?.full_name || "Farmer"}!</h1>
              <p className="text-primary-foreground/80">{profile?.city || "India"} • Verified Farmer</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: IndianRupee, label: "Total Earnings", value: `₹${totalEarnings.toLocaleString()}`, color: "text-primary" },
            { icon: Package, label: "Active Crops", value: myProducts.length.toString(), color: "text-accent" },
            { icon: Truck, label: "Pending Orders", value: pendingOrders.toString(), color: "text-farm-gold" },
            { icon: TrendingUp, label: "Total Orders", value: myOrders.length.toString(), color: "text-primary" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="rounded-xl border bg-card p-5 card-shadow">
              <div className="flex items-center gap-3">
                <Icon className={`h-8 w-8 ${color}`} />
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold text-foreground">{value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-6 flex gap-2 border-b">
          {(["overview", "crops", "orders"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-[1px] ${activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border bg-card p-6 card-shadow">
              <h3 className="mb-4 flex items-center gap-2 font-serif text-lg font-semibold text-foreground">
                <BarChart3 className="h-5 w-5 text-primary" /> Earnings Trend
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={earningsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(40, 20%, 88%)" />
                  <XAxis dataKey="month" stroke="hsl(150, 10%, 45%)" fontSize={12} />
                  <YAxis stroke="hsl(150, 10%, 45%)" fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="earnings" stroke="hsl(153, 51%, 30%)" strokeWidth={2} dot={{ fill: "hsl(153, 51%, 30%)" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-xl border bg-card p-6 card-shadow">
              <h3 className="mb-4 flex items-center gap-2 font-serif text-lg font-semibold text-foreground">
                <Package className="h-5 w-5 text-primary" /> Crop Inventory
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={cropSales.length > 0 ? cropSales : [{ name: "No crops", sales: 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(40, 20%, 88%)" />
                  <XAxis dataKey="name" stroke="hsl(150, 10%, 45%)" fontSize={12} />
                  <YAxis stroke="hsl(150, 10%, 45%)" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="sales" fill="hsl(85, 40%, 50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === "crops" && (
          <div>
            <div className="mb-4 flex justify-between items-center">
              <h3 className="font-serif text-lg font-semibold text-foreground">Your Crops</h3>
              <Button variant="hero" size="sm" onClick={() => setShowAddCrop(!showAddCrop)}>
                <Plus className="mr-1 h-4 w-4" /> Add Crop
              </Button>
            </div>

            {showAddCrop && (
              <div className="mb-6 rounded-xl border bg-card p-6 card-shadow">
                <div className="grid gap-4 sm:grid-cols-2">
                  <input placeholder="Crop Name" value={newCrop.name} onChange={e => setNewCrop(c => ({ ...c, name: e.target.value }))} className="rounded-lg border bg-muted/30 px-4 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" />
                  <input placeholder="Price per unit" type="number" value={newCrop.price} onChange={e => setNewCrop(c => ({ ...c, price: e.target.value }))} className="rounded-lg border bg-muted/30 px-4 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" />
                  <input placeholder="Quantity available" type="number" value={newCrop.quantity} onChange={e => setNewCrop(c => ({ ...c, quantity: e.target.value }))} className="rounded-lg border bg-muted/30 px-4 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" />
                  <select value={newCrop.category} onChange={e => setNewCrop(c => ({ ...c, category: e.target.value }))} className="rounded-lg border bg-muted/30 px-4 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30">
                    {["vegetables", "fruits", "grains", "dairy", "spices"].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <textarea placeholder="Description" value={newCrop.description} onChange={e => setNewCrop(c => ({ ...c, description: e.target.value }))} className="rounded-lg border bg-muted/30 px-4 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 sm:col-span-2" />
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input type="checkbox" checked={newCrop.is_organic} onChange={e => setNewCrop(c => ({ ...c, is_organic: e.target.checked }))} className="accent-primary" />
                    Organic
                  </label>
                </div>
                <Button variant="hero" size="sm" className="mt-4" onClick={() => addProduct.mutate()} disabled={addProduct.isPending}>
                  {addProduct.isPending ? "Adding..." : "Save Crop"}
                </Button>
              </div>
            )}

            {productsLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {myProducts.map((p: any) => (
                  <div key={p.id} className="rounded-xl border bg-card p-4 card-shadow">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl">🌱</span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => deleteProduct.mutate(p.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <h4 className="mt-2 font-semibold text-foreground">{p.name}</h4>
                    <p className="text-sm text-muted-foreground">₹{p.price}/{p.unit} • {p.quantity} {p.unit} available</p>
                    {p.is_organic && <span className="text-xs text-primary font-medium">🌿 Organic</span>}
                  </div>
                ))}
                {myProducts.length === 0 && (
                  <div className="col-span-full py-10 text-center text-muted-foreground">No crops yet. Add your first crop!</div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "orders" && (
          <div className="rounded-xl border bg-card card-shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Order ID</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Products</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Total</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {myOrders.map((o: any) => (
                  <tr key={o.id} className="border-t">
                    <td className="px-4 py-3 font-medium text-foreground">{o.id.slice(0, 8).toUpperCase()}</td>
                    <td className="px-4 py-3 text-foreground">{o.order_items?.map((i: any) => i.products?.name).filter(Boolean).join(", ") || "—"}</td>
                    <td className="px-4 py-3 font-medium text-foreground">₹{o.total_amount}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColor[o.status] || "bg-muted text-muted-foreground"}`}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {myOrders.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">No orders yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmerDashboard;
