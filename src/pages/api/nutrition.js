import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { dish, people, extraNotes, language } = req.body;

  let prompt = `Give me an approximate nutritional breakdown (per serving) for ${dish} made for ${people} people.`;
  if (extraNotes?.trim()) prompt += ` Additional notes: ${extraNotes}.`;
  prompt += ` Include approximate values for calories, protein, fat, and carbohydrates. Respond only in ${language}. No bold letters, just a clear list.`;

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
            systemInstruction: `You are a multilingual professional chef assistant. Always return nutrition facts in ${language}. Do not use markdown bold letters or asterisks.`,
            temperature: 0.3,
          }
        });
        if (stream) break;
      } catch (e) {
        console.warn(`[Vercel /api/nutrition] ${model} failed, trying next model:`, e.message?.slice(0, 80));
      }
    }

    if (!stream) throw new Error("All nutrition models temporarily unavailable");

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
    console.error("🔥 Server error in /api/nutrition:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
