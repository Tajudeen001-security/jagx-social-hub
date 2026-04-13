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

    // Real-time feed updates
    const channel = supabase.channel("feed-updates")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, () => loadPosts())
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "posts" }, () => loadPosts())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
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
    const { data } = await supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(50);
    if (!data || data.length === 0) { setPosts([]); return; }
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

  const handlePostDelete = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const handlePostEdit = (postId: string, newContent: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, content: newContent } : p));
  };

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
        {posts.map((post) => (
          <PostCard
            key={post.id}
            id={post.id}
            username={post.username}
            avatarUrl={post.avatarUrl}
            imageUrl={post.image_url || ""}
            videoUrl={post.video_url || undefined}
            caption={post.content || ""}
            likes={0}
            comments={0}
            timeAgo={new Date(post.created_at).toLocaleDateString()}
            isVerified={post.isVerified}
            userId={post.user_id}
            showFollow={post.user_id !== user?.id}
            onDelete={() => handlePostDelete(post.id)}
            onEdit={(newContent) => handlePostEdit(post.id, newContent)}
          />
        ))}
        {posts.length === 0 && (
          <div className="py-16 text-center px-6">
            <p className="text-muted-foreground text-sm">No posts yet. Create your first post! 🐆</p>
          </div>
        )}
      </div>

      {viewingStories && (
        <StoryViewer stories={viewingStories} initialIndex={viewingIndex} onClose={() => setViewingStories(null)} />
      )}

      <BottomNav />
    </div>
  );
};

export default FeedPage;
