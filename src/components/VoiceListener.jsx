import { useEffect, useRef } from "react";

export default function VoiceListener({ onCommand }) {
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const restartTimeoutRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("❌ SpeechRecognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false; // each session is short — we restart manually
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    const log = (msg) => console.log(`[🎧 VoiceListener] ${msg}`);

    const scheduleRestart = () => {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = setTimeout(() => {
        safeStart();
      }, 1500); // smooth cooldown
    };

    const safeStart = () => {
      if (isListeningRef.current) {
        log("⏳ Already listening, skipping start");
        return;
      }

      try {
        recognition.start();
        isListeningRef.current = true;
        log("🎙️ Speech recognition started");
      } catch (err) {
        log(`⚠️ Failed to start recognition: ${err.message}`);
      }
    };

    recognition.onstart = () => {
      log("✅ onstart fired — listening...");
    };

    recognition.onresult = (event) => {
      isListeningRef.current = false;
      const transcript = event.results[0][0].transcript.toLowerCase().trim();

      let command = null;
      if (transcript.includes("next")) command = "next";
      else if (transcript.includes("repeat") || transcript.includes("again")) command = "repeat";
      else if (transcript.includes("back") || transcript.includes("previous")) command = "back";

      if (command) {
        onCommand(command, transcript);
      } else {
        onCommand("unknown", transcript);
      }

      scheduleRestart();
    };

    recognition.onerror = (e) => {
      isListeningRef.current = false;
      log(`🚨 recognition.onerror: ${e.error}`);
      scheduleRestart();
    };

    recognition.onend = () => {
      isListeningRef.current = false;
      log("🔁 onend fired — recognition stopped");
      scheduleRestart();
    };

    safeStart(); // initial call

    return () => {
      log("🧹 Cleanup");
      try {
        recognition.stop();
      } catch (_) {}
      clearTimeout(restartTimeoutRef.current);
    };
  }, [onCommand]);

  return <div className="text-xs text-gray-500 italic">🎙️ Voice command listener active (Chrome only)</div>;
}
