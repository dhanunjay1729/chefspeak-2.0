// src/services/ttsService.js
import { toast } from "../contexts/ToastContext";

export class TTSService {
  constructor() {
    this.currentAudio = null;
    this.isPlaying = false;
    this.onPlayStateChange = null;
    this.onProgressChange = null;
    this.playbackRate = 1.0;
    this.requestId = 0;
    this.releaseAudio = null;
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002'; // ✅ FIX #12
  }

  /**
   * Stop any currently playing audio
   */
  stop() {
    // Invalidate pending requests even when no Audio element exists yet.
    this.requestId += 1;
    const audio = this.currentAudio;
    this.currentAudio = null;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
    this.releaseAudio?.();
    this.releaseAudio = null;
    this.isPlaying = false;
    this.onPlayStateChange?.(false);
    this.onProgressChange?.(0);
  }

  async speak(text, language = "English") {
    this.stop();
    const requestId = this.requestId;

    try {
      const response = await fetch(`${this.baseURL}/api/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }),
      });
      if (requestId !== this.requestId) return;

      if (!response.ok) throw new Error('TTS request failed');

      const audioBlob = await response.blob();
      if (requestId !== this.requestId) return;
      const audioUrl = URL.createObjectURL(audioBlob);
      this.releaseAudio = () => URL.revokeObjectURL(audioUrl);

      const audio = new Audio(audioUrl);
      this.currentAudio = audio;
      audio.playbackRate = this.playbackRate;
      const isCurrent = () => requestId === this.requestId && this.currentAudio === audio;
      
      // Event listeners
      audio.addEventListener('play', () => {
        if (!isCurrent()) return;
        this.isPlaying = true;
        this.onPlayStateChange?.(true);
      });
      
      audio.addEventListener('pause', () => {
        if (!isCurrent()) return;
        this.isPlaying = false;
        this.onPlayStateChange?.(false);
      });
      
      audio.addEventListener('ended', () => {
        if (!isCurrent()) return;
        this.isPlaying = false;
        this.onPlayStateChange?.(false);
        this.onProgressChange?.(0);
      });
      
      audio.addEventListener('timeupdate', () => {
        if (isCurrent() && Number.isFinite(audio.duration) && audio.duration > 0) {
          const progress = (audio.currentTime / audio.duration) * 100;
          this.onProgressChange?.(progress);
        }
      });

      // Retain the current URL after ended so Restart can reuse it.
      // Stop/replacement owns releasing both the element and its URL.
      await this.playAudio(audio, requestId);
    } catch (error) {
      if (requestId !== this.requestId) return;
      this.stop();
      console.error('TTS error:', error);
      toast.error('Audio narration is temporarily unavailable.');
    }
  }

  pause() {
    if (this.currentAudio) {
      this.currentAudio.pause();
    }
  }

  resume() {
    if (this.currentAudio && !this.isPlaying) {
      return this.playAudio(this.currentAudio, this.requestId);
    }
  }

  async playAudio(audio, requestId) {
    try {
      await audio.play();
      if (requestId !== this.requestId || this.currentAudio !== audio) audio.pause();
    } catch (error) {
      if (requestId !== this.requestId || this.currentAudio !== audio) return;
      this.isPlaying = false;
      this.onPlayStateChange?.(false);
      console.error('TTS playback error:', error);
      toast.error('Audio narration is temporarily unavailable.');
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
