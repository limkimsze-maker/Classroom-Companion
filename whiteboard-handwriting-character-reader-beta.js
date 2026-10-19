/* Background CNN client with a yielding local fallback. */
(function(){
'use strict';
let worker=null,serial=0,epoch=0,active=null;
function abortError(){const e=new Error('Reading cancelled');e.name='AbortError';return e}
function cancel(){epoch++;worker?.terminate();worker=null;if(active){clearTimeout(active.timer);active.reject(abortError());active=null}}
function startWorker(images,mode,onProgress){
 return new Promise((resolve,reject)=>{
  if(!worker){const w=new Worker('whiteboard-handwriting-character-worker-beta.js?v=20261019-simulations1');worker=w;w.onmessage=e=>{if(worker!==w)return;const job=active;if(!job||e.data.id!==job.id)return;if(e.data.results||e.data.error){clearTimeout(job.timer);active=null;e.data.error?job.reject(Error(e.data.error)):job.resolve(e.data.results)}else job.progress?.(e.data.done,e.data.total)};w.onerror=()=>{if(worker!==w)return;const job=active;worker?.terminate();worker=null;if(job){clearTimeout(job.timer);active=null;job.reject(Error('The background reader could not start.'))}}}
  const id=++serial;active={id,resolve,reject,progress:onProgress,timer:setTimeout(()=>{if(active?.id!==id)return;worker?.terminate();worker=null;active=null;reject(Error('The background reader took too long.'))},18000+images.length*100)};
  worker.postMessage({id,images,mode});
 });
}
async function predictBatch(images,mode='auto',onProgress,signal){
 if(signal?.aborted)throw abortError();
 // Keep a completed worker and its decoded models alive between batches.
 // A new job still cancels any unfinished request, including a local fallback.
 if(active)cancel();else epoch++;
 const generation=epoch;
 const aborted=()=>{if(epoch===generation)cancel()};signal?.addEventListener('abort',aborted,{once:true});
 try{
 if(typeof Worker==='function')try{const result=await startWorker(images,mode,onProgress);if(epoch!==generation||signal?.aborted)throw abortError();return result}catch(error){if(error.name==='AbortError')throw error}
 const api=window.WhiteboardCharacterInference;if(!api)throw Error('The letter model is not ready. Refresh the page.');
 const result=[];for(let i=0;i<images.length;i++){
  await new Promise(resolve=>setTimeout(resolve,0));if(epoch!==generation||signal?.aborted)throw abortError();
  result.push(api.predict(images[i],mode));onProgress?.(i+1,images.length);
 }return result;
 }finally{signal?.removeEventListener('abort',aborted)}
}
window.WhiteboardCharacterReader={predictBatch,cancel};
})();
