import { useState, useRef } from "react";
import { Camera, Image, Type, MapPin, Hash, X, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

const CreatePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [location, setLocation] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [posting, setPosting] = useState(false);
  const [postType, setPostType] = useState<"post" | "story">("post");
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const handleMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    setMediaType(file.type.startsWith("video") ? "video" : "image");
    const reader = new FileReader();
    reader.onload = () => setMediaPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handlePost = async () => {
    if (!user) return;
    if (!content.trim() && !mediaFile) { toast.error("Add some content or media!"); return; }
    setPosting(true);

    try {
      let mediaUrl: string | null = null;

      if (mediaFile) {
        const ext = mediaFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("posts").upload(path, mediaFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from("posts").getPublicUrl(path);
        mediaUrl = publicUrl;
      }

      const parsedTags = hashtags.split(/[,\s#]+/).filter(t => t.trim()).map(t => t.trim());

      if (postType === "story") {
        if (!mediaUrl) { toast.error("Stories need a photo or video!"); setPosting(false); return; }
        const { error } = await supabase.from("stories").insert({
          user_id: user.id, media_url: mediaUrl, media_type: mediaType, caption: content || null,
        });
        if (error) throw error;
        toast.success("Story posted! 🐆");
      } else {
        const { error } = await supabase.from("posts").insert({
          user_id: user.id,
          content: content || null,
          image_url: mediaType === "image" ? mediaUrl : null,
          video_url: mediaType === "video" ? mediaUrl : null,
          post_type: mediaFile ? mediaType : "text",
          hashtags: parsedTags.length > 0 ? parsedTags : null,
        });
        if (error) throw error;
        toast.success("Posted! 🐆");
      }

      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Failed to post");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="font-display italic text-xl text-gold">Create</h1>
          <button onClick={handlePost} disabled={posting}
            className="px-4 py-1.5 rounded-lg gold-gradient text-primary-foreground text-xs font-bold uppercase tracking-widest disabled:opacity-50 flex items-center gap-2">
            {posting && <Loader2 className="size-3 animate-spin" />}
            {posting ? "Posting..." : "Post"}
          </button>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Post type toggle */}
        <div className="flex gap-2">
          <button onClick={() => setPostType("post")}
            className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors ${postType === "post" ? "gold-gradient text-primary-foreground" : "bg-surface border border-border text-foreground"}`}>
            Post
          </button>
          <button onClick={() => setPostType("story")}
            className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors ${postType === "story" ? "gold-gradient text-primary-foreground" : "bg-surface border border-border text-foreground"}`}>
            Story
          </button>
        </div>

        {/* Text area */}
        <div className="p-4 rounded-xl bg-surface border border-border/30 min-h-[120px]">
          <textarea
            placeholder={postType === "story" ? "Add a caption to your story..." : "What's on your mind?"}
            value={content}
            onChange={e => setContent(e.target.value)}
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none resize-none text-sm"
            rows={4}
          />
        </div>

        {/* Media preview */}
        {mediaPreview && (
          <div className="relative rounded-xl overflow-hidden">
            {mediaType === "video" ? (
              <video src={mediaPreview} className="w-full max-h-64 object-cover rounded-xl" controls />
            ) : (
              <img src={mediaPreview} className="w-full max-h-64 object-cover rounded-xl" />
            )}
            <button onClick={() => { setMediaFile(null); setMediaPreview(null); }}
              className="absolute top-2 right-2 size-7 rounded-full bg-black/60 flex items-center justify-center">
              <X className="size-4 text-white" />
            </button>
          </div>
        )}

        {/* Media options */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => cameraRef.current?.click()}
            className="flex items-center gap-3 p-4 rounded-xl bg-surface border border-border/30 active:bg-surface-elevated transition-colors">
            <Camera className="size-5 text-gold" />
            <span className="text-sm text-foreground">Camera</span>
            <input ref={cameraRef} type="file" accept="image/*,video/*" capture="environment" onChange={handleMedia} className="hidden" />
          </button>
          <button onClick={() => fileRef.current?.click()}
            className="flex items-center gap-3 p-4 rounded-xl bg-surface border border-border/30 active:bg-surface-elevated transition-colors">
            <Image className="size-5 text-blue-400" />
            <span className="text-sm text-foreground">Gallery</span>
            <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleMedia} className="hidden" />
          </button>
        </div>

        {/* Hashtags */}
        <div className="space-y-2">
          <button className="flex items-center justify-between w-full p-4 rounded-xl bg-surface border border-border/30">
            <div className="flex items-center gap-3">
              <Hash className="size-5 text-muted-foreground" />
              <input type="text" placeholder="Add hashtags (comma separated)" value={hashtags} onChange={e => setHashtags(e.target.value)}
                className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1" />
            </div>
          </button>
          <button className="flex items-center justify-between w-full p-4 rounded-xl bg-surface border border-border/30">
            <div className="flex items-center gap-3">
              <MapPin className="size-5 text-muted-foreground" />
              <input type="text" placeholder="Add location" value={location} onChange={e => setLocation(e.target.value)}
                className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1" />
            </div>
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default CreatePage;
