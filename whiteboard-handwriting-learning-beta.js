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
function confirmCharacters(result,text,raster){
 const original=result?.tokens;if(!Array.isArray(original)||typeof raster!=='function')return null;
 const tokens=original.slice();if(tokens.at(-1)?.char==='=')tokens.pop();
 // A corrected stacked fraction teaches each digit, not the LaTeX command.
 const stacked=result?.engine==='local-stacked-fraction'&&result?.format==='latex';
 const formatted=stacked?String(text).trim().match(/^\\frac\{(\d{1,6})\}\{(\d{1,6})\}$/):null;
 if(stacked&&(!formatted||!Array.isArray(result.fractionTokenCounts)
   ||formatted[1].length!==result.fractionTokenCounts[0]
   ||formatted[2].length!==result.fractionTokenCounts[1]))return null;
 const corrected=Array.from(stacked?formatted[1]+formatted[2]:canonical(text).replace(/=$/,''));
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
function undoCharacters(transaction){
 if(!transaction?.added?.length)return;
 const added=new Set(transaction.added),samples=read().filter(s=>!added.has(s.id)),ids=new Set(samples.map(s=>s.id));
 // Put evicted examples before surviving entries, preserving any newer correction or other-tab work.
 const restored=(transaction.removed||[]).filter(s=>valid(s)&&!added.has(s.id)&&!ids.has(s.id));
 const merged=[...restored,...samples],counts={};
 for(let i=merged.length-1;i>=0;i--){const s=merged[i];counts[s.char]=(counts[s.char]||0)+1;if(counts[s.char]>PER_CHARACTER)merged.splice(i,1)}
 write(merged.slice(-LIMIT));
}

/* Beautify 2.0: local supervised whole-ink examples. Personal matching, not
   neural-network retraining. Conservative shape gates prevent broad overrides. */
const INK_KEY='whiteboard.handwriting.ink-examples.v2',INK_LIMIT=120,INK_PER_READING=8;
let inkMemory=[],inkCached,inkBlocked=false;
const validInk=s=>s&&typeof s.id==='string'&&s.id.length<80&&
 typeof s.text==='string'&&s.text.length>0&&s.text.length<=180&&
 ['auto','math','lowercase','uppercase','digits'].includes(s.mode)&&
 /^[0-9a-f]{196}$/.test(s.feature||'')&&Number.isInteger(s.n)&&s.n>=1&&s.n<=180&&
 Number.isFinite(s.aspect)&&s.aspect>.005&&s.aspect<1000;
function readInk(){
 if(inkBlocked)return inkMemory;
 let raw;try{raw=localStorage.getItem(INK_KEY)}catch{inkBlocked=true;return inkMemory}
 if(inkCached===raw)return inkMemory;inkCached=raw;
 try{const p=raw&&raw.length<85000?JSON.parse(raw):null;
  inkMemory=p?.version===2&&Array.isArray(p.samples)?p.samples.filter(validInk).slice(-INK_LIMIT):[]
 }catch{inkMemory=[]}
 return inkMemory;
}
function writeInk(samples){
 inkMemory=samples;
 const raw=JSON.stringify({version:2,samples});
 try{localStorage.setItem(INK_KEY,raw);inkCached=raw;inkBlocked=false}
 catch{inkBlocked=true}
}
function makeInk(strokes,W,H,raster,mode){
 if(!Array.isArray(strokes)||strokes.length<1||strokes.length>180||
    !Number.isFinite(W)||!Number.isFinite(H)||W<1||H<1||
    typeof raster!=='function'||!['auto','math','lowercase','uppercase','digits'].includes(mode))return null;
 const scaled=[],xs=[],ys=[];let count=0;
 for(const s of strokes){
  if(!Array.isArray(s?.points)||!s.points.length)return null;
  const pts=[];
  for(const p of s.points){
   if(!Number.isFinite(p.x)||!Number.isFinite(p.y)||++count>16000)return null;
   const x=p.x*W,y=p.y*H;pts.push({x,y});xs.push(x);ys.push(y);
  }
  scaled.push({points:pts,size:Number(s.size)||4});
 }
 const width=Math.max(...xs)-Math.min(...xs),height=Math.max(...ys)-Math.min(...ys);
 if(width<2||height<2)return null;
 const feat=feature(raster(scaled)),aspect=width/height;
 return feat&&Number.isFinite(aspect)?{feature:feat,aspect,n:strokes.length,mode}:null;
}
function matchInk(strokes,W,H,mode,raster){
 const examples=readInk();if(!examples.length)return null;
 const query=makeInk(strokes,W,H,raster,mode);if(!query)return null;
 const neighbors=examples.filter(s=>s.mode===mode&&s.n===query.n&&
   Math.abs(Math.log(s.aspect/query.aspect))<.035)
   .map(s=>({s,d:distance(query.feature,s.feature)})).sort((a,b)=>a.d-b.d);
 const best=neighbors[0];if(!best||best.d>.006)return null;
 const rival=neighbors.find(q=>q.s.text!==best.s.text);
 if(rival&&rival.d-best.d<.009)return null;
 return{text:best.s.text,score:1-best.d,source:'personal-ink-memory'};
}
function rememberInk(strokes,W,H,mode,text,raster){
 if(typeof text!=='string'||!text.trim()||text.length>180||/[\u0000-\u001f\u007f]/.test(text))return null;
 const query=makeInk(strokes,W,H,raster,mode);if(!query)return null;
 const chosen=text.trim(),previousSamples=readInk().slice();
 const superseded=previousSamples.filter(s=>s.mode===mode&&s.n===query.n&&
   s.feature===query.feature&&Math.abs(s.aspect-query.aspect)<.0001);
 if(superseded.length===1&&superseded[0].text===chosen)return null;
 const samples=previousSamples.filter(s=>!superseded.includes(s));
 const created={...query,text:chosen,id:Date.now().toString(36)+'-'+(++serial).toString(36)+'-'+Math.random().toString(36).slice(2,10)};
 samples.push(created);
 const before=samples.slice(),seen={};
 for(let i=samples.length-1;i>=0;i--){
  const s=samples[i],key=s.mode+'\u0000'+s.text;seen[key]=(seen[key]||0)+1;
  if(seen[key]>INK_PER_READING)samples.splice(i,1);
 }
 while(samples.length>INK_LIMIT)samples.shift();
 const removed=[...superseded,...before.filter(s=>!samples.includes(s))];
 writeInk(samples);
 return{added:[created.id],removed,count:samples.some(s=>s.id===created.id)?1:0,persistent:!inkBlocked};
}
function undoInk(transaction){
 if(!transaction?.added?.length)return;
 const added=new Set(transaction.added),existing=readInk().filter(s=>!added.has(s.id));
 const ids=new Set(existing.map(s=>s.id));
 const restored=(transaction.removed||[]).filter(s=>validInk(s)&&!added.has(s.id)&&!ids.has(s.id));
 writeInk([...restored,...existing].slice(-INK_LIMIT));
}
function confirm(result,text,raster,strokes,W,H,mode='auto'){
 const chars=confirmCharacters(result,text,raster);
 const ink=rememberInk(strokes,W,H,mode,text,raster);
 if(!chars&&!ink)return null;
 return{added:chars?.added||[],removed:chars?.removed||[],ink,
  count:(chars?.count||0)+(ink?.count||0),
  persistent:(chars?chars.persistent:true)&&(ink?ink.persistent:true)};
}
function undo(transaction){
 if(!transaction)return;
 undoCharacters(transaction);
 undoInk(transaction.ink);
}

window.WhiteboardHandwritingLearning={match,matchInk,confirm,undo,info:()=>({examples:read().length,inkExamples:readInk().length,persistent:!blocked&&!inkBlocked})};
})();
