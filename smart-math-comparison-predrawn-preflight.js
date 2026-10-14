(function(){
'use strict';
if(typeof strokes==='undefined'||typeof redraw!=='function')return;

const clone=v=>JSON.parse(JSON.stringify(v));
let savedBars=[];
let savedModelIds=new Set();
let armed=false;

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
  const W=window.cssW||innerWidth||1000,H=window.cssH||innerHeight||700;
  return{x:minX,y:minY,w,h,cx:(minX+maxX)/2,cy:(minY+maxY)/2,pw:w*W,ph:h*H};
}
function looksLikeBar(s){
  if(!rawInk(s))return false;
  const b=box(s);
  return b.pw>=100&&b.ph>=16&&b.pw>=b.ph*1.7;
}
function recentTwoBars(){
  const all=strokes.map((s,i)=>({s,i,b:box(s)})).filter(q=>looksLikeBar(q.s));
  if(all.length<2)return [];
  return all.slice(-2).sort((a,b)=>a.b.cy-b.b.cy).map(q=>q.s);
}
function comparisonChoice(el){
  const btn=el&&el.closest?el.closest('#smartBarTypeMenu button'):null;
  if(!btn)return false;
  const t=(btn.textContent||'').trim().toLowerCase();
  return t==='comparison'||t==='比较'||t==='perbandingan'||t==='ஒப்பீடு';
}
function finishButton(el){
  const btn=el&&el.closest?el.closest('button'):null;
  if(!btn)return null;
  const smart=document.getElementById('smartMathBtn');
  return smart&&smart.nextElementSibling===btn?btn:null;
}

// WINDOW capture fires before the existing DOCUMENT capture handlers.
// This lets us make already-drawn bars visible to the normal comparison recogniser
// before it performs its own finish-time scan.
window.addEventListener('click',e=>{
  const el=e.target instanceof Element?e.target:null;
  if(!el)return;

  if(comparisonChoice(el)){
    savedBars=recentTwoBars();
    savedModelIds=new Set(strokes.filter(s=>s&&s.smartType==='barModel'&&s.smartBarType==='comparison').map(s=>s.smartId));
    armed=savedBars.length===2;
    return;
  }

  if(!finishButton(el)||window.__smartBarType!=='comparison'||!armed||savedBars.length!==2)return;

  // If the teacher drew anything new after choosing Comparison, leave the normal
  // recogniser alone. This fallback is only for the "draw first, choose Comparison later" case.
  const tempAlready=strokes.some(s=>s&&s.__predrawnPreflightTemp);
  if(tempAlready)return;

  const copies=savedBars.map(s=>{
    const c=clone(s);
    c.smartGenerated=false;
    c.__predrawnPreflightTemp=true;
    return c;
  });
  strokes.push(...copies);

  setTimeout(()=>{
    const made=[...strokes].reverse().find(s=>s&&s.smartType==='barModel'&&s.smartBarType==='comparison'&&!savedModelIds.has(s.smartId));
    const copySet=new Set(copies);
    if(made){
      const originalSet=new Set(savedBars);
      strokes=strokes.filter(s=>!originalSet.has(s)&&!copySet.has(s));
    }else{
      strokes=strokes.filter(s=>!copySet.has(s));
    }
    armed=false;savedBars=[];
    try{redraw();if(typeof syncUi==='function')syncUi()}catch{}
  },120);
},true);
})();
