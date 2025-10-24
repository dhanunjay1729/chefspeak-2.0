// src/services/openaiService.js
export class OpenAIService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';
  }

  /**
   * Fetch with simple retry (3 attempts, 3 second delay)
   */
  async fetchWithRetry(url, options, attempt = 1) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      if (attempt < 3) {
        await new Promise(resolve => setTimeout(resolve, 3000));
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

export const openAIService = new OpenAIService();
