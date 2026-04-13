import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Send, UserPlus, Gift, Trash2, Edit3, X, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface PostCardProps {
  id?: string;
  username: string;
  avatarUrl: string;
  imageUrl: string;
  videoUrl?: string;
  caption: string;
  likes: number;
  comments: number;
  timeAgo: string;
  location?: string;
  isVerified?: boolean;
  userId?: string;
  onFollow?: () => void;
  showFollow?: boolean;
  onDelete?: () => void;
  onEdit?: (newContent: string) => void;
}

const PostCard = ({
  id, username, avatarUrl, imageUrl, videoUrl, caption, likes, comments, timeAgo, location, isVerified, userId, onFollow, showFollow, onDelete, onEdit,
}: PostCardProps) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [dbComments, setDbComments] = useState<any[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(caption);
  const [showGift, setShowGift] = useState(false);
  const [giftAmount, setGiftAmount] = useState(10);
  const navigate = useNavigate();

  const isOwner = user?.id === userId;

  // Check if user liked this post
  useEffect(() => {
    if (!user || !id) return;
    supabase.from("likes").select("id").eq("post_id", id).eq("user_id", user.id).single()
      .then(({ data }) => { if (data) setLiked(true); });
    // Load real like count
    supabase.from("likes").select("id", { count: "exact" }).eq("post_id", id)
      .then(({ count }) => { if (count !== null) setLikeCount(count); });
  }, [user, id]);

  // Load comments
  useEffect(() => {
    if (!id) return;
    loadComments();
  }, [id]);

  const loadComments = async () => {
    if (!id) return;
    const { data } = await supabase.from("comments").select("*").eq("post_id", id).order("created_at", { ascending: true });
    if (!data) return;
    const userIds = [...new Set(data.map(c => c.user_id))];
    if (userIds.length === 0) { setDbComments([]); return; }
    const { data: profiles } = await supabase.from("profiles").select("user_id, username, avatar_url").in("user_id", userIds);
    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
    setDbComments(data.map(c => ({ ...c, username: profileMap.get(c.user_id)?.username || "user" })));
  };

  // Realtime likes & comments
  useEffect(() => {
    if (!id) return;
    const channel = supabase.channel(`post-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "likes", filter: `post_id=eq.${id}` }, () => {
        supabase.from("likes").select("id", { count: "exact" }).eq("post_id", id)
          .then(({ count }) => { if (count !== null) setLikeCount(count); });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "comments", filter: `post_id=eq.${id}` }, () => {
        loadComments();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const handleLike = async () => {
    if (!user || !id) return;
    if (liked) {
      setLiked(false);
      setLikeCount(prev => prev - 1);
      await supabase.from("likes").delete().eq("post_id", id).eq("user_id", user.id);
    } else {
      setLiked(true);
      setLikeCount(prev => prev + 1);
      await supabase.from("likes").insert({ post_id: id, user_id: user.id });
      // Notify post owner
      if (userId && userId !== user.id) {
        await supabase.from("notifications").insert({
          user_id: userId, from_user_id: user.id, type: "like", content: "liked your post", related_post_id: id,
        });
      }
    }
  };

  const addComment = async () => {
    if (!commentText.trim() || !user || !id) return;
    const text = commentText.trim();
    setCommentText("");
    await supabase.from("comments").insert({ post_id: id, user_id: user.id, content: text });
    if (userId && userId !== user.id) {
      await supabase.from("notifications").insert({
        user_id: userId, from_user_id: user.id, type: "comment", content: `commented: ${text.slice(0, 50)}`, related_post_id: id,
      });
    }
    loadComments();
  };

  const handleDelete = async () => {
    if (!id || !user) return;
    const { error } = await supabase.from("posts").delete().eq("id", id).eq("user_id", user.id);
    if (error) toast.error("Failed to delete post");
    else { toast.success("Post deleted"); onDelete?.(); }
    setShowMenu(false);
  };

  const handleEdit = async () => {
    if (!id || !user) return;
    const { error } = await supabase.from("posts").update({ content: editText }).eq("id", id).eq("user_id", user.id);
    if (error) toast.error("Failed to edit");
    else { toast.success("Post updated"); onEdit?.(editText); setEditing(false); }
  };

  const sendGift = async () => {
    if (!user || !userId || !id) return;
    const { error } = await supabase.from("gifts").insert({
      sender_id: user.id, recipient_id: userId, post_id: id, coin_amount: giftAmount, gift_type: "post",
    });
    if (error) toast.error(error.message || "Failed to send gift");
    else toast.success(`🎁 Sent ${giftAmount} coins!`);
    setShowGift(false);
  };

  const shareToStory = async () => {
    if (!user) return;
    const mediaUrl = imageUrl || videoUrl;
    if (!mediaUrl) return;
    const { error } = await supabase.from("stories").insert({
      user_id: user.id, media_url: mediaUrl, media_type: videoUrl ? "video" : "image",
      caption: `Shared from @${username}: ${caption?.slice(0, 100) || ""}`,
    });
    if (error) toast.error("Failed to share");
    else toast.success("Shared to your story! 🐆");
    setShowMenu(false);
  };

  const formatCount = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

  return (
    <article className="border-b border-border/50 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => userId && navigate(`/user/${userId}`)} className="flex items-center gap-3">
          <div className="size-9 rounded-full border border-gold/20 p-[1px]">
            <img src={avatarUrl} alt={username} className="w-full h-full rounded-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-champagne">{username}</span>
              {isVerified && <span className="text-gold text-xs">✓</span>}
            </div>
            {location && <span className="text-[10px] text-muted-foreground">{location}</span>}
          </div>
        </button>
        <div className="flex items-center gap-2">
          {showFollow && (
            <button onClick={onFollow} className="px-3 py-1 rounded-lg gold-gradient text-primary-foreground text-[10px] font-bold uppercase tracking-widest">
              <UserPlus className="size-3" />
            </button>
          )}
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="text-muted-foreground"><MoreHorizontal className="size-5" /></button>
            {showMenu && (
              <div className="absolute top-full right-0 mt-1 w-44 rounded-xl bg-surface border border-border/30 shadow-xl z-50 overflow-hidden">
                <button onClick={shareToStory} className="w-full px-4 py-2.5 text-left text-xs text-foreground hover:bg-surface-elevated flex items-center gap-2">
                  <Share2 className="size-3" /> Share to Story
                </button>
                {isOwner && (
                  <>
                    <button onClick={() => { setEditing(true); setShowMenu(false); }} className="w-full px-4 py-2.5 text-left text-xs text-foreground hover:bg-surface-elevated flex items-center gap-2">
                      <Edit3 className="size-3" /> Edit Post
                    </button>
                    <button onClick={handleDelete} className="w-full px-4 py-2.5 text-left text-xs text-red-400 hover:bg-surface-elevated flex items-center gap-2">
                      <Trash2 className="size-3" /> Delete Post
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit mode */}
      {editing && (
        <div className="px-4 pb-2 flex items-center gap-2">
          <input value={editText} onChange={e => setEditText(e.target.value)} className="flex-1 text-sm bg-surface border border-border rounded-lg px-3 py-2 text-foreground outline-none" />
          <button onClick={handleEdit} className="text-gold"><Check className="size-5" /></button>
          <button onClick={() => setEditing(false)} className="text-muted-foreground"><X className="size-5" /></button>
        </div>
      )}

      {/* Image / Video */}
      <div className="relative aspect-square bg-surface overflow-hidden">
        {videoUrl ? (
          <video src={videoUrl} className="w-full h-full object-cover" controls playsInline preload="metadata" onDoubleClick={handleLike} />
        ) : (
          <img src={imageUrl} alt="Post" className="w-full h-full object-cover" loading="lazy" onDoubleClick={handleLike} />
        )}
        <AnimatePresence>
          {liked && (
            <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Heart className="size-20 text-red-500 fill-red-500" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="px-4 pt-3 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <motion.button whileTap={{ scale: 1.3 }} onClick={handleLike} className={liked ? "text-red-500" : "text-foreground"}>
            <Heart className={`size-6 ${liked ? "fill-current" : ""}`} />
          </motion.button>
          <button onClick={() => setShowComments(!showComments)} className="text-foreground"><MessageCircle className="size-6" /></button>
          <button onClick={() => setShowMenu(true)} className="text-foreground"><Share2 className="size-6" /></button>
          {!isOwner && userId && (
            <button onClick={() => setShowGift(!showGift)} className="text-gold"><Gift className="size-5" /></button>
          )}
        </div>
        <motion.button whileTap={{ scale: 1.2 }} onClick={() => setSaved(!saved)} className={saved ? "text-gold" : "text-foreground"}>
          <Bookmark className={`size-6 ${saved ? "fill-current" : ""}`} />
        </motion.button>
      </div>

      {/* Gift section */}
      <AnimatePresence>
        {showGift && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-4 pt-2 overflow-hidden">
            <div className="flex items-center gap-2">
              {[10, 50, 100, 500].map(amt => (
                <button key={amt} onClick={() => setGiftAmount(amt)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${giftAmount === amt ? "gold-gradient text-primary-foreground" : "bg-surface border border-border text-foreground"}`}>
                  🪙 {amt}
                </button>
              ))}
              <button onClick={sendGift} className="px-3 py-1.5 rounded-lg gold-gradient text-primary-foreground text-xs font-bold">Send</button>
            </div>
            <p className="text-[9px] text-muted-foreground mt-1">30% platform fee applies</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Likes & Caption */}
      <div className="px-4 pt-2">
        <p className="text-sm font-semibold text-champagne">{formatCount(likeCount)} appreciations</p>
        {!editing && (
          <p className="text-sm mt-1">
            <span className="font-semibold text-champagne">{username} </span>
            <span className="text-foreground/80">{caption}</span>
          </p>
        )}
        <button onClick={() => setShowComments(!showComments)} className="text-xs text-muted-foreground mt-1">
          {dbComments.length || comments} comments
        </button>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{timeAgo}</p>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="px-4 pt-2 space-y-2">
          {dbComments.map((c) => (
            <p key={c.id} className="text-sm"><span className="font-semibold text-champagne">{c.username} </span><span className="text-foreground/80">{c.content}</span></p>
          ))}
          <div className="flex items-center gap-2 mt-2">
            <input type="text" placeholder="Add a comment..." value={commentText} onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addComment()}
              className="flex-1 text-sm bg-transparent border-b border-border/30 py-1.5 text-foreground placeholder:text-muted-foreground outline-none" />
            <button onClick={addComment} disabled={!commentText.trim()} className="text-gold disabled:opacity-30">
              <Send className="size-4" />
            </button>
          </div>
        </div>
      )}
    </article>
  );
};

export default PostCard;
