import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getFavoriteDishes, removeFavoriteDish } from "../services/userService";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { Heart, X, Loader2, ArrowLeft } from "lucide-react";

export default function Favorites() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState({});

  useEffect(() => {
    let mounted = true;
    const loadFavorites = async () => {
      if (!user?.uid) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        const data = await getFavoriteDishes(user.uid, { limit: 50 });
        if (mounted) setFavorites(data);
      } catch (error) {
        console.error("Failed to load favorites:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadFavorites();
    return () => { mounted = false; };
  }, [user?.uid]);

  const handleRemove = async (e, favoriteId) => {
    e.stopPropagation();
    if (!user?.uid) return;

    setRemoving(prev => ({ ...prev, [favoriteId]: true }));
    const previousFavorites = favorites;
    setFavorites(prev => prev.filter(item => item.id !== favoriteId));

    try {
      await removeFavoriteDish(user.uid, favoriteId);
    } catch (error) {
      console.error("Failed to remove favorite:", error);
      setFavorites(previousFavorites); // Revert on error
    } finally {
      setRemoving(prev => {
        const { [favoriteId]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const openRecipeView = (favorite) => {
    // For favorites, we'll need to create a temporary recent dish entry
    // or modify RecipeView to handle favorite data directly
    navigate(`/recipe/${favorite.id}`);
  };

  if (!user) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-white py-10 px-4 flex flex-col items-center justify-center">
          <p className="text-gray-600 mb-4">Please log in to view your favorites.</p>
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700"
          >
            Go to Login
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-white to-zinc-50">
        <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
          {/* Header with back button */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700"
            >
              <ArrowLeft size={20} />
              Back to Dashboard
            </button>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <Heart className="text-red-500 fill-current" size={32} />
              <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
                Favorite Recipes
              </h1>
            </div>
            <p className="text-zinc-600">Your saved recipes, ready to cook anytime</p>
          </div>

          {/* Favorites Grid */}
          <section className="space-y-4">
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-zinc-200 bg-white overflow-hidden animate-pulse"
                  >
                    <div className="p-4 space-y-2">
                      <div className="h-5 bg-zinc-100 rounded" />
                      <div className="h-3 bg-zinc-100 rounded w-2/3" />
                      <div className="h-3 bg-zinc-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : favorites.length === 0 ? (
              <div className="text-center py-16">
                <Heart className="mx-auto mb-4 text-gray-300" size={64} />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No favorites yet</h3>
                <p className="text-gray-600 mb-6">
                  Start cooking and add recipes to your favorites to see them here.
                </p>
                <button
                  onClick={() => navigate("/assistant")}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
                >
                  <Heart size={16} />
                  Start Cooking
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {favorites.map((favorite) => (
                  <div
                    key={favorite.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openRecipeView(favorite)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") openRecipeView(favorite);
                    }}
                    className="relative cursor-pointer text-left rounded-2xl overflow-hidden border border-zinc-200 bg-white hover:shadow-md hover:-translate-y-0.5 transition focus:outline-none focus:ring-2 focus:ring-red-500/30"
                  >
                    {/* Remove button */}
                    <button
                      type="button"
                      aria-label="Remove from favorites"
                      title="Remove from favorites"
                      onClick={(e) => handleRemove(e, favorite.id)}
                      className="absolute top-2 right-2 z-10 inline-flex items-center justify-center h-8 w-8 rounded-full bg-white/90 text-red-600 border border-red-200 shadow hover:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30"
                    >
                      {removing[favorite.id] ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <X size={14} />
                      )}
                    </button>

                    {/* Favorite indicator */}
                    <div className="absolute top-2 left-2 z-10">
                      <Heart className="text-red-500 fill-current" size={16} />
                    </div>

                    <div className="p-4 pt-8">
                      <div className="font-semibold text-lg text-zinc-900 line-clamp-2 mb-2">
                        {favorite.dishName}
                      </div>
                      <div className="text-sm text-zinc-600 space-y-1">
                        <div>{favorite.language || "English"}</div>
                        {favorite.people && <div>{favorite.people} servings</div>}
                        {favorite.notes && (
                          <div className="text-xs text-zinc-500 line-clamp-2">
                            {favorite.notes}
                          </div>
                        )}
                      </div>
                      <div className="mt-3 text-xs text-zinc-400">
                        {favorite.recipeSteps?.length || 0} steps
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