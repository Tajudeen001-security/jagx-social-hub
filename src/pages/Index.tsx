import { Bell, Search, Radio, Users, Bot } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StoryCircle from "@/components/StoryCircle";
import StoryViewer from "@/components/StoryViewer";
import PostCard from "@/components/PostCard";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface StoryGroup {
  userId: string;
  username: string;
  avatarUrl: string | null;
  isVerified: boolean;
  stories: any[];
}

const FeedPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [viewingStories, setViewingStories] = useState<any[] | null>(null);
  const [viewingIndex, setViewingIndex] = useState(0);
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    loadStories();
    loadPosts();
  }, []);

  const loadStories = async () => {
    const { data } = await supabase.from("stories").select("*").gte("expires_at", new Date().toISOString()).order("created_at", { ascending: false });
    if (!data || data.length === 0) return;
    const userIds = [...new Set(data.map(s => s.user_id))];
    const { data: profiles } = await supabase.from("profiles").select("user_id, username, avatar_url, is_verified").in("user_id", userIds);
    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    const groups: StoryGroup[] = [];
    const grouped = new Map<string, any[]>();
    for (const s of data) {
      if (!grouped.has(s.user_id)) grouped.set(s.user_id, []);
      grouped.get(s.user_id)!.push(s);
    }
    for (const [uid, stories] of grouped) {
      const p = profileMap.get(uid);
      groups.push({ userId: uid, username: p?.username || "user", avatarUrl: p?.avatar_url || null, isVerified: p?.is_verified || false, stories: stories.map(s => ({ ...s, username: p?.username, avatar_url: p?.avatar_url, is_verified: p?.is_verified })) });
    }
    setStoryGroups(groups);
  };

  const loadPosts = async () => {
    const { data } = await supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(20);
    if (!data || data.length === 0) return;
    const userIds = [...new Set(data.map(p => p.user_id))];
    const { data: profiles } = await supabase.from("profiles").select("user_id, username, avatar_url, is_verified").in("user_id", userIds);
    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    setPosts(data.map(post => {
      const p = profileMap.get(post.user_id);
      return {
        ...post,
        username: p?.username || "user",
        avatarUrl: p?.avatar_url || `https://picsum.photos/id/${Math.floor(Math.random() * 100)}/100/100`,
        isVerified: p?.is_verified || false,
      };
    }));
  };

  const openStory = (group: StoryGroup) => {
    setViewingStories(group.stories);
    setViewingIndex(0);
  };

  // Fallback posts for empty state
  const fallbackPosts = [
    { username: "julian.v", avatarUrl: "https://picsum.photos/id/65/100/100", imageUrl: "https://picsum.photos/id/42/800/800", caption: "The brutalist intersection of light and shadow at the Pavilion ✨", likes: 1847, comments: 42, timeAgo: "2 hours ago", location: "Paris, France", isVerified: true },
    { username: "elara.thorne", avatarUrl: "https://picsum.photos/id/66/100/100", imageUrl: "https://picsum.photos/id/48/800/800", caption: "Curating the morning quiet. Velvet textures and cold espresso ☕", likes: 426, comments: 18, timeAgo: "4 hours ago", location: "London, UK" },
    { username: "drift.culture", avatarUrl: "https://picsum.photos/id/67/100/100", imageUrl: "https://picsum.photos/id/29/800/800", caption: "Nature doesn't rush, yet everything is accomplished 🌿", likes: 2103, comments: 67, timeAgo: "6 hours ago", isVerified: true },
  ];

  const displayPosts = posts.length > 0 ? posts : [];

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="font-display italic text-xl text-gold">JagX</h1>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/ai-chat")} className="text-gold"><Bot className="size-5" /></button>
            <button onClick={() => navigate("/live")} className="flex items-center gap-1 text-foreground"><Radio className="size-4" /></button>
            <button onClick={() => navigate("/discover")} className="text-foreground"><Users className="size-5" /></button>
            <button onClick={() => navigate("/notifications")} className="relative text-foreground">
              <Bell className="size-5" />
              <span className="absolute -top-1 -right-1 size-2 rounded-full gold-gradient" />
            </button>
          </div>
        </div>
      </header>

      {/* Stories */}
      <div className="flex gap-4 px-4 py-4 overflow-x-auto no-scrollbar">
        <div onClick={() => navigate("/create")} className="shrink-0">
          <StoryCircle imageUrl="" name="You" isAdd hasStory={false} />
        </div>
        {storyGroups.map(g => (
          <div key={g.userId} onClick={() => openStory(g)} className="shrink-0">
            <StoryCircle imageUrl={g.avatarUrl || ""} name={g.username} />
          </div>
        ))}
      </div>

      {/* Feed */}
      <div className="space-y-2">
        {displayPosts.map((post) => (
          <PostCard
            key={post.id}
            username={post.username}
            avatarUrl={post.avatarUrl}
            imageUrl={post.image_url || post.video_url || "https://picsum.photos/id/42/800/800"}
            caption={post.content || ""}
            likes={0}
            comments={0}
            timeAgo={new Date(post.created_at).toLocaleDateString()}
            isVerified={post.isVerified}
            userId={post.user_id}
            showFollow={post.user_id !== user?.id}
          />
        ))}
        {displayPosts.length === 0 && fallbackPosts.map((post, i) => (
          <PostCard key={i} {...post} />
        ))}
      </div>

      {/* Story Viewer */}
      {viewingStories && (
        <StoryViewer stories={viewingStories} initialIndex={viewingIndex} onClose={() => setViewingStories(null)} />
      )}

      <BottomNav />
    </div>
  );
};

export default FeedPage;
