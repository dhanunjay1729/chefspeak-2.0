// src/pages/Ingredients.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Plus, X, Sparkles, ChefHat, Trash2 } from "lucide-react";
import { OpenAIService } from "../services/openaiService"; // you'll implement suggestRecipesByIngredients()

const QUICK = [
  "onion","tomato","garlic","ginger","potato","rice","paneer","chicken","egg","wheat flour","poha","pasta","rava"
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

  const normalizedSet = useMemo(
    () => new Set(ingredients.map((i) => i.toLowerCase().trim()).filter(Boolean)),
    [ingredients]
  );

  const addFromInput = () => {
    const raw = value.trim();
    if (!raw) return;
    const parts = raw.split(/[,\n]/).map((s) => s.toLowerCase().trim()).filter(Boolean);
    const uniq = [...new Set(parts)];
    const merged = [...normalizedSet, ...uniq].map((x) => x);
    setIngredients(merged);
    setValue("");
  };

  const addQuick = (q) => {
    if (!normalizedSet.has(q)) setIngredients([...ingredients, q]);
  };

  const removeOne = (name) => setIngredients(ingredients.filter((x) => x !== name));
  const clearAll = () => { setIngredients([]); setValue(""); setSuggestions([]); };

  const imgFor = (name, fallbackIndex = 0) =>
    `https://source.unsplash.com/featured/?${encodeURIComponent(name)},food&sig=${fallbackIndex}`;

  const onGetSuggestions = async () => {
    if (ingredients.length === 0) return;
    setLoading(true);
    try {
      const svc = new OpenAIService(import.meta.env.VITE_OPENAI_KEY);
      const resp = await svc.suggestRecipesByIngredients(ingredients); // return 5 items
      // Accept either ["Biryani", ...] or [{name, img}]
      const list = (Array.isArray(resp) ? resp : []).slice(0, 5).map((r, i) => {
        if (typeof r === "string") return { name: r, img: imgFor(r, i) };
        const n = r?.name || r?.title || "";
        return { name: n, img: r?.img || imgFor(n || `dish-${i}`, i) };
      }).filter((x) => x.name);
      setSuggestions(list);
      localStorage.setItem("chefspeak.pantry", JSON.stringify(ingredients));
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const openDish = (name) => {
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
      <div className="min-h-screen bg-gradient-to-b from-white to-zinc-50">
        <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Cook with Ingredients</h1>
            <p className="text-zinc-600">Add what you have. We’ll ask ChefSpeak to suggest 5 dishes.</p>
          </div>

          <Card className="border-zinc-200 bg-white/90 backdrop-blur rounded-2xl">
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex gap-2">
                <div className="relative w-full">
                  <Input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") addFromInput(); }}
                    placeholder="Type ingredients… (comma or Enter to add)"
                    className="h-12"
                  />
                </div>
                <Button onClick={addFromInput} className="h-12 gap-2">
                  <Plus size={18} />
                  Add
                </Button>
              </div>

              {ingredients.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {ingredients.map((ing) => (
                    <span
                      key={ing}
                      className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-800"
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
                </div>
              ) : (
                <div className="text-sm text-zinc-600">
                  Tip: paste a list like <span className="font-medium">onion, tomato, rice</span> and press <span className="font-medium">Add</span>.
                </div>
              )}

              <div className="pt-1">
                <div className="text-xs font-medium uppercase text-zinc-500 mb-2">Quick add</div>
                <div className="flex flex-wrap gap-2">
                  {QUICK.map((q) => (
                    <button
                      key={q}
                      onClick={() => addQuick(q)}
                      className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={onGetSuggestions} disabled={!hasAny || loading} className="gap-2">
                  <Sparkles size={18} />
                  {loading ? "Asking ChefSpeak…" : "Get 5 Suggestions"}
                </Button>
                <Button variant="outline" onClick={clearAll} disabled={!hasAny} className="gap-2">
                  <Trash2 size={18} />
                  Clear
                </Button>
              </div>
            </div>
          </Card>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-zinc-900">Suggestions</h2>
            {!loading && suggestions.length === 0 ? (
              <div className="text-sm text-zinc-600">
                {hasAny ? "No suggestions yet. Try again or add 1–2 more items." : "Add ingredients to get ideas."}
              </div>
            ) : loading ? (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-zinc-200 bg-white overflow-hidden animate-pulse">
                    <div className="aspect-video bg-zinc-100" />
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
                    className="text-left rounded-2xl overflow-hidden border border-zinc-200 bg-white hover:shadow-md hover:-translate-y-0.5 transition"
                  >
                    <div className="aspect-video bg-zinc-100 overflow-hidden">
                      <img
                        src={s.img || imgFor(s.name, i)}
                        alt={s.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-3">
                      <div className="font-medium line-clamp-1 text-zinc-900">{s.name}</div>
                      <div className="text-xs text-zinc-600 mt-1">Tap to start cooking</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <div className="pt-4 pb-10">
            <Button variant="secondary" onClick={() => navigate("/assistant")} className="gap-2">
              <ChefHat size={18} />
              Go to Assistant
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
