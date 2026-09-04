// src/services/geminiService.js
export class GeminiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';
  }

  /**
   * Fetch with retry optimized for slow free-tier cold starts and transient 5xx errors
   */
  async fetchWithRetry(url, options, attempt = 1) {
    try {
      const response = await fetch(url, options);
      // If server returned 5xx (e.g. Render cold start or momentary spike) and we have retries left
      if (!response.ok && response.status >= 500 && attempt < 3) {
        const delay = attempt * 2000;
        console.warn(`[Attempt ${attempt}/3] Backend returned ${response.status}. Retrying in ${delay / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, options, attempt + 1);
      }
      return response;
    } catch (error) {
      if (attempt < 5) {
        // Calculate delay based on attempt to give Render time to wake up
        const delay = attempt === 1 ? 3000 : (attempt + 1) * 5000; 
        console.warn(`[Attempt ${attempt}/5] Backend might be asleep. Retrying in ${delay / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, options, attempt + 1);
      }
      throw error;
    }
  }

  async fetchRecipeSteps(dish, people, extraNotes, language, userPreferences = {}, opts = {}) {
    const url = `${this.baseURL}/api/recipe/steps`;
    const payload = {
      dish,
      people,
      extraNotes,
      language,
      userPreferences,
      ...opts
    };

    const response = await this.fetchWithRetry(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Recipe steps request failed: ${response.status}`);
    }

    return response;
  }

  async fetchNutritionInfo(dish, people, extraNotes, language, userPreferences = {}) {
    const url = `${this.baseURL}/api/recipe/nutrition`;
    const payload = {
      dish,
      people,
      extraNotes,
      language,
      userPreferences,
    };

    const response = await this.fetchWithRetry(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Nutrition info request failed: ${response.status}`);
    }

    return response;
  }

  async fetchRecipeSuggestions(preferences = {}) {
    const url = `${this.baseURL}/api/recipe/suggestions`;
    const payload = { preferences };

    const response = await this.fetchWithRetry(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Recipe suggestions request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.suggestions || [];
  }

  // ✅ ADD THIS METHOD: Suggest recipes based on ingredients
  async suggestRecipesByIngredients(ingredients) {
    const url = `${this.baseURL}/api/recipe/suggest-by-ingredients`;
    const payload = { ingredients };

    const response = await this.fetchWithRetry(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Ingredient suggestions request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.suggestions || [];
  }

  // ✅ ADD THIS METHOD: Personalized recommendations based on favorites
  async fetchPersonalizedRecommendations(favoriteDishes, userPreferences = {}, language = "English") {
    const url = `${this.baseURL}/api/recipe/recommend`;
    const payload = { favoriteDishes, userPreferences, language };

    const response = await this.fetchWithRetry(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Personalized recommendation request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.recommendations || [];
  }

  async searchImages(query) {
    const url = `${this.baseURL}/api/images/search`;
    const payload = { query };

    const response = await this.fetchWithRetry(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Image search request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.images || [];
  }
}

export const geminiService = new GeminiService();
