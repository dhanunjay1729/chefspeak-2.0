// import { motion } from "framer-motion"; // Unused for now

export function NutritionInfo({ nutritionInfo, isLoading }) {
  if (!nutritionInfo && !isLoading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md bg-green-50 rounded-xl p-4 mb-6 border-2 border-green-200"
    >
      <div className="flex items-center mb-3">
        <span className="text-xl mr-2">🥗</span>
        <h3 className="text-lg font-semibold text-green-800">Nutritional Information</h3>
      </div>
      
      {isLoading ? (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
          <span className="text-green-600">Loading nutrition info...</span>
        </div>
      ) : (
        <div className="text-sm text-green-700 whitespace-pre-line">
          {nutritionInfo}
        </div>
      )}
    </motion.div>
  );
}