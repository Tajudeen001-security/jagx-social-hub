import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Send, UserPlus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface PostCardProps {
  username: string;
  avatarUrl: string;
  imageUrl: string;
  caption: string;
  likes: number;
  comments: number;
  timeAgo: string;
  location?: string;
  isVerified?: boolean;
  userId?: string;
  onFollow?: () => void;
  showFollow?: boolean;
}

const PostCard = ({
  username, avatarUrl, imageUrl, caption, likes, comments, timeAgo, location, isVerified, userId, onFollow, showFollow,
}: PostCardProps) => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [localComments, setLocalComments] = useState<string[]>([]);
  const navigate = useNavigate();

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
  };

  const addComment = () => {
    if (!commentText.trim()) return;
    setLocalComments(prev => [...prev, commentText.trim()]);
    setCommentText("");
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
          <button className="text-muted-foreground"><MoreHorizontal className="size-5" /></button>
        </div>
      </div>

      {/* Image */}
      <div className="relative aspect-square bg-surface overflow-hidden">
        <img src={imageUrl} alt="Post" className="w-full h-full object-cover" loading="lazy" onDoubleClick={handleLike} />
      </div>

      {/* Actions */}
      <div className="px-4 pt-3 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <motion.button whileTap={{ scale: 1.3 }} onClick={handleLike} className={liked ? "text-red-500" : "text-foreground"}>
            <Heart className={`size-6 ${liked ? "fill-current" : ""}`} />
          </motion.button>
          <button onClick={() => setShowComments(!showComments)} className="text-foreground"><MessageCircle className="size-6" /></button>
          <button className="text-foreground"><Share2 className="size-6" /></button>
        </div>
        <motion.button whileTap={{ scale: 1.2 }} onClick={() => setSaved(!saved)} className={saved ? "text-gold" : "text-foreground"}>
          <Bookmark className={`size-6 ${saved ? "fill-current" : ""}`} />
        </motion.button>
      </div>

      {/* Likes & Caption */}
      <div className="px-4 pt-2">
        <p className="text-sm font-semibold text-champagne">{formatCount(likeCount)} appreciations</p>
        <p className="text-sm mt-1">
          <span className="font-semibold text-champagne">{username} </span>
          <span className="text-foreground/80">{caption}</span>
        </p>
        <button onClick={() => setShowComments(!showComments)} className="text-xs text-muted-foreground mt-1">
          {comments + localComments.length} comments
        </button>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{timeAgo}</p>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="px-4 pt-2 space-y-2">
          {localComments.map((c, i) => (
            <p key={i} className="text-sm"><span className="font-semibold text-champagne">You </span><span className="text-foreground/80">{c}</span></p>
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
