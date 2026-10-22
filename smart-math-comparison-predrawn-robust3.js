(function(){
'use strict';
if(typeof strokes==='undefined'||typeof redraw!=='function')return;

const clone=v=>JSON.parse(JSON.stringify(v));
let selectionStrokeCount=0;
let snapshot=[];
let pending=null;
function rawInk(s){return !!(s&&Array.isArray(s.points)&&s.points.length&&!s.erase&&!s.background&&!s.smartGenerated)}
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
function chooseBars(source){
 const entries=(source||[]).map((s,i)=>({s,i})).filter(q=>rawInk(q.s));if(!entries.length)return[];
 let comps=components(entries).filter(barLike);
 if(comps.length<2)comps=entries.map(q=>{const b=box(q.s);return{items:[q],...b,last:q.i}}).filter(barLike);
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
function synthetic(c){
 const x1=Math.max(0,Math.min(1,c.x)),y1=Math.max(0,Math.min(1,c.y)),x2=Math.max(0,Math.min(1,c.x+c.w)),y2=Math.max(0,Math.min(1,c.y+c.h));
 return{erase:false,colour:'#17324d',size:5,smartGenerated:false,__predrawnComparisonFallback:true,__predrawnPreflightTemp:true,points:[{x:x1,y:y1},{x:x2,y:y1},{x:x2,y:y2},{x:x1,y:y2},{x:x1,y:y1}]}
}
function menuButton(el){return!!(el&&el.closest&&el.closest('#smartBarTypeMenu button'))}
function finishButton(el){
 const b=el&&el.closest?el.closest('button'):null,smart=document.getElementById('smartMathBtn');
 return!!(b&&smart&&smart.nextElementSibling===b);
}
function captureInitialInk(){
 selectionStrokeCount=strokes.length;
 snapshot=strokes.slice(0,selectionStrokeCount).filter(rawInk);
 pending=null;
}
function prepare(){
 if(window.__smartBarType!=='comparison')return null;
 if(pending)return pending;
 // Keep both teacher workflows: comparison selected before or after drawing.
 const fresh=strokes.slice(selectionStrokeCount).filter(rawInk);
 const source=fresh.length?fresh:snapshot;
 const bars=chooseBars(source);
 if(bars.length<2)return null;
 const beforeState=clone(strokes);
 const originals=[...new Set(bars.flatMap(c=>c.items.map(q=>q.s)))];
 const temp=bars.map(synthetic);
 pending={temp,originals,beforeState};
 // Synthetic bar rectangles are used ONLY for the existing recogniser's
 // geometry, not as actual saved ink. Finish removes them synchronously.
 strokes.push(...temp);
 return pending;
}
// Called synchronously by smart-math-bars-v2.finishBar, including keyboard
// activation that has no pointerdown. No setTimeout or competing cleanup.
window.__smartComparisonPrepare=prepare;
window.__smartComparisonRelease=function(){
 const job=pending;
 pending=null;
 return job;
};
// Capture click as well as pointerdown: keyboard selection is supported.
document.addEventListener('pointerdown',e=>{
 const el=e.target instanceof Element?e.target:null;
 if(el&&menuButton(el))captureInitialInk();
 if(el&&finishButton(el))prepare();
},true);
document.addEventListener('click',e=>{
 const el=e.target instanceof Element?e.target:null;
 // Re-capture source strokes before the chosen comparison handler begins.
 if(el&&menuButton(el))captureInitialInk();
},true);
})();
