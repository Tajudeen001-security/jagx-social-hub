import { useLocation, useNavigate } from "react-router-dom";
import { Home, Film, PlusCircle, MessageCircle, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { icon: Home, label: "Feed", path: "/" },
  { icon: Film, label: "Reels", path: "/reels" },
  { icon: PlusCircle, label: "Create", path: "/create" },
  { icon: MessageCircle, label: "Chat", path: "/chat" },
  { icon: User, label: "Profile", path: "/profile" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [unreadMsgs, setUnreadMsgs] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadMsgs(0);
      return;
    }

    let cancelled = false;
    // A unique topic prevents React StrictMode/remounts from reusing a channel
    // that is still joining or subscribed during asynchronous cleanup.
    const channelName = `nav-msg:${user.id}:${Math.random().toString(36).slice(2)}`;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const load = async () => {
      const { count, error } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("is_read", false);

      if (!cancelled && !error) setUnreadMsgs(count ?? 0);
    };

    void load();

    channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `receiver_id=eq.${user.id}` },
        () => { void load(); },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          // The initial unread count remains available even if realtime is offline.
          console.warn("JagX Connect unread-message realtime subscription:", status);
        }
      });

    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      <div className="mx-3 mb-3">
        <div className="glass rounded-2xl px-2 py-2 flex items-center justify-around gold-glow">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const isCreate = item.label === "Create";

            if (isCreate) {
              return (
                <button
                  key={item.label}
                  type="button"
                  aria-label="Create a post"
                  onClick={() => navigate(item.path)}
                  className="flex items-center justify-center -mt-6 size-14 rounded-full gold-gradient shadow-lg shadow-primary/30 text-primary-foreground"
                >
                  <PlusCircle className="size-7" />
                </button>
              );
            }

            return (
              <button
                key={item.label}
                type="button"
                aria-current={isActive ? "page" : undefined}
                onClick={() => navigate(item.path)}
                className={`relative flex flex-col items-center gap-1 px-3 py-1 transition-colors ${
                  isActive ? "text-gold" : "text-muted-foreground"
                }`}
              >
                <item.icon className="size-5" />
                {item.label === "Chat" && unreadMsgs > 0 && (
                  <span className="absolute -top-1 right-1 min-w-[16px] h-4 px-1 rounded-full gold-gradient flex items-center justify-center text-[9px] font-bold text-primary-foreground">
                    {unreadMsgs > 99 ? "99+" : unreadMsgs}
                  </span>
                )}
                <span className="text-[10px] uppercase tracking-widest font-medium">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
