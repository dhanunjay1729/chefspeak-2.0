import { createRecipeAssembler } from './recipeData.js';
import process from 'node:process';
import { Buffer } from 'node:buffer';

const FREE_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.6-flash', 'gemini-3.5-flash'];
const PAID_MODEL = 'openai/gpt-6-luna';

function strictSchema(schema) {
  if (Array.isArray(schema)) return schema.map(strictSchema);
  if (!schema || typeof schema !== 'object') return schema;
  const result = Object.fromEntries(Object.entries(schema).map(([key, value]) => [key, strictSchema(value)]));
  if (result.type === 'object') {
    result.additionalProperties = false;
    result.required = Object.keys(result.properties || {});
  }
  return result;
}

export function createModelFallback({ ai, env = process.env, fetchImpl = fetch, now = Date.now, log = console.warn }) {
  const cooldowns = new Map();
  const freeConfig = config => ({ ...config, maxOutputTokens: config.maxOutputTokens || 3500,
    httpOptions: { timeout: 20000, retryOptions: { attempts: 1 } } });
  const failed = (model, error) => {
    const status = Number(error.status || error.code);
    cooldowns.set(model, now() + (status === 429 ? 600000 : 30000));
    log(`[AI] ${model} failed; trying the next available model`);
  };

  async function paid({ contents, config = {} }) {
    // Explicit activation keeps a newly added key from enabling unbudgeted traffic.
    if (env.AI_PAID_FALLBACK_ENABLED !== 'true' || !env.AI_GATEWAY_API_KEY) {
      throw new Error('Free recipe models are unavailable. Paid fallback is not configured.');
    }
    const sourceSchema = config.responseJsonSchema;
    // OpenAI structured outputs require a root object, including for array results.
    const wrap = sourceSchema?.type === 'array';
    const schema = sourceSchema ? strictSchema(wrap ? { type: 'object', properties: { result: sourceSchema } } : sourceSchema) : null;
    const system = `${config.systemInstruction || 'You are ChefSpeak, a helpful culinary assistant.'}${schema ? `\nReturn JSON matching this schema: ${JSON.stringify(schema)}. The result wrapper takes precedence over earlier top-level array instructions.` : ''}`;
    const messages = [{ role: 'system', content: system }, { role: 'user', content: contents }];
    if (Buffer.byteLength(JSON.stringify(messages)) > 24000) throw new Error('Recipe request is too large');
    const response = await fetchImpl('https://ai-gateway.vercel.sh/v1/chat/completions', {
      method: 'POST', signal: AbortSignal.timeout(45000),
      headers: { Authorization: `Bearer ${env.AI_GATEWAY_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: PAID_MODEL, messages, max_tokens: config.maxOutputTokens || 3500,
        stream: false, reasoning: { enabled: false }, providerOptions: { gateway: { only: ['openai'] } },
        ...(schema ? { response_format: { type: 'json_schema', json_schema: { name: 'ChefSpeak', strict: true, schema } } }
          : config.responseMimeType === 'application/json' ? { response_format: { type: 'json_object' } } : {}),
      }),
    });
    if (!response.ok) throw new Error(response.status === 402 ? 'Paid fallback budget or credits exhausted' : 'Paid fallback is temporarily unavailable');
    const body = await response.json();
    const choice = body.choices?.[0];
    if (choice?.finish_reason !== 'stop' || typeof choice.message?.content !== 'string' || !choice.message.content.trim()) {
      throw new Error('Paid fallback returned an incomplete answer');
    }
    const text = wrap ? JSON.stringify(JSON.parse(choice.message.content).result) : choice.message.content;
    return { text };
  }

  return {
    async generate(request, validate = () => true) {
      for (const model of FREE_MODELS) {
        if ((cooldowns.get(model) || 0) > now()) continue;
        try {
          const result = await ai.models.generateContent({ model, ...request, config: freeConfig(request.config || {}) });
          if (!result.text?.trim()) throw new Error('Empty model response');
          if (request.config?.responseMimeType === 'application/json') JSON.parse(result.text);
          if (!validate(result.text)) throw new Error('Unusable model response');
          return result;
        } catch (error) { failed(model, error); }
      }
      const result = await paid(request);
      if (!validate(result.text)) throw new Error('Paid fallback returned unusable content');
      return result;
    },
    async *stream(request) {
      let emitted = false;
      for (const model of FREE_MODELS) {
        if ((cooldowns.get(model) || 0) > now()) continue;
        try {
          const assembler = request.config?.responseJsonSchema ? createRecipeAssembler() : null;
          const stream = await ai.models.generateContentStream({ model, ...request, config: freeConfig(request.config || {}) });
          if (emitted) { yield { reset: true }; emitted = false; }
          let text = '';
          for await (const chunk of stream) {
            if (!chunk.text) continue;
            text += chunk.text;
            if (text.length > 60000) throw new Error('Recipe is too large');
            assembler?.append(chunk.text);
            emitted = true;
            yield { content: chunk.text };
          }
          if (!text.trim()) throw new Error('Empty recipe stream');
          assembler?.finish();
          return;
        } catch (error) { failed(model, error); }
      }
      const result = await paid(request);
      if (request.config?.responseJsonSchema) {
        const assembler = createRecipeAssembler();
        assembler.append(result.text);
        assembler.finish();
      }
      if (emitted) yield { reset: true };
      yield { content: result.text };
    },
  };
}
