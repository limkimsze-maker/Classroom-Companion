/* Whole-expression reader. Pen strokes stay on this device. */
(function(){
'use strict';
let worker=null,active=null,serial=0;
function cancel(){serial++;if(worker)worker.terminate();worker=null;if(active){clearTimeout(active.timer);active.reject(Object.assign(Error('Reading cancelled'),{name:'AbortError'}));active=null}}
function traces(strokes,W,H){
 const groups=strokes.map(s=>s.points.filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)).map(p=>[p.x*W,p.y*H]));
 const pts=groups.flat();if(!pts.length)throw Error('Select some handwritten mathematics first.');
 const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),span=Math.max(1,Math.max(...ys)-Math.min(...ys)),distance=Math.max(.75,span/80),out=[];let t=0,count=0;
 for(const g of groups){if(!g.length)continue;const row=[[...g[0],t]];t+=8;
  for(let i=1;i<g.length;i++){const a=g[i-1],b=g[i],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/distance));if(count+row.length+n>4096)throw Error('Select a shorter mathematical expression.');for(let j=1;j<=n;j++){row.push([a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n,t]);t+=8}}
  count+=row.length;out.push(row);t+=80;
 }
 return out;
}
async function recognize(strokes,W,H,options={}){
 cancel();const id=serial,data=traces(strokes,W,H);if(typeof Worker!=='function')throw Error('Math reading needs a browser with Web Workers. You can still type and beautify a formula.');
 return new Promise((resolve,reject)=>{
  try{const w=worker=new Worker('whiteboard-handwriting-math-worker-beta.js?v=20261018-math-units1');
   active={resolve,reject,timer:setTimeout(()=>{if(worker===w){serial++;w.terminate();worker=null;active=null;reject(Error('Math reading took too long. Try a smaller selection or type the formula.'))}},90000)};
   w.onmessage=e=>{if(worker!==w||id!==serial)return;const m=e.data;if(m.id!==id)return;if(m.progress){options.onProgress?.(m.progress,150);return}clearTimeout(active.timer);active=null;w.terminate();worker=null;if(m.error)reject(Error(m.error));else resolve({text:m.result.text,tokens:[],uncertain:[{score:m.result.score}],engine:'local-mathwriting',format:'latex'})};
   w.onerror=()=>{if(worker!==w)return;clearTimeout(active?.timer);active=null;w.terminate();worker=null;reject(Error('The local math reader could not start. You can type a formula below.'))};
   w.postMessage({id,traces:data});
  }catch(e){clearTimeout(active?.timer);active=null;worker?.terminate();worker=null;reject(e)}
 });
}
window.WhiteboardMathReader=Object.freeze({recognize,cancel,traces});
})();
