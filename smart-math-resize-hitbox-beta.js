(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof cssW==='undefined'||typeof cssH==='undefined')return;

const STRICT=12;   // resize only when pointer is actually on the visible handle
const OLD_ZONE=24; // suppress the older oversized resize hit area around the handle
let resizing=false,resizePointer=null;

function pt(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
function smartModels(){return strokes.filter(s=>s&&s.type==='image'&&s.smartType==='barModel'&&Number.isFinite(s.x)&&Number.isFinite(s.y)&&Number.isFinite(s.w)&&Number.isFinite(s.h))}
function handleOf(s){return{x:(s.x+s.w)*cssW+7,y:(s.y+s.h)*cssH+7}}
function nearestHandle(p,limit=OLD_ZONE){
 let best=null,dist=Infinity;
 for(const s of smartModels()){
  const h=handleOf(s),dx=Math.abs(p.x-h.x),dy=Math.abs(p.y-h.y);
  if(dx<=limit&&dy<=limit){const d=Math.hypot(dx,dy);if(d<dist){dist=d;best={s,h,dx,dy,d}}}
 }
 return best;
}
function onActualHandle(hit){return !!hit&&hit.dx<=STRICT&&hit.dy<=STRICT}

// Capture before the normal selection code. The old selector treats a roughly
// 40 x 40 px area as the resize handle. For smart bar models we keep only a
// tight area matching the visible green square.
canvas.addEventListener('pointerdown',e=>{
 if(typeof tool!=='undefined'&&tool!=='select')return;
 if(e.button!==undefined&&e.button!==0)return;
 const hit=nearestHandle(pt(e));
 if(!hit)return;
 if(onActualHandle(hit)){
  resizing=true;resizePointer=e.pointerId;
  return; // allow the existing resize implementation to run
 }
 e.preventDefault();
 e.stopImmediatePropagation();
 canvas.style.cursor='default';
},true);

// Run after the existing pointer-move handlers and correct the cursor when it
// is only near the handle, not actually on it.
canvas.addEventListener('pointermove',e=>{
 if(typeof tool!=='undefined'&&tool!=='select')return;
 if(resizing)return;
 const hit=nearestHandle(pt(e));
 if(!hit)return;
 canvas.style.cursor=onActualHandle(hit)?'nwse-resize':'default';
},false);

function release(e){
 if(!resizing)return;
 if(resizePointer!=null&&e.pointerId!=null&&e.pointerId!==resizePointer)return;
 resizing=false;resizePointer=null;
 requestAnimationFrame(()=>{if(typeof tool==='undefined'||tool==='select')canvas.style.cursor='default'});
}
window.addEventListener('pointerup',release,true);
window.addEventListener('pointercancel',release,true);
canvas.addEventListener('lostpointercapture',release,true);
window.addEventListener('blur',()=>{resizing=false;resizePointer=null;canvas.style.cursor='default'});
})();
