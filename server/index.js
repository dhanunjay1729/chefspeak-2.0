import { recipeSchema } from './recipeSchema.js';
import { createModelFallback } from './modelFallback.js';
import { normalizeSuggestions } from './pantry.js';
import { sanitizeNutrition } from './nutrition.js';
import { getLanguage, languageInstruction } from '../shared/languages.js';
import { hasMatchingNumbers } from '../shared/recipeTranslation.js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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

// Gemini stays available for a future explicit opt-in. Paid Gateway is the default.
let ai = null;
if (process.env.AI_PROVIDER === 'gemini') {
  const { GoogleGenAI } = await import('@google/genai');
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}
const modelService = createModelFallback({ ai });

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
    
    // Capacitor serves bundled pages from local origins on Android and iOS.
    if (
      origin.startsWith('http://localhost:') || 
      origin === 'https://localhost' ||
      origin === 'capacitor://localhost' ||
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
    const selectedLanguage = getLanguage(language);
    if (!selectedLanguage) return res.status(400).json({ error: 'Unsupported language' });
    const writingInstruction = languageInstruction(selectedLanguage);

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
      prompt += ` Respond with a JSON array of objects only. First object: {"type":"ingredients","items":[{"id":"i1","name":"<ingredient name>","quantity":1,"unit":"<unit>","optional":false}]}. Then one object per cooking step: {"type":"step","text":"<cooking instruction>","ingredientIds":["i1"],"ingredientAmounts":[{"ingredientId":"i1","quantity":1,"unit":"<unit>"}],"timeSeconds":null}. Include every ingredient and its quantity in the first object, including oil, seasoning and water. Use unique IDs and reference only those IDs in each step. ingredientAmounts must list the amount actually used in that step, such as half the oil now and the rest later; use an empty array when no ingredients are used. Use null quantity for amounts such as to taste and explain that in unit. timeSeconds is a positive integer only for a timer the user should start during that step; otherwise null. Keep JSON keys, type values and IDs exactly as specified. ${writingInstruction} Do not include an ingredients step among cooking steps.`;
      systemInstruction = `You are a professional chef. ${writingInstruction} Respect all dietary restrictions and allergies. Output a JSON array using the requested schema. The first object must contain all ingredients; subsequent objects must contain cooking steps. Never use markdown fences, comments, or extra text.`;
    } else {
      prompt += ` ${writingInstruction} Do not use markdown bold formatting (**), markdown headers (#), or bullet points. Use exactly one numbered step per line.`;
      systemInstruction = `You are a multilingual professional chef assistant. ${writingInstruction} Output only cooking steps, numbered. Always respect dietary restrictions and allergies. Each numbered step must be on its own line.`;
    }

    const stream = modelService.stream({
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.4,
        ...(outputFormat === 'structured' ? { responseMimeType: 'application/json', responseJsonSchema: recipeSchema } : {}),
      },
    });
    for await (const event of stream) {
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
      }
      res.write(`data: ${JSON.stringify(event)}\n\n`);
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

// Translate a saved recipe's displayed text. The client reapplies these strings
// to the original recipe so ingredient IDs, quantities and timers cannot change.
app.post('/api/recipe/translate', async (req, res) => {
  const { language, texts } = req.body || {};
  const selectedLanguage = getLanguage(language);
  if (!selectedLanguage) return res.status(400).json({ error: 'Unsupported language' });
  if (!Array.isArray(texts) || !texts.length || texts.length > 250 ||
      texts.some(value => typeof value !== 'string' || !value.trim() || value.length > 2000) ||
      JSON.stringify(texts).length > 20000) {
    return res.status(400).json({ error: 'Invalid recipe text' });
  }

  try {
    const schema = {
      type: 'object',
      properties: { translations: { type: 'array', items: { type: 'string' } } },
      required: ['translations'],
    };
    const valid = raw => {
      const result = cleanAndParseJson(raw);
      return Array.isArray(result.translations) && result.translations.length === texts.length &&
        result.translations.every((value, index) => typeof value === 'string' && value.trim() &&
          hasMatchingNumbers(texts[index], value));
    };
    const completion = await modelService.generate({
      contents: JSON.stringify(texts),
      config: {
        systemInstruction: `Translate each string in the input JSON array into ${selectedLanguage.promptName}. Return the same number of strings in the same order in a JSON object with a translations array. Preserve ingredient quantities, numbers, cooking temperatures and times exactly. Translate cooking instructions, ingredient names, units and dish names; keep common proper nouns where appropriate. Do not add instructions or change the recipe. ${languageInstruction(selectedLanguage)}`,
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseJsonSchema: schema,
        maxOutputTokens: 6000,
      },
    }, valid);
    res.json(cleanAndParseJson(completion.text));
  } catch (error) {
    console.error('Recipe translation error:', error);
    res.status(503).json({ error: 'Recipe translation is unavailable. Please try again.' });
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

    const completion = await modelService.generate({
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.2,
          responseMimeType: "application/json",
          maxOutputTokens: 350,
          responseJsonSchema: { type: 'object', properties: Object.fromEntries(['calories', 'protein', 'fat', 'carbs'].map(key => [key, { type: 'number', minimum: 0 }])), required: ['calories', 'protein', 'fat', 'carbs'] },
        }
    }, text => Boolean(sanitizeNutrition(cleanAndParseJson(text))));

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
    const selectedLanguage = getLanguage(language);
    if (!selectedLanguage) return res.status(400).json({ error: 'Unsupported language' });

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

    sys.push(`Output a strict JSON object with one "recipes" array of dish name strings. No extra text or keys.`);
    sys.push(`Write every dish name in ${selectedLanguage.promptName}; do not use English as a fallback unless English is selected.`);

    const user = [
      cuisine ? `Target cuisine: ${cuisine}.` : "",
      `Available ingredients: ${list.join(", ") || "(none listed)"}.`,
      userPreferences?.dislikes?.length > 0 ?
        `Try to avoid these ingredients: ${userPreferences.dislikes.join(', ')}.` : "",
      `Return exactly ${recipeCount} distinct dish names.`,
    ].join(" ");

    const completion = await modelService.generate({
        contents: user,
        config: {
          systemInstruction: sys.join(" "),
          temperature: 0.4,
          responseMimeType: "application/json",
          maxOutputTokens: 400,
          responseJsonSchema: { type: 'object', properties: { recipes: { type: 'array', items: { type: 'string' } } }, required: ['recipes'] },
        }
    });

    const parsed = cleanAndParseJson(completion.text, {});
    const recipes = Array.isArray(parsed.recipes) ? parsed.recipes : [];

    if (recipes.length < recipeCount) throw new Error('Incomplete recipe suggestions');

    res.json({ recipes: recipes.slice(0, recipeCount) });

  } catch (error) {
    console.error('Recipe suggestion error:', error);
    res.status(503).json({ error: 'Unable to suggest dishes. Please try again.' });
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
  const selectedLanguage = getLanguage(language);
  if (!selectedLanguage) return res.status(400).json({ error: 'Unsupported language' });
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
Skill: ${userPreferences.skillLevel || 'beginner'}. Write dish names in ${selectedLanguage.promptName}; do not use English as a fallback unless English is selected. Ingredient names must remain in the same language as the input.
Return a strict JSON object with a "suggestions" array. Each item has "name" (localized dish name), "estimatedMinutes" (number), "requiredIngredients" (array of strings) and "optionalIngredients" (array of strings). Return only realistic dishes with approximate total cooking time. Do not claim a dish is allergen-safe.`;
    const completion = await modelService.generate({
      contents: prompt,
      config: { responseMimeType: 'application/json', temperature: 0.3, maxOutputTokens: 1500,
        responseJsonSchema: { type: 'object', properties: { suggestions: { type: 'array', items: {
          type: 'object', properties: { name: { type: 'string' }, estimatedMinutes: { type: 'number' }, requiredIngredients: { type: 'array', items: { type: 'string' } }, optionalIngredients: { type: 'array', items: { type: 'string' } } }, required: ['name', 'estimatedMinutes', 'requiredIngredients', 'optionalIngredients'],
        } } }, required: ['suggestions'] },
      },
    });
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
  const selectedLanguage = getLanguage(language);
  if (!selectedLanguage) return res.status(400).json({ error: 'Unsupported language' });
  const voiceName = selectedLanguage.voice;
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
    const selectedLanguage = getLanguage(language);
    if (!selectedLanguage) return res.status(400).json({ error: 'Unsupported language' });

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

    prompt += ` Respond ONLY with a valid JSON array of 4 dish name strings in ${selectedLanguage.promptName}.`;

    const completion = await modelService.generate({
        contents: prompt,
        config: {
          systemInstruction: `You are a culinary recommendation engine. Output strictly JSON array of strings.`,
          temperature: 0.7,
          responseMimeType: "application/json",
          maxOutputTokens: 400,
          responseJsonSchema: { type: 'array', items: { type: 'string' } },
        }
    });

    const parsed = cleanAndParseJson(completion.text, []);
    const recommendations = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.recommendations) ? parsed.recommendations : []);

    if (recommendations.length < 4) throw new Error('Incomplete recommendations');

    res.json({ recommendations: recommendations.slice(0, 4) });

  } catch (error) {
    console.error('Personalized recommendation error:', error);
    res.status(503).json({ error: 'Unable to recommend dishes. Please try again.' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
