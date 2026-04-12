import { Search, Edit3 } from "lucide-react";
import ChatPreview from "@/components/ChatPreview";
import BottomNav from "@/components/BottomNav";

const chats = [
  {
    name: "Elara Void",
    avatarUrl: "https://picsum.photos/id/65/100/100",
    lastMessage: "That sunset photo was incredible! 🔥",
    time: "2m",
    unread: 3,
    isOnline: true,
  },
  {
    name: "Soren Black",
    avatarUrl: "https://picsum.photos/id/67/100/100",
    lastMessage: "Let's meet up at the gallery opening",
    time: "14m",
    isOnline: true,
  },
  {
    name: "Ghost Unit",
    avatarUrl: "https://picsum.photos/id/68/100/100",
    lastMessage: "Sent you the encrypted files",
    time: "1h",
    unread: 1,
    isOnline: false,
  },
  {
    name: "JagX Team",
    avatarUrl: "https://picsum.photos/id/69/100/100",
    lastMessage: "Welcome to the JagX community! 🎉",
    time: "2h",
    isOnline: false,
  },
  {
    name: "Maison Collective",
    avatarUrl: "https://picsum.photos/id/70/100/100",
    lastMessage: "The new collection drops tomorrow",
    time: "5h",
    isOnline: false,
  },
];

const ChatPage = () => {
  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="font-display italic text-xl text-gold">Messages</h1>
          <button className="text-foreground">
            <Edit3 className="size-5" />
          </button>
        </div>
      </header>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-surface border border-border/30">
          <Search className="size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search messages..."
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1"
          />
        </div>
      </div>

      {/* Online now */}
      <div className="px-4 pb-3">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Online Now</p>
        <div className="flex gap-4 overflow-x-auto no-scrollbar">
          {chats
            .filter((c) => c.isOnline)
            .map((chat) => (
              <div key={chat.name} className="shrink-0 flex flex-col items-center gap-1">
                <div className="relative">
                  <div className="size-12 rounded-full border border-gold\/20 p-[1px]">
                    <img src={chat.avatarUrl} alt={chat.name} className="w-full h-full rounded-full object-cover" />
                  </div>
                  <div className="absolute bottom-0 right-0 size-3 rounded-full bg-green-500 border-2 border-background" />
                </div>
                <span className="text-[10px] text-muted-foreground">{chat.name.split(" ")[0]}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Chat list */}
      <div className="divide-y divide-border/20">
        {chats.map((chat) => (
          <ChatPreview key={chat.name} {...chat} />
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

export default ChatPage;
