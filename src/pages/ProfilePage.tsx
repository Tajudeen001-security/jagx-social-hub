import { Settings, Grid3X3, Film, Bookmark, Users, BadgeCheck, LogOut, Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

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
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-24">
        <h2 className="font-display italic text-3xl text-gold mb-4">JagX</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Sign in to view your profile, earn coins, and connect with others.
        </p>
        <button
          onClick={() => navigate("/auth")}
          className="px-8 py-3 rounded-xl gold-gradient text-primary-foreground text-sm font-bold uppercase tracking-widest"
        >
          Sign In
        </button>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="text-sm font-semibold text-champagne">
            @{user.user_metadata?.username || user.email?.split("@")[0] || "user"}
          </h1>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/coins")} className="text-gold">
              <Coins className="size-5" />
            </button>
            <button onClick={signOut} className="text-muted-foreground">
              <LogOut className="size-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Profile info */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-start gap-6">
          <div className="size-20 rounded-full story-ring p-[2px] shrink-0">
            <div className="w-full h-full rounded-full bg-onyx p-[2px]">
              <div className="w-full h-full rounded-full bg-surface flex items-center justify-center text-2xl font-display italic text-gold">
                {(user.user_metadata?.username || user.email || "U")[0].toUpperCase()}
              </div>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-semibold text-champagne">
                {user.user_metadata?.display_name || user.email?.split("@")[0] || "User"}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              New to JagX Buddy Connect ✨
            </p>
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-sm font-bold text-champagne">0</p>
                <p className="text-[10px] text-muted-foreground">Posts</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-champagne">0</p>
                <p className="text-[10px] text-muted-foreground">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-champagne">0</p>
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
        <button
          onClick={() => navigate("/coins")}
          className="w-full mt-4 p-3 rounded-xl glass gold-glow text-left"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">JagX Coins</p>
              <p className="text-lg font-bold text-gold">0</p>
            </div>
            <span className="px-4 py-2 rounded-lg gold-gradient text-primary-foreground text-[10px] font-bold uppercase tracking-widest">
              Buy Coins
            </span>
          </div>
        </button>

        {/* Get Verified */}
        <button
          onClick={() => navigate("/coins")}
          className="w-full mt-3 p-3 rounded-xl bg-surface border border-border flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <BadgeCheck className="size-5 text-gold" />
            <span className="text-sm text-foreground">Get Verified</span>
          </div>
          <span className="text-xs text-gold font-semibold">₦10,000</span>
        </button>
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
                ? "border-primary text-gold"
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
