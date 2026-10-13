import { recipeSchema } from './recipeSchema.js';
import { normalizeSuggestions } from './pantry.js';
import { sanitizeNutrition } from './nutrition.js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import textToSpeech from '@google-cloud/text-to-speech';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import path from 'path';

// Fix __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Initialize Gemini with server-side key
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// ✅ Model Cascade for High Availability & Fault Tolerance
// Primary: gemini-3.1-flash-lite (Ultra-fast TTFT ~2s, highest quota efficiency)
// Fallback 1: gemini-3.6-flash (High reasoning, unblocked compute pool)
// Fallback 2: gemini-3.5-flash (Proven high-intelligence workhorse)
const MODELS_CASCADE = [
  'gemini-3.1-flash-lite',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
];

function isRetryableError(err) {
  if (!err) return false;
  if (err.status === 503 || err.status === 429) return true;
  const msg = (err.message || '').toLowerCase();
  return (
    msg.includes('503') ||
    msg.includes('429') ||
    msg.includes('high demand') ||
    msg.includes('quota') ||
    msg.includes('resource_exhausted') ||
    msg.includes('unavailable') ||
    msg.includes('rate limit') ||
    msg.includes('overloaded') ||
    msg.includes('fetch failed')
  );
}

// Call non-streaming models with fallback cascade and backoff jitter
async function callWithFallback(generateFn) {
  let lastError = null;
  for (const model of MODELS_CASCADE) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        return await generateFn(model);
      } catch (err) {
        lastError = err;
        console.warn(`[AI] Model ${model} (attempt ${attempt}) failed:`, err.message?.slice(0, 100));
        if (attempt === 1 && isRetryableError(err)) {
          await new Promise((r) => setTimeout(r, 1200 + Math.random() * 600));
          continue;
        }
        break; // Switch to next model in cascade
      }
    }
  }
  throw lastError;
}

// Robust JSON cleaner & parser that handles markdown fences and partial text
function cleanAndParseJson(rawText, fallback = {}) {
  if (!rawText || typeof rawText !== 'string') return fallback;
  const trimmed = rawText.trim();
  try {
    return JSON.parse(trimmed);
  } catch (e1) {
    const noFences = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    try {
      return JSON.parse(noFences);
    } catch (e2) {
      const objMatch = noFences.match(/\{[\s\S]*\}/);
      if (objMatch) {
        try { return JSON.parse(objMatch[0]); } catch (e3) {}
      }
      const arrMatch = noFences.match(/\[[\s\S]*\]/);
      if (arrMatch) {
        try { return JSON.parse(arrMatch[0]); } catch (e4) {}
      }
      return fallback;
    }
  }
}

// Initialize Google TTS
let ttsClient;
try {
  if (process.env.GOOGLE_TTS_KEY_PATH) {
    ttsClient = new textToSpeech.TextToSpeechClient({
      keyFilename: process.env.GOOGLE_TTS_KEY_PATH,
    });
  } else if (process.env.GOOGLE_TTS_CREDENTIALS) {
    const credentials = JSON.parse(process.env.GOOGLE_TTS_CREDENTIALS);
    ttsClient = new textToSpeech.TextToSpeechClient({
      credentials,
    });
  }
  console.log('✅ Google TTS client initialized');
} catch (err) {
  console.error('❌ Google TTS initialization failed:', err);
}

// ✅ UPDATED CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost and any vercel.app subdomain for preview deployments
    if (
      origin.startsWith('http://localhost:') || 
      origin.endsWith('.vercel.app') || 
      origin === 'https://chefspeak.vercel.app'
    ) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Support HEAD requests
app.head('/health', (req, res) => {
  res.status(200).end();
});

// ✅ Security: Rate Limiting
// Limit each IP to 200 API requests per 24 hours
// (A single recipe generation triggers steps + nutrition + optional TTS, so 200 allows ~40-50 full recipes)
const apiLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 200, 
  message: { error: 'Daily recipe limit reached. Please try again tomorrow to ensure fair usage for everyone.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter to all API routes
app.use('/api/', apiLimiter);

// Recipe steps endpoint
app.post('/api/recipe/steps', async (req, res) => {
  try {
    const { dish, people, extraNotes, language = 'English', userPreferences, outputFormat } = req.body;

    let prompt = `Give me a clear, numbered, step-by-step recipe for ${dish} for ${people} people. And the first step should be the list of ingredients required with their quantities.(make the first line catchy)`;

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

    let systemInstruction;
    if (outputFormat === 'structured') {
      prompt = prompt.replace('And the first step should be the list of ingredients required with their quantities.(make the first line catchy)', '');
      prompt += ` Respond with a JSON array of objects only. First object: {"type":"ingredients","items":[{"id":"i1","name":"Rice","quantity":1,"unit":"cup","optional":false}]}. Then one object per cooking step: {"type":"step","text":"Rinse the rice.","ingredientIds":["i1"],"ingredientAmounts":[{"ingredientId":"i1","quantity":1,"unit":"cup"}],"timeSeconds":null}. Include every ingredient and its quantity in the first object, including oil, seasoning and water. Use unique IDs and reference only those IDs in each step. ingredientAmounts must list the amount actually used in that step, such as half the oil now and the rest later; use an empty array when no ingredients are used. Use null quantity for amounts such as to taste and explain that in unit. timeSeconds is a positive integer only for a timer the user should start during that step; otherwise null. Keep JSON keys, type values and IDs exactly as specified. Write ingredient names, units and step text in ${language}. Do not include an ingredients step among cooking steps.`;
      systemInstruction = 'You are a professional chef. Respect all dietary restrictions and allergies. Output a JSON array using the requested schema. The first object must contain all ingredients; subsequent objects must contain cooking steps. Never use markdown fences, comments, or extra text.';
    } else {
      prompt += ` Respond only in ${language}. Do not use markdown bold formatting (**), markdown headers (#), or bullet points. Use exactly one numbered step per line.`;
      systemInstruction = `You are a multilingual professional chef assistant. Output only cooking steps, numbered, in ${language}. Always respect dietary restrictions and allergies. Each numbered step must be on its own line.`;
    }

    let activeStream = null;

    // Multi-model streaming fallback
    for (const model of MODELS_CASCADE) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const stream = await ai.models.generateContentStream({
            model,
            contents: prompt,
            config: {
              systemInstruction,
              temperature: 0.4,
              ...(outputFormat === "structured" ? { responseMimeType: "application/json", responseJsonSchema: recipeSchema } : {}),
            }
          });
          activeStream = stream;
          break;
        } catch (streamErr) {
          console.warn(`[Steps] Model fallback triggered:`, streamErr.message?.slice(0, 60));
          if (attempt === 1 && isRetryableError(streamErr)) {
            await new Promise(r => setTimeout(r, 1200 + Math.random() * 500));
            continue;
          }
          break; // Switch to next model in cascade
        }
      }
      if (activeStream) break;
    }

    if (!activeStream) {
      throw new Error('All recipe generation models are temporarily busy. Please try again in a few seconds.');
    }

    // Setup SSE headers only after stream is established
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of activeStream) {
      let content = chunk.text || '';
      if (content) {
        // Strict format guarantee: strip any markdown bold asterisks or hashes
        content = content.replace(/\*\*/g, '').replace(/^#+\s*/gm, '');
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error('Recipe steps error:', error);
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: 'Recipe generation was interrupted. Please try again.' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      res.status(500).json({ error: error.message || 'Failed to generate recipe steps' });
    }
  }
});

// Nutrition info endpoint with fallback, retry, and strict numeric sanitization
app.post('/api/recipe/nutrition', async (req, res) => {
  try {
    const { people, ingredients } = req.body;
    if (!ingredients || !Number.isFinite(Number(people)) || Number(people) <= 0) {
      return res.status(400).json({ error: "Recipe ingredients and servings are required" });
    }

    const prompt = `Estimate nutrition per serving for this exact ingredient list, which makes ${people} servings: ${JSON.stringify(ingredients)}. Include oil, dairy, and all listed ingredients. Return ONLY valid JSON with numeric, non-negative keys: "calories", "protein", "fat", "carbs". Calories are kcal; other values are grams. Do not substitute a different recipe.`;

    const systemInstruction = `You are a multilingual professional chef assistant. Return nutrition facts strictly as a JSON object with numeric values only. Keys: "calories", "protein", "fat", "carbs".`;

    const completion = await callWithFallback(async (model) => {
      return await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.2,
          responseMimeType: "application/json",
        }
      });
    });

    const parsedRaw = cleanAndParseJson(completion.text);
    const sanitized = sanitizeNutrition(parsedRaw);

    if (!sanitized) throw new Error("Invalid nutrition estimate");
    res.json({ ...sanitized, source: "ai_estimate" });

  } catch (error) {
    console.error('Nutrition info error:', error);
    res.status(503).json({ error: 'Nutrition unavailable' });
  }
});

// Recipe suggestions endpoint with fallback & retry
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

    const completion = await callWithFallback(async (model) => {
      return await ai.models.generateContent({
        model,
        contents: user,
        config: {
          systemInstruction: sys.join(" "),
          temperature: 0.4,
          responseMimeType: "application/json",
        }
      });
    });

    const parsed = cleanAndParseJson(completion.text, {});
    let recipes = Array.isArray(parsed.recipes) ? parsed.recipes : [];

    const defaultFallbacks = ['Vegetable Stir Fry', 'Spiced Rice Bowl', 'Mixed Vegetable Curry', 'Comforting Soup', 'Quick Skillet Meal'];
    let idx = 0;
    while (recipes.length < recipeCount) {
      recipes.push(defaultFallbacks[idx++ % defaultFallbacks.length]);
    }

    res.json({ recipes: recipes.slice(0, recipeCount) });

  } catch (error) {
    console.error('Recipe suggestion error:', error);
    res.json({ recipes: ['Vegetable Stir Fry', 'Spiced Rice Bowl', 'Mixed Vegetable Curry', 'Comforting Soup', 'Quick Skillet Meal'] });
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
// this code uses google custom search api to search for recipes on the web
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

// Recipe suggestions by ingredients endpoint with fallback & retry
app.post('/api/recipe/suggest-by-ingredients', async (req, res) => {
  const { ingredients, staples = [], userPreferences = {}, language = 'English' } = req.body;
  const validList = list => Array.isArray(list) && list.length <= 50 && list.every(value => typeof value === 'string' && value.trim() && value.length <= 100);
  if (!validList(ingredients) || !ingredients.length || !validList(staples)) {
    return res.status(400).json({ error: 'Provide a list of ingredients and confirmed staples' });
  }
  const available = [...new Set([...ingredients, ...staples].map(value => value.trim()))];
  try {
    const prompt = `Suggest up to 5 dishes using these available ingredients: ${JSON.stringify(available)}.
Only these ingredients are known to be available. Do not assume oil, salt, spices, or any other staples.
Prefer dishes needing no additional ingredients; otherwise list ALL missing required ingredients, including seasoning and cooking oil.
Use the exact supplied ingredient names when referencing available items. Required ingredients must include everything necessary to cook the dish. Keep optional garnishes separate.
Diet: ${userPreferences.dietType || 'nonveg'} (veg excludes meat, fish and eggs; vegan excludes all animal products).
Exclude allergens: ${JSON.stringify(userPreferences.allergies || [])}. Avoid dislikes: ${JSON.stringify(userPreferences.dislikes || [])}.
Skill: ${userPreferences.skillLevel || 'beginner'}. Dish names should be in ${language}; ingredient names must remain in the same language as the input.
Return strict JSON: {"suggestions":[{"name":"Dish name","estimatedMinutes":25,"requiredIngredients":["rice","oil"],"optionalIngredients":["coriander"]}]}. Return only realistic dishes with approximate total cooking time. Do not claim a dish is allergen-safe.`;
    const completion = await callWithFallback(model => ai.models.generateContent({
      model, contents: prompt,
      config: { responseMimeType: 'application/json', temperature: 0.3 },
    }));
    const parsed = cleanAndParseJson(completion.text, {});
    const suggestions = normalizeSuggestions(parsed.suggestions, available);
    if (!suggestions.length) throw new Error('No usable suggestions returned');
    res.json({ suggestions });
  } catch (error) {
    console.error('Ingredient suggestions failed:', error.message);
    res.status(503).json({ error: 'Unable to suggest dishes. Please try again.' });
  }
});

// TTS endpoint
app.post('/api/speak', async (req, res) => {
  const { text, language } = req.body;

  const languageVoiceMap = {
    indian_english: 'en-IN-Chirp-HD-O',
    us_english: 'en-US-Chirp3-HD-Aoede',
    uk_english: 'en-GB-Chirp3-HD-Leda',
    hindi: 'hi-IN-Chirp3-HD-Leda',
    telugu: 'te-IN-Chirp3-HD-Leda',
    tamil: 'ta-IN-Chirp3-HD-Leda',
    kannada: 'kn-IN-Chirp3-HD-Leda',
    malayalam: 'ml-IN-Chirp3-HD-Leda',
    marathi: 'mr-IN-Chirp3-HD-Leda',
    gujarati: 'gu-IN-Chirp3-HD-Leda',
    bengali: 'bn-IN-Chirp3-HD-Leda',
    punjabi: 'pa-IN-Chirp3-HD-Leda',
    spanish: 'es-ES-Chirp3-HD-Leda',
    french: 'fr-FR-Chirp3-HD-Leda',
    german: 'de-DE-Chirp3-HD-Leda',
    italian: 'it-IT-Chirp3-HD-Leda',
    japanese: 'ja-JP-Chirp3-HD-Achernar',
    chinese: 'cmn-CN-Chirp3-HD-Leda',
    russian: 'ru-RU-Chirp3-HD-Leda',
  };

  const voiceName = languageVoiceMap[language?.toLowerCase()] || 'en-IN-Wavenet-D';
  const languageCode = voiceName.split('-').slice(0, 2).join('-');

  try {
    if (!ttsClient) {
      throw new Error('TTS client not initialized');
    }

    const [response] = await ttsClient.synthesizeSpeech({
      input: { text },
      voice: { languageCode, name: voiceName },
      audioConfig: { audioEncoding: 'MP3' },
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(response.audioContent);
  } catch (error) {
    console.error('[TTS] Speech synthesis failed:', error.message);
    res.status(500).json({ error: 'TTS generation failed' });
  }
});

// Personalized recommendations endpoint based on favorites with fallback & retry
app.post('/api/recipe/recommend', async (req, res) => {
  try {
    const { favoriteDishes, userPreferences, language = "English" } = req.body;

    if (!favoriteDishes || !Array.isArray(favoriteDishes) || favoriteDishes.length === 0) {
      return res.status(400).json({ error: 'Favorite dishes array required' });
    }

    let prompt = `The user loves eating these dishes: ${favoriteDishes.join(', ')}. 
Based on these flavor profiles and cuisines, recommend 4 new dishes they would absolutely love. 
Make sure the recommendations are distinct but share similar culinary appeal (e.g. similar spice levels, regions, or comfort-food vibes).`;

    if (userPreferences?.dietType) {
      const dietInstructions = {
        'veg': 'Only suggest completely vegetarian dishes (no meat, fish, or eggs).',
        'vegan': 'Only suggest vegan dishes (no animal products whatsoever).',
        'nonveg': 'You may suggest both vegetarian and non-vegetarian dishes.'
      };
      prompt += ` ${dietInstructions[userPreferences.dietType]}`;
    }

    if (userPreferences?.allergies?.length > 0) {
      prompt += ` NEVER suggest dishes containing these allergens: ${userPreferences.allergies.join(', ')}.`;
    }

    if (userPreferences?.dislikes?.length > 0) {
      prompt += ` Avoid using these ingredients: ${userPreferences.dislikes.join(', ')}.`;
    }

    prompt += ` Respond ONLY with a valid JSON array of 4 dish names strings in ${language}. Example format: ["Dish 1", "Dish 2", "Dish 3", "Dish 4"]`;

    const completion = await callWithFallback(async (model) => {
      return await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: `You are a culinary recommendation engine. Output strictly JSON array of strings.`,
          temperature: 0.7,
          responseMimeType: "application/json",
        }
      });
    });

    const parsed = cleanAndParseJson(completion.text, []);
    let recommendations = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.recommendations) ? parsed.recommendations : []);

    if (recommendations.length === 0) {
      recommendations = ['Paneer Butter Masala', 'Vegetable Biryani', 'Dal Makhani', 'Palak Paneer'];
    }

    res.json({ recommendations: recommendations.slice(0, 4) });

  } catch (error) {
    console.error('Personalized recommendation error:', error);
    res.json({ recommendations: ['Chef Recommendation 1', 'Chef Recommendation 2', 'Chef Recommendation 3', 'Chef Recommendation 4'] });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});