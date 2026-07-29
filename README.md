# 🍳 ChefSpeak — AI-Powered Cooking Assistant

> Your personal kitchen companion: voice-guided recipes, real-time nutritional analysis, and AI-powered dish recommendations — all in one beautiful app.

[![Live Demo](https://img.shields.io/badge/🚀_Live-Demo-22c55e?style=for-the-badge)](https://chefspeak.vercel.app)
[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg?style=for-the-badge)](https://creativecommons.org/licenses/by-nc-sa/4.0/)
[![Backend Status](https://img.shields.io/badge/API-Always_Awake-blue?style=for-the-badge)](https://chefspeak-api.onrender.com/health)

---

## 📖 Overview

ChefSpeak turns cooking from a chore into a guided experience. It generates step-by-step recipes on-demand using **Google Gemini**, reads them aloud in **18 languages** via Google Cloud TTS, and learns your taste over time to recommend dishes you'll love.

Whether you're a college student cooking for the first time or an experienced home chef, ChefSpeak adapts to your skill level, dietary restrictions, allergies, and available ingredients.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎙️ **Voice-Guided Cooking** | Hands-free step-by-step instructions with Google Cloud Text-to-Speech in 18 languages |
| 🤖 **AI Recipe Generation** | Powered by Gemini 3.5 Flash Lite — generates personalized recipes with streaming SSE output |
| 🧠 **Personalized Recommendations** | LLM-as-a-Recommender engine analyzes your favorites to suggest new dishes you'll love |
| ⏱️ **Smart Timers** | Automatically detects cooking durations ("simmer for 10 minutes") and starts countdown timers |
| 🥗 **Dietary Intelligence** | Vegetarian, Vegan, and Non-Veg modes with allergy tracking and ingredient dislikes |
| 🧑‍🍳 **Skill-Level Adaptation** | Adjusts recipe complexity for Beginner, Intermediate, and Pro cooks |
| 🔍 **Cook by Ingredients** | Enter what's in your fridge → get AI-suggested dishes you can actually make right now |
| 📊 **Nutritional Analysis** | Structured JSON nutrition breakdown (calories, protein, fat, carbs) for every dish |
| ❤️ **Favorites & History** | Save dishes, revisit past recipes, and build a flavor profile over time |
| 🔐 **Authentication** | Firebase Auth with Google Sign-In and email/password, plus a sign-in-required modal for protected actions |
| 🌍 **18 Languages** | English (US/UK/Indian), Hindi, Telugu, Tamil, Kannada, Malayalam, Marathi, Gujarati, Bengali, Punjabi, Spanish, French, German, Italian, Japanese, Chinese, Russian |
| 📱 **Responsive Design** | Beautiful, modern UI with Tailwind CSS v4 and Framer Motion animations |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Vercel)                             │
│                                                                      │
│  React 19 + Vite + Tailwind CSS v4 + Framer Motion                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐           │
│  │Dashboard │ │Assistant │ │Favorites │ │  Ingredients  │           │
│  │  + Recs  │ │ + Voice  │ │          │ │  Suggestions  │           │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬───────┘           │
│       │             │            │               │                   │
│       └─────────────┴────────────┴───────────────┘                   │
│                          │                                           │
│              GeminiService (API Client)                              │
│              Firebase SDK (Auth + Firestore)                         │
└──────────────────────────┬───────────────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────┴───────────────────────────────────────────┐
│                        BACKEND (Render)                              │
│                                                                      │
│  Node.js + Express 5 (ESM)                                          │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │ /api/recipe/steps│  │/api/recipe/nutri │  │/api/recipe/recom │   │
│  │   (SSE Stream)   │  │  (Structured JSON)│  │ (LLM Recommender)│   │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘   │
│           │                     │                      │             │
│           └─────────────────────┴──────────────────────┘             │
│                          │                                           │
│              Gemini 3.5 Flash Lite API                               │
│              Google Cloud Text-to-Speech                             │
│              Rate Limiting (200 req/day/IP)                          │
└──────────────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────┴───────────────────────────────────────────┐
│                     INFRASTRUCTURE                                   │
│                                                                      │
│  GitHub Actions Cron (every 10 min) → keeps Render awake 24/7       │
│  Firebase Firestore → user profiles, favorites, recipe history      │
│  Firebase Auth → Google OAuth + email/password                      │
│  Google Analytics 4 → usage tracking                                │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework with hooks, context, and concurrent features |
| **Vite 6** | Build tool and dev server |
| **Tailwind CSS v4** | Utility-first styling with PostCSS |
| **Framer Motion** | Page transitions and micro-animations |
| **Firebase SDK** | Authentication and Firestore database |
| **Lucide React** | Icon library |
| **React Router v7** | Client-side routing |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express 5** | RESTful API server (ESM modules) |
| **Gemini 3.5 Flash Lite** | Recipe generation, nutrition analysis, and personalized recommendations |
| **Google Cloud TTS** | High-fidelity multilingual text-to-speech (Chirp3 HD voices) |
| **Unsplash API** | Dish imagery |
| **express-rate-limit** | API abuse prevention (200 requests/day/IP) |

### Infrastructure
| Technology | Purpose |
|---|---|
| **Vercel** | Frontend hosting with edge CDN |
| **Render** | Backend API hosting |
| **GitHub Actions** | Cron job to prevent Render cold starts |
| **Firebase** | Auth, Firestore (user data, favorites, history) |
| **Google Analytics 4** | Usage analytics |

---

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Firebase project (Auth + Firestore enabled)
- [Gemini API key](https://aistudio.google.com/apikey)
- Google Cloud TTS service account (optional — for voice features)
- Unsplash API key (optional — for dish images)

### 1. Clone the Repository
```bash
git clone https://github.com/dhanunjay1729/chefspeak-2.0.git
cd chefspeak-2.0
```

### 2. Install Dependencies

```bash
# Frontend
npm install

# Backend
cd server && npm install && cd ..
```

### 3. Environment Configuration

**Frontend (`.env`):**
```env
# Firebase
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Backend API URL
VITE_API_BASE_URL=http://localhost:3002
```

**Backend (`server/.env`):**
```env
GEMINI_API_KEY=your_gemini_key
GOOGLE_TTS_CREDENTIALS={"type":"service_account",...}  # Single-line JSON for production
GOOGLE_TTS_KEY_PATH=../google-tts-key.json             # For local dev
UNSPLASH_API_KEY=your_unsplash_key
PORT=3002
```

### 4. Run Locally

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
npm run dev
```

Visit `http://localhost:5173` 🎉

---

## 🌐 Deployment

### Frontend → Vercel

```bash
npm i -g vercel
vercel --prod
```

Add all `VITE_*` environment variables in the Vercel dashboard.

### Backend → Render

1. Create a **Web Service** on [Render](https://render.com)
2. Connect your GitHub repository
3. Configure:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Add environment variables: `GEMINI_API_KEY`, `GOOGLE_TTS_CREDENTIALS`, `PORT=3002`

### Keep-Alive (Anti Cold Start)

A GitHub Actions workflow (`.github/workflows/keep-alive.yml`) pings the `/health` endpoint every 10 minutes, preventing Render's free tier from sleeping. This runs automatically — no setup required.

---

## 📱 How It Works

### 1. Sign Up & Personalize
Create an account with email or Google Sign-In. Set your preferred language, dietary type (Veg/Vegan/Non-Veg), allergies, dislikes, and cooking skill level.

### 2. Get a Recipe
- **Direct Search** — Type any dish name (e.g., "Butter Chicken")
- **Cook by Ingredients** — Enter what you have → AI suggests dishes
- **AI Recommendations** — Dashboard suggests dishes based on your favorites
- **Favorites** — Revisit saved recipes

### 3. Cook with Voice Guidance
- Tap the 🔊 speaker icon to hear each step read aloud
- Smart timers auto-detect phrases like "cook for 10 minutes" and start countdowns
- Navigate steps: **Next**, **Back**, **Repeat**

### 4. Save & Build Your Profile
- Favorite dishes you love ❤️
- The more you favorite, the smarter your recommendations become
- View structured nutritional breakdowns for every recipe

---

## 🧠 AI Recommendation Engine

ChefSpeak uses an **LLM-as-a-Recommender** pattern — no collaborative filtering or matrix factorization needed.

**How it works:**
1. When you visit the Dashboard, the app fetches your top 10 favorited dishes from Firestore
2. These are sent to a Gemini prompt along with your dietary restrictions and allergies
3. Gemini analyzes the flavor profiles, cuisines, and spice levels of your favorites
4. It returns 4 distinct new dish recommendations that share similar culinary appeal
5. Click any recommendation to instantly start cooking it

This approach works from Day 1 for every user — no cold-start problem, no minimum data threshold. Gemini's pre-trained culinary knowledge acts as the recommendation model.

---

## 🔒 API Security

| Measure | Details |
|---|---|
| **Rate Limiting** | 200 API requests per IP per 24 hours |
| **CORS Whitelist** | Only `chefspeak.vercel.app`, `*.vercel.app` (previews), and `localhost` |
| **Server-Side Keys** | All API keys (Gemini, TTS, Unsplash) are server-side only — never exposed to the browser |
| **Firebase Rules** | Firestore security rules restrict data access to authenticated users |
| **Auth Guards** | Protected actions (favorites, recommendations) require authentication with a non-intrusive sign-in modal |

---

## 📂 Project Structure

```
Chefspeak/
├── src/
│   ├── components/          # Reusable UI (FavoriteButton, Header, NutritionInfo, etc.)
│   │   └── ui/              # Primitives (Button, WakeWordDetector, VoiceListener)
│   ├── pages/               # Route pages (Dashboard, Assistant, Favorites, Profile, etc.)
│   ├── hooks/               # Custom hooks (useUserProfile, useRecipe, useWakeWordDetector)
│   ├── services/            # API clients (geminiService, ttsService, userService, etc.)
│   ├── contexts/            # React contexts (AuthContext)
│   └── utils/               # Helpers (timer parsing, analytics)
├── server/
│   └── index.js             # Express API — all endpoints (recipes, nutrition, TTS, recommendations)
├── .github/
│   └── workflows/
│       └── keep-alive.yml   # Cron job to prevent Render cold starts
├── public/                  # Static assets
└── vercel.json              # Vercel deployment config
```

---

## 🗺️ Roadmap

- [x] AI-powered personalized recommendations
- [x] Structured nutritional data (JSON)
- [x] Sign-in-required modal for protected actions
- [x] GitHub Actions keep-alive for zero cold starts
- [ ] Hands-free voice commands (wake word detection)
- [ ] Pantry scanner via Gemini Vision API
- [ ] Context-aware ingredient substitutions
- [ ] Smart grocery list generation from meal plans
- [ ] Dark mode support

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

> **Note:** All contributions must comply with the CC BY-NC-SA 4.0 license (non-commercial use only).

---

## 📄 License

This project is licensed under the **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License**.

- ✅ You can copy, modify, and share this project
- ✅ You must give credit to the original author
- ❌ You cannot use this for commercial purposes
- ⚠️ Any modifications must use the same license

See the [LICENSE](LICENSE) file for full details.

---

## 🙏 Acknowledgments

- **Google** — Gemini API, Cloud Text-to-Speech, Firebase, Analytics
- **Unsplash** — Beautiful dish imagery
- **Vercel** & **Render** — Hosting infrastructure

---

## 📧 Contact

**Dhanunjay** — [pantadhanunjay@gmail.com](mailto:pantadhanunjay@gmail.com)

Project Link: [github.com/dhanunjay1729/chefspeak-2.0](https://github.com/dhanunjay1729/chefspeak-2.0)

---

<div align="center">

**Made with ❤️ by Dhanunjay**

[⭐ Star this repo](https://github.com/dhanunjay1729/chefspeak-2.0) · [🐛 Report Bug](https://github.com/dhanunjay1729/chefspeak-2.0/issues) · [💡 Request Feature](https://github.com/dhanunjay1729/chefspeak-2.0/issues)

</div>
