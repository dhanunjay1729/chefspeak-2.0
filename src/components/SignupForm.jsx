// src/components/SignupForm.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../firebase";
import { Mail, Lock, User, Loader2, AlertCircle, CheckCircle } from "lucide-react";

export default function SignupForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();

  const calculatePasswordStrength = (pwd) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    setPasswordStrength(strength);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!fullName || !email || !password || !confirmPassword) {
        setError("Please fill in all fields");
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match");
        setLoading(false);
        return;
      }

      if (password.length < 8) {
        setError("Password must be at least 8 characters");
        setLoading(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: fullName });
      
      navigate("/dashboard");
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered");
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address");
      } else {
        setError("Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 0:
      case 1:
        return "bg-red-500";
      case 2:
        return "bg-yellow-500";
      case 3:
        return "bg-lime-500";
      case 4:
        return "bg-green-500";
      default:
        return "bg-slate-600";
    }
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 0:
      case 1:
        return "Weak";
      case 2:
        return "Fair";
      case 3:
        return "Good";
      case 4:
        return "Strong";
      default:
        return "";
    }
  };

  return (
    <form onSubmit={handleSignup} className="space-y-5">
      {/* Full Name Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-200">Full Name</label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Doe"
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all duration-200"
          />
        </div>
      </div>

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
            onChange={(e) => {
              setPassword(e.target.value);
              calculatePasswordStrength(e.target.value);
            }}
            placeholder="••••••••"
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all duration-200"
          />
        </div>
        
        {/* Password Strength Indicator */}
        {password && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getPasswordStrengthColor()} transition-all duration-300`}
                  style={{ width: `${(passwordStrength / 4) * 100}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium text-slate-400">{getPasswordStrengthText()}</span>
            </div>
            <p className="text-xs text-slate-400">
              ✓ Use 8+ characters, mix of letters, numbers & symbols
            </p>
          </div>
        )}
      </div>

      {/* Confirm Password Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-200">Confirm Password</label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all duration-200"
          />
          {confirmPassword && password === confirmPassword && (
            <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-green-400" size={20} />
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
          <AlertCircle className="flex-shrink-0 text-red-400 mt-0.5" size={18} />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Terms */}
      <label className="flex items-start gap-2 cursor-pointer group">
        <input
          type="checkbox"
          required
          className="w-4 h-4 rounded border-slate-400 bg-white/5 border text-amber-500 focus:ring-2 focus:ring-amber-500/20 mt-1"
        />
        <span className="text-xs text-slate-300 group-hover:text-slate-200 transition-colors">
          I agree to the Terms of Service and Privacy Policy
        </span>
      </label>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-rose-500/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Creating Account...
          </>
        ) : (
          "Create Account"
        )}
      </button>
    </form>
  );
}
