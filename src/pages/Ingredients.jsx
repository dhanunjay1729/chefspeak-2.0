import { useUserProfile } from '../hooks/useUserProfile';
// src/pages/Ingredients.jsx
import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import {
  Plus,
  X,
  Sparkles,
  ChefHat,
  Trash2,
  Wand2,
  Loader2,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { RecipeApiService } from "../services/recipeApiService";
import { toast } from "../contexts/ToastContext";

const STAPLES = ['water', 'oil', 'salt', 'cumin', 'turmeric', 'chilli powder', 'black pepper'];
const readList = key => {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value.filter(item => typeof item === 'string') : [];
  } catch { return []; }
};
const saveList = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Storage may be disabled. */ }
};

const QUICK = [
  "onion",
  "tomato",
  "garlic",
  "ginger",
  "potato",
  "rice",
  "paneer",
  "chicken",
  "egg",
  "wheat flour",
  "poha",
  "pasta",
  "rava",
];

export default function IngredientsPage() {
  const navigate = useNavigate();
  const { dietType, allergies, dislikes, skillLevel, preferredLanguage, loading: profileLoading } = useUserProfile();
  const preferenceKey = JSON.stringify({ dietType, allergies, dislikes, skillLevel, preferredLanguage });
  const requestId = useRef(0);
  const [staples, setStaples] = useState(() => readList('chefspeak.staples'));
  const [value, setValue] = useState("");
  const [ingredients, setIngredients] = useState(() => readList('chefspeak.pantry'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    saveList('chefspeak.pantry', ingredients);
    saveList('chefspeak.staples', staples);
    requestId.current++;
    setSuggestions([]);
    setError(null);
    setLoading(false);
  }, [ingredients, staples, preferenceKey]);
  useEffect(() => () => { requestId.current++; }, []);

  const normalizedSet = useMemo(
    () =>
      new Set(
        ingredients.map((i) => i.toLowerCase().trim()).filter(Boolean)
      ),
    [ingredients]
  );

  const addFromInput = () => {
    const raw = value.trim();
    if (!raw) return;
    const parts = raw
      .split(/[,\n]/)
      .map((s) => s.toLowerCase().trim())
      .filter(Boolean);
    const uniq = [...new Set(parts)];
    const merged = [...new Set([...normalizedSet, ...uniq])];
    setIngredients(merged);
    setValue("");
  };

  const addQuick = (q) => {
    if (!normalizedSet.has(q)) setIngredients([...ingredients, q]);
  };

  const removeOne = (name) =>
    setIngredients(ingredients.filter((x) => x !== name));
  const clearAll = () => {
    setIngredients([]);
    setValue("");
    setSuggestions([]);
    setError(null);
  };

  const onGetSuggestions = async () => {
    if (!ingredients.length || profileLoading) return;
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const svc = new RecipeApiService();
      const list = await svc.suggestRecipesByIngredients(ingredients, staples, { dietType, allergies, dislikes, skillLevel }, preferredLanguage);
      if (id !== requestId.current) return;
      if (!list.length) setError('No suitable dishes found. Try adding more ingredients.');
      else setSuggestions(list);
    } catch {
      if (id !== requestId.current) return;
      setError('Unable to generate suggestions. Please check your connection and try again.');
      toast.error('Failed to fetch recipe suggestions.');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  };

  const openDish = (suggestion) => {
    const qs = new URLSearchParams({
      dish: suggestion.name,
      ingredients: [...ingredients, ...staples].join(', '),
      required: suggestion.requiredIngredients.join(', '),
      optional: suggestion.optionalIngredients.join(', '),
    }).toString();
    navigate(`/assistant?${qs}`);
  };

  const hasAny = ingredients.length > 0;

  return (
    <>
      <Header />

      {/* Background flair */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[#FDFCFB] dark:bg-zinc-950 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-50/60 dark:from-amber-900/20 via-[#FDFCFB] dark:via-zinc-950 to-[#FDFCFB] dark:to-zinc-950 transition-colors">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-[34rem] w-[34rem] rounded-full bg-gradient-to-tr from-amber-300/30 via-rose-300/30 to-fuchsia-300/30 dark:from-amber-900/20 dark:via-rose-900/20 dark:to-fuchsia-900/20 blur-3xl" />
      </div>

      <main className="min-h-screen relative">
        <div className="mx-auto max-w-6xl px-4 pt-10 pb-16 space-y-10">
          {/* Hero */}
          <section className="text-center space-y-3">
            <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
              Cook with your <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-rose-600 to-fuchsia-600 dark:from-amber-400 dark:via-rose-400 dark:to-fuchsia-400">ingredients</span>
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Add what you have. ChefSpeak will suggest{" "}
              <span className="font-medium">dish ideas and any missing ingredients</span>.
            </p>
          </section>

          {/* Input + Chips */}
          <Card className="border-zinc-200/60 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
            <div className="p-6 space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative w-full">
                  <Input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addFromInput();
                    }}
                    placeholder="Type ingredients… (comma or Enter to add)"
                    className="h-12 text-base rounded-xl bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus-visible:ring-fuchsia-500/50 dark:text-zinc-100 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                  />
                </div>
                <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-row">
                  <Button
                    onClick={addFromInput}
                    className="h-12 w-full sm:w-auto px-5 gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-fuchsia-600 text-white shadow-md hover:shadow-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 border-0"
                  >
                    <Plus size={18} className="opacity-90" />
                    <span className="font-semibold">Add</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={clearAll}
                    disabled={!hasAny}
                    className="h-12 w-full sm:w-auto px-5 gap-2 rounded-xl border-2 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-950 hover:bg-rose-50 dark:hover:bg-red-950/30 hover:border-rose-200 dark:hover:border-red-900/50 hover:text-rose-700 dark:hover:text-red-400 disabled:opacity-50 disabled:pointer-events-none shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/70"
                  >
                    <Trash2 size={18} />
                    <span className="font-semibold">Clear</span>
                  </Button>
                </div>
              </div>

              {/* Selected chips */}
              {ingredients.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  {ingredients.map((ing) => (
                     <span
                      key={ing}
                      className="inline-flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 text-sm text-zinc-800 dark:text-zinc-200 shadow-sm transition-colors"
                    >
                      {ing}
                      <button
                        onClick={() => removeOne(ing)}
                        className="rounded-full p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        aria-label={`Remove ${ing}`}
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                  <span className="ml-1 text-xs text-zinc-500 dark:text-zinc-500">
                    {ingredients.length} item{ingredients.length > 1 ? "s" : ""}
                  </span>
                </div>
              ) : (
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  Tip: paste a list like{" "}
                  <span className="font-medium text-zinc-900 dark:text-zinc-200">
                    onion, tomato, rice
                  </span>{" "}
                  and press <span className="font-medium text-zinc-900 dark:text-zinc-200">Add</span>.
                </div>
              )}

              {/* Quick add */}
              <div>
                <div className="text-xs font-medium uppercase text-zinc-500 dark:text-zinc-500 mb-2 tracking-wider">
                  Quick add
                </div>
                <div className="flex flex-wrap gap-2">
                  {QUICK.map((q) => (
                    <button
                      key={q}
                      onClick={() => addQuick(q)}
                      className="rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <fieldset className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <legend className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Staples I have</legend>
                <p className="text-xs text-zinc-500 mb-3">Select what is available. We remember your choices on this device.</p>
                <div className="flex flex-wrap gap-3">
                  {STAPLES.map(staple => <label key={staple} className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                    <input type="checkbox" checked={staples.includes(staple)} onChange={event => setStaples(current => event.target.checked ? [...current, staple] : current.filter(value => value !== staple))} />
                    {staple}
                  </label>)}
                </div>
              </fieldset>
              {/* CTA */}
              <div className="pt-2">
                <Button
                  onClick={onGetSuggestions}
                  disabled={!hasAny || loading || profileLoading}
                  className="w-full h-12 text-base gap-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 transition-all font-semibold shadow-md border-0"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Asking ChefSpeak…
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Find dishes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>

          {/* Suggestions */}
          <section className="space-y-4 relative z-10">
            <div className="flex items-end justify-between">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Suggestions
              </h2>
              {suggestions.length > 0 && (
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Tap a card to start cooking
                </span>
              )}
            </div>

            {error && !loading ? (
              <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/70 dark:bg-red-950/30 p-6 text-center text-sm text-red-800 dark:text-red-400 flex flex-col items-center gap-3 shadow-sm">
                <div className="flex items-center gap-2 font-semibold text-red-900 dark:text-red-300">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500 shrink-0" />
                  <span>Unable to generate suggestions</span>
                </div>
                <p className="text-zinc-600 dark:text-red-300/80 max-w-md">{error}</p>
                <Button
                  onClick={onGetSuggestions}
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-red-200 dark:border-red-900/50 bg-white dark:bg-red-950/50 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 hover:text-red-800 dark:hover:text-red-300 gap-1.5 cursor-pointer shadow-sm transition-colors"
                >
                  <RotateCcw size={14} />
                  <span>Try Again</span>
                </Button>
              </div>
            ) : !loading && suggestions.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 p-8 text-center text-sm text-zinc-600 dark:text-zinc-400 backdrop-blur-sm">
                {hasAny
                  ? "No suggestions yet. Tap 'Find dishes' above."
                  : "Add ingredients to get ideas."}
              </div>
            ) : loading ? (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 shadow-sm animate-pulse"
                  >
                    <div className="h-12 bg-zinc-100 dark:bg-zinc-800" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-zinc-100 dark:bg-zinc-800/60 rounded" />
                      <div className="h-3 bg-zinc-100 dark:bg-zinc-800/60 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {suggestions.map((s, i) => (
                  <button
                    key={s.name + i}
                    onClick={() => openDish(s)}
                    className="group relative text-left rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md dark:shadow-none dark:hover:border-zinc-700 hover:-translate-y-1 transition-all p-5 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  >
                    <div className="font-semibold text-lg line-clamp-2 text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {s.name}
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
                      {s.estimatedMinutes && <p>About {s.estimatedMinutes} minutes</p>}
                      <p><span className="font-semibold">Uses:</span> {s.usedIngredients.join(', ')}</p>
                      <p className={s.missingIngredients.length ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}>
                        <span className="font-semibold">Missing:</span> {s.missingIngredients.length ? s.missingIngredients.join(', ') : 'Nothing from the listed ingredients'}
                      </p>
                      {!!s.optionalIngredients.length && <p className="text-xs">Optional: {s.optionalIngredients.join(', ')}</p>}
                    </div>
                    <div className="text-xs font-medium text-zinc-500 dark:text-zinc-500 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/60">
                      Tap to start cooking
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

        </div>
      </main>
    </>
  );
}
