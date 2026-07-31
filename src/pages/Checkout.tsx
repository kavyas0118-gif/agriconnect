import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Smartphone, Truck, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import LocationTracker from "@/components/LocationTracker";

const paymentMethods = [
  { id: "upi", label: "UPI", icon: Smartphone, desc: "Google Pay, PhonePe, Paytm" },
  { id: "card", label: "Card", icon: CreditCard, desc: "Credit / Debit Card" },
  { id: "cod", label: "COD", icon: Truck, desc: "Cash on Delivery" },
];

const Checkout = () => {
  const { items, total, totalSavings, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [payment, setPayment] = useState("upi");
  const [placed, setPlaced] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [address, setAddress] = useState({ name: "", phone: "", line1: "", city: "", pincode: "" });

  const handlePlaceOrder = async () => {
    if (!user) { navigate("/login"); return; }
    if (!address.line1 || !address.city) { toast.error("Please fill delivery address"); return; }
    setSubmitting(true);
    try {
      const deliveryAddr = `${address.name}, ${address.line1}, ${address.city} ${address.pincode}`;
      // Group items by farmer
      const farmerGroups = items.reduce((acc, item) => {
        const fid = item.product.farmer.id;
        if (!acc[fid]) acc[fid] = [];
        acc[fid].push(item);
        return acc;
      }, {} as Record<string, typeof items>);

      for (const [farmerId, farmerItems] of Object.entries(farmerGroups)) {
        const orderTotal = farmerItems.reduce((s, i) => s + i.product.price * i.quantity, 0);
        const { data: order, error } = await supabase.from("orders").insert({
          buyer_id: user.id,
          farmer_id: farmerId,
          total_amount: orderTotal,
          delivery_address: deliveryAddr,
          payment_method: payment,
        }).select().single();
        if (error) throw error;

        const orderItems = farmerItems.map(i => ({
          order_id: order.id,
          product_id: i.product.id,
          quantity: i.quantity,
          price_at_purchase: i.product.price,
        }));
        const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
        if (itemsError) throw itemsError;
      }

      // Simulate EmailJS order confirmation
      toast.info("Preparing order confirmation email...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Order confirmation email sent successfully via EmailJS Mock!");

      clearCart();
      setPlaced(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  if (placed) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full hero-gradient animate-fade-up">
          <CheckCircle className="h-10 w-10 text-primary-foreground" />
        </div>
        <h2 className="font-serif text-3xl font-bold text-foreground">Order Placed!</h2>
        <p className="text-muted-foreground">Your fresh produce is on its way from the farm.</p>
        <p className="text-sm text-primary font-medium">You saved ₹{totalSavings} by buying direct!</p>
        <div className="bg-primary/10 p-3 rounded-lg text-sm border border-primary/20 text-primary-foreground animate-pulse my-2 shadow-sm">
           📧 We've sent an order confirmation & live tracking link to your registered email!
        </div>
        <Link to="/orders"><Button variant="hero">Track Order</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 font-serif text-2xl font-bold text-foreground md:text-3xl">Checkout</h1>
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="flex-1 space-y-6">
            <div className="rounded-xl border bg-card p-6 card-shadow">
              <h3 className="mb-4 font-semibold text-foreground">Delivery Address</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <input placeholder="Full Name" value={address.name} onChange={e => setAddress(a => ({ ...a, name: e.target.value }))} className="rounded-lg border bg-muted/30 px-4 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" />
                <input placeholder="Phone Number" value={address.phone} onChange={e => setAddress(a => ({ ...a, phone: e.target.value }))} className="rounded-lg border bg-muted/30 px-4 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" />
                <input placeholder="Address Line 1" value={address.line1} onChange={e => setAddress(a => ({ ...a, line1: e.target.value }))} className="rounded-lg border bg-muted/30 px-4 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 sm:col-span-2" />
                <input placeholder="City" value={address.city} onChange={e => setAddress(a => ({ ...a, city: e.target.value }))} className="rounded-lg border bg-muted/30 px-4 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" />
                <input placeholder="Pincode" value={address.pincode} onChange={e => setAddress(a => ({ ...a, pincode: e.target.value }))} className="rounded-lg border bg-muted/30 px-4 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-3">Verify Location on Map</h4>
                <LocationTracker showMap={true} autoRequest={false} />
              </div>
            </div>

            <div className="rounded-xl border bg-card p-6 card-shadow">
              <h3 className="mb-4 font-semibold text-foreground">Payment Method</h3>
              <div className="space-y-3">
                {paymentMethods.map(({ id, label, icon: Icon, desc }) => (
                  <label key={id} className={`flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors ${payment === id ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
                    <input type="radio" name="payment" value={id} checked={payment === id} onChange={() => setPayment(id)} className="accent-primary" />
                    <Icon className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full lg:w-80">
            <div className="sticky top-24 rounded-xl border bg-card p-6 card-shadow">
              <h3 className="mb-4 font-serif text-lg font-semibold text-foreground">Order Summary</h3>
              <div className="space-y-2 text-sm mb-4">
                {items.map(({ product, quantity }) => (
                  <div key={product.id} className="flex justify-between text-foreground">
                    <span>{product.image} {product.name} × {quantity}</span>
                    <span>₹{product.price * quantity}</span>
                  </div>
                ))}
                <hr />
                <div className="flex justify-between text-foreground"><span>Subtotal</span><span>₹{total}</span></div>
                <div className="flex justify-between text-primary"><span>Savings</span><span>-₹{totalSavings}</span></div>
                <div className="flex justify-between text-foreground"><span>Delivery</span><span>₹49</span></div>
                <hr />
                <div className="flex justify-between text-lg font-bold text-foreground"><span>Total</span><span>₹{total + 49}</span></div>
              </div>
              <Button variant="hero" className="w-full" size="lg" onClick={handlePlaceOrder} disabled={submitting}>
                {submitting ? "Placing..." : `Place Order • ₹${total + 49}`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
