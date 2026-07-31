import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Package, Truck, CheckCircle, Clock, Loader2, Map } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import LocationTracker from "@/components/LocationTracker";

const statusSteps = ["pending", "packed", "shipped", "delivered"];
const statusIcons: Record<string, any> = { pending: Clock, packed: Package, shipped: Truck, delivered: CheckCircle };

const Orders = () => {
  const { user } = useAuth();

  const { data: dbOrders, isLoading } = useQuery({
    queryKey: ["orders", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, products(name))")
        .or(`buyer_id.eq.${user.id},farmer_id.eq.${user.id}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Please log in to view your orders.</p>
        <Link to="/login"><Button variant="hero">Login</Button></Link>
      </div>
    );
  }

  // Strict map without fallback mock values
  const ordersToShow = (dbOrders || []).map((o: any) => ({
    id: o.id.slice(0, 8).toUpperCase(),
    product: o.order_items?.map((i: any) => i.products?.name).filter(Boolean).join(", ") || "Order",
    quantity: o.order_items?.reduce((s: number, i: any) => s + Number(i.quantity), 0) || 0,
    total: Number(o.total_amount),
    status: o.status as any,
    date: new Date(o.created_at).toLocaleDateString(),
    estimatedDelivery: new Date(new Date(o.created_at).getTime() + 3 * 86400000).toLocaleDateString(),
  }));

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="hero-gradient py-8">
        <div className="container mx-auto px-4">
          <h1 className="font-serif text-2xl font-bold text-primary-foreground md:text-3xl">Order Tracking</h1>
          <p className="text-primary-foreground/80">Track your orders from farm to doorstep</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-6">
            {ordersToShow.map((order: any) => {
              const currentStep = statusSteps.indexOf(order.status);
              return (
                <div key={order.id} className="rounded-xl border bg-card p-6 card-shadow">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="font-semibold text-foreground">{order.id}</h3>
                      <p className="text-sm text-muted-foreground">{order.product} × {order.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">₹{order.total}</p>
                      <p className="text-xs text-muted-foreground">Est. delivery: {order.estimatedDelivery}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    {statusSteps.map((step, i) => {
                      const Icon = statusIcons[step];
                      const isActive = i <= currentStep;
                      return (
                        <div key={step} className="flex flex-1 items-center">
                          <div className="flex flex-col items-center">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isActive ? "hero-gradient" : "bg-muted"}`}>
                              <Icon className={`h-5 w-5 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
                            </div>
                            <span className={`mt-2 text-xs capitalize ${isActive ? "font-medium text-foreground" : "text-muted-foreground"}`}>{step}</span>
                          </div>
                          {i < statusSteps.length - 1 && (
                            <div className={`mx-2 h-0.5 flex-1 ${i < currentStep ? "bg-primary" : "bg-muted"}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Live Tracking Map Overlay Simulation */}
                  <div className="mt-6 pt-6 border-t border-border/50">
                    <div className="flex items-center gap-2 mb-4">
                      <Map className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold text-sm text-foreground">Live GPS Tracking Simulation</h4>
                    </div>
                    <div className="relative h-48 rounded-lg overflow-hidden border card-shadow">
                      {/* Hide inner LocationTracker header by applying wrapper negative margins or just letting it show */}
                      <div className="absolute inset-0 opacity-50 grayscale">
                        <LocationTracker showMap={true} autoRequest={false} />
                      </div>
                      
                      {/* Route Path Line */}
                      <div className="absolute top-[60%] left-10 right-10 h-1 bg-primary/30 rounded-full z-10 shadow-inner"></div>
                      
                      {/* Delivering Truck */}
                      <div 
                        className="absolute top-[60%] -translate-y-1/2 text-3xl z-20 drop-shadow-xl transition-all duration-1000 ease-in-out pointer-events-none" 
                        style={{ left: `calc(${Math.min(90, (currentStep / 3) * 90)}% + 10px)` }}
                      >
                        🚚
                        <div className="absolute -top-8 -left-4 bg-primary text-primary-foreground text-[10px] uppercase font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-md flex items-center gap-1 animate-bounce">
                           <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> {order.status}
                        </div>
                      </div>

                      {/* Landmarks */}
                      <div className="absolute top-[60%] left-[10px] -translate-y-1/2 text-xl z-20 bg-background rounded-full p-1 border shadow-sm">👨‍🌾</div>
                      <div className="absolute top-[60%] right-[10px] -translate-y-1/2 text-xl z-20 bg-background rounded-full p-1 border shadow-sm">🏠</div>
                    </div>
                  </div>
                </div>
              );
            })}
            {ordersToShow.length === 0 && (
              <div className="py-20 text-center text-muted-foreground">No orders found. Shop for fresh produce to see them here!</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
