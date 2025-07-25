import { useEffect, useState, useRef } from "react";
import { Button } from "../components/ui/button";
import { Volume2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

// Google TTS
const speakViaGoogleTTS = async (text, language) => {
  const response = await fetch("http://localhost:3001/api/speak", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language }),
  });

  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  audio.play();
};

export default function Assistant() {
  const { user } = useAuth();
  const [language, setLanguage] = useState("English");
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Form states
  const [dishName, setDishName] = useState("");
  const [servings, setServings] = useState(2);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Timer state
  const [remaining, setRemaining] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const fetchLanguage = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setLanguage(data.language || "English");
        }
      } catch (err) {
        console.error("Failed to fetch language:", err);
      }
    };
    fetchLanguage();
  }, [user]);

  const handleNext = () => {
    const next = Math.min(currentStepIndex + 1, steps.length - 1);
    setCurrentStepIndex(next);
    speakViaGoogleTTS(steps[next].text, language);
  };

  const handleBack = () => {
    const prev = Math.max(currentStepIndex - 1, 0);
    setCurrentStepIndex(prev);
    speakViaGoogleTTS(steps[prev].text, language);
  };

  const handleRepeat = () => {
    speakViaGoogleTTS(steps[currentStepIndex].text, language);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dishName.trim()) {
      alert("Please enter a dish name.");
      return;
    }
    await fetchRecipeSteps(dishName, servings, notes);
  };

  const fetchRecipeSteps = async (dish, people, extraNotes) => {
    try {
      setIsLoading(true);
      setSteps([]);
      setCurrentStepIndex(0);

      let prompt = `Give me a detailed step-by-step recipe for making ${dish} for ${people} people.`;
      if (extraNotes.trim()) {
        prompt += ` Additional notes: ${extraNotes}.`;
      }
      prompt += ` Respond only in ${language}. No bold letters or special characters. Just clear, numbered steps.`;

      console.log("🔍 Fetching recipe for:", { dish, people, extraNotes, language });

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a multilingual professional chef assistant. Always give clear, numbered steps in the user's preferred language: ${language}.`,
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          stream: true,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("OpenAI streaming response failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data: ")) {
            const data = trimmed.replace(/^data: /, "");
            if (data === "[DONE]") break;
            try {
              const json = JSON.parse(data);
              const token = json.choices?.[0]?.delta?.content;
              if (token) {
                fullText += token;
              }
            } catch (err) {
              console.error("Skipping invalid JSON chunk", err);
            }
          }
        }
      }

      // Enhanced time parsing with logging
      console.log("📝 Full recipe text received:", fullText.substring(0, 200) + "...");
      
      // Replace the timeRegex with multilingual support:
      const timeRegex = /(\d+)\s*(minutes|min|minute|seconds|secs|second|hours|hrs|hour|నిమిషాలు|నిమిషం|గంటలు|గంట|सेकंड|मिनट|घंटा|நிமிடங்கள்|மணி|സെക്കൻഡ്|മിനിറ്റ്|മണിക്കൂർ)/i;
      console.log("⏱️ Time regex pattern:", timeRegex);

      const parsedSteps = fullText
        .split(/\n+/)
        .filter((line) => line.trim().match(/^\d+[\).]/))
        .map((step) => step.trim());

      console.log("📋 Parsed steps count:", parsedSteps.length);
      console.log("📋 Raw parsed steps:", parsedSteps);

      const enrichedSteps = parsedSteps.map((step, index) => {
        console.log(`🔍 Processing step ${index + 1}:`, step);
        
        const match = step.match(timeRegex);
        console.log(`⏱️ Time regex match for step ${index + 1}:`, match);
        
        let timeInSeconds = null;
        if (match) {
          let value = parseInt(match[1], 10);
          const unit = match[2].toLowerCase();
          console.log(`⏱️ Found time in step ${index + 1}:`, { value, unit });
          
          // Enhanced unit detection for multiple languages
          if (unit.includes("hour") || unit.includes("hr") || 
              unit.includes("గంట") || unit.includes("घंटा") || 
              unit.includes("மணி") || unit.includes("മണിക്കൂർ")) {
            value = value * 3600;
            console.log(`⏱️ Converted hours to seconds:`, value);
          } else if (unit.includes("min") || unit.includes("నిమిష") || 
                     unit.includes("मिनट") || unit.includes("நிமிட") || 
                     unit.includes("മിനിറ്റ്")) {
            value = value * 60;
            console.log(`⏱️ Converted minutes to seconds:`, value);
          } else {
            console.log(`⏱️ Keeping seconds as is:`, value);
          }
          timeInSeconds = value;
        } else {
          console.log(`❌ No time found in step ${index + 1}`);
        }
        
        const enrichedStep = { text: step, time: timeInSeconds };
        console.log(`✅ Enriched step ${index + 1}:`, enrichedStep);
        return enrichedStep;
      });

      console.log("🎯 Final enriched steps:", enrichedSteps);
      console.log("🎯 Steps with timers:", enrichedSteps.filter(step => step.time !== null));

      setSteps(enrichedSteps);
      setCurrentStepIndex(0);

      if (enrichedSteps.length > 0) {
        console.log("🔊 Speaking first step:", enrichedSteps[0].text);
        speakViaGoogleTTS(enrichedSteps[0].text, language);
      }
    } catch (err) {
      console.error("❌ Error fetching recipe steps:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced timer logic with comprehensive logging
  const startTimer = (seconds) => {
    console.log("⏱️ startTimer called with seconds:", seconds);
    console.log("⏱️ Type of seconds:", typeof seconds);
    console.log("⏱️ Is seconds valid?", seconds && seconds > 0);
    
    if (!seconds || seconds <= 0) {
      console.error("❌ Invalid timer duration:", seconds);
      return;
    }
    
    // Clear any existing timer
    if (timerRef.current) {
      console.log("🛑 Clearing existing timer:", timerRef.current);
      clearInterval(timerRef.current);
    } else {
      console.log("ℹ️ No existing timer to clear");
    }
    
    console.log("🎯 Setting remaining time to:", seconds);
    setRemaining(seconds);
    
    console.log("🚀 Starting new timer interval");
    timerRef.current = setInterval(() => {
      console.log("⏰ Timer tick - current remaining:", remaining);
      setRemaining((prev) => {
        console.log("⏰ Timer callback - prev value:", prev);
        
        if (prev === null) {
          console.log("❌ Timer prev is null, stopping");
          return null;
        }
        
        if (prev <= 1) {
          console.log("🔔 Timer finished! Clearing interval");
          clearInterval(timerRef.current);
          alert("⏱️ Time's up!");
          return null;
        }
        
        const newValue = prev - 1;
        console.log("⏰ Timer decremented to:", newValue);
        return newValue;
      });
    }, 1000);
    
    console.log("✅ Timer interval created with ID:", timerRef.current);
  };

  // Enhanced timer display logging
  useEffect(() => {
    console.log("🎭 Remaining time changed:", remaining);
    if (remaining !== null) {
      const minutes = Math.floor(remaining / 60);
      const seconds = remaining % 60;
      console.log("🕐 Timer display:", `${minutes}:${String(seconds).padStart(2, "0")}`);
    }
  }, [remaining]);

  return (
    <div className="min-h-screen bg-white py-10 px-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-6">ChefSpeak Assistant</h1>

      {/* ✅ Input form */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-gray-100 rounded-xl shadow p-6 mb-8 space-y-4"
      >
        <div>
          <label className="block font-semibold mb-1">Dish Name</label>
          <input
            type="text"
            value={dishName}
            onChange={(e) => setDishName(e.target.value)}
            className="w-full p-2 rounded border border-gray-300"
            placeholder="e.g., Chicken Curry"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">Number of People</label>
          <input
            type="number"
            min="1"
            value={servings}
            onChange={(e) => setServings(e.target.value)}
            className="w-full p-2 rounded border border-gray-300"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">Additional Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2 rounded border border-gray-300"
            rows="3"
            placeholder="e.g., Make it spicy, use less oil"
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold rounded-full px-6 py-3 shadow-xl transition-all duration-300"
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Get Recipe"}
        </Button>
      </form>

      {/* ✅ Steps with timer detection */}
      <div className="space-y-3 w-full max-w-md">
        {steps.map((step, index) => {
          console.log(`🎭 Rendering step ${index + 1}:`, step);
          console.log(`🎭 Step has timer?`, step.time !== null && step.time !== undefined);
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-gray-100 rounded-xl p-4 shadow flex flex-col space-y-3 ${
                index === currentStepIndex ? "border-2 border-blue-400" : ""
              }`}
            >
              <div className="flex justify-between items-start">
                <span>{step.text}</span>
                <button onClick={() => speakViaGoogleTTS(step.text, language)}>
                  <Volume2 className="w-5 h-5 text-gray-500 hover:text-black" />
                </button>
              </div>

              {step.time && (
                <>
                  {console.log(`🎯 Rendering timer button for step ${index + 1} with time:`, step.time)}
                  {console.log(`🎯 Button calculation - Minutes: ${Math.floor(step.time / 60)}, Seconds: ${step.time % 60}`)}
                  <Button
                    onClick={() => {
                      console.log(`🎯 Timer button clicked for step ${index + 1}:`, step.time);
                      startTimer(step.time);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-2 text-sm w-fit"
                  >
                    ⏱ Start {step.time >= 60
                      ? `${Math.floor(step.time / 60)} min`
                      : `${step.time} sec`} Timer
                  </Button>
                </>
              )}
              
              {!step.time && console.log(`ℹ️ No timer for step ${index + 1}`)}
            </motion.div>
          );
        })}
      </div>

      {/* Enhanced timer display with logging */}
      {remaining !== null && (
        <>
          {console.log("🎭 Rendering timer display with remaining:", remaining)}
          <div className="mt-6 text-lg font-semibold text-red-600">
            ⏳ Time Remaining: {Math.floor(remaining / 60)}:
            {String(remaining % 60).padStart(2, "0")}
          </div>
        </>
      )}

      {steps.length > 0 && (
        <div className="fixed bottom-4 left-0 right-0 flex justify-center gap-4 px-4 z-50">
          <Button
            className="bg-gray-800 hover:bg-gray-900 text-white font-semibold rounded-full px-6 py-3 shadow-xl transition-all duration-300"
            onClick={handleBack}
          >
            ⬅ Back
          </Button>
          <Button
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded-full px-6 py-3 shadow-xl transition-all duration-300"
            onClick={handleRepeat}
          >
            🔁 Repeat
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-full px-6 py-3 shadow-xl transition-all duration-300"
            onClick={handleNext}
          >
            ➡ Next
          </Button>
        </div>
      )}
    </div>
  );
}
