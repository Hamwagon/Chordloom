'use strict';
const assert=require('node:assert/strict'),F=require('./fretboard.js'),E=require('./engine.js');
const pc=n=>((n%12)+12)%12;
const unique=ns=>[...new Set(ns)].sort((a,b)=>a-b);
let shapeCount=0,cases=0;
function validate(chord,shape,raw){
 const o=F.options(raw),t=o.tuning,n=t.notes.length;
 assert.equal(shape.frets.length,n);assert.equal(shape.stringNotes.length,n);assert.equal(shape.fingers.length,n);
 const sounding=[];for(let i=0;i<n;i++){
  const f=shape.frets[i],finger=shape.fingers[i];assert(Number.isInteger(f)&&f>=-1&&f<=o.maxFret);
  if(f<0){assert.equal(shape.stringNotes[i],null);assert.equal(finger,-1);}else{const note=t.notes[i]+o.capo+f;assert.equal(shape.stringNotes[i],note);sounding.push(note);assert(f===0?finger===0:finger>=1&&finger<=4);}
 }
 assert.deepEqual(sounding.sort((a,b)=>a-b),shape.notes);assert(sounding.length>0);
 const positives=shape.frets.filter(f=>f>0);if(positives.length)assert(Math.max(...positives)-Math.min(...positives)<o.span);
 assert.equal(pc(sounding[0]),pc(Math.min(...chord.notes)));
 if(o.mode==='exact'){assert.deepEqual(sounding,unique(chord.notes));assert.equal(sounding.length,new Set(sounding).size);}
 else assert.deepEqual(unique(sounding.map(pc)),unique(chord.notes.map(pc)));
 const barres=shape.barres;assert(barres.length<=1);
 for(const b of barres){assert.equal(b.finger,1);assert(b.from<b.to);assert(shape.frets.slice(b.from,b.to+1).every(f=>f===-1||f>=b.fret));assert(shape.frets.filter((f,i)=>i>=b.from&&i<=b.to&&f===b.fret).length>=2);}
 // A reused finger must be explained by a real barre; individual fingers stop exactly one string.
 for(let finger=1;finger<=4;finger++){
  const indices=shape.fingers.map((f,i)=>f===finger?i:-1).filter(i=>i>=0);
  if(indices.length>1){const b=barres.find(b=>b.finger===finger);assert(b);for(const i of indices){assert(i>=b.from&&i<=b.to);assert.equal(shape.frets[i],b.fret);}}
 }
 shapeCount++;
}
const c={label:'C',notes:[48,52,55]},before=JSON.stringify(c),open=F.findShapes(c,{limit:8});
assert.deepEqual(open[0].frets,[-1,3,2,0,1,0]);assert.deepEqual(open[0].fingers,[-1,3,2,0,1,0]);assert.equal(JSON.stringify(c),before);
const exact=F.findShapes(c,{mode:'exact'});assert(exact.length);assert.deepEqual(exact[0].frets,[-1,3,2,0,-1,-1]);
for(const s of exact)validate(c,s,{mode:'exact'});
assert.deepEqual(F.findShapes({notes:[48,50,52,53,55,57,59]},{tuning:'guitar'}),[]);
assert.deepEqual(F.findShapes({notes:[0,4,7]},{mode:'exact'}),[]);
assert.deepEqual(F.findShapes({notes:[]}),[]);
const fbar=F.fingerPlan([1,3,3,2,1,1]);assert(fbar);assert.deepEqual(fbar.barres,[{fret:1,finger:1,from:0,to:5}]);assert.equal(F.fingerPlan([1,3,3,0,1,1]),null,'barre cannot cross open string and five stopped notes need too many fingers');
for(const tuning of F.tunings){
 for(const capo of [0,2,7,12])for(const mode of ['playable','exact']){
  const notes=unique(tuning.notes.map(n=>n+capo));const chord={notes};const raw={tuning:tuning.id,capo,maxFret:0,mode};const shapes=F.findShapes(chord,raw);assert(shapes.length,tuning.id+' all-open chord');for(const shape of shapes)validate(chord,shape,raw);cases++;
 }
}
const defaults={root:0,scale:'major',extension:'3',octave:3,voicing:'close',tempo:100,bars:1,rhythm:'held',gate:.9,velocity:86};
for(const tuning of F.tunings)for(const root of [0,1,5,7,11])for(const scale of ['major','minor','altered','chromatic'])for(const extension of ['3','7','9','13'])for(const mode of ['playable','exact']){
 const chord=E.chord(root%7,{...defaults,root,scale,extension});const raw={tuning:tuning.id,mode,capo:root%3,maxFret:15,span:4,limit:4};for(const shape of F.findShapes(chord,raw))validate(chord,shape,raw);cases++;
}
const settings={...defaults,rhythm:'eighths'},progression=E.progression(settings,[0,4,5,3]),shapes=progression.map(c=>F.findShapes(c)[0]);assert(shapes.every(Boolean));const tab=F.tab(progression,shapes,settings,E);assert(tab.available);assert(tab.text.includes('beat 0'));assert(tab.text.includes('0.5'));assert(tab.text.includes('4. F'));assert(tab.text.includes('octave placements and doublings may differ'));
assert.equal(F.tab(progression,[shapes[0],null,...shapes.slice(2)],settings,E).available,false);
assert(tab.text.indexOf('  e |')<tab.text.indexOf('  E |'),'top tab row is highest string');
const searchStart=Date.now();for(let i=0;i<12;i++){const chord=E.chord(i%7,{...defaults,root:i,extension:'9'});for(const shape of F.findShapes(chord,{tuning:'guitar7',maxFret:24,span:6,capo:12,limit:4}))validate(chord,shape,{tuning:'guitar7',maxFret:24,span:6,capo:12});}const latency=Date.now()-searchStart;assert(latency<5000,'bounded 24-fret search took '+latency+' ms');
console.log('PASS: '+cases+' fretboard configurations, '+shapeCount+' shape invariants, open C reference, exact pitches, capo, barres, reentrant tuning, and rhythm-aware tab; twelve 24-fret searches in '+latency+' ms.');
