(function(root){
'use strict';
class SoundFontClient{
constructor(){this.worker=null;this.jobs=new Map();this.nextId=1;}
failWorker(worker,error){
  if(this.worker!==worker)return;
  this.worker=null;
  for(const job of this.jobs.values())job.reject(error);
  this.jobs.clear();
  worker.terminate();
  this.onCrash?.(error);
}
ensure(){
  if(this.worker)return;
  if(typeof Worker==='undefined')throw Error('SoundFont playback needs browser worker support. The built-in synth remains available.');
  const url=URL.createObjectURL(new Blob([root.ChordloomSFSource,'\n',root.ChordloomSFWorkerSource],{type:'text/javascript'}));
  let worker;
  try{worker=new Worker(url);this.worker=worker;}finally{URL.revokeObjectURL(url);}
  worker.onmessage=({data})=>{
    if(this.worker!==worker)return;
    const job=this.jobs.get(data.id);if(!job)return;
    if(data.progress!==undefined){job.progress?.(data.progress);return;}
    this.jobs.delete(data.id);
    if(data.error)job.reject(Error(data.error));else job.resolve(data.result);
  };
  worker.onerror=event=>{
    if(this.worker!==worker)return;
    this.failWorker(worker,Error('SoundFont engine could not start: '+(event.message||'browser worker error')+'. The built-in synth is still available.'));
  };
  worker.onmessageerror=()=>this.failWorker(worker,Error('SoundFont engine returned an unreadable response. Press Play to retry, or choose the built-in synth.'));
}
request(type,payload={},transfer=[],progress){
  try{this.ensure();}catch(error){return Promise.reject(error);}
  const id=this.nextId++,worker=this.worker;
  return new Promise((resolve,reject)=>{
    this.jobs.set(id,{type,resolve,reject,progress});
    try{worker.postMessage({id,type,...payload},transfer);}catch(error){this.failWorker(worker,error);}
  });
}
load(bankId,buffer){return this.request('load',{bankId,buffer},[buffer]);}
render(bankId,presetIndex,events,duration,progress){return this.request('render',{bankId,presetIndex,events,duration},[],progress);}
cancel(){
  const worker=this.worker;if(!worker)return;
  for(const [id,job]of this.jobs){if(job.type==='render'){this.jobs.delete(id);job.reject(Error('Preview cancelled.'));}}
  try{worker.postMessage({type:'cancel'});}catch(error){this.failWorker(worker,error);}
}
unload(bankId){this.cancel();return this.request('unload',{bankId});}
dispose(){this.cancel();for(const job of this.jobs.values())job.reject(Error('SoundFont engine closed.'));this.jobs.clear();this.worker?.terminate();this.worker=null;}
}
root.ChordloomSoundFontClient=SoundFontClient;
})(globalThis);
