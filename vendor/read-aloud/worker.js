/* Local speech worker. Spellophone 0.2.1 / eSpeak NG 1.52.0 (GPL-3.0-or-later).
 * Synthesis and assets stay on this origin. This worker has no upload endpoint. */
import {createEspeak} from './browser.js';
const nativeFetch=self.fetch.bind(self),root=new URL('./',import.meta.url);
self.fetch=(resource,options={})=>{
 const url=new URL(typeof resource==='string'||resource instanceof URL?resource:resource.url,root);
 if(url.origin!==root.origin||!url.pathname.startsWith(root.pathname)||!['GET','HEAD'].includes(String(options.method||'GET').toUpperCase()))return Promise.reject(Error('Only local voice assets are allowed'));
 return nativeFetch(resource,options);
};
let engine=null,queue=Promise.resolve();
function ready(){if(!engine)engine=createEspeak({dataUrl:root,wasmUrl:new URL('espeak-ng.wasm',root),languages:['en']}).catch(error=>{engine=null;throw error});return engine}
self.addEventListener('message',event=>{
 const data=event.data||{};
 queue=queue.catch(()=>{}).then(async()=>{
  try{
   if(!Number.isSafeInteger(data.id)||!['en','zh','ms','ta'].includes(data.language)||typeof data.text!=='string'||data.text.length>1200)throw Error('Invalid speech request');
   const espeak=await ready();await espeak.loadVoice(({en:'en-gb',zh:'cmn',ms:'ms',ta:'ta'})[data.language]);
   const result=espeak.synthesize(data.text,{rate:Math.round(165*Math.max(.6,Math.min(1.4,Number(data.rate)||1))),ssml:false,phonemes:false});
   self.postMessage({id:data.id,samples:result.samples,sampleRate:result.sampleRate},[result.samples.buffer]);
  }catch(error){self.postMessage({id:data.id,error:String(error?.message||error)})}
 });
});
