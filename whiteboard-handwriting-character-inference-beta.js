/* Pure local EMNIST CNN inference. Works in a dedicated Worker or without one. */
(function(root){
'use strict';
const decoded=new Map();
function model(name){
 if(decoded.has(name))return decoded.get(name);
 const raw=globalThis.WhiteboardCharacterModels?.[name];if(!raw)throw Error('Letter recognition has not loaded. Refresh the page.');
 const m={labels:raw.labels,layers:raw.layers.map(l=>{
  if(!l.weights)return l;
  const bytes=atob(l.weights),count=l.shape.at(-1),weights=new Float32Array(bytes.length);
  for(let i=0;i<bytes.length;i++){let v=bytes.charCodeAt(i);if(v>127)v-=256;weights[i]=v*l.scales[i%count]}
  return{...l,w:weights};
 })};decoded.set(name,m);return m;
}
function forward(pixels,name){
 const m=model(name),scale=pixels.some(v=>v>1)?1/255:1;
 let input=Float32Array.from(pixels,v=>Math.max(0,Math.min(1,v*scale))),H=28,W=28,C=1;
 for(const l of m.layers){
  if(l.type==='conv'){
   const [K,,IC,OC]=l.shape,S=l.stride,pad=l.pad==='same'?Math.floor(K/2):0,OH=Math.floor((H+pad*2-K)/S)+1,OW=Math.floor((W+pad*2-K)/S)+1,out=new Float32Array(OH*OW*OC),w=l.w;
   // Four adjacent output channels share the same input reads.
   for(let y=0;y<OH;y++)for(let x=0;x<OW;x++)for(let co=0;co<OC;co+=4){
    let a=l.bias[co],b=l.bias[co+1],c=l.bias[co+2],d=l.bias[co+3];
    for(let ky=0;ky<K;ky++){const iy=y*S+ky-pad;if(iy<0||iy>=H)continue;
     for(let kx=0;kx<K;kx++){const ix=x*S+kx-pad;if(ix<0||ix>=W)continue;
      let ii=(iy*W+ix)*IC,wi=((ky*K+kx)*IC)*OC+co;
      for(let ci=0;ci<IC;ci++,ii++,wi+=OC){const v=input[ii];if(!v)continue;a+=v*w[wi];b+=v*w[wi+1];c+=v*w[wi+2];d+=v*w[wi+3]}
     }
    }
    const oi=(y*OW+x)*OC+co;out[oi]=a;out[oi+1]=b;out[oi+2]=c;out[oi+3]=d;
   }
   input=out;H=OH;W=OW;C=OC;
  }else if(l.type==='relu'){for(let i=0;i<input.length;i++)input[i]=Math.max(0,input[i])}
  else if(l.type==='affine'){for(let i=0;i<input.length;i++)input[i]=input[i]*l.scale[i%C]+l.bias[i%C]}
  else if(l.type==='pool'){
   const S=l.stride,K=l.size,OH=l.pad==='same'?Math.ceil(H/S):Math.floor((H-K)/S)+1,OW=l.pad==='same'?Math.ceil(W/S):Math.floor((W-K)/S)+1,pY=l.pad==='same'?Math.floor(Math.max(0,(OH-1)*S+K-H)/2):0,pX=l.pad==='same'?Math.floor(Math.max(0,(OW-1)*S+K-W)/2):0,out=new Float32Array(OH*OW*C);out.fill(-Infinity);
   for(let y=0;y<OH;y++)for(let x=0;x<OW;x++)for(let ky=0;ky<K;ky++){const iy=y*S+ky-pY;if(iy<0||iy>=H)continue;for(let kx=0;kx<K;kx++){const ix=x*S+kx-pX;if(ix<0||ix>=W)continue;const ii=(iy*W+ix)*C,oi=(y*OW+x)*C;for(let c=0;c<C;c++)out[oi+c]=Math.max(out[oi+c],input[ii+c])}}
   input=out;H=OH;W=OW;
  }else if(l.type==='avg'){
   const out=new Float32Array(C);for(let i=0;i<input.length;i++)out[i%C]+=input[i]/(H*W);input=out;H=W=1;
  }else if(l.type==='flatten'){H=W=1;C=input.length}
  else if(l.type==='dense'){
   const [IC,OC]=l.shape,out=Float32Array.from(l.bias);for(let i=0;i<IC;i++){const v=input[i];if(!v)continue;for(let j=0;j<OC;j++)out[j]+=v*l.w[i*OC+j]}input=out;C=OC;
  }
 }
 const max=Math.max(...input),probs=Array.from(input,v=>Math.exp(v-max)),sum=probs.reduce((a,b)=>a+b,0);
 return probs.map((p,i)=>({char:m.labels[i],score:p/sum})).sort((a,b)=>b.score-a.score);
}
function resizeView(pixels,sx,sy,thicken){
 const out=new Float32Array(784);
 for(let y=0;y<28;y++)for(let x=0;x<28;x++){
  const px=(x-13.5)/sx+13.5,py=(y-13.5)/sy+13.5,ix=Math.floor(px),iy=Math.floor(py),fx=px-ix,fy=py-iy;let v=0;
  for(let j=0;j<2;j++)for(let i=0;i<2;i++)if(ix+i>=0&&ix+i<28&&iy+j>=0&&iy+j<28)v+=pixels[(iy+j)*28+ix+i]*(i?fx:1-fx)*(j?fy:1-fy);
  out[y*28+x]=v;
 }
 if(thicken){const copy=out.slice();for(let y=1;y<27;y++)for(let x=1;x<27;x++){const i=y*28+x;out[i]=Math.max(copy[i],copy[i-1]*.45,copy[i+1]*.45,copy[i-28]*.45,copy[i+28]*.45)}}return out;
}
function predict(pixels,mode='auto',variations=true){
 if(!pixels||pixels.length!==784||pixels.some(v=>!Number.isFinite(v)))throw Error('Invalid character image.');
 const factor=pixels.some(v=>v>1)?1/255:1,normalized=Float32Array.from(pixels,v=>v*factor),name=mode==='lowercase'||mode==='uppercase'?'letters':'mixed';
 let choices=forward(normalized,name);
 if(variations&&choices[0].score<.8){
  const alternate=forward(resizeView(normalized,.94,1.04,true),name),score=new Map(choices.map(c=>[c.char,c.score*.65]));for(const c of alternate)score.set(c.char,(score.get(c.char)||0)+c.score*.35);choices=[...score].map(([char,score])=>({char,score})).sort((a,b)=>b.score-a.score);
 }
 if(mode==='lowercase')choices=choices.map(c=>({...c,char:c.char.toLowerCase()}));
 return choices;
}
root.WhiteboardCharacterInference={predict,forward,resizeView};
})(typeof window==='undefined'?self:window);
