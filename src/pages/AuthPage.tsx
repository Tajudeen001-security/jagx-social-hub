import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Mail, Phone, ArrowLeft, Eye, EyeOff } from "lucide-react";

type AuthMode = "login" | "signup" | "forgot";
type AuthMethod = "email" | "phone";
type CodeStep = "request" | "verify";

const COUNTRIES = ["Nigeria","United States","United Kingdom","Ghana","South Africa","Kenya","Canada","Germany","France","India","Brazil","Other"];

const AuthPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [method, setMethod] = useState<AuthMethod>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [forgotStep, setForgotStep] = useState<CodeStep>("request");
  const [signupStep, setSignupStep] = useState<CodeStep>("request");
  const [newPassword, setNewPassword] = useState("");
  // Expanded signup profile fields
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [sex, setSex] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [detectedIp, setDetectedIp] = useState<string | null>(null);
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const ageFromDob = (d: string) => {
    if (!d) return 0;
    const dt = new Date(d);
    const diff = Date.now() - dt.getTime();
    return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
  };

  const detectLocation = async () => {
    setGeoLoading(true);
    try {
      const res = await fetch("https://ipapi.co/json/");
      const j = await res.json();
      if (j?.country_name) {
        setDetectedCountry(j.country_name);
        setDetectedIp(j.ip || null);
        setCountry(j.country_name);
        if (j.region) setRegion(j.region);
        if (j.city) setCity(j.city);
        toast.success(`Location detected: ${j.country_name}`);
      }
    } catch { toast.error("Couldn't auto-detect location, please pick manually"); }
    finally { setGeoLoading(false); }
  };

  const persistProfileFields = async (userId: string) => {
    await supabase.from("profiles").update({
      first_name: firstName || null,
      middle_name: middleName || null,
      last_name: lastName || null,
      date_of_birth: dob || null,
      sex: sex || null,
      country: country || detectedCountry || null,
      region: region || null,
      city: city || null,
      address: address || null,
      signup_ip: detectedIp,
      signup_country: detectedCountry,
      last_known_country: detectedCountry,
      country_locked: !!detectedCountry,
      location: [city, country].filter(Boolean).join(", ") || null,
    } as any).eq("user_id", userId);
  };

  const handleSocial = async (provider: "google" | "apple") => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
      if (result.error) throw result.error;
      if (result.redirected) return; // browser redirects
      navigate("/");
    } catch (e: any) {
      toast.error(e?.message || `${provider} sign-in failed`);
    } finally { setLoading(false); }
  };

  // Email OTP via Supabase's built-in mailer — no Resend / no domain verification needed.
  // The default Supabase email template embeds a 6-digit {{ .Token }}.

  const handleForgotPassword = async () => {
    setLoading(true);
    try {
      if (forgotStep === "request") {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { shouldCreateUser: false },
        });
        if (error) throw error;
        setForgotStep("verify");
        toast.success("We emailed you a 6-digit code");
      } else {
        const { error: vErr } = await supabase.auth.verifyOtp({
          email,
          token: otp.replace(/\D/g, "").slice(-6),
          type: "email",
        });
        if (vErr) throw vErr;
        // Session is now active — update password.
        const { error: uErr } = await supabase.auth.updateUser({ password: newPassword });
        if (uErr) throw uErr;
        toast.success("Password reset. Welcome back!");
        navigate("/");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    setLoading(true);
    try {
      if (mode === "signup") {
        if (signupStep === "request") {
          if (!password || password.length < 6) {
            throw new Error("Choose a password (min 6 chars) before we send the code");
          }
          if (!firstName || !lastName) throw new Error("First and last name are required");
          if (!dob || ageFromDob(dob) < 13) throw new Error("You must be at least 13 years old");
          if (!sex) throw new Error("Please select your sex");
          if (!country) throw new Error("Country is required — tap Auto-detect");
          const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
              shouldCreateUser: true,
              data: { username, display_name: username },
            },
          });
          if (error) throw error;
          setSignupStep("verify");
          toast.success("We emailed you a 6-digit code");
        } else {
          const { error: vErr } = await supabase.auth.verifyOtp({
            email,
            token: otp.replace(/\D/g, "").slice(-6),
            type: "email",
          });
          if (vErr) throw vErr;
          // Session active — set the chosen password so the user can use email+password later.
          const { error: uErr } = await supabase.auth.updateUser({ password });
          if (uErr) throw uErr;
          // Persist the full profile fields we collected on step 1.
          const { data: { user: u } } = await supabase.auth.getUser();
          if (u) await persistProfileFields(u.id);
          toast.success("Welcome to JagX! 🐆");
          navigate("/");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate("/");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneAuth = async () => {
    setLoading(true);
    try {
      if (!otpSent) {
        if (mode === "signup") {
          const { error } = await supabase.auth.signUp({
            phone,
            password,
            options: { data: { username, display_name: username } },
          });
          if (error) throw error;
        } else {
          const { error } = await supabase.auth.signInWithOtp({ phone });
          if (error) throw error;
        }
        setOtpSent(true);
        toast.success("OTP sent to your phone!");
      } else {
        const { error } = await supabase.auth.verifyOtp({
          phone,
          token: otp,
          type: mode === "signup" ? "sms" : "sms",
        });
        if (error) throw error;
        toast.success("Welcome!");
        navigate("/");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "forgot") return handleForgotPassword();
    if (method === "email") handleEmailAuth();
    else handlePhoneAuth();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="p-4">
        <button onClick={() => navigate("/")} className="text-muted-foreground">
          <ArrowLeft className="size-5" />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 pb-12">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-display italic text-4xl text-gold mb-2">JagX</h1>
          <p className="text-sm text-muted-foreground">Buddy Connect 2.0</p>
        </div>

        {/* Auth method tabs */}
        {mode !== "forgot" && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => { setMethod("email"); setOtpSent(false); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors ${
              method === "email" ? "gold-gradient text-primary-foreground" : "bg-surface border border-border text-foreground"
            }`}
          >
            <Mail className="size-4" /> Email
          </button>
          <button
            onClick={() => { setMethod("phone"); setOtpSent(false); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors ${
              method === "phone" ? "gold-gradient text-primary-foreground" : "bg-surface border border-border text-foreground"
            }`}
          >
            <Phone className="size-4" /> Phone
          </button>
        </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <>
              <input type="text" placeholder="Username (public handle)" value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-foreground placeholder:text-muted-foreground outline-none focus:border-primary text-sm" required />
              {signupStep === "request" && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="First name" value={firstName} onChange={e => setFirstName(e.target.value)}
                      className="px-3 py-3 rounded-xl bg-surface border border-border text-foreground placeholder:text-muted-foreground outline-none focus:border-primary text-sm" required />
                    <input type="text" placeholder="Last name" value={lastName} onChange={e => setLastName(e.target.value)}
                      className="px-3 py-3 rounded-xl bg-surface border border-border text-foreground placeholder:text-muted-foreground outline-none focus:border-primary text-sm" required />
                  </div>
                  <input type="text" placeholder="Middle name (optional)" value={middleName} onChange={e => setMiddleName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-foreground placeholder:text-muted-foreground outline-none focus:border-primary text-sm" />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Date of birth</label>
                      <input type="date" value={dob} onChange={e => setDob(e.target.value)}
                        className="w-full px-3 py-3 rounded-xl bg-surface border border-border text-foreground outline-none focus:border-primary text-sm" required />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Sex</label>
                      <select value={sex} onChange={e => setSex(e.target.value)}
                        className="w-full px-3 py-3 rounded-xl bg-surface border border-border text-foreground outline-none focus:border-primary text-sm" required>
                        <option value="">Select…</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <button type="button" onClick={detectLocation} disabled={geoLoading}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-gold/30 text-gold text-xs font-bold uppercase tracking-widest disabled:opacity-50">
                    {geoLoading ? "Detecting…" : detectedCountry ? `📍 ${detectedCountry} (auto)` : "Auto-detect my location"}
                  </button>
                  <select value={country} onChange={e => setCountry(e.target.value)}
                    disabled={!!detectedCountry}
                    className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-foreground outline-none focus:border-primary text-sm disabled:opacity-70" required>
                    <option value="">Country *</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="Region / State" value={region} onChange={e => setRegion(e.target.value)}
                      className="px-3 py-3 rounded-xl bg-surface border border-border text-foreground placeholder:text-muted-foreground outline-none focus:border-primary text-sm" />
                    <input type="text" placeholder="City" value={city} onChange={e => setCity(e.target.value)}
                      className="px-3 py-3 rounded-xl bg-surface border border-border text-foreground placeholder:text-muted-foreground outline-none focus:border-primary text-sm" />
                  </div>
                  <input type="text" placeholder="Address (optional)" value={address} onChange={e => setAddress(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-foreground placeholder:text-muted-foreground outline-none focus:border-primary text-sm" />
                </>
              )}
            </>
          )}

          {(mode === "forgot" || method === "email") ? (
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-foreground placeholder:text-muted-foreground outline-none focus:border-primary text-sm"
              required
              disabled={mode === "forgot" && forgotStep === "verify"}
            />
          ) : (
            <input
              type="tel"
              placeholder="Phone number (+234...)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-foreground placeholder:text-muted-foreground outline-none focus:border-primary text-sm"
              required
            />
          )}

          {mode !== "forgot" && (method === "email" || (method === "phone" && mode === "signup" && !otpSent)) && (
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-foreground placeholder:text-muted-foreground outline-none focus:border-primary text-sm pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          )}

          {((otpSent && method === "phone") || (mode === "forgot" && forgotStep === "verify") || (mode === "signup" && signupStep === "verify" && method === "email")) && (
            <input
              type="text"
              placeholder="6-digit code from email"
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-foreground placeholder:text-muted-foreground outline-none focus:border-primary text-sm text-center tracking-[0.5em]"
              maxLength={6}
              required
            />
          )}

          {mode === "forgot" && forgotStep === "verify" && (
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-foreground placeholder:text-muted-foreground outline-none focus:border-primary text-sm"
              minLength={6}
              required
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl gold-gradient text-primary-foreground text-sm font-bold uppercase tracking-widest disabled:opacity-50"
          >
            {loading
              ? "Please wait..."
              : mode === "forgot"
                ? (forgotStep === "request" ? "Send 6-digit Code" : "Verify & Reset Password")
                : mode === "login"
                  ? "Sign In"
                  : (signupStep === "request" ? "Send 6-digit Code" : "Verify & Create Account")}
          </button>
        </form>

        {/* Forgot password link */}
        {mode === "login" && (
          <p className="text-center text-sm mt-4">
            <button
              onClick={() => { setMode("forgot"); setForgotStep("request"); setOtp(""); setNewPassword(""); }}
              className="text-gold font-semibold"
              type="button"
            >
              Forgot password?
            </button>
          </p>
        )}

        {/* Toggle mode */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          {mode === "forgot" ? (
            <button onClick={() => setMode("login")} className="text-gold font-semibold" type="button">
              Back to Sign In
            </button>
          ) : (
          <>
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-gold font-semibold"
            type="button"
          >
            {mode === "login" ? "Sign Up" : "Sign In"}
          </button>
          </>
          )}
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
