// src/components/SignupForm.jsx
// this code is responsible for rendering a signup form that allows users to create an account using email/password or Google sign-in.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup } from "firebase/auth";
import { auth, db, googleProvider } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { Mail, Lock, User, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { serverWakeService } from "../services/serverWakeService";

export default function SignupForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) return false;
    const domain = email.split('@')[1];
    if (!domain || domain.split('.').length < 2) return false;
    if (email.includes('..') || email.startsWith('.') || email.endsWith('.')) return false;
    return true;
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    if (value && !validateEmail(value)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  const calculatePasswordStrength = (pwd) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    setPasswordStrength(strength);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return "bg-red-500";
    if (passwordStrength === 3) return "bg-yellow-500";
    if (passwordStrength === 4) return "bg-lime-500";
    if (passwordStrength === 5) return "bg-green-500";
    return "bg-slate-600";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 2) return "Weak";
    if (passwordStrength === 3) return "Fair";
    if (passwordStrength === 4) return "Good";
    if (passwordStrength === 5) return "Strong";
    return "";
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!fullName || !email || !password || !confirmPassword) {
        setError("Please fill in all fields");
        return;
      }

      if (!validateEmail(email)) {
        setError("Please enter a valid email address");
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      if (password.length < 8) {
        setError("Password must be at least 8 characters");
        return;
      }

      if (passwordStrength < 3) {
        setError("Password is too weak. Use uppercase, lowercase, numbers & symbols");
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (fullName) {
        await updateProfile(user, { displayName: fullName });
      }

      await setDoc(doc(db, "users", user.uid), {
        displayName: fullName || "",
        email: user.email,
        preferredLanguage: "indian_english",
        skill: "beginner",
        diet: "nonveg",
        allergies: [],
        dislikes: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        provider: "email",
      });

      serverWakeService.wakeServer();
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

  const handleGoogleSignUp = async () => {
    setError("");
    setGoogleLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);

      const userDocRef = doc(db, "users", result.user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          displayName: result.user.displayName || "",
          email: result.user.email,
          photoURL: result.user.photoURL || "",
          preferredLanguage: "indian_english",
          skill: "beginner",
          diet: "nonveg",
          allergies: [],
          dislikes: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          provider: "google",
        });
      }

      serverWakeService.wakeServer();
      navigate("/dashboard");
      
    } catch (error) {
      let errorMessage = "Failed to sign in with Google";
      
      if (error.code === "auth/popup-closed-by-user") {
        errorMessage = "Sign-in cancelled";
      } else if (error.code === "auth/popup-blocked") {
        errorMessage = "Popup blocked! Please allow popups";
      } else if (error.code === "auth/unauthorized-domain") {
        errorMessage = `Domain not authorized: ${window.location.hostname}`;
      } else if (error.code === "auth/operation-not-allowed") {
        errorMessage = "Google sign-in not enabled in Firebase";
      } else if (error.code === "auth/network-request-failed") {
        errorMessage = "Network error. Check your connection";
      }

      setError(errorMessage);
    } finally {
      setGoogleLoading(false);
    }
  };

  if (googleLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-12 h-12 rounded-full border-4 border-amber-200 border-t-amber-600 animate-spin mb-4" />
        <p className="text-slate-300">Signing in with Google...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSignup} className="space-y-5">
        {/* Full Name */}
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

        {/* Email */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-200">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="you@example.com"
              className={`w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border ${
                emailError ? "border-red-500/50" : "border-white/10"
              } text-white placeholder-slate-400 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all duration-200`}
            />
            {email && !emailError && validateEmail(email) && (
              <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-green-400" size={20} />
            )}
          </div>
          {emailError && (
            <p className="text-red-400 text-xs flex items-center gap-1">
              <AlertCircle size={12} />
              {emailError}
            </p>
          )}
        </div>

        {/* Password */}
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

          {password && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getPasswordStrengthColor()} transition-all duration-300`}
                    style={{ width: `${(passwordStrength / 5) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-slate-400">{getPasswordStrengthText()}</span>
              </div>
              <p className="text-xs text-slate-400">
                ✓ 8+ chars with uppercase, lowercase, numbers & symbols
              </p>
            </div>
          )}
        </div>

        {/* Confirm Password */}
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

        {/* Error */}
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

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || googleLoading || !!emailError}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-rose-500/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span>Creating account...</span>
            </>
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-slate-600" />
        <span className="text-slate-400 text-sm">or</span>
        <div className="flex-1 h-px bg-slate-600" />
      </div>

      {/* Google Button */}
      <button
        onClick={handleGoogleSignUp}
        disabled={loading || googleLoading}
        type="button"
        className="w-full py-3 px-4 rounded-xl bg-white hover:bg-gray-50 disabled:bg-slate-600 text-slate-900 disabled:text-slate-400 font-semibold transition-all duration-200 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center gap-3 border border-slate-200"
      >
        {googleLoading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Signing Up...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </>
        )}
      </button>
    </div>
  );
}
