import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingBag, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";

const Cart = () => {
  const { items, removeFromCart, updateQuantity, total, totalSavings, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <ShoppingBag className="h-16 w-16 text-muted-foreground" />
        <h2 className="font-serif text-2xl font-bold text-foreground">Your Cart is Empty</h2>
        <p className="text-muted-foreground">Start shopping from our fresh marketplace</p>
        <Link to="/marketplace"><Button variant="hero">Browse Products</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 font-serif text-2xl font-bold text-foreground md:text-3xl">Shopping Cart</h1>
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="flex-1 space-y-4">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex items-center gap-4 rounded-xl border bg-card p-4 card-shadow">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted text-3xl">{product.image}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">{product.farmer.name}</p>
                  <p className="mt-1 font-bold text-foreground">₹{product.price}/{product.unit}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(product.id, quantity - 1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center font-medium text-foreground">{quantity}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(product.id, quantity + 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground">₹{product.price * quantity}</p>
                  <button onClick={() => removeFromCart(product.id)} className="text-xs text-destructive hover:underline">Remove</button>
                </div>
              </div>
            ))}
          </div>

          <div className="w-full lg:w-80">
            <div className="sticky top-24 rounded-xl border bg-card p-6 card-shadow">
              <h3 className="mb-4 font-serif text-lg font-semibold text-foreground">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-foreground"><span>Subtotal</span><span>₹{total}</span></div>
                <div className="flex justify-between text-primary"><span>Savings</span><span>-₹{totalSavings}</span></div>
                <div className="flex justify-between text-foreground"><span>Delivery</span><span>₹49</span></div>
                <hr className="my-2" />
                <div className="flex justify-between text-lg font-bold text-foreground"><span>Total</span><span>₹{total + 49}</span></div>
              </div>
              <Link to="/checkout">
                <Button variant="hero" className="mt-4 w-full" size="lg">
                  <CreditCard className="mr-2 h-4 w-4" /> Proceed to Checkout
                </Button>
              </Link>
              <Button variant="ghost" className="mt-2 w-full text-sm text-muted-foreground" onClick={clearCart}>Clear Cart</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
