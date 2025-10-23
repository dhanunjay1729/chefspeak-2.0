import { ChefHat, Loader2 } from "lucide-react";

export function IngredientsInfo({ ingredients, isLoading }) {
  if (!ingredients && !isLoading) return null;

  return (
    <div className="w-full max-w-md mb-6">
      <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500 shadow-sm">
            <ChefHat className="h-4 w-4 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-purple-900">
            Ingredients
          </h2>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-purple-700">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading ingredients...</span>
          </div>
        ) : (
          <div className="text-sm text-purple-900 whitespace-pre-wrap leading-relaxed">
            {ingredients}
          </div>
        )}
      </div>
    </div>
  );
}