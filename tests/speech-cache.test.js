import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { createRequire } from 'node:module';
import process from 'node:process';
import { createSpeechCache, createSpeechHandler } from '../server/speechCache.js';
import { LANGUAGES } from '../shared/languages.js';
import { createSpeechMetrics } from '../server/speechMetrics.js';

const request = (text = 'Cook rice') => ({
  input: { text }, voice: { languageCode: 'en-IN', name: 'en-IN-Chirp-HD-O' },
  audioConfig: { audioEncoding: 'MP3' },
});
const result = audio => [{ audioContent: audio ?? Buffer.from('mp3 audio') }];
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const responder = () => ({
  headers: {}, statusCode: 200,
  setHeader(key, value) { this.headers[key] = value; },
  status(value) { this.statusCode = value; return this; },
  json(value) { this.body = value; return this; },
  send(value) { this.body = value; return this; },
});

test('cache hits preserve exact bytes; every synthesis-affecting value isolates audio', async () => {
  let calls = 0;
  const get = createSpeechCache({ synthesize: async (_req, options) => {
    calls++;
    assert.deepEqual(options, { timeout: 30_000, retry: null });
    return result(Buffer.from([0, 255, calls]));
  } });
  const original = await get(request());
  const hit = await get(request());
  assert.equal(hit.cacheStatus, 'hit');
  assert.deepEqual(hit.audio, original.audio);
  assert.equal(calls, 1);
  for (const change of [
    r => { r.input.text += ' '; },
    r => { r.input.text = r.input.text.toLowerCase(); },
    r => { r.voice.name = 'en-IN-Chirp3-HD-Leda'; },
    r => { r.voice.languageCode = 'en-US'; },
    r => { r.audioConfig.audioEncoding = 'LINEAR16'; },
    r => { r.audioConfig.speakingRate = 1.1; },
  ]) {
    const changed = request(); change(changed);
    assert.equal((await get(changed)).cacheStatus, 'miss');
  }
  assert.equal(calls, 7);
});

test('simultaneous identical requests share work and failed synthesis can be retried', async () => {
  const pending = deferred();
  let calls = 0;
  const get = createSpeechCache({ synthesize: async () => { calls++; return pending.promise; } });
  const first = get(request()), second = get(request());
  await Promise.resolve();
  assert.equal(calls, 1);
  pending.resolve(result());
  const outputs = await Promise.all([first, second]);
  assert.deepEqual(outputs.map(x => x.cacheStatus), ['miss', 'coalesced']);
  assert.deepEqual(outputs[0].audio, outputs[1].audio);

  const failure = deferred();
  let retries = 0;
  const retry = createSpeechCache({ synthesize: async () => ++retries === 1 ? failure.promise : result() });
  const waiting = Promise.allSettled([retry(request()), retry(request())]);
  failure.reject(new Error('Provider unavailable'));
  assert.deepEqual((await waiting).map(x => x.status), ['rejected', 'rejected']);
  assert.equal((await retry(request())).cacheStatus, 'miss');
  assert.equal(retries, 2);
});

test('entry and byte caps evict least-recently-used audio; oversized audio is returned but not retained', async () => {
  for (const limits of [{ maxEntries: 2 }, { maxBytes: 6 }]) {
    const calls = [];
    const metrics = createSpeechMetrics();
    const get = createSpeechCache({ ...limits, metrics, synthesize: async req => {
      calls.push(req.input.text); return result(Buffer.from('123'));
    } });
    await get(request('A')); await get(request('B')); await get(request('A'));
    await get(request('C'));
    assert.equal((await get(request('A'))).cacheStatus, 'hit');
    assert.equal((await get(request('B'))).cacheStatus, 'miss');
    assert.deepEqual(calls, ['A', 'B', 'C', 'B']);
    assert.equal(metrics.snapshot().counters.capacity_evictions, 2);
  }
  let calls = 0;
  const metrics = createSpeechMetrics();
  const oversized = createSpeechCache({ metrics, maxBytes: 2, synthesize: async () => { calls++; return result(); } });
  await oversized(request()); await oversized(request());
  assert.equal(calls, 2);
  assert.equal(metrics.snapshot().counters.oversized_results, 2);
});

test('expiry is absolute, pending work survives expiry, and restart starts cold', async () => {
  let time = 0, calls = 0;
  const synthesize = async () => { calls++; return result(); };
  const metrics = createSpeechMetrics();
  const get = createSpeechCache({ synthesize, metrics, now: () => time, ttlMs: 10 });
  await get(request()); time = 9;
  assert.equal((await get(request())).cacheStatus, 'hit');
  time = 10;
  assert.equal((await get(request())).cacheStatus, 'miss');
  const restarted = createSpeechCache({ synthesize });
  assert.equal((await restarted(request())).cacheStatus, 'miss');
  assert.equal(calls, 3);
  assert.equal(metrics.snapshot().counters.expired_evictions, 1);

  const pending = deferred();
  let activeCalls = 0;
  const delayed = createSpeechCache({ now: () => time, ttlMs: 1, synthesize: async () => { activeCalls++; return pending.promise; } });
  const old = delayed(request()); time += 100;
  const same = delayed(request()); pending.resolve(result());
  await Promise.all([old, same]);
  assert.equal(activeCalls, 1);
});

test('unique-work saturation rejects explicitly while hits and coalesced requests stay available', async () => {
  const pending = deferred();
  let calls = 0;
  const get = createSpeechCache({ maxInFlight: 1, synthesize: async req => {
    calls++; return req.input.text === 'pending' ? pending.promise : result();
  } });
  await get(request('cached'));
  const busy = get(request('pending'));
  const joined = get(request('pending'));
  assert.equal((await get(request('cached'))).cacheStatus, 'hit');
  await assert.rejects(get(request('different')), { status: 503 });
  pending.resolve(result());
  await Promise.all([busy, joined]);
  assert.equal(calls, 2);
  assert.equal((await get(request('different'))).cacheStatus, 'miss');
});

test('cache bypass retains no completed audio and invalid audio never poisons retries', async () => {
  let calls = 0;
  const metrics = createSpeechMetrics();
  const get = createSpeechCache({ metrics, cacheEnabled: false, synthesize: async () => { calls++; return result(); } });
  assert.equal((await get(request())).cacheStatus, 'bypass');
  await get(request());
  assert.equal(calls, 2);
  assert.equal(metrics.snapshot().counters.bypassed_requests, 2);
  for (const invalid of [undefined, '', new Uint8Array(), { bogus: true }]) {
    let attempts = 0;
    const retry = createSpeechCache({ synthesize: async () => ++attempts === 1 ? [{ audioContent: invalid }] : result() });
    await assert.rejects(retry(request()), /no audio/);
    await retry(request());
    assert.equal(attempts, 2);
  }
  const base64 = createSpeechCache({ synthesize: async () => result(Buffer.from('mp3').toString('base64')) });
  assert.deepEqual((await base64(request())).audio, Buffer.from('mp3'));
  assert.throws(() => createSpeechCache({ maxBytes: 0 }), /Invalid speech cache limit/);
});

test('handler validates UTF-8 bytes and preserves all configured language voices', async () => {
  const requests = [];
  const handler = createSpeechHandler({ synthesize: async req => { requests.push(req); return result(); } });
  for (const text of [null, undefined, 42, {}, '', '  ', 'a'.repeat(5001), 'अ'.repeat(1667)]) {
    const res = responder();
    await handler({ body: { text } }, res);
    assert.equal(res.statusCode, 400);
  }
  const noBody = responder();
  await handler({}, noBody);
  assert.equal(noBody.statusCode, 400);
  assert.equal(requests.length, 0);
  for (const language of LANGUAGES) {
    const res = responder();
    await handler({ body: { text: 'Test', language: language.code } }, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(requests.at(-1).voice, {
      name: language.voice, languageCode: language.voice.split('-').slice(0, 2).join('-'),
    });
  }
  await handler({ body: { text: 'a'.repeat(5000), language: 'English' } }, responder());
  const beforeAlias = requests.length;
  await handler({ body: { text: 'a'.repeat(5000), language: 'INDIAN_ENGLISH' } }, responder());
  assert.equal(requests.length, beforeAlias);
  const badLanguage = responder();
  await handler({ body: { text: 'Test', language: 'unknown' } }, badLanguage);
  assert.equal(badLanguage.statusCode, 400);
});

test('handler reports overload and deadline errors without caching them', async t => {
  t.mock.method(console, 'error', () => {});
  const pending = deferred();
  const handler = createSpeechHandler({ maxInFlight: 1, synthesize: async () => pending.promise });
  const first = handler({ body: { text: 'first' } }, responder());
  const busy = responder();
  await handler({ body: { text: 'second' } }, busy);
  assert.equal(busy.statusCode, 503);
  assert.equal(busy.headers['Retry-After'], '5');
  pending.resolve(result()); await first;
  let calls = 0;
  const failing = createSpeechHandler({ synthesize: async () => {
    if (++calls === 1) throw Object.assign(new Error('Deadline'), { code: 4 });
    return result();
  } });
  const deadline = responder();
  await failing({ body: { text: 'Test' } }, deadline);
  assert.equal(deadline.statusCode, 504);
  const retry = responder();
  await failing({ body: { text: 'Test' } }, retry);
  assert.equal(retry.statusCode, 200);
});

test('real /api/speak wiring returns cached MP3 and rate-limits cache hits', async () => {
  const require = createRequire(new URL('../server/package.json', import.meta.url));
  const tts = require('@google-cloud/text-to-speech');
  const originalCredentials = process.env.GOOGLE_TTS_CREDENTIALS;
  const originalKeyPath = process.env.GOOGLE_TTS_KEY_PATH;
  process.env.GOOGLE_TTS_CREDENTIALS = '{"project_id":"cache-test"}';
  delete process.env.GOOGLE_TTS_KEY_PATH;
  const synthesize = mock.method(tts.TextToSpeechClient.prototype, 'synthesizeSpeech', async () => result());
  let server;
  try {
    const { app } = await import('../server/index.js');
    server = app.listen(0);
    const url = `http://127.0.0.1:${server.address().port}/api/speak`;
    for (let i = 0; i < 201; i++) {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'Test', language: 'hindi' }) });
      assert.equal(res.status, i < 200 ? 200 : 429);
      if (i < 200) {
        assert.match(res.headers.get('content-type'), /audio\/mpeg/);
        assert.equal(res.headers.get('x-tts-cache'), i === 0 ? 'miss' : 'hit');
        assert.equal(res.headers.get('cache-control'), 'no-store');
        assert.deepEqual(Buffer.from(await res.arrayBuffer()), result()[0].audioContent);
      } else await res.arrayBuffer();
    }
    assert.equal(synthesize.mock.callCount(), 1);
    assert.equal(synthesize.mock.calls[0].arguments[0].voice.name, LANGUAGES.find(x => x.code === 'hindi').voice);
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    synthesize.mock.restore();
    if (originalCredentials === undefined) delete process.env.GOOGLE_TTS_CREDENTIALS;
    else process.env.GOOGLE_TTS_CREDENTIALS = originalCredentials;
    if (originalKeyPath === undefined) delete process.env.GOOGLE_TTS_KEY_PATH;
    else process.env.GOOGLE_TTS_KEY_PATH = originalKeyPath;
  }
});
