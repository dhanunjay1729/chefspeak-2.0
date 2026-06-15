import { motion } from "framer-motion";
import { Volume2 } from "lucide-react";
import { Button } from "./ui/button";

export function RecipeStep({ 
  step, 
  index, 
  isActive, 
  onSpeak, 
  onStartTimer 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        scale: isActive ? 1.03 : 1,
      }}
      transition={{ 
        delay: index * 0.1,
        scale: { type: "spring", stiffness: 300, damping: 25 }
      }}
      className={`rounded-xl p-5 flex flex-col space-y-3 transition-all duration-300 ${
        isActive 
          ? "bg-white border-2 border-fuchsia-500 shadow-xl shadow-fuchsia-500/20 z-10 relative" 
          : "bg-gray-100 border-2 border-transparent shadow"
      }`}
    >
      <div className="flex justify-between items-start gap-4">
        <span className={`transition-all duration-300 ${isActive ? "text-lg font-semibold text-slate-900" : "text-base text-slate-700"}`}>
          {step.text}
        </span>
        <button 
          onClick={() => onSpeak(step.text)}
          className={`p-2 rounded-full transition-colors flex-shrink-0 ${
            isActive 
              ? "bg-fuchsia-100 text-fuchsia-600 hover:bg-fuchsia-200" 
              : "text-gray-400 hover:bg-gray-200 hover:text-gray-700"
          }`}
        >
          <Volume2 className="w-5 h-5" />
        </button>
      </div>

      {step.time && (
        <Button
          onClick={() => onStartTimer(step.time)}
          className={`rounded-full px-5 py-2 text-sm w-fit font-medium transition-all ${
            isActive
              ? "bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white shadow-md shadow-rose-500/20"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          ⏱ Start {step.time >= 60
            ? `${Math.floor(step.time / 60)} min`
            : `${step.time} sec`} Timer
        </Button>
      )}
    </motion.div>
  );
}