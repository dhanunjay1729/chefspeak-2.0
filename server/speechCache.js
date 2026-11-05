import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { getLanguage } from '../shared/languages.js';
import { createSpeechMetrics } from './speechMetrics.js';

const SYNTHESIS_OPTIONS = { timeout: 30_000, retry: null };

function speechError(message, status) {
  return Object.assign(new Error(message), { status });
}

function audioBuffer(content) {
  const audio = typeof content === 'string' ? Buffer.from(content, 'base64')
    : content instanceof Uint8Array ? Buffer.from(content) : null;
  if (!audio?.length) throw new Error('TTS returned no audio');
  return audio;
}

export function createSpeechCache({
  synthesize, cacheEnabled = true, now = Date.now, metrics = createSpeechMetrics(),
  maxBytes = 32 * 1024 * 1024, maxEntries = 256,
  ttlMs = 24 * 60 * 60 * 1000, maxInFlight = 8,
}) {
  for (const value of [maxBytes, maxEntries, ttlMs, maxInFlight]) {
    if (!Number.isSafeInteger(value) || value <= 0) throw new RangeError('Invalid speech cache limit');
  }
  const completed = new Map();
  const inFlight = new Map();
  let bytes = 0;
  const remove = (key, reason) => {
    bytes -= completed.get(key).audio.length;
    completed.delete(key);
    metrics.count(reason === 'expired' ? 'expired_evictions' : 'capacity_evictions');
  };

  // Exact request -> completed MP3 | shared pending promise | one Google call.
  // Completed audio and outstanding unique work have independent bounds.
  return async function getSpeech(request) {
    metrics.count('eligible_requests');
    const key = createHash('sha256').update('speech-v1\0').update(JSON.stringify(request)).digest('hex');
    const currentTime = now();
    for (const [entryKey, entry] of completed) {
      if (entry.expiresAt <= currentTime) remove(entryKey, 'expired');
    }
    const cached = completed.get(key);
    if (cached && cacheEnabled) {
      metrics.count('cache_hits');
      completed.delete(key);
      completed.set(key, cached);
      return { audio: cached.audio, cacheStatus: 'hit' };
    }
    const pending = inFlight.get(key);
    if (pending) {
      metrics.count('coalesced_requests');
      return { audio: await pending, cacheStatus: 'coalesced' };
    }
    if (inFlight.size >= maxInFlight) {
      metrics.count('overload_rejections');
      throw speechError('Narration is busy. Please try again.', 503);
    }
    metrics.count(cacheEnabled ? 'cache_misses' : 'bypassed_requests');

    const work = Promise.resolve().then(async () => {
      const start = metrics.time();
      metrics.count('provider_attempts');
      metrics.count('submitted_characters', Array.from(request.input.text).length);
      metrics.count('submitted_utf8_bytes', Buffer.byteLength(request.input.text, 'utf8'));
      try {
        const [response] = await synthesize(request, SYNTHESIS_OPTIONS);
        const audio = audioBuffer(response?.audioContent);
        metrics.count('provider_successes');
        if (cacheEnabled && audio.length <= maxBytes) {
          while (completed.size >= maxEntries || bytes + audio.length > maxBytes) {
            remove(completed.keys().next().value, 'capacity');
          }
          completed.set(key, { audio, expiresAt: now() + ttlMs });
          bytes += audio.length;
        } else if (cacheEnabled) {
          metrics.count('oversized_results');
        }
        return audio;
      } catch (error) {
        metrics.count('provider_failures');
        throw error;
      } finally {
        metrics.observe('provider', metrics.time() - start);
      }
    });
    inFlight.set(key, work);
    try {
      return { audio: await work, cacheStatus: cacheEnabled ? 'miss' : 'bypass' };
    } finally {
      // Rejections must not poison future requests or leave a full pending map.
      inFlight.delete(key);
    }
  };
}

export function createSpeechHandler(options) {
  const metrics = options.metrics || createSpeechMetrics();
  const getSpeech = createSpeechCache({ ...options, metrics });
  return async function speak(req, res) {
    metrics.count('requests');
    const start = metrics.time();
    let status = 200;
    try {
      const { text, language } = req.body ?? {};
      if (typeof text !== 'string' || !text.trim() || Buffer.byteLength(text, 'utf8') > 5000) {
        status = 400;
        metrics.count('invalid_requests');
        return res.status(400).json({ error: 'Provide narration text between 1 and 5,000 UTF-8 bytes.' });
      }
      const selectedLanguage = getLanguage(language);
      if (!selectedLanguage) {
        status = 400;
        metrics.count('invalid_requests');
        return res.status(400).json({ error: 'Unsupported language' });
      }
      const name = selectedLanguage.voice;
      const languageCode = name.split('-').slice(0, 2).join('-');
      try {
        const { audio, cacheStatus } = await getSpeech({
          input: { text },
          voice: { languageCode, name },
          audioConfig: { audioEncoding: 'MP3' },
        });
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('X-TTS-Cache', cacheStatus);
        res.send(audio);
      } catch (error) {
        status = error.status === 503 ? 503 : error.code === 4 ? 504 : 500;
        if (status === 503) res.setHeader('Retry-After', '5');
        // Do not log provider messages that may contain submitted narration text.
        console.error('[TTS] Speech synthesis failed', { status });
        res.status(status).json({ error: status === 503 ? 'Narration is busy. Please try again.' : 'TTS generation failed' });
      }
    } finally {
      metrics.count('responses');
      if (status >= 400) metrics.count('response_errors');
      metrics.observe('request', metrics.time() - start);
    }
  };
}
