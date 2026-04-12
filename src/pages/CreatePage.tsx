import { Camera, Image, Type, MapPin, Hash } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const CreatePage = () => {
  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="font-display italic text-xl text-gold">Create</h1>
          <button className="px-4 py-1.5 rounded-lg gold-gradient text-primary-foreground text-xs font-bold uppercase tracking-widest">
            Post
          </button>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Text area */}
        <div className="p-4 rounded-xl bg-surface border border-border/30 min-h-[120px]">
          <textarea
            placeholder="What's on your mind?"
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none resize-none text-sm"
            rows={4}
          />
        </div>

        {/* Media options */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Camera, label: "Camera", color: "text-gold" },
            { icon: Image, label: "Gallery", color: "text-blue-400" },
          ].map((item) => (
            <button
              key={item.label}
              className="flex items-center gap-3 p-4 rounded-xl bg-surface border border-border/30 active:bg-surface-elevated transition-colors"
            >
              <item.icon className={`size-5 ${item.color}`} />
              <span className="text-sm text-foreground">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Extra options */}
        <div className="space-y-2">
          {[
            { icon: MapPin, label: "Add Location" },
            { icon: Hash, label: "Add Hashtags" },
            { icon: Type, label: "AI Post Generator", badge: "AI" },
          ].map((item) => (
            <button
              key={item.label}
              className="flex items-center justify-between w-full p-4 rounded-xl bg-surface border border-border/30 active:bg-surface-elevated transition-colors"
            >
              <div className="flex items-center gap-3">
                <item.icon className="size-5 text-muted-foreground" />
                <span className="text-sm text-foreground">{item.label}</span>
              </div>
              {"badge" in item && (
                <span className="text-[10px] px-2 py-0.5 rounded-full gold-gradient text-primary-foreground font-bold uppercase tracking-widest">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default CreatePage;
