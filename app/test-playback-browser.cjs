// Real-browser playback checks. Prepare Android assets before running.
// Optional --baseline records the original interruption and recovery behavior.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const assets=path.resolve(process.env.CHORDLOOM_PLAYBACK_ASSETS||path.join(__dirname,'../android/app/src/main/assets'));
const baseline=process.argv.includes('--baseline');
const csp="default-src 'none'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src blob: data:; worker-src blob:; connect-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'none'";
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.txt':'text/plain'};
const server=http.createServer((request,response)=>{
  const filename=path.resolve(assets,'.'+new URL(request.url,'http://localhost').pathname);
  if(!filename.startsWith(assets+path.sep)||!fs.existsSync(filename)||!fs.statSync(filename).isFile()){response.writeHead(404);response.end();return;}
  response.writeHead(200,{'Content-Type':(types[path.extname(filename)]||'application/octet-stream')+';charset=utf-8','Content-Security-Policy':csp});
  fs.createReadStream(filename).pipe(response);
});

(async()=>{
  assert(fs.existsSync(path.join(assets,'index.html')),'Run node android/tools/prepare-assets.cjs first.');
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHORDLOOM_CHROMIUM||undefined,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
  const page=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
  const errors=[];let stage='initialization';
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{
    window.__previewWaves=[];
    const createURL=URL.createObjectURL.bind(URL);
    URL.createObjectURL=blob=>{if(blob.type==='audio/wav')window.__previewWaves.push(blob);return createURL(blob);};
  });
  const state=()=>page.evaluate(()=>{
    const audio=document.getElementById('audioPlayer');
    return {paused:audio.paused,currentTime:audio.currentTime,readyState:audio.readyState,muted:audio.muted,volume:audio.volume,playing,starting,status:document.getElementById('status').textContent,waves:window.__previewWaves.length,degree:degrees[0],bank:soundPanel.selected};
  });
  const settle=milliseconds=>new Promise(resolve=>setTimeout(resolve,milliseconds));
  async function running(after=-1){
    await page.waitForFunction(n=>{
      const audio=document.getElementById('audioPlayer');
      return window.__previewWaves.length>n&&playing&&!audio.paused&&audio.readyState===4&&audio.currentTime>.04;
    },after,{timeout:20000});
    const first=await page.locator('#audioPlayer').evaluate(audio=>audio.currentTime);
    await page.waitForFunction(time=>document.getElementById('audioPlayer').currentTime>time+.025,first,{timeout:3000});
    const metrics=await page.evaluate(async()=>{
      const buffer=await window.__previewWaves.at(-1).arrayBuffer(),view=new DataView(buffer);
      let energy=0,peak=0,hash=2166136261;
      for(let offset=44;offset<buffer.byteLength;offset+=2){const value=view.getInt16(offset,true);energy+=(value/32768)**2;peak=Math.max(peak,Math.abs(value)/32768);hash=Math.imul(hash^value,16777619);}
      return {rms:Math.sqrt(energy/((buffer.byteLength-44)/2)),peak,hash:hash>>>0,bytes:buffer.byteLength};
    });
    assert(metrics.rms>.001&&metrics.peak>.01,'Playback WAV must contain non-silent PCM: '+JSON.stringify(metrics));
    return metrics;
  }
  async function play(){await page.locator('#play').click();return running();}
  async function stopAndRemainStopped(){
    await page.locator('#stop').click();await settle(180);const stopped=await state();
    assert(stopped.paused&&!stopped.playing&&!stopped.starting,'Stop must win over queued rendering/restarts: '+JSON.stringify(stopped));
  }
  async function select(id,value){await page.locator('#'+id).evaluate((element,v)=>{element.value=v;element.dispatchEvent(new Event('change',{bubbles:true}));},String(value));}
  async function degree(value){await page.locator('#chords select').first().selectOption(String(value));}
  async function loadBank(bank){
    await stopAndRemainStopped();
    if(bank==='sf3'){
      await page.locator('#soundfontFile').setInputFiles(path.join(__dirname,'../soundfonts/Chordloom-Soft-Keys.sf3'));
      await page.waitForFunction(()=>soundPanel.selected.startsWith('local-')&&document.getElementById('instrument').options.length===1);
    }else{
      await select('soundBank',bank);
      await page.waitForFunction(id=>soundPanel.selected===id&&(id==='builtin'||soundPanel.bank.loaded),bank);
    }
  }
  try{
    await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');
    await page.waitForFunction(()=>document.querySelectorAll('#chords .chord').length===4);
    await page.locator('#androidPalette').evaluate(element=>element.open=true);
    await select('tempo',240);await select('extension','3');await select('voicing','close');
    const interrupted=[];
    for(const bank of ['builtin','factory','sf3']){
      stage=bank+' degree changes';await loadBank(bank);let previous=await play();
      for(const value of(baseline?[1,6]:[1,2,3,4,5,6,0])){
        const before=(await state()).waves;await degree(value);
        if(baseline){
          const edited=await state();interrupted.push({bank,degree:value,paused:edited.paused,playing:edited.playing,starting:edited.starting});
          assert(edited.paused&&!edited.playing&&!edited.starting,'Baseline must reproduce unconditional interruption.');await play();
        }
        const current=await running(before);assert.notEqual(current.hash,previous.hash,'Changed degree must change rendered audio for '+bank);previous=current;
      }
      await stopAndRemainStopped();await degree(2);await settle(120);
      assert((await state()).paused,'Changing a stopped progression must not start playback.');
    }
    if(baseline){
      console.log('BASELINE: '+JSON.stringify(interrupted));await play();
      await page.locator('#audioPlayer').evaluate(audio=>audio.dispatchEvent(new Event('error')));
      const mediaStopped=(await state()).paused;
      const staleWorkerKept=await page.evaluate(()=>{
        const client=new ChordloomSoundFontClient();client.ensure();const handler=client.worker.onerror;
        client.dispose();client.ensure();const current=client.worker;
        handler(new ErrorEvent('error',{message:'Late disposed-worker error'}));
        const kept=client.worker===current;client.dispose();return kept;
      });
      console.log('BASELINE injected-edge checks: '+JSON.stringify({mediaErrorWithoutCurrentMediaErrorStopsAudio:mediaStopped,lateOldWorkerErrorPreservesNewWorker:staleWorkerKept}));
      console.log('PASS: degree edits interrupt all three banks; manual Play recovers real non-silent advancing audio.');return;
    }

    stage='degree edits while rendering and rapid restart races';await loadBank('factory');
    let before=(await state()).waves;
    await page.evaluate(()=>{
      document.getElementById('play').click();
      for(const value of[1,2,3,4,5,6,0,3]){const element=document.querySelector('#chords select');element.value=String(value);element.dispatchEvent(new Event('change',{bubbles:true}));}
    });
    await running(before);assert.equal((await state()).degree,3,'Rapid edits retain the latest degree.');await stopAndRemainStopped();
    await page.evaluate(()=>{
      document.getElementById('play').click();const element=document.querySelector('#chords select');element.value='5';element.dispatchEvent(new Event('change',{bubbles:true}));document.getElementById('stop').click();
    });
    await settle(250);assert((await state()).paused&&!(await state()).starting,'Stop during queued edits must not resurrect playback.');
    await play();await stopAndRemainStopped();
    await page.evaluate(()=>{document.getElementById('play').click();document.getElementById('stop').click();document.getElementById('play').click();});await running();

    stage='mute, volume, loop and chord-lock preservation';
    await page.locator('#preview').uncheck();
    await page.locator('#volume').evaluate(element=>{element.value='.35';element.dispatchEvent(new Event('input',{bubbles:true}));});
    before=(await state()).waves;await degree(4);await running(before);
    const muted=await state();assert.equal(muted.muted,true);assert.equal(muted.volume,.35);
    await page.locator('#preview').check();assert.equal((await state()).muted,false);
    const lockSource=await page.locator('#audioPlayer').getAttribute('src');
    await page.locator('#chords .lock').first().click();await running();
    assert.equal(await page.locator('#audioPlayer').getAttribute('src'),lockSource,'Lock-only edits must not re-render or interrupt audio.');
    await page.locator('#loop').uncheck();before=(await state()).waves;await degree(5);await running(before);
    assert.equal(await page.locator('#audioPlayer').evaluate(audio=>audio.loop),false);await page.locator('#loop').check();

    stage='global musical changes and variation';
    const harmony=await page.locator('#harmony option').evaluateAll(options=>options.find(option=>option.value!=='off').value);
    for(const[id,value]of[['root','7'],['rhythm','alternate'],['harmony',harmony]]){
      const selected=id==='rhythm'?await page.locator('#rhythm option').evaluateAll(options=>options.find(option=>option.value!=='held').value):value;
      before=(await state()).waves;await select(id,selected);await running(before);
    }
    before=(await state()).waves;await page.locator('#generate').click();await running(before);

    stage='stale media error after source replacement';
    before=(await state()).waves;await degree(1);await running(before);
    await page.locator('#audioPlayer').evaluate(audio=>audio.dispatchEvent(new Event('error')));
    assert(!(await state()).paused,'Stale error with no current MediaError must not stop new-source audio.');await running();

    stage='bank, preset and error recovery';
    await select('instrument','1');assert((await state()).paused,'Preset switches explicitly stop playback.');await play();
    await select('soundBank','builtin');assert((await state()).paused,'Soundbank switches explicitly stop playback.');await play();
    await loadBank('factory');await play();
    await page.evaluate(()=>soundPanel.client.worker.dispatchEvent(new ErrorEvent('error',{message:'Simulated renderer crash'})));
    await settle(80);await stopAndRemainStopped();await play();await stopAndRemainStopped();
    await page.evaluate(()=>{const original=soundPanel.wave.bind(soundPanel);soundPanel.wave=async(...args)=>{soundPanel.wave=original;throw Error('Simulated render failure');};});
    await page.locator('#play').click();
    await page.waitForFunction(()=>!starting&&!playing&&document.getElementById('status').textContent.includes('Simulated render failure'));await play();

    stage='stale worker error callback';
    const workerIdentity=await page.evaluate(async()=>{
      const client=new ChordloomSoundFontClient();client.ensure();const stale=client.worker.onerror;
      client.dispose();client.ensure();const current=client.worker;let error=null;
      try{stale(new ErrorEvent('error',{message:'Late event from disposed worker'}));}catch(failure){error=failure.message;}
      const kept=client.worker===current;let presets=0;
      if(kept){const binary=atob(ChordloomFactoryBank),bytes=Uint8Array.from(binary,character=>character.charCodeAt(0));presets=(await client.load('stale-test',bytes.buffer)).presets.length;}
      client.dispose();return{kept,error,presets};
    });
    assert.deepEqual(workerIdentity,{kept:true,error:null,presets:24},'Old worker callbacks must not poison the current renderer.');

    stage='session load, invalid SoundFont and background pause';
    const session=await page.evaluate(()=>JSON.stringify({version:4,settings:read(),degrees:[...degrees],locks:[...locks],preview:soundPanel.snapshot(),fretboard:fretPanel.snapshot()}));
    await page.locator('#sessionFile').setInputFiles({name:'playback-session.json',mimeType:'application/json',buffer:Buffer.from(session)});
    await page.waitForFunction(()=>document.getElementById('status').textContent.startsWith('Session loaded.'));
    assert((await state()).paused,'Session loading is an explicit stopped transition.');await play();
    await page.locator('#soundfontFile').setInputFiles({name:'broken.sf3',mimeType:'application/octet-stream',buffer:Buffer.from('broken SoundFont')});
    await page.waitForFunction(()=>document.getElementById('soundfontInfo').textContent.includes('Could not load'));await play();
    await page.evaluate(()=>window.dispatchEvent(new Event('chordloom-pause')));await settle(180);
    assert((await state()).paused&&!(await state()).starting,'Background pause stops audio and pending renders.');
    await degree(6);await settle(120);assert((await state()).paused,'Background-stop intent survives further UI edits.');
    await play();await stopAndRemainStopped();assert.deepEqual(errors,[],'No uncaught browser errors');
    console.log('PASS: I–VII edits across built-in/factory/SF3 render non-silent advancing audio; stopped edits, rapid preparing edits, Stop/Play races, mute/volume/loop/lock state, global settings/variation, presets/banks, stale media/worker events, error recovery, sessions, invalid fonts and background pause.');
  }catch(error){console.error('Playback stage:',stage,'state:',await state().catch(()=>null));throw error;}
  finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>server.close());
