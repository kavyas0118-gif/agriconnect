import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "./ui/button";

const generateBotResponse = (msg: string) => {
  const lowerMsg = msg.toLowerCase();
  if (lowerMsg.includes("order") || lowerMsg.includes("delivery")) {
    return "Once you place an order, the farmer gets notified. You can track your delivery under the 'Orders' page live on Google Maps!";
  } else if (lowerMsg.includes("price") || lowerMsg.includes("cost")) {
    return "Our prices are set directly by the farmers so they get a fair deal. You can check the 'Price Transparency' page to compare with local markets.";
  } else if (lowerMsg.includes("organic")) {
    return "Most of our farmers use organic practices! Check their respective badges on the Marketplace.";
  } else if (lowerMsg.includes("hello") || lowerMsg.includes("hi")) {
    return "Hi there! I am the FARM2HOME Assistant. How can I help you today?";
  }
  return "Thanks for reaching out! To learn more, check out our Marketplace or drop us an email on support@farm2home.in.";
};

const Chatbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{sender: "user" | "bot", text: string}[]>([
    { sender: "bot", text: "Welcome to FARM2HOME! Need help with fresh produce?" }
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { sender: "user", text: input }]);
    const response = generateBotResponse(input);
    setInput("");
    setTimeout(() => {
      setMessages(prev => [...prev, { sender: "bot", text: response }]);
    }, 600);
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform z-50 animate-fade-up"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 w-80 sm:w-96 rounded-2xl bg-card border shadow-xl flex flex-col overflow-hidden z-50 animate-fade-up">
          <div className="bg-primary px-4 py-3 flex justify-between items-center text-primary-foreground">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <span className="font-semibold">FARM2HOME Assistant</span>
            </div>
            <button onClick={() => setOpen(false)} className="hover:bg-primary-foreground/20 p-1 rounded-md">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 p-4 h-80 overflow-y-auto space-y-4 bg-muted/20 flex flex-col">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`text-sm px-3 py-2 rounded-xl max-w-[80%] shadow-sm ${msg.sender === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border text-foreground rounded-bl-sm"}`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t bg-card flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask anything..."
              className="flex-1 border rounded-full px-4 text-sm focus:outline-none focus:border-primary bg-muted/30"
            />
            <Button size="icon" className="rounded-full" onClick={handleSend}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
