import { AlertTriangle, X } from "lucide-react";

export function NonVegWarningDialog({ 
  isOpen, 
  onClose, 
  onContinue, 
  dishName, 
  detectedIngredients = [] 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="nonveg-warning-title" className="bg-white dark:bg-zinc-900 rounded-lg max-w-md w-full p-6 shadow-xl border border-transparent dark:border-zinc-700">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="text-amber-500" size={24} />
          </div>
          
          <div className="flex-1">
            <h3 id="nonveg-warning-title" className="font-semibold text-gray-900 dark:text-zinc-100 mb-2">
              Non-Vegetarian Dish Detected
            </h3>
            
            <p className="text-gray-600 dark:text-zinc-300 mb-3">
              You've requested "<strong>{dishName}</strong>" but your profile is set to vegetarian.
            </p>
            
            {detectedIngredients.length > 0 && (
              <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">
                Detected ingredients: <span className="font-medium">{detectedIngredients.join(', ')}</span>
              </p>
            )}
            
            <p className="text-sm text-gray-600 dark:text-zinc-300 mb-4">
              Would you like to continue anyway, or would you prefer a vegetarian alternative?
            </p>
            
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              This dish contains: <span className="font-semibold">{detectedIngredients.join(', ')}</span>
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-2">
              <strong>Note:</strong> Choosing "Continue Anyway" will permanently update your diet preference to Non-Vegetarian.
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 dark:text-zinc-400 hover:text-gray-600 dark:hover:text-zinc-100"
            aria-label="Close warning"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-md text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          
          <button
            onClick={() => {
              onContinue('vegetarian');
              onClose();
            }}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Get Veg Alternative
          </button>
          
          <button
            onClick={() => {
              onContinue('continue');
              onClose();
            }}
            className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700"
          >
            Continue Anyway
          </button>
        </div>
      </div>
    </div>
  );
}
