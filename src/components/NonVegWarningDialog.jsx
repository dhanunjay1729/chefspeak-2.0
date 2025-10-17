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
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="text-amber-500" size={24} />
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">
              Non-Vegetarian Dish Detected
            </h3>
            
            <p className="text-gray-600 mb-3">
              You've requested "<strong>{dishName}</strong>" but your profile is set to vegetarian.
            </p>
            
            {detectedIngredients.length > 0 && (
              <p className="text-sm text-gray-500 mb-4">
                Detected ingredients: <span className="font-medium">{detectedIngredients.join(', ')}</span>
              </p>
            )}
            
            <p className="text-sm text-gray-600 mb-4">
              Would you like to continue anyway, or would you prefer a vegetarian alternative?
            </p>
            
            <p className="text-sm text-zinc-600">
              This dish contains: <span className="font-semibold">{detectedIngredients.join(', ')}</span>
            </p>
            <p className="text-sm text-zinc-600 mt-2">
              <strong>Note:</strong> Choosing "Continue Anyway" will permanently update your diet preference to Non-Vegetarian.
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
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