export function ingredientLabel(ingredient) {
  if (typeof ingredient === 'string') return ingredient;
  return [ingredient.quantity, ingredient.unit, ingredient.name].filter(value => value !== null && value !== undefined && value !== '').join(' ');
}

export function normalizeIngredientList(raw) {
  if (!Array.isArray(raw) || !raw.length) throw new Error('The ingredient list is missing');
  const ids = new Set();
  return raw.map((item, index) => {
    if (!item || typeof item.name !== 'string' || !item.name.trim()) throw new Error('An ingredient is incomplete');
    const id = typeof item.id === 'string' && item.id.trim() ? item.id : `ingredient-${index + 1}`;
    if (ids.has(id)) throw new Error('Ingredient IDs must be unique');
    ids.add(id);
    const quantity = typeof item.quantity === 'string' ? item.quantity.trim() : typeof item.quantity === 'number' && Number.isFinite(item.quantity) && item.quantity >= 0 ? item.quantity : null;
    return { id, name: item.name.trim(), quantity, unit: typeof item.unit === 'string' ? item.unit.trim() : '', optional: item.optional === true };
  });
}

export function createRecipeAssembler(onUpdate) {
  let object = '';
  let depth = 0;
  let inString = false;
  let escaped = false;
  let arrayOpened = false;
  let arrayClosed = false;
  let ingredients = null;
  const steps = [];
  const consume = line => {
    const event = JSON.parse(line);
    if (event.type === 'ingredients') {
      if (ingredients || steps.length) throw new Error('Unexpected ingredient list');
      ingredients = normalizeIngredientList(event.items);
    } else if (event.type === 'step') {
      if (!ingredients || typeof event.text !== 'string' || !event.text.trim()) throw new Error('A cooking step is incomplete');
      if (!Array.isArray(event.ingredientIds) || event.ingredientIds.some(id => !ingredients.some(item => item.id === id))) throw new Error('A step references an unknown ingredient');
      if (event.timeSeconds !== null && event.timeSeconds !== undefined && (typeof event.timeSeconds !== 'number' || !Number.isFinite(event.timeSeconds) || event.timeSeconds <= 0)) throw new Error('A cooking timer is invalid');
      let amounts;
      if (event.ingredientAmounts !== undefined) {
        if (!Array.isArray(event.ingredientAmounts) || event.ingredientAmounts.some(item => !item || !event.ingredientIds.includes(item.ingredientId))) throw new Error('A step references an unknown ingredient amount');
        amounts = event.ingredientAmounts.length ? normalizeIngredientList(event.ingredientAmounts.map(item => ({ ...item, id: item.ingredientId, name: ingredients.find(ingredient => ingredient.id === item.ingredientId).name }))) : [];
      }
      steps.push({ text: event.text.trim(), ingredientIds: [...new Set(event.ingredientIds)], time: event.timeSeconds ?? null, ...(amounts ? { ingredients: amounts } : {}) });
    } else {
      throw new Error('Unexpected recipe content');
    }
    onUpdate?.({ ingredients, steps: [...steps] });
  };
  return {
    append(content) {
      for (const character of content) {
        if (depth === 0) {
          if (/\s/.test(character)) continue;
          if (character === '[' && !arrayOpened && !steps.length && !ingredients) { arrayOpened = true; continue; }
          if (character === ']' && arrayOpened && !arrayClosed) { arrayClosed = true; continue; }
          if (character === ',' && arrayOpened && !arrayClosed) continue;
          if (character !== '{' || arrayClosed) throw new Error('Unexpected recipe content');
          object = '{';
          depth = 1;
          continue;
        }
        object += character;
        if (inString) {
          if (escaped) escaped = false;
          else if (character === '\\') escaped = true;
          else if (character === '"') inString = false;
        } else if (character === '"') inString = true;
        else if (character === '{') depth++;
        else if (character === '}') {
          depth--;
          if (depth === 0) { consume(object); object = ''; }
        }
      }
    },
    finish() {
      if (depth !== 0 || (arrayOpened && !arrayClosed)) throw new Error('The recipe was incomplete. Please try again.');
      if (!ingredients || !steps.length) throw new Error('The recipe was incomplete. Please try again.');
      return { ingredients, steps: [...steps] };
    },
  };
}
