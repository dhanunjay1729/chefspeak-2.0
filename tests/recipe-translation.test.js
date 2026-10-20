import test from 'node:test';
import assert from 'node:assert/strict';
import { recipeTextFields, applyRecipeTextTranslations } from '../shared/recipeTranslation.js';

test('translating a saved recipe preserves amounts, ingredient IDs and timers', () => {
  const original = {
    dishName: 'Rice', language: 'indian_english',
    ingredients: [{ id: 'i1', name: 'rice', quantity: 1, unit: 'cup', optional: false }],
    recipeSteps: [{ text: 'Boil rice for 15 minutes', ingredientIds: ['i1'], time: 900,
      ingredients: [{ id: 'i1', name: 'rice', quantity: 1, unit: 'cup' }] }],
  };
  const fields = recipeTextFields(original);
  const translated = applyRecipeTextTranslations(original, fields,
    ['चावल', 'चावल', 'कप', 'चावल को 15 मिनट उबालें', 'चावल', 'कप'], 'hindi');
  assert.equal(translated.recipeSteps[0].text, 'चावल को 15 मिनट उबालें');
  assert.equal(translated.ingredients[0].name, 'चावल');
  assert.equal(translated.ingredients[0].quantity, 1);
  assert.equal(translated.ingredients[0].id, 'i1');
  assert.equal(translated.recipeSteps[0].time, 900);
  assert.deepEqual(translated.recipeSteps[0].ingredientIds, ['i1']);
  assert.equal(original.recipeSteps[0].text, 'Boil rice for 15 minutes');
  assert.throws(() => applyRecipeTextTranslations(original, fields, ['incomplete'], 'hindi'));
  assert.throws(() => applyRecipeTextTranslations(original, fields,
    ['चावल', 'चावल', 'कप', 'चावल को 20 मिनट उबालें', 'चावल', 'कप'], 'hindi'));
});

test('legacy string ingredients can be translated without changing saved steps', () => {
  const original = { dishName: 'Soup', ingredients: '2 cups water', recipeSteps: [{ text: 'Boil water', time: null }] };
  const fields = recipeTextFields(original);
  const translated = applyRecipeTextTranslations(original, fields, ['सूप', '2 कप पानी', 'पानी उबालें'], 'hindi');
  assert.equal(translated.ingredients, '2 कप पानी');
  assert.equal(translated.recipeSteps[0].time, null);
});
