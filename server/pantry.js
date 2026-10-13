const aliases = { onions: 'onion', tomatoes: 'tomato', potatoes: 'potato', eggs: 'egg', carrots: 'carrot', chillies: 'chilli', chilies: 'chilli', chili: 'chilli', 'cooking oil': 'oil', 'vegetable oil': 'oil' };
export function ingredientKey(value) {
  const name = value.toLowerCase().trim().replace(/\s+/g, ' ');
  return aliases[name] || name;
}

export function normalizeSuggestions(raw, available) {
  if (!Array.isArray(raw)) return [];
  const known = new Map(available.map(name => [ingredientKey(name), name]));
  const unique = values => Array.isArray(values) ? [...new Map(values.filter(value => typeof value === 'string' && value.trim()).map(value => [ingredientKey(value), value.trim()])).values()] : [];
  const seen = new Set();
  return raw.flatMap(item => {
    if (!item || typeof item.name !== 'string' || !item.name.trim()) return [];
    const required = unique(item.requiredIngredients);
    if (!required.length || seen.has(item.name.toLowerCase().trim())) return [];
    const usedIngredients = required.filter(name => known.has(ingredientKey(name))).map(name => known.get(ingredientKey(name)));
    if (!usedIngredients.length) return [];
    seen.add(item.name.toLowerCase().trim());
    const missingIngredients = required.filter(name => !known.has(ingredientKey(name)));
    return [{ name: item.name.trim(), estimatedMinutes: Number.isFinite(item.estimatedMinutes) && item.estimatedMinutes > 0 ? Math.round(item.estimatedMinutes) : null, requiredIngredients: required, optionalIngredients: unique(item.optionalIngredients), usedIngredients, missingIngredients }];
  }).sort((a, b) => a.missingIngredients.length - b.missingIngredients.length || b.usedIngredients.length - a.usedIngredients.length).slice(0, 5);
}
