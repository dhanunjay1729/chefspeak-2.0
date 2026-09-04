import { useState, useEffect } from "react";
import { Heart, Loader2, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { addFavoriteDish, isDishFavorited, removeFavoriteDish, getFavoriteIdByDishName } from "../services/userService";
import { toast } from "../contexts/ToastContext";

export function FavoriteButton({ 
  recipe, 
  className = "", 
  showText = true,
  onFavoriteChange = () => {} 
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Check if recipe is already favorited
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!user?.uid || !recipe?.dishName) {
        setIsCheckingStatus(false);
        return;
      }

      try {
        const favorited = await isDishFavorited(user.uid, recipe.dishName);
        setIsFavorited(favorited);
      } catch (error) {
        console.error("Failed to check favorite status:", error);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkFavoriteStatus();
  }, [user?.uid, recipe?.dishName]);

  const handleToggleFavorite = async () => {
    if (!user?.uid) {
      setShowLoginModal(true);
      return;
    }
    if (!recipe || isLoading) return;

    setIsLoading(true);
    try {
      if (!isFavorited) {
        // Add to favorites
        await addFavoriteDish(user.uid, {
          dishName: recipe.dishName,
          imageUrl: recipe.imageUrl,
          language: recipe.language,
          people: recipe.people,
          notes: recipe.notes,
          recipeSteps: recipe.recipeSteps,
          nutritionInfo: recipe.nutritionInfo,
        });
        setIsFavorited(true);
        onFavoriteChange(true);
        toast.success("Saved to favorites");
      } else {
        // ✅ FIX: Look up the favorite's document ID and remove it
        const favId = await getFavoriteIdByDishName(user.uid, recipe.dishName);
        if (favId) {
          await removeFavoriteDish(user.uid, favId);
          setIsFavorited(false);
          onFavoriteChange(false);
          toast.info("Removed from favorites");
        }
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      toast.error("Unable to update favorites. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingStatus) {
    return (
      <button
        disabled
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gray-100 text-gray-400 ${className}`}
      >
        <Loader2 size={16} className="animate-spin" />
        {showText && <span>Checking...</span>}
      </button>
    );
  }

  return (
    <>
      <button
        onClick={handleToggleFavorite}
        disabled={isLoading}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
          isFavorited
            ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
            : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
        } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {isLoading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Heart 
            size={16} 
            className={isFavorited ? "fill-current" : ""} 
          />
        )}
        {showText && (
          <span>
            {isFavorited ? "Favorited" : "Add to Favorites"}
          </span>
        )}
      </button>

      {/* Login Required Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="font-semibold text-lg text-gray-900">Sign In Required</h3>
              <button 
                onClick={() => setShowLoginModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart size={24} className="fill-current" />
              </div>
              <p className="text-gray-600 mb-6">
                Create an account or sign in to save this recipe to your personal favorites collection!
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => { setShowLoginModal(false); navigate('/login'); }}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors cursor-pointer"
                >
                  Log In
                </button>
                <button
                  onClick={() => { setShowLoginModal(false); navigate('/signup'); }}
                  className="w-full bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium py-2.5 px-4 rounded-lg transition-colors cursor-pointer"
                >
                  Create an Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}