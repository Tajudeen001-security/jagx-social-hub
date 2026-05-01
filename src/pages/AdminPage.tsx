import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Shield, Users, BadgeCheck, Coins, Trash2, CheckCircle, XCircle, ArrowLeft, Search, Download, Receipt, Globe, ExternalLink, RefreshCw } from "lucide-react";

const AdminPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"users" | "verification" | "transactions" | "ledger" | "seo">("users");
  const [users, setUsers] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [seoChecks, setSeoChecks] = useState<{
    metaTag: boolean | null;
    htmlFile: boolean | null;
    gaLoaded: boolean | null;
    indexed: "checking" | "unknown";
    checking: boolean;
  }>({ metaTag: null, htmlFile: null, gaLoaded: null, indexed: "unknown", checking: false });

  const GA_ID = "G-LZWPQ1VYYN";
  const VERIFICATION_TOKEN = "Qklb38Qlmn1f5eBxEIPeHH13MMiczi7OpXnuUkQ9a84";
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";

  const runSeoChecks = async () => {
    setSeoChecks(s => ({ ...s, checking: true }));
    // Meta tag check
    const meta = document.querySelector('meta[name="google-site-verification"]') as HTMLMetaElement | null;
    const metaOk = !!meta && meta.content === VERIFICATION_TOKEN;

    // HTML file check
    let htmlOk = false;
    try {
      const res = await fetch(`/google${VERIFICATION_TOKEN}.html`, { cache: "no-store" });
      htmlOk = res.ok;
    } catch {}

    // GA loaded
    const gaOk = typeof (window as any).gtag === "function" && Array.isArray((window as any).dataLayer);

    setSeoChecks({ metaTag: metaOk, htmlFile: htmlOk, gaLoaded: gaOk, indexed: "unknown", checking: false });
  };

  useEffect(() => {
    if (tab === "seo") runSeoChecks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    if (!user) return;
    checkAdmin();
  }, [user]);

  const checkAdmin = async () => {
    // Check user_roles table
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", user!.id);
    const admin = data?.some(r => r.role === "admin") || false;

    // Also check if this is the JagX account by email
    if (!admin && user?.email === "jagwazorld@gmail.com") {
      // Auto-assign admin role
      await supabase.from("user_roles").upsert({ user_id: user!.id, role: "admin" as any }, { onConflict: "user_id,role" });
      setIsAdmin(true);
    } else {
      setIsAdmin(admin);
    }
    setLoading(false);
    if (admin || user?.email === "jagwazorld@gmail.com") loadData();
  };

  const loadData = async () => {
    const [profilesRes, verificationsRes, transactionsRes, ledgerRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("verification_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("coin_transactions").select("*").eq("transaction_type", "withdrawal").order("created_at", { ascending: false }),
      supabase.from("gift_ledger" as any).select("*").order("created_at", { ascending: false }).limit(1000),
    ]);
    if (profilesRes.data) setUsers(profilesRes.data);
    if (verificationsRes.data) setVerifications(verificationsRes.data);
    if (transactionsRes.data) setTransactions(transactionsRes.data);
    if (ledgerRes.data) setLedger(ledgerRes.data as any[]);
  };

  const exportLedgerCsv = () => {
    if (ledger.length === 0) { toast.error("Nothing to export"); return; }
    const headers = ["created_at","gift_id","sender_username","recipient_username","debit_amount","creator_credit","platform_fee","gift_type","live_stream_id","post_id"];
    const rows = ledger.map(g => [
      g.created_at, g.gift_id,
      g.sender_username || g.sender_id, g.recipient_username || g.recipient_id,
      g.debit_amount, g.credit_amount, g.platform_fee,
      g.gift_type, g.live_stream_id || "", g.post_id || "",
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v ?? "").replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `jagx-gift-ledger-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("Ledger exported");
  };

  const totals = ledger.reduce(
    (acc, g) => ({
      gross: acc.gross + (g.debit_amount || 0),
      creator: acc.creator + (g.credit_amount || 0),
      platform: acc.platform + (g.platform_fee || 0),
    }),
    { gross: 0, creator: 0, platform: 0 }
  );

  const toggleVerification = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase.from("profiles").update({ is_verified: !currentStatus }).eq("user_id", userId);
    if (error) { toast.error("Failed"); return; }
    setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, is_verified: !currentStatus } : u));
    toast.success(!currentStatus ? "User verified! ✅" : "Verification removed");
  };

  const updateCoins = async (userId: string, amount: number) => {
    const { error } = await supabase.from("profiles").update({ jagx_coins: amount }).eq("user_id", userId);
    if (error) { toast.error("Failed"); return; }
    setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, jagx_coins: amount } : u));
    toast.success("Coins updated!");
  };

  const deleteUser = async (userId: string) => {
    // Delete profile (cascade will handle related data)
    await supabase.from("profiles").delete().eq("user_id", userId);
    setUsers(prev => prev.filter(u => u.user_id !== userId));
    toast.success("User removed");
  };

  const filteredUsers = users.filter(u =>
    (u.username || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.display_name || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="size-10 rounded-full border-2 border-gold border-t-transparent animate-spin" />
    </div>
  );

  if (!isAdmin) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      <Shield className="size-16 text-red-400" />
      <h1 className="text-xl font-bold text-foreground">Access Denied</h1>
      <p className="text-sm text-muted-foreground">You don't have admin privileges.</p>
      <button onClick={() => navigate("/")} className="px-6 py-2 rounded-xl gold-gradient text-primary-foreground text-sm font-bold">Go Home</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)} className="text-foreground"><ArrowLeft className="size-5" /></button>
          <Shield className="size-5 text-gold" />
          <h1 className="text-sm font-semibold text-champagne">Admin Panel</h1>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-border/30">
        {[
          { key: "users", icon: Users, label: "Users" },
          { key: "verification", icon: BadgeCheck, label: "Verify" },
          { key: "transactions", icon: Coins, label: "Withdrawals" },
          { key: "ledger", icon: Receipt, label: "Ledger" },
          { key: "seo", icon: Globe, label: "SEO" },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`flex-1 py-3 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors ${tab === t.key ? "text-gold border-b-2 border-gold" : "text-muted-foreground"}`}>
            <t.icon className="size-4" /> {t.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {tab === "users" && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none" />
            </div>
            <p className="text-xs text-muted-foreground">{users.length} total users</p>
            {filteredUsers.map(u => (
              <div key={u.id} className="p-3 rounded-xl bg-surface border border-border/30 space-y-2">
                <div className="flex items-center gap-3">
                  <img src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} className="size-10 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-semibold text-foreground truncate">{u.display_name || u.username}</p>
                      {u.is_verified && <BadgeCheck className="size-3.5 text-gold flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground">@{u.username} • {u.jagx_coins} coins</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleVerification(u.user_id, u.is_verified)}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase flex items-center justify-center gap-1 ${u.is_verified ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
                    {u.is_verified ? <><XCircle className="size-3" /> Unverify</> : <><CheckCircle className="size-3" /> Verify</>}
                  </button>
                  <button onClick={() => {
                    const amount = prompt("Set coins:", String(u.jagx_coins));
                    if (amount !== null) updateCoins(u.user_id, parseInt(amount) || 0);
                  }} className="flex-1 py-1.5 rounded-lg bg-gold/20 text-gold text-[10px] font-bold uppercase flex items-center justify-center gap-1">
                    <Coins className="size-3" /> Set Coins
                  </button>
                  <button onClick={() => deleteUser(u.user_id)}
                    className="py-1.5 px-3 rounded-lg bg-red-500/20 text-red-400 text-[10px] font-bold uppercase">
                    <Trash2 className="size-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "verification" && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">{verifications.length} verification requests</p>
            {verifications.map(v => (
              <div key={v.id} className="p-3 rounded-xl bg-surface border border-border/30 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">User: {v.user_id.slice(0, 8)}...</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${v.status === "approved" ? "bg-green-500/20 text-green-400" : v.status === "rejected" ? "bg-red-500/20 text-red-400" : "bg-gold/20 text-gold"}`}>
                    {v.status}
                  </span>
                </div>
                {v.payment_proof_url && <img src={v.payment_proof_url} className="w-full h-32 object-cover rounded-lg" />}
                {v.status === "pending" && (
                  <div className="flex gap-2">
                    <button onClick={async () => {
                      await supabase.from("profiles").update({ is_verified: true }).eq("user_id", v.user_id);
                      // Can't update verification_requests due to RLS - handled via admin
                      toast.success("Approved!");
                      loadData();
                    }} className="flex-1 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-[10px] font-bold uppercase">
                      Approve
                    </button>
                    <button onClick={() => { toast.info("Rejected"); loadData(); }}
                      className="flex-1 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-[10px] font-bold uppercase">
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
            {verifications.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No verification requests</p>}
          </div>
        )}

        {tab === "transactions" && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">{transactions.length} withdrawal requests</p>
            {transactions.map(t => (
              <div key={t.id} className="p-3 rounded-xl bg-surface border border-border/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground font-semibold">{t.amount} coins</p>
                    <p className="text-xs text-muted-foreground">₦{(t.amount * 10).toLocaleString()}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${t.status === "completed" ? "bg-green-500/20 text-green-400" : t.status === "rejected" ? "bg-red-500/20 text-red-400" : "bg-gold/20 text-gold"}`}>
                    {t.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">User: {t.user_id.slice(0, 8)}... • {new Date(t.created_at).toLocaleDateString()}</p>
              </div>
            ))}
            {transactions.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No withdrawal requests</p>}
          </div>
        )}

        {tab === "ledger" && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-xl bg-surface border border-border/30">
                <p className="text-[10px] uppercase text-muted-foreground">Gross</p>
                <p className="text-sm font-bold text-foreground">🪙 {totals.gross.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-surface border border-border/30">
                <p className="text-[10px] uppercase text-muted-foreground">Creators (70%)</p>
                <p className="text-sm font-bold text-gold">🪙 {totals.creator.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-surface border border-border/30">
                <p className="text-[10px] uppercase text-muted-foreground">Platform (30%)</p>
                <p className="text-sm font-bold text-foreground">🪙 {totals.platform.toLocaleString()}</p>
              </div>
            </div>
            <button onClick={exportLedgerCsv} className="w-full py-2.5 rounded-xl gold-gradient text-primary-foreground font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2">
              <Download className="size-4" /> Download CSV Report
            </button>
            <p className="text-xs text-muted-foreground">{ledger.length} gift entries</p>
            <div className="space-y-2">
              {ledger.map((g) => (
                <div key={g.gift_id} className="p-3 rounded-xl bg-surface border border-border/30">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-foreground">
                      <span className="text-muted-foreground">@{g.sender_username || g.sender_id?.slice(0,6)}</span>
                      <span className="mx-1 text-muted-foreground">→</span>
                      <span className="font-semibold">@{g.recipient_username || g.recipient_id?.slice(0,6)}</span>
                    </p>
                    <span className="text-[10px] uppercase font-bold text-gold">{g.gift_type}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px]">
                    <span className="text-foreground">Debit 🪙{g.debit_amount}</span>
                    <span className="text-gold">Credit 🪙{g.credit_amount}</span>
                    <span className="text-muted-foreground">Fee 🪙{g.platform_fee}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{new Date(g.created_at).toLocaleString()}</p>
                </div>
              ))}
              {ledger.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No gifts recorded yet</p>}
            </div>
          </div>
        )}

        {tab === "seo" && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-surface border border-border/30 space-y-1">
              <p className="text-[10px] uppercase text-muted-foreground tracking-widest">Site URL</p>
              <p className="text-xs text-foreground break-all">{siteUrl}</p>
              <p className="text-[10px] uppercase text-muted-foreground tracking-widest mt-2">GA4 Measurement ID</p>
              <p className="text-xs text-gold font-mono">{GA_ID}</p>
              <p className="text-[10px] uppercase text-muted-foreground tracking-widest mt-2">Verification Token</p>
              <p className="text-[10px] text-foreground font-mono break-all">{VERIFICATION_TOKEN}</p>
            </div>

            <button onClick={runSeoChecks} disabled={seoChecks.checking}
              className="w-full py-2 rounded-xl bg-surface border border-border text-xs font-bold uppercase tracking-widest text-foreground flex items-center justify-center gap-2">
              <RefreshCw className={`size-3 ${seoChecks.checking ? "animate-spin" : ""}`} /> Re-run checks
            </button>

            <div className="space-y-2">
              {[
                { label: "Google verification meta tag", ok: seoChecks.metaTag, hint: "Present in <head> of index.html" },
                { label: "Google verification HTML file", ok: seoChecks.htmlFile, hint: `/google${VERIFICATION_TOKEN}.html reachable` },
                { label: "Google Analytics (gtag.js) loaded", ok: seoChecks.gaLoaded, hint: "window.gtag and dataLayer ready" },
              ].map(c => (
                <div key={c.label} className="p-3 rounded-xl bg-surface border border-border/30 flex items-start gap-3">
                  {c.ok === null ? (
                    <div className="size-4 mt-0.5 rounded-full border border-muted-foreground/40" />
                  ) : c.ok ? (
                    <CheckCircle className="size-4 mt-0.5 text-green-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="size-4 mt-0.5 text-red-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{c.label}</p>
                    <p className="text-[11px] text-muted-foreground">{c.hint}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase ${c.ok ? "text-green-400" : c.ok === false ? "text-red-400" : "text-muted-foreground"}`}>
                    {c.ok === null ? "..." : c.ok ? "OK" : "Missing"}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Search Console</p>
              {[
                { label: "Open Search Console", url: "https://search.google.com/search-console" },
                { label: "Verify ownership (URL prefix)", url: `https://search.google.com/search-console/welcome?siteUrl=${encodeURIComponent(siteUrl)}` },
                { label: "Check URL indexing status", url: `https://search.google.com/search-console/inspect?resource_id=${encodeURIComponent(siteUrl)}&id=${encodeURIComponent(siteUrl)}` },
                { label: "Submit sitemap", url: `https://search.google.com/search-console/sitemaps?resource_id=${encodeURIComponent(siteUrl)}` },
                { label: "Performance report", url: `https://search.google.com/search-console/performance/search-analytics?resource_id=${encodeURIComponent(siteUrl)}` },
                { label: "Google site:search (is it indexed?)", url: `https://www.google.com/search?q=site:${encodeURIComponent(siteUrl.replace(/^https?:\/\//,""))}` },
              ].map(l => (
                <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-surface border border-border/30 flex items-center justify-between hover:border-gold/40 transition-colors">
                  <span className="text-sm text-foreground">{l.label}</span>
                  <ExternalLink className="size-4 text-gold" />
                </a>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Google Analytics</p>
              {[
                { label: "Open GA4 Realtime", url: `https://analytics.google.com/analytics/web/#/p/realtime/overview` },
                { label: "Open GA4 Reports", url: `https://analytics.google.com/analytics/web/` },
                { label: "Send test event", action: () => {
                  if (typeof window.gtag === "function") {
                    window.gtag("event", "admin_test_event", { source: "admin_panel", ts: Date.now() });
                    toast.success("Test event sent to GA4");
                  } else { toast.error("gtag not loaded yet"); }
                }},
              ].map(l => l.url ? (
                <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-surface border border-border/30 flex items-center justify-between hover:border-gold/40 transition-colors">
                  <span className="text-sm text-foreground">{l.label}</span>
                  <ExternalLink className="size-4 text-gold" />
                </a>
              ) : (
                <button key={l.label} onClick={l.action}
                  className="w-full p-3 rounded-xl bg-surface border border-border/30 flex items-center justify-between hover:border-gold/40 transition-colors text-left">
                  <span className="text-sm text-foreground">{l.label}</span>
                  <span className="text-[10px] font-bold uppercase text-gold">Run</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
