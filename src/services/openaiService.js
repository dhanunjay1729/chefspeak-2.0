// src/services/openaiService.js
export class OpenAIService {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async fetchRecipeSteps(dish, people, extraNotes, language) {
    let prompt = `Give me a detailed step-by-step recipe for making ${dish} for ${people} people.`;
    if (extraNotes.trim()) {
      prompt += ` Additional notes: ${extraNotes}.`;
    }
    prompt += ` Respond only in ${language}. No bold letters or special characters. Just clear, numbered steps.`;

    console.log("🔍 Fetching recipe for:", { dish, people, extraNotes, language });

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a multilingual professional chef assistant. Always give clear, numbered steps in the user's preferred language: ${language}.`,
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error("OpenAI streaming response failed");
    }

    return this.parseStreamingResponse(response);
  }

  // ✅ NEW FUNCTION: Fetch approximate nutritional info
  async fetchNutritionInfo(dish, people, extraNotes, language) {
    let prompt = `Give me an approximate nutritional breakdown (per serving) for ${dish} made for ${people} people.`;
    if (extraNotes.trim()) {
      prompt += ` Additional notes: ${extraNotes}.`;
    }
    prompt += ` Include approximate values for calories, protein, fat, and carbohydrates. Respond only in ${language}. No bold letters, just a clear list.`;

    console.log("🔍 Fetching nutrition info for:", { dish, people, extraNotes, language });

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a multilingual professional chef assistant. Always return nutrition facts in the user's preferred language: ${language}.`,
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        stream: true,
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error("OpenAI streaming response failed");
    }

    return this.parseStreamingResponse(response);
  }

  async parseStreamingResponse(response) {
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
        if (trimmed.startsWith("data: ")) {
          const data = trimmed.replace(/^data: /, "");
          if (data === "[DONE]") break;
          try {
            const json = JSON.parse(data);
            const token = json.choices?.[0]?.delta?.content;
            if (token) {
              fullText += token;
            }
          } catch (err) {
            console.error("Skipping invalid JSON chunk", err);
          }
        }
      }
    }

    return fullText;
  }
}
