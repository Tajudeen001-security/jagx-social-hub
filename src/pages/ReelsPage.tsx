import { useState, useEffect, useRef } from "react";
import { Heart, MessageCircle, Share2, Eye, Gift, Send, UserPlus, X, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import { useNavigate } from "react-router-dom";

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

const ReelsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reels, setReels] = useState<Reel[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => { loadReels(); }, []);

  const loadReels = async () => {
    const { data } = await supabase.from("posts").select("*").not("video_url", "is", null).order("created_at", { ascending: false }).limit(50);
    if (!data || data.length === 0) return;
    const userIds = [...new Set(data.map(p => p.user_id))];
    const { data: profiles } = await supabase.from("profiles").select("user_id, username, avatar_url, is_verified").in("user_id", userIds);
    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
    const postIds = data.map(p => p.id);
    const { data: likeCounts } = await supabase.from("likes").select("post_id").in("post_id", postIds);
    const likeMap = new Map<string, number>();
    likeCounts?.forEach(l => likeMap.set(l.post_id, (likeMap.get(l.post_id) || 0) + 1));
    const { data: commentCounts } = await supabase.from("comments").select("post_id").in("post_id", postIds);
    const commentMap = new Map<string, number>();
    commentCounts?.forEach(c => commentMap.set(c.post_id, (commentMap.get(c.post_id) || 0) + 1));
    setReels(data.map(p => {
      const profile = profileMap.get(p.user_id);
      return { id: p.id, user_id: p.user_id, video_url: p.video_url!, content: p.content, username: profile?.username || "user", avatar_url: profile?.avatar_url || null, is_verified: profile?.is_verified || false, like_count: likeMap.get(p.id) || 0, comment_count: commentMap.get(p.id) || 0, view_count: p.view_count || 0 };
    }));
  };

  const handleScroll = () => {
    if (!containerRef.current) return;
    const index = Math.round(containerRef.current.scrollTop / containerRef.current.clientHeight);
    if (index !== currentIndex) setCurrentIndex(index);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-0 left-0 right-0 z-40 flex justify-between items-center px-4 py-3 bg-gradient-to-b from-background/80 to-transparent">
        <h1 className="font-display italic text-lg text-gold">Reels</h1>
        <button onClick={() => setIsMuted(!isMuted)} className="text-foreground">
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

const ReelItem = ({ reel, isActive, user, navigate, isMuted, onToggleMute }: { reel: Reel; isActive: boolean; user: any; navigate: any; isMuted: boolean; onToggleMute: () => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(reel.like_count);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [showGift, setShowGift] = useState(false);
  const [giftAmount, setGiftAmount] = useState(10);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) { videoRef.current.play().catch(() => {}); } else { videoRef.current.pause(); videoRef.current.currentTime = 0; }
  }, [isActive]);

  useEffect(() => { if (videoRef.current) videoRef.current.muted = isMuted; }, [isMuted]);

  useEffect(() => {
    if (!user) return;
    supabase.from("likes").select("id").eq("post_id", reel.id).eq("user_id", user.id).single().then(({ data }) => { if (data) setLiked(true); });
  }, [user, reel.id]);

  const handleLike = async () => {
    if (!user) return;
    if (liked) { setLiked(false); setLikeCount(prev => prev - 1); await supabase.from("likes").delete().eq("post_id", reel.id).eq("user_id", user.id); }
    else { setLiked(true); setLikeCount(prev => prev + 1); await supabase.from("likes").insert({ post_id: reel.id, user_id: user.id }); if (reel.user_id !== user.id) await supabase.from("notifications").insert({ user_id: reel.user_id, from_user_id: user.id, type: "like", content: "liked your reel", related_post_id: reel.id }); }
  };

  const loadComments = async () => {
    const { data } = await supabase.from("comments").select("*").eq("post_id", reel.id).order("created_at", { ascending: true });
    if (!data) return;
    const userIds = [...new Set(data.map(c => c.user_id))];
    if (userIds.length === 0) { setComments([]); return; }
    const { data: profiles } = await supabase.from("profiles").select("user_id, username").in("user_id", userIds);
    const pMap = new Map(profiles?.map(p => [p.user_id, p.username]) || []);
    setComments(data.map(c => ({ ...c, username: pMap.get(c.user_id) || "user" })));
  };

  const addComment = async () => {
    if (!commentText.trim() || !user) return;
    await supabase.from("comments").insert({ post_id: reel.id, user_id: user.id, content: commentText.trim() });
    setCommentText(""); loadComments();
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
    if (error && error.code !== "23505") toast.error("Failed to follow"); else toast.success(`Following @${reel.username}`);
  };

  const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

  return (
    <div className="relative h-screen snap-start bg-black">
      <video ref={videoRef} src={reel.video_url} className="absolute inset-0 w-full h-full object-cover"
        loop muted={isMuted} playsInline preload="metadata" onDoubleClick={handleLike} onClick={onToggleMute} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

      <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5">
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
        <motion.button whileTap={{ scale: 1.3 }} onClick={handleLike} className="flex flex-col items-center gap-1">
          <Heart className={`size-7 ${liked ? "fill-red-500 text-red-500" : "text-white"}`} />
          <span className="text-[10px] font-semibold text-white">{fmt(likeCount)}</span>
        </motion.button>
        <button onClick={() => { setShowComments(true); loadComments(); }} className="flex flex-col items-center gap-1">
          <MessageCircle className="size-7 text-white" />
          <span className="text-[10px] font-semibold text-white">{fmt(reel.comment_count)}</span>
        </button>
        <button onClick={() => setShowGift(!showGift)} className="flex flex-col items-center gap-1">
          <Gift className="size-6 text-gold" /><span className="text-[10px] font-semibold text-gold">Gift</span>
        </button>
        <button className="flex flex-col items-center gap-1"><Share2 className="size-7 text-white" /></button>
      </div>

      <div className="absolute bottom-20 left-3 right-16">
        <p className="font-semibold text-sm text-white">@{reel.username} {reel.is_verified && <span className="text-gold">✓</span>}</p>
        <p className="text-sm text-white/80 line-clamp-2 mt-1">{reel.content || ""}</p>
      </div>

      <AnimatePresence>
        {showGift && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="absolute bottom-20 left-3 right-3 p-3 rounded-xl bg-black/80 backdrop-blur-xl border border-gold/20">
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
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="absolute inset-0 bg-background/95 backdrop-blur-xl z-50 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
              <span className="text-sm font-semibold text-champagne">Comments</span>
              <button onClick={() => setShowComments(false)}><X className="size-5 text-foreground" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {comments.map(c => (
                <div key={c.id} className="flex gap-2">
                  <span className="text-xs font-semibold text-gold">{c.username}</span>
                  <span className="text-xs text-foreground/80">{c.content}</span>
                </div>
              ))}
              {comments.length === 0 && <p className="text-xs text-muted-foreground text-center">No comments yet</p>}
            </div>
            <div className="flex items-center gap-2 p-3 border-t border-border/30">
              <input value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === "Enter" && addComment()}
                placeholder="Add a comment..." className="flex-1 px-3 py-2 rounded-xl bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none" />
              <button onClick={addComment} disabled={!commentText.trim()} className="text-gold disabled:opacity-30"><Send className="size-5" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReelsPage;
