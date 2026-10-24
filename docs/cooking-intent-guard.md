# Cooking intent guard: evaluation and rollout

ChefSpeak previously sent every nonempty dish name to recipe generation. A structured recipe schema checked the answer's shape, but not whether the request was about food. The new server check asks Jev for a typed `allow`, `clarify`, or `reject` decision before recipe generation. `clarify` and `reject` return HTTP 422; a missing key, timeout, malformed decision, or Gateway failure returns HTTP 503. None of those paths call the recipe model. The check also protects both ingredient suggestion routes.

## Comparison on 24 October 2026

The [76 labeled cases](../tests/fixtures/cooking-intent-cases.mjs) contain 28 valid dish requests, 8 valid pantry lists, 14 ambiguous requests, and 26 unrelated or inedible inputs. They include Indian language dish names, creative foods such as a laptop-shaped cake, prompt injection, and mixed food/nonfood pantry lists. Each model received the same decision criteria through Vercel AI Gateway. Requests ran with concurrency 4; latency is host-to-Gateway wall-clock time, including network. Cost is the Gateway-reported charge for these requests. The plain Luna chat price also reconciles with 13,269 input and 925 output tokens in a repeat run.

| Option | Correct / 76 | Missed nonfood | Blocked valid food | p50 | p95 | Cost / 76 | Approx. cost / 1,000 checks |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Existing shape checks | 36 | 26 | 0 | 0 ms | 0 ms | $0 | $0 |
| Jev 1.14 choice | 75 | 0 | 0 | 382 ms | 1,043 ms | $0.001617 | $0.0213 |
| GPT-6 Luna Decisions | 72 | 0 recipe passes; one reject became clarify | 1 | 449 ms | 617 ms | $0.002209 | $0.0291 |
| GPT-6 Luna chat JSON | 75 | 0 | 0 | 1,296 ms | 2,502 ms | $0.001789* | $0.0235* |

The baseline accepts all 76 because every sample passes its shape check; its only correct decisions are the 36 valid food inputs. All three model methods stopped the 26 nonfood samples from reaching recipe generation in this run. Jev and Luna chat both treated `apple` as a complete food request where the human label asked for clarification. Luna Decisions additionally allowed `dinner`, clarified `write a Python script`, and rejected a valid `eggs, onion, tomato` pantry list.

*Luna chat cost comes from a repeat of the same 76 cases with token usage captured. That repeat again scored 75/76 and measured p50 1,331 ms and p95 1,919 ms. Listed latency is from the original side-by-side run.

Jev is the selected guard because it had no missed nonfood or blocked valid food in this set, matched Luna chat's accuracy, and had a much lower median latency. The added median time for an accepted request was about 0.38 seconds in this run. The guard price is **in addition to** the recipe model's price; avoiding a recipe call on rejected input may offset it. At the observed input mix and prompt length, 100,000 checks would cost about $2.13. Prices and request sizes can change; [Jev](https://vercel.com/ai-gateway/models/jev-1.14.0) is listed at $0.04 per million input tokens, [Luna Decisions](https://vercel.com/ai-gateway/models/gpt-6-luna-decisions) at $0.10 per million input tokens, and [Luna chat](https://vercel.com/ai-gateway/models/gpt-6-luna) at $0.10 input / $0.50 output per million tokens.

One live local HTTP smoke check with the real Gateway returned `422 OUTSIDE_COOKING` for `laptop` in 910 ms and a completed structured `poha` recipe in 9,575 ms. These two end-to-end times are examples, not percentile estimates. All 32 local tests passed, including route tests confirming that reject, clarify, and guard failure never call the recipe model. The frontend production build passed.

## Reproduce

Set `AI_GATEWAY_API_KEY` in the environment and run `node benchmarks/cooking-intent.mjs`. The script reports decisions, mistakes, p50/p95 wall-clock time, and Gateway cost. It sends real paid requests. The backend already uses this key for its default recipe model; the optional Gemini mode now also needs it for the intent check.

This is a small, hand-labeled development set, not a guarantee against every possible prompt. In production, watch the 422 rate and collect user corrections for unusual regional dishes and ingredients before adjusting the rubric or adding thresholds.
