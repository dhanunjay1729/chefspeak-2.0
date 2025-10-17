// src/pages/Ingredients.jsx
import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import { OpenAIService } from "../services/openaiService";

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
  const [value, setValue] = useState("");
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem("chefspeak.pantry");
    if (saved) {
      try {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr)) setIngredients(arr);
      } catch {}
    }
  }, []);

  // Load suggestions from localStorage on mount
  useEffect(() => {
    const savedSuggestions = localStorage.getItem("chefspeak.suggestions");
    if (savedSuggestions) {
      try {
        const parsed = JSON.parse(savedSuggestions);
        if (Array.isArray(parsed)) {
          setSuggestions(parsed);
        }
      } catch {}
    }
  }, []);

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
    const merged = [...normalizedSet, ...uniq].map((x) => x);
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
  };

  const onGetSuggestions = async () => {
    if (ingredients.length === 0) return;
    setLoading(true);
    try {
      const svc = new OpenAIService();
      const resp = await svc.suggestRecipesByIngredients(ingredients);
      const list = (Array.isArray(resp) ? resp : [])
        .slice(0, 5)
        .map((r, i) =>
          typeof r === "string"
            ? { name: r }
            : {
                name: r?.name || r?.title || "",
              }
        )
        .filter((x) => x.name);
      setSuggestions(list);
      localStorage.setItem(
        "chefspeak.pantry",
        JSON.stringify(ingredients)
      );
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const openDish = (name) => {
    // Save current suggestions to localStorage before navigating
    localStorage.setItem(
      "chefspeak.suggestions",
      JSON.stringify(suggestions)
    );
    
    const qs = new URLSearchParams({
      dish: name,
      ingredients: ingredients.join(", "),
    }).toString();
    navigate(`/assistant?${qs}`);
  };

  const hasAny = ingredients.length > 0;

  return (
    <>
      <Header />

      {/* Background flair */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-[34rem] w-[34rem] rounded-full bg-gradient-to-tr from-amber-300/30 via-rose-300/30 to-fuchsia-300/30 blur-3xl" />
      </div>

      <main className="min-h-screen">
        <div className="mx-auto max-w-6xl px-4 pt-10 pb-16 space-y-10">
          {/* Hero */}
          <section className="text-center space-y-3">
            <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">
              Cook with your <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-rose-600 to-fuchsia-600">ingredients</span>
            </h1>
            <p className="text-zinc-600">
              Add what you have. ChefSpeak will suggest{" "}
              <span className="font-medium">5 dish ideas</span> instantly.
            </p>
          </section>

          {/* Input + Chips */}
          <Card className="border-zinc-200 bg-white/90 backdrop-blur rounded-2xl shadow-sm">
            <div className="p-5 sm:p-6 space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative w-full">
                  <Input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addFromInput();
                    }}
                    placeholder="Type ingredients… (comma or Enter to add)"
                    className="h-12 text-base"
                  />
                </div>
                <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-row">
                  <Button
                    onClick={addFromInput}
                    className="h-12 w-full sm:w-auto px-5 gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-fuchsia-600 text-white shadow-md hover:shadow-lg hover:brightness-105 active:translate-y-px transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
                  >
                    <Plus size={18} className="opacity-90" />
                    <span className="font-semibold">Add</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={clearAll}
                    disabled={!hasAny}
                    className="h-12 w-full sm:w-auto px-5 gap-2 rounded-xl border-2 border-zinc-200 text-zinc-700 bg-white hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 disabled:opacity-50 disabled:pointer-events-none shadow-sm hover:shadow-md active:translate-y-px transition focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/70"
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
                      className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-800 shadow-sm"
                    >
                      {ing}
                      <button
                        onClick={() => removeOne(ing)}
                        className="rounded-full p-1 hover:bg-zinc-100"
                        aria-label={`Remove ${ing}`}
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                  <span className="ml-1 text-xs text-zinc-500">
                    {ingredients.length} item{ingredients.length > 1 ? "s" : ""}
                  </span>
                </div>
              ) : (
                <div className="text-sm text-zinc-600">
                  Tip: paste a list like{" "}
                  <span className="font-medium">
                    onion, tomato, rice
                  </span>{" "}
                  and press <span className="font-medium">Add</span>.
                </div>
              )}

              {/* Quick add */}
              <div>
                <div className="text-xs font-medium uppercase text-zinc-500 mb-2">
                  Quick add
                </div>
                <div className="flex flex-wrap gap-2">
                  {QUICK.map((q) => (
                    <button
                      key={q}
                      onClick={() => addQuick(q)}
                      className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 shadow-sm"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="pt-2">
                <Button
                  onClick={onGetSuggestions}
                  disabled={!hasAny || loading}
                  className="w-full h-12 text-base gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Asking ChefSpeak…
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Get 5 Suggestions
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>

          {/* Suggestions */}
          <section className="space-y-4">
            <div className="flex items-end justify-between">
              <h2 className="text-lg font-semibold text-zinc-900">
                Suggestions
              </h2>
              {suggestions.length > 0 && (
                <span className="text-xs text-zinc-500">
                  Tap a card to start cooking
                </span>
              )}
            </div>

            {!loading && suggestions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/60 p-6 text-center text-sm text-zinc-600">
                {hasAny
                  ? "No suggestions yet. Tap 'Get Suggestions' above."
                  : "Add ingredients to get ideas."}
              </div>
            ) : loading ? (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl overflow-hidden border border-zinc-200 bg-white shadow-sm animate-pulse"
                  >
                    <div className="h-12 bg-zinc-100" />
                    <div className="p-3 space-y-2">
                      <div className="h-4 bg-zinc-100 rounded" />
                      <div className="h-3 bg-zinc-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                {suggestions.map((s, i) => (
                  <button
                    key={s.name + i}
                    onClick={() => openDish(s.name)}
                    className="group relative text-left rounded-2xl overflow-hidden border border-zinc-200 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition p-4"
                  >
                    <div className="font-medium line-clamp-1 text-zinc-900">
                      {s.name}
                    </div>
                    <div className="text-xs text-zinc-600 mt-2">
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
