import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { dish, people, extraNotes, language } = req.body;

  let prompt = `Give me an approximate nutritional breakdown (per serving) for ${dish} made for ${people} people.`;
  if (extraNotes?.trim()) prompt += ` Additional notes: ${extraNotes}.`;
  prompt += ` Include approximate values for calories, protein, fat, and carbohydrates. Respond only in ${language}. No bold letters, just a clear list.`;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const stream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: `You are a multilingual professional chef assistant. Always return nutrition facts in ${language}.`,
        temperature: 0.3,
      }
    });

    res.setHeader("Content-Type", "text/event-stream");

    for await (const chunk of stream) {
      const content = chunk.text || '';
      if (content) {
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
