// Fretted-instrument arrangements. Frets and diagram string indices follow tuning-array order (including reentrant ukulele).
(function(root){
'use strict';
const tunings=[
{id:'guitar',name:'Guitar · standard',notes:[40,45,50,55,59,64],labels:['E','A','D','G','B','e']},
{id:'dropD',name:'Guitar · Drop D',notes:[38,45,50,55,59,64],labels:['D','A','D','G','B','e']},
{id:'dadgad',name:'Guitar · DADGAD',notes:[38,45,50,55,57,62],labels:['D','A','D','G','A','d']},
{id:'openG',name:'Guitar · Open G',notes:[38,43,50,55,59,62],labels:['D','G','D','G','B','d']},
{id:'guitar7',name:'7-string guitar · standard',notes:[35,40,45,50,55,59,64],labels:['B','E','A','D','G','B','e']},
{id:'bass4',name:'Bass · 4 strings',notes:[28,33,38,43],labels:['E','A','D','G']},
{id:'ukulele',name:'Ukulele · high G',notes:[67,60,64,69],labels:['g','C','E','A']}
];
const pc=n=>((n%12)+12)%12;
const clamp=(value,min,max,fallback)=>Number.isFinite(Number(value))?Math.max(min,Math.min(max,Math.round(Number(value)))):fallback;
function options(raw={}){return {tuning:tunings.find(t=>t.id===(raw.tuning?.id||raw.tuning))||tunings[0],capo:clamp(raw.capo,0,12,0),maxFret:clamp(raw.maxFret,0,24,15),span:clamp(raw.span,1,6,4),mode:raw.mode==='exact'?'exact':'playable',limit:clamp(raw.limit,1,20,4)};}
function fingerPlan(frets){
 const stopped=frets.map((f,i)=>({f,i})).filter(p=>p.f>0).sort((a,b)=>a.f-b.f||a.i-b.i);
 const fingers=frets.map(f=>f<0?-1:0);if(!stopped.length)return {fingers,barres:[]};
 // Use at most one index-finger barre at the lowest stopped fret. It cannot cross an open or lower-fretted string.
 const lowest=stopped[0].f,lowestStrings=stopped.filter(p=>p.f===lowest).map(p=>p.i),from=Math.min(...lowestStrings),to=Math.max(...lowestStrings);
 const barre=lowestStrings.length>=2&&frets.slice(from,to+1).every(f=>f===-1||f>=lowest);
 const singleCost=stopped.length,barreCost=stopped.length-lowestStrings.length+1;
 if(singleCost>4&&(!barre||barreCost>4))return null;
 if(barre&&(barreCost<singleCost||singleCost>4)){
  for(const i of lowestStrings)fingers[i]=1;let finger=2;for(const p of stopped)if(p.f!==lowest)fingers[p.i]=finger++;
  return {fingers,barres:[{fret:lowest,finger:1,from,to}]};
 }
 for(let i=0;i<stopped.length;i++)fingers[stopped[i].i]=i+1;
 return {fingers,barres:[]};
}
function findShapes(chord,raw={}){
 const o=options(raw),target=[...new Set(chord?.notes||[])].sort((a,b)=>a-b);if(!target.length||target.some(n=>!Number.isInteger(n)||n<0||n>127))return [];
 const exact=o.mode==='exact',required=exact?target:[...new Set(target.map(pc))],bass=exact?target[0]:pc(target[0]),strings=o.tuning.notes.map(n=>n+o.capo),nStrings=strings.length;
 if(required.length>nStrings)return [];
 const requiredSet=new Set(required),seen=new Set(),shapes=[],frets=Array(nStrings).fill(-1),notes=Array(nStrings).fill(null),neededMask=(1<<required.length)-1;
 const maskFor=n=>1<<required.indexOf(exact?n:pc(n));
 // Each window is at most six positive frets wide; open strings are considered in every window.
 for(let start=1;start<=Math.max(1,o.maxFret);start++){
  const end=Math.min(o.maxFret,start+o.span-1),choices=strings.map(open=>{const a=[{f:-1,n:null,m:0}];if(requiredSet.has(exact?open:pc(open)))a.push({f:0,n:open,m:maskFor(open)});for(let f=start;f<=end;f++){const n=open+f;if(n<=127&&requiredSet.has(exact?n:pc(n)))a.push({f,n,m:maskFor(n)});}return a;});
  const possible=Array(nStrings+1).fill(0);for(let i=nStrings-1;i>=0;i--)possible[i]=possible[i+1]|choices[i].reduce((mask,p)=>mask|p.m,0);
  function visit(i,mask,sounding,minNote,used){
   if((mask|possible[i])!==neededMask||sounding+nStrings-i<required.length)return;
   if(i===nStrings){if(mask!==neededMask||!sounding||(exact?minNote:pc(minNote))!==bass)return;const key=frets.join(',');if(seen.has(key))return;seen.add(key);const plan=fingerPlan(frets);if(!plan)return;const positives=frets.filter(f=>f>0),low=positives.length?Math.min(...positives):0,high=Math.max(0,...positives),muted=frets.filter(f=>f<0).length;
    const firstSound=frets.findIndex(f=>f>=0),lastSound=frets.length-1-[...frets].reverse().findIndex(f=>f>=0),internalMutes=frets.slice(firstSound,lastSound+1).filter(f=>f<0).length;
    const score=internalMutes*5+high*3+frets.reduce((v,f)=>v+Math.max(0,f),0)*.25+muted*4+(high-low)*.35+plan.barres.length*.5;
    shapes.push({frets:frets.slice(),notes:notes.filter(n=>n!==null).sort((a,b)=>a-b),stringNotes:notes.slice(),...plan,score});return;}
   for(const p of choices[i]){if(exact&&p.n!==null&&used.has(p.n))continue;frets[i]=p.f;notes[i]=p.n;if(p.n!==null)used.add(p.n);visit(i+1,mask|p.m,sounding+(p.n!==null?1:0),p.n===null?minNote:Math.min(minNote,p.n),used);if(p.n!==null)used.delete(p.n);}
  }
  visit(0,0,0,Infinity,new Set());
 }
 return shapes.sort((a,b)=>a.score-b.score||a.frets.join(',').localeCompare(b.frets.join(','))).slice(0,o.limit);
}
function tab(chords,shapes,settings,E,raw={}){
 const o=options(raw);if(!Array.isArray(chords)||!Array.isArray(shapes)||chords.length!==shapes.length||shapes.some(s=>!s))return {available:false,text:'Tab unavailable: choose a valid fingering for every chord. No chords have been silently omitted.'};
 const title='Chordloom tablature · '+o.tuning.name+' · capo '+o.capo+' · '+o.mode+' pitches';
 const mode=o.mode==='exact'?'Matches the voiced MIDI pitches.':'Guitar-friendly arrangement: octave placements and doublings may differ from MIDI/audio.';
 const header=[title,mode,'Frets are relative to capo. Top line is the last tuning string. Each column is a note onset, not an equal time division.','Beat offsets are zero-based within the chord; sustain follows the selected note-length gate. x = muted string.','Tempo '+settings.tempo+' BPM · '+settings.bars+' bar(s) per chord · rhythm '+settings.rhythm+' · gate '+Math.round(Number(settings.gate)*100)+'%.',''];
 if(settings.harmony&&settings.harmony!=='off'&&E.harmonyFor)header.splice(2,0,'Harmony: '+E.harmonyFor(settings).name+' · source '+(settings.harmonySource==='bass'?'bass':'top voice')+' · added-note velocity '+(settings.harmonyLevel??70)+'%. Base chord symbols and added notes are listed separately.');
 const span=Number(settings.bars)*4;
 for(let ci=0;ci<chords.length;ci++){
  const shape=shapes[ci],source={...chords[ci],notes:[...new Set(shape.notes)].sort((a,b)=>a-b)},events=E.events(settings,[source]).filter(e=>e.on),groups=[];
  for(const e of events){let g=groups.at(-1);if(!g||Math.abs(g.beat-e.beat)>1e-7){g={beat:e.beat,notes:[]};groups.push(g);}g.notes.push(e.note);}
  const beatText=b=>Number(b.toFixed(4)).toString(),widths=groups.map(g=>Math.max(4,beatText(g.beat).length+1)),rows=Array.from({length:o.tuning.notes.length},()=>[]);
  for(let gi=0;gi<groups.length;gi++)for(let si=0;si<rows.length;si++){const n=shape.stringNotes?shape.stringNotes[si]:(shape.frets[si]>=0?o.tuning.notes[si]+o.capo+shape.frets[si]:null);const active=n!==null&&groups[gi].notes.includes(n);rows[si].push((active?String(shape.frets[si]):'-').padEnd(widths[gi],'-'));}
  header.push((ci+1)+'. '+(chords[ci].harmonyNotes?.length?'Base '+chords[ci].baseLabel+' + harmony '+chords[ci].harmonyNotes.map(n=>E.names[n%12]+(Math.floor(n/12)-1)).join(', '):chords[ci].label)+' · '+span+' beats · grip '+shape.frets.map(f=>f<0?'x':f).join(' '));
  header.push('beat '+groups.map((g,i)=>beatText(g.beat).padEnd(widths[i],' ')).join(''));
  for(let si=rows.length-1;si>=0;si--)header.push(o.tuning.labels[si].padStart(3)+' |'+rows[si].join('')+'|');
  header.push('LH   '+shape.fingers.map(f=>f<0?'x':f===0?'o':String(f)).join(' ')+' (tuning order)','');
 }
 return {available:true,text:header.join('\n')};
}
const api={tunings,options,fingerPlan,findShapes,tab};if(typeof module!=='undefined')module.exports=api;root.ChordloomFretboard=api;
})(typeof globalThis!=='undefined'?globalThis:this);
