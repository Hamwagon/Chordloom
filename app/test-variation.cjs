'use strict';
const assert = require('node:assert/strict');
const E = require('./engine.js');
const defaults = {root:0, scale:'major', extension:'7', octave:3, voicing:'close', preset:'Open sky', length:4, harmony:'off'};
const id = route => route.join(',');
const pc = note => ((note % 12) + 12) % 12;
function quality(route) {
  const counts = new Map();
  let adjacent = 0;
  route.forEach((degree, i) => {
    counts.set(degree, (counts.get(degree) || 0) + 1);
    adjacent += Number(degree === route[(i + 1) % route.length]);
  });
  return [adjacent, [...counts.values()].reduce((sum, count) => sum + count * (count - 1) / 2, 0)];
}
function compare(a,b) {return a[0] - b[0] || a[1] - b[1];}
function enumerate(s, current, locks) {
  const route = E.recipeDegrees(s).map((degree, i) => locks[i] ? current[i] : degree);
  const free = route.map((_,i) => i).filter(i => i > 0 && i < route.length - 1 && !locks[i]);
  const candidates = [];
  const walk = depth => {
    if (depth === free.length) {candidates.push(route.slice()); return;}
    for (let degree = 0; degree < E.getScale(s).length; degree++) {route[free[depth]] = degree; walk(depth + 1);}
  };
  walk(0);
  return candidates;
}

// Exhaustive independent oracles for the spaces that permit exact enumeration.
for (const n of [3,4]) for (const length of [4,8]) for (const lockMiddle of [false,true]) {
  const s = {...defaults, scale:'custom', customScale:Array.from({length:n},(_,i) => i).join(','), length};
  const current = E.recipeDegrees(s), locks = current.map((_,i) => lockMiddle && i === 1);
  const routes = enumerate(s,current,locks).filter(route => id(route) !== id(current));
  const best = routes.map(quality).sort(compare)[0];
  for (const random of [0,.37,.999999]) {
    const result = E.vary(s,current,locks,() => random);
    assert.deepEqual(quality(result.degrees),best,'small spaces must minimize adjacent repeats and repeat pairs');
  }
}

let configurations = 0;
const scaleCases = [
  ...E.catalog.map(scale => ({scale:scale.id})),
  ...Array.from({length:10},(_,i) => ({scale:'custom',customScale:Array.from({length:i+3},(_,n) => n).join(',')})),
];
for (const scale of scaleCases) for (const length of [4,8]) for (const lockMiddle of [false,true]) for (const random of [0,.37,.999999]) {
  const s = {...defaults,...scale,length,root:11}, n = E.getScale(s).length;
  const current = E.recipeDegrees(s).map((degree,i) => i === 1 ? (degree + 1) % n : degree);
  const locks = current.map((_,i) => lockMiddle && i % 3 === 1);
  const copy = current.slice(), lockCopy = locks.slice();
  const result = E.vary(s,current,locks,() => random,[current]);
  assert.equal(result.changed,true);
  assert.notDeepEqual(result.degrees,current);
  assert.deepEqual(current,copy,'must not modify caller progression');
  assert.deepEqual(locks,lockCopy,'must not modify caller locks');
  assert.equal(result.degrees.length,length);
  assert(result.index > 0 && result.index < length - 1 && !locks[result.index]);
  const recipe = E.recipeDegrees(s), fixed = i => i === 0 || i === length - 1 || locks[i];
  let unavoidableAdjacent = 0;
  for (let i = 0; i < length; i++) {
    const degree = result.degrees[i];
    assert(Number.isInteger(degree) && degree >= 0 && degree < n);
    if (locks[i]) assert.equal(degree,current[i]);
    else if (i === 0 || i === length - 1) assert.equal(degree,recipe[i]);
    const next = (i + 1) % length;
    if (fixed(i) && fixed(next) && result.degrees[i] === result.degrees[next]) unavoidableAdjacent++;
  }
  assert.equal(quality(result.degrees)[0],unavoidableAdjacent,'no repeat next to an editable card, including the loop edge');
  for (const chord of E.progression(s,result.degrees)) for (const note of chord.notes) {
    assert(E.getScale(s).includes(pc(note-s.root)),'every generated chord tone must remain in the selected collection');
  }
  configurations++;
}

// Even a constant RNG must visit the fresh alternatives before recycling an older route.
let current = E.recipeDegrees(defaults), history = [current.slice()];
const optimal = enumerate(defaults,current,[]).filter(route => compare(quality(route),[0,0]) === 0);
assert.equal(optimal.length,20);
for (let i = 1; i < optimal.length; i++) {
  const result = E.vary(defaults,current,[],() => 0,history);
  assert.equal(result.reused,false);
  assert(!history.some(route => id(route) === id(result.degrees)),'must avoid recent equally diverse routes');
  assert.deepEqual(quality(result.degrees),[0,0]);
  current = result.degrees; history.push(current.slice());
}
const reused = E.vary(defaults,current,[],() => 0,history);
assert.equal(reused.reused,true,'finite optimal space must report reuse honestly');
assert.deepEqual(reused.degrees,history[0],'after exhaustion choose least recent optimal route');
assert.notDeepEqual(reused.degrees,current);

// Large spaces stay bounded while balancing all seven degrees and avoiding recent loops.
const long = {...defaults,length:8};
current = E.recipeDegrees(long); history = [current.slice()];
const started = Date.now();
for (let i = 0; i < 128; i++) {
  const result = E.vary(long,current,[],() => .5,history);
  assert.deepEqual(quality(result.degrees),[0,1],'eight chords should use all seven degrees with only the necessary repeat');
  assert.equal(new Set(result.degrees).size,7);
  assert.equal(result.reused,false,'large spaces should provide at least128 fresh balanced variations');
  current = result.degrees; history.push(current.slice());
}
const elapsed = Date.now()-started;

for (const locks of [[true,true,true,true],[false,true,true,false]]) {
  const before = [6,6,1,2];
  assert.deepEqual(E.vary(defaults,before,locks,() => 0).degrees,before);
  assert.equal(E.vary(defaults,before,locks,() => 0).changed,false);
}
const manual = [0,3,2,3], locked = [false,false,true,false];
const result = E.vary({...defaults,preset:'Ascending steps'},manual,locked,() => .4);
assert.equal(result.changed,true);
assert.notDeepEqual(result.degrees,manual);
assert.equal(result.degrees[2],manual[2]);
assert.notEqual(result.degrees[1],manual[1]);
for (const random of [1,NaN]) {
  const boundary = E.vary(defaults,E.recipeDegrees(defaults),[],() => random);
  assert.equal(boundary.degrees.length,4);
  assert(boundary.degrees.every(degree => Number.isInteger(degree) && degree >= 0 && degree < 7),'RNG boundaries must not produce undefined degrees');
}
const stringHistory = [id(E.recipeDegrees(defaults))];
const next = E.vary(defaults,E.recipeDegrees(defaults),[],() => .5,stringHistory);
assert.equal(next.reused,false);
assert.deepEqual(stringHistory,[id(E.recipeDegrees(defaults))],'must not mutate supplied history');
console.log(`PASS: ${configurations} named/custom scale, length, lock and RNG combinations; independent optimality oracles; finite-space exhaustion;128 fresh balanced eight-chord variations in ${elapsed} ms; recipe anchors, locked notes and scale membership.`);
