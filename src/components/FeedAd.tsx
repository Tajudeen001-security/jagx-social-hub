import { useEffect, useState } from "react";
import { ExternalLink, Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Ad {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  user_id: string;
}

const FeedAd = () => {
  const [ad, setAd] = useState<Ad | null>(null);

  useEffect(() => {
    loadAd();
  }, []);

  const loadAd = async () => {
    const { data } = await supabase
      .from("ads")
      .select("id, title, description, image_url, link_url, user_id")
      .eq("status", "active")
      .lt("impressions", 1000) // below max_impressions default
      .gte("expires_at", new Date().toISOString())
      .limit(10);

    if (!data || data.length === 0) return;
    // Pick a random ad
    const picked = data[Math.floor(Math.random() * data.length)];
    setAd(picked);

    // Track impression
    await supabase.from("ads").update({ impressions: (picked as any).impressions + 1 }).eq("id", picked.id);
  };

  const handleClick = () => {
    if (ad?.link_url) {
      window.open(ad.link_url, "_blank");
    }
  };

  if (!ad) return null;

  return (
    <div className="border-b border-border/50 pb-4">
      <div className="px-4 py-2 flex items-center gap-2">
        <Megaphone className="size-3 text-gold" />
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Sponsored</span>
      </div>
      <button onClick={handleClick} className="w-full text-left">
        {ad.image_url && (
          <div className="aspect-video bg-surface overflow-hidden">
            <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" loading="lazy" />
          </div>
        )}
        <div className="px-4 pt-3">
          <p className="text-sm font-semibold text-champagne">{ad.title}</p>
          {ad.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ad.description}</p>}
          {ad.link_url && (
            <div className="flex items-center gap-1 mt-2 text-gold text-xs">
              <ExternalLink className="size-3" /> Learn more
            </div>
          )}
        </div>
      </button>
    </div>
  );
};

export default FeedAd;
