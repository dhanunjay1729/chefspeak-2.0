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
      // Retry up to 3 times
      if (attempt < 3) {
        console.log(`Retry attempt ${attempt + 1}/3 after 3s...`);
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
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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
      userPreferences
    };

    const response = await this.fetchWithRetry(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  }

  async fetchRecipeSuggestions(preferences = {}) {
    const url = `${this.baseURL}/api/recipe/suggest`;
    
    const response = await this.fetchWithRetry(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferences),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async searchImages(query) {
    const url = `${this.baseURL}/api/images/search?query=${encodeURIComponent(query)}`;
    
    const response = await this.fetchWithRetry(url, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }
}

export const openAIService = new OpenAIService();
