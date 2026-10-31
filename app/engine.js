(function(root){
'use strict';
const catalog=typeof module!=='undefined'?require('./scales.js'):root.ChordloomScales;
const H=typeof module!=='undefined'?require('./harmony.js'):root.ChordloomHarmony;
const names=['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
const scales=Object.fromEntries(catalog.map(s=>[s.id,s.notes]));
const recipes=H.recipes,colors=H.colors,voicings=H.voicings,rhythms=H.rhythms,harmonies=H.harmonies;
const harmonyFor=s=>harmonies.find(h=>h.id===s.harmony)||harmonies[0];
const rhythmFor=s=>rhythms.find(r=>r.id===s.rhythm)||rhythms[0];
const presets=Object.fromEntries(recipes.map(r=>[r.id,r.degrees]));
const mod=(n,m)=>((n%m)+m)%m;
const colorFor=s=>colors.find(c=>c.id===String(s.extension))||colors[0];
const voicingFor=s=>voicings.find(v=>v.id===s.voicing)||voicings[0];
const recipeFor=s=>recipes.find(r=>r.id===s.preset)||recipes[0];
function parseCustom(text){const parts=String(text??'').trim().split(/[ ,;]+/);if(parts.some(v=>!/^\d+$/.test(v)))throw Error('Enter whole semitones separated by commas, for example 0,2,3,5,7,9,10.');const notes=parts.map(Number);if(notes.length<3||notes.length>12||notes[0]!==0||notes.some((n,i)=>n>11||(i>0&&n<=notes[i-1])))throw Error('Use 3–12 ascending, unique semitones from 0 to 11, starting with 0.');return notes;}
function getScale(s){return s.scale==='custom'?parseCustom(s.customScale):(scales[s.scale]||scales.major);}
function scaleName(s){return s.scale==='custom'?'Custom scale':catalog.find(c=>c.id===s.scale)?.name||'Major';}
function normalizeVoicing(input){const notes=[];for(let n of [...input].sort((a,b)=>a-b)){while(notes.includes(n))n+=12;notes.push(n);}notes.sort((a,b)=>a-b);while(notes.at(-1)>127)for(let i=0;i<notes.length;i++)notes[i]-=12;while(notes[0]<0)for(let i=0;i<notes.length;i++)notes[i]+=12;return notes;}
function buildTones(degree,s){const scale=getScale(s),d=mod(degree,scale.length),base=12*(Number(s.octave)+1)+Number(s.root);return colorFor(s).formula.map(step=>({step,note:base+scale[(d+step)%scale.length]+12*Math.floor((d+step)/scale.length)}));}
function chordLabel(notes,formula){
const intervals=notes.map(n=>n-notes[0]),labels={'0,4,7':'','0,3,7':'m','0,3,6':'dim','0,4,8':'aug','0,2,7':'sus2','0,5,7':'sus4','0,7':'5','0,6':'(♭5,no3)','0,8':'(♯5,no3)','0,4,7,11':'maj7','0,4,7,10':'7','0,3,7,10':'m7','0,3,7,11':'m(maj7)','0,3,6,10':'m7♭5','0,3,6,9':'dim7','0,4,8,11':'maj7♯5','0,4,8,10':'7♯5','0,4,6,10':'7♭5','0,5,7,10':'7sus4','0,4,7,9':'6','0,3,7,9':'m6','0,4,7,14':'add9','0,3,7,14':'madd9','0,4,7,9,14':'6/9','0,3,7,9,14':'m6/9','0,2,4,7':'add2','0,2,3,7':'m(add2)','0,4,5,7':'add4','0,3,5,7':'m(add4)','0,2,7,11':'maj7sus2','0,2,7,10':'7sus2','0,5,7,11':'maj7sus4','0,5,7,11,14':'maj9sus4','0,5,7,10,14':'9sus4','0,4,11':'maj7(no5)','0,4,10':'7(no5)','0,3,10':'m7(no5)','0,3,11':'m(maj7,no5)','0,4,11,14':'maj9(no5)','0,4,10,14':'9(no5)','0,3,10,14':'m9(no5)','0,3,11,14':'m(maj9,no5)','0,7,14':'5(add9)'};
const rootName=names[mod(notes[0],12)],key=intervals.join(',');if(Object.hasOwn(labels,key))return rootName+labels[key];
const roles=formula||[0,2,4,6,8,10,12].slice(0,notes.length),at=role=>intervals[roles.indexOf(role)];
const triad=[0,at(2),at(4)].join(','),quality=labels[triad];
if(quality!==undefined&&roles.includes(2)&&roles.includes(4)){
  if(!roles.includes(6)){
    const extras=roles.filter(r=>![0,2,4].includes(r)),namesOf=[];
    const degreeName=(r,expected)=>{const delta=at(r)-expected;return delta===0?String(r+1):delta===-1?'♭'+(r+1):delta===1?'♯'+(r+1):null;};
    for(const r of extras){const name=degreeName(r,({1:2,3:5,5:9,8:14,10:17,12:21}[r]??0));if(!name)return rootName+' ['+key+']';namesOf.push(name);}
    return rootName+quality+'(add'+namesOf.join(',')+')';
  }
  const seventhKey=[0,at(2),at(4),at(6)].join(','),seventh=labels[seventhKey];
  if(seventh!==undefined){const extras=roles.filter(r=>r>6),tensions=[];for(const r of extras){const expected={8:14,10:17,12:21}[r],delta=at(r)-expected;if(expected===undefined||Math.abs(delta)>1)return rootName+' ['+key+']';tensions.push((delta===-1?'♭':delta===1?'♯':'')+(r+1));}
    if(extras.length&&extras.every(r=>at(r)==={8:14,10:17,12:21}[r])&&/^(maj7|7|m7|m7♭5|maj7♯5|7♯5|7♭5)$/.test(seventh)){const top=extras.at(-1),missing=[8,10].filter(r=>r<top&&!roles.includes(r)).map(r=>r+1);return rootName+seventh.replace('7',String(top+1))+(missing.length?'(no'+missing.join(',')+')':'');}
    return rootName+seventh+(tensions.length?'('+tensions.join(',')+')':'');
  }
}
return rootName+' ['+key+']';
}
function packed(tones,rootNote,bassNote=rootNote){return normalizeVoicing(tones.map(t=>bassNote+mod(t.note-bassNote,12)));}
function voicingSupported(id,s){const tones=buildTones(0,s),v=voicings.find(v=>v.id===id);return !!v&&tones.length>=(v.minNotes||2)&&(id!=='rootless'||tones.some(t=>mod(t.note-tones[0].note,12)!==0));}
// Transpose by positions of the selected collection, including negative octaves.
function scaleTranspose(note,steps,s){const scale=getScale(s),relative=note-Number(s.root),index=scale.indexOf(mod(relative,12));if(index<0)throw Error('Harmony source is outside the selected scale.');const target=Math.floor(relative/12)*scale.length+index+steps;return Number(s.root)+scale[mod(target,scale.length)]+12*Math.floor(target/scale.length);}
function addHarmony(chord,s){const h=harmonyFor(s),baseNotes=chord.notes.slice(),source=s.harmonySource==='bass'?baseNotes[0]:baseNotes.at(-1),requested=[...(h.steps||[]).map(step=>scaleTranspose(source,step,s)),...(h.octaves||[]).map(o=>source+o*12)],skipped=requested.filter(n=>n<0||n>127),harmonyNotes=[...new Set(requested.filter(n=>n>=0&&n<=127&&!baseNotes.includes(n)))].sort((a,b)=>a-b),notes=[...baseNotes,...harmonyNotes].sort((a,b)=>a-b);let label=chord.label;
if(harmonyNotes.length){label=label.replace(/\/(?:C|C♯|D|E♭|E|F|F♯|G|A♭|A|B♭|B)$/u,'');if(mod(notes[0],12)!==mod(chord.rootNote,12))label+='/'+names[mod(notes[0],12)];}
return {...chord,label,baseLabel:chord.label,notes,baseNotes,harmonyNotes,harmonySourceNote:source,harmonySkipped:skipped,harmonyDuplicates:requested.length-skipped.length-harmonyNotes.length};}
function chord(degree,s,previous=[]){
const scale=getScale(s),normalized=mod(degree,scale.length),tones=buildTones(normalized,s),rootNote=tones[0].note;
const voicing=voicingSupported(s.voicing,s)?voicingFor(s).id:'close';let selected=tones;
if(voicing==='shell'){const wanted=[0,tones.some(t=>t.step===2)?2:tones[1].step,6];selected=tones.filter(t=>wanted.includes(t.step));}
if(voicing==='rootless'){selected=tones.filter(t=>mod(t.note-rootNote,12)!==0);if(colorFor(s).formula.includes(6)&&tones.length>4)selected=selected.filter(t=>![4,10].includes(t.step));if(!selected.length)selected=tones.filter(t=>mod(t.note-rootNote,12)!==0);}
let notes=voicing==='rootless'?packed(selected,rootNote,rootNote+mod(selected[0].note-rootNote,12)):packed(selected,rootNote);
if(voicing==='inv1'||voicing==='inv2'){const target=tones[Math.min(voicing==='inv1'?1:2,tones.length-1)].note;notes=packed(selected,rootNote,rootNote+mod(target-rootNote,12));}
if(voicing==='open')notes=normalizeVoicing(notes.map((n,i)=>n+(i>0&&i%2===1?12:0)));
if(voicing==='bass'){const rootIndex=notes.findIndex(n=>mod(n-rootNote,12)===0);if(rootIndex>=0)notes[rootIndex]-=12;notes=normalizeVoicing(notes);}
if(voicing==='drop2'&&notes.length>=2){notes[notes.length-2]-=12;notes=normalizeVoicing(notes);}
if(voicing==='drop3'&&notes.length>=3){notes[notes.length-3]-=12;notes=normalizeVoicing(notes);}
if(voicing==='smooth'&&previous.length){let best=notes,score=Infinity;
for(let inv=0;inv<notes.length;inv++)for(let shift=-24;shift<=24;shift+=12){const candidate=normalizeVoicing(notes.map((n,i)=>n+(i<inv?12:0)+shift));const cost=candidate.reduce((v,n,i)=>v+Math.abs(n-previous[Math.min(i,previous.length-1)]),0);if(cost<score&&candidate[0]>=0&&candidate.at(-1)<=127){best=candidate;score=cost;}}notes=best;}
const omitted=tones.filter(t=>!selected.includes(t)).map(t=>t.step+1);let label=chordLabel(tones.map(t=>t.note),tones.map(t=>t.step));if(omitted.length)label+='(no'+omitted.join(',')+')';if(mod(notes[0],12)!==mod(rootNote,12))label+='/'+names[mod(notes[0],12)];
return addHarmony({degree:normalized,label,notes,rootNote,tones:tones.map(t=>({step:t.step,note:t.note})),omitted,voicing},s);
}
function roman(degree,s){const numerals=['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'],d=mod(degree,getScale(s).length),t=buildTones(d,{...s,extension:'3'}).map(t=>t.note),third=t[1]-t[0],fifth=t[2]-t[0];return (third===3?numerals[d].toLowerCase():numerals[d])+(third===3&&fifth===6?'°':third===4&&fifth===8?'+':'');}
function recipeDegrees(s){const r=recipeFor(s),count=Number(s.length)||4,n=getScale(s).length;return Array.from({length:count},(_,i)=>mod(r.degrees[i%r.degrees.length],n));}
function vary(s,current,locks=[],rng=Math.random,recentHistory=[]){
// Keep the recipe's entrance/cadence and explicit locks; regenerate the editable middle.
// A bounded search avoids favoring a small functional group or repeatedly changing one card.
const base=recipeDegrees(s).map((d,i)=>locks[i]?current[i]??d:d),n=getScale(s).length;
const eligible=base.map((_,i)=>i).filter(i=>i>0&&i<base.length-1&&!locks[i]);
if(!eligible.length)return {degrees:current.slice(),changed:false,indices:[],reused:false};
const random=()=>{const value=Number(rng());return Number.isFinite(value)?Math.max(0,Math.min(1-Number.EPSILON,value)):0.5;};
const key=values=>values.join(','),recent=new Map();
for(const [i,route] of recentHistory.entries()){
  if(Array.isArray(route)&&route.length===base.length)recent.set(key(route),i);
  else if(typeof route==='string')recent.set(route,i);
}
const candidates=new Map();
const add=route=>{if(eligible.every(i=>route[i]===current[i]))return;const id=key(route);if(!candidates.has(id))candidates.set(id,route.slice());};
const space=Math.pow(n,eligible.length);
if(space<=4096){
  const visit=depth=>{if(depth===eligible.length){add(base);return;}const index=eligible[depth];for(let d=0;d<n;d++){base[index]=d;visit(depth+1);}};
  visit(0);
}else{
  // Fixed tones count before filling the middle, so common anchored/locked roots aren't overused.
  // The trial salt diversifies candidates even with a constant/adversarial RNG.
  const fixed=new Set(base.map((_,i)=>i).filter(i=>!eligible.includes(i)));
  for(let trial=0;trial<384;trial++){
    const route=base.slice(),counts=Array(n).fill(0);for(const i of fixed)counts[route[i]]++;
    let salt=(Math.floor(random()*0x100000000)^(Math.imul(trial+1,0x9e3779b9)))>>>0;
    const draw=limit=>{salt^=salt<<13;salt^=salt>>>17;salt^=salt<<5;return (salt>>>0)%limit;};
    for(const index of eligible){
      let options=Array.from({length:n},(_,i)=>i).filter(d=>d!==route[index-1]&&(!fixed.has(index+1)||d!==route[index+1]));
      if(trial%4!==3){const least=Math.min(...options.map(d=>counts[d]));options=options.filter(d=>counts[d]===least);}
      const degree=options[draw(options.length)];route[index]=degree;counts[degree]++;
    }
    add(route);
  }
  // Always include one-position alternatives: a pathological RNG or a small candidate pool
  // must never make Generate variation claim no change when a free degree can change.
  for(const index of eligible)for(let d=0;d<n;d++){const route=base.slice();route[index]=d;add(route);}
}
const quality=route=>{
  const counts=Array(n).fill(0);for(const d of route)counts[d]++;
  let adjacent=0;for(let i=0;i<route.length;i++)if(route[i]===route[(i+1)%route.length])adjacent++;
  const repeats=counts.reduce((sum,count)=>sum+count*(count-1)/2,0),lastSeen=recent.get(key(route));
  // Reuse the least recent route only after the equally varied fresh choices are exhausted.
  const unchanged=eligible.reduce((sum,i)=>sum+Number(route[i]===current[i]),0);
  return [adjacent,repeats,lastSeen===undefined?0:1,lastSeen??0,unchanged];
};
const compare=(a,b)=>{for(let i=0;i<a.length;i++)if(a[i]!==b[i])return a[i]-b[i];return 0;};
let selected=null,best=null,ties=0;
for(const route of candidates.values()){
  const score=quality(route),order=best?compare(score,best):-1;
  if(order<0){selected=route;best=score;ties=1;}
  else if(order===0&&random()<1/++ties)selected=route;
}
if(!selected)return {degrees:current.slice(),changed:false,indices:[],reused:false};
const indices=selected.map((d,i)=>i).filter(i=>selected[i]!==current[i]);
return {degrees:selected,changed:true,index:indices.find(i=>eligible.includes(i)),indices,reused:recent.has(key(selected))};
}
function progression(s,degrees){let previous=[];return degrees.map(d=>{const c=chord(d,s,previous);previous=c.baseNotes;return c;});}
function events(s,chords){
const result=[],span=Number(s.bars)*4,id=rhythmFor(s).id,gate=Math.max(.01,Math.min(1,Number(s.gate)||.9)),velocity=Math.max(1,Math.min(127,Number(s.velocity)||86));
const add=(ci,beat,duration,notes,strum=false)=>{if(!notes.length)return;const spacing=strum&&notes.length>1?Math.min(.025*Number(s.tempo)/60,duration*.6/(notes.length-1)):0;
notes.forEach((note,i)=>{const offset=spacing*i,start=ci*span+beat+offset,end=ci*span+Math.min(span,beat+offset+(duration-offset)*gate);const harmony=Boolean(chords[ci].harmonyNotes?.includes(note)),noteVelocity=harmony?Math.max(1,Math.min(127,Math.round(velocity*Math.max(.01,Math.min(1,Number(s.harmonyLevel??70)/100))))):velocity;result.push({beat:start,note,on:true,velocity:noteVelocity,harmony},{beat:end,note,on:false,velocity:0,harmony});});};
chords.forEach((c,ci)=>{const notes=[...c.notes].sort((a,b)=>a-b);if(id==='held'){add(ci,0,span,notes);return;}
let attacks=[];if(id==='syncopated'){for(let bar=0;bar<span;bar+=4)attacks.push(bar,bar+1.5,bar+3);}
else if(id==='swing_chords'||id==='arp_swing'){for(let beat=0;beat<span;beat++)attacks.push(beat,beat+2/3);}
else {const step=id==='halves'?2:id==='arp_triplets'?1/3:id==='arp_sixteenths'?.25:['chord_eighths','offbeats','eighths','arp_down','arp_updown','strum_alternate'].includes(id)?.5:1;for(let i=0;i<Math.ceil(span/step);i++){const b=i*step;if(id!=='offbeats'||i%2===1)attacks.push(b);}}
attacks=attacks.filter(b=>b<span);attacks.forEach((beat,i)=>{let duration=Math.min(span-beat,(id==='offbeats'?.5:(attacks[i+1]??span)-beat)),selected=notes,strum=false;
if(['eighths','arp_sixteenths','arp_triplets','arp_swing'].includes(id))selected=[notes[i%notes.length]];
if(id==='arp_down')selected=[notes[notes.length-1-i%notes.length]];
if(id==='arp_updown'){const period=Math.max(1,2*notes.length-2),j=i%period;selected=[notes[j<notes.length?j:period-j]];}
if(id==='bass_chord')selected=i%2===0?[notes[0]]:(notes.length>1?notes.slice(1):notes);
if(id.startsWith('strum_')){strum=true;if(id==='strum_up'||id==='strum_alternate'&&i%2===1)selected=[...notes].reverse();}
add(ci,beat,duration,selected,strum);
});});return result.sort((a,b)=>a.beat-b.beat||Number(a.on)-Number(b.on)||a.note-b.note);
}
function midi(s,chords){const data=[],push=(...v)=>data.push(...v),vlq=n=>{let bytes=[n&127];while((n>>=7)>0)bytes.unshift((n&127)|128);return bytes;};const tempo=Math.round(60000000/Number(s.tempo));
push(0,255,81,3,(tempo>>16)&255,(tempo>>8)&255,tempo&255,0,255,88,4,4,2,24,8);let tick=0;
for(const e of events(s,chords)){const next=Math.round(e.beat*480);push(...vlq(next-tick),e.on?144:128,e.note,e.velocity);tick=next;}
const end=chords.length*Number(s.bars)*4*480;push(...vlq(Math.max(0,end-tick)),255,47,0);const len=data.length;
return new Uint8Array([77,84,104,100,0,0,0,6,0,0,0,1,1,224,77,84,114,107,(len>>>24)&255,(len>>>16)&255,(len>>>8)&255,len&255,...data]);}
// Render a local PCM WAV. HTML media playback avoids dependence on AudioContext support.
function wave(s,chords,sampleRate=22050){
if(chords.some(c=>c.notes.some(n=>440*Math.pow(2,(n-69)/12)>=sampleRate*.48)))sampleRate=Math.max(sampleRate,32000);
const secondsPerBeat=60/Number(s.tempo),duration=chords.length*Number(s.bars)*4*secondsPerBeat,length=Math.max(1,Math.ceil(duration*sampleRate)),samples=new Float32Array(length),ev=events(s,chords),active=new Map();
for(const e of ev){if(e.on){active.set(e.note,e);continue;}const on=active.get(e.note);if(!on)continue;active.delete(e.note);const start=Math.round(on.beat*secondsPerBeat*sampleRate),held=(e.beat-on.beat)*secondsPerBeat,release=Math.min(.1,Math.max(.02,held*.2)),attack=Math.min(.012,held*.1),end=Math.min(length,start+Math.ceil((held+release)*sampleRate)),frequency=440*Math.pow(2,(e.note-69)/12),amplitude=(on.velocity/127)*.2;
for(let i=start;i<end;i++){const t=(i-start)/sampleRate,phase=2*Math.PI*frequency*t,envelope=Math.min(1,t/attack)*(t<=held?(.62+.38*Math.exp(-t*2)):Math.max(0,1-(t-held)/release));let tone=0,weight=0;for(let h=1;h<=3;h++){if(frequency*h>=sampleRate*.48)break;const a=[0,1,.24,.1][h];tone+=a*Math.sin(phase*h);weight+=a;}samples[i]+=amplitude*envelope*tone/Math.max(1,weight);}}
let peak=0;for(const x of samples)peak=Math.max(peak,Math.abs(x));const scale=peak>0?Math.min(2,.88/peak):0,buffer=new ArrayBuffer(44+length*2),view=new DataView(buffer),bytes=new Uint8Array(buffer);const text=(at,s)=>{for(let i=0;i<s.length;i++)bytes[at+i]=s.charCodeAt(i);};text(0,'RIFF');view.setUint32(4,36+length*2,true);text(8,'WAVE');text(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,sampleRate,true);view.setUint32(28,sampleRate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);text(36,'data');view.setUint32(40,length*2,true);for(let i=0;i<length;i++)view.setInt16(44+i*2,Math.round(Math.max(-1,Math.min(1,samples[i]*scale*Math.min(1,(length-1-i)/(sampleRate*.008))))*32767),true);return bytes;
}
const api={names,catalog,scales,presets,recipes,colors,voicings,rhythms,harmonies,harmonyFor,scaleTranspose,addHarmony,rhythmFor,colorFor,voicingFor,recipeFor,parseCustom,getScale,scaleName,buildTones,chordLabel,normalizeVoicing,voicingSupported,chord,roman,recipeDegrees,vary,progression,events,midi,wave};if(typeof module!=='undefined')module.exports=api;root.Chordloom=api;
})(typeof globalThis!=='undefined'?globalThis:this);
