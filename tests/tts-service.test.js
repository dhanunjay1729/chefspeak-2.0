import test, { after, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

// Load the production service through its real JSX/Vite dependency graph.
const vite = await createServer({
  configFile: false, envFile: false, appType: 'custom',
  resolve: { alias: { '@': new URL('../src', import.meta.url).pathname } },
  optimizeDeps: { noDiscovery: true },
  server: { middlewareMode: true, hmr: false, watch: null },
});
const { TTSService } = await vite.ssrLoadModule('/src/services/ttsService.js');
const { toast } = await vite.ssrLoadModule('/src/contexts/ToastContext.jsx');
const originalAudio = globalThis.Audio;
after(async () => {
  mock.restoreAll();
  if (originalAudio === undefined) delete globalThis.Audio;
  else globalThis.Audio = originalAudio;
  await vite.close();
});

let audios, errors, created, revoked;
class FakeAudio {
  constructor(src) {
    this.src = src;
    this.currentTime = 0;
    this.duration = 120;
    this.listeners = new Map();
    this.paused = true;
    audios.push(this);
  }
  addEventListener(type, callback) {
    const handlers = this.listeners.get(type) || new Set();
    handlers.add(callback);
    this.listeners.set(type, handlers);
  }
  removeEventListener(type, callback) { this.listeners.get(type)?.delete(callback); }
  emit(type) { for (const callback of this.listeners.get(type) || []) callback(); }
  async play() { this.paused = false; this.emit('play'); }
  pause() { this.paused = true; this.emit('pause'); }
  removeAttribute(name) { if (name === 'src') this.src = ''; }
  load() {}
}
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const response = () => ({ ok: true, blob: async () => new Blob(['mp3']) });
beforeEach(() => {
  mock.restoreAll();
  audios = []; errors = []; created = []; revoked = [];
  globalThis.Audio = FakeAudio;
  mock.method(globalThis, 'fetch', async () => response());
  mock.method(URL, 'createObjectURL', () => {
    const url = `blob:test-${created.length}`;
    created.push(url);
    return url;
  });
  mock.method(URL, 'revokeObjectURL', url => revoked.push(url));
  mock.method(toast, 'error', message => errors.push(message));
  mock.method(console, 'error', () => {});
});

test('a newer request wins when narration responses arrive out of order', async () => {
  const first = deferred(), second = deferred();
  globalThis.fetch.mock.mockImplementationOnce(() => first.promise);
  globalThis.fetch.mock.mockImplementationOnce(() => second.promise);
  const service = new TTSService();
  const oldSpeech = service.speak('Old step', 'hindi');
  const newSpeech = service.speak('New step', 'telugu');
  second.resolve(response());
  await newSpeech;
  first.resolve(response());
  await oldSpeech;
  assert.equal(audios.length, 1);
  assert.equal(service.currentAudio, audios[0]);
  assert.equal(service.isPlaying, true);
  assert.deepEqual(errors, []);
  const options = globalThis.fetch.mock.calls[1].arguments[1];
  assert.deepEqual(JSON.parse(options.body), { text: 'New step', language: 'telugu' });
});

test('Stop invalidates pending fetch and pending blob decoding', async () => {
  for (const stage of ['fetch', 'blob']) {
    const pending = deferred();
    globalThis.fetch.mock.mockImplementationOnce(() => stage === 'fetch'
      ? pending.promise : Promise.resolve({ ok: true, blob: () => pending.promise }));
    const service = new TTSService();
    const speech = service.speak('Step');
    await Promise.resolve();
    service.stop();
    pending.resolve(stage === 'fetch' ? response() : new Blob(['mp3']));
    await speech;
    assert.equal(service.currentAudio, null);
    assert.equal(service.isPlaying, false);
  }
  assert.equal(audios.length, 0);
  assert.equal(created.length, 0);
});

test('stale failures and media events cannot overwrite the current playback state', async () => {
  const failed = deferred();
  globalThis.fetch.mock.mockImplementationOnce(() => failed.promise);
  const service = new TTSService();
  const stale = service.speak('Old request');
  await service.speak('Current request');
  failed.reject(new Error('Old network error'));
  await stale;
  assert.deepEqual(errors, []);
  const oldAudio = service.currentAudio;
  await service.speak('Next request');
  oldAudio.emit('pause');
  oldAudio.emit('ended');
  assert.equal(service.isPlaying, true);
  assert.equal(service.currentAudio, audios[1]);
});

test('pause, resume, seek, rate and ended-then-restart keep using the current element', async () => {
  const service = new TTSService();
  const progress = [];
  service.onProgressChange = value => progress.push(value);
  service.setPlaybackRate(1.5);
  await service.speak('Step');
  const audio = service.currentAudio;
  assert.equal(audio.playbackRate, 1.5);
  service.pause();
  assert.equal(service.isPlaying, false);
  await service.resume();
  service.seek(50);
  audio.emit('timeupdate');
  assert.equal(audio.currentTime, 60);
  assert.equal(progress.at(-1), 50);
  service.setPlaybackRate(0.75);
  assert.equal(audio.playbackRate, 0.75);
  audio.emit('ended');
  service.seek(0);
  await service.resume();
  assert.equal(service.currentAudio, audio);
  assert.equal(service.isPlaying, true);
  assert.equal(globalThis.fetch.mock.callCount(), 1);
  assert.deepEqual(errors, []);
});

test('current fetch and play/resume failures show recoverable errors', async () => {
  const service = new TTSService();
  globalThis.fetch.mock.mockImplementationOnce(async () => ({ ok: false }));
  await service.speak('Step');
  assert.equal(errors.length, 1);
  await service.speak('Step');
  service.pause();
  service.currentAudio.play = async () => { throw new Error('Playback blocked'); };
  await service.resume();
  assert.equal(errors.length, 2);
  assert.equal(service.isPlaying, false);
  service.currentAudio.play = FakeAudio.prototype.play;
  await service.resume();
  assert.equal(service.isPlaying, true);
});

test('a play promise that settles after Stop cannot restart obsolete audio', async () => {
  const pending = deferred();
  const originalPlay = FakeAudio.prototype.play;
  mock.method(FakeAudio.prototype, 'play', async function () {
    await pending.promise;
    return originalPlay.call(this);
  });
  const service = new TTSService();
  const speech = service.speak('Step');
  while (audios.length === 0) await Promise.resolve();
  service.stop();
  pending.resolve();
  await speech;
  assert.equal(audios[0].paused, true);
  assert.equal(service.isPlaying, false);
});

test('replacement and repeated Stop release each discarded URL exactly once', async () => {
  const service = new TTSService();
  await service.speak('First');
  const first = service.currentAudio;
  await service.speak('Second');
  assert.deepEqual(revoked, [created[0]]);
  assert.equal(first.src, '');
  const second = service.currentAudio;
  service.stop();
  service.stop();
  first.emit('ended');
  second.emit('ended');
  assert.deepEqual(revoked, created);
  assert.equal(second.src, '');
  assert.equal(service.currentAudio, null);
});

test('pause and ended-then-restart retain the active URL until Stop', async () => {
  const service = new TTSService();
  await service.speak('Step');
  service.pause();
  assert.deepEqual(revoked, []);
  await service.resume();
  service.currentAudio.emit('ended');
  assert.deepEqual(revoked, []);
  service.seek(0);
  await service.resume();
  assert.equal(globalThis.fetch.mock.callCount(), 1);
  assert.equal(created.length, 1);
  service.stop();
  assert.deepEqual(revoked, created);
});

test('an Audio construction failure releases the URL and allows a later retry', async () => {
  globalThis.Audio = class { constructor() { throw new Error('Audio unavailable'); } };
  const service = new TTSService();
  await service.speak('Step');
  assert.deepEqual(revoked, created);
  assert.equal(service.currentAudio, null);
  assert.equal(errors.length, 1);
  globalThis.Audio = FakeAudio;
  await service.speak('Step');
  assert.equal(service.isPlaying, true);
  service.stop();
  assert.deepEqual(revoked, created);
});
