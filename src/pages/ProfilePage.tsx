import { Settings, Grid3X3, Film, Bookmark, Users, BadgeCheck, LogOut, Coins, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState<"posts" | "reels" | "saved">("posts");
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).single().then(({ data }) => { if (data) setProfile(data); });
    supabase.from("posts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => { if (data) setPosts(data); });
    supabase.from("followers").select("id", { count: "exact" }).eq("following_id", user.id).then(({ count }) => setFollowerCount(count || 0));
    supabase.from("followers").select("id", { count: "exact" }).eq("follower_id", user.id).then(({ count }) => setFollowingCount(count || 0));
  }, [user]);

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="text-sm font-semibold text-champagne">
            @{profile?.username || user?.user_metadata?.username || user?.email?.split("@")[0] || "user"}
          </h1>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/coins")} className="text-gold"><Coins className="size-5" /></button>
            <button onClick={signOut} className="text-muted-foreground"><LogOut className="size-5" /></button>
          </div>
        </div>
      </header>

      {/* Banner */}
      {profile?.banner_url && (
        <div className="h-28 overflow-hidden"><img src={profile.banner_url} className="w-full h-full object-cover" /></div>
      )}

      <div className="px-4 pt-6 pb-4">
        <div className="flex items-start gap-6">
          <div className={`size-20 rounded-full ${profile?.banner_url ? "-mt-10 relative z-10 border-4 border-background" : "story-ring p-[2px]"} shrink-0 overflow-hidden`}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} className="w-full h-full rounded-full object-cover" />
            ) : (
              <div className="w-full h-full rounded-full bg-surface flex items-center justify-center text-2xl font-display italic text-gold">
                {(profile?.username || user?.user_metadata?.username || user?.email || "U")[0].toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-semibold text-champagne">
                {profile?.display_name || user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User"}
              </h2>
              {profile?.is_verified && <BadgeCheck className="size-4 text-gold" />}
            </div>
            {profile?.bio && <p className="text-xs text-muted-foreground mb-2">{profile.bio}</p>}
            {!profile?.bio && <p className="text-xs text-muted-foreground mb-3">New to JagX Buddy Connect ✨</p>}
            <div className="flex gap-6">
              <div className="text-center"><p className="text-sm font-bold text-champagne">{posts.length}</p><p className="text-[10px] text-muted-foreground">Posts</p></div>
              <div className="text-center"><p className="text-sm font-bold text-champagne">{followerCount}</p><p className="text-[10px] text-muted-foreground">Followers</p></div>
              <div className="text-center"><p className="text-sm font-bold text-champagne">{followingCount}</p><p className="text-[10px] text-muted-foreground">Following</p></div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button onClick={() => navigate("/edit-profile")} className="flex-1 py-2 rounded-lg gold-gradient text-primary-foreground text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
            <Edit className="size-3.5" /> Edit Profile
          </button>
          <button className="flex-1 py-2 rounded-lg bg-surface border border-border text-foreground text-xs font-bold uppercase tracking-widest">Share Profile</button>
          <button className="py-2 px-3 rounded-lg bg-surface border border-border"><Users className="size-4 text-foreground" /></button>
        </div>

        <button onClick={() => navigate("/coins")} className="w-full mt-4 p-3 rounded-xl glass gold-glow text-left">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">JagX Coins</p>
              <p className="text-lg font-bold text-gold">{profile?.jagx_coins || 0}</p>
            </div>
            <span className="px-4 py-2 rounded-lg gold-gradient text-primary-foreground text-[10px] font-bold uppercase tracking-widest">Buy Coins</span>
          </div>
        </button>

        {!profile?.is_verified && (
          <button onClick={() => navigate("/coins")} className="w-full mt-3 p-3 rounded-xl bg-surface border border-border flex items-center justify-between">
            <div className="flex items-center gap-2"><BadgeCheck className="size-5 text-gold" /><span className="text-sm text-foreground">Get Verified</span></div>
            <span className="text-xs text-gold font-semibold">₦10,000</span>
          </button>
        )}
      </div>

      <div className="flex border-b border-border/30">
        {[{ key: "posts" as const, icon: Grid3X3 }, { key: "reels" as const, icon: Film }, { key: "saved" as const, icon: Bookmark }].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-3 flex justify-center border-b-2 transition-colors ${activeTab === tab.key ? "border-primary text-gold" : "border-transparent text-muted-foreground"}`}>
            <tab.icon className="size-5" />
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-[2px]">
        {posts.map((post) => (
          <div key={post.id} className="aspect-square bg-surface overflow-hidden">
            {post.image_url ? <img src={post.image_url} className="w-full h-full object-cover" loading="lazy" /> :
              post.video_url ? <video src={post.video_url} className="w-full h-full object-cover" /> :
              <div className="w-full h-full flex items-center justify-center p-2"><p className="text-xs text-muted-foreground text-center line-clamp-3">{post.content}</p></div>}
          </div>
        ))}
        {posts.length === 0 && (
          <div className="col-span-3 py-16 text-center"><p className="text-sm text-muted-foreground">No posts yet. Create your first post!</p></div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default ProfilePage;
