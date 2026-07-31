import { useState, useMemo } from "react";
import {
  Clock, Search, Heart, MessageCircle, Bookmark, Share2,
  ChevronRight, X, Plus, Pencil, Trash2, Tag, User,
  CalendarDays, TrendingUp, Loader2, BadgeCheck, ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

/* ─── Types ──────────────────────────────────────────────────────── */
type Category = "All" | "Farming Tips" | "Crop Management" | "Market Trends" | "Organic Farming" | "Seasonal Guide";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;      // emoji or URL
  author: string;
  authorRole: string;
  date: string;
  readTime: number;
  category: Category;
  tags: string[];
  likes: number;
  comments: Comment[];
  published: boolean;
}

interface Comment {
  id: string;
  user: string;
  text: string;
  date: string;
}

/* ─── Mock Data ──────────────────────────────────────────────────── */
const MOCK_POSTS: BlogPost[] = [
  {
    id: "b1",
    title: "10 Proven Tips to Double Your Tomato Yield This Season",
    excerpt: "From soil preparation to watering schedules — discover science-backed techniques that local farmers are using to dramatically increase their tomato yields.",
    content: `Growing tomatoes profitably requires more than just planting seeds and watering. Here are 10 expert techniques:\n\n**1. Soil Preparation**\nTest your soil pH (ideal: 6.0–6.8). Add compost and aged manure 2–3 weeks before planting.\n\n**2. Choose the Right Variety**\nFor Andhra Pradesh, Roma and Cherry varieties perform exceptionally well in hot summers.\n\n**3. Proper Spacing**\nPlant 45–60 cm apart to allow good air circulation and reduce fungal disease.\n\n**4. Regular Pruning**\nRemove suckers (side shoots) weekly to redirect plant energy toward fruit production.\n\n**5. Consistent Watering**\nWater deeply and consistently — 2 inches per week. Irregular watering causes blossom-end rot.\n\n**6. Mulching**\nApply 3 inches of straw mulch to retain moisture and prevent soil-borne diseases.\n\n**7. Fertilisation Schedule**\nUse nitrogen-rich fertiliser at planting; switch to phosphorus-heavy formula once flowering begins.\n\n**8. Stake or Cage Early**\nInstall cages at planting time before roots develop to avoid damage.\n\n**9. Companion Planting**\nPlant basil nearby — it repels aphids and whiteflies naturally.\n\n**10. Harvest at the Right Time**\nHarvest when 80% red and let ripen indoors to extend shelf life and prevent cracking.`,
    image: "🍅",
    author: "Dr. Anand Raju",
    authorRole: "Agricultural Scientist",
    date: "2026-04-01",
    readTime: 6,
    category: "Farming Tips",
    tags: ["tomatoes", "yield", "tips"],
    likes: 148,
    comments: [
      { id: "c1", user: "Ravi Kumar", text: "Tried tip #6 last season — made a huge difference!", date: "2026-04-02" },
      { id: "c2", user: "Lakshmi Bai", text: "What fertilizer ratio do you recommend for stage 2?", date: "2026-04-03" },
    ],
    published: true,
  },
  {
    id: "b2",
    title: "Complete Guide to Organic Rice Cultivation in Andhra Pradesh",
    excerpt: "Organic rice farming is booming in Andhra Pradesh. This guide walks you through every step — from seed selection to post-harvest storage — without any chemicals.",
    content: `Organic rice cultivation is gaining traction across AP as consumers demand chemical-free produce. Here's your complete guide:\n\n**Seed Selection**\nChoose traditional varieties like Sona Masuri, BPT-5204, or Kalavari Samba — these have natural pest resistance.\n\n**Land Preparation**\nPlow the field 3–4 times. Flood with 5 cm of water and let settle for 3 days before transplanting.\n\n**Natural Pest Management**\n- Neem oil spray (3%) every 15 days\n- Release Trichogramma egg parasitoids for stem borers\n- Yellow sticky traps for monitoring insect populations\n\n**Organic Fertilisation**\n- Green manure (Azolla): Apply 200 kg/acre\n- Compost: 4 tonnes/acre\n- Bio-fertilisers: Azospirillum + PSB combination\n\n**Water Management**\nAlternate wetting and drying (AWD) saves 30% water while maintaining yields.\n\n**Harvest & Storage**\nHarvest at 20–25% moisture content. Store in hermetic bags to avoid insect damage without chemicals.\n\n**Certification**\nApply for NPOP organic certification through APEDA — it can fetch 25–40% premium prices.`,
    image: "🌾",
    author: "Sunita Devi",
    authorRole: "Organic Farmer · Warangal",
    date: "2026-03-28",
    readTime: 8,
    category: "Organic Farming",
    tags: ["rice", "organic", "Andhra Pradesh"],
    likes: 213,
    comments: [
      { id: "c3", user: "Venkat Reddy", text: "This is exactly what I needed. Bookmarked!", date: "2026-03-29" },
    ],
    published: true,
  },
  {
    id: "b3",
    title: "April–June Crop Calendar: What to Plant This Summer",
    excerpt: "Planning your summer sowing? Here's the complete seasonal guide with optimal crop choices, sowing windows, and expected market demand for April–June.",
    content: `Summer is a critical season for Telangana and Andhra Pradesh farmers. Plan smart:\n\n**April (Optimal Sowings)**\n- Groundnut (Kharif) — sow in the first week\n- Maize — excellent germination in warm soil\n- Bitter gourd, Ridge gourd, Snake gourd\n- Sunflower — drought tolerant, good returns\n\n**May**\n- Brinjal seedlings can be transplanted\n- Cotton – early sowing advantageous\n- Cow pea – grows well under heat stress\n\n**June (Pre-Kharif)**\n- Kharif varieties of Sorghum (Jowar)\n- Paddy nurseries – raise in last week of June\n- Pigeon pea (Tur dal) — sow before monsoon\n\n**Market Demand Forecast**\n| Crop | Expected Demand | Price Trend |\n|------|-----------------|-------------|\n| Maize | High | ↑ Rising |\n| Tomato | Medium | → Stable |\n| Groundnut | High | ↑ Rising |\n| Brinjal | Medium | ↓ Seasonal low |\n\n**Tips**\n- Use shade nets for summer nurseries\n- Drip irrigation saves up to 50% water\n- Pre-book cold storage slots before harvest`,
    image: "📅",
    author: "Farm2Home Editorial",
    authorRole: "Editorial Team",
    date: "2026-03-25",
    readTime: 5,
    category: "Seasonal Guide",
    tags: ["seasonal", "summer", "crop calendar"],
    likes: 94,
    comments: [],
    published: true,
  },
  {
    id: "b4",
    title: "Why Onion Prices Crashed — And What Farmers Can Do",
    excerpt: "Onion prices fell 60% in February 2026. We analyse the causes, compare market data across mandis, and share strategies for farmers to protect income.",
    content: `The February 2026 onion price crash left thousands of farmers in distress. Let's understand why and what you can do:\n\n**Why Prices Crashed**\n1. Bumper harvest in Maharashtra and Karnataka created oversupply\n2. Export bans prevented excess stock from leaving the country\n3. Cold storage capacity was insufficient — forced selling at low prices\n4. Poor mandi infrastructure leading to post-harvest losses\n\n**Price Comparison Across Mandis**\n| Mandi | Feb Price/kg | Mar Price/kg |\n|-------|-------------|-------------|\n| Lasalgaon | ₹4 | ₹9 |\n| Kurnool AP | ₹5 | ₹11 |\n| Hubli Kar | ₹3 | ₹8 |\n\n**Strategies for Farmers**\n1. **Stagger Sowing**: Don't plant all at once — spread over 3 months\n2. **Cold Storage**: Rent or cooperative storage to delay selling\n3. **Direct Sales**: Platforms like Farm2Home bypass mandi middlemen\n4. **Processing**: Dehydrated onion powder fetches ₹80–120/kg — explore FPO-level processing units\n5. **Crop Diversification**: Rotate with garlic, fenugreek, or coriander\n\n**Government Support**\n- Price Stabilization Fund (PSF) interventions\n- NAFED procurement during extreme price falls\n- PM-AASHA scheme guarantees MSP`,
    image: "🧅",
    author: "Mohan Rao",
    authorRole: "Market Analyst · Farm2Home",
    date: "2026-03-18",
    readTime: 7,
    category: "Market Trends",
    tags: ["onion", "market", "price"],
    likes: 176,
    comments: [
      { id: "c4", user: "Ravi Kumar", text: "Direct selling via Farm2Home saved me this season!", date: "2026-03-20" },
      { id: "c5", user: "Admin", text: "We're working on a price alert feature — stay tuned!", date: "2026-03-21" },
    ],
    published: true,
  },
  {
    id: "b5",
    title: "Integrated Pest Management (IPM) for Vegetable Crops",
    excerpt: "Chemical pesticides are costly and harmful. Learn the IPM approach that reduces pest damage by 70% while keeping your produce safe and organic-certifiable.",
    content: `Integrated Pest Management (IPM) combines biological, cultural, mechanical, and chemical tools to manage pests effectively and sustainably.\n\n**The 4 Pillars of IPM**\n\n**1. Cultural Control**\n- Crop rotation — breaks pest cycles\n- Resistant varieties — Bt brinjal, hybrid tomatoes\n- Clean cultivation — remove plant debris\n\n**2. Biological Control**\n- Trichogramma wasps for leaf miners\n- *Beauveria bassiana* fungus for whiteflies\n- Predatory beetles for aphids\n\n**3. Mechanical Control**\n- Yellow sticky traps — 20 per acre\n- Pheromone traps for fruit borers\n- Bird perches to attract insect-feeding birds\n\n**4. Chemical Control (Last Resort)**\n- Use only approved, low-residue pesticides\n- Follow pre-harvest intervals strictly\n- Rotate chemical classes to prevent resistance\n\n**Cost Comparison**\n| Method | Cost/acre/season | Effectiveness |\n|--------|-----------------|---------------|\n| Chemical only | ₹8,000–12,000 | High short-term |\n| IPM approach | ₹3,000–5,000 | Sustained long-term |\n\n**Getting Started**\nContact your local Krishi Vigyan Kendra (KVK) for free IPM training workshops.`,
    image: "🌿",
    author: "Dr. Priya Sharma",
    authorRole: "Extension Officer · KVK Guntur",
    date: "2026-03-10",
    readTime: 9,
    category: "Crop Management",
    tags: ["IPM", "pest", "organic", "management"],
    likes: 132,
    comments: [],
    published: true,
  },
  {
    id: "b6",
    title: "Drip Irrigation Setup Guide for Small Farmers (Under ₹15,000)",
    excerpt: "Drip irrigation can increase yields by 40% while cutting water usage in half. This affordable guide shows how small farms (1–2 acres) can set it up under ₹15,000.",
    content: `Drip irrigation is no longer just for large farms. Here's how to set it up affordably:\n\n**Why Drip Irrigation?**\n- Saves 50–70% water vs flood irrigation\n- Reduces fertiliser use by 30% (fertigation)\n- Decreases weed growth significantly\n- Delivers water directly to root zone\n\n**Budget Breakdown (1 Acre)**\n| Component | Cost |\n|-----------|------|\n| Main pipe (HDPE 63mm) | ₹3,200 |\n| Lateral pipes (16mm) | ₹2,800 |\n| Drippers (2 LPH) | ₹2,500 |\n| Filter unit | ₹1,800 |\n| Connectors & fittings | ₹1,200 |\n| Labour | ₹2,500 |\n| **Total** | **₹14,000** |\n\n**Government Subsidies**\n- PM Krishi Sinchayee Yojana: 45–55% subsidy\n- Apply through your District Agriculture Office\n- SC/ST farmers get up to 70% subsidy\n\n**Installation Steps**\n1. Design layout based on crop row spacing\n2. Install main line along field boundary\n3. Lay laterals along crop rows\n4. Install drippers at plant positions\n5. Connect filter and pressure regulator at source\n6. Test system before planting\n\n**Maintenance**\n- Flush lines weekly\n- Clean filter every 15 days\n- Check dripper flow rates monthly`,
    image: "💧",
    author: "Venkat Reddy",
    authorRole: "Progressive Farmer · Karimnagar",
    date: "2026-03-05",
    readTime: 6,
    category: "Farming Tips",
    tags: ["irrigation", "drip", "water", "subsidy"],
    likes: 267,
    comments: [
      { id: "c6", user: "Lakshmi Bai", text: "Got the subsidy approved last month. The process was smooth!", date: "2026-03-06" },
    ],
    published: true,
  },
];

const CATEGORIES: Category[] = ["All", "Farming Tips", "Crop Management", "Market Trends", "Organic Farming", "Seasonal Guide"];

const CATEGORY_COLORS: Record<Category, string> = {
  "All": "bg-muted text-muted-foreground",
  "Farming Tips": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "Crop Management": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "Market Trends": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  "Organic Farming": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  "Seasonal Guide": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

/* ─── Blog Card ──────────────────────────────────────────────────── */
const BlogCard = ({
  post,
  onRead,
  onLike,
  liked,
  saved,
  onSave,
}: {
  post: BlogPost;
  onRead: () => void;
  onLike: () => void;
  liked: boolean;
  saved: boolean;
  onSave: () => void;
}) => (
  <div className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5">
    {/* Cover */}
    <div
      className="relative flex h-48 cursor-pointer items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 text-7xl select-none"
      onClick={onRead}
    >
      {post.image.startsWith("http") ? (
        <img src={post.image} alt={post.title} className="h-full w-full object-cover" />
      ) : (
        <span>{post.image}</span>
      )}
      <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${CATEGORY_COLORS[post.category]}`}>
        {post.category}
      </span>
    </div>

    {/* Body */}
    <div className="flex flex-1 flex-col p-5">
      <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {new Date(post.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {post.readTime} min read</span>
        <span className="flex items-center gap-1"><User className="h-3 w-3" /> {post.author}</span>
      </div>

      <h3 className="mb-2 cursor-pointer font-serif text-lg font-bold text-foreground leading-snug hover:text-primary transition-colors line-clamp-2" onClick={onRead}>
        {post.title}
      </h3>
      <p className="text-sm text-muted-foreground line-clamp-3 flex-1">{post.excerpt}</p>

      {/* Tags */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {post.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-muted/60 px-2 py-0.5 text-[10px] text-muted-foreground">#{tag}</span>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onLike} className={`flex items-center gap-1 text-sm transition-colors ${liked ? "text-red-500" : "text-muted-foreground hover:text-red-400"}`}>
            <Heart className={`h-4 w-4 ${liked ? "fill-red-500" : ""}`} /> {post.likes + (liked ? 1 : 0)}
          </button>
          <button onClick={onRead} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
            <MessageCircle className="h-4 w-4" /> {post.comments.length}
          </button>
          <button onClick={onSave} className={`flex items-center gap-1 text-sm transition-colors ${saved ? "text-primary" : "text-muted-foreground hover:text-primary"}`}>
            <Bookmark className={`h-4 w-4 ${saved ? "fill-primary" : ""}`} />
          </button>
        </div>
        <Button variant="ghost" size="sm" className="text-primary text-xs gap-1" onClick={onRead}>
          Read More <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  </div>
);

/* ─── Blog Reader Modal ──────────────────────────────────────────── */
const BlogReader = ({
  post,
  onClose,
  liked,
  onLike,
}: {
  post: BlogPost;
  onClose: () => void;
  liked: boolean;
  onLike: () => void;
}) => {
  const [commentText, setCommentText] = useState("");
  const [localComments, setLocalComments] = useState<Comment[]>(post.comments);

  const submitComment = () => {
    if (!commentText.trim()) return;
    setLocalComments((c) => [...c, { id: Date.now().toString(), user: "You", text: commentText, date: new Date().toISOString().split("T")[0] }]);
    setCommentText("");
    toast.success("Comment posted!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 backdrop-blur-sm p-4 pt-10">
      <div className="relative w-full max-w-3xl rounded-2xl bg-card shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl bg-card border-b px-6 py-4">
          <button onClick={onClose} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </button>
          <div className="flex items-center gap-3">
            <button onClick={onLike} className={`flex items-center gap-1 text-sm transition-colors ${liked ? "text-red-500" : "text-muted-foreground hover:text-red-400"}`}>
              <Heart className={`h-4 w-4 ${liked ? "fill-red-500" : ""}`} /> {post.likes + (liked ? 1 : 0)}
            </button>
            <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }}
              className="text-muted-foreground hover:text-foreground transition-colors">
              <Share2 className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="rounded-full bg-muted p-1.5 hover:bg-muted/70 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Cover */}
        <div className="flex h-56 items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 text-8xl">
          {post.image}
        </div>

        {/* Content */}
        <div className="p-8">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${CATEGORY_COLORS[post.category]}`}>{post.category}</span>

          <h1 className="mt-4 font-serif text-2xl font-bold text-foreground md:text-3xl leading-tight">{post.title}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-b pb-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm">🧑‍🌾</div>
              <div>
                <p className="font-medium text-foreground flex items-center gap-1">{post.author} <BadgeCheck className="h-3.5 w-3.5 text-green-500" /></p>
                <p className="text-xs">{post.authorRole}</p>
              </div>
            </div>
            <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {new Date(post.date).toLocaleDateString("en-IN", { dateStyle: "long" })}</span>
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {post.readTime} min read</span>
          </div>

          {/* Article content */}
          <div className="space-y-3 text-sm text-foreground leading-relaxed">
            {post.content.split("\n\n").map((para, i) => {
              if (para.startsWith("**") && para.endsWith("**")) {
                return <h3 key={i} className="font-bold text-base text-foreground mt-4">{para.replace(/\*\*/g, "")}</h3>;
              }
              if (para.includes("**")) {
                return <p key={i} dangerouslySetInnerHTML={{ __html: para.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />;
              }
              if (para.startsWith("-")) {
                const items = para.split("\n").filter((l) => l.startsWith("-"));
                return <ul key={i} className="ml-4 space-y-1 list-disc text-muted-foreground">{items.map((it, j) => <li key={j}>{it.slice(2)}</li>)}</ul>;
              }
              if (para.includes("|")) {
                const rows = para.split("\n").filter((r) => r.includes("|") && !r.match(/^[\s|-]+$/));
                return (
                  <div key={i} className="overflow-x-auto rounded-lg border my-2">
                    <table className="w-full text-xs">
                      {rows.map((row, ri) => {
                        const cells = row.split("|").filter(Boolean).map((c) => c.trim());
                        return (
                          <tr key={ri} className={ri === 0 ? "bg-muted font-semibold" : "border-t"}>
                            {cells.map((cell, ci) => <td key={ci} className="px-3 py-2">{cell}</td>)}
                          </tr>
                        );
                      })}
                    </table>
                  </div>
                );
              }
              return <p key={i} className="text-muted-foreground">{para}</p>;
            })}
          </div>

          {/* Tags */}
          <div className="mt-6 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span key={tag} className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                <Tag className="h-3 w-3" /> #{tag}
              </span>
            ))}
          </div>

          {/* Comments */}
          <div className="mt-8 border-t pt-6">
            <h4 className="mb-4 font-semibold text-foreground flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" /> Comments ({localComments.length})
            </h4>

            {localComments.length === 0 ? (
              <p className="text-sm text-muted-foreground mb-4">No comments yet. Be the first!</p>
            ) : (
              <div className="space-y-3 mb-4">
                {localComments.map((c) => (
                  <div key={c.id} className="rounded-xl bg-muted/40 p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-foreground">{c.user}</span>
                      <span className="text-xs text-muted-foreground">{c.date}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{c.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Comment input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitComment()}
                placeholder="Write a comment…"
                className="flex-1 rounded-xl border bg-muted/20 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
              <Button variant="hero" size="sm" onClick={submitComment} disabled={!commentText.trim()}>Post</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Admin Panel ────────────────────────────────────────────────── */
const AdminBlogPanel = ({
  posts,
  onClose,
  onAdd,
  onDelete,
}: {
  posts: BlogPost[];
  onClose: () => void;
  onAdd: (p: Partial<BlogPost>) => void;
  onDelete: (id: string) => void;
}) => {
  const [form, setForm] = useState({ title: "", excerpt: "", category: "Farming Tips" as Category, image: "📰", author: "", authorRole: "", readTime: 5 });

  const submit = () => {
    if (!form.title || !form.excerpt || !form.author) { toast.error("Fill in all required fields"); return; }
    onAdd({ ...form, content: form.excerpt, tags: [], likes: 0, comments: [], date: new Date().toISOString().split("T")[0], published: true });
    setForm({ title: "", excerpt: "", category: "Farming Tips", image: "📰", author: "", authorRole: "", readTime: 5 });
    toast.success("Blog post added!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-card shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between bg-card border-b px-6 py-4 rounded-t-2xl z-10">
          <h2 className="font-semibold text-foreground text-lg">📝 Admin — Manage Blog Posts</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground hover:text-foreground" /></button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">Add New Post</p>
          {/* Form */}
          <div className="grid gap-3">
            <input className="rounded-lg border bg-muted/20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" placeholder="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <textarea className="rounded-lg border bg-muted/20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary resize-none" placeholder="Excerpt / short description *" rows={3} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <input className="rounded-lg border bg-muted/20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" placeholder="Author name *" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
              <input className="rounded-lg border bg-muted/20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" placeholder="Author role" value={form.authorRole} onChange={(e) => setForm({ ...form, authorRole: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select className="rounded-lg border bg-muted/20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Category })}>
                {CATEGORIES.filter((c) => c !== "All").map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input className="rounded-lg border bg-muted/20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" placeholder="Cover emoji (e.g. 🌾)" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
            </div>
          </div>
          <Button variant="hero" className="w-full gap-2" onClick={submit}><Plus className="h-4 w-4" /> Add Post</Button>

          {/* Existing posts */}
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-3">Existing Posts ({posts.length})</p>
            <div className="space-y-2">
              {posts.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl border bg-muted/20 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{p.image}</span>
                    <div>
                      <p className="text-sm font-medium text-foreground line-clamp-1">{p.title}</p>
                      <p className="text-xs text-muted-foreground">{p.author} · {p.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${CATEGORY_COLORS[p.category]}`}>{p.category}</span>
                    <button onClick={() => onDelete(p.id)} className="text-destructive hover:text-destructive/80 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Blog Page ─────────────────────────────────────────────── */
const Blog = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("All");
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [showAdmin, setShowAdmin] = useState(false);
  const [localPosts, setLocalPosts] = useState<BlogPost[]>(MOCK_POSTS);

  /* Try to load from Supabase, fall back to mock */
  const { data: dbPosts, isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  /* Merge DB posts (mapped) with local mock */
  const allPosts: BlogPost[] = useMemo(() => {
    const dbMapped: BlogPost[] = (dbPosts || []).map((p: any) => ({
      id: p.id,
      title: p.title,
      excerpt: p.excerpt || "",
      content: p.content || p.excerpt || "",
      image: p.image_url || "📰",
      author: p.author_name || "Admin",
      authorRole: "Farm2Home Team",
      date: p.created_at?.split("T")[0] ?? new Date().toISOString().split("T")[0],
      readTime: 5,
      category: (p.category as Category) || "Farming Tips",
      tags: p.tags || [],
      likes: p.likes || 0,
      comments: [],
      published: true,
    }));
    return [...dbMapped, ...localPosts];
  }, [dbPosts, localPosts]);

  const filtered = useMemo(() =>
    allPosts.filter((p) => {
      if (category !== "All" && p.category !== category) return false;
      if (search && !p.title.toLowerCase().includes(search.toLowerCase()) &&
          !p.author.toLowerCase().includes(search.toLowerCase()) &&
          !p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))) return false;
      return true;
    }),
  [allPosts, category, search]);

  const featured = filtered[0];
  const rest = filtered.slice(1);

  const toggleLike = (id: string) => setLikedIds((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSave = (id: string) => { setSavedIds((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }); toast(savedIds.has(id) ? "Removed from saved" : "Saved!"); };
  const addPost = (p: Partial<BlogPost>) => setLocalPosts((prev) => [{ ...p, id: Date.now().toString() } as BlogPost, ...prev]);
  const deletePost = (id: string) => { setLocalPosts((prev) => prev.filter((p) => p.id !== id)); toast.success("Post deleted"); };

  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <div className="hero-gradient py-14">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-serif text-3xl font-bold text-primary-foreground md:text-4xl">📰 Farm2Home Blog</h1>
              <p className="mt-1 text-primary-foreground/80">Farming tips, crop management, market insights & seasonal guides</p>
            </div>
            <Button variant="gold" size="sm" className="gap-2" onClick={() => setShowAdmin(true)}>
              <Pencil className="h-4 w-4" /> Admin Panel
            </Button>
          </div>

          {/* Search */}
          <div className="mt-6 flex items-center gap-2 rounded-xl bg-background/15 backdrop-blur-sm border border-white/20 px-4 py-2.5 max-w-xl">
            <Search className="h-4 w-4 text-primary-foreground/60 shrink-0" />
            <input
              type="text"
              placeholder="Search tips, crops, market trends…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-primary-foreground placeholder:text-primary-foreground/50 outline-none"
            />
            {search && <button onClick={() => setSearch("")}><X className="h-4 w-4 text-primary-foreground/50 hover:text-primary-foreground" /></button>}
          </div>

          {/* Category pills */}
          <div className="mt-4 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCategory(c)}
                className={`rounded-full px-4 py-1 text-sm font-medium capitalize transition-all ${
                  category === c ? "bg-white text-primary shadow-md" : "bg-white/15 text-primary-foreground hover:bg-white/25"
                }`}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="container mx-auto px-4 py-10">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-lg font-semibold text-foreground">No posts found</p>
            <p className="text-sm text-muted-foreground mt-1">Try a different search or category</p>
          </div>
        ) : (
          <>
            {/* Featured post */}
            {featured && (
              <div className="mb-10 group overflow-hidden rounded-2xl border bg-card shadow-sm cursor-pointer transition-all hover:shadow-xl" onClick={() => setSelectedPost(featured)}>
                <div className="grid md:grid-cols-2">
                  <div className="flex h-64 md:h-auto items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 text-9xl">
                    {featured.image}
                  </div>
                  <div className="flex flex-col justify-center p-8">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold w-fit ${CATEGORY_COLORS[featured.category]}`}>{featured.category}</span>
                    <h2 className="mt-3 font-serif text-2xl font-bold text-foreground leading-tight md:text-3xl">{featured.title}</h2>
                    <p className="mt-3 text-muted-foreground text-sm line-clamp-3">{featured.excerpt}</p>
                    <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><User className="h-3 w-3" /> {featured.author}</span>
                      <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {new Date(featured.date).toLocaleDateString("en-IN")}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {featured.readTime} min</span>
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <Button variant="hero" size="sm" className="gap-1.5">Read Article <ChevronRight className="h-3.5 w-3.5" /></Button>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Heart className="h-4 w-4" /> {featured.likes + (likedIds.has(featured.id) ? 1 : 0)}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <TrendingUp className="h-4 w-4" /> Trending
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Grid */}
            {rest.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((post) => (
                  <BlogCard
                    key={post.id}
                    post={post}
                    onRead={() => setSelectedPost(post)}
                    onLike={() => toggleLike(post.id)}
                    liked={likedIds.has(post.id)}
                    saved={savedIds.has(post.id)}
                    onSave={() => toggleSave(post.id)}
                  />
                ))}
              </div>
            )}

            {/* Stats bar */}
            <div className="mt-12 rounded-2xl bg-muted/40 border p-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {[
                { label: "Articles Published", value: allPosts.length, icon: "📰" },
                { label: "Total Likes", value: allPosts.reduce((s, p) => s + p.likes, 0), icon: "❤️" },
                { label: "Comments", value: allPosts.reduce((s, p) => s + p.comments.length, 0), icon: "💬" },
                { label: "Categories", value: CATEGORIES.length - 1, icon: "🗂️" },
              ].map(({ label, value, icon }) => (
                <div key={label}>
                  <p className="text-2xl">{icon}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Blog Reader Modal */}
      {selectedPost && (
        <BlogReader
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          liked={likedIds.has(selectedPost.id)}
          onLike={() => toggleLike(selectedPost.id)}
        />
      )}

      {/* Admin Modal */}
      {showAdmin && (
        <AdminBlogPanel
          posts={localPosts}
          onClose={() => setShowAdmin(false)}
          onAdd={addPost}
          onDelete={deletePost}
        />
      )}
    </div>
  );
};

export default Blog;
