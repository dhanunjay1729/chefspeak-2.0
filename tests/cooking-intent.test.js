import test from 'node:test';
import assert from 'node:assert/strict';
import process from 'node:process';
import { classifyCookingIntent, validCookingInput } from '../server/cookingIntent.js';

test('cooking intent request uses the typed Jev choice API', async () => {
  let request;
  const decision = await classifyCookingIntent('dish', 'laptop', {
    key: 'test-key',
    fetchImpl: async (_url, options) => {
      request = JSON.parse(options.body);
      return Response.json({ answers: { intent: { choice: 'reject' } } });
    },
  });
  assert.equal(decision, 'reject');
  assert.equal(request.model, 'typesafe-ai/jev-1.14.0');
  assert.deepEqual(request.state, { mode: 'dish', input: 'laptop' });
  assert.deepEqual(Object.keys(request.questions.intent.criteria), ['allow', 'clarify', 'reject']);
});

test('invalid and malformed guard inputs cannot become allow', async () => {
  assert.equal(validCookingInput('dish', ''), false);
  assert.equal(validCookingInput('dish', 42), false);
  assert.equal(validCookingInput('pantry', ['rice', 42]), false);
  await assert.rejects(classifyCookingIntent('dish', 'laptop', {
    key: 'test-key', fetchImpl: async () => Response.json({ answers: {} }),
  }), /invalid decision/);
});

test('recipe routes stop before generation for nonfood, ambiguous, and failed checks', async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.AI_GATEWAY_API_KEY;
  process.env.AI_GATEWAY_API_KEY = 'test-key';
  let decision = 'reject';
  let modelCalls = 0;
  globalThis.fetch = async (url) => {
    if (url.endsWith('/v1/evaluate')) {
      if (decision === 'error') return Response.json({ error: 'unavailable' }, { status: 503 });
      return Response.json({ answers: { intent: { choice: decision } } });
    }
    modelCalls++;
    return Response.json({ choices: [{ finish_reason: 'stop', message: { content: '1. Cook the food.' } }] });
  };

  const { app } = await import('../server/index.js');
  const server = app.listen(0);
  const url = `http://127.0.0.1:${server.address().port}`;
  const post = async (route, body) => originalFetch(`${url}${route}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  try {
    let response = await post('/api/recipe/steps', { dish: 'laptop', people: 2, language: 'English' });
    assert.equal(response.status, 422);
    assert.equal((await response.json()).code, 'OUTSIDE_COOKING');
    assert.equal(modelCalls, 0);

    decision = 'clarify';
    response = await post('/api/recipe/steps', { dish: 'something', people: 2, language: 'English' });
    assert.equal(response.status, 422);
    assert.equal((await response.json()).code, 'NEEDS_CLARIFICATION');
    assert.equal(modelCalls, 0);

    decision = 'reject';
    response = await post('/api/recipe/suggest-by-ingredients', { ingredients: ['tomato', 'keyboard'], staples: [] });
    assert.equal(response.status, 422);
    assert.equal(modelCalls, 0);

    response = await post('/api/recipe/suggest', { ingredients: ['laptop'], language: 'English' });
    assert.equal(response.status, 422);
    assert.equal(modelCalls, 0);

    decision = 'error';
    response = await post('/api/recipe/steps', { dish: 'laptop', people: 2, language: 'English' });
    assert.equal(response.status, 503);
    assert.equal(modelCalls, 0);

    decision = 'allow';
    response = await post('/api/recipe/steps', { dish: 'laptop-shaped chocolate cake', people: 2, language: 'English' });
    assert.equal(response.status, 200);
    assert.match(await response.text(), /Cook the food/);
    assert.equal(modelCalls, 1);
  } finally {
    await new Promise(resolve => server.close(resolve));
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.AI_GATEWAY_API_KEY;
    else process.env.AI_GATEWAY_API_KEY = originalKey;
  }
});
