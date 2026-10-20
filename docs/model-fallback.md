# Recipe model selection

The Render backend uses `openai/gpt-6-luna` through Vercel AI Gateway by
default for recipes, nutrition, suggestions, recommendations, and saved-recipe
translation. Set `AI_GATEWAY_API_KEY` on Render. The key stays on the backend;
never use a `VITE_` variable for it. The model request has a 45-second timeout
and a bounded output token count. Gateway credits and billing apply to every AI
request in this mode. Google Text-to-Speech is separate and remains unchanged.

```env
AI_PROVIDER=paid
AI_GATEWAY_API_KEY=your_gateway_key
```

Gemini code is retained for future use but disabled by default. To opt back in
on Render, set `AI_PROVIDER=gemini` and `GEMINI_API_KEY`. That mode tries the
configured free Gemini models first. To allow its paid fallback, also set
`AI_PAID_FALLBACK_ENABLED=true` and keep `AI_GATEWAY_API_KEY`. The two legacy
Vercel Gemini handlers require an explicit `AI_PROVIDER=gemini` setting on
Vercel too; the current Vite app uses the Render routes instead.

Recipe SSE events include the model ID for deployment diagnostics. The app
displays the recipe without showing the model ID. Run `npm test` and
`npm run build` after changing provider selection.
