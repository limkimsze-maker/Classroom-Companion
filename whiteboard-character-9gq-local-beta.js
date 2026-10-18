/* Local, opt-in supervised prototype matcher for the 9/g/q practice sheet.
   The original handwriting is imported and stored on-device only.
   NOT a retraining of UJI, EMNIST, or ink-on neural weights. */
(function(root){
'use strict';
const KEY='classroom.private.9gq.prototypes.v1';
let prototypes=[];
function feature(strokes,W,H){
 if(!Array.isArray(strokes)||!strokes.length||!(W>0)||!(H>0))return null;
 const paths=[],all=[];
 for(const s of strokes){
  if(!Array.isArray(s.points)||s.points.length<2)return null;
  const path=s.points.map(p=>({x:p.x*W,y:p.y*H}));
  if(path.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))return null;
  paths.push(path);all.push(...path);
 }
 const x0=Math.min(...all.map(p=>p.x)),x1=Math.max(...all.map(p=>p.x));
 const y0=Math.min(...all.map(p=>p.y)),y1=Math.max(...all.map(p=>p.y));
 const w=x1-x0,h=y1-y0;if(w<5||h<9)return null;
 const aspect=w/h;if(aspect<.11||aspect>2.7)return null;
 const cells=new Float32Array(256),scale=13/Math.max(w,h),ox=(16-w*scale)/2,oy=(16-h*scale)/2;
 for(const path of paths)for(let i=1;i<path.length;i++){
  const a=path[i-1],b=path[i],steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)*scale*2));
  for(let t=0;t<=steps;t++){
   const v=t/steps,x=ox+(a.x+(b.x-a.x)*v-x0)*scale,y=oy+(a.y+(b.y-a.y)*v-y0)*scale;
   const cx=Math.max(0,Math.min(15,Math.round(x))),cy=Math.max(0,Math.min(15,Math.round(y)));
   cells[cy*16+cx]=1;
  }
 }
 // A one-cell dilation makes matching tolerant to small tablet coordinate changes.
 const smooth=new Float32Array(256);
 for(let y=0;y<16;y++)for(let x=0;x<16;x++)if(cells[y*16+x]){
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
   const xx=x+dx,yy=y+dy;if(xx>=0&&xx<16&&yy>=0&&yy<16)
    smooth[yy*16+xx]=Math.max(smooth[yy*16+xx],dx===0&&dy===0?1:.45);
  }
 }
 let norm=0;for(const v of smooth)norm+=v*v;
 if(norm<2)return null;
 return{values:Array.from(smooth,v=>Math.round(v*9)),aspect,n:strokes.length};
}
function distance(a,b){
 if(!a||!b||Math.abs(Math.log(a.aspect/b.aspect))>.68)return Infinity;
 let dot=0,aa=0,bb=0;for(let i=0;i<256;i++){
  const x=a.values[i],y=b.values[i];dot+=x*y;aa+=x*x;bb+=y*y;
 }
 return aa&&bb?1-dot/Math.sqrt(aa*bb)+.08*Math.abs(Math.log(a.aspect/b.aspect)):Infinity;
}
function validate(obj){
 if(obj?.schema!=='classroom-character-samples-v1'||!Array.isArray(obj.samples)||obj.samples.length>350)return null;
 const chosen=[];
 for(const s of obj.samples){
  if(!['9','g','q'].includes(s?.label)||!Array.isArray(s.strokes)||s.strokes.length>6)continue;
  const f=feature(s.strokes,s.canvas?.width,s.canvas?.height);
  if(f)chosen.push({label:s.label,...f});
 }
 return chosen;
}
function load(){
 try{const p=JSON.parse(localStorage.getItem(KEY)||'null');
  if(p?.version===1&&Array.isArray(p.samples))
   prototypes=p.samples.filter(s=>['9','g','q'].includes(s?.label)&&Array.isArray(s.values)&&s.values.length===256&&
    Number.isFinite(s.aspect)&&Number.isFinite(s.n)).slice(0,350);
 }catch{prototypes=[]}
}
function importExamples(json){
 const samples=validate(json);
 if(!samples?.length)throw Error('No valid labelled 9/g/q samples in this JSON.');
 const byLabel={};for(const s of samples)byLabel[s.label]=(byLabel[s.label]||0)+1;
 if(!['9','g','q'].every(label=>(byLabel[label]||0)>=3))throw Error('Please include at least three valid examples of each character.');
 localStorage.setItem(KEY,JSON.stringify({version:1,samples}));
 prototypes=samples;
 return{count:samples.length,byLabel};
}
function match(strokes,W,H,mode){
 if(!prototypes.length||!['auto','digits','lowercase'].includes(mode))return null;
 const q=feature(strokes,W,H);if(!q)return null;
 // Prevent a whole equation from being replaced with one character.
 if(q.n>3)return null;
 const ranked=prototypes.map(p=>({label:p.label,d:distance(q,p)})).filter(x=>Number.isFinite(x.d)).sort((a,b)=>a.d-b.d);
 if(!ranked.length)return null;
 const best=ranked[0],competition=ranked.find(x=>x.label!==best.label);
 // Conservative: class must have at least two nearby exemplars, plus a clear
 // distance margin over other classes. Ambiguous handwriting falls back.
 const support=ranked.filter(x=>x.label===best.label&&x.d<best.d+.055).length;
 if(best.d>.085||support<2||(competition&&competition.d-best.d<.035))return null;
 if(mode==='digits'&&best.label!=='9'||mode==='lowercase'&&best.label==='9')return null;
 return{text:best.label,tokens:[],uncertain:[],engine:'local-teacher-9gq',format:'personal'};
}
function init(){
 const btn=document.createElement('button');btn.type='button';btn.textContent='Import 9/g/q samples';
 btn.title='Import your labelled 9, g and q examples. Samples remain in this browser only.';
 btn.style.cssText='font-size:12px;padding:6px 9px;margin:4px;max-width:170px;white-space:normal';
 const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.hidden=true;
 btn.onclick=()=>input.click();
 input.onchange=async()=>{
  const f=input.files?.[0];if(!f)return;
  try{
   if(f.size>2_000_000)throw Error('Training file is too large.');
   const n=importExamples(JSON.parse(await f.text()));
   btn.textContent='9/g/q loaded ('+n.count+')';
   alert('Imported '+n.count+' labelled examples locally. 9: '+(n.byLabel['9']||0)+', g: '+(n.byLabel.g||0)+', q: '+(n.byLabel.q||0)+'.');
  }catch(e){alert('Could not import samples: '+(e?.message||e))}
  input.value='';
 };
 if(prototypes.length)btn.textContent='9/g/q loaded ('+prototypes.length+')';
 const anchor=document.getElementById('handwritingBeautifyBtn');
 if(anchor?.parentNode){anchor.insertAdjacentElement('afterend',btn);btn.insertAdjacentElement('afterend',input)}
 else{document.body.append(btn,input)}
}
load();
root.WhiteboardCharacter9GQ=Object.freeze({feature,match,importExamples,info:()=>({count:prototypes.length})});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})(window);
