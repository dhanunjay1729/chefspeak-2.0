// src/services/openaiService.js
export class OpenAIService {
  constructor(apiKey) {
    const k = apiKey ?? import.meta.env.VITE_OPENAI_API_KEY ?? import.meta.env.VITE_OPENAI_KEY;
    this.apiKey = (k || "").trim();
  }

  ensureKey() {
    if (!this.apiKey) {
      throw new Error("OpenAI API key is missing. Set VITE_OPENAI_API_KEY in your .env file.");
    }
  }

  async _fetchJSON(url, payload) {
    this.ensureKey();
    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    });
  }

  async fetchRecipeSteps(dish, people, extraNotes, language, userPreferences = {}, opts = {}) {
    this.ensureKey();
    
    let prompt = `Give me a clear, numbered, step-by-step recipe for ${dish} for ${people} people.`;
    
    // Add dietary restrictions
    if (userPreferences.dietType) {
      const dietInstructions = {
        'veg': 'Make this a completely vegetarian recipe with no meat, fish, or eggs.',
        'vegan': 'Make this a completely vegan recipe with no animal products (no meat, fish, eggs, dairy, honey).',
        'nonveg': 'You may include meat, fish, or other non-vegetarian ingredients as appropriate.'
      };
      prompt += ` ${dietInstructions[userPreferences.dietType]}`;
    }

    // Add allergy restrictions
    if (userPreferences.allergies && userPreferences.allergies.length > 0) {
      prompt += ` IMPORTANT: Avoid these allergens completely: ${userPreferences.allergies.join(', ')}.`;
    }

    // Add dislikes
    if (userPreferences.dislikes && userPreferences.dislikes.length > 0) {
      prompt += ` Avoid using these ingredients if possible: ${userPreferences.dislikes.join(', ')}.`;
    }

    // Add skill level consideration
    if (userPreferences.skillLevel) {
      const skillInstructions = {
        'beginner': 'Keep the recipe simple with basic techniques and common ingredients.',
        'intermediate': 'You may include moderate complexity techniques and ingredients.',
        'pro': 'Feel free to use advanced techniques and specialized ingredients.'
      };
      prompt += ` ${skillInstructions[userPreferences.skillLevel]}`;
    }

    if (extraNotes && extraNotes.trim()) {
      prompt += ` Additional notes: ${extraNotes}.`;
    }
    
    prompt += ` Respond only in ${language}. No bold letters or special characters. Use one numbered step per line.`;

    const response = await this._fetchJSON("https://api.openai.com/v1/chat/completions", {
      model: "gpt-4o-mini",
      temperature: 0.5,
      stream: true,
      messages: [
        { 
          role: "system", 
          content: `You are a multilingual professional chef assistant. Output only cooking steps, numbered, in ${language}. Always respect dietary restrictions and allergies.` 
        },
        { role: "user", content: prompt },
      ],
    });

    if (!response.body) throw new Error("OpenAI streaming response failed");
    const fullText = await this.parseStreamingResponse(response, opts);
    return fullText;
  }

  async fetchNutritionInfo(dish, people, extraNotes, language, userPreferences = {}) {
    this.ensureKey();
    
    let prompt = `Give me an approximate nutritional breakdown (per serving) for ${dish} for ${people} people.`;
    
    // Include dietary context for more accurate nutrition
    if (userPreferences.dietType) {
      prompt += ` This is a ${userPreferences.dietType} recipe.`;
    }
    
    if (extraNotes && extraNotes.trim()) {
      prompt += ` Additional notes: ${extraNotes}.`;
    }
    
    prompt += ` Include approximate values for calories, protein, fat, and carbohydrates. Respond only in ${language}. No bold letters, just a clear list.`;

    const response = await this._fetchJSON("https://api.openai.com/v1/chat/completions", {
      model: "gpt-4o-mini",
      temperature: 0.2,
      stream: true,
      messages: [
        { role: "system", content: `You are a multilingual professional chef assistant. Return nutrition facts in ${language}.` },
        { role: "user", content: prompt },
      ],
    });

    if (!response.body) throw new Error("OpenAI streaming response failed");
    const fullText = await this.parseStreamingResponse(response);
    return fullText;
  }

  async suggestRecipesByIngredients(ingredients, opts = {}) {
    this.ensureKey();
    const list = Array.isArray(ingredients) ? ingredients : [];
    const count = Math.min(Math.max(opts.count ?? 5, 1), 5);
    const cuisine = opts.cuisine || "";
    const language = opts.language || "English";
    const userPreferences = opts.userPreferences || {};

    let sys = [
      `You are ChefSpeak, a helpful culinary assistant.`,
      `Given a list of available ingredients, suggest ${count} realistic dish ideas that the user can likely cook now.`,
      `Prefer dishes using multiple provided ingredients and common Indian staples (oil, salt, basic spices).`,
    ];

    // Add dietary restrictions to system prompt
    if (userPreferences.dietType) {
      const dietInstructions = {
        'veg': 'Only suggest vegetarian dishes (no meat, fish, or eggs).',
        'vegan': 'Only suggest vegan dishes (no animal products whatsoever).',
        'nonveg': 'You may suggest both vegetarian and non-vegetarian dishes.'
      };
      sys.push(dietInstructions[userPreferences.dietType]);
    }

    // Add allergy restrictions
    if (userPreferences.allergies && userPreferences.allergies.length > 0) {
      sys.push(`NEVER suggest dishes containing these allergens: ${userPreferences.allergies.join(', ')}.`);
    }

    sys.push(`Output strict JSON: {"recipes":["Dish 1","Dish 2","Dish 3","Dish 4","Dish 5"]}.`);
    sys.push(`No extra text or keys. Use ${language} for dish names.`);

    const user = [
      cuisine ? `Target cuisine: ${cuisine}.` : "",
      `Available ingredients: ${list.join(", ") || "(none listed)"}.`,
      userPreferences.dislikes && userPreferences.dislikes.length > 0 ? 
        `Try to avoid these ingredients: ${userPreferences.dislikes.join(', ')}.` : "",
      `Return exactly ${count} distinct dish names.`,
    ].join(" ");

    const resp = await this._fetchJSON("https://api.openai.com/v1/chat/completions", {
      model: "gpt-4o-mini",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: sys.join(" ") },
        { role: "user", content: user },
      ],
    });

    const data = await resp.json();
    if (data.error) throw new Error(`OpenAI: ${data.error.message}`);

    let recipes = [];
    try {
      const parsed = JSON.parse(data.choices[0]?.message?.content || "{}");
      recipes = parsed.recipes || [];
    } catch {
      // Fallback parsing if JSON fails
    }

    // Ensure we return exactly the requested count
    while (recipes.length < count) {
      recipes.push(`Recipe Idea ${recipes.length + 1}`);
    }
    return recipes.slice(0, count);
  }

  async parseStreamingResponse(response, opts = {}) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";

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
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) {
              fullText += content;
              if (opts.onText) {
                opts.onText(content);
              }
            }
          } catch (err) {
            // Skip invalid JSON lines
            console.debug("Failed to parse SSE chunk:", err);
          }
        }
      }
    }

    if (opts.onDone) {
      opts.onDone(fullText);
    }

    return fullText;
  }
}
