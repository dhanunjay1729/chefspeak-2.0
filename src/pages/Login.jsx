// src/pages/Login.jsx
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/LoginForm";
import { ChefHat, Flame } from "lucide-react";
import { LoadingSpinner } from "../components/LoadingSpinner"; // ✅ Import
import { useState } from "react";

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false); // ✅ Add state

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-amber-400/20 to-rose-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-br from-fuchsia-500/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Main container */}
      <div className="relative w-full max-w-6xl">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left side - Brand & Benefits */}
          <div className="hidden md:flex flex-col justify-center space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-rose-500 shadow-lg shadow-rose-500/30">
                  <ChefHat size={32} className="text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-extrabold text-white tracking-tight">
                    ChefSpeak
                  </h1>
                  <p className="text-amber-300 text-sm font-medium">Cook Smarter, Eat Better</p>
                </div>
              </div>

              <p className="text-slate-300 text-lg leading-relaxed">
                Your AI-powered culinary companion that transforms ingredients into delicious recipes, respects your dietary preferences, and guides you through every step.
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Flame size={20} className="text-amber-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Personalized Recipes</h3>
                  <p className="text-slate-400 text-sm">Get recipes tailored to your dietary preferences and allergies</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 7H7v6h6V7z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Step-by-Step Guidance</h3>
                  <p className="text-slate-400 text-sm">Clear, numbered steps with voice guidance in your preferred language</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-rose-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-rose-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.172 16.172a4 4 0 015.656 0M9 10a4 4 0 118 0 4 4 0 01-8 0z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Nutrition Insights</h3>
                  <p className="text-slate-400 text-sm">Get detailed nutritional breakdowns for every recipe</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Save Favorites</h3>
                  <p className="text-slate-400 text-sm">Build your personal cookbook of favorite recipes</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-slate-700">
              <div>
                <p className="text-2xl font-bold text-amber-400">1000+</p>
                <p className="text-slate-400 text-sm">Recipes</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-rose-400">10+</p>
                <p className="text-slate-400 text-sm">Languages</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-400">24/7</p>
                <p className="text-slate-400 text-sm">Cooking Help</p>
              </div>
            </div>
          </div>

          {/* Right side - Login Form */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 hover:border-white/30 transition-all duration-300">
              {/* Mobile header */}
              <div className="md:hidden mb-8 text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-rose-500 shadow-lg">
                    <ChefHat size={28} className="text-white" />
                  </div>
                </div>
                <h1 className="text-2xl font-extrabold text-white">ChefSpeak</h1>
                <p className="text-amber-300 text-xs font-medium mt-1">Cook Smarter, Eat Better</p>
              </div>

              <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
              <p className="text-slate-300 mb-8">Sign in to your ChefSpeak account and continue cooking amazing meals</p>

              {/* ✅ Show spinner when loading */}
              {isLoading ? (
                <div className="py-8">
                  <LoadingSpinner text=" Logging you in..." size="lg" />
                </div>
              ) : (
                <LoginForm onLoadingChange={setIsLoading} />
              )}

              {/* Sign up link */}
              <div className="text-center mt-8">
                <p className="text-slate-300">Don't have an account?</p>
                <button
                  onClick={() => navigate("/")}
                  className="mt-3 text-amber-400 hover:text-amber-300 font-semibold transition-colors"
                >
                  Create an Account →
                </button>
              </div>

              {/* Footer text */}
              <p className="text-center text-slate-400 text-xs mt-6">
                By signing in, you agree to our{" "}
                <span className="text-amber-400 hover:text-amber-300 cursor-pointer">Terms</span> and{" "}
                <span className="text-amber-400 hover:text-amber-300 cursor-pointer">Privacy Policy</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
