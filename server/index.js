import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Initialize OpenAI with server-side key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Recipe steps endpoint
app.post('/api/recipe/steps', async (req, res) => {
  try {
    const { dish, people, extraNotes, language, userPreferences } = req.body;

    let prompt = `Give me a clear, numbered, step-by-step recipe for ${dish} for ${people} people.`;

    // Add dietary restrictions
    if (userPreferences?.dietType) {
      const dietInstructions = {
        'veg': 'Make this a completely vegetarian recipe with no meat, fish, or eggs.',
        'vegan': 'Make this a completely vegan recipe with no animal products (no meat, fish, eggs, dairy, honey).',
        'nonveg': 'You may include meat, fish, or other non-vegetarian ingredients as appropriate.'
      };
      prompt += ` ${dietInstructions[userPreferences.dietType]}`;
    }

    // Add allergy restrictions
    if (userPreferences?.allergies?.length > 0) {
      prompt += ` IMPORTANT: Avoid these allergens completely: ${userPreferences.allergies.join(', ')}.`;
    }

    // Add dislikes
    if (userPreferences?.dislikes?.length > 0) {
      prompt += ` Avoid using these ingredients if possible: ${userPreferences.dislikes.join(', ')}.`;
    }

    // Add skill level
    if (userPreferences?.skillLevel) {
      const skillInstructions = {
        'beginner': 'Keep the recipe simple with basic techniques and common ingredients.',
        'intermediate': 'You may include moderate complexity techniques and ingredients.',
        'pro': 'Feel free to use advanced techniques and specialized ingredients.'
      };
      prompt += ` ${skillInstructions[userPreferences.skillLevel]}`;
    }

    if (extraNotes?.trim()) {
      prompt += ` Additional notes: ${extraNotes}.`;
    }

    prompt += ` Respond only in ${language}. No bold letters or special characters. Use one numbered step per line.`;

    const stream = await openai.chat.completions.create({
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

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error('Recipe steps error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Nutrition info endpoint
app.post('/api/recipe/nutrition', async (req, res) => {
  try {
    const { dish, people, extraNotes, language, userPreferences } = req.body;

    let prompt = `Give me an approximate nutritional breakdown (per serving) for ${dish} for ${people} people.`;

    if (userPreferences?.dietType) {
      prompt += ` This is a ${userPreferences.dietType} recipe.`;
    }

    if (extraNotes?.trim()) {
      prompt += ` Additional notes: ${extraNotes}.`;
    }

    prompt += ` Include approximate values for calories, protein, fat, and carbohydrates. Respond only in ${language}. No bold letters, just a clear list.`;

    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      stream: true,
      messages: [
        {
          role: "system",
          content: `You are a multilingual professional chef assistant. Return nutrition facts in ${language}.`
        },
        { role: "user", content: prompt },
      ],
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error('Nutrition info error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Recipe suggestions endpoint
app.post('/api/recipe/suggest', async (req, res) => {
  try {
    const { ingredients, count = 5, cuisine, language = "English", userPreferences } = req.body;

    const list = Array.isArray(ingredients) ? ingredients : [];
    const recipeCount = Math.min(Math.max(count, 1), 5);

    let sys = [
      `You are ChefSpeak, a helpful culinary assistant.`,
      `Given a list of available ingredients, suggest ${recipeCount} realistic dish ideas that the user can likely cook now.`,
      `Prefer dishes using multiple provided ingredients and common Indian staples (oil, salt, basic spices).`,
    ];

    if (userPreferences?.dietType) {
      const dietInstructions = {
        'veg': 'Only suggest vegetarian dishes (no meat, fish, or eggs).',
        'vegan': 'Only suggest vegan dishes (no animal products whatsoever).',
        'nonveg': 'You may suggest both vegetarian and non-vegetarian dishes.'
      };
      sys.push(dietInstructions[userPreferences.dietType]);
    }

    if (userPreferences?.allergies?.length > 0) {
      sys.push(`NEVER suggest dishes containing these allergens: ${userPreferences.allergies.join(', ')}.`);
    }

    sys.push(`Output strict JSON: {"recipes":["Dish 1","Dish 2","Dish 3","Dish 4","Dish 5"]}.`);
    sys.push(`No extra text or keys. Use ${language} for dish names.`);

    const user = [
      cuisine ? `Target cuisine: ${cuisine}.` : "",
      `Available ingredients: ${list.join(", ") || "(none listed)"}.`,
      userPreferences?.dislikes?.length > 0 ?
        `Try to avoid these ingredients: ${userPreferences.dislikes.join(', ')}.` : "",
      `Return exactly ${recipeCount} distinct dish names.`,
    ].join(" ");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: sys.join(" ") },
        { role: "user", content: user },
      ],
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}");
    let recipes = parsed.recipes || [];

    while (recipes.length < recipeCount) {
      recipes.push(`Recipe Idea ${recipes.length + 1}`);
    }

    res.json({ recipes: recipes.slice(0, recipeCount) });

  } catch (error) {
    console.error('Recipe suggestion error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Unsplash image search endpoint
app.get('/api/images/search', async (req, res) => {
  try {
    const { query } = req.query;
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1`,
      {
        headers: {
          Authorization: `Client-ID ${process.env.UNSPLASH_API_KEY}`,
        },
      }
    );

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('Image search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Google Custom Search endpoint
app.get('/api/search', async (req, res) => {
  try {
    const { query } = req.query;
    const url = `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_CSE_KEY}&cx=${process.env.GOOGLE_CSE_CX}&q=${encodeURIComponent(query)}`;
    
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});