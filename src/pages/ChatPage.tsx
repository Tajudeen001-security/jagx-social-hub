import { Search, Edit3, Bot } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import BottomNav from "@/components/BottomNav";

interface Conversation {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isVerified: boolean;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
}

const ChatPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    loadConversations();

    const channel = supabase.channel("chat-updates")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => loadConversations())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;
    // Get all messages involving current user
    const { data: msgs } = await supabase.from("messages").select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });
    if (!msgs) return;

    // Group by other user
    const convMap = new Map<string, { lastMsg: any; unread: number }>();
    for (const msg of msgs) {
      const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      if (!convMap.has(otherId)) {
        convMap.set(otherId, { lastMsg: msg, unread: 0 });
      }
      if (msg.receiver_id === user.id && !msg.is_read) {
        const entry = convMap.get(otherId)!;
        entry.unread++;
      }
    }

    // Load profiles and presence for all conversation partners
    const userIds = Array.from(convMap.keys());
    if (userIds.length === 0) return;
    
    const { data: profiles } = await supabase.from("profiles").select("user_id, username, display_name, avatar_url, is_verified").in("user_id", userIds);
    const { data: presences } = await supabase.from("user_presence").select("user_id, is_online").in("user_id", userIds);

    const presenceMap = new Map(presences?.map(p => [p.user_id, p.is_online]) || []);
    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    const convs: Conversation[] = userIds.map(uid => {
      const entry = convMap.get(uid)!;
      const profile = profileMap.get(uid);
      return {
        userId: uid,
        username: profile?.username || "user",
        displayName: profile?.display_name || profile?.username || "User",
        avatarUrl: profile?.avatar_url || null,
        isVerified: profile?.is_verified || false,
        lastMessage: entry.lastMsg.content,
        lastMessageTime: entry.lastMsg.created_at,
        unreadCount: entry.unread,
        isOnline: presenceMap.get(uid) || false,
      };
    });

    setConversations(convs);
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (diff < 1) return "now";
    if (diff < 60) return `${diff}m`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h`;
    return d.toLocaleDateString();
  };

  const filtered = conversations.filter(c => 
    c.displayName.toLowerCase().includes(search.toLowerCase()) || 
    c.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="font-display italic text-xl text-gold">Messages</h1>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/ai-chat")} className="text-gold"><Bot className="size-5" /></button>
            <button className="text-foreground"><Edit3 className="size-5" /></button>
          </div>
        </div>
      </header>

      <div className="px-4 py-3">
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-surface border border-border/30">
          <Search className="size-4 text-muted-foreground" />
          <input type="text" placeholder="Search messages..." value={search} onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1" />
        </div>
      </div>

      {/* Online now */}
      {conversations.filter(c => c.isOnline).length > 0 && (
        <div className="px-4 pb-3">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Online Now</p>
          <div className="flex gap-4 overflow-x-auto no-scrollbar">
            {conversations.filter(c => c.isOnline).map(c => (
              <button key={c.userId} onClick={() => navigate(`/dm/${c.userId}`)} className="shrink-0 flex flex-col items-center gap-1">
                <div className="relative">
                  <div className="size-12 rounded-full border border-gold/20 p-[1px] overflow-hidden">
                    {c.avatarUrl ? <img src={c.avatarUrl} className="w-full h-full rounded-full object-cover" /> :
                      <div className="w-full h-full rounded-full bg-surface flex items-center justify-center text-sm font-display italic text-gold">{c.displayName[0]}</div>}
                  </div>
                  <div className="absolute bottom-0 right-0 size-3 rounded-full bg-green-500 border-2 border-background" />
                </div>
                <span className="text-[10px] text-muted-foreground">{c.displayName.split(" ")[0]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* JagX AI Buddy */}
      <button onClick={() => navigate("/ai-chat")} className="w-full px-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-gold/20 mb-2">
          <div className="size-12 rounded-full gold-gradient flex items-center justify-center shrink-0">
            <Bot className="size-5 text-primary-foreground" />
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold text-gold">JagX Buddy AI</span>
              <span className="text-gold text-xs">✓</span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1">Your AI assistant — ask anything!</p>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full gold-gradient text-primary-foreground font-bold uppercase tracking-widest">AI</span>
        </div>
      </button>

      {/* Conversations */}
      <div className="divide-y divide-border/20">
        {filtered.map(c => (
          <button key={c.userId} onClick={() => navigate(`/dm/${c.userId}`)} className="w-full flex items-center gap-3 px-4 py-3 active:bg-surface-elevated transition-colors">
            <div className="relative shrink-0">
              <div className="size-12 rounded-full border border-border/30 overflow-hidden">
                {c.avatarUrl ? <img src={c.avatarUrl} className="w-full h-full object-cover" /> :
                  <div className="w-full h-full flex items-center justify-center bg-surface text-gold font-display italic">{c.displayName[0]}</div>}
              </div>
              {c.isOnline && <div className="absolute bottom-0 right-0 size-3 rounded-full bg-green-500 border-2 border-background" />}
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold text-champagne">{c.displayName}</span>
                  {c.isVerified && <span className="text-gold text-xs">✓</span>}
                </div>
                <span className="text-[10px] text-muted-foreground">{formatTime(c.lastMessageTime)}</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground line-clamp-1">{c.lastMessage}</p>
                {c.unreadCount > 0 && (
                  <span className="ml-2 size-5 rounded-full gold-gradient flex items-center justify-center text-[10px] font-bold text-primary-foreground shrink-0">{c.unreadCount}</span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {conversations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-6">
          <p className="text-muted-foreground text-sm text-center">No conversations yet. Follow people and start messaging!</p>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default ChatPage;
