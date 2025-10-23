class ServerWakeService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';
    this.lastWakeTime = 0;
  }

  /**
   * Wake server once (debounced to prevent spam)
   */
  async wakeServer() {
    const now = Date.now();
    
    // Don't ping more than once per minute
    if (now - this.lastWakeTime < 60000) {
      console.log('⏱️ Server recently woken, skipping');
      return;
    }

    this.lastWakeTime = now;
    console.log('🔥 Waking server...');

    try {
      // Simple health check with 20s timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('✅ Server awake');
    } catch (error) {
      // Silently fail - not critical
      console.log('Server wake skipped:', error.name);
    }
  }
}

export const serverWakeService = new ServerWakeService();