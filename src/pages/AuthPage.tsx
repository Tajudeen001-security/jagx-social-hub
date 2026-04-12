import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Mail, Phone, ArrowLeft, Eye, EyeOff } from "lucide-react";

type AuthMode = "login" | "signup";
type AuthMethod = "email" | "phone";

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

  const handleEmailAuth = async () => {
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username, display_name: username },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Welcome to JagX! 🐆");
        navigate("/");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-foreground placeholder:text-muted-foreground outline-none focus:border-primary text-sm"
              required
            />
          )}

          {method === "email" ? (
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-foreground placeholder:text-muted-foreground outline-none focus:border-primary text-sm"
              required
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

          {(method === "email" || (method === "phone" && mode === "signup" && !otpSent)) && (
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

          {otpSent && method === "phone" && (
            <input
              type="text"
              placeholder="Enter OTP code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-foreground placeholder:text-muted-foreground outline-none focus:border-primary text-sm text-center tracking-[0.5em]"
              maxLength={6}
              required
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl gold-gradient text-primary-foreground text-sm font-bold uppercase tracking-widest disabled:opacity-50"
          >
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        {/* Toggle mode */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-gold font-semibold"
          >
            {mode === "login" ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
