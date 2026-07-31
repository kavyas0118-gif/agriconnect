import { Leaf } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t bg-muted/50 py-12">
    <div className="container mx-auto px-4">
      <div className="grid gap-8 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg hero-gradient">
              <Leaf className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-serif text-lg font-bold">FARM2HOME</span>
          </div>
          <p className="text-sm text-muted-foreground">Connecting farmers directly to your table. Fresh, affordable, transparent.</p>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-foreground">Quick Links</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <Link to="/marketplace" className="hover:text-foreground transition-colors">Marketplace</Link>
            <Link to="/price-transparency" className="hover:text-foreground transition-colors">Price Transparency</Link>
            <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-foreground">For Farmers</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <Link to="/farmer-dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
            <Link to="/login" className="hover:text-foreground transition-colors">Register</Link>
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-foreground">Contact</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <span>support@farm2home.in</span>
            <span>+91 98765 43210</span>
          </div>
        </div>
      </div>
      <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
        © 2026 FARM2HOME. Built with ❤️ for Indian Farmers.
      </div>
    </div>
  </footer>
);

export default Footer;
