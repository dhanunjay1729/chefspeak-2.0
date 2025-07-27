import express from "express";
import cors from "cors";
import textToSpeech from "@google-cloud/text-to-speech";
import dotenv from "dotenv";

dotenv.config();
console.log("🐛 .env loaded, NODE_ENV:", process.env.NODE_ENV);

const app = express();
app.use(cors());
app.use(express.json());

console.log("🐛 Setting up Google TTS client...");
let client;
try {
  client = new textToSpeech.TextToSpeechClient({
    credentials: {
      client_email: process.env.GOOGLE_TTS_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_TTS_PRIVATE_KEY.replace(/\\n/g, "\n"),
    },
    projectId: process.env.GOOGLE_TTS_PROJECT_ID,
  });
  console.log("✅ Google TTS client initialized successfully");
} catch (err) {
  console.error("❌ Failed to initialize Google TTS client:", err);
}

app.get("/", (req, res) => {
  console.log("🐛 GET / called");
  res.send("Welcome to the ChefSpeak Text-to-Speech API!");
});

app.post("/api/speak", async (req, res) => {
  console.log("🐛 POST /api/speak hit with body:", req.body);

  const { text, language } = req.body;

  const languageVoiceMap = {
    english: "en-IN-Wavenet-D",
    hindi: "hi-IN-Wavenet-C",
    telugu: "te-IN-Standard-A",
    tamil: "ta-IN-Standard-A",
  };

  const voiceName = languageVoiceMap[(language || "").toLowerCase().trim()];

  if (!text || !voiceName) {
    console.error("❌ Invalid input:", { text, language, voiceName });
    return res.status(400).json({ error: "Missing or invalid text/language" });
  }

  console.log("🐛 Building TTS request:", {
    text,
    language,
    voiceName,
    languageCode: voiceName.split("-").slice(0, 2).join("-"),
  });

  const request = {
    input: { text },
    voice: {
      languageCode: voiceName.split("-").slice(0, 2).join("-"),
      name: voiceName,
    },
    audioConfig: { audioEncoding: "MP3" },
  };

  try {
    console.log("🐛 Sending request to Google TTS API...");
    const [response] = await client.synthesizeSpeech(request);
    console.log(
      "✅ Got response from Google TTS. Audio length:",
      response.audioContent?.length || 0
    );

    res.set("Content-Type", "audio/mpeg");
    console.log("🐛 Sending audio back to client...");
    res.send(response.audioContent);
  } catch (err) {
    console.error("🔥 TTS Error (inside /api/speak):", err);
    res.status(500).send("TTS failed");
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ TTS proxy server running on http://localhost:${PORT}`);
});
