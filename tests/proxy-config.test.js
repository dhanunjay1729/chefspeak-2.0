import test from 'node:test';
import assert from 'node:assert/strict';
import { proxyHops, proxyProbeHeaders } from '../server/proxyConfig.js';

test('proxy trust requires an explicit bounded integer and defaults to direct connections', () => {
  for (const value of [undefined, null, '', '0']) assert.equal(proxyHops(value), 0);
  assert.equal(proxyHops('3'), 3);
  assert.equal(proxyHops('10'), 10);
  for (const value of ['true', '-1', '1.5', '03', '11', '1 ', 'Infinity']) {
    assert.throws(() => proxyHops(value), /TRUST_PROXY_HOPS/);
  }
});

test('opt-in health probe discloses only counts, never addresses', () => {
  const headers = {};
  const req = { get: name => ({
    'X-ChefSpeak-Proxy-Probe': '1',
    'X-Forwarded-For': '203.0.113.99, 198.51.100.1, 10.0.0.1',
  })[name], app: { get: () => 3 } };
  proxyProbeHeaders(req, { setHeader: (key, value) => { headers[key] = value; } });
  assert.deepEqual(headers, { 'X-Proxy-Hop-Count': 3, 'X-Proxy-Trust-Hops': 3, 'Cache-Control': 'no-store' });
  assert.doesNotMatch(JSON.stringify(headers), /203\.0\.113|198\.51\.100|10\.0\.0/);
  assert.doesNotThrow(() => proxyProbeHeaders({ get: () => undefined }, {}));
});
