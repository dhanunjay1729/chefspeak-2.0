import { ingredientLabel } from './recipeData.js';
const storageKey = 'chefspeak.recipeNotes.guest';
const recipeKey = recipe => JSON.stringify([recipe.dishName.trim().toLowerCase(), Array.isArray(recipe.ingredients) ? recipe.ingredients.map(ingredientLabel) : recipe.ingredients]);
const readEntries = storage => {
  try {
    const entries = JSON.parse(storage.getItem(storageKey));
    return Array.isArray(entries) ? entries.filter(entry => entry && typeof entry.key === 'string' && typeof entry.notes === 'string') : [];
  } catch { return []; }
};
export function readLocalCookingNotes(recipe, storage = localStorage) {
  return readEntries(storage).find(entry => entry.key === recipeKey(recipe))?.notes ?? null;
}
export function writeLocalCookingNotes(recipe, notes, storage = localStorage) {
  try {
    const key = recipeKey(recipe);
    const entries = readEntries(storage).filter(entry => entry.key !== key);
    storage.setItem(storageKey, JSON.stringify([...entries, { key, notes }].slice(-20)));
    return true;
  } catch { return false; }
}
