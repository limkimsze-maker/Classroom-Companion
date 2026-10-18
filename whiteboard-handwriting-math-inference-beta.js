/* Stroke features and cached decoding adapted from Hand-to-TeX (MIT).
   See vendor/handwriting/math/NOTICE.md. No network access in this module. */
(function(root){
'use strict';
const EPS=1e-6;
function features(traces){
 const pts=traces.flat();if(!pts.length||pts.length>4096||pts.some(p=>p.length<3||p.some(v=>!Number.isFinite(v))))throw Error('Select a shorter mathematical expression.');
 let minX=Infinity,minY=Infinity,minT=Infinity,maxX=-Infinity,maxY=-Infinity,maxT=-Infinity;
 for(const [x,y,t]of pts){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);minT=Math.min(minT,t);maxT=Math.max(maxT,t)}
 const xy=Math.max(maxX-minX,maxY-minY)+EPS,tt=maxT-minT+EPS,yy=maxY-minY+EPS,rows=[];
 for(const trace of traces){
  if(!trace.length)continue;
  const ys=trace.map(p=>p[1]),lo=Math.min(...ys),hi=Math.max(...ys),yc=((lo+hi)/2-minY)/yy,yspan=(hi-lo)/yy;
  let prevSpeed=0,prevUx=0,prevUy=0;
  for(let i=0;i<trace.length;i++){
   const p=trace[i],q=trace[i-1],x=(p[0]-minX)/xy,y=(p[1]-minY)/xy,t=(p[2]-minT)/tt;
   const dx=i?(p[0]-q[0])/xy:0,dy=i?(p[1]-q[1])/xy:0,dt=i?(p[2]-q[2])/tt:0,d=Math.hypot(dx,dy),speed=dt>EPS?d/dt:0,ux=d>EPS?dx/d:0,uy=d>EPS?dy/d:0;
   const curve=i>1&&d>EPS?Math.atan2(prevUx*uy-prevUy*ux,prevUx*ux+prevUy*uy)/d:0,acc=i&&dt>EPS?(speed-prevSpeed)/dt:0;
   rows.push([x,y,t,dx,dy,dt,speed,curve,acc,i?0:1,yc,yspan]);prevSpeed=speed;prevUx=ux;prevUy=uy;
  }
 }
 for(const c of [3,4,5,6,7,8]){const mean=rows.reduce((s,r)=>s+r[c],0)/rows.length,sd=Math.sqrt(rows.reduce((s,r)=>s+(r[c]-mean)**2,0)/rows.length)+EPS;for(const r of rows)r[c]=Math.max(-5,Math.min(5,(r[c]-mean)/sd))}
 return{data:Float32Array.from(rows.flat()),count:rows.length};
}
function dispose(values){for(const t of Object.values(values||{}))t?.dispose?.()}
async function recognize(ort,encoder,decoder,vocab,input,onProgress){
 const src=new ort.Tensor('float32',input.data,[1,input.count,12]),lengths=new ort.Tensor('int64',BigInt64Array.of(BigInt(input.count)),[1]);let enc,k,v;
 try{
  enc=await encoder.run({src,src_lengths:lengths});const mk=enc.mem_k,mv=enc.mem_v,mask=enc.mem_mask,shape=[mk.dims[0],1,mk.dims[2],0,mk.dims[4]];
  k=new ort.Tensor('float32',new Float32Array(0),shape);v=new ort.Tensor('float32',new Float32Array(0),shape);
  let last=vocab.indexOf('<SOS>');const eos=vocab.indexOf('<EOS>'),ids=[],scores=[],start=Date.now();
  for(let i=0;i<150;i++){
   if(Date.now()-start>45000)throw Error('This expression took too long. Select a smaller part and try again.');
   const token=new ort.Tensor('int64',BigInt64Array.of(BigInt(last)),[1,1]),step=new ort.Tensor('int64',BigInt64Array.of(BigInt(i)),[1]);let out;
   try{out=await decoder.run({tgt_last:token,step,self_k:k,self_v:v,mem_k:mk,mem_v:mv,memory_key_padding_mask:mask})}finally{token.dispose();step.dispose()}
   k.dispose();v.dispose();k=out.self_k_out;v=out.self_v_out;
   const data=out.logits.data;let best=0;for(let j=1;j<data.length;j++)if(data[j]>data[best])best=j;
   const max=data[best];let sum=0;for(const x of data)sum+=Math.exp(x-max);const probability=1/sum;out.logits.dispose();
   if(best===eos){if(!ids.length)throw Error('Could not read this expression. You can correct it below.');return{text:ids.map(i=>vocab[i]+(/^\\[a-zA-Z]+$/.test(vocab[i])?' ':'')).join('').trim(),score:Math.exp(scores.reduce((s,p)=>s+Math.log(Math.max(EPS,p)),0)/scores.length),ids}}
   if(best<4||!vocab[best])throw Error('Could not read this expression. You can correct it below.');
   ids.push(best);scores.push(probability);last=best;if(i%5===0)onProgress?.(i+1);
  }
  throw Error('The reading was incomplete. Select a shorter expression or correct it below.');
 }finally{src.dispose();lengths.dispose();k?.dispose();v?.dispose();dispose(enc)}
}
root.WhiteboardMathInference=Object.freeze({features,recognize});
})(typeof window==='undefined'?globalThis:window);
