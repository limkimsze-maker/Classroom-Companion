/* Same-origin pretrained MathWriting inference; no pen data leaves this worker. */
'use strict';
const base=new URL('vendor/handwriting/math/',self.location.href),nativeFetch=self.fetch.bind(self);
const assets=new Set(['encoder-u8.onnx','decoder_step.onnx','vocab.json','ort-wasm-simd.wasm','ort-wasm.wasm']);
self.fetch=(input,options)=>{const u=new URL(typeof input==='string'?input:input.url,self.location.href);if(u.origin!==base.origin||!u.href.startsWith(base.href)||!assets.has(u.pathname.split('/').pop())||options?.body||options?.method&&options.method!=='GET')return Promise.reject(Error('Only local math model files may be loaded.'));return nativeFetch(u.href,{method:'GET',credentials:'omit',redirect:'error',cache:'force-cache'})};
self.XMLHttpRequest=self.WebSocket=self.EventSource=undefined;
importScripts('vendor/handwriting/math/ort.wasm-1.18.0.min.js','whiteboard-handwriting-math-inference-beta.js?v=20261018-math-units1');
ort.env.wasm.numThreads=1;ort.env.wasm.proxy=false;ort.env.wasm.wasmPaths=base.href;ort.env.wasm.initTimeout=30000;
self.onmessage=async e=>{
 const {id,traces}=e.data||{};
 try{
  self.postMessage({id,progress:1});const input=WhiteboardMathInference.features(traces);
  const get=async name=>{const u=new URL(name,base);u.searchParams.set('v','20261018-math-units1');const r=await fetch(u.href);if(!r.ok)throw Error('The local math files could not load. Refresh and try again.');return r};
  const [eb,db,vocab]=await Promise.all([get('encoder-u8.onnx').then(r=>r.arrayBuffer()),get('decoder_step.onnx').then(r=>r.arrayBuffer()),get('vocab.json').then(r=>r.json())]);
  const options={executionProviders:['wasm'],graphOptimizationLevel:'all'},enc=await ort.InferenceSession.create(eb,options),dec=await ort.InferenceSession.create(db,options);
  try{const result=await WhiteboardMathInference.recognize(ort,enc,dec,Object.values(vocab).flat(),input,n=>self.postMessage({id,progress:n}));self.postMessage({id,result})}finally{await enc.release();await dec.release()}
 }catch(error){self.postMessage({id,error:error.message||'Could not read this expression. You can correct it below.'})}
};
