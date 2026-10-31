'use strict';

// Audible reference cases and invariants for the expanded harmony controls.
// Run with: node test-harmony.cjs
const assert = require('node:assert/strict');
const E = require('./engine.js');
const defaults = {
  root: 0, scale: 'major', extension: '7', octave: 3, voicing: 'close',
  preset: 'Open sky', length: 4,
};
const pc = note => ((note % 12) + 12) % 12;
const sortedPCs = notes => notes.map(pc).sort((a, b) => a - b);
let passed = 0, failed = 0, chordCases = 0, variationCases = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('PASS: ' + name); }
  catch (error) { failed++; console.error('FAIL: ' + name + '\n' + error.stack); }
}
function reference(overrides, degree, notes, label, construction) {
  const chord = E.chord(degree, { ...defaults, ...overrides });
  assert.deepEqual(chord.notes, notes);
  assert.equal(chord.label, label);
  if (construction) assert.deepEqual(chord.tones.map(t => t.note), construction);
  return chord;
}

test('all twelve C-major colors have explicit sounding and construction references', () => {
  const cases = [
    ['3', [48, 52, 55], 'C', [48, 52, 55]],
    ['7', [48, 52, 55, 59], 'Cmaj7', [48, 52, 55, 59]],
    ['6', [48, 52, 55, 57], 'C6', [48, 52, 55, 57]],
    ['add9', [48, 50, 52, 55], 'Cadd9', [48, 52, 55, 62]],
    ['69', [48, 50, 52, 55, 57], 'C6/9', [48, 52, 55, 57, 62]],
    ['9', [48, 50, 52, 55, 59], 'Cmaj9', [48, 52, 55, 59, 62]],
    ['11', [48, 50, 52, 53, 55, 59], 'Cmaj11', [48, 52, 55, 59, 62, 65]],
    ['13', [48, 50, 52, 53, 55, 57, 59], 'Cmaj13', [48, 52, 55, 59, 62, 65, 69]],
    ['sus2', [48, 50, 55], 'Csus2', [48, 50, 55]],
    ['sus4', [48, 53, 55], 'Csus4', [48, 53, 55]],
    ['quartal', [48, 53, 59], 'C [0,5,11]', [48, 53, 59]],
    ['fifth', [48, 55], 'C5', [48, 55]],
  ];
  assert(E.colors.length>=cases.length);
  for (const [extension, notes, label, construction] of cases)
    reference({ extension }, 0, notes, label, construction);
  const add9 = E.chord(0, { ...defaults, extension: 'add9' });
  const ninth = E.chord(0, { ...defaults, extension: '9' });
  assert(!add9.notes.some(n => pc(n) === 11), 'add9 must not silently add a seventh');
  assert(ninth.notes.some(n => pc(n) === 11), 'a ninth chord includes its seventh');
});

test('minor, dominant, altered tensions and diminished qualities follow actual intervals', () => {
  reference({ scale: 'minor', extension: '3' }, 0, [48, 51, 55], 'Cm');
  reference({ scale: 'minor' }, 0, [48, 51, 55, 58], 'Cm7');
  reference({ scale: 'minor', extension: '6' }, 0, [48, 51, 55, 56], 'Cm(add♭6)');
  reference({ scale: 'minor', extension: '9' }, 0, [48, 50, 51, 55, 58], 'Cm9');
  reference({ scale: 'minor', extension: '13' }, 0,
    [48, 50, 51, 53, 55, 56, 58], 'Cm7(9,11,♭13)');
  reference({}, 4, [55, 59, 62, 65], 'G7');
  reference({ scale: 'minor' }, 4, [55, 58, 62, 65], 'Gm7');
  reference({ scale: 'harmonic_minor' }, 4, [55, 59, 62, 65], 'G7');
  reference({ scale: 'harmonic_minor' }, 0, [48, 51, 55, 59], 'Cm(maj7)');
  reference({ scale: 'harmonic_minor' }, 6, [59, 62, 65, 68], 'Bdim7');
  reference({}, 6, [59, 62, 65, 69], 'Bm7♭5');
  reference({ scale: 'mixolydian', extension: '13' }, 0,
    [48, 50, 52, 53, 55, 57, 58], 'C13');
  reference({ scale: 'lydian', extension: '11' }, 0,
    [48, 50, 52, 54, 55, 59], 'Cmaj7(9,♯11)');
  reference({ scale: 'phrygian_dom', extension: '9' }, 0,
    [48, 49, 52, 55, 58], 'C7(♭9)');
  reference({ scale: 'locrian', extension: 'fifth' }, 0, [48, 54], 'C(♭5,no3)');
  reference({ scale: 'whole_tone', extension: '3' }, 0, [48, 52, 56], 'Caug');
  reference({ scale: 'lydian', extension: 'sus4' }, 0, [48, 54, 55], 'C [0,6,7]');
});

test('inversions put the construction third or fifth in the actual bass, including extensions', () => {
  reference({ extension: '3', voicing: 'inv1' }, 0, [52, 55, 60], 'C/E');
  reference({ extension: '3', voicing: 'inv2' }, 0, [55, 60, 64], 'C/G');
  reference({ extension: '9', voicing: 'inv1' }, 0, [52, 55, 59, 60, 62], 'Cmaj9/E');
  reference({ extension: '9', voicing: 'inv2' }, 0, [55, 59, 60, 62, 64], 'Cmaj9/G');
  reference({ extension: 'sus2', voicing: 'inv1' }, 0, [50, 55, 60], 'Csus2/D');
  reference({ extension: 'sus4', voicing: 'inv1' }, 0, [53, 55, 60], 'Csus4/F');
  reference({ extension: 'fifth', voicing: 'inv2' }, 0, [55, 60], 'C5/G');
  for (const scale of ['major', 'minor', 'harmonic_minor'])
    for (const extension of ['3', '7', '9', '11', '13'])
      for (const [voicing, constructionIndex] of [['inv1', 1], ['inv2', 2]])
        for (let degree = 0; degree < 7; degree++) {
          const c = E.chord(degree, { ...defaults, scale, extension, voicing });
          assert.equal(pc(c.notes[0]), pc(c.tones[constructionIndex].note));
        }
});

test('drop 2 and drop 3 lower the correct sounding voice from packed close position', () => {
  reference({ voicing: 'drop2' }, 0, [43, 48, 52, 59], 'Cmaj7/G');
  reference({ voicing: 'drop3' }, 0, [40, 48, 55, 59], 'Cmaj7/E');
  // In a packed ninth, the second-highest voice is the fifth, not the written seventh.
  reference({ extension: '9', voicing: 'drop2' }, 0, [43, 48, 50, 52, 59], 'Cmaj9/G');
  reference({ extension: '13', voicing: 'drop2' }, 0,
    [45, 48, 50, 52, 53, 55, 59], 'Cmaj13/A');
  for (const scale of ['major', 'minor', 'harmonic_minor', 'lydian', 'mixolydian'])
    for (const extension of E.colors.map(c => c.id))
      for (let degree = 0; degree < 7; degree++) {
        const s = { ...defaults, scale, extension };
        const close = E.chord(degree, s).notes;
        for (const [voicing, fromTop] of [['drop2', 2], ['drop3', 3]]) {
          if (close.length < fromTop) continue;
          const expected = close.slice();
          expected[expected.length - fromTop] -= 12;
          expected.sort((a, b) => a - b);
          assert.deepEqual(E.chord(degree, { ...s, voicing }).notes, expected,
            `${scale}/${extension}/${degree}/${voicing}`);
        }
      }
  assert.equal(E.voicingSupported('drop3', { ...defaults, extension: 'fifth' }), false);
  const fallback = E.chord(0, { ...defaults, extension: 'fifth', voicing: 'drop3' });
  assert.equal(fallback.voicing, 'close');
  assert.deepEqual(fallback.notes, [48, 55]);
});

test('open, bass, shell and rootless voicings have explicit pitch and omission references', () => {
  reference({ voicing: 'open' }, 0, [48, 55, 64, 71], 'Cmaj7');
  reference({ voicing: 'bass' }, 0, [36, 52, 55, 59], 'Cmaj7');
  const shell = reference({ voicing: 'shell' }, 0, [48, 52, 59], 'Cmaj7(no5)');
  assert.deepEqual(shell.omitted, [5]);
  const extendedShell = reference({ extension: '13', voicing: 'shell' }, 0,
    [48, 52, 59], 'Cmaj13(no5,9,11,13)');
  assert.deepEqual(extendedShell.omitted, [5, 9, 11, 13]);
  reference({ extension: '3', voicing: 'shell' }, 0, [48, 52], 'C(no5)');
  reference({ voicing: 'rootless' }, 0, [52, 55, 59], 'Cmaj7(no1)/E');
  const rootless9 = reference({ extension: '9', voicing: 'rootless' }, 0,
    [52, 59, 62], 'Cmaj9(no1,5)/E');
  assert.deepEqual(rootless9.omitted, [1, 5]);
  const rootless13 = reference({ extension: '13', voicing: 'rootless' }, 0,
    [52, 57, 59, 62], 'Cmaj13(no1,5,11)/E');
  assert.deepEqual(rootless13.omitted, [1, 5, 11]);
  for (const c of [rootless9, rootless13])
    assert(!c.notes.some(n => pc(n) === 0), 'rootless must omit the root pitch class');
});

test('smooth motion keeps the first chord close and reduces ordered semitone travel on a reference route', () => {
  const route = [0, 4, 5, 3];
  const close = E.progression(defaults, route);
  const smooth = E.progression({ ...defaults, voicing: 'smooth' }, route);
  assert.deepEqual(smooth.map(c => c.notes), [
    [48, 52, 55, 59], [50, 53, 55, 59], [48, 52, 55, 57], [48, 52, 53, 57],
  ]);
  const travel = chords => chords.slice(1).reduce((total, c, i) =>
    total + c.notes.reduce((cost, note, voice) => cost + Math.abs(note - chords[i].notes[voice]), 0), 0);
  assert(travel(smooth) < travel(close));
  assert.equal(smooth[1].label, 'G7/D');
  smooth.forEach((c, i) => assert.deepEqual(sortedPCs(c.notes), sortedPCs(close[i].notes)));
});
test('all catalog colors/voicings stay in scale, preserve declared voices and produce valid MIDI pitches', () => {
  assert.equal(E.catalog.length, 70);
  assert.equal(E.voicings.length, 10);
  const selective = new Set(['shell', 'rootless']);
  for (const scale of E.catalog)
    for (const extension of E.colors.map(c => c.id))
      for (const voicing of E.voicings.map(v => v.id))
        for (const root of [0, 5, 11])
          for (const octave of [2, 3, 4]) {
            const s = { ...defaults, scale: scale.id, extension, voicing, root, octave };
            const route = [...scale.notes.keys(), 0];
            const chords = E.progression(s, route);
            for (let i = 0; i < chords.length; i++) {
              const c = chords[i], context = `${scale.id}/${extension}/${voicing}/${root}/${octave}/${i}`;
              assert(c.notes.length > 0, context);
              assert.equal(c.notes.length, new Set(c.notes).size, context);
              assert.deepEqual(c.notes, c.notes.slice().sort((a, b) => a - b), context);
              for (const n of c.notes) {
                assert(Number.isInteger(n) && n >= 0 && n <= 127, context);
                assert(scale.notes.includes(pc(n - root)), context);
              }
              const retained = c.tones.filter(t => !c.omitted.includes(t.step + 1));
              assert.deepEqual(sortedPCs(c.notes), sortedPCs(retained.map(t => t.note)), context);
              if (!selective.has(c.voicing)) {
                assert.deepEqual(c.omitted, [], context);
                assert.equal(c.notes.length, E.colorFor(s).formula.length, context);
              }
              if (c.voicing === 'rootless') assert(!c.notes.some(n => pc(n) === pc(c.rootNote)), context);
              if (pc(c.notes[0]) !== pc(c.rootNote))
                assert(c.label.endsWith('/' + E.names[pc(c.notes[0])]), context);
              if (c.voicing === 'smooth' && i === 0)
                assert.deepEqual(c.notes, E.chord(route[0], { ...s, voicing: 'close' }).notes, context);
              chordCases++;
            }
          }
});

test('custom collections of every supported cardinality retain their own pitch classes', () => {
  for (let count = 3; count <= 12; count++) {
    // Always include 0 and span as much of the octave as possible.
    const notes = Array.from({ length: count }, (_, i) => Math.floor(i * 12 / count));
    for (const extension of E.colors.map(c => c.id))
      for (const voicing of E.voicings.map(v => v.id)) {
        const s = { ...defaults, scale: 'custom', customScale: notes.join(','), root: 11, extension, voicing };
        for (const degree of [-1, 0, count - 1, count, 2 * count + 1]) {
          const c = E.chord(degree, s);
          assert.equal(c.degree, ((degree % count) + count) % count);
          assert(c.notes.length > 0);
          assert.equal(c.notes.length, new Set(c.notes).size);
          for (const n of c.notes) {
            assert(n >= 0 && n <= 127);
            assert(notes.includes(pc(n - s.root)));
          }
          chordCases++;
        }
      }
  }
  const allRoots = { ...defaults, scale: 'custom', customScale: '0,4,7', extension: 'quartal', voicing: 'rootless' };
  assert.equal(E.voicingSupported('rootless', allRoots), false);
  assert.equal(E.chord(0, allRoots).voicing, 'close');
});

test('recipes retain the selected route, repeat to length eight and wrap for custom scales', () => {
  assert.deepEqual(E.recipeDegrees(defaults), [0, 4, 5, 3]);
  assert.deepEqual(E.recipeDegrees({ ...defaults, preset: 'Jazz turn' }), [1, 4, 0, 5]);
  assert.deepEqual(E.recipeDegrees({ ...defaults, preset: 'Fifths cycle', length: 8 }), [0, 3, 6, 2, 5, 1, 4, 0]);
  assert.deepEqual(E.recipeDegrees({ ...defaults, length: 8 }), [0, 4, 5, 3, 0, 4, 5, 3]);
  assert.deepEqual(E.recipeDegrees({ ...defaults, scale: 'custom', customScale: '0,4,7' }), [0, 1, 2, 0]);
  for (const recipe of E.recipes) {
    const route = E.recipeDegrees({ ...defaults, preset: recipe.id, length: 8 });
    assert.deepEqual(route.slice(0, recipe.degrees.length), recipe.degrees);
  }
});

test('variations retain recipe endpoints and locks while diversifying the editable middle', () => {
  for (const preset of E.recipes.map(r => r.id))
    for (const length of [4, 8])
      for (const scale of ['major', 'minor', 'major_pentatonic'])
        for (const randomValue of [0, 0.4, 0.999999]) {
          const s = { ...defaults, preset, length, scale };
          const current = E.recipeDegrees(s);
          const locks = Array.from({ length }, (_, i) => i % 3 === 1);
          const result = E.vary(s, current, locks, () => randomValue);
          assert.equal(result.changed, true);
          assert(result.index > 0 && result.index < length - 1 && !locks[result.index]);
          assert.equal(result.degrees.length, length);
          for (let i = 0; i < length; i++) {
            if (locks[i]) assert.equal(result.degrees[i], current[i]);
            else if (i === 0 || i === length - 1) assert.equal(result.degrees[i], current[i]);
            assert(result.degrees[i] >= 0 && result.degrees[i] < E.getScale(s).length);
          }
          assert.notEqual(result.degrees[result.index], current[result.index]);
          variationCases++;
        }
  const current = [6, 6, 1, 2];
  const result = E.vary(defaults, current, [false, true, false, false], () => 0);
  assert.equal(result.degrees[0], 0, 'recipe entrance is retained');
  assert.equal(result.degrees[3], 3, 'recipe cadence is retained');
  assert.equal(result.degrees[1], 6, 'locked manual degree survives');
  assert.notEqual(result.degrees[2], current[2], 'editable middle actually changes');
  for (const locks of [[true, true, true, true], [false, true, true, false]]) {
    const unchanged = E.vary(defaults, current, locks, () => 0);
    assert.equal(unchanged.changed, false);
    assert.deepEqual(unchanged.degrees, current);
  }
});

test('variation cannot report a change while returning an identical manually edited progression', () => {
  const s = { ...defaults, preset: 'Ascending steps' };
  const current = [0, 3, 2, 3];
  const result = E.vary(s, current, [false, false, true, false], () => 0.4);
  assert.equal(result.changed, true);
  assert.notDeepEqual(result.degrees, current);
  assert.notEqual(result.degrees[1], current[1]);
  assert.equal(result.degrees[2], current[2]);
});

console.log(`${passed} test groups passed; ${failed} failed; ${chordCases} expanded harmony chords and ${variationCases} recipe variations checked.`);
if (failed) process.exitCode = 1;

