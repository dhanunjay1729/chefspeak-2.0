import test from 'node:test';
import assert from 'node:assert/strict';
import { createModelFallback } from '../server/modelFallback.js';
import { recipeSchema } from '../server/recipeSchema.js';
import { createRecipeAssembler } from '../src/utils/recipeData.js';
import { readRecipeStream } from '../src/utils/sse.js';

const recipe = [{ type: 'ingredients', items: [{ id: 'rice', name: 'బియ్యం', quantity: 1, unit: 'cup', optional: false }] },
  { type: 'step', text: 'Cook rice.', ingredientIds: ['rice'], ingredientAmounts: [{ ingredientId: 'rice', quantity: 1, unit: 'cup' }], timeSeconds: 600 }];
const request = { contents: 'Make rice', config: { responseMimeType: 'application/json', responseJsonSchema: recipeSchema } };
const busy = () => { throw Object.assign(new Error('Quota exceeded'), { status: 429 }); };
const env = { AI_PAID_FALLBACK_ENABLED: 'true', AI_GATEWAY_API_KEY: 'test-key' };
const paidResponse = content => new Response(JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content } }] }), { headers: { 'Content-Type': 'application/json' } });

test('successful free Gemini never makes a paid call', async () => {
  const service = createModelFallback({ ai: { models: { generateContent: async () => ({ text: '{"calories":10}' }) } }, env,
    fetchImpl: () => assert.fail('Paid call made'), log() {} });
  assert.equal((await service.generate({ contents: 'nutrition', config: { responseMimeType: 'application/json' } })).text, '{"calories":10}');
});

test('exhausted free models use only Luna, adapt array schema, and keep quota failures on cooldown', async () => {
  let freeCalls = 0, paidCalls = 0;
  const service = createModelFallback({ ai: { models: { generateContent() { freeCalls++; busy(); } } }, env, log() {},
    fetchImpl: async (_url, options) => {
      paidCalls++;
      const payload = JSON.parse(options.body);
      assert.equal(payload.model, 'openai/gpt-6-luna');
      assert.equal(payload.reasoning.enabled, false);
      assert.deepEqual(payload.providerOptions.gateway.only, ['openai']);
      assert.equal(payload.response_format.json_schema.schema.type, 'object');
      assert.equal(payload.response_format.json_schema.schema.additionalProperties, false);
      return paidResponse(JSON.stringify({ result: recipe }));
    } });
  assert.deepEqual(JSON.parse((await service.generate(request)).text), recipe);
  await service.generate(request);
  assert.equal(freeCalls, 3);
  assert.equal(paidCalls, 2);
});

test('paid requests stay disabled without explicit activation even when a key exists', async () => {
  const service = createModelFallback({ ai: { models: { generateContent: busy } }, env: { AI_GATEWAY_API_KEY: 'test-key' },
    fetchImpl: () => assert.fail('Unconfigured paid call'), log() {} });
  await assert.rejects(service.generate(request), /not configured/);
});

test('Gateway budget exhaustion is not retried or bypassed', async () => {
  let calls = 0;
  const service = createModelFallback({ ai: { models: { generateContent: busy } }, env, log() {},
    fetchImpl: async () => { calls++; return new Response('{}', { status: 402 }); } });
  await assert.rejects(service.generate(request), /budget or credits exhausted/);
  assert.equal(calls, 1);
});

test('a failed partial Gemini recipe is reset before the paid replacement reaches the app', async () => {
  let calls = 0;
  const service = createModelFallback({ ai: { models: { async *generateContentStream() {
    calls++;
    if (calls === 1) yield { text: JSON.stringify([recipe[0]]).slice(0, -1) };
    busy();
  } } }, env, log() {}, fetchImpl: async () => paidResponse(JSON.stringify({ result: recipe })) });
  const events = [];
  for await (const event of service.stream(request)) events.push(event);
  assert.equal(events.filter(e => e.reset).length, 1);
  assert.equal(events.at(-1).model, 'openai/gpt-6-luna');
  const wire = events.map(event => `data: ${JSON.stringify(event)}\n\n`).join('') + 'data: [DONE]\n\n';
  let assembler = createRecipeAssembler();
  const body = new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode(wire)); controller.close(); } });
  await readRecipeStream(body, content => assembler.append(content), () => { assembler = createRecipeAssembler(); });
  assert.equal(assembler.finish().steps.length, 1);
  assert.equal(assembler.finish().ingredients[0].name, 'బియ్యం');
});

test('successful free streams report the free model and do not use Gateway', async () => {
  const service = createModelFallback({ ai: { models: { async *generateContentStream() { yield { text: JSON.stringify(recipe) }; } } }, env,
    fetchImpl: () => assert.fail('Paid call made'), log() {} });
  const events = [];
  for await (const event of service.stream(request)) events.push(event);
  assert.equal(events.length, 1);
  assert.equal(events[0].model, 'gemini-3.1-flash-lite');
});

test('truncated paid answers are rejected instead of being accepted as complete', async () => {
  const service = createModelFallback({ ai: { models: { generateContent: busy } }, env, log() {},
    fetchImpl: async () => new Response(JSON.stringify({ choices: [{ finish_reason: 'length', message: { content: '{"result":' } }] })) });
  await assert.rejects(service.generate(request), /incomplete answer/);
});

test('invalid free nutrition can fall through to a valid paid answer', async () => {
  const service = createModelFallback({ ai: { models: { generateContent: async () => ({ text: '{"calories":-5}' }) } }, env, log() {},
    fetchImpl: async () => paidResponse('{"calories":50}') });
  const result = await service.generate({ contents: 'nutrition', config: { responseMimeType: 'application/json' } }, text => JSON.parse(text).calories >= 0);
  assert.equal(JSON.parse(result.text).calories, 50);
});
