// src/services/openaiService.js
export class OpenAIService {
  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';
  }

  async fetchRecipeSteps(dish, people, extraNotes, language, userPreferences = {}, opts = {}) {
    const response = await fetch(`${this.baseUrl}/api/recipe/steps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        dish, 
        people, 
        extraNotes, 
        language,
        userPreferences 
      }),
    });
    
    return response;
  }

  async fetchNutritionInfo(dish, people, extraNotes, language, userPreferences = {}) {
    const response = await fetch(`${this.baseUrl}/api/nutrition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        dish, 
        people, 
        extraNotes, 
        language,
        userPreferences 
      }),
    });
    
    const data = await response.json();
    return data.nutrition;
  }

  async suggestRecipesByIngredients(ingredients, opts = {}) {
    const response = await fetch(`${this.baseUrl}/api/recipe/suggest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ingredients,
        count: opts.count ?? 5,
        cuisine: opts.cuisine || '',
        language: opts.language || 'English',
        userPreferences: opts.userPreferences || {},
      }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.recipes || [];
  }

  async parseStreamingResponse(response, opts = {}) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.content || '';
            if (content) {
              fullText += content;
              if (opts.onText) {
                opts.onText(content);
              }
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }

    if (opts.onDone) {
      opts.onDone(fullText);
    }

    return fullText;
  }

  // Image search (proxied through backend)
  async searchImage(query) {
    const response = await fetch(`${this.baseUrl}/api/search-image?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    return data.imageUrl;
  }

  // Google search (proxied through backend)
  async googleSearch(query) {
    const response = await fetch(`${this.baseUrl}/api/google-search?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    return data.results;
  }
}
