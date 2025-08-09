export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { dish, people, extraNotes, language } = req.body;

  let prompt = `Give me a detailed step-by-step recipe for making ${dish} for ${people} people.`;
  if (extraNotes?.trim()) prompt += ` Additional notes: ${extraNotes}.`;
  prompt += ` Respond only in ${language}. No bold letters or special characters. Just clear, numbered steps.`;

  try {
    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a multilingual professional chef assistant. Always give clear, numbered steps in ${language}.`,
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!openAIResponse.ok || !openAIResponse.body) {
      const errText = await openAIResponse.text();
      console.error("❌ OpenAI error:", errText);
      return res.status(openAIResponse.status).send("OpenAI request failed");
    }

    res.setHeader("Content-Type", "text/event-stream");
    const reader = openAIResponse.body.getReader();
    const encoder = new TextEncoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }

    res.end();
  } catch (err) {
    console.error("🔥 Server error in /api/recipe:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
