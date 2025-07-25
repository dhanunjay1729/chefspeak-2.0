// src/services/unsplashService.js
const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_API_KEY;

export async function fetchDishImage(dishName) {
  if (!dishName) return null;
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
        dishName
      )}&client_id=${UNSPLASH_ACCESS_KEY}&per_page=1`
    );
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].urls.regular;
    }
    return null;
  } catch (error) {
    console.error("❌ Error fetching image:", error);
    return null;
  }
}
