import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { getLanguage } from '../shared/languages.js';

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
  synthesize, cacheEnabled = true, now = Date.now,
  maxBytes = 32 * 1024 * 1024, maxEntries = 256,
  ttlMs = 24 * 60 * 60 * 1000, maxInFlight = 8,
}) {
  for (const value of [maxBytes, maxEntries, ttlMs, maxInFlight]) {
    if (!Number.isSafeInteger(value) || value <= 0) throw new RangeError('Invalid speech cache limit');
  }
  const completed = new Map();
  const inFlight = new Map();
  let bytes = 0;
  const remove = key => {
    bytes -= completed.get(key).audio.length;
    completed.delete(key);
  };

  // Exact request -> completed MP3 | shared pending promise | one Google call.
  // Completed audio and outstanding unique work have independent bounds.
  return async function getSpeech(request) {
    const key = createHash('sha256').update('speech-v1\0').update(JSON.stringify(request)).digest('hex');
    const currentTime = now();
    for (const [entryKey, entry] of completed) {
      if (entry.expiresAt <= currentTime) remove(entryKey);
    }
    const cached = completed.get(key);
    if (cached && cacheEnabled) {
      completed.delete(key);
      completed.set(key, cached);
      return { audio: cached.audio, cacheStatus: 'hit' };
    }
    const pending = inFlight.get(key);
    if (pending) return { audio: await pending, cacheStatus: 'coalesced' };
    if (inFlight.size >= maxInFlight) throw speechError('Narration is busy. Please try again.', 503);

    const work = Promise.resolve().then(() => synthesize(request, SYNTHESIS_OPTIONS)).then(([response]) => {
      const audio = audioBuffer(response?.audioContent);
      if (cacheEnabled && audio.length <= maxBytes) {
        while (completed.size >= maxEntries || bytes + audio.length > maxBytes) {
          remove(completed.keys().next().value);
        }
        completed.set(key, { audio, expiresAt: now() + ttlMs });
        bytes += audio.length;
      }
      return audio;
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
  const getSpeech = createSpeechCache(options);
  return async function speak(req, res) {
    const { text, language } = req.body ?? {};
    if (typeof text !== 'string' || !text.trim() || Buffer.byteLength(text, 'utf8') > 5000) {
      return res.status(400).json({ error: 'Provide narration text between 1 and 5,000 UTF-8 bytes.' });
    }
    const selectedLanguage = getLanguage(language);
    if (!selectedLanguage) return res.status(400).json({ error: 'Unsupported language' });
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
      const status = error.status === 503 ? 503 : error.code === 4 ? 504 : 500;
      if (status === 503) res.setHeader('Retry-After', '5');
      // Do not log provider messages that may contain submitted narration text.
      console.error('[TTS] Speech synthesis failed', { status });
      res.status(status).json({ error: status === 503 ? 'Narration is busy. Please try again.' : 'TTS generation failed' });
    }
  };
}
