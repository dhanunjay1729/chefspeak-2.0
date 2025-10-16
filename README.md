# 🍳 ChefSpeak – Your Voice‑Enabled Cooking Companion

ChefSpeak is a **multilingual, voice‑assisted recipe app** designed to make cooking simpler, smarter, and hands‑free.
It's built to go **beyond a simple LLM wrapper**, combining AI‑generated recipes, dish images, and interactive cooking features — all in one place.

> ⚠️ **Note:** ChefSpeak is currently in **active development**. Features are being added and improved continuously.

## ✨ Features (Current & In Progress)

✅ **AI‑Generated Recipes**
Type (or speak) the dish name, specify the number of servings, and add notes — ChefSpeak fetches clear, numbered step‑by‑step instructions in your preferred language.

✅ **Dish Images Integration**
Automatically fetches a high‑quality image of the dish from Unsplash to give you a visual reference.

✅ **Multilingual Support**
Select your preferred language (e.g., English, Telugu, Hindi) and ChefSpeak will respond and narrate accordingly.

✅ **Voice Navigation**
After loading the recipe, you can say commands like **"next"**, **"repeat"**, and **"back"** to move through steps without touching your screen.

✅ **Timer Ready** *(planned)*
Steps that mention cooking durations will soon have a one‑tap **Start Timer** button — making it easier to follow along.

✅ **Nutrition Insights** *(in development)*
Get approximate calories, protein, carbs, and fat for each recipe per serving, powered by GPT.

✅ **Personalization & Saved Recipes** *(planned)*
Mark your favorite recipes, add notes like "reduce chili next time," and build your personal cookbook.

---

## 🚀 Tech Stack

* **Frontend:** React + Vite + Tailwind CSS
* **Voice & AI:**
  * OpenAI GPT‑4o‑mini for recipe steps and nutrition info
  * Google Text‑to‑Speech (TTS) for narration
* **Image Fetching:** Unsplash API
* **Authentication & Storage:** Firebase (planned for user dashboard)

---

## 📦 Installation & Setup

### Prerequisites

- Node.js 18+ and npm
- Firebase account (for authentication and database)
- OpenAI API key
- Unsplash API key (optional, for dish images)
- Google Cloud account with Text-to-Speech API enabled (for voice narration)

### Step 1: Clone the Repository

\`\`\`bash
git clone https://github.com/dhanunjay1729/chefspeak-2.0.git
cd chefspeak-2.0
\`\`\`

### Step 2: Install Dependencies

\`\`\`bash
npm install
\`\`\`

### Step 3: Configure Environment Variables

1. Copy \`.env.example\` to \`.env\`:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

2. Fill in your API keys in the \`.env\` file:
   - Firebase configuration (get from Firebase Console)
   - OpenAI API key (get from OpenAI Dashboard)
   - Unsplash API key (optional, from Unsplash Developers)

### Step 4: Google Text-to-Speech Setup (Optional)

For voice narration functionality:

1. Create a Google Cloud project and enable the Text-to-Speech API
2. Create a service account and download the JSON key file
3. Rename it to \`google-tts-key.json\` and place it in the root directory

### Step 5: Run Development Server

\`\`\`bash
# Start the main app
npm run dev

# In a separate terminal, start the TTS server (if using voice narration)
node ttsServer.js
\`\`\`

The app will be available at \`http://localhost:5173\`

---

## 🏗️ Build for Production

\`\`\`bash
npm run build
\`\`\`

The production-ready files will be in the \`dist/\` directory.

---

## 🔧 Configuration

### Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Copy your Firebase config to \`.env\`

### Firestore Database Structure

\`\`\`
users/
  {uid}/
    profile: { displayName, preferredLanguage, diet, allergies, dislikes, skill }
    recentDishes/
      {dishId}: { dishName, language, people, notes, recipeSteps, nutritionInfo, createdAt }
    favoriteDishes/
      {dishId}: { dishName, language, people, notes, recipeSteps, nutritionInfo, createdAt }
\`\`\`

---

## 🚀 Deployment

### Deploy to Vercel

1. Install Vercel CLI: \`npm i -g vercel\`
2. Run: \`vercel\`
3. Follow the prompts
4. Set environment variables in Vercel dashboard

### Deploy to Netlify

1. Install Netlify CLI: \`npm i -g netlify-cli\`
2. Run: \`netlify deploy\`
3. Follow the prompts
4. Set environment variables in Netlify dashboard

**Note:** The TTS server (\`ttsServer.js\`) needs to be deployed separately as a Node.js backend service.

---

## 🐛 Known Issues & Limitations

- **API Keys in Frontend:** OpenAI and Unsplash keys are currently exposed in the client-side code. For production, these should be moved to serverless functions or a backend API.
- **TTS Server:** The Google TTS server runs separately and needs proper deployment configuration.
- **Large Bundle Size:** The main chunk is ~720KB. Code splitting and lazy loading can improve this.
- **Browser Support:** Voice recognition works best in Chrome/Edge browsers.

---

## 🤝 Contributing

ChefSpeak is still in its early phase.
Contributions, ideas, and feedback are very welcome!
Feel free to open issues or submit pull requests.

### Development Guidelines

1. Run \`npm run lint\` before committing
2. Follow the existing code style
3. Test your changes thoroughly
4. Update documentation if needed

---

## 📝 License

[Include your license information here]

---

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- Google Cloud for Text-to-Speech API
- Unsplash for beautiful food images
- Firebase for authentication and database
