import { ArrowLeft, Plus, Eye, Coins, Image as ImageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const AD_COSTS = [
  { impressions: 1000, cost: 100, label: "Starter" },
  { impressions: 5000, cost: 400, label: "Growth" },
  { impressions: 10000, cost: 700, label: "Premium" },
  { impressions: 50000, cost: 3000, label: "Mega" },
];

const AdsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [myAds, setMyAds] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    loadAds();
    supabase.from("profiles").select("jagx_coins").eq("user_id", user.id).single().then(({ data }) => setProfile(data));
  }, [user]);

  const loadAds = async () => {
    if (!user) return;
    const { data } = await supabase.from("ads").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setMyAds(data);
  };

  const createAd = async () => {
    if (!user || !title.trim()) return;
    const plan = AD_COSTS[selectedPlan];
    if ((profile?.jagx_coins || 0) < plan.cost) { toast.error("Insufficient JagX Coins"); return; }

    setCreating(true);
    let imageUrl = "";
    if (imageFile) {
      const path = `ads/${user.id}/${Date.now()}.${imageFile.name.split(".").pop()}`;
      const { error } = await supabase.storage.from("posts").upload(path, imageFile);
      if (error) { toast.error("Upload failed"); setCreating(false); return; }
      imageUrl = supabase.storage.from("posts").getPublicUrl(path).data.publicUrl;
    }

    // Deduct coins
    await supabase.from("profiles").update({ jagx_coins: (profile?.jagx_coins || 0) - plan.cost }).eq("user_id", user.id);

    const { error } = await supabase.from("ads").insert({
      user_id: user.id, title: title.trim(), description: description.trim(),
      image_url: imageUrl || null, link_url: linkUrl.trim() || null,
      coin_cost: plan.cost, max_impressions: plan.impressions,
    });

    if (error) toast.error("Failed to create ad");
    else { toast.success("Ad created! 🎉"); setShowCreate(false); setTitle(""); setDescription(""); setLinkUrl(""); loadAds(); }
    setCreating(false);
  };

  return (
    <div className="min-h-screen pb-24 bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-foreground"><ArrowLeft className="size-5" /></button>
            <h1 className="font-display italic text-xl text-gold">Ads</h1>
          </div>
          <button onClick={() => setShowCreate(true)} className="px-3 py-1.5 rounded-lg gold-gradient text-primary-foreground text-xs font-bold flex items-center gap-1">
            <Plus className="size-3" /> Create Ad
          </button>
        </div>
      </header>

      <div className="p-4 space-y-4">
        <div className="p-4 rounded-xl glass gold-glow">
          <p className="text-xs text-muted-foreground">Promote your content to the JagX community</p>
          <p className="text-sm text-champagne mt-1">Buy ad spots with JagX Coins and reach more people!</p>
        </div>

        {/* My ads */}
        <h3 className="text-sm font-semibold text-champagne">My Ads</h3>
        {myAds.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">No ads yet. Create your first ad!</p>
        ) : (
          myAds.map(ad => (
            <div key={ad.id} className="p-3 rounded-xl bg-surface border border-border/30">
              {ad.image_url && <img src={ad.image_url} className="w-full h-32 rounded-lg object-cover mb-2" />}
              <h4 className="text-sm font-semibold text-champagne">{ad.title}</h4>
              {ad.description && <p className="text-xs text-muted-foreground mt-1">{ad.description}</p>}
              <div className="flex items-center gap-4 mt-2">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Eye className="size-3" /> {ad.impressions}/{ad.max_impressions}</span>
                <span className="text-[10px] text-gold flex items-center gap-1"><Coins className="size-3" /> {ad.coin_cost} coins</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${ad.status === "active" ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"}`}>{ad.status}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create ad modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
          <div className="flex items-center justify-between px-4 h-14 border-b border-border/30">
            <span className="font-semibold text-champagne">Create Ad</span>
            <button onClick={() => setShowCreate(false)} className="text-foreground">✕</button>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Ad Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Your ad title"
                className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-sm text-foreground outline-none" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your ad"
                className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-sm text-foreground outline-none h-20 resize-none" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Link URL</label>
              <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..."
                className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-sm text-foreground outline-none" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Image</label>
              <button onClick={() => fileRef.current?.click()} className="w-full py-8 rounded-xl border-2 border-dashed border-border flex flex-col items-center gap-2">
                <ImageIcon className="size-8 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{imageFile ? imageFile.name : "Tap to upload"}</span>
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className="hidden" />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Choose Plan</label>
              <div className="space-y-2">
                {AD_COSTS.map((plan, i) => (
                  <button key={i} onClick={() => setSelectedPlan(i)}
                    className={`w-full p-3 rounded-xl border text-left flex justify-between items-center ${selectedPlan === i ? "border-gold gold-glow" : "border-border bg-surface"}`}>
                    <div>
                      <p className="text-sm font-semibold text-champagne">{plan.label}</p>
                      <p className="text-[10px] text-muted-foreground">{plan.impressions.toLocaleString()} impressions</p>
                    </div>
                    <span className="text-sm font-bold text-gold">🪙 {plan.cost}</span>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={createAd} disabled={!title.trim() || creating}
              className="w-full py-3 rounded-xl gold-gradient text-primary-foreground font-bold text-sm disabled:opacity-50">
              {creating ? "Creating..." : `Create Ad (🪙 ${AD_COSTS[selectedPlan].cost})`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdsPage;
