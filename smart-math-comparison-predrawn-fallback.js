(function(){
'use strict';
if(typeof strokes==='undefined'||typeof redraw!=='function')return;

const clone=v=>JSON.parse(JSON.stringify(v));
let selectionStrokeCount=0;
let snapshot=[];
let injected=null;

function rawInk(s){
  return !!(s&&Array.isArray(s.points)&&s.points.length&&!s.erase&&!s.background&&!s.smartGenerated);
}
function dims(){
  return {w:Number(window.cssW||innerWidth||1000),h:Number(window.cssH||innerHeight||700)};
}
function box(s){
  let minX=1,minY=1,maxX=0,maxY=0;
  for(const p of s.points||[]){
    minX=Math.min(minX,p.x);minY=Math.min(minY,p.y);
    maxX=Math.max(maxX,p.x);maxY=Math.max(maxY,p.y);
  }
  const d=dims(),w=Math.max(.001,maxX-minX),h=Math.max(.001,maxY-minY);
  return{x:minX,y:minY,w,h,cx:(minX+maxX)/2,cy:(minY+maxY)/2,
    l:minX*d.w,t:minY*d.h,r:maxX*d.w,b:maxY*d.h,pw:w*d.w,ph:h*d.h};
}
function gap(a,b){
  const dx=Math.max(0,Math.max(a.l,b.l)-Math.min(a.r,b.r));
  const dy=Math.max(0,Math.max(a.t,b.t)-Math.min(a.b,b.b));
  return{dx,dy};
}
function components(entries){
  const n=entries.length,parent=Array.from({length:n},(_,i)=>i);
  const find=i=>parent[i]===i?i:(parent[i]=find(parent[i]));
  const join=(a,b)=>{a=find(a);b=find(b);if(a!==b)parent[b]=a};
  const boxes=entries.map(e=>box(e.s));
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){
    const g=gap(boxes[i],boxes[j]);
    if(g.dx<=14&&g.dy<=14)join(i,j);
  }
  const map=new Map();
  for(let i=0;i<n;i++){
    const k=find(i);if(!map.has(k))map.set(k,[]);map.get(k).push({...entries[i],b:boxes[i]});
  }
  return [...map.values()].map(items=>{
    const d=dims();
    const l=Math.min(...items.map(q=>q.b.l)),t=Math.min(...items.map(q=>q.b.t));
    const r=Math.max(...items.map(q=>q.b.r)),b=Math.max(...items.map(q=>q.b.b));
    return{items,l,t,r,b,pw:r-l,ph:b-t,cx:(l+r)/2,cy:(t+b)/2,last:Math.max(...items.map(q=>q.i)),
      x:l/d.w,y:t/d.h,w:(r-l)/d.w,h:(b-t)/d.h};
  });
}
function chooseTwoBars(){
  const entries=snapshot.map((s,i)=>({s,i})).filter(q=>rawInk(q.s));
  if(!entries.length)return [];
  let comps=components(entries).filter(c=>c.pw>=110&&c.ph>=18&&c.pw>=c.ph*1.8);
  if(comps.length<2){
    comps=entries.map(q=>{const b=box(q.s);return{items:[q],...b,last:q.i};})
      .filter(c=>c.pw>=110&&c.ph>=12&&c.pw>=c.ph*1.8);
  }
  if(comps.length<2)return [];

  const recent=comps.sort((a,b)=>b.last-a.last).slice(0,10);
  let best=null;
  for(let i=0;i<recent.length;i++)for(let j=i+1;j<recent.length;j++){
    const a=recent[i],b=recent[j];
    const overlap=Math.max(0,Math.min(a.r,b.r)-Math.max(a.l,b.l));
    const overlapRatio=overlap/Math.max(1,Math.min(a.pw,b.pw));
    const dy=Math.abs(a.cy-b.cy),leftDiff=Math.abs(a.l-b.l);
    if(overlapRatio<.35||dy<24||dy>420)continue;
    const recency=Math.max(a.last,b.last)*2+Math.min(a.last,b.last);
    const score=recency+overlapRatio*80-leftDiff*.08-dy*.015;
    if(!best||score>best.score)best={score,pair:[a,b]};
  }
  return (best?best.pair:recent.slice(0,2)).sort((a,b)=>a.cy-b.cy);
}
function syntheticStroke(c){
  const x1=Math.max(0,Math.min(1,c.x)),y1=Math.max(0,Math.min(1,c.y));
  const x2=Math.max(0,Math.min(1,c.x+c.w)),y2=Math.max(0,Math.min(1,c.y+c.h));
  return{
    erase:false,colour:'#17324d',size:5,smartGenerated:false,__predrawnComparisonFallback:true,
    points:[{x:x1,y:y1},{x:x2,y:y1},{x:x2,y:y2},{x:x1,y:y2},{x:x1,y:y1}]
  };
}
function isBarMenuButton(el){return !!(el&&el.closest&&el.closest('#smartBarTypeMenu button'))}
function isFinishButton(el){
  const b=el&&el.closest?el.closest('button'):null;if(!b)return false;
  const smart=document.getElementById('smartMathBtn');
  return !!(smart&&smart.nextElementSibling===b);
}

document.addEventListener('pointerdown',e=>{
  const el=e.target instanceof Element?e.target:null;
  if(!el||!isBarMenuButton(el))return;
  selectionStrokeCount=strokes.length;
  snapshot=strokes.slice(0,selectionStrokeCount).filter(rawInk);
},true);

document.addEventListener('pointerdown',e=>{
  const el=e.target instanceof Element?e.target:null;
  if(!el||!isFinishButton(el)||window.__smartBarType!=='comparison')return;
  const fresh=strokes.slice(selectionStrokeCount).filter(rawInk);
  if(fresh.length||injected)return;
  const pair=chooseTwoBars();
  if(pair.length!==2)return;
  const beforeState=clone(strokes);
  const priorIds=new Set(strokes.filter(s=>s&&s.smartType==='barModel'&&s.smartBarType==='comparison').map(s=>s.smartId));
  const temp=pair.map(syntheticStroke);
  const originals=[...new Set(pair.flatMap(c=>c.items.map(q=>q.s)))];
  strokes.push(...temp);
  injected={temp,originals,beforeState,priorIds};
},true);

document.addEventListener('click',e=>{
  const el=e.target instanceof Element?e.target:null;
  if(!el||!isFinishButton(el)||window.__smartBarType!=='comparison'||!injected)return;
  const job=injected;injected=null;
  setTimeout(()=>{
    const made=[...strokes].reverse().find(s=>s&&s.smartType==='barModel'&&s.smartBarType==='comparison'&&!job.priorIds.has(s.smartId));
    const tempSet=new Set(job.temp);
    if(made){
      const originalSet=new Set(job.originals);
      strokes=strokes.filter(s=>!tempSet.has(s)&&!originalSet.has(s));
      if(window.__smartBarLastHistory)window.__smartBarLastHistory.before=job.beforeState;
    }else{
      strokes=strokes.filter(s=>!tempSet.has(s));
    }
    try{redraw();if(typeof syncUi==='function')syncUi()}catch{}
  },120);
},true);
})();
