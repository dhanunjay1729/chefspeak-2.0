// src/services/openaiService.js
export class OpenAIService {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async fetchRecipeSteps(dish, people, extraNotes, language, opts = {}) {
    let prompt = `Give me a clear, numbered, step-by-step recipe for ${dish} for ${people} people.`;
    if (extraNotes && extraNotes.trim()) {
      prompt += ` Additional notes: ${extraNotes}.`;
    }
    prompt += ` Respond only in ${language}. No bold letters or special characters. Use one numbered step per line.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.5,
        stream: true,
        messages: [
          {
            role: "system",
            content: `You are a multilingual professional chef assistant. Output only cooking steps, numbered, in ${language}.`,
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error("OpenAI streaming response failed");
    }

    // opts contains onText callback for per-token updates
    const fullText = await this.parseStreamingResponse(response, opts);
    return fullText;
  }

  async fetchNutritionInfo(dish, people, extraNotes, language) {
    let prompt = `Give me an approximate nutritional breakdown (per serving) for ${dish} for ${people} people.`;
    if (extraNotes && extraNotes.trim()) {
      prompt += ` Additional notes: ${extraNotes}.`;
    }
    prompt += ` Include approximate values for calories, protein, fat, and carbohydrates. Respond only in ${language}. No bold letters, just a clear list.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        stream: true,
        messages: [
          {
            role: "system",
            content: `You are a multilingual professional chef assistant. Return nutrition facts in ${language}.`,
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error("OpenAI streaming response failed");
    }

    // We don’t need per-token updates for nutrition; just return the final text.
    const fullText = await this.parseStreamingResponse(response);
    return fullText;
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
      buffer = lines.pop(); // keep partial line in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;

        const data = trimmed.slice(5).trim(); // after "data:"
        if (data === "[DONE]") continue;

        try {
          const json = JSON.parse(data);
          const delta = json.choices?.[0]?.delta;
          const token = delta?.content || "";
          if (token) {
            fullText += token;
            if (onText) onText(token);
          }
        } catch {
          // ignore malformed chunks
        }
      }
    }

    if (onDone) onDone(fullText);
    return fullText;
  }
}
