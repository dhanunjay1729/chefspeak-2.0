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

No aggregate billing dashboard or monthly spend cap is added. Savings depend on the number of exact repeated requests, eviction and backend restarts; newly generated text still needs synthesis. Do not infer a savings percentage from the presence of a cache.

## Playback behavior and verification

Both cooking pages use `TTSService`. Each speak/Stop invalidates older asynchronous requests, and media callbacks belong to the current element. Stop or replacement detaches the old audio and releases its object URL. Paused and ended audio remain available for Resume/Restart until discarded. Playback failures are recoverable and stale failures do not overwrite the current state.

`tests/tts-service.test.js` loads the actual service through Vite and uses controlled network/media APIs to verify ordering, Stop, URL ownership, errors and controls. `tests/speech-cache.test.js` checks keys, byte identity, deduplication, eviction, expiry, retry, saturation, all configured voice mappings and the real Express route with Google mocked. Its HTTP test also confirms that repeated cache hits still reach the existing IP limit. Run `npm test` and `npm run build`.

Mocked tests do not validate Google voice availability, pronunciation, actual billing, or browser/device audio policies. Those require real deployment/device checks; this implementation does not claim they have been measured.
