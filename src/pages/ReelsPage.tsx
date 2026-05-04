import { useState, useEffect, useRef } from "react";
import { Heart, MessageCircle, Share2, Gift, Send, UserPlus, X, Volume2, VolumeX, Bookmark, Pause, Play, Reply } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import { useNavigate } from "react-router-dom";
import StructuredData from "@/components/StructuredData";
import TaggedText from "@/components/TaggedText";

interface Reel {
  id: string;
  user_id: string;
  video_url: string;
  content: string | null;
  username: string;
  avatar_url: string | null;
  is_verified: boolean;
  like_count: number;
  comment_count: number;
  view_count: number;
}

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const ReelsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reels, setReels] = useState<Reel[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => { loadReels(); }, [user?.id]);

  const loadReels = async () => {
    const { data } = await supabase.from("posts").select("*").not("video_url", "is", null).limit(200);
    if (!data || data.length === 0) return;

    let viewedIds = new Set<string>();
    if (user) {
      const { data: views } = await supabase.from("reel_views").select("post_id").eq("user_id", user.id);
      viewedIds = new Set((views || []).map((v: any) => v.post_id));
    }
    let filtered = data.filter(p => !viewedIds.has(p.id));
    // If everything has been seen, reset and show all again randomly
    if (filtered.length === 0) filtered = data;

    const userIds = [...new Set(filtered.map(p => p.user_id))];
    const { data: profiles } = await supabase.from("profiles").select("user_id, username, avatar_url, is_verified").in("user_id", userIds);
    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
    const postIds = filtered.map(p => p.id);
    const { data: likeCounts } = await supabase.from("likes").select("post_id").in("post_id", postIds);
    const likeMap = new Map<string, number>();
    likeCounts?.forEach(l => likeMap.set(l.post_id, (likeMap.get(l.post_id) || 0) + 1));
    const { data: commentCounts } = await supabase.from("comments").select("post_id").in("post_id", postIds);
    const commentMap = new Map<string, number>();
    commentCounts?.forEach(c => commentMap.set(c.post_id, (commentMap.get(c.post_id) || 0) + 1));

    const enriched = filtered.map(p => {
      const profile = profileMap.get(p.user_id);
      return { id: p.id, user_id: p.user_id, video_url: p.video_url!, content: p.content, username: profile?.username || "user", avatar_url: profile?.avatar_url || null, is_verified: profile?.is_verified || false, like_count: likeMap.get(p.id) || 0, comment_count: commentMap.get(p.id) || 0, view_count: p.view_count || 0 };
    });
    setReels(shuffle(enriched));
  };

  const handleScroll = () => {
    if (!containerRef.current) return;
    const index = Math.round(containerRef.current.scrollTop / containerRef.current.clientHeight);
    if (index !== currentIndex) setCurrentIndex(index);
  };

  // Record view when current reel changes
  useEffect(() => {
    const reel = reels[currentIndex];
    if (!reel || !user) return;
    // Upsert so a re-watch is idempotent — view is permanently persisted across sessions
    supabase
      .from("reel_views")
      .upsert({ user_id: user.id, post_id: reel.id }, { onConflict: "user_id,post_id", ignoreDuplicates: true })
      .then(() => {});
  }, [currentIndex, reels, user]);

  return (
    <div className="min-h-screen bg-background">
      <StructuredData id="reels" data={{
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "JagX Connect Reels",
        description: "Short-form vertical videos from creators on JagX Connect.",
        url: typeof window !== "undefined" ? window.location.origin + "/reels" : "",
        numberOfItems: reels.length,
      }} />
      <div className="fixed top-0 left-0 right-0 z-40 flex justify-between items-center px-4 py-3 bg-gradient-to-b from-background/80 to-transparent pointer-events-none">
        <h1 className="font-display italic text-lg text-gold pointer-events-auto">Reels</h1>
        <button onClick={() => setIsMuted(!isMuted)} className="text-foreground pointer-events-auto p-2 rounded-full bg-black/30 backdrop-blur">
          {isMuted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
        </button>
      </div>
      <div ref={containerRef} onScroll={handleScroll} className="h-screen snap-y snap-mandatory overflow-y-auto">
        {reels.map((reel, i) => (
          <ReelItem key={reel.id} reel={reel} isActive={i === currentIndex} user={user} navigate={navigate} isMuted={isMuted} onToggleMute={() => setIsMuted(!isMuted)} />
        ))}
        {reels.length === 0 && (
          <div className="h-screen flex items-center justify-center">
            <p className="text-muted-foreground text-sm">No reels yet. Post a video to see it here!</p>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

interface CommentNode {
  id: string;
  user_id: string;
  username: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  replies: CommentNode[];
}

const ReelItem = ({ reel, isActive, user, navigate, isMuted, onToggleMute }: { reel: Reel; isActive: boolean; user: any; navigate: any; isMuted: boolean; onToggleMute: () => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [liked, setLiked] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [likeCount, setLikeCount] = useState(reel.like_count);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null);
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [showGift, setShowGift] = useState(false);
  const [giftAmount, setGiftAmount] = useState(10);
  const [paused, setPaused] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const tapTimeoutRef = useRef<number | null>(null);

  // Auto play / unmute when active
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isActive) {
      v.muted = isMuted;
      v.play().then(() => setPaused(false)).catch(() => {
        // Autoplay with sound blocked — fallback to muted autoplay
        v.muted = true;
        v.play().catch(() => {});
      });
    } else {
      v.pause();
      v.currentTime = 0;
      setPaused(false);
    }
  }, [isActive]);

  useEffect(() => { if (videoRef.current) videoRef.current.muted = isMuted; }, [isMuted]);

  useEffect(() => {
    if (!user) return;
    supabase.from("likes").select("id").eq("post_id", reel.id).eq("user_id", user.id).maybeSingle().then(({ data }) => { if (data) setLiked(true); });
    supabase.from("favorites").select("id").eq("post_id", reel.id).eq("user_id", user.id).maybeSingle().then(({ data }) => { if (data) setFavorited(true); });
  }, [user, reel.id]);

  const handleLike = async () => {
    if (!user) return;
    if (liked) {
      setLiked(false); setLikeCount(p => p - 1);
      await supabase.from("likes").delete().eq("post_id", reel.id).eq("user_id", user.id);
    } else {
      setLiked(true); setLikeCount(p => p + 1);
      await supabase.from("likes").insert({ post_id: reel.id, user_id: user.id });
      if (reel.user_id !== user.id) await supabase.from("notifications").insert({ user_id: reel.user_id, from_user_id: user.id, type: "like", content: "liked your reel", related_post_id: reel.id });
    }
  };

  const toggleFavorite = async () => {
    if (!user) return;
    if (favorited) {
      setFavorited(false);
      await supabase.from("favorites").delete().eq("post_id", reel.id).eq("user_id", user.id);
      toast("Removed from favorites");
    } else {
      setFavorited(true);
      await supabase.from("favorites").insert({ post_id: reel.id, user_id: user.id });
      toast.success("Saved to favorites ⭐");
    }
  };

  const buildTree = (flat: any[]): CommentNode[] => {
    const map = new Map<string, CommentNode>();
    const roots: CommentNode[] = [];
    flat.forEach(c => map.set(c.id, { ...c, replies: [] }));
    map.forEach(node => {
      if (node.parent_id && map.has(node.parent_id)) map.get(node.parent_id)!.replies.push(node);
      else roots.push(node);
    });
    return roots;
  };

  const loadComments = async () => {
    const { data } = await supabase.from("comments").select("*").eq("post_id", reel.id).order("created_at", { ascending: true });
    if (!data) return;
    const userIds = [...new Set(data.map(c => c.user_id))];
    if (userIds.length === 0) { setComments([]); return; }
    const { data: profiles } = await supabase.from("profiles").select("user_id, username").in("user_id", userIds);
    const pMap = new Map(profiles?.map(p => [p.user_id, p.username]) || []);
    const enriched = data.map(c => ({ ...c, username: pMap.get(c.user_id) || "user" }));
    setComments(buildTree(enriched));
  };

  const addComment = async () => {
    if (!commentText.trim() || !user) return;
    const payload: any = { post_id: reel.id, user_id: user.id, content: commentText.trim() };
    if (replyTo) payload.parent_id = replyTo.id;
    await supabase.from("comments").insert(payload);
    if (reel.user_id !== user.id) {
      await supabase.from("notifications").insert({
        user_id: reel.user_id,
        from_user_id: user.id,
        type: "comment",
        content: `commented: ${commentText.trim().slice(0, 60)}`,
        related_post_id: reel.id,
      });
    }
    setCommentText(""); setReplyTo(null); loadComments();
  };

  const sendGift = async () => {
    if (!user) return;
    const { error } = await supabase.from("gifts").insert({ sender_id: user.id, recipient_id: reel.user_id, post_id: reel.id, coin_amount: giftAmount, gift_type: "reel" });
    if (error) toast.error(error.message); else toast.success(`🎁 Sent ${giftAmount} coins!`);
    setShowGift(false);
  };

  const followUser = async () => {
    if (!user) return;
    const { error } = await supabase.from("followers").insert({ follower_id: user.id, following_id: reel.user_id });
    if (error && error.code !== "23505") { toast.error("Failed to follow"); return; }
    toast.success(`Following @${reel.username}`);
    if (reel.user_id !== user.id) {
      await supabase.from("notifications").insert({
        user_id: reel.user_id, from_user_id: user.id, type: "follow", content: "started following you",
      });
    }
  };

  const handleVideoTap = () => {
    if (tapTimeoutRef.current) {
      window.clearTimeout(tapTimeoutRef.current);
      tapTimeoutRef.current = null;
      // Double tap → like + heart anim
      handleLike();
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 700);
      return;
    }
    tapTimeoutRef.current = window.setTimeout(() => {
      tapTimeoutRef.current = null;
      // Single tap → pause/play
      const v = videoRef.current;
      if (!v) return;
      if (v.paused) { v.play(); setPaused(false); } else { v.pause(); setPaused(true); }
    }, 220);
  };

  const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

  return (
    <div className="relative h-screen snap-start bg-black overflow-hidden">
      <video ref={videoRef} src={reel.video_url} className="absolute inset-0 w-full h-full object-cover"
        loop playsInline preload="metadata" onClick={handleVideoTap} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />

      {/* Pause indicator */}
      <AnimatePresence>
        {paused && (
          <motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="size-20 rounded-full bg-black/40 backdrop-blur flex items-center justify-center">
              <Play className="size-10 text-white fill-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Double-tap heart */}
      <AnimatePresence>
        {showHeart && (
          <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1.4, opacity: 1 }} exit={{ scale: 1.8, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart className="size-28 text-red-500 fill-red-500 drop-shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right side actions */}
      <div className="absolute right-2.5 bottom-32 flex flex-col items-center gap-4 z-20">
        <button onClick={() => navigate(`/user/${reel.user_id}`)} className="relative">
          <div className="size-11 rounded-full border-2 border-gold p-[1px]">
            {reel.avatar_url ? <img src={reel.avatar_url} className="w-full h-full rounded-full object-cover" /> :
              <div className="w-full h-full rounded-full bg-surface flex items-center justify-center text-gold font-bold">{reel.username[0]?.toUpperCase()}</div>}
          </div>
          {user?.id !== reel.user_id && (
            <button onClick={(e) => { e.stopPropagation(); followUser(); }} className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 size-5 rounded-full gold-gradient flex items-center justify-center">
              <UserPlus className="size-2.5 text-primary-foreground" />
            </button>
          )}
        </button>
        <motion.button whileTap={{ scale: 1.3 }} onClick={handleLike} className="flex flex-col items-center gap-0.5">
          <Heart className={`size-7 drop-shadow ${liked ? "fill-red-500 text-red-500" : "text-white"}`} />
          <span className="text-[10px] font-semibold text-white drop-shadow">{fmt(likeCount)}</span>
        </motion.button>
        <button onClick={() => { setShowComments(true); loadComments(); }} className="flex flex-col items-center gap-0.5">
          <MessageCircle className="size-7 text-white drop-shadow" />
          <span className="text-[10px] font-semibold text-white drop-shadow">{fmt(reel.comment_count)}</span>
        </button>
        <motion.button whileTap={{ scale: 1.3 }} onClick={toggleFavorite} className="flex flex-col items-center gap-0.5">
          <Bookmark className={`size-7 drop-shadow ${favorited ? "fill-gold text-gold" : "text-white"}`} />
          <span className="text-[10px] font-semibold text-white drop-shadow">Save</span>
        </motion.button>
        <button onClick={() => setShowGift(!showGift)} className="flex flex-col items-center gap-0.5">
          <Gift className="size-6 text-gold drop-shadow" /><span className="text-[10px] font-semibold text-gold">Gift</span>
        </button>
        <button className="flex flex-col items-center gap-0.5"><Share2 className="size-7 text-white drop-shadow" /></button>
      </div>

      {/* Username + caption — leave room on right for action rail */}
      <div className="absolute bottom-20 left-3 right-24 z-10">
        <button onClick={() => navigate(`/user/${reel.user_id}`)} className="font-semibold text-sm text-white drop-shadow flex items-center gap-1">
          @{reel.username} {reel.is_verified && <span className="text-gold">✓</span>}
        </button>
        <p className="text-sm text-white/90 line-clamp-2 mt-1 drop-shadow">
          <TaggedText text={reel.content || ""} />
        </p>
      </div>

      {/* Quick inline comment bar — sits below caption, clear of action rail */}
      <div className="absolute bottom-3 left-3 right-24 flex items-center gap-2 z-10">
        <input
          value={commentText}
          onChange={e => setCommentText(e.target.value)}
          onClick={e => e.stopPropagation()}
          onKeyDown={e => { e.stopPropagation(); if (e.key === "Enter") addComment(); }}
          placeholder="Add a comment · use @ to tag ✨"
          className="flex-1 px-3 py-2 rounded-full bg-black/50 backdrop-blur border border-white/20 text-xs text-white placeholder:text-white/60 outline-none"
        />
        <button onClick={(e) => { e.stopPropagation(); addComment(); }} disabled={!commentText.trim()} className="text-gold disabled:opacity-30">
          <Send className="size-5" />
        </button>
      </div>

      <AnimatePresence>
        {showGift && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="absolute bottom-20 left-3 right-3 p-3 rounded-xl bg-black/80 backdrop-blur-xl border border-gold/20 z-30">
            <div className="flex items-center gap-2 flex-wrap">
              {[10, 50, 100, 500, 1000].map(amt => (
                <button key={amt} onClick={() => setGiftAmount(amt)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${giftAmount === amt ? "gold-gradient text-primary-foreground" : "bg-white/10 text-white"}`}>🪙 {amt}</button>
              ))}
              <button onClick={sendGift} className="px-4 py-1.5 rounded-lg gold-gradient text-primary-foreground text-xs font-bold">Send</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showComments && (
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            className="absolute inset-x-0 bottom-0 top-1/3 bg-background/98 backdrop-blur-xl z-50 flex flex-col rounded-t-3xl border-t border-gold/20">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
              <span className="text-sm font-semibold text-champagne">Comments</span>
              <button onClick={() => { setShowComments(false); setReplyTo(null); }}><X className="size-5 text-foreground" /></button>
            </div>
            {/* Composer at TOP so the comment list stays easy to read below */}
            {replyTo && (
              <div className="px-4 py-1.5 bg-surface/60 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Replying to <span className="text-gold">@{replyTo.username}</span></span>
                <button onClick={() => setReplyTo(null)}><X className="size-3.5" /></button>
              </div>
            )}
            <div className="flex items-center gap-2 p-3 border-b border-border/30 bg-surface/30">
              <input value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === "Enter" && addComment()}
                placeholder={replyTo ? `Reply to @${replyTo.username}...` : "Add a comment · @ to tag"}
                className="flex-1 px-3 py-2 rounded-xl bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none" />
              <button onClick={addComment} disabled={!commentText.trim()} className="text-gold disabled:opacity-30"><Send className="size-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {comments.map(c => (
                <CommentItem key={c.id} node={c} onReply={(id, username) => setReplyTo({ id, username })} navigate={navigate} />
              ))}
              {comments.length === 0 && <p className="text-xs text-muted-foreground text-center mt-8">Be the first to comment 💬</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CommentItem = ({ node, onReply, navigate, depth = 0 }: { node: CommentNode; onReply: (id: string, username: string) => void; navigate: any; depth?: number }) => (
  <div className={depth > 0 ? "ml-6 pl-3 border-l border-gold/15" : ""}>
    <div className="flex flex-col gap-0.5">
      <div className="flex items-baseline gap-2 flex-wrap">
        <button onClick={() => navigate(`/user/${node.user_id}`)} className="text-xs font-semibold text-gold">@{node.username}</button>
        <TaggedText text={node.content} className="text-xs text-foreground/85" />
      </div>
      <button onClick={() => onReply(node.id, node.username)} className="self-start text-[10px] text-muted-foreground flex items-center gap-1 hover:text-gold">
        <Reply className="size-3" /> Reply
      </button>
    </div>
    {node.replies.length > 0 && (
      <div className="mt-2 space-y-2">
        {node.replies.map(r => <CommentItem key={r.id} node={r} onReply={onReply} navigate={navigate} depth={depth + 1} />)}
      </div>
    )}
  </div>
);

export default ReelsPage;
