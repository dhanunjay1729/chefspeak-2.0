import { ChefHat, Loader2 } from "lucide-react";

export function IngredientsInfo({ ingredients, isLoading }) {
  if (!ingredients && !isLoading) return null;

  return (
    <div className="w-full max-w-md mb-6">
      <div className="rounded-3xl border border-purple-200/60 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-900/20 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500 shadow-sm">
            <ChefHat className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-purple-900 dark:text-purple-100">
            Ingredients
          </h2>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading ingredients...</span>
          </div>
        ) : (
          <div className="text-sm text-purple-900 dark:text-purple-200 whitespace-pre-wrap leading-relaxed bg-white/50 dark:bg-black/20 p-4 rounded-xl">
            {ingredients}
          </div>
        )}
      </div>
    </div>
  );
}