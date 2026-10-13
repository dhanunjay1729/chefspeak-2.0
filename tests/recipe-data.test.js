import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeNutrition } from '../server/nutrition.js';
import { readRecipeStream } from '../src/utils/sse.js';

test('nutrition rejects missing, fabricated, or invalid values', () => {
  for (const input of [null, {}, { calories: -10 }, { calories: '350', protein: 10, fat: 5, carbs: 20 }, { calories: Infinity, protein: 10, fat: 5, carbs: 20 }]) {
    assert.equal(sanitizeNutrition(input), null);
  }
  assert.deepEqual(sanitizeNutrition({ calories: 0, protein: 1.23, fat: 0, carbs: 5 }), { calories: 0, protein: 1.2, fat: 0, carbs: 5 });
});

test('recipe events survive every possible byte boundary', async () => {
  const text = 'data: {"content":"1. టమాటో\\n"}\r\n\r\ndata: {"content":"2. Cook\\n"}\n\ndata: [DONE]\n\n';
  const bytes = new TextEncoder().encode(text);
  const output = [];
  const body = new ReadableStream({ start(controller) {
    for (const byte of bytes) controller.enqueue(new Uint8Array([byte]));
    controller.close();
  }});
  await readRecipeStream(body, (content) => output.push(content));
  assert.deepEqual(output, ['1. టమాటో\n', '2. Cook\n']);
});
