// src/services/serverWakeService.js
class ServerWakeService {
  constructor({ baseURL, minIntervalMs = 60 * 1000, useHead = true } = {}) {
    this.baseURL = baseURL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';
    this.lastWakeTime = 0;
    this.minIntervalMs = minIntervalMs; // default 60s
    this.useHead = useHead;
  }

  async wakeServer() {
    const now = Date.now();
    if (now - this.lastWakeTime < this.minIntervalMs) {
      console.log('ServerWakeService: skipped (recently woken)');
      return;
    }
    this.lastWakeTime = now;
    console.log('ServerWakeService: waking server...');

    const controller = new AbortController();
    const timeoutMs = 60000; // 60s for cold starts
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const method = this.useHead ? 'HEAD' : 'GET';
      const res = await fetch(`${this.baseURL}/health`, {
        method,
        signal: controller.signal,
        // mode: 'cors' // default; ensure server CORS allows this origin
      });

      if (res.ok) {
        console.log('ServerWakeService: server awake (status)', res.status);
      } else {
        console.log('ServerWakeService: health check non-OK', res.status);
      }
    } catch (err) {
      if (err && err.name === 'AbortError') {
        console.log('ServerWakeService: wake attempt timed out (AbortError)');
      } else {
        console.log('ServerWakeService: wake attempt failed:', err && err.name ? err.name : err);
      }
      // silent fail otherwise
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export const serverWakeService = new ServerWakeService();
