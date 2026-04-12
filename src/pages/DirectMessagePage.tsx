import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowLeft, Send, Phone, Video, MoreVertical, Bot, Image } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  message_type: string;
  is_read: boolean;
  created_at: string;
}

interface UserProfile {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  is_verified: boolean;
}

interface Presence {
  is_online: boolean;
  last_seen: string;
  is_typing: boolean;
}

const DirectMessagePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [presence, setPresence] = useState<Presence | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<NodeJS.Timeout>();

  // Load other user profile
  useEffect(() => {
    if (!userId) return;
    supabase.from("profiles").select("user_id, username, display_name, avatar_url, is_verified").eq("user_id", userId).single()
      .then(({ data }) => { if (data) setOtherUser(data); });
  }, [userId]);

  // Load presence
  useEffect(() => {
    if (!userId) return;
    supabase.from("user_presence").select("is_online, last_seen, is_typing").eq("user_id", userId).single()
      .then(({ data }) => { if (data) setPresence(data); });

    const channel = supabase.channel(`presence-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "user_presence", filter: `user_id=eq.${userId}` },
        (payload: any) => {
          if (payload.new) setPresence({ is_online: payload.new.is_online, last_seen: payload.new.last_seen, is_typing: payload.new.is_typing });
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // Load messages
  useEffect(() => {
    if (!user || !userId) return;
    const loadMessages = async () => {
      const { data } = await supabase.from("messages").select("*")
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
      // Mark unread as read
      await supabase.from("messages").update({ is_read: true }).eq("sender_id", userId).eq("receiver_id", user.id).eq("is_read", false);
    };
    loadMessages();

    const channel = supabase.channel(`dm-${user.id}-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" },
        (payload: any) => {
          const msg = payload.new as Message;
          if ((msg.sender_id === user.id && msg.receiver_id === userId) || (msg.sender_id === userId && msg.receiver_id === user.id)) {
            setMessages(prev => [...prev, msg]);
            if (msg.sender_id === userId) {
              supabase.from("messages").update({ is_read: true }).eq("id", msg.id);
            }
          }
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, userId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Update typing status
  const handleTyping = useCallback(() => {
    if (!user) return;
    supabase.from("user_presence").upsert({ user_id: user.id, is_typing: true, typing_to: userId, is_online: true, last_seen: new Date().toISOString() }, { onConflict: "user_id" });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      supabase.from("user_presence").upsert({ user_id: user.id, is_typing: false, typing_to: null, is_online: true, last_seen: new Date().toISOString() }, { onConflict: "user_id" });
    }, 2000);
  }, [user, userId]);

  const sendMessage = async () => {
    if (!input.trim() || !user || !userId) return;
    const content = input.trim();
    setInput("");
    const { error } = await supabase.from("messages").insert({ sender_id: user.id, receiver_id: userId, content, message_type: "text" });
    if (error) toast.error("Failed to send message");
    // Stop typing
    supabase.from("user_presence").upsert({ user_id: user.id, is_typing: false, typing_to: null, is_online: true, last_seen: new Date().toISOString() }, { onConflict: "user_id" });
  };

  const blockUser = async () => {
    if (!user || !userId) return;
    const { error } = await supabase.from("blocked_users").insert({ blocker_id: user.id, blocked_id: userId });
    if (error) toast.error("Failed to block user");
    else { toast.success("User blocked"); navigate("/chat"); }
  };

  const formatLastSeen = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return d.toLocaleDateString();
  };

  const getStatusText = () => {
    if (presence?.is_typing) return "typing...";
    if (presence?.is_online) return "Online";
    if (presence?.last_seen) return `Last seen ${formatLastSeen(presence.last_seen)}`;
    return "Offline";
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/chat")} className="text-foreground"><ArrowLeft className="size-5" /></button>
            <button onClick={() => navigate(`/user/${userId}`)} className="flex items-center gap-3">
              <div className="relative">
                <div className="size-9 rounded-full bg-surface border border-border overflow-hidden">
                  {otherUser?.avatar_url ? <img src={otherUser.avatar_url} className="w-full h-full object-cover" /> :
                    <div className="w-full h-full flex items-center justify-center text-gold font-display italic text-sm">
                      {(otherUser?.username || "U")[0].toUpperCase()}
                    </div>}
                </div>
                {presence?.is_online && <div className="absolute bottom-0 right-0 size-2.5 rounded-full bg-green-500 border-2 border-background" />}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold text-champagne">{otherUser?.display_name || otherUser?.username || "User"}</span>
                  {otherUser?.is_verified && <span className="text-gold text-xs">✓</span>}
                </div>
                <p className={`text-[10px] ${presence?.is_typing ? "text-gold" : "text-muted-foreground"}`}>{getStatusText()}</p>
              </div>
            </button>
          </div>
          <div className="flex items-center gap-3 relative">
            <button className="text-foreground"><Phone className="size-4" /></button>
            <button className="text-foreground"><Video className="size-4" /></button>
            <button onClick={() => setShowMenu(!showMenu)} className="text-foreground"><MoreVertical className="size-4" /></button>
            {showMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 rounded-xl bg-surface border border-border/30 shadow-xl overflow-hidden z-50">
                <button onClick={() => navigate(`/user/${userId}`)} className="w-full px-4 py-3 text-left text-sm text-foreground hover:bg-surface-elevated transition-colors">View Profile</button>
                <button onClick={blockUser} className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-surface-elevated transition-colors">Block User</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 pb-20">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
              msg.sender_id === user?.id
                ? "gold-gradient text-primary-foreground rounded-br-md"
                : "bg-surface border border-border/30 text-foreground rounded-bl-md"
            }`}>
              {msg.content}
              <div className={`text-[9px] mt-1 ${msg.sender_id === user?.id ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                {msg.sender_id === user?.id && <span className="ml-1">{msg.is_read ? "✓✓" : "✓"}</span>}
              </div>
            </div>
          </div>
        ))}
        {presence?.is_typing && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl bg-surface border border-border/30 rounded-bl-md">
              <div className="flex gap-1">
                <div className="size-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="size-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="size-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-3 bg-background/80 backdrop-blur-xl border-t border-border/30">
        <div className="flex items-center gap-2">
          <button className="text-muted-foreground"><Image className="size-5" /></button>
          <input
            type="text"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => { setInput(e.target.value); handleTyping(); }}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            className="flex-1 px-4 py-3 rounded-xl bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button onClick={sendMessage} disabled={!input.trim()} className="size-11 rounded-xl gold-gradient flex items-center justify-center text-primary-foreground disabled:opacity-50">
            <Send className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DirectMessagePage;
