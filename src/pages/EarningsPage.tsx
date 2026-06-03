import { ArrowLeft, TrendingUp, Coins, Gift, DollarSign, Banknote, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const COIN_TO_NAIRA = 10; // 1 JagX Coin = ₦10
const NAIRA_TO_USD = 0.00062; // approximate

const EarningsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [earnings, setEarnings] = useState({ totalReceived: 0, totalSent: 0, platformFees: 0, netEarnings: 0 });
  const [recentGifts, setRecentGifts] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [currency, setCurrency] = useState<"coins" | "naira" | "usd">("coins");
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [bankDetails, setBankDetails] = useState({ bankName: "", accountNumber: "", accountName: "" });
  const [withdrawAmount, setWithdrawAmount] = useState("");

  useEffect(() => {
    if (!user) return;
    loadEarnings();
    supabase.from("profiles").select("jagx_coins").eq("user_id", user.id).single().then(({ data }) => setProfile(data));
  }, [user]);

  const loadEarnings = async () => {
    if (!user) return;
    const { data: received } = await supabase.from("gifts").select("coin_amount, creator_amount, platform_fee, created_at, sender_id, gift_type").eq("recipient_id", user.id).order("created_at", { ascending: false });
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

  const convertValue = (coins: number) => {
    if (currency === "naira") return `₦${(coins * COIN_TO_NAIRA).toLocaleString()}`;
    if (currency === "usd") return `$${(coins * COIN_TO_NAIRA * NAIRA_TO_USD).toFixed(2)}`;
    return `🪙 ${coins}`;
  };

  const handleWithdraw = async () => {
    if (!user || !withdrawAmount || !bankDetails.bankName || !bankDetails.accountNumber || !bankDetails.accountName) {
      toast.error("Please fill in all fields");
      return;
    }
    const amount = parseInt(withdrawAmount);
    if (isNaN(amount) || amount < 2000) { toast.error("Minimum withdrawal is 2,000 coins (₦20,000)"); return; }
    if (amount > (profile?.jagx_coins || 0)) { toast.error("Insufficient balance"); return; }

    const fee = Math.floor(amount * 0.1);
    const payout = amount - fee;

    const { error } = await supabase.from("withdrawal_requests").insert({
      user_id: user.id,
      amount_coins: amount,
      amount_naira: amount * COIN_TO_NAIRA,
      fee_coins: fee,
      payout_coins: payout,
      bank_name: bankDetails.bankName,
      account_number: bankDetails.accountNumber,
      account_name: bankDetails.accountName,
      status: "pending",
    });
    if (error) { toast.error(error.message); return; }

    toast.success(`Withdrawal submitted to admin. You'll receive a notification when it's approved.`);
    setShowWithdraw(false);
    setWithdrawAmount("");
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
        {/* Currency toggle */}
        <div className="flex gap-2">
          {(["coins", "naira", "usd"] as const).map(c => (
            <button key={c} onClick={() => setCurrency(c)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest ${currency === c ? "gold-gradient text-primary-foreground" : "bg-surface border border-border/30 text-muted-foreground"}`}>
              {c === "coins" ? "🪙 Coins" : c === "naira" ? "₦ Naira" : "$ USD"}
            </button>
          ))}
        </div>

        {/* Balance */}
        <div className="p-4 rounded-xl glass gold-glow">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Current Balance</p>
          <p className="text-3xl font-bold text-gold mt-1">{convertValue(profile?.jagx_coins || 0)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {currency === "coins" ? "JagX Coins" : currency === "naira" ? `🪙 ${profile?.jagx_coins || 0} coins` : `₦${((profile?.jagx_coins || 0) * COIN_TO_NAIRA).toLocaleString()}`}
          </p>
          <button onClick={() => setShowWithdraw(true)} className="mt-3 px-4 py-2 rounded-xl gold-gradient text-primary-foreground text-xs font-bold flex items-center gap-2">
            <Banknote className="size-4" /> Withdraw Earnings
          </button>
        </div>

        {/* Withdraw modal */}
        {showWithdraw && (
          <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-2xl bg-surface border border-border/30 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-champagne">Withdraw Earnings</h3>
                <button onClick={() => setShowWithdraw(false)} className="text-muted-foreground text-lg">✕</button>
              </div>
              <p className="text-xs text-muted-foreground">Available: {convertValue(profile?.jagx_coins || 0)}</p>
              
              <div className="space-y-3">
                <input type="number" placeholder="Amount in coins (min 2,000 = ₦20,000)" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none" />
                {withdrawAmount && (
                  <div className="text-xs space-y-0.5">
                    <p className="text-muted-foreground">Gross: ₦{(parseInt(withdrawAmount || "0") * COIN_TO_NAIRA).toLocaleString()}</p>
                    <p className="text-muted-foreground">10% fee: ₦{Math.floor(parseInt(withdrawAmount || "0") * 0.1 * COIN_TO_NAIRA).toLocaleString()}</p>
                    <p className="text-gold font-semibold">You receive: ₦{Math.floor(parseInt(withdrawAmount || "0") * 0.9 * COIN_TO_NAIRA).toLocaleString()}</p>
                  </div>
                )}
                <input type="text" placeholder="Bank Name" value={bankDetails.bankName} onChange={e => setBankDetails(p => ({ ...p, bankName: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none" />
                <input type="text" placeholder="Account Number" value={bankDetails.accountNumber} onChange={e => setBankDetails(p => ({ ...p, accountNumber: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none" />
                <input type="text" placeholder="Account Name" value={bankDetails.accountName} onChange={e => setBankDetails(p => ({ ...p, accountName: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none" />
              </div>

              <div className="p-3 rounded-xl bg-background border border-border/30">
                <p className="text-[10px] text-muted-foreground">• Minimum withdrawal: 2,000 coins (₦20,000)</p>
                <p className="text-[10px] text-muted-foreground">• Withdrawal fee: 10%</p>
                <p className="text-[10px] text-muted-foreground">• Processing time: 24-48 hours</p>
                <p className="text-[10px] text-muted-foreground">• Credited via OPay to your bank account</p>
              </div>

              <button onClick={handleWithdraw} className="w-full py-3 rounded-xl gold-gradient text-primary-foreground font-bold text-sm flex items-center justify-center gap-2">
                <CreditCard className="size-4" /> Submit Withdrawal
              </button>
            </div>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-surface border border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="size-4 text-green-400" />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Earned</span>
            </div>
            <p className="text-lg font-bold text-champagne">{convertValue(earnings.totalReceived)}</p>
            <p className="text-[10px] text-muted-foreground">After 30% platform fee</p>
          </div>
          <div className="p-3 rounded-xl bg-surface border border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="size-4 text-gold" />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Sent</span>
            </div>
            <p className="text-lg font-bold text-champagne">{convertValue(earnings.totalSent)}</p>
            <p className="text-[10px] text-muted-foreground">Total gifts given</p>
          </div>
          <div className="p-3 rounded-xl bg-surface border border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="size-4 text-gold" />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Platform Fees</span>
            </div>
            <p className="text-lg font-bold text-champagne">{convertValue(earnings.platformFees)}</p>
            <p className="text-[10px] text-muted-foreground">30% of gross gifts</p>
          </div>
          <div className="p-3 rounded-xl bg-surface border border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="size-4 text-green-400" />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Net Earnings</span>
            </div>
            <p className="text-lg font-bold text-champagne">{convertValue(earnings.netEarnings)}</p>
            <p className="text-[10px] text-muted-foreground">70% of gross gifts</p>
          </div>
        </div>

        {/* Conversion rates */}
        <div className="p-4 rounded-xl bg-surface border border-border/30">
          <h3 className="text-sm font-semibold text-champagne mb-3">Conversion Rates</h3>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>• 1 JagX Coin = ₦{COIN_TO_NAIRA}</p>
            <p>• 100 JagX Coins = ₦{(100 * COIN_TO_NAIRA).toLocaleString()} ≈ ${(100 * COIN_TO_NAIRA * NAIRA_TO_USD).toFixed(2)}</p>
            <p>• 1,000 JagX Coins = ₦{(1000 * COIN_TO_NAIRA).toLocaleString()} ≈ ${(1000 * COIN_TO_NAIRA * NAIRA_TO_USD).toFixed(2)}</p>
          </div>
        </div>

        {/* How it works */}
        <div className="p-4 rounded-xl bg-surface border border-border/30">
          <h3 className="text-sm font-semibold text-champagne mb-3">How Earnings Work</h3>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>• When someone sends you a gift, JagX Buddy takes a 30% platform fee</p>
            <p>• You receive 70% of the gift value</p>
            <p>• Example: 100 coin gift → You get 70 coins (₦700), Platform gets 30 coins</p>
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
                    <p className="text-sm font-bold text-gold">+{convertValue(g.creator_amount)}</p>
                    <p className="text-[10px] text-muted-foreground">of {convertValue(g.coin_amount)}</p>
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
