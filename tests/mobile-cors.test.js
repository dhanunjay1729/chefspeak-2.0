import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../server/index.js';

test('API preflight accepts Capacitor Android and iOS origins', async () => {
  const server = app.listen(0);
  const url = `http://127.0.0.1:${server.address().port}/health`;

  try {
    for (const origin of ['https://localhost', 'capacitor://localhost']) {
      const response = await fetch(url, {
        method: 'OPTIONS',
        headers: {
          Origin: origin,
          'Access-Control-Request-Method': 'GET',
        },
      });
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('access-control-allow-origin'), origin);
    }

    const rejected = await fetch(url, {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://untrusted.example',
        'Access-Control-Request-Method': 'GET',
      },
    });
    assert.equal(rejected.headers.get('access-control-allow-origin'), null);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
