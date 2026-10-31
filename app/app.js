'use strict';
const E=Chordloom,$=id=>document.getElementById(id),fields=['root','scale','preset','extension','voicing','octave','length','tempo','bars','rhythm','velocity','gate','customScale','harmony','harmonySource','harmonyLevel'];
function groupedOptions(id,options,label){const select=$(id),selected=select.value;select.replaceChildren();for(const group of [...new Set(options.map(o=>o.group))]){const optgroup=document.createElement('optgroup');optgroup.label=group;for(const item of options.filter(o=>o.group===group))optgroup.append(new Option(label(item),item.id));select.append(optgroup);}if([...select.options].some(o=>o.value===selected))select.value=selected;}
for(let octave=-1;octave<=9;octave++)$('octave').add(new Option(octave+' · '+(octave===-1?'Sub bass':octave<=1?'Bass':octave<=3?'Low / mid':octave<=5?'High':'Upper'),octave));$('octave').value='3';
groupedOptions('rhythm',E.rhythms,r=>r.name);$('rhythm').value='held';
groupedOptions('harmony',E.harmonies,h=>h.name);$('harmony').value='off';
E.names.forEach((n,i)=>$('root').add(new Option(n,i)));
groupedOptions('preset',E.recipes,r=>r.name);$('preset').value='After hours';
groupedOptions('extension',E.colors,c=>c.name);$('extension').value='7';
const shortVoicing={smooth:'Smooth motion',close:'Close / root',open:'Open spread',bass:'Bass + chord',inv1:'1st inversion',inv2:'2nd inversion',drop2:'Drop 2',drop3:'Drop 3',shell:'Shell',rootless:'Rootless jazz'};
groupedOptions('voicing',E.voicings,v=>shortVoicing[v.id]||v.name);$('voicing').value='smooth';
for(const group of [...new Set(E.catalog.map(s=>s.group))]){const optgroup=document.createElement('optgroup');optgroup.label=group;for(const s of E.catalog.filter(c=>c.group===group))optgroup.append(new Option(s.name,s.id));$('scale').append(optgroup);}$('scale').add(new Option('Custom · semitone scale','custom'));$('scale').value='minor';
let degrees=[0,5,2,6],locks=Array(8).fill(false),chords=[],settings={},midiAccess=null,output=null,playing=false,starting=false,timer=null,sequence=[],cursor=0,cycle=0,observedCycle=0,lastMediaTime=0,secondsPerBeat=.6,totalBeats=16,raf=0,audioURL=null,playToken=0,soundPanel=null,fretPanel=null;
const player=$('audioPlayer');
let playbackDesired=false,restartTimer=null;
const variationHistories=new Map();
const status=t=>$('status').textContent=t;
soundPanel=new ChordloomSoundFontPanel({onChange:()=>stop(false),onStatus:status});
fretPanel=new ChordloomFretboardPanel({engine:E,onStatus:status,download:(...args)=>download(...args)});
function read(){const s={};fields.forEach(id=>s[id]=$(id).value);s.customScale=$('customScale').value;E.getScale(s);s.tempo=Math.max(40,Math.min(240,Number(s.tempo)||100));$('tempo').value=s.tempo;return s;}
function noteName(n){return E.names[((n%12)+12)%12]+(Math.floor(n/12)-1);}
function refresh({resume=false}={}){const resumePlayback=resume&&playbackDesired;stop(false,resumePlayback);$('customScaleLabel').hidden=$('scale').value!=='custom';try{settings=read();}catch(error){if(resumePlayback)$('play').innerHTML='■ <span>Stop</span>';status(error.message);return false;}const scale=E.getScale(settings);for(const option of $('voicing').options)option.disabled=!E.voicingSupported(option.value,settings);if(!E.voicingSupported(settings.voicing,settings)){$('voicing').value='close';settings.voicing='close';status('That voicing needs more chord tones. Using close position.');}groupedOptions('preset',E.recipes,r=>r.name+' · '+r.degrees.map(d=>E.roman(d,settings)).join('–'));degrees=degrees.map(d=>d%scale.length);const expected=E.recipeDegrees(settings),length=Number(settings.length);degrees=Array.from({length},(_,i)=>(degrees[i]??expected[i])%scale.length);
const edited=degrees.some((d,i)=>d!==expected[i]),recipe=E.recipeFor(settings);$('recipeHint').textContent=(edited?'Edited · ':'Degrees · ')+degrees.map(d=>E.roman(d,settings)).join(' → ')+(recipe.degrees.length>length?' · choose 8 for full route':'');$('rhythmHint').textContent=E.rhythmFor(settings).brief;$('colorHint').textContent=E.colorFor(settings).brief;$('voicingHint').textContent=E.voicingFor(settings).brief;for(const id of ['preset','extension','voicing','rhythm'])$(id).title=$(id).selectedOptions[0].textContent;chords=E.progression(settings,degrees);totalBeats=chords.length*Number(settings.bars)*4;
$('keyTitle').textContent=E.names[settings.root]+' '+E.scaleName(settings);$('barCount').textContent=chords.length*Number(settings.bars)+' BARS · 4/4';$('velocityValue').textContent=settings.velocity;$('gateValue').textContent=Math.round(settings.gate*100)+'%';
$('scaleInfo').textContent=scale.length+' notes · '+scale.join(' · ')+(scale.length!==7?' · Chords stack alternating scale notes; unnamed shapes show semitone intervals.':'');$('chords').replaceChildren();chords.forEach((c,i)=>{const card=document.createElement('div');card.className='chord'+(c.label.length>15?' dense':'');card.dataset.index=i;const idx=document.createElement('span');idx.className='index';idx.textContent=String(i+1).padStart(2,'0')+(settings.harmony!=='off'?' · BASE CHORD':'');const lock=document.createElement('button');lock.className='lock';lock.textContent=locks[i]?'LOCKED':'LOCK';lock.setAttribute('aria-label','Lock chord '+(i+1));lock.setAttribute('aria-pressed',String(locks[i]));lock.onclick=()=>{locks[i]=!locks[i];lock.textContent=locks[i]?'LOCKED':'LOCK';lock.setAttribute('aria-pressed',String(locks[i]));};const title=document.createElement('h3');title.textContent=settings.harmony!=='off'?c.baseLabel:c.label;title.title=c.harmonyNotes.length?'Base color / voicing: '+c.baseLabel+'; added harmony: '+c.harmonyNotes.map(noteName).join(', ')+'. Chord symbol describes the base; the added notes and any new bass are listed separately.':c.label;const notes=document.createElement('div');notes.className='notes';notes.textContent=(c.harmonyNotes.length?'Base · ':'')+c.baseNotes.map(noteName).join(' · ');const added=document.createElement('div');added.className='harmony-notes';added.hidden=settings.harmony==='off';added.textContent=c.harmonyNotes.length?'+ Harmony · '+c.harmonyNotes.map(noteName).join(' · '):c.harmonySkipped.length?'Harmony not added':'Harmony already voiced';if(c.harmonySkipped.length)added.textContent+=' · '+c.harmonySkipped.length+' out of range';if(c.harmonyNotes.length&&c.notes[0]!==c.baseNotes[0])added.textContent+=' · Bass '+noteName(c.notes[0]);const select=document.createElement('select');select.setAttribute('aria-label','Scale degree for chord '+(i+1));['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'].slice(0,scale.length).forEach((r,d)=>select.add(new Option(r,d)));select.value=c.degree;select.onchange=()=>{degrees[i]=Number(select.value);refresh({resume:true});};card.append(idx,lock,title,notes,added,select);$('chords').append(card);});
const h=E.harmonyFor(settings),hActive=h.id!=='off',hCount=chords.reduce((n,c)=>n+c.harmonyNotes.length,0),skipped=chords.reduce((n,c)=>n+c.harmonySkipped.length,0);$('harmonyOptions').hidden=!hActive;$('harmonySource').disabled=!hActive;$('harmonyLevel').disabled=!hActive;$('harmonyLevelValue').textContent=settings.harmonyLevel+'%';$('harmonyHint').textContent=h.brief+(hActive?' · '+hCount+' added'+(skipped?' · '+skipped+' outside MIDI range':''):'');$('harmony').title=h.name;$('noteSummary').textContent=chords.reduce((n,c)=>n+c.notes.length,0)+' VOICED NOTES'+(hCount?' · '+hCount+' HARMONY':'');fretPanel.update(chords,settings);draw();if(activeTip)renderTip(activeTip);if(resumePlayback){status('Updating progression…');$('play').innerHTML='■ <span>Stop</span>';restartTimer=setTimeout(()=>{restartTimer=null;startPlayback();},80);}return true;}
function draw(beat=-1){const canvas=$('roll'),rect=canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1;canvas.width=Math.max(1,Math.round(rect.width*dpr));canvas.height=Math.max(1,Math.round(rect.height*dpr));const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);const w=rect.width,h=rect.height,left=40;
const ns=chords.flatMap(c=>c.notes),low=Math.max(0,Math.min(...ns)-2),high=Math.min(127,Math.max(...ns)+2),rows=high-low+1,rh=h/rows;ctx.font='9px Consolas';
for(let n=low;n<=high;n++){const y=(high-n)*rh;ctx.fillStyle=[1,3,6,8,10].includes(n%12)?'#111512':'#191f19';ctx.fillRect(0,y,w,rh);ctx.strokeStyle='#293029';ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();if(n%12===0||n===low){ctx.fillStyle='#8a9987';ctx.fillText(noteName(n),5,y+rh*.8);}}
for(let b=0;b<=totalBeats;b++){const x=left+b/totalBeats*(w-left);ctx.strokeStyle=b%4===0?'#45513f':'#252e25';ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
const colors=['#c5f277','#92c9ac','#d8be7a','#b5a4d7'];const ev=E.events(settings,chords),pending=new Map();for(const e of ev){if(e.on)pending.set(e.note,e.beat);else{const begin=pending.get(e.note);if(begin!==undefined){const x=left+begin/totalBeats*(w-left),end=left+e.beat/totalBeats*(w-left),y=(high-e.note)*rh;ctx.fillStyle=e.harmony?'#e6b4ef':colors[Math.floor(begin/(Number(settings.bars)*4))%4];ctx.fillRect(x+1,y+2,Math.max(1,end-x-2),Math.max(2,rh-4));pending.delete(e.note);}}}
if(beat>=0){const x=left+beat/totalBeats*(w-left);ctx.fillStyle='#f4ffe4';ctx.fillRect(x,0,1.5,h);}}
function panic(){if(output){try{output.clear();for(let n=0;n<128;n++)output.send([128,n,0]);}catch(e){status('MIDI output disconnected.');}}}
function stop(message=true,preserveIntent=false){
  playToken++;
  if(!preserveIntent)playbackDesired=false;
  playing=false;starting=false;
  clearTimeout(restartTimer);restartTimer=null;
  clearInterval(timer);cancelAnimationFrame(raf);
  soundPanel?.cancel();
  player.onended=null;player.onerror=null;
  player.pause();
  try{player.currentTime=0;}catch(e){}
  panic();
  $('play').innerHTML='▶ <span>Play</span>';$('position').textContent='READY';
  document.querySelectorAll('.chord.active').forEach(c=>c.classList.remove('active'));
  if(chords.length)draw();
  if(message)status('Stopped. All notes released.');
}
function schedule(){if(!playing||!output)return;const duration=totalBeats*secondsPerBeat,mediaTime=player.currentTime;if(mediaTime+.1<lastMediaTime)observedCycle++;lastMediaTime=mediaTime;const elapsed=observedCycle*duration+mediaTime,horizon=elapsed+.08;let guard=0;
while(guard++<1000){if(cursor>=sequence.length){if(!player.loop)break;cursor=0;cycle++;}const e=sequence[cursor],when=cycle*duration+e.beat*secondsPerBeat;if(when>horizon)break;cursor++;if(when<elapsed-.04)continue;try{output.send([e.on?144:128,e.note,e.velocity],performance.now()+Math.max(0,when-elapsed)*1000);}catch(error){output=null;status('MIDI output disconnected; internal sound continues.');break;}}}
function animate(){if(!playing)return;const beat=player.currentTime/secondsPerBeat,index=Math.min(chords.length-1,Math.floor(beat/(Number(settings.bars)*4)));document.querySelectorAll('.chord').forEach((el,i)=>el.classList.toggle('active',i===index));$('position').textContent='BAR '+(Math.floor(beat/4)+1)+' / '+(totalBeats/4);draw(beat);raf=requestAnimationFrame(animate);}
function soundStatus(){if(!playing)return;status(player.muted||player.volume===0?(output?'Sound muted · sending MIDI channel 1.':'Sound muted. Enable Sound on and raise Volume to hear playback.'):'Playing '+soundPanel.name+(output?' + MIDI channel 1.':'.'));}
async function startPlayback(){
  if(!refresh())return;
  const token=++playToken;
  playbackDesired=true;starting=true;
  status('Preparing '+soundPanel.name+'…');$('play').innerHTML='■ <span>Cancel</span>';
  try{
    settings=read();chords=E.progression(settings,degrees);sequence=E.events(settings,chords);
    secondsPerBeat=60/Number(settings.tempo);totalBeats=chords.length*Number(settings.bars)*4;
    cursor=0;cycle=0;observedCycle=0;lastMediaTime=0;
    const bytes=await soundPanel.wave(settings,chords,progress=>{
      if(token===playToken)status('Rendering '+soundPanel.name+' · '+progress+'%');
    });
    if(token!==playToken)return;
    // Detach the previous media resource before releasing its URL. Loading a fresh
    // source clears decoder errors in Android WebView and aborts old media work.
    const previousURL=audioURL;
    player.removeAttribute('src');player.load();
    if(previousURL)URL.revokeObjectURL(previousURL);
    const url=URL.createObjectURL(new Blob([bytes],{type:'audio/wav'}));audioURL=url;
    player.src=url;player.loop=$('loop').checked;
    player.volume=Number($('volume').value);player.muted=!$('preview').checked;
    player.load();
    player.onended=()=>{if(token===playToken&&player.ended)stop();};
    player.onerror=()=>{
      // A queued event from an old resource must not stop a newer preview.
      if(token!==playToken||!player.error||player.currentSrc!==url)return;
      stop(false);status('Audio could not play. Press Play to retry, or choose the built-in synth.');
    };
    let timeout;
    try{
      await Promise.race([player.play(),new Promise((_,reject)=>{
        timeout=setTimeout(()=>reject(Error('Audio playback did not start. Press Play to retry.')),6000);
      })]);
    }finally{clearTimeout(timeout);}
    if(token!==playToken)return;
    if(player.paused)throw Error('Audio is paused. Press Play to retry.');
    playing=true;starting=false;
    $('play').innerHTML='■ <span>Stop</span>';
    schedule();timer=setInterval(schedule,25);animate();soundStatus();
  }catch(error){
    if(token!==playToken)return;
    stop(false);status('Audio could not start: '+error.message);
  }
}
$('play').onclick=()=>{if(playbackDesired||playing||starting){stop();return;}startPlayback();};
$('loop').onchange=()=>{player.loop=$('loop').checked;};
$('volume').oninput=()=>{player.volume=Number($('volume').value);$('volumeValue').textContent=Math.round(player.volume*100)+'%';soundStatus();};
$('stop').onclick=()=>stop();
fields.forEach(id=>$(id).addEventListener('change',()=>{if(!playing&&!starting)status('Ready. Press Play to hear '+soundPanel.name+'.');if(id==='preset'){try{const expected=E.recipeDegrees(read());degrees=expected.map((d,i)=>locks[i]?degrees[i]??d:d);}catch(error){status(error.message);return;}}if(refresh({resume:true})&&id==='preset')status('Recipe applied. Locked scale degrees kept.');}));
function variationHistory(s){
  const key=JSON.stringify([s.root,s.scale,s.customScale,s.preset,s.length]);
  const history=variationHistories.get(key)||[];
  variationHistories.delete(key);variationHistories.set(key,history);
  while(variationHistories.size>8)variationHistories.delete(variationHistories.keys().next().value);
  if(history.at(-1)?.join(',')!==degrees.join(','))history.push(degrees.slice());
  if(history.length>128)history.splice(0,history.length-128);
  return history;
}
$('generate').onclick=()=>{
  try{
    const s=read(),history=variationHistory(s),result=E.vary(s,degrees,locks,Math.random,history);
    if(!result.changed){status('Unlock an interior chord to vary this recipe. First and last steps stay anchored.');return;}
    degrees=result.degrees;history.push(degrees.slice());
    if(history.length>128)history.splice(0,history.length-128);
    if(refresh({resume:true}))status('Variation of '+E.recipeFor(s).name+'. Locked degrees kept.'+(result.reused?' Available choices are limited by this recipe and your locks.':''));
  }catch(error){status(error.message);}
};
function download(data,name,type){const url=URL.createObjectURL(new Blob([data],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
$('export').onclick=()=>{try{settings=read();}catch(error){status(error.message);return;}chords=E.progression(settings,degrees);download(E.midi(settings,chords),'Chordloom-'+E.names[settings.root].replace('♯','sharp').replace('♭','flat')+'-'+settings.scale+'-'+settings.tempo+'bpm.mid','audio/midi');status('MIDI exported. Drag it into an FL Studio Piano roll.');};
$('save').onclick=()=>{try{download(JSON.stringify({version:4,settings:read(),degrees,locks,preview:soundPanel.snapshot(),fretboard:fretPanel.snapshot()},null,2),'Chordloom-session.json','application/json');}catch(error){status(error.message);}};$('load').onclick=()=>$('sessionFile').click();
$('sessionFile').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>100000)throw Error('File is too large.');const data=JSON.parse(await file.text());if(![1,2,3,4].includes(data.version)||!data.settings||!Array.isArray(data.degrees)||![4,8].includes(data.degrees.length)||!data.degrees.every(d=>Number.isInteger(d)&&d>=0&&d<12)||!Array.isArray(data.locks)||!data.locks.every(v=>typeof v==='boolean'))throw Error('Invalid session format.');data.settings.customScale??='0,2,3,5,7,9,10';if(data.version<4){data.settings.harmony='off';data.settings.harmonySource='top';data.settings.harmonyLevel=70;}E.getScale(data.settings);if(data.degrees.some(d=>d>=E.getScale(data.settings).length))throw Error('Scale degree is outside the selected scale.');for(const id of fields){const v=String(data.settings[id]);const el=$(id);if(el.tagName==='SELECT'&&![...el.options].some(o=>o.value===v))throw Error('Invalid '+id);if(el.tagName==='INPUT'&&el.type!=='text'&&(!Number.isFinite(Number(v))||Number(v)<Number(el.min)||Number(v)>Number(el.max)))throw Error('Invalid '+id);}
if(Number(data.settings.length)!==data.degrees.length)throw Error('Progression length mismatch.');stop(false);fields.forEach(id=>$(id).value=data.settings[id]);degrees=data.degrees;locks=Array.from({length:8},(_,i)=>data.locks[i]===true);refresh();if(data.version>=3)fretPanel.restore(data.fretboard);const soundNote=data.version>=2?await soundPanel.restore(data.preview):'';status('Session loaded.'+soundNote);}catch(error){status('Could not load session: '+error.message);}finally{e.target.value='';}};
function updatePorts(){const selected=$('midiOutput').value;stop(false);$('midiOutput').replaceChildren(new Option('No MIDI output',''));for(const port of midiAccess.outputs.values())$('midiOutput').add(new Option(port.name,port.id));$('midiOutput').value=[...midiAccess.outputs.keys()].includes(selected)?selected:'';output=midiAccess.outputs.get($('midiOutput').value)||null;}
$('connect').onclick=async()=>{if(!navigator.requestMIDIAccess){status('Web MIDI is unavailable here. Use Chrome or Edge on localhost, or export a MIDI file.');return;}try{midiAccess=await navigator.requestMIDIAccess({sysex:false});updatePorts();midiAccess.onstatechange=updatePorts;status(midiAccess.outputs.size?'Choose a MIDI output. Use a virtual port for FL Studio.':'No MIDI outputs found. Connect hardware or configure a virtual MIDI port.');}catch(error){status('MIDI access unavailable: '+error.message);}};
$('midiOutput').onchange=()=>{stop(false);output=midiAccess?.outputs.get($('midiOutput').value)||null;status(output?'MIDI output: '+output.name+' · channel 1':'MIDI output disabled.');};
let activeTip=null,tipPinned=false,tipHideTimer=null;
function renderTip(button){const kind=button.dataset.theory,tip=$('theoryTooltip');if(!settings.scale)return;let title,body,selectedTitle,selectedBody;
if(kind==='recipe'){title='What does a progression recipe do?';body='Chooses the order of chord roots as scale degrees. Root note transposes the idea; Scale determines its intervals and chord qualities. Selecting a recipe applies it immediately. Generate variation keeps the recipe’s endpoints, reshuffles unlocked interior degrees, avoids adjacent repeats when possible and balances degree use. Recent variations are avoided while equally balanced alternatives remain. Locks preserve degree numbers, not fixed pitches.';const r=E.recipeFor(settings);selectedTitle=r.name+' · '+E.recipeDegrees(settings).map(d=>E.roman(d,settings)).join(' → ');selectedBody=r.description+(E.getScale(settings).length!==7?' This collection has '+E.getScale(settings).length+' notes: recipe indices wrap to its actual size, so conventional seven-note functional names may not apply.':'');}
if(kind==='color'){title='What does chord color change?';body='Chooses which scale tones belong to each chord. Formulas count from that chord’s own root: 9 is the second one octave higher, 11 the fourth, and 13 the sixth. All tones stay in your selected collection; the app does not force a major or minor quality. In non-seven-note collections, these are scale-step formulas rather than conventional chord intervals.';const c=E.colorFor(settings);selectedTitle=c.name+' · '+c.brief;selectedBody=c.description;}
if(kind==='harmony'){title='How does added harmony work?';body='Adds scale-based notes around the selected top or bass voice after voicing. Original notes remain intact. Added notes join the chord before rhythm is applied, so arpeggios cycle through the expanded voicing. Playback, MIDI and tablature include them. Harmony level controls only the velocity of the new notes; exact duplicates are kept once. Out-of-range MIDI notes are reported and skipped.';const h=E.harmonyFor(settings);selectedTitle=h.name;selectedBody=h.description+(E.getScale(settings).length!==7?' In this '+E.getScale(settings).length+'-note collection, named scale intervals count positions of that collection and may differ from conventional thirds/fifths.':'');}
if(kind==='rhythm'){title='What does rhythm change?';body='Controls the note attacks and rests inside each 4/4 chord span. Beat values are quarter-note units. Playback, the piano roll, live MIDI and exported MIDI all use the same events. Note length shortens each attack; tempo controls how beats translate into seconds.';const r=E.rhythmFor(settings);selectedTitle=r.name+' · '+r.brief;selectedBody=r.description;}
if(kind==='voicing'){title='What does voicing change?';body='Chooses the register, spacing and bass of each chord. Most choices retain all chord pitch classes; shell and rootless deliberately omit tones. A slash names the bass when it differs from the harmonic root. When octave moves would merge two MIDI notes, one is shifted to a free octave. Choose a color first, then compare voicings by ear.';const v=E.voicingFor(settings);selectedTitle=v.name;selectedBody=v.description;}
$('tipTitle').textContent=title;$('tipBody').textContent=body;$('tipSelectionTitle').textContent=selectedTitle;$('tipSelectionBody').textContent=selectedBody;tip.hidden=false;const r=button.getBoundingClientRect(),box=tip.getBoundingClientRect();let x=r.right+12;if(x+box.width>window.innerWidth-12)x=r.left-box.width-12;tip.style.left=Math.max(12,x)+'px';tip.style.top=Math.max(12,Math.min(r.top-12,window.innerHeight-box.height-12))+'px';}
function hideTip(){clearTimeout(tipHideTimer);for(const button of document.querySelectorAll('[data-theory]'))button.setAttribute('aria-expanded','false');$('theoryTooltip').hidden=true;activeTip=null;tipPinned=false;}
function showTip(button,pinned=false){clearTimeout(tipHideTimer);for(const b of document.querySelectorAll('[data-theory]'))b.setAttribute('aria-expanded',String(b===button));activeTip=button;tipPinned=pinned;renderTip(button);}
function scheduleTipHide(){clearTimeout(tipHideTimer);tipHideTimer=setTimeout(()=>{if(!tipPinned&&activeTip&&document.activeElement!==activeTip&&!activeTip.matches(':hover')&&!$('theoryTooltip').matches(':hover'))hideTip();},180);}
for(const button of document.querySelectorAll('[data-theory]')){button.addEventListener('mouseenter',()=>{if(!tipPinned)showTip(button);});button.addEventListener('mouseleave',scheduleTipHide);button.addEventListener('focus',()=>showTip(button));button.addEventListener('blur',scheduleTipHide);button.addEventListener('click',()=>{if(activeTip===button&&tipPinned)hideTip();else showTip(button,true);});}
$('theoryTooltip').addEventListener('mouseenter',()=>clearTimeout(tipHideTimer));$('theoryTooltip').addEventListener('mouseleave',scheduleTipHide);document.addEventListener('keydown',event=>{if(event.key==='Escape')hideTip();});document.addEventListener('click',event=>{if(activeTip&&!event.target.closest('[data-theory]')&&!$('theoryTooltip').contains(event.target))hideTip();});window.addEventListener('resize',()=>{if(activeTip)renderTip(activeTip);});window.addEventListener('scroll',()=>{if(activeTip)renderTip(activeTip);},{passive:true});
$('customScale').addEventListener('input',()=>refresh({resume:true}));$('harmonyLevel').addEventListener('input',()=>refresh({resume:true}));
$('preview').onchange=()=>{player.muted=!$('preview').checked;soundStatus();};window.addEventListener('pagehide',()=>{stop(false);if(audioURL)URL.revokeObjectURL(audioURL);soundPanel?.dispose();});window.addEventListener('resize',()=>draw());refresh();
