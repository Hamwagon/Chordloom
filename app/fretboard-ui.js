// Accessible local tablature and suggested-fingering view.
(function(root){
'use strict';
const F=root.ChordloomFretboard,$=id=>document.getElementById(id),ns='http://www.w3.org/2000/svg';
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const svgEl=(tag,attrs,text)=>{const n=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs||{}))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;return n;};
function diagram(shape,tuning,index){
const svg=svgEl('svg',{viewBox:'0 0 190 190',role:'img','aria-label':'Suggested fingering for chord '+(index+1)+': '+shape.frets.map(f=>f<0?'muted':f).join(', ')}),positive=shape.frets.filter(f=>f>0),first=positive.length&&Math.max(...positive)>5?Math.min(...positive):1,rows=Math.max(5,Math.max(0,...positive)-first+1),left=32,right=166,top=39,bottom=156,dx=(right-left)/(tuning.notes.length-1),dy=(bottom-top)/rows;
svg.append(svgEl('title',{},'Frets '+shape.frets.map(f=>f<0?'x':f).join(' ')+'. Fingers '+shape.fingers.map(f=>f<0?'x':f===0?'open':f).join(' ')));
for(let fret=0;fret<=rows;fret++)svg.append(svgEl('line',{x1:left,y1:top+fret*dy,x2:right,y2:top+fret*dy,stroke:'#6b7865','stroke-width':fret===0&&first===1?4:1}));
for(let string=0;string<tuning.notes.length;string++){const x=left+string*dx;svg.append(svgEl('line',{x1:x,y1:top,x2:x,y2:bottom,stroke:'#6b7865','stroke-width':1}));svg.append(svgEl('text',{x,y:176,'text-anchor':'middle',fill:'#aebba7','font-size':11},tuning.labels[string]));if(shape.frets[string]<=0)svg.append(svgEl('text',{x,y:27,'text-anchor':'middle',fill:'#d0dfc6','font-size':15},shape.frets[string]<0?'×':'○'));}
svg.append(svgEl('text',{x:6,y:top+dy*.7,fill:'#aebba7','font-size':10},first+'fr'));
for(const b of shape.barres){const y=top+(b.fret-first+.5)*dy;svg.append(svgEl('line',{x1:left+b.from*dx,y1:y,x2:left+b.to*dx,y2:y,stroke:'#c5f277','stroke-width':13,'stroke-linecap':'round'}));}
for(let i=0;i<shape.frets.length;i++)if(shape.frets[i]>0){const x=left+i*dx,y=top+(shape.frets[i]-first+.5)*dy;svg.append(svgEl('circle',{cx:x,cy:y,r:8,fill:'#c5f277'}),svgEl('text',{x,y:y+3.5,'text-anchor':'middle',fill:'#15210e','font-size':11,'font-weight':700},shape.fingers[i]));}
return svg;
}
class Panel{
constructor({engine,onStatus,download}){this.E=engine;this.onStatus=onStatus;this.download=download;this.chords=[];this.settings={};this.indices=[];this.cache=new Map();this.output={available:false,text:''};
F.tunings.forEach(t=>$('fretTuning').add(new Option(t.name,t.id)));for(let i=0;i<=12;i++)$('fretCapo').add(new Option(i===0?'None':String(i),i));
for(const id of ['fretTuning','fretMode','fretCapo','fretMax','fretSpan'])$(id).addEventListener('change',()=>{this.indices=[];this.render();});
$('fretboardPanel').addEventListener('toggle',()=>{if($('fretboardPanel').open)this.render();});
$('exportTab').onclick=()=>{this.render();if(!this.output.available){this.onStatus('Tab needs a valid fingering for every chord. Try a thinner chord color, another tuning or a wider fret range.');return;}this.download(this.output.text,'Chordloom-tablature.txt','text/plain;charset=utf-8');this.onStatus('Tablature exported with tuning, capo, suggested fingers and beat positions.');};
}
options(){return {tuning:$('fretTuning').value,mode:$('fretMode').value,capo:Number($('fretCapo').value),maxFret:Number($('fretMax').value),span:Number($('fretSpan').value),limit:4};}
update(chords,settings){const changed=JSON.stringify(this.chords.map(c=>c.notes))!==JSON.stringify(chords.map(c=>c.notes));this.chords=chords;this.settings=settings;if(changed)this.indices=[];if($('fretboardPanel').open)this.render();}
snapshot(){return {...this.options(),open:$('fretboardPanel').open,indices:this.indices.slice()};}
restore(data){if(!data||typeof data!=='object')return;for(const [id,key] of [['fretTuning','tuning'],['fretMode','mode'],['fretCapo','capo'],['fretMax','maxFret'],['fretSpan','span']]){const v=String(data[key]);if([...$(id).options].some(o=>o.value===v))$(id).value=v;}this.indices=Array.isArray(data.indices)?data.indices.slice(0,8).map(n=>Number.isInteger(n)&&n>=0&&n<4?n:0):[];$('fretboardPanel').open=data.open===true;if($('fretboardPanel').open)this.render();}
render(){if(!this.chords.length)return;const options=this.options(),tuning=F.options(options).tuning;this.shapes=this.chords.map(c=>{const key=JSON.stringify([c.notes,options]);if(!this.cache.has(key))this.cache.set(key,F.findShapes(c,options));return this.cache.get(key);});if(this.cache.size>128){const keep=new Map();this.shapes.forEach((s,i)=>keep.set(JSON.stringify([this.chords[i].notes,options]),s));this.cache=keep;}
$('fingerings').replaceChildren();this.chords.forEach((c,i)=>{const card=el('article','fingering'),title=el('strong','',String(i+1).padStart(2,'0')+' · '+(c.harmonyNotes?.length?'Base '+c.baseLabel:c.label));card.append(title);const shapes=this.shapes[i];if(!shapes.length){card.append(el('p','fret-empty','No fingering within these limits. Try Shell / Rootless, another tuning, a wider range or Playable arrangement.'));this.indices[i]=0;}
else{this.indices[i]=Math.min(this.indices[i]||0,shapes.length-1);const shape=shapes[this.indices[i]],choice=el('select');choice.setAttribute('aria-label','Fingering for chord '+(i+1));shapes.forEach((s,j)=>choice.add(new Option('Shape '+(j+1)+' · '+s.frets.map(f=>f<0?'x':f).join(' '),j)));choice.value=this.indices[i];choice.onchange=()=>{this.indices[i]=Number(choice.value);this.render();};card.append(diagram(shape,tuning,i),choice,el('p','grip-notes',shape.notes.map(n=>this.E.names[n%12]+(Math.floor(n/12)-1)).join(' · ')));if(shape.barres.length)card.append(el('small','', 'Index barre · fret '+shape.barres[0].fret));}
$('fingerings').append(card);});const chosen=this.shapes.map((s,i)=>s[this.indices[i]]||null),missing=chosen.map((s,i)=>s?null:i+1).filter(Boolean);$('fretInfo').textContent=(options.mode==='exact'?'Exact pitches: every MIDI note must fit on a separate string.':'Playable arrangement: preserves all voiced pitch classes and the bass pitch class; octave positions and doublings can change.')+' '+(missing.length?'No shape for chord '+missing.join(', ')+'. No tones have been omitted.':'Suggested fingerings use at most four fingers; personal reach and technique vary.');this.output=F.tab(this.chords,chosen,this.settings,this.E,options);$('tablature').textContent=this.output.text;$('exportTab').disabled=!this.output.available;
}
}
root.ChordloomFretboardPanel=Panel;
})(globalThis);
