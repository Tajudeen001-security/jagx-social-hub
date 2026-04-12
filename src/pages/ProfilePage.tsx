import { Settings, Grid3X3, Film, Bookmark, Heart, Users, BadgeCheck } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useState } from "react";

const profilePosts = [
  "https://picsum.photos/id/42/400/400",
  "https://picsum.photos/id/48/400/400",
  "https://picsum.photos/id/29/400/400",
  "https://picsum.photos/id/37/400/400",
  "https://picsum.photos/id/36/400/400",
  "https://picsum.photos/id/39/400/400",
];

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState<"posts" | "reels" | "saved">("posts");

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="text-sm font-semibold text-champagne">@julian.vault</h1>
          <button className="text-foreground">
            <Settings className="size-5" />
          </button>
        </div>
      </header>

      {/* Profile info */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-start gap-6">
          <div className="size-20 rounded-full story-ring p-[2px] shrink-0">
            <div className="w-full h-full rounded-full bg-onyx p-[2px]">
              <img
                src="https://picsum.photos/id/64/200/200"
                alt="Profile"
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-semibold text-champagne">Julian Vault</h2>
              <BadgeCheck className="size-4 text-gold fill-gold/20" />
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Digital architect & visual storyteller. Building the future one pixel at a time ✨
            </p>
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-sm font-bold text-champagne">247</p>
                <p className="text-[10px] text-muted-foreground">Posts</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-champagne">12.4k</p>
                <p className="text-[10px] text-muted-foreground">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-champagne">892</p>
                <p className="text-[10px] text-muted-foreground">Following</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-4">
          <button className="flex-1 py-2 rounded-lg gold-gradient text-primary-foreground text-xs font-bold uppercase tracking-widest">
            Edit Profile
          </button>
          <button className="flex-1 py-2 rounded-lg bg-surface border border-border text-foreground text-xs font-bold uppercase tracking-widest">
            Share Profile
          </button>
          <button className="py-2 px-3 rounded-lg bg-surface border border-border">
            <Users className="size-4 text-foreground" />
          </button>
        </div>

        {/* JagX Coins */}
        <div className="mt-4 p-3 rounded-xl glass gold-glow">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">JagX Coins</p>
              <p className="text-lg font-bold text-gold">2,450</p>
            </div>
            <button className="px-4 py-2 rounded-lg gold-gradient text-primary-foreground text-[10px] font-bold uppercase tracking-widest">
              Buy Coins
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/30">
        {[
          { key: "posts" as const, icon: Grid3X3 },
          { key: "reels" as const, icon: Film },
          { key: "saved" as const, icon: Bookmark },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-3 flex justify-center border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-gold text-gold"
                : "border-transparent text-muted-foreground"
            }`}
          >
            <tab.icon className="size-5" />
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-[2px]">
        {profilePosts.map((url, i) => (
          <div key={i} className="aspect-square bg-surface overflow-hidden">
            <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

export default ProfilePage;
