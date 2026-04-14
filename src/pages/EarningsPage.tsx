import { ArrowLeft, TrendingUp, Coins, Gift, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const EarningsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [earnings, setEarnings] = useState({ totalReceived: 0, totalSent: 0, platformFees: 0, netEarnings: 0 });
  const [recentGifts, setRecentGifts] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    loadEarnings();
    supabase.from("profiles").select("jagx_coins").eq("user_id", user.id).single().then(({ data }) => setProfile(data));
  }, [user]);

  const loadEarnings = async () => {
    if (!user) return;
    // Gifts received
    const { data: received } = await supabase.from("gifts").select("coin_amount, creator_amount, platform_fee, created_at, sender_id, gift_type").eq("recipient_id", user.id).order("created_at", { ascending: false });
    // Gifts sent
    const { data: sent } = await supabase.from("gifts").select("coin_amount").eq("sender_id", user.id);

    const totalReceived = received?.reduce((sum, g) => sum + g.creator_amount, 0) || 0;
    const totalSent = sent?.reduce((sum, g) => sum + g.coin_amount, 0) || 0;
    const platformFees = received?.reduce((sum, g) => sum + g.platform_fee, 0) || 0;

    setEarnings({ totalReceived, totalSent, platformFees, netEarnings: totalReceived });

    if (received && received.length > 0) {
      const senderIds = [...new Set(received.map(g => g.sender_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, username").in("user_id", senderIds);
      const pMap = new Map(profiles?.map(p => [p.user_id, p.username]) || []);
      setRecentGifts(received.slice(0, 20).map(g => ({ ...g, sender_username: pMap.get(g.sender_id) || "user" })));
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)} className="text-foreground"><ArrowLeft className="size-5" /></button>
          <h1 className="font-display italic text-xl text-gold">Earnings</h1>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Balance */}
        <div className="p-4 rounded-xl glass gold-glow">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Current Balance</p>
          <p className="text-3xl font-bold text-gold mt-1">🪙 {profile?.jagx_coins || 0}</p>
          <p className="text-xs text-muted-foreground mt-1">JagX Coins</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-surface border border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="size-4 text-green-400" />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Earned</span>
            </div>
            <p className="text-lg font-bold text-champagne">🪙 {earnings.totalReceived}</p>
            <p className="text-[10px] text-muted-foreground">After 30% platform fee</p>
          </div>
          <div className="p-3 rounded-xl bg-surface border border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="size-4 text-gold" />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Sent</span>
            </div>
            <p className="text-lg font-bold text-champagne">🪙 {earnings.totalSent}</p>
            <p className="text-[10px] text-muted-foreground">Total gifts given</p>
          </div>
          <div className="p-3 rounded-xl bg-surface border border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="size-4 text-gold" />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Platform Fees</span>
            </div>
            <p className="text-lg font-bold text-champagne">🪙 {earnings.platformFees}</p>
            <p className="text-[10px] text-muted-foreground">30% of gross gifts</p>
          </div>
          <div className="p-3 rounded-xl bg-surface border border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="size-4 text-green-400" />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Net Earnings</span>
            </div>
            <p className="text-lg font-bold text-champagne">🪙 {earnings.netEarnings}</p>
            <p className="text-[10px] text-muted-foreground">70% of gross gifts</p>
          </div>
        </div>

        {/* Fee breakdown */}
        <div className="p-4 rounded-xl bg-surface border border-border/30">
          <h3 className="text-sm font-semibold text-champagne mb-3">How Earnings Work</h3>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>• When someone sends you a gift, JagX Buddy takes a 30% platform fee</p>
            <p>• You receive 70% of the gift value</p>
            <p>• Example: 100 coin gift → You get 70 coins, Platform gets 30 coins</p>
            <p>• Earn from: Post gifts, Live stream gifts, Reel gifts</p>
          </div>
        </div>

        {/* Recent gifts */}
        <div>
          <h3 className="text-sm font-semibold text-champagne mb-3">Recent Gifts Received</h3>
          {recentGifts.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No gifts received yet. Keep creating great content!</p>
          ) : (
            <div className="space-y-2">
              {recentGifts.map((g, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border/30">
                  <div>
                    <p className="text-sm text-champagne font-semibold">@{g.sender_username}</p>
                    <p className="text-[10px] text-muted-foreground">{g.gift_type} • {new Date(g.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gold">+🪙 {g.creator_amount}</p>
                    <p className="text-[10px] text-muted-foreground">of {g.coin_amount}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EarningsPage;
