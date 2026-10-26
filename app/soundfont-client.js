(function(root){
'use strict';
class SoundFontClient{
constructor(){this.worker=null;this.jobs=new Map();this.nextId=1;}
ensure(){if(this.worker)return;if(typeof Worker==='undefined')throw Error('SoundFont playback needs browser worker support. Use Chrome or Edge; the built-in synth remains available.');const url=URL.createObjectURL(new Blob([root.ChordloomSFSource,'\n',root.ChordloomSFWorkerSource],{type:'text/javascript'}));try{this.worker=new Worker(url);}finally{URL.revokeObjectURL(url);}this.worker.onmessage=({data})=>{const job=this.jobs.get(data.id);if(!job)return;if(data.progress!==undefined){job.progress?.(data.progress);return;}this.jobs.delete(data.id);if(data.error)job.reject(Error(data.error));else job.resolve(data.result);};this.worker.onerror=event=>{const error=Error('SoundFont engine could not start: '+(event.message||'browser worker error')+'. The built-in synth is still available.');for(const job of this.jobs.values())job.reject(error);this.jobs.clear();this.worker.terminate();this.worker=null;this.onCrash?.(error);};}
request(type,payload={},transfer=[],progress){try{this.ensure();}catch(error){return Promise.reject(error);}const id=this.nextId++;return new Promise((resolve,reject)=>{this.jobs.set(id,{type,resolve,reject,progress});try{this.worker.postMessage({id,type,...payload},transfer);}catch(error){this.jobs.delete(id);reject(error);}});}
load(bankId,buffer){return this.request('load',{bankId,buffer},[buffer]);}
render(bankId,presetIndex,events,duration,progress){return this.request('render',{bankId,presetIndex,events,duration},[],progress);}
cancel(){if(!this.worker)return;for(const [id,job]of this.jobs){if(job.type==='render'){this.jobs.delete(id);job.reject(Error('Preview cancelled.'));}}this.worker.postMessage({type:'cancel'});}
unload(bankId){this.cancel();return this.request('unload',{bankId});}
dispose(){this.cancel();for(const job of this.jobs.values())job.reject(Error('SoundFont engine closed.'));this.jobs.clear();this.worker?.terminate();this.worker=null;}
}
root.ChordloomSoundFontClient=SoundFontClient;
})(globalThis);
