# Narration reuse

`POST /api/speak` reuses the exact MP3 returned by Google for an identical synthesis request. Voice names still come from `shared/languages.js`; this change does not select cheaper voices, rewrite text, or alter recipe generation.

## Request flow

```text
Current cooking step -> existing IP limiter -> text/language validation
  -> complete Google request -> SHA-256 cache key
     -> completed hit: return the saved MP3 bytes
     -> identical request in flight: await the same synthesis
     -> miss: synthesize once, then retain eligible audio
```

The key includes exact text, resolved language code, voice name, encoding and all other fields in the constructed synthesis request. Whitespace and case changes are distinct. Language aliases that resolve to the same voice can reuse audio. No recipe text or user IDs are stored as cache keys or logged by this handler. Hashes are identifiers, not encryption; the cache contains playable audio.

## Limits and lifetime

The cache lives in one backend process. It retains at most **32 MiB of audio and 256 entries**, evicting the least recently used entries when either limit is reached. Entries expire **24 hours after synthesis completes**, without extending expiry on hits. Expired entries are removed on the next request. Oversized audio is returned to the requester but not retained.

At most **eight distinct syntheses** may be in flight per process. Completed hits and requests joining an existing synthesis remain available when those slots are full. A new distinct request at capacity receives HTTP 503 and `Retry-After: 5`; it does not enter an unbounded queue. Failed/empty synthesis results are not cached, and failed requests release their slot.

Google calls have a **30-second RPC timeout with automatic retries disabled**. Users can retry a failed narration. This avoids a hidden SDK retry chain; it does not guarantee that a timed-out or abandoned call was not billed. Client Stop prevents late playback but does not cancel Google work already started.

Text must be nonempty and fit within Google's [5,000-byte content limit](https://docs.cloud.google.com/text-to-speech/quotas). The check uses UTF-8 bytes, not JavaScript character count, so it also applies correctly to multilingual text. Existing IP rate limiting applies to cache hits as well as misses.

These capacities are conservative initial settings, not measured deployment headroom. The byte cap covers retained audio, not total Node memory, response buffers, or active requests. Restarts and redeploys clear all entries; replicas have separate caches. Replay still requires the server and a network connection. No persistent browser cache or cloud storage service is added.

## Checking behavior and rollback

The response's `X-TTS-Cache` header is `miss`, `hit`, `coalesced`, or `bypass`. Compare repeated exact requests in browser Network tools or an HTTP client. A hit returns identical bytes without another Google call; simultaneous identical misses share one call. `Cache-Control: no-store` keeps this reuse in the application cache rather than relying on an HTTP/browser cache.

Set backend **`TTS_CACHE_ENABLED=false`** and restart/redeploy to bypass completed-result caching. In-flight deduplication, validation, concurrency protection, voices and playback fixes remain active. Remove that setting or set it to `true` and restart to enable caching again. There is no public cache listing or download-by-hash endpoint.

## Measuring usage

The production server writes a `[TTS_USAGE]` JSON report to Render logs once per minute after narration activity. It retains fixed-size process-local counters and latency totals, with no recipe text, IP addresses, user IDs, or per-user records. There is no public metrics endpoint.

| Field | Meaning |
| --- | --- |
| `requests`, `responses`, `response_errors`, `invalid_requests` | Traffic handled by `/api/speak`, after the existing IP limiter and JSON parser. Rejections before the handler, including rate-limit responses, are excluded. |
| `eligible_requests` | Valid inputs entering the audio cache. |
| `cache_hits`, `cache_misses`, `coalesced_requests`, `bypassed_requests` | Completed reuse, newly started work, joining existing work, and new work while completed caching is disabled. Coalesced work can subsequently fail. |
| `provider_attempts`, `provider_successes`, `provider_failures` | SDK synthesis calls and usable-audio outcomes; joined requests are not extra calls. |
| `submitted_characters`, `submitted_utf8_bytes` | Unicode code points and UTF-8 bytes passed to the SDK on provider attempts, including failed attempts. Cache hits and joined requests add no provider characters. |
| `overload_rejections`, `expired_evictions`, `capacity_evictions`, `oversized_results` | Work refused at capacity and reasons audio was removed or not retained. |
| `latency_ms.request`, `latency_ms.provider` | Count, total milliseconds, and maximum elapsed time for handled requests and synthesis work. Mean latency is `total_ms / count`; these are not percentile measurements. |

In **Render → chefspeak-api → Logs**, search for `TTS_USAGE`. Each report is cumulative for its `started_at` process lifetime. Use differences between snapshots from the same process to measure an interval; use the final snapshot per process when combining lifetimes. Do not sum every cumulative log line. Quiet minutes produce no new report. Restart/deploy resets the in-memory counters and cache, while older reports remain subject to Render's log retention.

For example, `cache_hits / eligible_requests` measures the completed-hit fraction for valid handled requests. Compare provider attempts and input counts with Google Cloud usage/billing. Passing characters to the SDK does not prove a request reached Google or was billed; failures/timeouts and provider accounting can differ. No billing dashboard or monthly spend cap is added. Savings depend on actual repeat traffic and cache lifetime.

## Playback behavior and verification

Both cooking pages use `TTSService`. Each speak/Stop invalidates older asynchronous requests, and media callbacks belong to the current element. Stop or replacement detaches the old audio and releases its object URL. Paused and ended audio remain available for Resume/Restart until discarded. Playback failures are recoverable and stale failures do not overwrite the current state.

`tests/tts-service.test.js` loads the actual service through Vite and uses controlled network/media APIs to verify ordering, Stop, URL ownership, errors and controls. `tests/speech-cache.test.js` checks keys, byte identity, deduplication, eviction, expiry, retry, saturation, all configured voice mappings and the real Express route with Google mocked. Its HTTP test also confirms that repeated cache hits still reach the existing IP limit. `tests/speech-metrics.test.js` verifies provider-versus-request counting, Unicode counts, latency, logging recovery, and the absence of narration text from reports. Run `npm test` and `npm run build`.

Mocked tests do not validate Google voice availability, pronunciation, actual billing, or browser/device audio policies. Those require real deployment/device checks; this implementation does not claim they have been measured.
