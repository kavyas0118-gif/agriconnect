import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, ShoppingBag, MapPin, Star, Truck, Shield, Sprout, Loader2, BadgeCheck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import heroImage from "@/assets/hero-farm.jpg";
import farmerImage from "@/assets/farmer-portrait.png";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Leaf } from "lucide-react";
import { MOCK_PRODUCTS } from "@/lib/mockProducts";

const StatCard = ({ icon: Icon, value, label }: { icon: any; value: string | React.ReactNode; label: string }) => (
  <div className="flex flex-col items-center gap-2 rounded-xl bg-card p-6 card-shadow animate-fade-up">
    <Icon className="h-8 w-8 text-primary" />
    <span className="font-serif text-3xl font-bold text-foreground">{value}</span>
    <span className="text-sm text-muted-foreground">{label}</span>
  </div>
);

const BenefitCard = ({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) => (
  <div className="group rounded-xl border bg-card p-6 transition-all duration-300 hover:card-shadow-hover hover:-translate-y-1">
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
      <Icon className="h-6 w-6 text-primary" />
    </div>
    <h3 className="mb-2 font-serif text-lg font-semibold text-foreground">{title}</h3>
    <p className="text-sm text-muted-foreground">{desc}</p>
  </div>
);

const emojiMap: Record<string, string> = {
  tomatoes: "🍅", rice: "🌾", mangoes: "🥭", spinach: "🥬", turmeric: "🫚",
  chillies: "🌶️", bananas: "🍌", flour: "🌾", potatoes: "🥔", honey: "🍯",
  onions: "🧅", coriander: "🌿",
};

const getEmoji = (name: string) => {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(emojiMap)) {
    if (lower.includes(key)) return emoji;
  }
  return "🌱";
};

const Index = () => {
  const { t } = useLanguage();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["homepage-stats"],
    queryFn: async () => {
      // Use REAL database counts
      const [farmers, orders, customers] = await Promise.all([
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "farmer"),
        supabase.from("orders").select("*", { count: "exact", head: true }),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "consumer")
      ]);
      
      return {
        farmersOnboarded: farmers.count || 0,
        ordersCompleted: orders.count || 0,
        happyCustomers: customers.count || 0,
        citiesCovered: 1, // Starting baseline
      };
    }
  });

  const { data: featuredProducts, isLoading: productsLoading } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").limit(4);
      if (error) throw error;
      return data || [];
    },
  });

  // Always show items: DB first, fill with mock if DB is empty
  const displayProducts = productsLoading
    ? []
    : featuredProducts && featuredProducts.length > 0
    ? featuredProducts.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        marketPrice: Math.round(Number(p.price) * 1.4),
        unit: p.unit,
        quantity: Number(p.quantity),
        organic: p.is_organic || false,
        image: getEmoji(p.name),
        location: [p.profiles?.city, p.profiles?.state].filter(Boolean).join(", ") || "Local Farm",
        farmer: p.profiles?.full_name || "Local Farmer",
      }))
    : MOCK_PRODUCTS.slice(0, 8).map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        marketPrice: p.marketPrice,
        unit: p.unit,
        quantity: p.quantity,
        organic: p.organic,
        image: p.image,
        location: p.farmer.location,
        farmer: p.farmer.name,
      }));

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Lush green farmland at sunset" className="h-full w-full object-cover" width={1920} height={1080} />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/60 to-transparent" />
        </div>
        <div className="container relative mx-auto px-4 py-24 md:py-36">
          <div className="max-w-2xl animate-fade-up">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/20 px-4 py-1.5 text-sm font-medium text-primary-foreground backdrop-blur-sm">
              <Sprout className="h-4 w-4" /> {t("farm_to_table")}
            </div>
            <h1 className="mb-6 text-4xl font-bold leading-tight text-primary-foreground md:text-6xl">
              {t("hero_title")}
            </h1>
            <p className="mb-8 text-lg text-primary-foreground/80 md:text-xl">
              {t("hero_subtitle")}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/marketplace">
                <Button variant="hero" size="lg" className="text-base">
                  <ShoppingBag className="mr-2 h-5 w-5" /> {t("buy_fresh_produce")}
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="gold" size="lg" className="text-base">
                  <Sprout className="mr-2 h-5 w-5" /> {t("sell_your_crops")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto -mt-12 px-4 relative z-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            icon={Users} 
            value={isLoading ? <Loader2 className="h-6 w-6 animate-spin text-primary"/> : stats?.farmersOnboarded.toLocaleString()} 
            label={t("farmers_onboarded")} 
          />
          <StatCard 
            icon={ShoppingBag} 
            value={isLoading ? <Loader2 className="h-6 w-6 animate-spin text-primary"/> : stats?.ordersCompleted.toLocaleString()} 
            label={t("orders_completed")} 
          />
          <StatCard 
            icon={Star} 
            value={isLoading ? <Loader2 className="h-6 w-6 animate-spin text-primary"/> : stats?.happyCustomers.toLocaleString()} 
            label={t("happy_customers")} 
          />
          <StatCard 
            icon={MapPin} 
            value={isLoading ? <Loader2 className="h-6 w-6 animate-spin text-primary"/> : `${stats?.citiesCovered || 1}+`} 
            label={t("cities_covered")} 
          />
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="mb-4 font-serif text-3xl font-bold text-foreground md:text-4xl">{t("how_it_works")}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{t("how_subtitle")}</p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {[
            { step: "01", title: t("step_browse"), desc: t("step_browse_desc"), icon: "🛒" },
            { step: "02", title: t("step_order"), desc: t("step_order_desc"), icon: "📦" },
            { step: "03", title: t("step_deliver"), desc: t("step_deliver_desc"), icon: "🚚" },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="mx-auto mb-4 text-5xl">{item.icon}</div>
              <div className="mb-2 text-sm font-bold text-primary">STEP {item.step}</div>
              <h3 className="mb-2 font-serif text-xl font-semibold text-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="mb-4 font-serif text-3xl font-bold text-foreground md:text-4xl">{t("why_choose")}</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <BenefitCard icon={TrendingUp} title={t("better_prices")} desc={t("better_prices_desc")} />
            <BenefitCard icon={Truck} title={t("farm_fresh")} desc={t("farm_fresh_desc")} />
            <BenefitCard icon={Shield} title={t("verified_farmers")} desc={t("verified_farmers_desc")} />
            <BenefitCard icon={MapPin} title={t("hyperlocal")} desc={t("hyperlocal_desc")} />
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4 py-20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10">
          <div>
            <h2 className="font-serif text-3xl font-bold text-foreground md:text-4xl">🌾 Featured Fresh Produce</h2>
            <p className="text-muted-foreground mt-2">Tomato · Potato · Onion · Carrot · Brinjal · Rice · Wheat · Maize · Chilli · Spinach — and more!</p>
          </div>
          <Link to="/marketplace">
            <Button variant="outline" className="gap-2">
              <Search className="h-4 w-4" /> Browse All Products
            </Button>
          </Link>
        </div>

        {productsLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {displayProducts.map((p) => {
              const savings = Math.round(((p.marketPrice - p.price) / p.marketPrice) * 100);
              const inStock = p.quantity > 0;
              return (
                <Link to="/marketplace" key={p.id} className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 flex flex-col">
                  <div className="relative flex h-44 items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 text-7xl">
                    {p.image}
                    <div className="absolute left-3 top-3 flex flex-col gap-1">
                      {p.organic && (
                        <span className="flex items-center gap-1 rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                          <Leaf className="h-2.5 w-2.5" /> Organic
                        </span>
                      )}
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${inStock ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {inStock ? "In Stock" : "Out of Stock"}
                      </span>
                    </div>
                    <span className="absolute right-3 top-3 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                      Save {savings}%
                    </span>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">{p.name}</h3>
                      <BadgeCheck className="h-4 w-4 text-green-500 shrink-0" />
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 text-primary" /> <span className="truncate">{p.location}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">By <span className="font-medium text-foreground">{p.farmer}</span></div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-xl font-bold text-foreground">₹{p.price}</span>
                      <span className="text-sm text-muted-foreground line-through">₹{p.marketPrice}</span>
                      <span className="text-xs text-muted-foreground">/{p.unit}</span>
                    </div>
                    <div className="mt-auto pt-3">
                      <Button variant="hero" size="sm" className="w-full text-xs" disabled={!inStock}>
                        <ShoppingBag className="mr-1.5 h-3.5 w-3.5" /> Shop Now
                      </Button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Farmer CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="flex flex-col items-center gap-8 rounded-2xl hero-gradient p-8 md:flex-row md:p-12">
          <div className="flex-shrink-0">
            <img src={farmerImage} alt="Happy farmer" className="h-48 w-48 rounded-full object-cover border-4 border-primary-foreground/20" loading="lazy" width={512} height={512} />
          </div>
          <div className="text-center md:text-left">
            <h2 className="mb-4 font-serif text-3xl font-bold text-primary-foreground">{t("are_you_farmer")}</h2>
            <p className="mb-6 text-primary-foreground/80">{t("farmer_cta_desc")}</p>
            <Link to="/login">
              <Button variant="gold" size="lg">{t("start_selling")}</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
