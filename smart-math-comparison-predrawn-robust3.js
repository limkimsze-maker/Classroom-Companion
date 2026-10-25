(function(){
'use strict';
if(typeof strokes==='undefined'||typeof redraw!=='function')return;

const clone=v=>JSON.parse(JSON.stringify(v));
let selectionStrokeCount=0;
let snapshot=[];
let injected=null;

function rawInk(s){return !!(s&&Array.isArray(s.points)&&s.points.length&&!s.erase&&!s.highlighter&&!s.background&&!s.smartGenerated)}
function dims(){const c=document.getElementById('board');const r=c?c.getBoundingClientRect():null;return{w:Math.max(1,r?.width||innerWidth||1000),h:Math.max(1,r?.height||innerHeight||700)}}
function box(s){
 let minX=1,minY=1,maxX=0,maxY=0;
 for(const p of s.points||[]){minX=Math.min(minX,p.x);minY=Math.min(minY,p.y);maxX=Math.max(maxX,p.x);maxY=Math.max(maxY,p.y)}
 const d=dims(),w=Math.max(.001,maxX-minX),h=Math.max(.001,maxY-minY);
 return{x:minX,y:minY,w,h,cx:(minX+maxX)/2,cy:(minY+maxY)/2,l:minX*d.w,t:minY*d.h,r:maxX*d.w,b:maxY*d.h,pw:w*d.w,ph:h*d.h}
}
function gap(a,b){return{dx:Math.max(0,Math.max(a.l,b.l)-Math.min(a.r,b.r)),dy:Math.max(0,Math.max(a.t,b.t)-Math.min(a.b,b.b))}}
function components(entries){
 const n=entries.length,parent=Array.from({length:n},(_,i)=>i),boxes=entries.map(e=>box(e.s));
 const find=i=>parent[i]===i?i:(parent[i]=find(parent[i]));
 const join=(a,b)=>{a=find(a);b=find(b);if(a!==b)parent[b]=a};
 // Rough teacher-drawn bars may have tiny gaps at corners, so allow a little
 // more joining tolerance than the old closed-rectangle detector.
 for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){const g=gap(boxes[i],boxes[j]);if(g.dx<=20&&g.dy<=20)join(i,j)}
 const groups=new Map();
 for(let i=0;i<n;i++){const k=find(i);if(!groups.has(k))groups.set(k,[]);groups.get(k).push({...entries[i],b:boxes[i]})}
 return [...groups.values()].map(items=>{
  const d=dims(),l=Math.min(...items.map(q=>q.b.l)),t=Math.min(...items.map(q=>q.b.t)),r=Math.max(...items.map(q=>q.b.r)),b=Math.max(...items.map(q=>q.b.b));
  return{items,l,t,r,b,pw:r-l,ph:b-t,cx:(l+r)/2,cy:(t+b)/2,last:Math.max(...items.map(q=>q.i)),x:l/d.w,y:t/d.h,w:(r-l)/d.w,h:(b-t)/d.h}
 })
}
function barLike(c){return c&&c.pw>=80&&c.ph>=10&&c.pw>=c.ph*1.30}
function compatible(a,b){
 const overlap=Math.max(0,Math.min(a.r,b.r)-Math.max(a.l,b.l)),ratio=overlap/Math.max(1,Math.min(a.pw,b.pw));
 const dy=Math.abs(a.cy-b.cy),leftDiff=Math.abs(a.l-b.l),leftTol=Math.max(140,Math.min(a.pw,b.pw)*.55);
 return ratio>=.18&&dy>=20&&dy<=720&&leftDiff<=leftTol;
}
// Rough comparison bars may have long downward tails or hooked ends.
// Use their sustained horizontal edge, not the entire stroke bounding box.
// This also keeps two overlapping hand-drawn rows distinct when their tails
// intersect: grouping whole-stroke bounding boxes would merge them into one.
function horizontalEdge(q){
 const pts=q.s.points||[],d=dims();let best=null,run=null,lastSign=0;
 const consider=()=>{
  if(!run)return;
  const width=run.r-run.l;
  if(width>=Math.max(65,Math.min(110,d.w*.15))&&(!best||width>best.pw)){
   const h=Math.max(30,Math.min(68,Math.max(run.b-run.t+16,width*.14)));
   const t=Math.max(0,run.t-7),b=t+h;
   best={items:[q],l:run.l,t,r:run.r,b,pw:width,ph:h,
    cx:(run.l+run.r)/2,cy:(t+b)/2,last:q.i,
    x:run.l/d.w,y:t/d.h,w:width/d.w,h:h/d.h};
  }
 };
 for(let i=1;i<pts.length;i++){
  const a=pts[i-1],b=pts[i],ax=a.x*d.w,ay=a.y*d.h,bx=b.x*d.w,by=b.y*d.h;
  const dx=bx-ax,dy=by-ay,sign=Math.sign(dx);
  const horizontal=Math.abs(dx)>=1.5&&Math.abs(dy)<=Math.max(8,Math.abs(dx)*.55);
  if(!horizontal||lastSign&&sign!==lastSign){consider();run=null;lastSign=0}
  if(!horizontal)continue;
  if(!run)run={l:Math.min(ax,bx),r:Math.max(ax,bx),t:Math.min(ay,by),b:Math.max(ay,by)};
  else{run.l=Math.min(run.l,ax,bx);run.r=Math.max(run.r,ax,bx);run.t=Math.min(run.t,ay,by);run.b=Math.max(run.b,ay,by)}
  lastSign=sign;
 }
 consider();
 return best;
}
function chooseBars(source){
 const entries=(source||[]).map((s,i)=>({s,i})).filter(q=>rawInk(q.s));if(!entries.length)return[];
 let comps=components(entries).filter(barLike);
 if(comps.length<2){
  // Distinct open strokes may overlap vertically without belonging to one
  // connected bar. Try horizontal-edge geometry before legacy whole-stroke boxes.
  const edges=entries.map(horizontalEdge).filter(Boolean);
  comps=edges.length>=2?edges:entries.map(q=>{const b=box(q.s);return{items:[q],...b,last:q.i}}).filter(barLike);
 }
 if(comps.length<2)return[];

 // 3 bars is the maximum comparison model supported by this beta. Start from
 // the most recent bar-like component so stray marks elsewhere are ignored.
 const recent=comps.sort((a,b)=>b.last-a.last).slice(0,12),anchor=recent[0];
 let cluster=[anchor];
 for(const c of recent.slice(1)){
  if(cluster.length>=3)break;
  if(!compatible(anchor,c))continue;
  const ok=cluster.filter(q=>compatible(q,c)).length>=Math.max(1,cluster.length-1);
  if(ok)cluster.push(c);
 }

 if(cluster.length<2){
  let best=[];
  for(const seed of recent){
   const group=[seed];
   for(const c of recent){if(c===seed||group.length>=3)continue;if(group.every(q=>compatible(q,c)))group.push(c)}
   if(group.length>best.length||(group.length===best.length&&group.reduce((s,q)=>s+q.last,0)>best.reduce((s,q)=>s+q.last,0)))best=group;
  }
  cluster=best;
 }
 if(cluster.length<2)return[];
 return cluster.slice(0,3).sort((a,b)=>a.cy-b.cy)
}
// The accepted rough bars may be accompanied by short stray pen marks
// (open ends, redraws, hooks and dots). For a sketch made BEFORE opening
// Comparison, clean only neighbouring strokes from the same recent run.
// Unrelated writing, earlier ink elsewhere, and other generated objects stay.
function associatedSketchInk(source,bars){
 const selected=new Set(bars.flatMap(c=>c.items.map(q=>q.s)));
 if(!selected.size)return[];
 const all=[...selected].map(box),d=dims();
 const l=Math.min(...all.map(q=>q.l)),r=Math.max(...all.map(q=>q.r));
 const t=Math.min(...all.map(q=>q.t)),b=Math.max(...all.map(q=>q.b));
 const padX=Math.min(65,Math.max(22,(r-l)*.18));
 const padY=Math.min(46,Math.max(18,(b-t)*.16));
 const selectedIndices=source.map((s,i)=>selected.has(s)?i:-1).filter(i=>i>=0);
 const first=Math.min(...selectedIndices),last=Math.max(...selectedIndices);
 for(let i=Math.max(0,first-4);i<Math.min(source.length,last+5);i++){
  const stroke=source[i];
  if(selected.has(stroke)||!rawInk(stroke))continue;
  const q=box(stroke);
  // Complete containment + near drawing order avoids deleting adjacent
  // annotations that happen to touch the comparison model bounds.
  if(q.l>=l-padX&&q.r<=r+padX&&q.t>=t-padY&&q.b<=b+padY)selected.add(stroke);
 }
 return [...selected];
}
function synthetic(c){
 const x1=Math.max(0,Math.min(1,c.x)),y1=Math.max(0,Math.min(1,c.y)),x2=Math.max(0,Math.min(1,c.x+c.w)),y2=Math.max(0,Math.min(1,c.y+c.h));
 return{erase:false,colour:'#17324d',size:5,smartGenerated:false,__predrawnComparisonFallback:true,__predrawnPreflightTemp:true,points:[{x:x1,y:y1},{x:x2,y:y1},{x:x2,y:y2},{x:x1,y:y2},{x:x1,y:y1}]}
}
function captureInitialInk(){
 selectionStrokeCount=strokes.length;
 snapshot=strokes.slice(0,selectionStrokeCount).filter(rawInk);
 injected=null;
}
function prepare(){
 if(window.__smartBarType!=='comparison')return null;
 if(injected)return injected;
 const freshlyDrawn=strokes.slice(selectionStrokeCount).filter(rawInk);
 const source=freshlyDrawn.length?freshlyDrawn:snapshot;
 const bars=chooseBars(source);if(bars.length<2)return null;
 const beforeState=clone(strokes);
 const priorModels=new Set(strokes.filter(s=>s&&s.smartType==='barModel'&&s.smartBarType==='comparison'));
 const priorIds=new Set([...priorModels].map(s=>s.smartId));
 const temp=bars.map(synthetic);
 const originals=associatedSketchInk(source,bars);
 strokes.push(...temp);
 injected={temp,originals,beforeState,priorIds,priorModels,claimed:false};
 return injected;
}
// The existing synchronous bar converter claims the job. Other recognised
// conversion paths keep the newer asynchronous fallback below.
window.__smartComparisonPrepare=prepare;
window.__smartComparisonRelease=()=>{
 const job=injected;
 if(job){job.claimed=true;injected=null}
 return job;
};
function menuButton(el){return!!(el&&el.closest&&el.closest('#smartBarTypeMenu button'))}
function finishButton(el){const b=el&&el.closest?el.closest('button'):null,smart=document.getElementById('smartMathBtn');return!!(b&&(b.id==='smartBarFinishBtn'||(smart&&smart.nextElementSibling===b)))}

document.addEventListener('pointerdown',e=>{
 const el=e.target instanceof Element?e.target:null;if(!el||!menuButton(el))return;
 captureInitialInk()
},true);

document.addEventListener('pointerdown',e=>{
 const el=e.target instanceof Element?e.target:null;if(!el||!finishButton(el)||window.__smartBarType!=='comparison'||injected)return;
 // Important: recognise BOTH workflows:
 // 1) draw bars first, then choose Comparison; and
 // 2) choose Comparison first, then draw the rough bars.
 // The old fallback handled only (1), which is why normal classroom use failed.
 prepare();
},true);

document.addEventListener('click',e=>{
 const el=e.target instanceof Element?e.target:null;
 if(el&&menuButton(el)){captureInitialInk();return}
 if(!el||!finishButton(el)||window.__smartBarType!=='comparison'||!injected)return;
 const job=injected;
 // Models may be committed after the click handler's own animation frame or
 // asynchronous beautification. Do not abandon the cleanup at 160 ms.
 // Prefer object identity: some model creators reuse a smartId.
 let attempt=0;
 function settle(){
  const all=strokes.filter(s=>s&&s.smartType==='barModel'&&s.smartBarType==='comparison');
  const made=[...all].reverse().find(s=>!job.priorModels.has(s))
    || [...all].reverse().find(s=>!job.priorIds.has(s.smartId));
  if(made){
   const remove=new Set([...job.temp,...job.originals]);
   strokes=strokes.filter(s=>!remove.has(s));
   made.smartOriginal=clone(job.originals);
   if(window.__smartBarLastHistory)window.__smartBarLastHistory.before=job.beforeState;
   try{redraw();if(typeof syncUi==='function')syncUi()}catch{}
   return;
  }
  if(++attempt<12){setTimeout(settle,100);return}
  // If generation really failed, discard only temporary synthetic strokes.
  // The teacher's original drawing must never be lost.
  const temporary=new Set(job.temp);
  strokes=strokes.filter(s=>!temporary.has(s));
  try{redraw();if(typeof syncUi==='function')syncUi()}catch{}
 }
 setTimeout(()=>{if(job.claimed)return;injected=null;settle()},100);
},true);
})();
