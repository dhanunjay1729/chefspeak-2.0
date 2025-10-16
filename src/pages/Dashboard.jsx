// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useUserProfile } from "../hooks/useUserProfile";
import { getRecentDishes, deleteRecentDish } from "../services/userService";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import Header from "../components/Header";
import { Heart, Salad, ChefHat, Compass, X, Loader2 } from "lucide-react";

function ActionTile({ icon: IconComponent, title, desc, onClick, variant = "default" }) {
  const base =
    "w-full rounded-2xl border overflow-hidden transition transform hover:-translate-y-0.5 hover:shadow-lg";
  const styles =
    variant === "accent"
      ? "bg-gradient-to-br from-amber-100 via-rose-100 to-fuchsia-100 border-zinc-200"
      : "bg-white/90 border-zinc-200 backdrop-blur";
  
  const Icon = IconComponent;
  
  return (
    <button onClick={onClick} className={`${base} ${styles}`}>
      <div className="flex items-center gap-4 p-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-white shadow">
          <Icon size={22} />
        </div>
        <div className="text-left">
          <div className="text-base font-semibold text-zinc-900">{title}</div>
          <div className="text-sm text-zinc-600">{desc}</div>
        </div>
      </div>
    </button>
  );
}

export default function Dashboard() {
  const authCtx = useAuth();
  const currentUser = authCtx.currentUser ?? authCtx.user ?? null;
  const { displayName } = useUserProfile();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState({}); // id -> boolean

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!currentUser) {
        if (mounted) setLoading(false);
        return;
      }
      try {
        const data = await getRecentDishes(currentUser.uid, { limit: 20 });
        if (mounted) setItems(data);
      } catch (err) {
        console.error("Failed to load recent dishes:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [currentUser]);

  const openRecipeView = (dishItem) => {
    navigate(`/recipe/${dishItem.id}`);
  };

  const handleRemove = async (e, id) => {
    e.stopPropagation();
    if (!currentUser) return;
    setRemoving((s) => ({ ...s, [id]: true }));
    const prev = items;
    setItems((s) => s.filter((it) => it.id !== id));
    try {
      await deleteRecentDish(currentUser.uid, id);
    } catch (err) {
      console.error("Failed to remove recent dish:", err);
      setItems(prev); // revert on failure
    } finally {
      setRemoving((s) => {
        const { [id]: _, ...rest } = s;
        return rest;
      });
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-zinc-50">
        <Header />
        <div className="mx-auto max-w-5xl px-4 py-16">
          <h1 className="text-3xl font-bold text-zinc-900">Dashboard</h1>
          <p className="text-sm text-zinc-600 mt-2">Log in to see your recent dishes.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-white to-zinc-50">
        <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
              Welcome, {displayName}
            </h1>
            <p className="text-zinc-600">What would you like to do?</p>
          </div>

          <div className="space-y-3">
            <ActionTile
              icon={ChefHat}
              title="Start Cooking"
              desc="Open the assistant and begin a new recipe."
              variant="accent"
              onClick={() => navigate("/assistant")}
            />
            <ActionTile
              icon={Salad}
              title="Cook with Ingredients"
              desc="Tell us what's in your kitchen to get dish suggestions."
              onClick={() => navigate("/ingredients")}
            />
            <ActionTile
              icon={Compass}
              title="Explore (coming soon)"
              desc="Discover trending dishes and curated collections."
              onClick={() => navigate("/explore")}
            />
            <ActionTile
              icon={Heart}
              title="Favorites"
              desc="Jump into your saved dishes."
              onClick={() => navigate("/favorites")}
            />
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-zinc-900">Personalized suggestions</h2>
            <div className="rounded-2xl border border-zinc-200 bg-white/90 backdrop-blur p-4 text-sm text-zinc-600">
              Coming soon — tailored picks based on your cooking history.
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-zinc-900">Recent dishes</h2>
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-zinc-200 bg-white overflow-hidden animate-pulse"
                  >
                    <div className="p-3 space-y-2">
                      <div className="h-4 bg-zinc-100 rounded" />
                      <div className="h-3 bg-zinc-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="text-sm text-zinc-600">
                No recent dishes yet. Try <span className="font-medium">Explore</span> or{" "}
                <span className="font-medium">Cook with Ingredients</span>.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {items.map((it) => (
                  <div
                    key={it.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openRecipeView(it)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") openRecipeView(it);
                    }}
                    className="relative cursor-pointer text-left rounded-2xl overflow-hidden border border-zinc-200 bg-white hover:shadow-md hover:-translate-y-0.5 transition focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  >
                    {/* Remove (X) button */}
                    <button
                      type="button"
                      aria-label="Remove from recent"
                      title="Remove from recent"
                      onClick={(e) => handleRemove(e, it.id)}
                      className="absolute top-2 right-2 z-10 inline-flex items-center justify-center h-8 w-8 rounded-full bg-white/90 text-zinc-700 border border-zinc-200 shadow hover:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    >
                      {removing[it.id] ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                    </button>

                    <div className="p-4">
                      <div className="font-medium line-clamp-1 text-zinc-900 text-lg">{it.dishName}</div>
                      <div className="text-sm text-zinc-600 mt-2">
                        {it.language || "—"} {it.people ? `• ${it.people} ppl` : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
