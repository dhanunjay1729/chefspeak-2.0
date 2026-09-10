// src/pages/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useUserProfile } from "../hooks/useUserProfile";
import { getRecentDishes, deleteRecentDish, getFavoriteDishes } from "../services/userService";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import Header from "../components/Header";
import { Heart, Salad, ChefHat, Compass, X, Loader2, Sparkles, ArrowRight, Info, Lock } from "lucide-react";
import { FullPageLoader } from "../components/LoadingSpinner";
import { geminiService } from "../services/geminiService";

function ActionTile({ icon: Icon, title, desc, onClick, variant = "default" }) {
  const base =
    "group relative w-full h-full rounded-3xl border transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-left flex flex-col p-6 overflow-hidden";

  const colorConfig = {
    orange: {
      bg: "bg-gradient-to-br from-orange-50 to-amber-50/50 dark:from-orange-950/40 dark:to-amber-900/20",
      border: "border-orange-100 hover:border-orange-300 dark:border-orange-900/50 dark:hover:border-orange-700/60",
      iconWrapper: "bg-orange-100/80 text-orange-600 group-hover:bg-orange-200/80 dark:bg-orange-900/40 dark:text-orange-400 dark:group-hover:bg-orange-800/60",
      titleColor: "text-orange-950 dark:text-orange-50",
      descColor: "text-orange-800/80 dark:text-orange-200/70",
      arrowColor: "text-orange-300 dark:text-orange-700",
    },
    green: {
      bg: "bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-950/40 dark:to-teal-900/20",
      border: "border-emerald-100 hover:border-emerald-300 dark:border-emerald-900/50 dark:hover:border-emerald-700/60",
      iconWrapper: "bg-emerald-100/80 text-emerald-600 group-hover:bg-emerald-200/80 dark:bg-emerald-900/40 dark:text-emerald-400 dark:group-hover:bg-emerald-800/60",
      titleColor: "text-emerald-950 dark:text-emerald-50",
      descColor: "text-emerald-800/80 dark:text-emerald-200/70",
      arrowColor: "text-emerald-300 dark:text-emerald-700",
    },
    blue: {
      bg: "bg-gradient-to-br from-sky-50 to-indigo-50/50 dark:from-sky-950/40 dark:to-indigo-900/20",
      border: "border-sky-100 hover:border-sky-300 dark:border-sky-900/50 dark:hover:border-sky-700/60",
      iconWrapper: "bg-sky-100/80 text-sky-600 group-hover:bg-sky-200/80 dark:bg-sky-900/40 dark:text-sky-400 dark:group-hover:bg-sky-800/60",
      titleColor: "text-sky-950 dark:text-sky-50",
      descColor: "text-sky-800/80 dark:text-sky-200/70",
      arrowColor: "text-sky-300 dark:text-sky-700",
    },
    rose: {
      bg: "bg-gradient-to-br from-rose-50 to-pink-50/50 dark:from-rose-950/40 dark:to-pink-900/20",
      border: "border-rose-100 hover:border-rose-300 dark:border-rose-900/50 dark:hover:border-rose-700/60",
      iconWrapper: "bg-rose-100/80 text-rose-600 group-hover:bg-rose-200/80 dark:bg-rose-900/40 dark:text-rose-400 dark:group-hover:bg-rose-800/60",
      titleColor: "text-rose-950 dark:text-rose-50",
      descColor: "text-rose-800/80 dark:text-rose-200/70",
      arrowColor: "text-rose-300 dark:text-rose-700",
    },
    default: {
      bg: "bg-white dark:bg-zinc-900/50",
      border: "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700",
      iconWrapper: "bg-zinc-100 text-zinc-900 group-hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:group-hover:bg-zinc-700",
      titleColor: "text-zinc-900 dark:text-zinc-100",
      descColor: "text-zinc-500 dark:text-zinc-400",
      arrowColor: "text-zinc-300 dark:text-zinc-600",
    }
  };

  const theme = colorConfig[variant] || colorConfig.default;

  return (
    <button onClick={onClick} className={`${base} ${theme.bg} ${theme.border}`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none mix-blend-overlay"></div>
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${theme.iconWrapper}`}>
          <Icon size={26} strokeWidth={1.5} />
        </div>
        <ArrowRight size={20} className={`${theme.arrowColor} group-hover:translate-x-1 transition-transform duration-300`} />
      </div>
      <div className="mt-auto relative z-10">
        <h3 className={`text-xl font-semibold mb-2 tracking-tight ${theme.titleColor}`}>{title}</h3>
        <p className={`text-sm leading-relaxed ${theme.descColor}`}>{desc}</p>
      </div>
    </button>
  );
}

export default function Dashboard() {
  const authCtx = useAuth();
  const currentUser = authCtx.currentUser ?? authCtx.user ?? null;
  const { displayName, dietType, allergies, dislikes } = useUserProfile();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState({});
  const [showComingSoonAlert, setShowComingSoonAlert] = useState(false);
  const [showLoginAlert, setShowLoginAlert] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  
  // ✅ PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

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

        // Fetch favorites for recommendations
        if (mounted) setLoadingRecs(true);
        const favs = await getFavoriteDishes(currentUser.uid, { limit: 10 });
        if (favs.length > 0 && mounted) {
          const favNames = favs.map(f => f.dishName);
          const prefs = { dietType, allergies, dislikes };
          const recs = await geminiService.fetchPersonalizedRecommendations(favNames, prefs, "English");
          if (mounted) setRecommendations(recs);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        if (mounted) {
          setLoading(false);
          setLoadingRecs(false);
        }
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
      document.getElementById('recent-dishes-section')?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  };

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

  const handleFavoritesClick = () => {
    if (!currentUser) {
      setShowLoginAlert(true);
      setTimeout(() => setShowLoginAlert(false), 3000);
    } else {
      navigate("/favorites");
    }
  };

  // ✅ SHOW FULL-PAGE LOADER
  if (loading && currentUser) {
    return <FullPageLoader text="Preparing your kitchen..." />;
  }

  const firstName = displayName ? displayName.split(' ')[0] : '';

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-zinc-950 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-50/60 dark:from-amber-900/20 via-[#FDFCFB] dark:via-zinc-950 to-[#FDFCFB] dark:to-zinc-950 selection:bg-amber-100 selection:text-amber-900 dark:selection:bg-amber-900/30 dark:selection:text-amber-100 font-sans transition-colors duration-300">
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-12 md:py-16 space-y-16">
        
        {/* Coming Soon Alert */}
        {showComingSoonAlert && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
            <div className="flex items-center gap-3 rounded-full border border-zinc-200/60 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md px-5 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-500/20 text-blue-500 dark:text-blue-400">
                <Info size={14} strokeWidth={2.5} />
              </div>
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                Explore is coming soon! Stay tuned.
              </span>
            </div>
          </div>
        )}

        {/* Login Alert */}
        {showLoginAlert && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
            <div className="flex items-center gap-3 rounded-full border border-zinc-200/60 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md px-5 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-500/20 text-rose-500 dark:text-rose-400">
                <Lock size={14} strokeWidth={2.5} />
              </div>
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                Please log in to view your favorites.
              </span>
            </div>
          </div>
        )}

        {/* Header Section */}
        <header className="space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white transition-colors">
            {currentUser ? `Welcome back, ${firstName}.` : "Welcome to ChefSpeak."}
          </h1>
          <p className="text-lg md:text-xl text-zinc-500 dark:text-zinc-400 font-medium transition-colors">
            What's on the menu today?
          </p>
        </header>

        {/* Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 relative z-10">
          <ActionTile
            icon={ChefHat}
            title="Start Cooking"
            desc="Open the AI assistant and begin a new recipe from scratch."
            variant="orange"
            onClick={() => navigate("/assistant")}
          />
          <ActionTile
            icon={Salad}
            title="Use Ingredients"
            desc="Tell us what's in your kitchen to get personalized dish suggestions."
            variant="green"
            onClick={() => navigate("/ingredients")}
          />
          <ActionTile
            icon={Compass}
            title="Explore"
            desc="Discover trending dishes and curated culinary collections."
            variant="blue"
            onClick={handleExploreClick}
          />
          <ActionTile
            icon={Heart}
            title="Favorites"
            desc="Jump right back into your saved and most loved recipes."
            variant="rose"
            onClick={handleFavoritesClick}
          />
        </div>

        {/* Recommendations Section */}
        {currentUser && recommendations.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <Sparkles size={24} className="text-amber-500" />
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                Recommended for you
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {loadingRecs ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="h-32 rounded-3xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 animate-pulse" />
                ))
              ) : (
                recommendations.map((rec, i) => (
                  <button
                    key={i}
                    onClick={() => navigate(`/assistant?dish=${encodeURIComponent(rec)}`)}
                    className="group relative overflow-hidden text-left p-6 rounded-3xl border border-amber-100 dark:border-amber-900/50 bg-gradient-to-br from-amber-50/40 to-orange-50/40 dark:from-amber-950/40 dark:to-orange-900/20 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-xl hover:shadow-amber-500/10 dark:hover:shadow-amber-900/20 transition-all duration-300"
                  >
                    <div className="absolute -right-6 -bottom-6 opacity-[0.04] dark:opacity-10 text-amber-900 dark:text-amber-400 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
                      <Sparkles size={120} />
                    </div>
                    <div className="font-semibold text-lg text-amber-950 dark:text-amber-50 mb-2 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors relative z-10">{rec}</div>
                    <div className="text-sm font-medium text-amber-700/80 dark:text-amber-400/80 flex items-center gap-2 relative z-10">
                      Start cooking <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>
        )}
        {currentUser && recommendations.length === 0 && !loadingRecs && items.length > 0 && (
           <section className="space-y-6">
             <div className="flex items-center gap-2">
               <Sparkles size={24} className="text-amber-500" />
               <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                 Recommended for you
               </h2>
             </div>
             <div className="rounded-3xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-8 text-center">
               <p className="text-zinc-600 dark:text-zinc-400">Favorite a few dishes to start getting AI-powered personalized recommendations!</p>
             </div>
           </section>
        )}

        {/* Recent Dishes Section */}
        <section id="recent-dishes-section" className="space-y-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/60">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Recent creations</h2>
            {items.length > ITEMS_PER_PAGE && (
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {items.length} total
              </span>
            )}
          </div>

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-28 rounded-3xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-3xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-12 text-center">
              <p className="text-zinc-600 dark:text-zinc-400 text-lg">
                {!currentUser ? (
                  "Log in to see and save your recent dishes."
                ) : (
                  <>Your kitchen is empty. Try <span className="font-semibold text-zinc-900 dark:text-zinc-200">Explore</span> or <span className="font-semibold text-zinc-900 dark:text-zinc-200">Use Ingredients</span> to get started.</>
                )}
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {paginatedItems.map((it) => (
                  <div
                    key={it.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openRecipeView(it)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") openRecipeView(it);
                    }}
                    className="group relative cursor-pointer text-left rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-xl dark:shadow-none transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30 flex flex-col h-full"
                  >
                    <button
                      type="button"
                      aria-label="Remove from recent"
                      title="Remove from recent"
                      onClick={(e) => handleRemove(e, it.id)}
                      className="absolute top-4 right-4 z-10 inline-flex items-center justify-center h-8 w-8 rounded-full bg-white dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 opacity-0 group-hover:opacity-100 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all focus:opacity-100 focus:outline-none"
                    >
                      {removing[it.id] ? <Loader2 size={16} className="animate-spin" /> : <X size={16} strokeWidth={2.5} />}
                    </button>

                    <div className="mt-auto pr-8">
                      <div className="font-semibold line-clamp-2 text-zinc-900 dark:text-zinc-100 text-lg leading-tight mb-2 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                        {it.dishName}
                      </div>
                      <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                        <span>{it.language || "English"}</span>
                        {it.people && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                            <span>{it.people} serving{it.people > 1 ? 's' : ''}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col items-center gap-4 pt-10">
                  <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 px-2 py-2 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="inline-flex items-center justify-center h-10 w-10 rounded-full text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                      ←
                    </button>

                    <div className="flex items-center px-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        const showPage = 
                          page === 1 || 
                          page === totalPages || 
                          (page >= currentPage - 1 && page <= currentPage + 1);
                        
                        const showEllipsis = 
                          (page === 2 && currentPage > 3) || 
                          (page === totalPages - 1 && currentPage < totalPages - 2);

                        if (showEllipsis) {
                          return <span key={page} className="px-2 text-zinc-300 dark:text-zinc-600 font-medium tracking-widest">...</span>;
                        }

                        if (!showPage) return null;

                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`inline-flex items-center justify-center h-10 min-w-[40px] px-2 rounded-full font-medium transition-all ${
                              currentPage === page
                                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-md"
                                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="inline-flex items-center justify-center h-10 w-10 rounded-full text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                      →
                    </button>
                  </div>
                  <div className="text-sm font-medium text-zinc-400 dark:text-zinc-500">
                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, items.length)} of {items.length}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

