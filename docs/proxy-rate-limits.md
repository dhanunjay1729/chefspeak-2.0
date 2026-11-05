# Rate limits behind a reverse proxy

The API allows 200 requests per IP per 24 hours. With Express's default proxy setting, production requests are attributed to the connecting Render proxy, so unrelated callers can share a bucket. Live verification on 2026-11-06 reproduced `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` in Render logs.

`TRUST_PROXY_HOPS` accepts an integer from 0 to 10. It defaults to 0 for direct connections. Set it to the measured, fixed proxy depth on the deployment. Do not set it to `true`, select the leftmost forwarding address, or derive trust automatically from a caller's headers. Any new CDN or alternative network path requires rechecking this configuration.

For an operational probe, send `X-ChefSpeak-Proxy-Probe: 1` to `GET /health`. The response still contains only `{ "status": "ok" }`, with additional `X-Proxy-Hop-Count` and `X-Proxy-Trust-Hops` response headers. The first counts incoming forwarding entries; the second reports configured trust. No addresses or identifiers are returned or logged. The probe is not an identity or authentication endpoint.

1. Probe the public Render API directly without supplying `X-Forwarded-For` and record the forwarding count. Repeat to check consistency.
2. Repeat with one synthetic `X-Forwarded-For: 192.0.2.123` prefix. The count reveals whether the edge strips or retains the prefix. Never use this supplied prefix to determine trusted depth.
3. Set `TRUST_PROXY_HOPS` to the clean-request count only after checking the direct public path. Restart/redeploy and verify the reported trust value.
4. Send a few invalid `/api/speak` requests (no Google calls) with and without changing synthetic prefixes. The `RateLimit-Remaining` value must decrement in the same bucket. Test two independent client addresses when available; the integration test covers distinct callers behind identical proxy addresses.

The integration test exhausts one caller's 200-request bucket while varying forged prefixes, then verifies a second caller still receives cached audio. It also checks the real health route. Local tests establish behavior for the configured topology; live measurement establishes that topology for this deployment. IP limits still group users on the same public network and reset with process restarts. They are not account quotas or a billing cap.

References: [Express proxy trust](https://expressjs.com/en/guide/behind-proxies/), [express-rate-limit proxy troubleshooting](https://express-rate-limit.mintlify.app/guides/troubleshooting-proxy-issues).
