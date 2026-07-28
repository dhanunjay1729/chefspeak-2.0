import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { dish, people, extraNotes, language } = req.body;

  let prompt = `Give me a detailed step-by-step recipe for making ${dish} for ${people} people.`;
  if (extraNotes?.trim()) prompt += ` Additional notes: ${extraNotes}.`;
  prompt += ` Respond only in ${language}. No bold letters or special characters. Just clear, numbered steps.`;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const stream = await ai.models.generateContentStream({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
      config: {
        systemInstruction: `You are a multilingual professional chef assistant. Always give clear, numbered steps in ${language}.`,
        temperature: 0.7,
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
    console.error("🔥 Server error in /api/recipe:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
