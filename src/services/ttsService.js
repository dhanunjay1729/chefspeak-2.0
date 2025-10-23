// src/services/ttsService.js
export class TTSService {
  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';
    this.currentAudio = null; // ✅ Track currently playing audio
  }

  /**
   * Stop any currently playing audio
   */
  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }

  async speak(text, language) {
    try {
      // ✅ Stop previous audio before starting new one
      this.stop();

      const response = await fetch(`${this.baseUrl}/api/speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language }),
      });

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      // ✅ Store reference to current audio
      this.currentAudio = audio;

      // ✅ Clear reference when audio finishes
      audio.addEventListener('ended', () => {
        if (this.currentAudio === audio) {
          this.currentAudio = null;
        }
      });

      // ✅ Clear reference on error
      audio.addEventListener('error', () => {
        if (this.currentAudio === audio) {
          this.currentAudio = null;
        }
      });

      await audio.play();
    } catch (error) {
      console.error("TTS Error:", error);
      this.currentAudio = null; // ✅ Clear on error
      throw error;
    }
  }

  /**
   * Check if audio is currently playing
   */
  isPlaying() {
    return this.currentAudio !== null && !this.currentAudio.paused;
  }
}