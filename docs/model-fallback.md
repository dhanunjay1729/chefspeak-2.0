# Model fallback

Recipes, nutrition and suggestions try the free Gemini models first. If those
fail, the backend uses `openai/gpt-6-luna` through Vercel AI Gateway.

Set these environment variables on the Render backend:

```env
GEMINI_API_KEY=your_existing_free_tier_key
AI_GATEWAY_API_KEY=your_gateway_key
AI_PAID_FALLBACK_ENABLED=true
```

Never use a `VITE_` variable for either secret. Without the Gateway key and the
activation flag, the backend continues using only Gemini. Gateway requests need
available credits and stop on an exhausted-credit response; they are not retried
against other paid models. Google TTS and its existing Google project budget are
unchanged. Gateway usage is billed separately, with no application monthly cap.

Gemini quota failures pause that model for ten minutes; other failures pause it
for thirty seconds. Each request tries an available free model once before moving
on. The paid request has a 45-second timeout and a bounded output token count.
Failed partial recipes are discarded before a replacement is displayed. Publish
the frontend's stream-reset support with the backend change.
Recipe SSE content events include the model ID for deployment diagnostics; no
credentials are exposed. The app displays the recipe without showing the model ID.

Validation: `npm test`, `node tests/model-fallback.test.js`, and `npm run build`.
The focused tests cover free success without paid calls, quota cooldowns, paid
activation, exhausted Gateway credits, interrupted streams, incomplete paid
responses and invalid nutrition responses.
