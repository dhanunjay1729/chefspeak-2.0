// src/components/NavigationControls.jsx
import { Button } from "./ui/button";

export function NavigationControls({ onBack, onRepeat, onNext, hasSteps }) {
  if (!hasSteps) return null;

  return (
    <div className="fixed bottom-4 left-0 right-0 flex justify-center gap-4 px-4 z-50">
      <Button
        className="bg-gray-800 hover:bg-gray-900 text-white font-semibold rounded-full px-6 py-3 shadow-xl transition-all duration-300"
        onClick={onBack}
      >
        ⬅ Back
      </Button>
      <Button
        className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded-full px-6 py-3 shadow-xl transition-all duration-300"
        onClick={onRepeat}
      >
        🔁 Repeat
      </Button>
      <Button
        className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-full px-6 py-3 shadow-xl transition-all duration-300"
        onClick={onNext}
      >
        ➡ Next
      </Button>
    </div>
  );
}