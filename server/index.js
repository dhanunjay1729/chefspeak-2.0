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

// Guarantee exact numeric keys for nutrition
function sanitizeNutrition(data) {
  const result = { calories: 350, protein: 12, fat: 10, carbs: 45 };
  if (!data || typeof data !== 'object') return result;

  for (const key of ['calories', 'protein', 'fat', 'carbs']) {
    let val = data[key];
    if (typeof val === 'number' && !isNaN(val)) {
      result[key] = Math.round(val);
    } else if (typeof val === 'string') {
      const parsed = parseFloat(val.replace(/[^0-9.]/g, ''));
      if (!isNaN(parsed)) {
        result[key] = Math.round(parsed);
      }
    }
  }
  return result;
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
  console.log(`[${new Date().toISOString()}] 💓 Health check ping received`);
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
    const { dish, people, extraNotes, language = 'English', userPreferences } = req.body;

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

    prompt += ` Respond only in ${language}. Do not use markdown bold formatting (**), markdown headers (#), or bullet points. Use exactly one numbered step per line.`;

    const systemInstruction = `You are a multilingual professional chef assistant. Output only cooking steps, numbered, in ${language}. Always respect dietary restrictions and allergies. Do not use bold formatting or asterisks. Each numbered step must be on its own line.`;

    let activeStream = null;
    let successfulModel = null;

    // Multi-model streaming fallback
    for (const model of MODELS_CASCADE) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log(`[Steps] Attempting stream with ${model} (attempt ${attempt})...`);
          const stream = await ai.models.generateContentStream({
            model,
            contents: prompt,
            config: {
              systemInstruction,
              temperature: 0.4,
            }
          });
          activeStream = stream;
          successfulModel = model;
          break;
        } catch (streamErr) {
          console.warn(`[Steps] ${model} attempt ${attempt} failed:`, streamErr.message?.slice(0, 100));
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

    console.log(`[Steps] Streaming active with model: ${successfulModel}`);

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
      res.write(`data: ${JSON.stringify({ content: '\n[Notice: Generation encountered an issue.]' })}\n\n`);
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
    const { dish, people, extraNotes, userPreferences } = req.body;

    let prompt = `Give me an approximate nutritional breakdown (per serving) for ${dish} for ${people} people.`;

    if (userPreferences?.dietType) {
      prompt += ` This is a ${userPreferences.dietType} recipe.`;
    }

    if (extraNotes?.trim()) {
      prompt += ` Additional notes: ${extraNotes}.`;
    }

    prompt += ` Include approximate numerical values (in grams/kcal) for calories, protein, fat, and carbohydrates. Respond ONLY with a valid JSON object using the following exact keys: "calories", "protein", "fat", "carbs". The values should be numbers only, no strings or units.`;

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

    res.json(sanitized);

  } catch (error) {
    console.error('Nutrition info error:', error);
    // Graceful fallback values so UI never crashes or displays empty card
    res.json({
      calories: 320,
      protein: 11,
      fat: 9,
      carbs: 42
    });
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
  const { ingredients } = req.body;

  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ error: 'Ingredients array required' });
  }

  try {
    const ingredientList = ingredients.join(', ');

    const completion = await callWithFallback(async (model) => {
      return await ai.models.generateContent({
        model,
        contents: `Suggest 5 dishes I can make with these ingredients: ${ingredientList}`,
        config: {
          systemInstruction: 'You are a helpful cooking assistant. Suggest 5 dish names that can be made with the given ingredients. Return ONLY a JSON array of dish names, nothing else. Format: ["Dish 1", "Dish 2", "Dish 3", "Dish 4", "Dish 5"]',
          temperature: 0.7,
          maxOutputTokens: 200,
          responseMimeType: "application/json",
        }
      });
    });

    const parsed = cleanAndParseJson(completion.text, []);
    let suggestions = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.suggestions) ? parsed.suggestions : []);

    if (suggestions.length === 0) {
      suggestions = (completion.text || '')
        .split('\n')
        .map(line => line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').replace(/["\[\]]/g, '').trim())
        .filter(line => line.length > 0)
        .slice(0, 5);
    }

    if (suggestions.length === 0) {
      suggestions = [`${ingredients[0]} Stir Fry`, `${ingredients.slice(0, 2).join(' & ')} Medley`, 'Homestyle Sauté', 'Comfort Stew', 'Quick Pan Toss'];
    }

    res.json({ suggestions: suggestions.slice(0, 5) });
  } catch (error) {
    console.error('Error generating ingredient suggestions:', error);
    res.json({ suggestions: [`${ingredients[0]} Stir Fry`, 'Homestyle Sauté', 'Comfort Stew'] });
  }
});

// TTS endpoint
app.post('/api/speak', async (req, res) => {
  const { text, language } = req.body;

  // 🔍 DEBUG: Log what we receive
  console.log('🎤 TTS Request:', { 
    textPreview: text?.substring(0, 50) + '...', 
    language,
    languageLower: language?.toLowerCase() 
  });

  // Map with LOWERCASE keys to match .toLowerCase() conversion
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

  // 🔍 DEBUG: Log what voice we're using
  console.log('🗣️ Using voice:', voiceName, 'for language code:', languageCode);

  try {
    if (!ttsClient) {
      throw new Error('TTS client not initialized');
    }

    const [response] = await ttsClient.synthesizeSpeech({
      input: { text },
      voice: { languageCode, name: voiceName },
      audioConfig: { audioEncoding: 'MP3' },
    });

    console.log('✅ TTS success, audio length:', response.audioContent?.length);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(response.audioContent);
  } catch (error) {
    console.error('❌ TTS Error:', error.message);
    res.status(500).json({ error: 'TTS generation failed', details: error.message });
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