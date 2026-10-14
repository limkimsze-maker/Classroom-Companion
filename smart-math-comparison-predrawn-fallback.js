(function(){
'use strict';
if(typeof strokes==='undefined'||typeof redraw!=='function')return;

const clone=v=>JSON.parse(JSON.stringify(v));
let selectionStrokeCount=0;
let preDrawnBars=[];

function rawInk(s){
  return !!(s&&Array.isArray(s.points)&&s.points.length&&!s.erase&&!s.background&&!s.smartGenerated);
}
function box(s){
  let minX=1,minY=1,maxX=0,maxY=0;
  for(const p of s.points||[]){
    minX=Math.min(minX,p.x);minY=Math.min(minY,p.y);
    maxX=Math.max(maxX,p.x);maxY=Math.max(maxY,p.y);
  }
  const w=Math.max(.001,maxX-minX),h=Math.max(.001,maxY-minY);
  return{x:minX,y:minY,w,h,cx:(minX+maxX)/2,cy:(minY+maxY)/2,
    pw:w*(window.cssW||innerWidth||1000),ph:h*(window.cssH||innerHeight||700)};
}
function looksLikeBar(s){
  if(!rawInk(s))return false;
  const b=box(s);
  return b.pw>=120&&b.ph>=18&&b.pw>=b.ph*2.0;
}
function chooseRecentBars(list){
  const candidates=list.map((s,i)=>({s,i,b:box(s)})).filter(q=>looksLikeBar(q.s));
  if(candidates.length<2)return [];
  const chosen=candidates.slice(-2).sort((a,b)=>a.b.cy-b.b.cy);
  return chosen.map(q=>q.s);
}
function isBarMenuButton(el){
  return !!(el&&el.closest&&el.closest('#smartBarTypeMenu button'));
}
function isFinishButton(el){
  const b=el&&el.closest?el.closest('button'):null;
  if(!b)return false;
  const smart=document.getElementById('smartMathBtn');
  return !!(smart&&smart.nextElementSibling===b);
}

// Pointer-down runs before the existing click handlers, so we can snapshot a
// comparison sketch even when the teacher drew the two bars first.
document.addEventListener('pointerdown',e=>{
  const el=e.target instanceof Element?e.target:null;
  if(!el||!isBarMenuButton(el))return;
  selectionStrokeCount=strokes.length;
  preDrawnBars=chooseRecentBars(strokes);
},true);

// If there is no new ink after Comparison was selected, temporarily replay the
// two pre-drawn bars after the mode start point. The normal converter and all
// existing bracket/length logic then run unchanged on the following click.
document.addEventListener('pointerdown',e=>{
  const el=e.target instanceof Element?e.target:null;
  if(!el||!isFinishButton(el)||window.__smartBarType!=='comparison')return;

  const newInk=strokes.slice(selectionStrokeCount).filter(rawInk);
  if(newInk.length>0||preDrawnBars.length<2)return;

  const beforeState=clone(strokes);
  const originals=preDrawnBars.slice();
  const priorIds=new Set(strokes.filter(s=>s&&s.smartType==='barModel'&&s.smartBarType==='comparison').map(s=>s.smartId));
  const temp=originals.map(s=>{
    const c=clone(s);
    c.__predrawnComparisonFallback=true;
    c.smartGenerated=false;
    return c;
  });
  strokes.push(...temp);

  setTimeout(()=>{
    const made=[...strokes].reverse().find(s=>s&&s.smartType==='barModel'&&s.smartBarType==='comparison'&&!priorIds.has(s.smartId));
    const tempSet=new Set(temp);
    if(made){
      const originalSet=new Set(originals);
      strokes=strokes.filter(s=>!originalSet.has(s)&&!tempSet.has(s));
      if(window.__smartBarLastHistory)window.__smartBarLastHistory.before=beforeState;
    }else{
      strokes=strokes.filter(s=>!tempSet.has(s));
    }
    try{redraw();if(typeof syncUi==='function')syncUi()}catch{}
    preDrawnBars=[];
  },40);
},true);
})();
