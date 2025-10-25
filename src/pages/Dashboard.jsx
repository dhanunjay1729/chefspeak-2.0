// src/pages/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useUserProfile } from "../hooks/useUserProfile";
import { getRecentDishes, deleteRecentDish } from "../services/userService";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import Header from "../components/Header";
import { Heart, Salad, ChefHat, Compass, X, Loader2 } from "lucide-react";
import { FullPageLoader } from "../components/LoadingSpinner"; // ✅ Import

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
  const { displayName } = useUserProfile();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState({});
  const [showComingSoonAlert, setShowComingSoonAlert] = useState(false);
  
  // ✅ PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

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

  // ✅ PAGINATION LOGIC
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage]);

  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      // Scroll to top of recent dishes section
      document.getElementById('recent-dishes-section')?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  };

  // ✅ Reset to page 1 when items change (after deletion)
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [items.length, currentPage, totalPages]);

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

  const handleExploreClick = () => {
    setShowComingSoonAlert(true);
    setTimeout(() => setShowComingSoonAlert(false), 3000);
  };

  // ✅ SHOW FULL-PAGE LOADER
  if (loading && currentUser) {
    return <FullPageLoader text="Loading your dashboard..." />;
  }

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
          {/* Coming Soon Alert */}
          {showComingSoonAlert && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top fade-in">
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 shadow-lg">
                <p className="text-sm font-medium text-amber-800">
                  🚀 Explore is coming soon! Stay tuned.
                </p>
              </div>
            </div>
          )}

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
              onClick={handleExploreClick}
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

          {/* ✅ UPDATED RECENT DISHES SECTION */}
          <section id="recent-dishes-section" className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900">Recent dishes</h2>
              {items.length > ITEMS_PER_PAGE && (
                <span className="text-sm text-zinc-600">
                  {items.length} total dishes
                </span>
              )}
            </div>

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
              <>
                {/* ✅ PAGINATED GRID */}
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {paginatedItems.map((it) => (
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

                {/* ✅ PAGINATION CONTROLS */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-6">
                    {/* Previous Button */}
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="inline-flex items-center justify-center h-10 w-10 rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      ←
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        // Show first page, last page, current page, and pages around current
                        const showPage = 
                          page === 1 || 
                          page === totalPages || 
                          (page >= currentPage - 1 && page <= currentPage + 1);
                        
                        const showEllipsis = 
                          (page === 2 && currentPage > 3) || 
                          (page === totalPages - 1 && currentPage < totalPages - 2);

                        if (showEllipsis) {
                          return (
                            <span key={page} className="px-2 text-zinc-400">
                              ...
                            </span>
                          );
                        }

                        if (!showPage) return null;

                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`inline-flex items-center justify-center h-10 w-10 rounded-lg border transition ${
                              currentPage === page
                                ? "bg-gradient-to-br from-amber-500 to-rose-500 text-white border-transparent shadow-md"
                                : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>

                    {/* Next Button */}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="inline-flex items-center justify-center h-10 w-10 rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      →
                    </button>
                  </div>
                )}

                {/* ✅ PAGE INFO */}
                {totalPages > 1 && (
                  <div className="text-center text-sm text-zinc-600 pt-2">
                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, items.length)} of {items.length} dishes
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
