import { useState } from "react";
import { ArrowLeft, Radio, Users, Eye, Coins, Heart, MessageCircle, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import BottomNav from "@/components/BottomNav";
import { motion, AnimatePresence } from "framer-motion";

interface Stream {
  id: string;
  username: string;
  avatarUrl: string;
  title: string;
  thumbnailUrl: string;
  viewers: number;
  isLive: boolean;
}

const mockStreams: Stream[] = [
  {
    id: "1",
    username: "vector_x",
    avatarUrl: "https://picsum.photos/id/64/100/100",
    title: "Late Night Vibes 🌙 Come hang!",
    thumbnailUrl: "https://picsum.photos/id/37/600/400",
    viewers: 342,
    isLive: true,
  },
  {
    id: "2",
    username: "elara.thorne",
    avatarUrl: "https://picsum.photos/id/65/100/100",
    title: "Art Stream - Painting Session 🎨",
    thumbnailUrl: "https://picsum.photos/id/48/600/400",
    viewers: 128,
    isLive: true,
  },
  {
    id: "3",
    username: "drift.culture",
    avatarUrl: "https://picsum.photos/id/66/100/100",
    title: "Music Production Live 🎵",
    thumbnailUrl: "https://picsum.photos/id/29/600/400",
    viewers: 567,
    isLive: true,
  },
];

const LivePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeStream, setActiveStream] = useState<Stream | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [coinAmount, setCoinAmount] = useState<number | null>(null);
  const [showCoinMenu, setShowCoinMenu] = useState(false);

  const coinOptions = [10, 50, 100, 500, 1000];

  const [chatMessages, setChatMessages] = useState([
    { user: "fan_001", text: "Amazing stream! 🔥", coins: 0 },
    { user: "gold_vip", text: "Sent 100 JagX Coins!", coins: 100 },
    { user: "viewer_23", text: "Keep going!", coins: 0 },
  ]);

  const sendMessage = () => {
    if (!chatMessage.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      { user: "you", text: chatMessage, coins: coinAmount || 0 },
    ]);
    setChatMessage("");
    setCoinAmount(null);
  };

  if (activeStream) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {/* Stream view */}
        <div className="relative aspect-video bg-surface">
          <img
            src={activeStream.thumbnailUrl}
            alt="Stream"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/40" />

          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-3">
            <button onClick={() => setActiveStream(null)} className="text-foreground">
              <ArrowLeft className="size-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 rounded-full bg-destructive/90 flex items-center gap-1.5">
                <div className="size-1.5 rounded-full bg-foreground animate-pulse" />
                <span className="text-[10px] font-bold text-foreground uppercase">Live</span>
              </div>
              <div className="px-2 py-1 rounded-full glass flex items-center gap-1.5">
                <Eye className="size-3" />
                <span className="text-[10px] font-bold">{activeStream.viewers}</span>
              </div>
            </div>
          </div>

          {/* Streamer info */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <img
              src={activeStream.avatarUrl}
              alt={activeStream.username}
              className="size-8 rounded-full border border-primary/30"
            />
            <div>
              <p className="text-xs font-semibold text-champagne">{activeStream.username}</p>
              <p className="text-[10px] text-muted-foreground">{activeStream.title}</p>
            </div>
          </div>
        </div>

        {/* Chat */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {chatMessages.map((msg, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-xs font-semibold text-gold shrink-0">{msg.user}</span>
                <span className="text-xs text-foreground/80">{msg.text}</span>
                {msg.coins > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full gold-gradient text-primary-foreground font-bold shrink-0">
                    🪙 {msg.coins}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Coin tip menu */}
          <AnimatePresence>
            {showCoinMenu && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-border/30"
              >
                <div className="flex items-center gap-2 p-3 overflow-x-auto no-scrollbar">
                  {coinOptions.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => {
                        setCoinAmount(amount);
                        setShowCoinMenu(false);
                      }}
                      className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                        coinAmount === amount
                          ? "gold-gradient border-primary text-primary-foreground"
                          : "bg-surface border-border text-foreground"
                      }`}
                    >
                      🪙 {amount}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat input */}
          <div className="flex items-center gap-2 p-3 border-t border-border/30">
            <button
              onClick={() => setShowCoinMenu(!showCoinMenu)}
              className={`shrink-0 size-10 rounded-xl flex items-center justify-center ${
                coinAmount ? "gold-gradient text-primary-foreground" : "bg-surface border border-border text-gold"
              }`}
            >
              <Coins className="size-5" />
            </button>
            {coinAmount && (
              <span className="shrink-0 text-[10px] px-2 py-1 rounded-full gold-gradient text-primary-foreground font-bold">
                🪙 {coinAmount}
              </span>
            )}
            <input
              type="text"
              placeholder="Say something..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              className="flex-1 px-3 py-2 rounded-xl bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <button
              onClick={sendMessage}
              className="shrink-0 size-10 rounded-xl gold-gradient flex items-center justify-center text-primary-foreground"
            >
              <Send className="size-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="font-display italic text-xl text-gold">Live</h1>
          {user && (
            <button className="px-4 py-1.5 rounded-lg gold-gradient text-primary-foreground text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <Radio className="size-3" /> Go Live
            </button>
          )}
        </div>
      </header>

      <div className="p-4 space-y-4">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Live Now · {mockStreams.length} streams
        </p>

        {mockStreams.map((stream) => (
          <button
            key={stream.id}
            onClick={() => setActiveStream(stream)}
            className="w-full rounded-xl overflow-hidden bg-surface border border-border/30 text-left"
          >
            <div className="relative aspect-video">
              <img
                src={stream.thumbnailUrl}
                alt={stream.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent" />
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <div className="px-2 py-1 rounded-full bg-destructive/90 flex items-center gap-1.5">
                  <div className="size-1.5 rounded-full bg-foreground animate-pulse" />
                  <span className="text-[10px] font-bold text-foreground uppercase">Live</span>
                </div>
                <div className="px-2 py-1 rounded-full glass flex items-center gap-1.5">
                  <Eye className="size-3" />
                  <span className="text-[10px] font-bold">{stream.viewers}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3">
              <img
                src={stream.avatarUrl}
                alt={stream.username}
                className="size-9 rounded-full border border-primary/30"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-champagne truncate">{stream.username}</p>
                <p className="text-xs text-muted-foreground truncate">{stream.title}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

export default LivePage;
