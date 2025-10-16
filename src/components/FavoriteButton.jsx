import { useState, useEffect } from "react";
import { Heart, Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { addFavoriteDish, isDishFavorited } from "../services/userService";

export function FavoriteButton({ 
  recipe, 
  className = "", 
  showText = true,
  onFavoriteChange = () => {} 
}) {
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

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
    if (!user?.uid || !recipe || isLoading) return;

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
      } else {
        // Note: We don't remove from favorites here since we'd need the favorite's document ID
        // This would require a more complex implementation
        console.log("Remove from favorites functionality not implemented yet");
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
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
  );
}