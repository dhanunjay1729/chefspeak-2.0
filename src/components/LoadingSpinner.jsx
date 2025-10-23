import { ChefHat, Sparkles } from "lucide-react";

export function FullPageLoader({ text = "Loading..." }) {
  return (
    <div className="fixed inset-0 z-50 min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-amber-400/20 to-rose-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-fuchsia-500/20 to-purple-600/20 rounded-full blur-3xl animate-float-delayed" />
      </div>

      {/* Main loader content */}
      <div className="relative z-10 text-center space-y-8 px-4">
        {/* Rotating ring with chef hat */}
        <div className="relative inline-block">
          {/* Outer rotating ring */}
          <div className="w-32 h-32 rounded-full border-4 border-transparent border-t-amber-400 border-r-rose-500 animate-spin" />
          
          {/* Inner pulsing circle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-rose-500 animate-pulse flex items-center justify-center shadow-2xl">
              <ChefHat className="w-10 h-10 text-white animate-bounce" />
            </div>
          </div>
          
          {/* Corner sparkles */}
          <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-fuchsia-400 animate-ping" />
          <Sparkles className="absolute -bottom-2 -left-2 w-6 h-6 text-amber-400 animate-ping" style={{ animationDelay: '150ms' }} />
        </div>

        {/* Loading text */}
        <div className="space-y-2">
          <p className="text-2xl font-bold text-white animate-pulse">{text}</p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" />
            <div className="w-2 h-2 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: '100ms' }} />
            <div className="w-2 h-2 rounded-full bg-fuchsia-400 animate-bounce" style={{ animationDelay: '200ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function LoadingSpinner({ size = "md", text }) {
  const sizes = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16"
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative">
        <div className={`${sizes[size]} rounded-full border-4 border-zinc-200 border-t-amber-500 animate-spin`} />
      </div>
      {text && (
        <p className="text-sm font-medium text-zinc-600 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}