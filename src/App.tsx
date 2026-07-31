import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Chatbot from "@/components/Chatbot";
import Index from "./pages/Index";
import Marketplace from "./pages/Marketplace";
import FarmerDashboard from "./pages/FarmerDashboard";
import Orders from "./pages/Orders";
import Chat from "./pages/Chat";
import PriceTransparency from "./pages/PriceTransparency";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import Blog from "./pages/Blog";
import Reviews from "./pages/Reviews";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Navbar />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/farmer-dashboard" element={<FarmerDashboard />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/price-transparency" element={<PriceTransparency />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/login" element={<Login />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/reviews" element={<Reviews />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Footer />
              <Chatbot />
            </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
