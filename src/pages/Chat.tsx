import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, Phone, MoreVertical, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const Chat = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);

  const { data: conversations = [], isLoading: isLoadingConv } = useQuery({
    queryKey: ["chat-conversations", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("chat_conversations")
        .select("*")
        .or(`buyer_id.eq.${user.id},farmer_id.eq.${user.id}`);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: dbMessages = [], isLoading: isLoadingMsg } = useQuery({
    queryKey: ["chat-messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!conversationId,
  });

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `conversation_id=eq.${conversationId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["chat-messages", conversationId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId, queryClient]);

  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!input.trim() || !user || !conversationId) return;
      const { error } = await supabase.from("chat_messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        text: input,
        message_type: "text",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setInput("");
      queryClient.invalidateQueries({ queryKey: ["chat-messages", conversationId] });
    },
  });

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Please log in to chat.</p>
        <Link to="/login"><Button variant="hero">Login</Button></Link>
      </div>
    );
  }

  // Strict evaluation
  const messages = (dbMessages || []).map((m: any) => ({
    id: m.id,
    sender: m.sender_id === user?.id ? "me" : "them",
    text: m.text || "",
    time: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    type: m.message_type,
    offerPrice: m.offer_price,
  }));

  return (
    <div className="flex h-[calc(100vh-65px)] flex-col">
      <div className="border-b bg-card px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/marketplace"><ArrowLeft className="h-5 w-5 text-muted-foreground" /></Link>
            <div className="text-3xl">👨‍🌾</div>
            <div>
              <h3 className="font-semibold text-foreground">Chat</h3>
              <p className="text-xs text-primary">{conversations.length > 0 ? "Connected" : "No active conversation"}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon"><Phone className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5" /></Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-muted/20 p-4">
        <div className="container mx-auto max-w-2xl space-y-3">
          {isLoadingMsg ? (
            <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : messages.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">No messages. Choose a farmer in Marketplace to start chatting.</div>
          ) : (
            messages.map((msg: any) => (
               <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                     msg.sender === "me" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-card border text-foreground rounded-bl-md"
                  }`}>
                     {msg.type === "offer" ? (
                        <div className="text-center">
                           <p className="text-xs opacity-80 mb-1">Price Offer</p>
                           <p className="text-2xl font-bold">₹{msg.offerPrice}/kg</p>
                           <div className="mt-2 flex gap-2">
                              <Button size="sm" variant="gold" className="text-xs h-7">Accept</Button>
                              <Button size="sm" variant="outline" className="text-xs h-7 border-primary-foreground/30">Counter</Button>
                           </div>
                        </div>
                     ) : (
                        <p className="text-sm">{msg.text}</p>
                     )}
                     <p className={`mt-1 text-[10px] ${msg.sender === "me" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{msg.time}</p>
                  </div>
               </div>
            ))
          )}
        </div>
      </div>

      <div className="border-t bg-card px-4 py-3">
        <div className="container mx-auto flex max-w-2xl gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (conversationId ? sendMessage.mutate() : null)}
            placeholder="Type a message or make an offer..."
            className="flex-1 rounded-full border bg-muted/50 px-4 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
            disabled={!conversationId}
          />
          <Button variant="hero" size="icon" className="rounded-full" onClick={() => conversationId ? sendMessage.mutate() : null} disabled={!conversationId}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
