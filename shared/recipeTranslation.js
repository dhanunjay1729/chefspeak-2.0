// Translate only displayed text. Recipe IDs, quantities, timers and cooking state
// stay attached to the original recipe.
export function recipeTextFields(recipe) {
  const fields = [];
  const add = (path, value) => {
    if (typeof value === 'string' && value.trim()) fields.push({ path, text: value });
  };

  add(['dishName'], recipe.dishName);
  if (typeof recipe.ingredients === 'string') add(['ingredients'], recipe.ingredients);
  else if (Array.isArray(recipe.ingredients)) {
    recipe.ingredients.forEach((ingredient, index) => {
      if (typeof ingredient === 'string') add(['ingredients', index], ingredient);
      else if (ingredient && typeof ingredient === 'object') {
        add(['ingredients', index, 'name'], ingredient.name);
        add(['ingredients', index, 'unit'], ingredient.unit);
      }
    });
  }
  (recipe.recipeSteps || []).forEach((step, index) => {
    add(['recipeSteps', index, 'text'], step?.text);
    step?.ingredients?.forEach((ingredient, amountIndex) => {
      add(['recipeSteps', index, 'ingredients', amountIndex, 'name'], ingredient.name);
      add(['recipeSteps', index, 'ingredients', amountIndex, 'unit'], ingredient.unit);
    });
  });
  return fields;
}

export function hasMatchingNumbers(source, translation) {
  return JSON.stringify(source.match(/\d+(?:[.,]\d+)*/g) || []) ===
    JSON.stringify(translation.match(/\d+(?:[.,]\d+)*/g) || []);
}

export function applyRecipeTextTranslations(recipe, fields, translations, language) {
  if (!Array.isArray(translations) || translations.length !== fields.length ||
      translations.some((text, index) => typeof text !== 'string' || !text.trim() ||
        !hasMatchingNumbers(fields[index].text, text))) {
    throw new Error('The translated recipe was incomplete');
  }
  const translated = {
    dishName: recipe.dishName,
    ingredients: structuredClone(recipe.ingredients),
    recipeSteps: structuredClone(recipe.recipeSteps),
    language,
  };
  fields.forEach(({ path }, index) => {
    let destination = translated;
    for (const key of path.slice(0, -1)) destination = destination[key];
    destination[path.at(-1)] = translations[index].trim();
  });
  return translated;
}
