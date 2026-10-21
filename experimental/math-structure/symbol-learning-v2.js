/* Reusable, supervised symbol examples and portable learning packs. V2 only.
 * No upload, neural-weight update, or inferred teacher label. */
(function(root){
'use strict';
const base=root.WhiteboardHandwritingLearning;if(!base||base.symbolLearningVersion)return;
const SYMBOLS='=+−×÷',KEY='whiteboard.handwriting.symbols.v1';
const CHAR_KEY='whiteboard.handwriting.examples.v1',INK_KEY='whiteboard.handwriting.ink-examples.v2';
const SCHEMA='classroom-handwriting-learning-v1',LIMIT=160,MAX_BYTES=2000000;
let memory=[],blocked=false,serial=0;
const normal=s=>String(s||'').replace(/\s/g,'').replace(/[＝]/g,'=').replace(/[‐‑–—-]/g,'−').replace(/\*/g,'×');
const box=ss=>{const ps=ss.flatMap(s=>s.points),xs=ps.map(p=>p.x),ys=ps.map(p=>p.y),x=Math.min(...xs),y=Math.min(...ys),w=Math.max(...xs)-x,h=Math.max(...ys)-y;return{x,y,w,h,cx:x+w/2,cy:y+h/2}};
const feature=p=>{if(!p||p.length!==784)return null;const scale=p.some(v=>v>1)?1/255:1;let f='',mass=0;for(let y=0;y<14;y++)for(let x=0;x<14;x++){const i=y*56+x*2,v=Math.max(0,Math.min(15,Math.round((p[i]+p[i+1]+p[i+28]+p[i+29])*scale*15/4)));if(!Number.isFinite(v))return null;f+=v.toString(16);mass+=v}return mass>10?f:null};
const distance=(a,b)=>{let ab=0,aa=0,bb=0;for(let i=0;i<196;i++){const x=parseInt(a[i],16),y=parseInt(b[i],16);ab+=x*y;aa+=x*x;bb+=y*y}return aa&&bb?1-ab/Math.sqrt(aa*bb):1};
const validFeature=f=>typeof f==='string'&&/^[0-9a-f]{196}$/.test(f);
const validPoints=ss=>Array.isArray(ss)&&ss.length>0&&ss.length<=3&&ss.every(s=>Array.isArray(s.points)&&s.points.length>0&&s.points.length<=64&&Number.isFinite(s.size)&&s.size>0&&s.size<=100&&s.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.y>=0&&p.x<=1&&p.y<=1));
const validSymbol=s=>s&&typeof s.id==='string'&&s.id.length<80&&SYMBOLS.includes(s.char)&&s.char.length===1&&validFeature(s.feature)&&Number.isFinite(s.aspect)&&s.aspect>=.005&&s.aspect<=1000&&validPoints(s.strokes);
function read(){if(blocked)return memory;try{const text=root.localStorage.getItem(KEY),data=text&&text.length<MAX_BYTES?JSON.parse(text):null;memory=data?.version===1&&Array.isArray(data.samples)?data.samples.filter(validSymbol).slice(-LIMIT):[]}catch{blocked=true}return memory}
function write(samples){memory=samples;try{root.localStorage.setItem(KEY,JSON.stringify({version:1,samples}));blocked=false}catch{blocked=true}}
function scaled(strokes,W,H){if(!Array.isArray(strokes)||strokes.length<1||strokes.length>3||!(W>0&&H>0)||strokes.some(s=>!s?.points?.length||s.points.length>16000||s.points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y))))return null;return strokes.map(s=>({size:Number(s.size)||4,points:s.points.map(p=>({x:p.x*W,y:p.y*H}))}))}
function horizontal(s){const b=box([s]);if(b.w<1)return false;let length=0;for(let i=1;i<s.points.length;i++)length+=Math.hypot(s.points[i].x-s.points[i-1].x,s.points[i].y-s.points[i-1].y);return b.h<=Math.max(1,b.w*.45)&&length<=b.w*1.9}
function geometry(ss,char){
 const b=box(ss),bs=ss.map(s=>box([s])),ink=Math.max(...ss.map(s=>s.size));
 if(char==='−')return ss.length===1&&horizontal(ss[0])&&b.w>=ink;
 if(char==='='){
  if(ss.length!==2)return false;const sep=Math.abs(bs[0].cy-bs[1].cy),long=bs[0].w>=bs[1].w?0:1,short=1-long;
  return horizontal(ss[long])&&(horizontal(ss[short])||Math.max(bs[short].w,bs[short].h)<=ink*1.4)&&sep>=Math.max(2,ink*.55)&&sep<=Math.max(b.w*2.8,ink*4)&&bs[short].cx>=bs[long].x-ink&&bs[short].cx<=bs[long].x+bs[long].w+ink;
 }
 if(char==='÷'){
  if(ss.length!==3)return false;const bar=ss.findIndex(horizontal);if(bar<0)return false;const q=bs[bar],dots=bs.filter((_,i)=>i!==bar);return dots.every(d=>Math.max(d.w,d.h)<=Math.max(ink*1.8,q.w*.32)&&Math.abs(d.cx-q.cx)<=Math.max(ink,q.w*.4))&&dots.some(d=>d.cy<q.cy-ink*.5)&&dots.some(d=>d.cy>q.cy+ink*.5);
 }
 if(ss.length!==2)return false;
 const line=ss.map(s=>{const a=s.points[0],z=s.points.at(-1);let travel=0;for(let i=1;i<s.points.length;i++)travel+=Math.hypot(s.points[i].x-s.points[i-1].x,s.points[i].y-s.points[i-1].y);return{a,z,dx:z.x-a.x,dy:z.y-a.y,straight:travel<=Math.hypot(z.x-a.x,z.y-a.y)*1.65}});
 if(line.some(l=>!l.straight))return false;const [a,c]=line,den=a.dx*c.dy-a.dy*c.dx;if(Math.abs(den)<.01)return false;
 const dx=c.a.x-a.a.x,dy=c.a.y-a.a.y,t=(dx*c.dy-dy*c.dx)/den,u=(dx*a.dy-dy*a.dx)/den;
 if(t<.12||t>.88||u<.12||u>.88)return false;
 return char==='+'?ss.some(horizontal)&&bs.some(q=>q.h>q.w*2):char==='×'&&line.every(l=>Math.abs(l.dx)>Math.abs(l.dy)*.18&&Math.abs(l.dy)>Math.abs(l.dx)*.18)&&a.dx*a.dy*c.dx*c.dy<0;
}
function describe(strokes,W,H,raster,char){
 const ss=scaled(strokes,W,H);if(!ss||!geometry(ss,char))return null;const b=box(ss),span=Math.max(1,b.w,b.h),f=feature(raster(ss));if(!f)return null;
 const trace=ss.map(s=>({size:Math.max(.001,Math.min(100,s.size/span)),points:Array.from({length:Math.min(64,s.points.length)},(_,i)=>{const p=s.points[Math.round(i*(s.points.length-1)/Math.max(1,Math.min(64,s.points.length)-1))];return{x:(p.x-b.x)/span,y:(p.y-b.y)/span}})}));
 return{char,feature:f,aspect:Math.max(.005,b.w/Math.max(1,b.h)),strokes:trace};
}
function extract(result,text,strokes){
 const desired=normal(text);if(desired.length===1&&SYMBOLS.includes(desired)&&strokes.length<=3)return{char:desired,strokes};
 const ts=result?.tokens;if(!Array.isArray(ts)||!ts.length||ts.some(t=>normal(t.char).length!==1||!t.parts?.length))return null;
 const old=ts.map(t=>normal(t.char)).join('');if(old!==normal(result.text))return null;
 const candidates=[];
 for(let i=0;i<ts.length;i++)for(let j=i+1;j<=Math.min(ts.length,i+3);j++)for(const char of SYMBOLS){
  if(old.slice(0,i)+char+old.slice(j)!==desired)continue;
  const ink=[...new Set(ts.slice(i,j).flatMap(t=>t.parts.map(p=>p.source)))];
  if(ink.length&&ink.length<=3&&ink.every(s=>strokes.includes(s)))candidates.push({char,strokes:ink});
 }
 // Never guess which repeated symbol the teacher meant to change.
 const distinct=candidates.filter((c,i)=>candidates.findIndex(q=>q.char===c.char&&q.strokes.length===c.strokes.length&&q.strokes.every(s=>c.strokes.includes(s)))===i);
 if(distinct.length===1)return distinct[0];
 // Digit/letter corrections may accompany the sign correction. Align runs
 // only when every operand retains its length and exactly one operator run
 // changes. This does not infer labels from an equation's arithmetic answer.
 const runs=value=>[...value.matchAll(/[=+−×÷]+|[0-9A-Za-z.]+/g)];
 const a=runs(old),b=runs(desired);if(a.map(m=>m[0]).join('')!==old||b.map(m=>m[0]).join('')!==desired||a.length!==b.length)return null;
 let changed=null;
 for(let k=0;k<a.length;k++){
  const op=SYMBOLS.includes(a[k][0][0]),other=SYMBOLS.includes(b[k][0][0]);if(op!==other)return null;
  if(!op){if(a[k][0].length!==b[k][0].length)return null;continue}
  if(a[k][0]===b[k][0])continue;
  if(changed||b[k][0].length!==1)return null;
  const ink=[...new Set(ts.slice(a[k].index,a[k].index+a[k][0].length).flatMap(t=>t.parts.map(p=>p.source)))];
  if(!ink.length||ink.length>3||ink.some(s=>!strokes.includes(s)))return null;
  changed={char:b[k][0],strokes:ink};
 }
 return changed;
}
function teach(result,text,raster,strokes,W,H,mode){
 if(mode!=='auto')return null;const target=extract(result,text,strokes);if(!target)return null;
 const sample=describe(target.strokes,W,H,raster,target.char);if(!sample)return null;const previous=read().slice();
 if(previous.some(s=>s.char===sample.char&&s.feature===sample.feature&&s.strokes.length===sample.strokes.length&&Math.abs(Math.log(s.aspect/sample.aspect))<.01))return null;
 const added={...sample,id:'symbol-'+Date.now().toString(36)+'-'+(++serial).toString(36)},all=[...previous,added],kept=all.slice(-LIMIT);write(kept);
 return{added:[added.id],removed:previous.filter(s=>!kept.includes(s)),count:1,char:sample.char,persistent:!blocked};
}
function undoSymbols(tx){if(!tx?.added?.length)return;const ids=new Set(tx.added),samples=read().filter(s=>!ids.has(s.id)),seen=new Set(samples.map(s=>s.id));write([...(tx.removed||[]).filter(s=>validSymbol(s)&&!seen.has(s.id)),...samples].slice(-LIMIT))}
function match(strokes,W,H,raster,samples){
 const ss=scaled(strokes,W,H);if(!ss)return null;const b=box(ss),aspect=Math.max(.005,b.w/Math.max(1,b.h));let f;const ranked=[];
 for(const s of samples){if(s.strokes.length!==ss.length||Math.abs(Math.log(s.aspect/aspect))>(s.char==='÷'?.65:.24)||!geometry(ss,s.char))continue;if(!f)f=feature(raster(ss));if(f)ranked.push({s,d:distance(f,s.feature)})}
 ranked.sort((a,b)=>a.d-b.d);const best=ranked[0];if(!best||best.d>(best.s.char==='÷'?.13:.065)||ranked.some(q=>q.s.char!==best.s.char&&q.d-best.d<.025))return null;
 return{char:best.s.char,score:Math.max(.86,.99-best.d),personal:true,engine:'local-personal-symbol-v2'};
}
function propose(strokes,W,H,mode,raster){
 if(mode!=='auto'||!Array.isArray(strokes)||strokes.length>180||!strokes.length)return[];const samples=read();if(!samples.length)return[];
 const sizes=new Set(samples.map(s=>s.strokes.length)),marks=strokes.map((s,i)=>({i,b:box([{points:s.points.map(p=>({x:p.x*W,y:p.y*H}))}])})),out=[];let examined=0;
 for(const p of marks){
  const near=marks.filter(q=>q.i>p.i&&Math.abs(q.b.cx-p.b.cx)<=Math.max(p.b.w,q.b.w,8)*.8&&Math.abs(q.b.cy-p.b.cy)<=Math.max(p.b.w,p.b.h,q.b.w,q.b.h,12)*3).slice(0,10);
  const groups=[];if(sizes.has(1))groups.push([p]);if(sizes.has(2))for(const q of near)groups.push([p,q]);if(sizes.has(3))for(let i=0;i<near.length;i++)for(let j=i+1;j<near.length;j++)groups.push([p,near[i],near[j]]);
  for(const group of groups){
   if(++examined>2500)return[];const indices=group.map(q=>q.i),ink=indices.map(i=>strokes[i]),b=box(scaled(ink,W,H));
   // An omitted dot/mark in the same column is evidence of another symbol.
   const pad=Math.max(4,b.h*.85,b.w*.45);
   if(marks.some(q=>!indices.includes(q.i)&&q.b.cx>=b.x-pad*.3&&q.b.cx<=b.x+b.w+pad*.3&&q.b.y<=b.y+b.h+pad&&q.b.y+q.b.h>=b.y-pad))continue;
   let token=match(ink,W,H,raster,samples);
   // A taught three-stroke division sign can be missed by raster similarity.
   // Only recover an unambiguous bar-between-two-dots geometry; the surrounding
   // reader must still validate separate numeric operands before accepting it.
   if(!token&&ink.length===3&&samples.some(sample=>sample.char==='÷'&&sample.strokes.length===3)){
    const scaledInk=scaled(ink,W,H);
    if(geometry(scaledInk,'÷')){
     const parts=scaledInk.map(t=>box([t]));const bar=scaledInk.findIndex(horizontal);
     const line=parts[bar],dots=parts.filter((_,i)=>i!==bar);
     if(line.w>=Math.max(12,Math.max(...scaledInk.map(t=>t.size))*2.5)&&
        dots.every(d=>Math.max(d.w,d.h)<=Math.max(8,line.w*.20))&&
        dots.every(d=>Math.abs(d.cx-line.cx)<=line.w*.22)&&
        dots.some(d=>d.cy<line.cy)&&dots.some(d=>d.cy>line.cy))
      token={char:'÷',score:.88,personal:true,engine:'local-personal-symbol-geometry-v2'};
    }
   }
   if(token)out.push({indices,token:{...token,x:b.x,parts:scaled(ink,W,H).map((s,i)=>({...s,source:ink[i]}))},box:b});
  }
 }
 const used=new Set();return out.sort((a,b)=>b.token.score-a.token.score).filter(p=>{if(p.indices.some(i=>used.has(i)))return false;p.indices.forEach(i=>used.add(i));return true}).sort((a,b)=>a.box.cx-b.box.cx);
}
const validChar=s=>s&&typeof s.id==='string'&&s.id.length<80&&typeof s.char==='string'&&/^[0-9A-Za-z]$/.test(s.char)&&validFeature(s.feature);
const validInk=s=>s&&typeof s.id==='string'&&s.id.length<80&&typeof s.text==='string'&&s.text.trim().length>0&&s.text.length<=180&&!/[\u0000-\u001f\u007f]/.test(s.text)&&['auto','math','lowercase','uppercase','digits'].includes(s.mode)&&validFeature(s.feature)&&Number.isInteger(s.n)&&s.n>0&&s.n<=180&&Number.isFinite(s.aspect)&&s.aspect>.005&&s.aspect<1000&&(!('raw'in s)||typeof s.raw==='string'&&s.raw.length<=180);
function stored(key,version,valid,limit){try{const text=root.localStorage.getItem(key),p=text&&text.length<MAX_BYTES?JSON.parse(text):null;return p?.version===version&&Array.isArray(p.samples)?p.samples.filter(valid).slice(-limit):[]}catch{return[]}}
const cleanChar=s=>({id:s.id,char:s.char,feature:s.feature});
const cleanInk=s=>({id:s.id,text:s.text,mode:s.mode,feature:s.feature,n:s.n,aspect:s.aspect,...(typeof s.raw==='string'?{raw:s.raw}:{})});
const cleanSymbol=s=>({id:s.id,char:s.char,feature:s.feature,aspect:s.aspect,strokes:s.strokes.map(t=>({size:t.size,points:t.points.map(p=>({x:p.x,y:p.y}))}))});
function exportPack(){return{schema:SCHEMA,version:1,createdAt:new Date().toISOString(),symbols:read().map(cleanSymbol),characters:stored(CHAR_KEY,1,validChar,360).map(cleanChar),selections:stored(INK_KEY,2,validInk,120).map(cleanInk)}}
function validatePack(input){
 const text=typeof input==='string'?input:JSON.stringify(input);if(text.length>MAX_BYTES)throw Error('Learning file is too large.');let p;try{p=JSON.parse(text)}catch{throw Error('Choose a valid learning JSON file.')}
 if(p?.schema!==SCHEMA||p.version!==1||!Array.isArray(p.symbols)||!Array.isArray(p.characters)||!Array.isArray(p.selections)||p.symbols.length>LIMIT||p.characters.length>360||p.selections.length>120||!p.symbols.every(validSymbol)||!p.characters.every(validChar)||!p.selections.every(validInk))throw Error('This file is not a supported learning export.');
 return{symbols:p.symbols.map(cleanSymbol),characters:p.characters.map(cleanChar),selections:p.selections.map(cleanInk)};
}
function importPack(input){
 const p=validatePack(input),old=exportPack(),before=[CHAR_KEY,INK_KEY,KEY].map(k=>root.localStorage.getItem(k));let added=0,skipped=0;
 const merge=(local,incoming,key,limit)=>{const existing=new Set(local.map(key)),out=[];for(const s of incoming){const k=key(s);if(existing.has(k)||out.length+local.length>=limit){skipped++;continue}existing.add(k);out.push({...s,id:'import-'+Date.now().toString(36)+'-'+(++serial).toString(36)});added++}return[...out,...local]};
 // Local examples take precedence over imported examples of the exact shape.
 const chars=merge(old.characters,p.characters,s=>s.feature,360),selections=merge(old.selections,p.selections,s=>s.mode+':'+s.feature+':'+s.n+':'+s.aspect,120),symbols=merge(old.symbols,p.symbols,s=>s.feature+':'+s.strokes.length+':'+s.aspect,LIMIT);
 const after=[JSON.stringify({version:1,samples:chars}),JSON.stringify({version:2,samples:selections}),JSON.stringify({version:1,samples:symbols})],keys=[CHAR_KEY,INK_KEY,KEY];
 try{keys.forEach((k,i)=>root.localStorage.setItem(k,after[i]))}catch{keys.forEach((k,i)=>{try{if(before[i]===null)root.localStorage.removeItem(k);else root.localStorage.setItem(k,before[i])}catch{}});throw Error('Browser storage could not save the import. Existing learning was retained where storage allowed.');}
 memory=symbols;blocked=false;return{added,skipped};
}
const confirm=base.confirm,undo=base.undo,info=base.info;
base.confirm=function(result,text,raster,strokes,W,H,mode='auto'){
 const symbols=teach(result,text,raster,strokes||[],W,H,mode),tx=confirm.apply(this,arguments);if(!symbols)return tx;
 return{...(tx||{}),symbols,count:(tx?.count||0)+symbols.count,persistent:(tx?.persistent??true)&&symbols.persistent};
};
base.undo=function(tx){undo.apply(this,arguments);undoSymbols(tx?.symbols)};
base.info=function(){return{...info(),symbolExamples:read().length,symbolPersistent:!blocked}};
Object.assign(base,{symbolLearningVersion:1,proposeSymbols:propose,exportPack,validatePack,importPack});
})(typeof window==='undefined'?globalThis:window);
