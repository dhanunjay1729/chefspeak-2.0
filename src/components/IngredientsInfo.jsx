import { ChefHat, Loader2 } from 'lucide-react';
import { ingredientLabel } from '../utils/recipeData';

export function IngredientsInfo({ ingredients, isLoading, checkedIds = [], onToggle }) {
  const structured = Array.isArray(ingredients) && ingredients.length > 0 && ingredients.every(item => item && typeof item === 'object' && typeof item.name === 'string');
  const legacy = Array.isArray(ingredients) ? ingredients.filter(item => typeof item === 'string').join('\n') : ingredients;
  return (
    <div className="w-full max-w-md mb-6">
      <div className="rounded-3xl border border-purple-200/60 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-900/20 p-6">
        <div className="flex items-center gap-3 mb-4">
          <ChefHat className="h-5 w-5 text-purple-600 dark:text-purple-300" />
          <h2 className="text-xl font-bold text-purple-900 dark:text-purple-100">Ingredients</h2>
        </div>
        {isLoading ? <div className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300"><Loader2 className="h-4 w-4 animate-spin" />Loading ingredients…</div>
          : structured ? <ul className="space-y-3">
            {ingredients.map(item => <li key={item.id}>
              <label className="flex items-start gap-3 text-sm text-purple-900 dark:text-purple-200">
                <input type="checkbox" checked={checkedIds.includes(item.id)} disabled={!onToggle} onChange={() => onToggle?.(item.id)} className="mt-1" />
                <span className={checkedIds.includes(item.id) ? 'line-through opacity-60' : ''}>{ingredientLabel(item)}{item.optional && <span className="ml-2 text-xs">(optional)</span>}</span>
              </label>
            </li>)}
          </ul>
          : <p className="text-sm text-purple-900 dark:text-purple-200 whitespace-pre-wrap">{legacy || "Ingredients weren’t saved for this older recipe."}</p>}
      </div>
    </div>
  );
}
