import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const Reviews = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newReview, setNewReview] = useState("");
  const [newRating, setNewRating] = useState(5);

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*, products:product_id(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const submitReview = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Please log in");
      if (!newReview.trim()) throw new Error("Please write a review");
      const { error } = await supabase.from("reviews").insert({
        reviewer_id: user.id,
        rating: newRating,
        comment: newReview,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Review submitted!");
      setNewReview("");
      setNewRating(5);
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="hero-gradient py-8">
        <div className="container mx-auto px-4">
          <h1 className="font-serif text-2xl font-bold text-primary-foreground md:text-3xl">Reviews & Ratings</h1>
          <p className="text-primary-foreground/80">See what our community says about FARM2HOME</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-card p-6 card-shadow text-center">
            <p className="text-4xl font-bold text-foreground">{avgRating}</p>
            <div className="flex justify-center gap-0.5 my-2">
              {[1,2,3,4,5].map(i => <Star key={i} className={`h-5 w-5 ${i <= Math.round(Number(avgRating)) ? "fill-farm-gold text-farm-gold" : "text-farm-gold"}`} />)}
            </div>
            <p className="text-sm text-muted-foreground">Average Rating</p>
          </div>
          <div className="rounded-xl border bg-card p-6 card-shadow text-center">
            <p className="text-4xl font-bold text-foreground">{reviews.length}</p>
            <p className="text-sm text-muted-foreground mt-2">Total Reviews</p>
          </div>
          <div className="rounded-xl border bg-card p-6 card-shadow text-center">
            <p className="text-4xl font-bold text-foreground">
              {reviews.length > 0 ? Math.round((reviews.filter((r: any) => r.rating >= 4).length / reviews.length) * 100) : 0}%
            </p>
            <p className="text-sm text-muted-foreground mt-2">Satisfaction Rate</p>
          </div>
        </div>

        {user && (
          <div className="mb-8 rounded-xl border bg-card p-6 card-shadow">
            <h3 className="font-serif text-lg font-semibold text-foreground mb-4">Write a Review</h3>
            <div className="flex gap-1 mb-3">
              {[1,2,3,4,5].map(i => (
                <button key={i} onClick={() => setNewRating(i)}>
                  <Star className={`h-6 w-6 ${i <= newRating ? "fill-farm-gold text-farm-gold" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>
            <textarea
              value={newReview}
              onChange={(e) => setNewReview(e.target.value)}
              placeholder="Share your experience..."
              className="w-full rounded-lg border bg-muted/30 px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 mb-3 min-h-[80px]"
            />
            <Button variant="hero" size="sm" onClick={() => submitReview.mutate()} disabled={submitReview.isPending}>
              {submitReview.isPending ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        )}

        <div className="space-y-4">
          {reviews.map((review: any) => (
            <div key={review.id} className="rounded-xl border bg-card p-6 card-shadow">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-foreground">{review.profiles?.full_name || "Anonymous"}</h4>
                  <p className="text-xs text-muted-foreground">
                    {review.products?.name ? `on ${review.products.name} • ` : ""}
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className={`h-4 w-4 ${i <= review.rating ? "fill-farm-gold text-farm-gold" : "text-muted-foreground"}`} />
                  ))}
                </div>
              </div>
              <p className="text-sm text-foreground">{review.comment}</p>
            </div>
          ))}
          {reviews.length === 0 && (
            <div className="py-20 text-center text-muted-foreground">No reviews yet. Be the first!</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reviews;
