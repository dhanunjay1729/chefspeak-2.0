import test from 'node:test';
import assert from 'node:assert/strict';
import process from 'node:process';
import recipe from '../src/pages/api/recipe.js';
import nutrition from '../src/pages/api/nutrition.js';

test('legacy Gemini routes stay disabled in default paid mode', async () => {
  const previous = process.env.AI_PROVIDER;
  delete process.env.AI_PROVIDER;
  try {
    for (const handler of [recipe, nutrition]) {
      let status;
      let body;
      const res = {
        status(code) { status = code; return this; },
        json(value) { body = value; return this; },
      };
      await handler({ method: 'POST', body: { dish: 'rice' } }, res);
      assert.equal(status, 410);
      assert.match(body.error, /disabled/);
    }
  } finally {
    if (previous === undefined) delete process.env.AI_PROVIDER;
    else process.env.AI_PROVIDER = previous;
  }
});
