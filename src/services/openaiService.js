// src/services/openaiService.js
export class OpenAIService {
  constructor(apiKey) {
    // Fallback to Vite env automatically
    const k = apiKey ?? import.meta.env.VITE_OPENAI_API_KEY ?? import.meta.env.VITE_OPENAI_KEY;
    this.apiKey = (k || "").trim();
  }

  ensureKey() {
    if (!this.apiKey) {
      throw new Error(
        "Missing OpenAI API key. Set VITE_OPENAI_API_KEY in .env (Vite) or pass into OpenAIService(apiKey)."
      );
    }
  }

  async _fetchJSON(url, payload) {
    this.ensureKey();
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      // Surface helpful error info for 401/403/etc
      const text = await resp.text().catch(() => "");
      const msg = `${resp.status} ${resp.statusText} ${text}`.slice(0, 400);
      throw new Error(`OpenAI request failed: ${msg}`);
    }
    return resp;
  }

  async fetchRecipeSteps(dish, people, extraNotes, language, opts = {}) {
    this.ensureKey();
    let prompt = `Give me a clear, numbered, step-by-step recipe for ${dish} for ${people} people.`;
    if (extraNotes && extraNotes.trim()) {
      prompt += ` Additional notes: ${extraNotes}.`;
    }
    prompt += ` Respond only in ${language}. No bold letters or special characters. Use one numbered step per line.`;

    const response = await this._fetchJSON("https://api.openai.com/v1/chat/completions", {
      model: "gpt-4o-mini",
      temperature: 0.5,
      stream: true,
      messages: [
        { role: "system", content: `You are a multilingual professional chef assistant. Output only cooking steps, numbered, in ${language}.` },
        { role: "user", content: prompt },
      ],
    });

    if (!response.body) throw new Error("OpenAI streaming response failed");
    const fullText = await this.parseStreamingResponse(response, opts);
    return fullText;
  }

  async fetchNutritionInfo(dish, people, extraNotes, language) {
    this.ensureKey();
    let prompt = `Give me an approximate nutritional breakdown (per serving) for ${dish} for ${people} people.`;
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

  // ---- NEW: 5 recipe ideas by ingredients ----
  // Returns array of exactly 5 strings.
  async suggestRecipesByIngredients(ingredients, opts = {}) {
    this.ensureKey();
    const list = Array.isArray(ingredients) ? ingredients : [];
    const count = Math.min(Math.max(opts.count ?? 5, 1), 5);
    const cuisine = opts.cuisine || "";
    const language = opts.language || "English";

    const sys = [
      `You are ChefSpeak, a helpful culinary assistant.`,
      `Given a list of available ingredients, suggest ${count} realistic dish ideas that the user can likely cook now.`,
      `Prefer dishes using multiple provided ingredients and common Indian staples (oil, salt, basic spices).`,
      `Output strict JSON: {"recipes":["Dish 1","Dish 2","Dish 3","Dish 4","Dish 5"]}.`,
      `No extra text or keys. Use ${language} for dish names.`,
    ].join(" ");

    const user = [
      cuisine ? `Target cuisine: ${cuisine}.` : "",
      `Available ingredients: ${list.join(", ") || "(none listed)"}.`,
      `Return exactly ${count} distinct dish names.`,
    ].join(" ");

    const resp = await this._fetchJSON("https://api.openai.com/v1/chat/completions", {
      model: "gpt-4o-mini",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
    });

    const data = await resp.json();
    const raw = data?.choices?.[0]?.message?.content ?? "";

    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); } catch {}
      }
    }

    let recipes = [];
    if (parsed && Array.isArray(parsed.recipes)) {
      recipes = parsed.recipes.filter((x) => typeof x === "string");
    }

    // Fallback if model ever returns text lines
    if (recipes.length === 0 && raw) {
      const lines = raw
        .split(/\r?\n/)
        .map((l) => l.replace(/^[-*\d\.\s]+/, "").trim())
        .filter(Boolean);
      recipes = Array.from(new Set(lines)).slice(0, count);
    }

    if (recipes.length > count) recipes = recipes.slice(0, count);
    while (recipes.length < count) recipes.push(`Dish Idea ${recipes.length + 1}`);

    return recipes;
  }

  async parseStreamingResponse(response, opts = {}) {
    const { onText, onDone } = opts;
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") continue;

        try {
          const json = JSON.parse(data);
          const delta = json.choices?.[0]?.delta;
          const token = delta?.content || "";
          if (token) {
            fullText += token;
            if (onText) onText(token);
          }
        } catch {}
      }
    }

    if (onDone) onDone(fullText);
    return fullText;
  }
}
