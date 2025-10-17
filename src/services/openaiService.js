// src/services/openaiService.js
export class OpenAIService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';
  }

  async fetchRecipeSteps(dish, people, extraNotes, language, userPreferences = {}, opts = {}) {
    const response = await fetch(`${this.baseURL}/api/recipe/steps`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dish,
        people,
        extraNotes,
        language,
        userPreferences,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('Streaming not supported');
    }

    return await this.parseStreamingResponse(response, opts);
  }

  async fetchNutritionInfo(dish, people, extraNotes, language, userPreferences = {}) {
    const response = await fetch(`${this.baseURL}/api/recipe/nutrition`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dish,
        people,
        extraNotes,
        language,
        userPreferences,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('Streaming not supported');
    }

    return await this.parseStreamingResponse(response);
  }

  async suggestRecipesByIngredients(ingredients, opts = {}) {
    const response = await fetch(`${this.baseURL}/api/recipe/suggest`, {
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
    const response = await fetch(
      `${this.baseURL}/api/images/search?query=${encodeURIComponent(query)}`
    );
    
    if (!response.ok) {
      throw new Error(`Image search failed: ${response.statusText}`);
    }
    
    return await response.json();
  }

  // Google search (proxied through backend)
  async googleSearch(query) {
    const response = await fetch(
      `${this.baseURL}/api/search?query=${encodeURIComponent(query)}`
    );
    
    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }
    
    return await response.json();
  }
}
