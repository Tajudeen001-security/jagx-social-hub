import { useLocation, useNavigate } from "react-router-dom";
import { Home, Film, PlusCircle, MessageCircle, User } from "lucide-react";

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
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 px-3 py-1 transition-colors ${
                  isActive ? "text-gold" : "text-muted-foreground"
                }`}
              >
                <item.icon className="size-5" />
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
