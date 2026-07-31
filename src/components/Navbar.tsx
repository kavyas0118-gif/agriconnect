import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, Menu, X, Leaf, LogOut, User, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useState } from "react";

const Navbar = () => {
  const { itemCount } = useCart();
  const { user, role, profile, signOut } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const navLinks = [
    { to: "/", label: t("home") },
    { to: "/marketplace", label: t("marketplace") },
    ...(role === "farmer" ? [{ to: "/farmer-dashboard", label: t("dashboard") }] : []),
    ...(user ? [{ to: "/orders", label: t("orders") }] : []),
    ...(user ? [{ to: "/chat", label: t("chat") }] : []),
    { to: "/price-transparency", label: t("prices") },
    { to: "/reviews", label: t("reviews") },
    { to: "/blog", label: t("blog") },
    ...(role === "admin" ? [{ to: "/admin", label: t("admin") }] : []),
  ];

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg hero-gradient">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-serif text-xl font-bold text-foreground">FARM2HOME</span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted ${
                location.pathname === link.to ? "bg-muted text-foreground" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button
            id="language-toggle"
            onClick={() => setLang(lang === "en" ? "te" : "en")}
            title={t("languageLabel")}
            className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
          >
            <Globe className="h-3.5 w-3.5" />
            {lang === "en" ? "తె" : "EN"}
          </button>

          <Link to="/cart" className="relative">
            <Button variant="ghost" size="icon">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {itemCount}
                </span>
              )}
            </Button>
          </Link>
          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden text-sm text-muted-foreground md:block">
                <User className="mr-1 inline h-4 w-4" />
                {profile?.full_name || user.email?.split("@")[0]}
              </span>
              <Button variant="ghost" size="sm" onClick={signOut} title={t("logout")}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Link to="/login">
              <Button variant="hero" size="sm">{t("login")}</Button>
            </Link>
          )}
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(!open)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t bg-background px-4 py-2 lg:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
