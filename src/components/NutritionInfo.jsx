import { motion } from "framer-motion";
import { Flame, Beef, Droplets, Wheat } from "lucide-react";

export function NutritionInfo({ nutritionInfo, isLoading }) {
  if (!nutritionInfo && !isLoading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6 mb-6 border border-zinc-200/60 dark:border-zinc-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none"
    >
      <div className="flex items-center mb-4">
        <span className="text-xl mr-2">🥗</span>
        <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">Nutrition Facts <span className="text-xs text-zinc-500 dark:text-zinc-400 font-normal ml-1">per serving</span></h3>
      </div>
      
      {isLoading ? (
        <div className="flex items-center space-x-2 py-4">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-fuchsia-600"></div>
          <span className="text-zinc-600 dark:text-zinc-400 font-medium text-sm">Calculating macros...</span>
        </div>
      ) : typeof nutritionInfo === 'object' ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MacroCard 
            icon={<Flame size={18} className="text-orange-500 dark:text-orange-400" />} 
            label="Calories" 
            value={nutritionInfo.calories} 
            unit="kcal" 
            color="bg-orange-50 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/20 text-orange-700 dark:text-orange-300" 
          />
          <MacroCard 
            icon={<Beef size={18} className="text-red-500 dark:text-red-400" />} 
            label="Protein" 
            value={nutritionInfo.protein} 
            unit="g" 
            color="bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20 text-red-700 dark:text-red-300" 
          />
          <MacroCard 
            icon={<Droplets size={18} className="text-yellow-500 dark:text-yellow-400" />} 
            label="Fat" 
            value={nutritionInfo.fat} 
            unit="g" 
            color="bg-yellow-50 dark:bg-yellow-500/10 border-yellow-100 dark:border-yellow-500/20 text-yellow-700 dark:text-yellow-300" 
          />
          <MacroCard 
            icon={<Wheat size={18} className="text-amber-600 dark:text-amber-400" />} 
            label="Carbs" 
            value={nutritionInfo.carbs} 
            unit="g" 
            color="bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20 text-amber-800 dark:text-amber-300" 
          />
        </div>
      ) : (
        // Fallback for old recipes where nutritionInfo might still be a string
        <div className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-line bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
          {nutritionInfo}
        </div>
      )}
    </motion.div>
  );
}

function MacroCard({ icon, label, value, unit, color }) {
  return (
    <div className={`flex flex-col items-center justify-center p-3 rounded-xl border ${color}`}>
      <div className="mb-1">{icon}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-black tracking-tight">{value !== undefined ? value : '-'}</span>
        <span className="text-xs font-semibold opacity-60">{unit}</span>
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 mt-1">{label}</span>
    </div>
  );
}