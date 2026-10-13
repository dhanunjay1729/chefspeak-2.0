import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSuggestions } from '../server/pantry.js';

test('missing staples are reported instead of assumed and ready dishes rank first', () => {
  const raw = [
    { name: 'Fried rice', requiredIngredients: ['rice', 'onions', 'oil', 'salt'], optionalIngredients: ['coriander'], estimatedMinutes: 20 },
    { name: 'Plain rice', requiredIngredients: ['rice'], optionalIngredients: [] },
  ];
  const result = normalizeSuggestions(raw, ['rice', 'onion']);
  assert.equal(result[0].name, 'Plain rice');
  assert.deepEqual(result[1].usedIngredients, ['rice', 'onion']);
  assert.deepEqual(result[1].missingIngredients, ['oil', 'salt']);
  assert.deepEqual(result[1].optionalIngredients, ['coriander']);
  assert.deepEqual(normalizeSuggestions(raw, ['rice', 'onion', 'oil', 'salt'])[0].missingIngredients, []);
});

test('malformed and irrelevant model suggestions are rejected', () => {
  assert.deepEqual(normalizeSuggestions([{ name: 'Mystery' }, { name: 'Steak', requiredIngredients: ['beef'] }, null], ['rice']), []);
  assert.deepEqual(normalizeSuggestions(null, ['rice']), []);
});
