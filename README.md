# 🍳 ChefSpeak - Your AI-Powered Cooking Assistant

> Transform your cooking experience with voice-guided recipes, smart timers, and personalized dietary preferences.

[![Live Demo](https://img.shields.io/badge/Live-Demo-green?style=for-the-badge)](https://chefspeak.vercel.app)
[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg?style=for-the-badge)](https://creativecommons.org/licenses/by-nc-sa/4.0/)

## 📖 Overview

ChefSpeak is an intelligent cooking assistant that provides **real-time voice-guided recipes** in multiple languages. Whether you're a beginner or a professional chef, ChefSpeak adapts to your skill level, dietary preferences, and available ingredients to deliver personalized cooking guidance.

### ✨ Key Features

- 🎙️ **Voice-Guided Cooking** - Hands-free step-by-step instructions with text-to-speech
- 🌍 **Multilingual Support** - Cook in English, Hindi, Telugu, or Tamil
- ⏱️ **Smart Timers** - Automatic timer detection and countdown for each cooking step
- 🥗 **Dietary Preferences** - Vegetarian, Vegan, and Non-Vegetarian options with allergy tracking
- 🔍 **Ingredient-Based Suggestions** - Get recipe ideas based on what's in your kitchen
- ❤️ **Favorites & History** - Save and revisit your favorite recipes
- 📊 **Nutritional Information** - Get detailed nutrition facts for every dish
- 🎨 **Beautiful UI** - Modern, responsive design with smooth animations
- 🔐 **Secure Authentication** - Firebase-powered Google Sign-In and email authentication

## 🚀 Live Demo

Try it out: **[chefspeak.vercel.app](https://chefspeak.vercel.app)**

## 🛠️ Technology Stack

### Frontend
- **React 19** - Modern UI with hooks and context
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Firebase** - Authentication & Firestore database

### Backend
- **Node.js + Express** - RESTful API server
- **Gemini 2.5 Flash** - Recipe generation & analysis
- **Google Cloud TTS** - Multilingual text-to-speech
- **Unsplash API** - Dish imagery

### Deployment
- **Vercel** - Frontend hosting
- **Render** - Backend API hosting

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Firebase account
- Gemini API key
- Google Cloud TTS service account
- Unsplash API key (optional)

### 1. Clone the Repository
```bash
git clone https://github.com/dhanunjay1729/chefspeak.git
cd chefspeak
```

### 2. Install Dependencies

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd server
npm install
cd ..
```

### 3. Environment Configuration

**Frontend (`.env`):**
```bash
# Firebase Configuration
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
```bash
# Gemini API Key
GEMINI_API_KEY=your_gemini_key

# Google TTS Credentials (single-line JSON for production)
GOOGLE_TTS_CREDENTIALS={"type":"service_account",...}

# For local development
GOOGLE_TTS_KEY_PATH=../google-tts-key.json

# Port
PORT=3002
```

### 4. Run Locally

**Start Backend:**
```bash
cd server
npm run dev
```

**Start Frontend (in another terminal):**
```bash
npm run dev
```

Visit `http://localhost:5173` 🎉

## 🌐 Deployment

### Deploy to Vercel (Frontend)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel --prod
```

3. Add environment variables in Vercel dashboard

### Deploy to Render (Backend)

1. Create a new Web Service on [Render](https://render.com)
2. Connect your GitHub repository
3. Set **Root Directory** to `server`
4. Set **Build Command** to `npm install`
5. Set **Start Command** to `npm start`
6. Add environment variables:
   - `GEMINI_API_KEY`
   - `GOOGLE_TTS_CREDENTIALS` (single-line JSON)
   - `PORT=3002`

## 📱 Usage

### 1. Sign Up / Login
- Create an account with email or Google Sign-In
- Set your preferred language and dietary preferences

### 2. Get a Recipe
- **Option A:** Enter a dish name directly (e.g., "Butter Chicken")
- **Option B:** Select ingredients you have → Get suggestions
- **Option C:** Browse your favorites or recent recipes

### 3. Cook with Voice Guidance
- Tap the speaker icon to hear each step
- Smart timers automatically detect cooking times
- Navigate with commands: "Next", "Back", "Repeat"

### 4. Customize Your Experience
- Set dietary restrictions (Vegetarian, Vegan, Non-Veg)
- Add allergies and dislikes
- Choose your skill level (Beginner, Intermediate, Pro)

## 🎯 Features in Detail

### Commands
- **"Next"** - Move to next step
- **"Back"** - Go to previous step
- **"Repeat"** - Replay current step
- **"Timer"** - Start/stop timer

### Smart Timer Detection
ChefSpeak automatically detects time-related instructions like:
- "Cook for 10 minutes"
- "Let it simmer for 5 minutes"
- "Bake at 180°C for 30 minutes"

### Dietary Preferences
- **Vegetarian Mode** - Excludes meat, fish, and poultry
- **Vegan Mode** - No animal products (dairy, eggs, honey)
- **Allergy Tracking** - Automatically filters recipes based on your allergies
- **Non-Veg Warning** - Alerts vegetarians when selecting non-veg dishes

## 📂 Project Structure

```bash
Chefspeak/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/           # Route pages
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API & external services
│   ├── contexts/        # React context providers
│   └── utils/           # Helper functions
├── server/
│   ├── index.js         # Express API server
│   └── package.json     # Backend dependencies
├── public/              # Static assets
└── vercel.json          # Vercel deployment config
```

## 🤝 Contributing

Contributions are welcome! Here's how:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

**Note:** All contributions must comply with the CC BY-NC-SA 4.0 license (non-commercial use only).

## 🗺️ Roadmap

- [ ] Dark mode support
- [ ] Meal planning calendar
- [ ] Shopping list generation
- [ ] Video recipe integration
- [ ] Social sharing features
- [ ] Recipe rating & reviews
- [ ] Advanced search filters

## 📄 License

This project is licensed under the **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License**.

**What this means:**
- ✅ You can copy, modify, and share this project
- ✅ You must give credit to the original author
- ❌ You cannot use this for commercial purposes
- ⚠️ Any modifications must use the same license

See the [LICENSE](LICENSE) file for full details.

## 🙏 Acknowledgments

- **Google** for Gemini API
- **Google Cloud** for Text-to-Speech
- **Firebase** for authentication & database
- **Vercel** & **Render** for hosting

## 📧 Contact

**Dhanunjay** - pantadhanunjay@gmail.com

Project Link: [https://github.com/dhanunjay1729/chefspeak](https://github.com/dhanunjay1729/chefspeak)

---

<div align="center">
  
**Made with ❤️ by Dhanunjay**

[⭐ Star this repo](https://github.com/dhanunjay1729/chefspeak) | [🐛 Report Bug](https://github.com/dhanunjay1729/chefspeak/issues) | [💡 Request Feature](https://github.com/dhanunjay1729/chefspeak/issues)

</div>
