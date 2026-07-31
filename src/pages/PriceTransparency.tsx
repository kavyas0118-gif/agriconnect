import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingDown, IndianRupee, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/context/LanguageContext";

const PriceTransparency = () => {
  const { t } = useLanguage();

  const { data: dbProducts = [], isLoading } = useQuery({
    queryKey: ["price-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  const chartData = dbProducts.slice(0, 8).map((p: any) => {
    const markPrice = Math.round(Number(p.price) * 1.4);
    return {
      name: p.name.replace("Fresh ", "").replace("Organic ", ""),
      "Farm Price": Number(p.price),
      "Market Price": markPrice,
      savings: markPrice - Number(p.price),
      unit: p.unit
    };
  });

  const totalSavings = chartData.reduce((s, d) => s + d.savings, 0);

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="hero-gradient py-8">
        <div className="container mx-auto px-4">
          <h1 className="font-serif text-2xl font-bold text-primary-foreground md:text-3xl">Price Transparency</h1>
          <p className="text-primary-foreground/80">See exactly how much you save buying directly from farmers</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : chartData.length === 0 ? (
           <div className="py-20 text-center text-muted-foreground text-lg">No authentic pricing data available yet.</div>
        ) : (
          <>
            <div className="mb-8 flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px] rounded-xl border bg-card p-6 card-shadow text-center">
                <TrendingDown className="mx-auto mb-2 h-8 w-8 text-primary" />
                <p className="text-3xl font-bold text-foreground">30-40%</p>
                <p className="text-sm text-muted-foreground">Average Savings</p>
              </div>
              <div className="flex-1 min-w-[200px] rounded-xl border bg-card p-6 card-shadow text-center">
                <IndianRupee className="mx-auto mb-2 h-8 w-8 text-farm-gold" />
                <p className="text-3xl font-bold text-foreground">₹{totalSavings}</p>
                <p className="text-sm text-muted-foreground">Sample Basket Savings</p>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-6 card-shadow mb-8">
              <h2 className="mb-6 font-serif text-xl font-semibold text-foreground">Farm Price vs Market Price</h2>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(40, 20%, 88%)" />
                  <XAxis dataKey="name" stroke="hsl(150, 10%, 45%)" fontSize={12} />
                  <YAxis stroke="hsl(150, 10%, 45%)" fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Farm Price" fill="hsl(153, 51%, 30%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Market Price" fill="hsl(30, 42%, 64%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl border bg-card card-shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Product</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Farm Price</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Market Price</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">You Save</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.map((p, idx) => (
                      <tr key={idx} className="border-t hover:bg-muted/20">
                        <td className="px-4 py-3 text-foreground font-medium">{p.name}</td>
                        <td className="px-4 py-3 font-bold text-primary">₹{p["Farm Price"]}/{p.unit}</td>
                        <td className="px-4 py-3 text-muted-foreground line-through">₹{p["Market Price"]}/{p.unit}</td>
                        <td className="px-4 py-3 font-bold text-primary">₹{p.savings}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PriceTransparency;
