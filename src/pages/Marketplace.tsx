import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import {
  Search, Filter, ShoppingCart, Leaf, MapPin, Loader2,
  Star, BadgeCheck, ChevronDown, ChevronUp, X, SlidersHorizontal,
  Minus, Plus, Eye,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MOCK_PRODUCTS } from "@/lib/mockProducts";
import { Product } from "@/lib/data";

const categories = ["all", "vegetables", "fruits", "grains", "dairy", "spices"] as const;
const sortOptions = ["default", "price-asc", "price-desc", "rating", "savings"] as const;

type SortOption = typeof sortOptions[number];

/* ─── Availability Badge ─────────────────────────────────────────── */
const AvailBadge = ({ qty }: { qty: number }) => {
  if (qty > 200) return <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">In Stock</span>;
  if (qty > 0)   return <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-semibold text-yellow-700">Limited</span>;
  return              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">Out of Stock</span>;
};

/* ─── Star Rating ────────────────────────────────────────────────── */
const StarRating = ({ rating, reviews }: { rating: number; reviews: number }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        className={`h-3 w-3 ${s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
      />
    ))}
    <span className="text-[10px] text-muted-foreground ml-1">({reviews})</span>
  </div>
);

/* ─── Product Card ───────────────────────────────────────────────── */
const ProductCard = ({ product }: { product: Product }) => {
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);
  const [flipped, setFlipped] = useState(false);

  const savings = Math.round(((product.marketPrice - product.price) / product.marketPrice) * 100);

  const handleAdd = () => {
    addToCart(product, qty);
    toast.success(`🛒 Added ${qty} ${product.unit} of ${product.name} to cart!`);
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 flex flex-col">
      {/* Image / Emoji area */}
      <div className="relative flex h-44 items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 text-7xl select-none">
        {product.image}

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1">
          {product.organic && (
            <span className="flex items-center gap-1 rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
              <Leaf className="h-2.5 w-2.5" /> Organic
            </span>
          )}
          <AvailBadge qty={product.quantity} />
        </div>

        <span className="absolute right-3 top-3 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
          Save {savings}%
        </span>

        {/* Quick info flip button */}
        <button
          onClick={() => setFlipped((f) => !f)}
          className="absolute bottom-2 right-2 rounded-full bg-background/80 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow"
          title="Farmer info"
        >
          <Eye className="h-3.5 w-3.5 text-foreground" />
        </button>
      </div>

      {/* Farmer info panel (overlay) */}
      {flipped && (
        <div className="absolute inset-0 z-20 flex flex-col justify-center rounded-2xl bg-card/97 p-5 text-sm animate-fade-up">
          <button onClick={() => setFlipped(false)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
          <p className="mb-3 font-semibold text-foreground text-base">🧑‍🌾 Farmer Details</p>
          <div className="space-y-1.5 text-muted-foreground">
            <p><span className="text-foreground font-medium">Name:</span> {product.farmer.name}</p>
            <p className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-primary" /> {product.farmer.location}</p>
            <p className="flex items-center gap-1">
              <BadgeCheck className="h-3.5 w-3.5 text-green-500" />
              {product.farmer.verified ? "Verified Farmer" : "Unverified"}
            </p>
            <p>📦 Crops listed: {product.farmer.crops}</p>
            <p>⭐ Rating: {product.farmer.rating}/5</p>
            <p>📍 Distance: ~{product.farmer.distance} km away</p>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground border-t pt-2">{product.description}</p>
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground leading-tight">{product.name}</h3>
          {product.farmer.verified && <BadgeCheck className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />}
        </div>

        <StarRating rating={product.rating} reviews={product.reviews} />

        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 text-primary" />
          <span className="truncate">{product.farmer.location}</span>
          <span className="shrink-0">· ~{product.farmer.distance} km</span>
        </div>

        <div className="mt-1 text-xs text-muted-foreground">By <span className="font-medium text-foreground">{product.farmer.name}</span></div>

        {/* Price */}
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-foreground">₹{product.price}</span>
          <span className="text-sm text-muted-foreground line-through">₹{product.marketPrice}</span>
          <span className="text-xs text-muted-foreground">/{product.unit}</span>
        </div>

        {/* Stock */}
        <div className="mt-1 text-xs text-muted-foreground">
          Available: <span className="font-medium text-foreground">{product.quantity} {product.unit}s</span>
        </div>

        {/* Quantity selector */}
        <div className="mt-3 flex items-center gap-2 rounded-lg border bg-muted/30 px-2 py-1 w-fit">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="w-8 text-center text-sm font-bold text-foreground">{qty}</span>
          <button
            onClick={() => setQty((q) => Math.min(product.quantity, q + 1))}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
          >
            <Plus className="h-3 w-3" />
          </button>
          <span className="ml-1 text-[10px] text-muted-foreground">{product.unit}</span>
        </div>

        {/* Buttons */}
        <div className="mt-3 flex gap-2">
          <Button
            variant="hero"
            size="sm"
            className="flex-1 text-xs"
            disabled={product.quantity === 0}
            onClick={handleAdd}
          >
            <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
            Add to Cart
          </Button>
          <Link to="/cart" className="flex-1">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              disabled={product.quantity === 0}
              onClick={handleAdd}
            >
              Buy Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Marketplace Page ──────────────────────────────────────── */
const Marketplace = () => {
  const [search, setSearch]         = useState("");
  const [category, setCategory]     = useState<string>("all");
  const [organicOnly, setOrganicOnly] = useState(false);
  const [maxPrice, setMaxPrice]     = useState(500);
  const [sortBy, setSortBy]         = useState<SortOption>("default");
  const [locationFilter, setLocationFilter] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(true);

  /* Fetch from Supabase; fall back to mock if empty */
  const { data: dbProducts, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*");
      if (error) throw error;
      return data || [];
    },
  });

  /* Map DB rows → Product shape */
  const dbMapped: Product[] = (dbProducts || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    category: p.category as any,
    price: Number(p.price),
    marketPrice: Math.round(Number(p.price) * 1.4),
    unit: p.unit,
    quantity: Number(p.quantity),
    farmer: {
      id: p.farmer_id,
      name: p.profiles?.full_name || "Unknown Farmer",
      location: [p.profiles?.city, p.profiles?.state].filter(Boolean).join(", ") || "India",
      distance: 0,
      rating: 5.0,
      avatar: "👨‍🌾",
      crops: 0,
      verified: true,
    },
    image: emojiForName(p.name),
    organic: p.is_organic || false,
    rating: 5.0,
    reviews: 0,
    description: p.description || "",
  }));

  /* Merge: DB products first, then mock for any missing kinds */
  const allProducts = dbMapped.length > 0
    ? [...dbMapped, ...MOCK_PRODUCTS.filter((m) => !dbMapped.find((d) => d.name.toLowerCase() === m.name.toLowerCase()))]
    : MOCK_PRODUCTS;

  /* Filter */
  const filtered = useMemo(() => {
    let list = allProducts.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (organicOnly && !p.organic) return false;
      if (p.price > maxPrice) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (locationFilter && !p.farmer.location.toLowerCase().includes(locationFilter.toLowerCase())) return false;
      return true;
    });

    /* Sort */
    switch (sortBy) {
      case "price-asc":  list = list.sort((a, b) => a.price - b.price); break;
      case "price-desc": list = list.sort((a, b) => b.price - a.price); break;
      case "rating":     list = list.sort((a, b) => b.rating - a.rating); break;
      case "savings":    list = list.sort((a, b) => (b.marketPrice - b.price) - (a.marketPrice - a.price)); break;
    }
    return list;
  }, [allProducts, category, organicOnly, maxPrice, search, locationFilter, sortBy]);

  return (
    <div className="min-h-screen">
      {/* ── Hero Banner ── */}
      <div className="hero-gradient py-14">
        <div className="container mx-auto px-4">
          <h1 className="mb-1 font-serif text-3xl font-bold text-primary-foreground md:text-4xl">
            🌿 Fresh from the Farm
          </h1>
          <p className="mb-6 text-primary-foreground/80">
            Browse vegetables, grains, spices &amp; more — sourced directly from verified local farmers
          </p>

          {/* Search bar */}
          <div className="flex items-center gap-2 rounded-xl bg-background/15 backdrop-blur-sm border border-white/20 px-4 py-2.5 max-w-2xl">
            <Search className="h-5 w-5 text-primary-foreground/60 shrink-0" />
            <input
              id="marketplace-search"
              type="text"
              placeholder="Search tomatoes, rice, wheat, chillies…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-primary-foreground placeholder:text-primary-foreground/50 outline-none text-sm"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-primary-foreground/50 hover:text-primary-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Category pills */}
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-full px-4 py-1 text-sm font-medium capitalize transition-all ${
                  category === c
                    ? "bg-white text-primary shadow-md"
                    : "bg-white/15 text-primary-foreground hover:bg-white/25"
                }`}
              >
                {c === "all" ? "🛒 All" : c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-6 lg:flex-row">

          {/* ── Sidebar Filters ── */}
          <aside className="w-full shrink-0 lg:w-60">
            <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
              <button
                onClick={() => setFiltersOpen((o) => !o)}
                className="flex w-full items-center justify-between px-4 py-3 font-semibold text-foreground hover:bg-muted/30 transition"
              >
                <span className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-primary" /> Filters
                </span>
                {filtersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {filtersOpen && (
                <div className="space-y-5 px-4 pb-5 pt-1">
                  {/* Category */}
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category</p>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((c) => (
                        <button
                          key={c}
                          onClick={() => setCategory(c)}
                          className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                            category === c
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/70"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price range */}
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Max Price: <span className="text-foreground font-bold">₹{maxPrice}</span>
                    </p>
                    <input
                      type="range" min="10" max="500" step="5"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>₹10</span><span>₹500</span>
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Location</p>
                    <div className="flex items-center gap-1.5 rounded-lg border bg-muted/30 px-2 py-1.5">
                      <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                      <input
                        type="text"
                        placeholder="City or State…"
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>

                  {/* Organic toggle */}
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-foreground">
                    <input
                      type="checkbox"
                      checked={organicOnly}
                      onChange={(e) => setOrganicOnly(e.target.checked)}
                      className="accent-primary h-4 w-4"
                    />
                    <Leaf className="h-4 w-4 text-green-500" /> Organic Only
                  </label>

                  {/* Reset */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-muted-foreground"
                    onClick={() => { setCategory("all"); setMaxPrice(500); setOrganicOnly(false); setLocationFilter(""); setSortBy("default"); setSearch(""); }}
                  >
                    Reset Filters
                  </Button>
                </div>
              )}
            </div>
          </aside>

          {/* ── Product Grid ── */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{filtered.length}</span> products found
                {search && <> for "<span className="text-primary">{search}</span>"</>}
              </p>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="rounded-lg border bg-card px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="default">Sort: Default</option>
                  <option value="price-asc">Price: Low → High</option>
                  <option value="price-desc">Price: High → Low</option>
                  <option value="rating">Top Rated</option>
                  <option value="savings">Best Savings</option>
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <p className="text-5xl mb-4">🔍</p>
                <p className="text-lg font-semibold text-foreground">No products found</p>
                <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters or search term</p>
                <Button variant="outline" className="mt-4" onClick={() => { setSearch(""); setCategory("all"); setMaxPrice(500); }}>
                  Clear All Filters
                </Button>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Helper ─────────────────────────────────────────────────────── */
const emojiMap: Record<string, string> = {
  tomato: "🍅", potato: "🥔", onion: "🧅", carrot: "🥕", brinjal: "🍆",
  rice: "🌾", wheat: "🌾", maize: "🌽", chilli: "🌶️", spinach: "🥬",
  mango: "🥭", banana: "🍌", turmeric: "🫚", coriander: "🌿", honey: "🍯",
};

function emojiForName(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(emojiMap)) {
    if (lower.includes(key)) return emoji;
  }
  return "🌱";
}

export default Marketplace;
