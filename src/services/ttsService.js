// src/services/ttsService.js
export class TTSService {
  constructor(baseUrl = "http://localhost:3001") {
    this.baseUrl = baseUrl;
  }

  async speak(text, language) {
    try {
      const response = await fetch(`${this.baseUrl}/api/speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language }),
      });

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      await audio.play();
    } catch (error) {
      console.error("TTS Error:", error);
    }
  }
}