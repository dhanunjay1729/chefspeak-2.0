import test from 'node:test';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { createSpeechMetrics } from '../server/speechMetrics.js';
import { createSpeechCache, createSpeechHandler } from '../server/speechCache.js';

const responder = () => ({
  statusCode: 200, setHeader() {}, send() {},
  status(value) { this.statusCode = value; return this; }, json() {},
});

test('aggregate counts distinguish API traffic from provider work without retaining text', async () => {
  let clock = 0;
  const metrics = createSpeechMetrics({ now: () => clock });
  const handler = createSpeechHandler({ metrics, synthesize: async () => {
    clock += 25;
    return [{ audioContent: Buffer.from('audio') }];
  } });
  const privateText = 'क😀';
  await handler({ body: { text: privateText, language: 'hindi' } }, responder());
  await handler({ body: { text: privateText, language: 'hindi' } }, responder());
  const bad = responder();
  await handler({ body: { text: privateText, language: 'unknown' } }, bad);
  assert.equal(bad.statusCode, 400);
  const data = metrics.snapshot();
  assert.equal(data.counters.requests, 3);
  assert.equal(data.counters.responses, 3);
  assert.equal(data.counters.response_errors, 1);
  assert.equal(data.counters.invalid_requests, 1);
  assert.equal(data.counters.eligible_requests, 2);
  assert.equal(data.counters.provider_attempts, 1);
  assert.equal(data.counters.provider_successes, 1);
  assert.equal(data.counters.cache_misses, 1);
  assert.equal(data.counters.cache_hits, 1);
  assert.equal(data.counters.submitted_characters, 2);
  assert.equal(data.counters.submitted_utf8_bytes, 7);
  assert.deepEqual(data.latency_ms.provider, { count: 1, total_ms: 25, max_ms: 25 });
  assert.deepEqual(data.latency_ms.request, { count: 3, total_ms: 25, max_ms: 25 });
  assert.equal(JSON.stringify(data).includes(privateText), false);
  data.counters.requests = 999;
  data.latency_ms.provider.max_ms = 999;
  assert.equal(metrics.snapshot().counters.requests, 3);
  assert.equal(metrics.snapshot().latency_ms.provider.max_ms, 25);
});

test('coalesced failures and overload are not counted as additional provider attempts', async () => {
  const metrics = createSpeechMetrics();
  let reject;
  const pending = new Promise((_resolve, fail) => { reject = fail; });
  let attempts = 0;
  const get = createSpeechCache({ metrics, maxInFlight: 1, synthesize: async () => {
    if (++attempts === 1) return pending;
    return [{ audioContent: Buffer.from('audio') }];
  } });
  const request = { input: { text: 'private cooking text' } };
  const first = get(request), coalesced = get(request);
  await assert.rejects(get({ input: { text: 'another text' } }), { status: 503 });
  const outcomes = Promise.allSettled([first, coalesced]);
  reject(new Error('Provider failure'));
  await outcomes;
  await get(request);
  const { counters } = metrics.snapshot();
  assert.equal(counters.eligible_requests, 4);
  assert.equal(counters.coalesced_requests, 1);
  assert.equal(counters.overload_rejections, 1);
  assert.equal(counters.provider_attempts, 2);
  assert.equal(counters.provider_failures, 1);
  assert.equal(counters.provider_successes, 1);
  assert.equal(counters.submitted_characters, 2 * request.input.text.length);
});

test('reports are cumulative, quiet without activity, and retry safely after logging failure', () => {
  const metrics = createSpeechMetrics({ now: () => 10 });
  const logs = [];
  assert.equal(metrics.report(value => logs.push(value)), false);
  metrics.count('requests');
  assert.equal(metrics.report(() => { throw new Error('Logging unavailable'); }), false);
  assert.equal(metrics.report(value => logs.push(value)), true);
  assert.equal(metrics.report(value => logs.push(value)), false);
  metrics.count('requests');
  metrics.report(value => logs.push(value));
  assert.deepEqual(logs.map(x => x.counters.requests), [1, 2]);
  assert.equal(logs[0].schema_version, 1);
  assert.equal(typeof logs[0].started_at, 'string');
  assert.equal(logs[0].elapsed_ms, 0);
});
