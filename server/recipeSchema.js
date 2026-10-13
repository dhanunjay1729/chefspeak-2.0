const ingredient = {
  type: 'object',
  properties: {
    id: { type: 'string' }, name: { type: 'string' },
    quantity: { anyOf: [{ type: 'number', minimum: 0 }, { type: 'string' }, { type: 'null' }] },
    unit: { type: 'string' }, optional: { type: 'boolean' },
  },
  required: ['id', 'name', 'quantity', 'unit', 'optional'],
};
export const recipeSchema = {
  type: 'array', minItems: 2,
  items: {
    anyOf: [
      { type: 'object', properties: { type: { type: 'string', enum: ['ingredients'] }, items: { type: 'array', minItems: 1, items: ingredient } }, required: ['type', 'items'] },
      { type: 'object', properties: { type: { type: 'string', enum: ['step'] }, text: { type: 'string' }, ingredientIds: { type: 'array', items: { type: 'string' } }, ingredientAmounts: { type: 'array', items: { type: 'object', properties: { ingredientId: { type: 'string' }, quantity: ingredient.properties.quantity, unit: { type: 'string' } }, required: ['ingredientId', 'quantity', 'unit'] } }, timeSeconds: { anyOf: [{ type: 'integer', minimum: 1 }, { type: 'null' }] } }, required: ['type', 'text', 'ingredientIds', 'ingredientAmounts', 'timeSeconds'] },
    ],
  },
};
