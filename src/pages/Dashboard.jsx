// src/pages/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getRecentDishes } from "../services/userService";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import Header from "../components/Header";
import { Heart, Salad, ChefHat, Compass } from "lucide-react";

function ActionTile({ icon: Icon, title, desc, onClick, variant = "default" }) {
  const base =
    "w-full rounded-2xl border overflow-hidden transition transform hover:-translate-y-0.5 hover:shadow-lg";
  const styles =
    variant === "accent"
      ? "bg-gradient-to-br from-amber-100 via-rose-100 to-fuchsia-100 border-zinc-200"
      : "bg-white/90 border-zinc-200 backdrop-blur";
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
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

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
      } catch {} finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [currentUser]);

  const openAssistantWith = (dish) => {
    navigate(`/assistant?dish=${encodeURIComponent(dish)}`);
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
              Welcome, {currentUser?.email?.split("@")[0] || "Chef"}
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
              desc="Tell us what’s in your kitchen to get dish suggestions."
              onClick={() => navigate("/ingredients")}
            />
            <ActionTile
              icon={Compass}
              title="Explore"
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
                    <div className="aspect-video bg-zinc-100" />
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
                  <button
                    key={it.id}
                    onClick={() => openAssistantWith(it.dishName)}
                    className="text-left rounded-2xl overflow-hidden border border-zinc-200 bg-white hover:shadow-md hover:-translate-y-0.5 transition"
                  >
                    <div className="aspect-video bg-zinc-100 overflow-hidden">
                      {it.imageUrl ? (
                        <img
                          src={it.imageUrl}
                          alt={it.dishName}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-xs text-zinc-500">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="font-medium line-clamp-1 text-zinc-900">{it.dishName}</div>
                      <div className="text-xs text-zinc-600 mt-1">
                        {it.language || "—"} {it.people ? `• ${it.people} ppl` : ""}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
