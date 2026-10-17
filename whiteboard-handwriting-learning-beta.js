/* Personal digit and letter examples, kept on this browser. Confirmation is the only teacher. */
(function(){
'use strict';
const KEY='whiteboard.handwriting.examples.v1',LIMIT=360,PER_CHARACTER=18;
let memory=[],cachedRaw,blocked=false,serial=0;
const valid=s=>s&&typeof s.id==='string'&&s.id.length>0&&s.id.length<80&&typeof s.char==='string'&&/^[0-9A-Za-z]$/.test(s.char)&&typeof s.feature==='string'&&/^[0-9a-f]{196}$/.test(s.feature);
function read(){
 if(blocked)return memory;
 let raw;try{raw=localStorage.getItem(KEY)}catch{blocked=true;return memory}
 if(raw===cachedRaw)return memory;cachedRaw=raw;
 try{const data=raw&&raw.length<150000?JSON.parse(raw):null;memory=data?.version===1&&Array.isArray(data.samples)?data.samples.filter(valid).slice(-LIMIT):[]}catch{memory=[]}
 return memory;
}
function write(samples){
 memory=samples;const raw=JSON.stringify({version:1,samples});
 try{localStorage.setItem(KEY,raw);cachedRaw=raw;blocked=false}catch{blocked=true}
}
function feature(pixels){
 if(!pixels||pixels.length!==784)return null;
 let out='',mass=0;const scale=pixels.some(v=>v>1)?1/255:1;
 for(let y=0;y<14;y++)for(let x=0;x<14;x++){
  const p=y*56+x*2,v=Math.max(0,Math.min(15,Math.round((pixels[p]+pixels[p+1]+pixels[p+28]+pixels[p+29])*scale*15/4)));
  if(!Number.isFinite(v))return null;out+=v.toString(16);mass+=v;
 }
 return mass>10?out:null;
}
function effective(samples){const map=new Map();for(const s of samples)map.set(s.feature,s);return[...map.values()]}
function distance(a,b){let dot=0,aa=0,bb=0;for(let i=0;i<196;i++){const x=parseInt(a[i],16),y=parseInt(b[i],16);dot+=x*y;aa+=x*x;bb+=y*y}return aa&&bb?1-dot/Math.sqrt(aa*bb):1}
function match(pixels){
 const samples=effective(read());if(!samples.length)return null;
 const f=feature(pixels);if(!f)return null;
 const ranked=samples.map(s=>({char:s.char,distance:distance(f,s.feature)})).sort((a,b)=>a.distance-b.distance),best=ranked[0],other=ranked.find(s=>s.char!==best.char),margin=(other?.distance??1)-best.distance;
 // A close personal example may override the base model; distant or conflicting ones cannot.
 if(best.distance>.08||margin<(best.distance<.012?.006:.035))return null;
 return{char:best.char,score:Math.max(.86,.98-best.distance),personal:true};
}
function canonical(text){return String(text).replace(/\s/g,'').replace(/[‐‑–—−]/g,'−').replace(/\*/g,'×').replace(/\//g,'÷')}
function confirm(result,text,raster){
 const original=result?.tokens;if(!Array.isArray(original)||typeof raster!=='function')return null;
 const tokens=original.slice();if(tokens.at(-1)?.char==='=')tokens.pop();
 const corrected=Array.from(canonical(text).replace(/=$/,''));
 const teachable=(t,char)=>/^[0-9A-Za-z]$/.test(char)&&!['.','$','=','÷'].includes(t.char)&&t.parts?.length;
 if(tokens.length!==corrected.length||tokens.some((t,i)=>!teachable(t,corrected[i])&&canonical(t.char)!==corrected[i]))return null;
 const candidates=[];
 for(let i=0;i<tokens.length;i++)if(teachable(tokens[i],corrected[i])){
  const f=feature(raster(tokens[i].parts));if(f)candidates.push({char:corrected[i],feature:f});
 }
 // Identical shapes assigned different labels in one review are ambiguous: skip those shapes.
 const ambiguous=new Set(candidates.filter(a=>candidates.some(b=>a.feature===b.feature&&a.char!==b.char)).map(a=>a.feature));
 const samples=read().slice(),latest=new Map(effective(samples).map(s=>[s.feature,s])),added=[];
 for(const c of candidates){
  if(ambiguous.has(c.feature)||latest.get(c.feature)?.char===c.char)continue;
  const s={...c,id:Date.now().toString(36)+'-'+(++serial).toString(36)+'-'+Math.random().toString(36).slice(2,10)};
  samples.push(s);latest.set(s.feature,s);added.push(s.id);
 }
 if(!added.length)return null;
 const all=samples.slice();
 for(let i=samples.length-1,counts={};i>=0;i--){const s=samples[i];counts[s.char]=(counts[s.char]||0)+1;if(counts[s.char]>PER_CHARACTER)samples.splice(i,1)}
 while(samples.length>LIMIT)samples.shift();
 const removed=all.filter(s=>!samples.includes(s));
 write(samples);return{added,removed,count:added.filter(id=>samples.some(s=>s.id===id)).length,persistent:!blocked};
}
function undo(transaction){
 if(!transaction?.added?.length)return;
 const added=new Set(transaction.added),samples=read().filter(s=>!added.has(s.id)),ids=new Set(samples.map(s=>s.id));
 // Put evicted examples before surviving entries, preserving any newer correction or other-tab work.
 const restored=(transaction.removed||[]).filter(s=>valid(s)&&!added.has(s.id)&&!ids.has(s.id));
 const merged=[...restored,...samples],counts={};
 for(let i=merged.length-1;i>=0;i--){const s=merged[i];counts[s.char]=(counts[s.char]||0)+1;if(counts[s.char]>PER_CHARACTER)merged.splice(i,1)}
 write(merged.slice(-LIMIT));
}
window.WhiteboardHandwritingLearning={match,confirm,undo,info:()=>({examples:read().length,persistent:!blocked})};
})();
