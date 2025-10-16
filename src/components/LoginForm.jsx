// src/components/LoginForm.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { Mail, Lock, Loader2, AlertCircle } from "lucide-react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!email || !password) {
        setError("Please fill in all fields");
        setLoading(false);
        return;
      }

      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address");
      } else {
        setError("Failed to sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-5">
      {/* Email Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-200">Email Address</label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all duration-200"
          />
        </div>
      </div>

      {/* Password Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-200">Password</label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all duration-200"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
          <AlertCircle className="flex-shrink-0 text-red-400 mt-0.5" size={18} />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Remember & Forgot */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-slate-400 bg-white/5 border text-amber-500 focus:ring-2 focus:ring-amber-500/20"
          />
          <span className="text-sm text-slate-300">Remember me</span>
        </label>
        <button
          type="button"
          className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
        >
          Forgot password?
        </button>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-rose-500/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Signing In...
          </>
        ) : (
          "Sign In"
        )}
      </button>
    </form>
  );
}
