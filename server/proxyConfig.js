// Opt in only after measuring the deployment's fixed proxy path. Never trust
// every supplied address: clients can prepend arbitrary X-Forwarded-For values.
export function proxyHops(value) {
  if (value == null || value === '') return 0;
  if (!/^(0|[1-9]\d?)$/.test(value) || Number(value) > 10) {
    throw new Error('TRUST_PROXY_HOPS must be an integer between 0 and 10');
  }
  return Number(value);
}

export function proxyProbeHeaders(req, res) {
  if (req.get('X-ChefSpeak-Proxy-Probe') !== '1') return;
  const forwarded = req.get('X-Forwarded-For');
  // Counts only; never expose client/proxy addresses or stable identifiers.
  res.setHeader('X-Proxy-Hop-Count', forwarded ? forwarded.split(',').filter(x => x.trim()).length : 0);
  res.setHeader('X-Proxy-Trust-Hops', req.app.get('trust proxy'));
  res.setHeader('Cache-Control', 'no-store');
}
