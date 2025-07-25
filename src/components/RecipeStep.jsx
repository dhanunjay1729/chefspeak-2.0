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
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`bg-gray-100 rounded-xl p-4 shadow flex flex-col space-y-3 ${
        isActive ? "border-2 border-blue-400" : ""
      }`}
    >
      <div className="flex justify-between items-start">
        <span>{step.text}</span>
        <button onClick={() => onSpeak(step.text)}>
          <Volume2 className="w-5 h-5 text-gray-500 hover:text-black" />
        </button>
      </div>

      {step.time && (
        <Button
          onClick={() => onStartTimer(step.time)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-2 text-sm w-fit"
        >
          ⏱ Start {step.time >= 60
            ? `${Math.floor(step.time / 60)} min`
            : `${step.time} sec`} Timer
        </Button>
      )}
    </motion.div>
  );
}