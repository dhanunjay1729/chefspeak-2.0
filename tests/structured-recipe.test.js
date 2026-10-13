import test from 'node:test';
import assert from 'node:assert/strict';
import { createRecipeAssembler, ingredientLabel } from '../src/utils/recipeData.js';

test('structured recipe keeps quantities separate and connects them to steps across chunks', () => {
  const assembler = createRecipeAssembler();
  const input = JSON.stringify({ type: 'ingredients', items: [{ id: 'rice', name: 'బియ్యం', quantity: 1.5, unit: 'cups' }, { id: 'salt', name: 'Salt', quantity: null, unit: 'to taste', optional: true }] }) + '\n' + JSON.stringify({ type: 'step', text: 'Cook rice', ingredientIds: ['rice'], timeSeconds: 600 });
  for (const character of input) assembler.append(character);
  const recipe = assembler.finish();
  assert.equal(recipe.ingredients.length, 2);
  assert.equal(ingredientLabel(recipe.ingredients[0]), '1.5 cups బియ్యం');
  assert.equal(ingredientLabel(recipe.ingredients[1]), 'to taste Salt');
  assert.deepEqual(recipe.steps[0], { text: 'Cook rice', ingredientIds: ['rice'], time: 600 });
});

test('incomplete output and invented ingredient references are rejected', () => {
  assert.throws(() => createRecipeAssembler().finish(), /incomplete/);
  const assembler = createRecipeAssembler();
  assembler.append('{"type":"ingredients","items":[{"id":"rice","name":"Rice","quantity":1,"unit":"cup"}]}\n');
  assert.throws(() => assembler.append('{"type":"step","text":"Add butter","ingredientIds":["butter"],"timeSeconds":null}\n'), /unknown ingredient/);
});

test('schema-constrained JSON arrays stream even when pretty-printed and quoted text contains braces', () => {
  const updates = [];
  const assembler = createRecipeAssembler(recipe => updates.push(recipe));
  const events = [{ type: 'ingredients', items: [{ id: 'rice', name: 'Rice', quantity: 1, unit: 'cup' }] }, { type: 'step', text: 'Say "ready" {then cook}.', ingredientIds: ['rice'], timeSeconds: null }];
  for (const character of JSON.stringify(events, null, 2)) assembler.append(character);
  assert.equal(assembler.finish().steps[0].text, events[1].text);
  assert.equal(updates.length, 2);
  const interrupted = createRecipeAssembler();
  interrupted.append(JSON.stringify(events).slice(0, -1));
  assert.throws(() => interrupted.finish(), /incomplete/);
});

test('personal guest corrections remain stored separately from generated recipe notes', async () => {
  const { writeLocalCookingNotes, readLocalCookingNotes } = await import('../src/utils/localRecipeNotes.js');
  const entries = new Map();
  const storage = { getItem: key => entries.get(key) || null, setItem: (key, value) => entries.set(key, value) };
  const recipe = { dishName: 'Rice', ingredients: [{ id: 'rice', name: 'Rice', quantity: 1, unit: 'cup' }] };
  assert.equal(writeLocalCookingNotes(recipe, 'Use less water', storage), true);
  assert.equal(readLocalCookingNotes(recipe, storage), 'Use less water');
  assert.equal(readLocalCookingNotes({ ...recipe, ingredients: [{ ...recipe.ingredients[0], quantity: 2 }] }, storage), null);
  assert.equal(writeLocalCookingNotes(recipe, 'Notes', { getItem() { throw new Error(); }, setItem() { throw new Error(); } }), false);
});

test('steps retain their own quantities when an ingredient is split across steps', () => {
  const assembler = createRecipeAssembler();
  assembler.append(JSON.stringify([{ type: 'ingredients', items: [{ id: 'oil', name: 'Oil', quantity: 2, unit: 'tbsp' }] }, { type: 'step', text: 'Heat half the oil.', ingredientIds: ['oil'], ingredientAmounts: [{ ingredientId: 'oil', quantity: 1, unit: 'tbsp' }], timeSeconds: null }]));
  const recipe = assembler.finish();
  assert.equal(recipe.ingredients[0].quantity, 2);
  assert.equal(recipe.steps[0].ingredients[0].quantity, 1);
});
