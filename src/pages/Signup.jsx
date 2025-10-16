// src/pages/Signup.jsx
import { useNavigate } from "react-router-dom";
import SignupForm from "../components/SignupForm";
import { ChefHat, Flame } from "lucide-react";

export default function Signup() {
  const navigate = useNavigate();

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
                Join thousands of home cooks who are already using ChefSpeak to create personalized, delicious meals every day.
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-4">
              <div className="flex items-start gap-4 group cursor-pointer">
                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-amber-500/20 group-hover:bg-amber-500/40 flex items-center justify-center transition-colors">
                  <Flame size={20} className="text-amber-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold group-hover:text-amber-300 transition-colors">Personalized Recipes</h3>
                  <p className="text-slate-400 text-sm">Get recipes tailored to your dietary preferences and allergies</p>
                </div>
              </div>

              <div className="flex items-start gap-4 group cursor-pointer">
                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/40 flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 7H7v6h6V7z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold group-hover:text-purple-300 transition-colors">Easy to Follow</h3>
                  <p className="text-slate-400 text-sm">Step-by-step guidance with voice support in your language</p>
                </div>
              </div>

              <div className="flex items-start gap-4 group cursor-pointer">
                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-rose-500/20 group-hover:bg-rose-500/40 flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5 text-rose-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.172 16.172a4 4 0 015.656 0M9 10a4 4 0 118 0 4 4 0 01-8 0z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold group-hover:text-rose-300 transition-colors">Health Conscious</h3>
                  <p className="text-slate-400 text-sm">Nutrition info and allergy management built-in</p>
                </div>
              </div>

              <div className="flex items-start gap-4 group cursor-pointer">
                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/40 flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold group-hover:text-blue-300 transition-colors">Build Your Collection</h3>
                  <p className="text-slate-400 text-sm">Save and organize your favorite recipes</p>
                </div>
              </div>
            </div>

            {/* Testimonial */}
            <div className="pt-8 border-t border-slate-700">
              <p className="text-slate-300 italic mb-4">"ChefSpeak completely changed how I cook. No more wasted ingredients or confusion!"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-rose-500"></div>
                <div>
                  <p className="text-white font-semibold text-sm">Sarah M.</p>
                  <p className="text-slate-400 text-xs">Home Chef</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Signup Form */}
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

              <h2 className="text-3xl font-bold text-white mb-2">Get Started</h2>
              <p className="text-slate-300 mb-8">Create your account and unlock personalized cooking</p>

              <SignupForm />

              {/* Divider */}
              <div className="my-8 flex items-center gap-4">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-400 to-transparent"></div>
                <p className="text-slate-400 text-sm">or</p>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-400 to-transparent"></div>
              </div>

              {/* Sign in link */}
              <div className="text-center">
                <p className="text-slate-300">Already have an account?</p>
                <button
                  onClick={() => navigate("/login")}
                  className="mt-3 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white font-semibold transition-all duration-200 hover:shadow-lg active:scale-95 border border-slate-600"
                >
                  Sign In
                </button>
              </div>

              {/* Footer text */}
              <p className="text-center text-slate-400 text-xs mt-6">
                By creating an account, you agree to our{" "}
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
