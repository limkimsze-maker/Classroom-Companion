(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function'||typeof syncUi!=='function')return;
const smartBtn=document.getElementById('smartMathBtn');
if(!smartBtn)return;
const clone=v=>JSON.parse(JSON.stringify(v));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let startIndex=0,lastType='',pending=null,anchorRefresh=false;

function rawInk(s){return !!(s&&Array.isArray(s.points)&&s.points.length&&!s.erase&&!s.highlighter&&!s.background&&!s.smartGenerated)}
function box(s){let minX=1,minY=1,maxX=0,maxY=0;for(const p of s?.points||[]){minX=Math.min(minX,p.x);minY=Math.min(minY,p.y);maxX=Math.max(maxX,p.x);maxY=Math.max(maxY,p.y)}return{x:minX,y:minY,w:Math.max(.001,maxX-minX),h:Math.max(.001,maxY-minY),cx:(minX+maxX)/2,cy:(minY+maxY)/2}}
function overlap(a1,a2,b1,b2){return Math.max(0,Math.min(a2,b2)-Math.max(a1,b1))}

function findBarBand(group){
 const q=group.map(s=>({s,b:box(s)}));
 const hs=q.filter(o=>{const pw=o.b.w*cssW,ph=o.b.h*cssH;return pw>=90&&pw>=ph*2.2&&ph<=Math.max(60,pw*.28)});
 const vs=q.filter(o=>{const pw=o.b.w*cssW,ph=o.b.h*cssH;return ph>=28&&ph>=pw*1.15});
 let best=null;
 for(let i=0;i<hs.length;i++)for(let j=i+1;j<hs.length;j++){
  const a=hs[i].b,b=hs[j].b,top=Math.min(a.cy,b.cy),bottom=Math.max(a.cy,b.cy),sep=(bottom-top)*cssH;
  if(sep<24||sep>220)continue;
  const left=Math.max(a.x,b.x),right=Math.min(a.x+a.w,b.x+b.w),ov=(right-left)*cssW;
  if(ov<100)continue;
  const similar=Math.min(a.w,b.w)/Math.max(a.w,b.w);
  let crossings=0;
  for(const v of vs){const x=v.b.cx;if(x<left-.03||x>right+.03)continue;if(v.b.y<=top+.03&&v.b.y+v.b.h>=bottom-.03)crossings++}
  const score=ov*similar+crossings*130-sep*.12;
  if(!best||score>best.score)best={score,top,bottom,left:Math.min(a.x,b.x),right:Math.max(a.x+a.w,b.x+b.w),crossings};
 }
 return best;
}
function bracketStrokes(group,band){
 if(!band)return[];
 const padY=10/Math.max(1,cssH),minW=45/Math.max(1,cssW);
 return group.filter(s=>{const b=box(s);if(b.w<minW)return false;const outside=b.cy<band.top-padY||b.cy>band.bottom+padY;if(!outside)return false;const span=overlap(b.x,b.x+b.w,band.left-.08,band.right+.08);return span>=Math.min(b.w,(band.right-band.left)*.18)});
}
function restoreTemp(){if(!pending)return;for(const s of pending.brackets){delete s.__pwBracketTemp;s.smartGenerated=!!s.__pwWasSmart;delete s.__pwWasSmart}pending=null}
function prepareFinish(){
 const type=window.__smartBarType||'';if(type!=='partwhole')return;
 const group=strokes.slice(startIndex).filter(rawInk);if(group.length<3)return;
 const band=findBarBand(group),brackets=bracketStrokes(group,band);if(!band||!brackets.length)return;
 const beforeIds=new Set(strokes.filter(s=>s?.smartType==='barModel').map(s=>s.smartId));
 for(const s of brackets){s.__pwWasSmart=!!s.smartGenerated;s.__pwBracketTemp=true;s.smartGenerated=true}
 pending={brackets:brackets.slice(),original:clone(brackets),beforeIds};
 setTimeout(()=>{
  if(!pending)return;
  const p=pending,newObj=[...strokes].reverse().find(s=>s&&s.smartType==='barModel'&&s.smartBarType==='partwhole'&&!p.beforeIds.has(s.smartId));
  if(!newObj){restoreTemp();try{redraw()}catch{};return}
  const originals=p.original.map(s=>{const c=clone(s);delete c.__pwBracketTemp;delete c.__pwWasSmart;c.smartGenerated=false;return c});
  const tempSet=new Set(p.brackets);strokes=strokes.filter(s=>!tempSet.has(s));
  newObj.smartOriginal=[...(Array.isArray(newObj.smartOriginal)?newObj.smartOriginal:[]),...originals];
  newObj.userDrawnBracketScan=false;delete newObj.userDrawnBrackets;
  pending=null;redraw();syncUi();
 },0);
}

// Remember where this bar-model drawing session began.
document.addEventListener('click',e=>{
 const el=e.target;if(!(el instanceof Element))return;
 if(el.closest('#smartBarTypeMenu'))setTimeout(()=>{const t=window.__smartBarType||'';if(t&&t!==lastType){lastType=t;startIndex=strokes.length}},0);
 const finish=smartBtn.nextElementSibling;if(finish&&el===finish)prepareFinish();
},true);

function partBounds(obj){const n=Math.max(2,obj.barCount||2),cuts=Array.isArray(obj.barCuts)&&obj.barCuts.length===n-1?obj.barCuts.slice():Array.from({length:n-1},(_,i)=>(i+1)/n);return[0,...cuts,1]}
function boundaryCoords(obj){return partBounds(obj).map(r=>(60+780*r)/900)}
function nearestBoundary(v,coords){let bi=0,bd=Infinity;for(let i=0;i<coords.length;i++){const d=Math.abs(v-coords[i]);if(d<bd){bd=d;bi=i}}return{index:bi,d:bd}}
function attachAnchors(obj){
 if(obj.smartBarType!=='partwhole'||!Array.isArray(obj.userDrawnBrackets)||!obj.userDrawnBrackets.length)return false;
 const coords=boundaryCoords(obj);let changed=false;
 for(const b of obj.userDrawnBrackets){
  if(Number.isInteger(b.partAnchorLeft)&&Number.isInteger(b.partAnchorRight))continue;
  const l=nearestBoundary(b.x1,coords),r=nearestBoundary(b.x2,coords);
  if(l.d<=.12&&r.d<=.12&&r.index>l.index){b.partAnchorLeft=l.index;b.partAnchorRight=r.index;changed=true}
 }
 return changed;
}
function followAnchors(){
 let changed=false;
 for(const obj of strokes){
  if(!obj||obj.smartType!=='barModel'||obj.smartBarType!=='partwhole')continue;
  if(attachAnchors(obj))changed=true;
  if(!Array.isArray(obj.userDrawnBrackets))continue;
  const coords=boundaryCoords(obj);
  for(const b of obj.userDrawnBrackets){
   if(!Number.isInteger(b.partAnchorLeft)||!Number.isInteger(b.partAnchorRight))continue;
   const x1=coords[clamp(b.partAnchorLeft,0,coords.length-1)],x2=coords[clamp(b.partAnchorRight,0,coords.length-1)];
   if(Math.abs(b.x1-x1)>.0005||Math.abs(b.x2-x2)>.0005){b.x1=x1;b.x2=x2;changed=true}
  }
 }
 return changed;
}
const priorRedraw=redraw;
redraw=function(){followAnchors();priorRedraw();if(!anchorRefresh&&followAnchors()){anchorRefresh=true;requestAnimationFrame(()=>{anchorRefresh=false;priorRedraw()})}};
setTimeout(()=>{try{redraw()}catch{}},0);
})();
