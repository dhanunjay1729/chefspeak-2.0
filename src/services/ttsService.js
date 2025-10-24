// src/services/ttsService.js
export class TTSService {
  constructor() {
    this.currentAudio = null;
    this.isPlaying = false;
    this.onPlayStateChange = null;
    this.onProgressChange = null;
    this.playbackRate = 1.0;
  }

  /**
   * Stop any currently playing audio
   */
  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
      this.isPlaying = false;
      this.onPlayStateChange?.(false);
      this.onProgressChange?.(0);
    }
  }

  async speak(text, language = "English") {
    this.stop();

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }),
      });

      if (!response.ok) throw new Error('TTS request failed');

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      this.currentAudio = new Audio(audioUrl);
      this.currentAudio.playbackRate = this.playbackRate;
      
      // Event listeners
      this.currentAudio.addEventListener('play', () => {
        this.isPlaying = true;
        this.onPlayStateChange?.(true);
      });
      
      this.currentAudio.addEventListener('pause', () => {
        this.isPlaying = false;
        this.onPlayStateChange?.(false);
      });
      
      this.currentAudio.addEventListener('ended', () => {
        this.isPlaying = false;
        this.onPlayStateChange?.(false);
        this.onProgressChange?.(0);
      });
      
      this.currentAudio.addEventListener('timeupdate', () => {
        if (this.currentAudio) {
          const progress = (this.currentAudio.currentTime / this.currentAudio.duration) * 100;
          this.onProgressChange?.(progress);
        }
      });

      // Prevent memory leaks
      this.currentAudio.addEventListener('ended', () => {
        URL.revokeObjectURL(audioUrl);
      });

      await this.currentAudio.play();
    } catch (error) {
      console.error('TTS error:', error);
    }
  }

  pause() {
    if (this.currentAudio && this.isPlaying) {
      this.currentAudio.pause();
    }
  }

  resume() {
    if (this.currentAudio && !this.isPlaying) {
      this.currentAudio.play();
    }
  }

  togglePlayPause() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.resume();
    }
  }

  seek(percentage) {
    if (this.currentAudio && this.currentAudio.duration) {
      this.currentAudio.currentTime = (percentage / 100) * this.currentAudio.duration;
    }
  }

  setPlaybackRate(rate) {
    this.playbackRate = rate;
    if (this.currentAudio) {
      this.currentAudio.playbackRate = rate;
    }
  }

  getCurrentTime() {
    return this.currentAudio?.currentTime || 0;
  }

  getDuration() {
    return this.currentAudio?.duration || 0;
  }
}