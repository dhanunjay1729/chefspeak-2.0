import { performance } from 'node:perf_hooks';

// Fixed-size, process-local totals. Never retain narration text or user identity.
export function createSpeechMetrics({ now = () => performance.now() } = {}) {
  const startedAt = new Date().toISOString();
  const started = now();
  const counters = Object.fromEntries([
    'requests', 'responses', 'response_errors', 'invalid_requests', 'eligible_requests',
    'cache_hits', 'cache_misses', 'coalesced_requests', 'bypassed_requests', 'overload_rejections',
    'provider_attempts', 'provider_successes', 'provider_failures',
    'submitted_characters', 'submitted_utf8_bytes',
    'expired_evictions', 'capacity_evictions', 'oversized_results',
  ].map(name => [name, 0]));
  const latency = {
    request: { count: 0, total_ms: 0, max_ms: 0 },
    provider: { count: 0, total_ms: 0, max_ms: 0 },
  };
  let dirty = false;
  const snapshot = () => ({
    schema_version: 1, started_at: startedAt, elapsed_ms: Math.max(0, now() - started),
    counters: { ...counters },
    latency_ms: Object.fromEntries(Object.entries(latency).map(([key, value]) => [key, { ...value }])),
  });
  return {
    time: now,
    count(name, amount = 1) { counters[name] += amount; dirty = true; },
    observe(name, elapsed) {
      const ms = Math.max(0, elapsed);
      const value = latency[name];
      value.count++;
      value.total_ms += ms;
      value.max_ms = Math.max(value.max_ms, ms);
      dirty = true;
    },
    snapshot,
    report(write = value => console.info('[TTS_USAGE]', JSON.stringify(value))) {
      if (!dirty) return false;
      try {
        write(snapshot());
        dirty = false;
        return true;
      } catch {
        // Logging failure must not break narration; retain totals for the next report.
        return false;
      }
    },
  };
}
