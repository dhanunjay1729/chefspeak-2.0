import { X, Sparkles, Settings } from "lucide-react";
import { useState, useEffect } from "react";

export function WelcomeTooltip({ onClose }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    setTimeout(() => setIsVisible(true), 500);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation
  };

  return (
    <div
      className={`absolute top-full right-0 mt-3 z-50 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
    >
      {/* Arrow pointing up */}
      <div className="absolute -top-2 right-4 w-4 h-4 bg-gradient-to-br from-fuchsia-500 to-amber-500 rotate-45 shadow-lg" />
      
      {/* Main tooltip */}
      <div className="relative bg-gradient-to-br from-fuchsia-500 via-purple-500 to-amber-500 p-[2px] rounded-2xl shadow-2xl w-80 animate-pulse-slow">
        <div className="bg-slate-900 rounded-2xl p-5 relative overflow-hidden">
          {/* Background sparkles animation */}
          <div className="absolute inset-0 overflow-hidden">
            <Sparkles className="absolute top-2 right-2 w-4 h-4 text-amber-300 animate-ping opacity-40" />
            <Sparkles className="absolute bottom-3 left-3 w-3 h-3 text-fuchsia-300 animate-ping opacity-40" style={{ animationDelay: '300ms' }} />
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all"
          >
            <X size={16} />
          </button>

          {/* Content */}
          <div className="relative space-y-3">
            {/* Icon and badge */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center shadow-lg">
                <Settings className="w-5 h-5 text-white animate-spin-slow" style={{ animation: 'spin 3s linear infinite' }} />
              </div>
              <div>
                <div className="inline-block px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 text-xs font-bold text-white mb-2">
                  Welcome! 🎉
                </div>
                <h3 className="text-white font-bold text-lg leading-tight">
                  Customize Your Experience
                </h3>
              </div>
            </div>

            {/* Description */}
            <p className="text-slate-300 text-sm leading-relaxed">
              Tap the menu button above to access your profile and customize preferences like language, diet type, allergies, and cooking skill level.
            </p>

            {/* CTA Button */}
            <button
              onClick={handleClose}
              className="w-full mt-4 px-4 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-amber-600 hover:from-fuchsia-500 hover:to-amber-500 text-white font-semibold text-sm shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              Got it!
              <Sparkles size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Animated glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/20 to-amber-500/20 rounded-2xl blur-xl animate-pulse -z-10" />
    </div>
  );
}