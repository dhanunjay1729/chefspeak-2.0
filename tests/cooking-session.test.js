import test from 'node:test';
import assert from 'node:assert/strict';
import { readCookingSession, writeCookingSession, clearCookingSession, secondsUntil } from '../src/utils/cookingSession.js';
const store = () => {
  const data = new Map();
  return { getItem: key => data.get(key) || null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
};
const session = { path: '/assistant', recipe: { dishName: 'Rice', ingredients: '1 cup rice', recipeSteps: [{ text: 'Boil' }, { text: 'Rest' }] }, currentStepIndex: 1, deadline: 10000, timerOwnerIndex: 0 };

test('cooking survives reload and stays separate for different users', () => {
  const storage = store();
  assert.ok(writeCookingSession('alice', session, storage));
  assert.equal(readCookingSession('alice', storage).currentStepIndex, 1);
  assert.equal(readCookingSession('alice', storage).recipe.ingredients, '1 cup rice');
  assert.equal(readCookingSession('bob', storage), null);
  assert.equal(readCookingSession(null, storage), null);
  clearCookingSession('alice', storage);
  assert.equal(readCookingSession('alice', storage), null);
});

test('invalid progress is clamped and damaged storage is ignored', () => {
  const storage = store();
  writeCookingSession(null, { ...session, currentStepIndex: 99, timerOwnerIndex: 99 }, storage);
  assert.equal(readCookingSession(null, storage).currentStepIndex, 1);
  assert.equal(readCookingSession(null, storage).timerOwnerIndex, null);
  storage.setItem('chefspeak.cooking.guest', '{');
  assert.equal(readCookingSession(null, storage), null);
  assert.equal(writeCookingSession(null, session, { setItem() { throw new Error('Full'); } }), false);
});

test('timers use elapsed wall time rather than number of browser ticks', () => {
  assert.equal(secondsUntil(10000, 1000), 9);
  assert.equal(secondsUntil(10000, 7500), 3);
  assert.equal(secondsUntil(10000, 20000), 0);
  assert.equal(secondsUntil(null), null);
});
