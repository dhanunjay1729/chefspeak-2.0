import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { dish, people, extraNotes, language } = req.body;

  let prompt = `Give me a detailed step-by-step recipe for making ${dish} for ${people} people.`;
  if (extraNotes?.trim()) prompt += ` Additional notes: ${extraNotes}.`;
  prompt += ` Respond only in ${language}. No bold letters or special characters. Just clear, numbered steps.`;

  const MODELS_CASCADE = ['gemini-3.1-flash-lite', 'gemini-3.6-flash', 'gemini-3.5-flash'];

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    let stream = null;

    for (const model of MODELS_CASCADE) {
      try {
        stream = await ai.models.generateContentStream({
          model,
          contents: prompt,
          config: {
            systemInstruction: `You are a multilingual professional chef assistant. Always give clear, numbered steps in ${language}. Do not use bold letters or asterisks.`,
            temperature: 0.5,
          }
        });
        if (stream) break;
      } catch (e) {
        console.warn(`[Vercel /api/recipe] ${model} failed, trying next model:`, e.message?.slice(0, 80));
      }
    }

    if (!stream) throw new Error("All recipe models temporarily unavailable");

    res.setHeader("Content-Type", "text/event-stream");

    for await (const chunk of stream) {
      let content = chunk.text || '';
      if (content) {
        content = content.replace(/\*\*/g, '').replace(/^#+\s*/gm, '');
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error("🔥 Server error in /api/recipe:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
