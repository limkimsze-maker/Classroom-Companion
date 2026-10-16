(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function'||typeof cssW==='undefined'||typeof cssH==='undefined')return;

const HIT=11;
const FRAME_X=6;
const FRAME_Y=5;
const MIN_SCALE=.12;
let armed=null;
let gesture=null;

function canvasPoint(e){
 const r=canvas.getBoundingClientRect();
 return{x:e.clientX-r.left,y:e.clientY-r.top};
}
function isSmartFigure(s){
 return !!(s&&s.type==='image'&&(s.smartType==='barModel'||s.smartType==='fractionBar')&&Number.isFinite(s.x)&&Number.isFinite(s.y)&&Number.isFinite(s.w)&&Number.isFinite(s.h));
}
function bounds(s){return{x:s.x*cssW,y:s.y*cssH,w:s.w*cssW,h:s.h*cssH};}
function frame(s){const b=bounds(s);return{x:b.x-FRAME_X,y:b.y-FRAME_Y,w:b.w+FRAME_X*2,h:b.h+FRAME_Y*2};}
function inBox(p,b,pad=0){return p.x>=b.x-pad&&p.x<=b.x+b.w+pad&&p.y>=b.y-pad&&p.y<=b.y+b.h+pad;}

function visibleComparisonHit(s,p){
 const b=bounds(s),rx=(p.x-b.x)/Math.max(1,b.w),ry=(p.y-b.y)/Math.max(1,b.h),n=Math.max(2,Math.min(5,Number(s.barCount)||2));
 const H=Math.max(340,150+n*145),sx=rx*900,sy=ry*H,x=180,maxW=650,rowGap=145,barH=76,startY=60;
 const widths=Array.isArray(s.barCompareWidths)?s.barCompareWidths:[];
 for(let i=0;i<n;i++){
  const w=maxW*Math.max(.16,Math.min(1,Number(widths[i]??(1-i*.11))||.5)),y=startY+i*rowGap;
  if(sx>=x-14&&sx<=x+w+14&&sy>=y-14&&sy<=y+barH+14)return true;
 }
 return false;
}
function visibleBarHit(s,p){
 if(s.smartType==='fractionBar')return inBox(p,bounds(s),3);
 if(s.smartBarType==='comparison')return visibleComparisonHit(s,p);
 const b=bounds(s),rx=(p.x-b.x)/Math.max(1,b.w),ry=(p.y-b.y)/Math.max(1,b.h),sx=rx*900,sy=ry*300;
 return sx>=42&&sx<=858&&sy>=68&&sy<=232;
}
function topVisibleSmartAt(p){
 for(let i=strokes.length-1;i>=0;i--){const s=strokes[i];if(isSmartFigure(s)&&visibleBarHit(s,p))return s;}
 return null;
}

function edgeHit(s,p){
 const f=frame(s);
 if(!inBox(p,f,HIT))return null;
 const dl=Math.abs(p.x-f.x),dr=Math.abs(p.x-(f.x+f.w)),dt=Math.abs(p.y-f.y),db=Math.abs(p.y-(f.y+f.h));
 let h='',v='';
 if(dl<=HIT||dr<=HIT)h=dl<=dr?'left':'right';
 if(dt<=HIT||db<=HIT)v=dt<=db?'top':'bottom';
 if(!h&&!v)return null;
 return v+h||h||v;
}
function topBorderHit(p){
 for(let i=strokes.length-1;i>=0;i--){const s=strokes[i];if(!isSmartFigure(s))continue;const edge=edgeHit(s,p);if(edge)return{s,edge};}
 return null;
}
function cursorFor(edge){
 if(edge==='left'||edge==='right')return'ew-resize';
 if(edge==='top'||edge==='bottom')return'ns-resize';
 if(edge==='topleft'||edge==='bottomright')return'nwse-resize';
 if(edge==='topright'||edge==='bottomleft')return'nesw-resize';
 return'default';
}
function scaleFromPointer(g,p){
 const left=g.x*cssW,top=g.y*cssH,ow=Math.max(1,g.w*cssW),oh=Math.max(1,g.h*cssH),right=left+ow,bottom=top+oh;
 const vals=[];
 if(g.edge.includes('right'))vals.push((p.x-left)/ow);
 if(g.edge.includes('left'))vals.push((right-p.x)/ow);
 if(g.edge.includes('bottom'))vals.push((p.y-top)/oh);
 if(g.edge.includes('top'))vals.push((bottom-p.y)/oh);
 let q=vals.length?vals[0]:1;
 if(vals.length>1)q=Math.abs(vals[1]-1)>Math.abs(vals[0]-1)?vals[1]:vals[0];
 if(!Number.isFinite(q))q=1;
 const minByPixels=Math.max(42/ow,42/oh,MIN_SCALE);
 const maxX=g.edge.includes('left')?(g.x+g.w)/Math.max(.0001,g.w):(1-g.x)/Math.max(.0001,g.w);
 const maxY=g.edge.includes('top')?(g.y+g.h)/Math.max(.0001,g.h):(1-g.y)/Math.max(.0001,g.h);
 q=Math.max(minByPixels,Math.min(q,maxX,maxY,6));
 return q;
}
function applyResize(e){
 if(!gesture)return;
 if(gesture.pointerId!=null&&e.pointerId!=null&&e.pointerId!==gesture.pointerId)return;
 const p=canvasPoint(e),q=scaleFromPointer(gesture,p),s=gesture.s,newW=gesture.w*q,newH=gesture.h*q;
 let newX=gesture.x,newY=gesture.y;
 if(gesture.edge.includes('left'))newX=gesture.x+gesture.w-newW;
 if(gesture.edge.includes('top'))newY=gesture.y+gesture.h-newH;
 s.x=Math.max(0,Math.min(1-newW,newX));
 s.y=Math.max(0,Math.min(1-newH,newY));
 s.w=Math.max(.001,newW);
 s.h=Math.max(.001,newH);
 redraw();
 canvas.style.cursor=cursorFor(gesture.edge);
}
function finishResize(e){
 if(!gesture)return;
 if(e&&gesture.pointerId!=null&&e.pointerId!=null&&e.pointerId!==gesture.pointerId)return;
 const id=gesture.pointerId;
 gesture=null;
 try{if(id!=null&&canvas.hasPointerCapture?.(id))canvas.releasePointerCapture?.(id);}catch{}
 redraw();
 if(typeof syncUi==='function')syncUi();
 canvas.style.cursor='default';
}

window.addEventListener('pointerdown',e=>{
 if(e.target!==canvas||typeof tool!=='undefined'&&tool!=='select'||(e.button!==undefined&&e.button!==0))return;
 const p=canvasPoint(e),border=topBorderHit(p);
 if(border&&armed===border.s){
  const s=border.s;
  gesture={s,edge:border.edge,pointerId:e.pointerId,x:s.x,y:s.y,w:s.w,h:s.h};
  try{canvas.setPointerCapture?.(e.pointerId);}catch{}
  canvas.style.cursor=cursorFor(border.edge);
  e.preventDefault();
  e.stopImmediatePropagation();
  return;
 }
 const visible=topVisibleSmartAt(p);
 if(visible){armed=visible;return;}
 if(border){armed=border.s;return;}
 armed=null;
},true);

window.addEventListener('pointermove',e=>{
 if(gesture){applyResize(e);e.preventDefault();e.stopImmediatePropagation();return;}
 if(e.target!==canvas||typeof tool!=='undefined'&&tool!=='select'||!armed)return;
 const p=canvasPoint(e),edge=edgeHit(armed,p);
 if(edge)requestAnimationFrame(()=>{if(!gesture&&armed&&typeof tool!=='undefined'&&tool==='select')canvas.style.cursor=cursorFor(edge);});
},true);

window.addEventListener('pointerup',e=>{if(!gesture)return;finishResize(e);e.preventDefault();e.stopImmediatePropagation();},true);
window.addEventListener('pointercancel',e=>{if(!gesture)return;finishResize(e);e.preventDefault();e.stopImmediatePropagation();},true);
canvas.addEventListener('lostpointercapture',e=>{if(gesture)finishResize(e);},true);
window.addEventListener('blur',()=>{if(gesture)finishResize(null);});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(gesture)finishResize(null);armed=null;}},true);
document.addEventListener('click',e=>{if(e.target?.closest?.('button')&&!e.target.closest('#selectBtn'))armed=null;},false);
})();

// Load the beta-only 3-bar recognition correction after all comparison-model handlers.
(function(){
 if(document.querySelector('script[data-smart-3bar-count-fix]'))return;
 const s=document.createElement('script');
 s.dataset.smart3barCountFix='1';
 s.src='smart-math-comparison-3bar-count-fix.js?v=20261016-3barfix1';
 document.head.appendChild(s);
})();
