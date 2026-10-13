export function sanitizeNutrition(data) {
  if (!data || typeof data !== 'object') return null;
  const result = {};
  for (const key of ['calories', 'protein', 'fat', 'carbs']) {
    const value = data[key];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null;
    result[key] = Math.round(value * 10) / 10;
  }
  return result;
}
