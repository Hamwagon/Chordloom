const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {encodeExport, MAX_EXPORT_BYTES} = require('./android.js');
const tick = () => new Promise(resolve => setImmediate(resolve));

function adapter(bridge) {
  const events = new Map(), documentEvents = new Map();
  const nodes = {status: {textContent: ''}, audioPlayer: {pause() { nodes.pauses++; }}, pauses: 0};
  const document = {
    hidden: false,
    documentElement: {classList: {add() {}}},
    getElementById(id) { return nodes[id]; },
    querySelector() { return null; },
    createElement() { return {append() {}, addEventListener() {}}; },
    addEventListener(name, callback) { documentEvents.set(name, callback); }
  };
  const calls = [];
  const context = vm.createContext({document, Blob, Uint8Array, btoa, queueMicrotask,
    ChordloomAndroid: bridge,
    download(...args) { calls.push(args); },
    stop() { nodes.stops = (nodes.stops || 0) + 1; },
    addEventListener(name, callback) { events.set(name, callback); }
  });
  vm.runInContext(fs.readFileSync(require.resolve('./android.js'), 'utf8'), context);
  return {context, calls, nodes, events, documentEvents, document};
}
(async () => {
  const midi = new Uint8Array([77, 84, 104, 100, 0, 255, 128]);
  assert.deepEqual(Buffer.from(await encodeExport(midi), 'base64'), Buffer.from(midi));
  const padded = new Uint8Array([9, 9, 77, 84, 104, 100, 9]);
  assert.deepEqual(Buffer.from(await encodeExport(padded.subarray(2, 6)), 'base64'), Buffer.from('MThd'));
  const session = JSON.stringify({title: 'F♯ Lydian · ♫', version: 4});
  assert.equal(Buffer.from(await encodeExport(session), 'base64').toString('utf8'), session);
  const wide = Uint8Array.from({length: 100000}, (_, i) => i % 256);
  assert.deepEqual(Buffer.from(await encodeExport(wide.buffer), 'base64'), Buffer.from(wide));
  await assert.rejects(encodeExport(new Uint8Array(MAX_EXPORT_BYTES + 1)), /too large/);
  const fallback = adapter(undefined);
  fallback.context.download('session', 'test.json', 'application/json');
  assert.deepEqual(fallback.calls, [['session', 'test.json', 'application/json']]);
  const saved = [];
  const native = adapter({saveFile(...args) { saved.push(args); }});
  native.context.download(midi, 'notes.mid', 'audio/midi');
  native.context.download('double', 'double.txt', 'text/plain');
  await tick();
  assert.equal(saved.length, 1);
  assert.deepEqual(saved[0].slice(1), ['notes.mid', 'audio/midi']);
  assert.deepEqual(Buffer.from(saved[0][0], 'base64'), Buffer.from(midi));
  native.events.get('chordloom-export')({detail: {success: true, name: 'notes.mid'}});
  assert.equal(native.nodes.status.textContent, 'Saved notes.mid.');
  native.context.download(session, 'session.json', 'application/json');
  await tick();
  assert.equal(saved.length, 2);
  native.events.get('chordloom-export')({detail: {cancelled: true}});
  assert.match(native.nodes.status.textContent, /Save cancelled/);
  native.context.ChordloomAndroid.saveFile = () => { throw Error('Picker unavailable'); };
  native.context.download('tab', 'tab.txt', 'text/plain');
  await tick();
  assert.match(native.nodes.status.textContent, /Picker unavailable/);
  native.events.get('chordloom-pause')();
  assert.equal(native.nodes.stops, 1);
  assert.equal(native.nodes.pauses, 1);
  native.document.hidden = true;
  native.documentEvents.get('visibilitychange')();
  assert.equal(native.nodes.stops, 2);
  console.log('PASS: Android UTF-8/binary export, typed-array slices, large chunks, size limit, browser fallback, native save/cancel/failure, duplicate-save guard and lifecycle pause.');
})().catch(error => { console.error(error); process.exitCode = 1; });
