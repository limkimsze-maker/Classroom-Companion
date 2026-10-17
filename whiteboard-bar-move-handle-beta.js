/* Beta-only move cursor. Frozen model builders and editors are unchanged. */
(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function'||typeof syncUi!=='function')return;
const board=document.getElementById('boardWrap');
if(!board||document.getElementById('barModelMoveCursorStyles'))return;
const cache=new WeakMap(),undoMoves=[];
let drag=null,lastPointer=null,suppressed=null,queued=false;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const copy=v=>JSON.parse(JSON.stringify(v));
const signature=()=>JSON.stringify(strokes);
const selectable=()=>typeof tool!=='undefined'&&tool==='select';
const isModel=o=>o?.type==='image'&&o.smartType==='barModel'&&[o.x,o.y,o.w,o.h].every(Number.isFinite)&&o.w>0&&o.h>0;
const style=document.createElement('style');style.id='barModelMoveCursorStyles';
style.textContent=`
#boardWrap.bar-model-move-ready,#boardWrap.bar-model-move-ready *,#boardWrap.bar-model-moving,#boardWrap.bar-model-moving *{cursor:move!important}
#boardWrap.bar-model-move-released,#boardWrap.bar-model-move-released *{cursor:default!important}
`;
document.head.appendChild(style);
function cursor(state){
 for(const [name,on] of [['bar-model-move-ready',state==='ready'],['bar-model-moving',state==='moving'],['bar-model-move-released',state==='released']])board.classList.toggle(name,on);
}
function usableTarget(target){
 return target===canvas||!!target?.closest?.('.partwhole-compact-hit-zone,.comparison-segment-hit-zone,.multiplicative-unit-zone');
}
function shape(o){
 const prior=cache.get(o);if(prior?.src===o.src)return prior;
 const result={src:o.src,rects:[],lines:[]};cache.set(o,result);
 try{
  const src=String(o.src||''),comma=src.indexOf(',');
  if(comma<0||!/^data:image\/svg\+xml[;,]/i.test(src))return result;
  const xml=src.slice(0,comma).includes(';base64')?atob(src.slice(comma+1)):decodeURIComponent(src.slice(comma+1));
  const svg=new DOMParser().parseFromString(xml,'image/svg+xml').documentElement;
  const vb=(svg.getAttribute('viewBox')||'').trim().split(/[ ,]+/).map(Number);
  const ox=vb.length===4?vb[0]:0,oy=vb.length===4?vb[1]:0,W=vb.length===4?vb[2]:parseFloat(svg.getAttribute('width')),H=vb.length===4?vb[3]:parseFloat(svg.getAttribute('height'));
  if(!(W>0&&H>0))return result;
  for(const rect of svg.querySelectorAll('rect')){
   if(!rect.getAttribute('stroke')||rect.getAttribute('stroke')==='none')continue;
   const x=(parseFloat(rect.getAttribute('x')||'0')-ox)/W,y=(parseFloat(rect.getAttribute('y')||'0')-oy)/H,w=parseFloat(rect.getAttribute('width'))/W,h=parseFloat(rect.getAttribute('height'))/H;
   if([x,y,w,h].every(Number.isFinite)&&w>0&&h>0)result.rects.push({x,y,w,h});
  }
  // Equal Grouping uses dashed horizontal edges between its end groups.
  if(o.smartBarType==='equalauto')for(const line of svg.querySelectorAll('line')){
   const x1=(parseFloat(line.getAttribute('x1'))-ox)/W,x2=(parseFloat(line.getAttribute('x2'))-ox)/W,y1=(parseFloat(line.getAttribute('y1'))-oy)/H,y2=(parseFloat(line.getAttribute('y2'))-oy)/H;
   if([x1,x2,y1,y2].every(Number.isFinite)&&Math.abs(y1-y2)<.001)result.lines.push({x1,x2,y:y1});
  }
 }catch{}
 return result;
}
function boxes(o,r){return shape(o).rects.map(q=>({x:(o.x+o.w*q.x)*r.width,y:(o.y+o.h*q.y)*r.height,w:o.w*q.w*r.width,h:o.h*q.h*r.height}))}
function reservedHandle(o,p,rects,r){
 if(!rects.length)return false;
 if(o.smartBarType==='partwhole'||o.smartBarType==='comparison'){
  const cx=(o.x+o.w*.5)*r.width,top=Math.min(...rects.map(q=>q.y)),bottom=Math.max(...rects.map(q=>q.y+q.h));
  if(Math.abs(p.x-cx)<=24&&(Math.abs(p.y-top)<=17||Math.abs(p.y-bottom)<=17))return true;
 }
 if(o.smartBarType==='comparison')for(const q of rects)if(Math.hypot(p.x-(q.x+q.w),p.y-(q.y+q.h/2))<=17)return true;
 if(o.smartBarType==='partwhole'){
  const n=Math.max(2,Number(o.barCount)||2),cuts=Array.isArray(o.barCuts)&&o.barCuts.length===n-1?o.barCuts:Array.from({length:n-1},(_,i)=>(i+1)/n);
  for(const cut of cuts)if(Math.abs(p.x-(o.x+o.w*(60/900+780/900*cut))*r.width)<=14)return true;
 }
 return false;
}
function modelAt(e){
 if(!selectable()||!usableTarget(e.target))return null;
 const r=canvas.getBoundingClientRect(),p={x:e.clientX-r.left,y:e.clientY-r.top},tol=e.pointerType==='touch'?12:6;
 for(let i=strokes.length-1;i>=0;i--){
  const o=strokes[i];if(!isModel(o)||o.locked)continue;
  const rects=boxes(o,r);if(reservedHandle(o,p,rects,r))continue;
  for(const q of rects){
   const inside=p.x>=q.x-tol&&p.x<=q.x+q.w+tol&&p.y>=q.y-tol&&p.y<=q.y+q.h+tol;
   if(inside&&Math.min(Math.abs(p.x-q.x),Math.abs(p.x-q.x-q.w),Math.abs(p.y-q.y),Math.abs(p.y-q.y-q.h))<=tol)return o;
  }
  for(const q of shape(o).lines){const x1=(o.x+o.w*q.x1)*r.width,x2=(o.x+o.w*q.x2)*r.width,y=(o.y+o.h*q.y)*r.height;if(p.x>=Math.min(x1,x2)-tol&&p.x<=Math.max(x1,x2)+tol&&Math.abs(p.y-y)<=tol)return o}
 }
 return null;
}
function hover(e){
 if(drag){cursor('moving');return}
 const o=modelAt(e);
 if(suppressed&&o===suppressed){cursor('released');return}
 suppressed=null;cursor(o?'ready':'');
}
function schedule(){
 if(queued)return;queued=true;requestAnimationFrame(()=>{
  queued=false;
  if(drag&&(!selectable()||!strokes.includes(drag.o)))endDrag(true);
  else if(lastPointer)hover(lastPointer);
  else cursor('');
 });
}
function stop(e){e.preventDefault();e.stopImmediatePropagation()}
function moveTo(o,start,dx,dy){
 o.x=clamp(start.x+dx,Math.min(0,1-o.w,start.x),Math.max(0,1-o.w,start.x));
 o.y=clamp(start.y+dy,Math.min(0,1-o.h,start.y),Math.max(0,1-o.h,start.y));
}
function canUndoMove(){return !!undoMoves.length&&undoMoves[undoMoves.length-1].after===signature()}
function updateDrag(e){
 if(!drag||e.pointerId!==drag.id)return;
 const r=canvas.getBoundingClientRect();moveTo(drag.o,drag.start,(e.clientX-drag.clientX)/Math.max(1,r.width),(e.clientY-drag.clientY)/Math.max(1,r.height));redraw();cursor('moving');
}
function endDrag(cancelled,e){
 if(!drag)return;const d=drag;
 if(e&&!cancelled)updateDrag(e);
 drag=null;
 if(cancelled&&strokes.includes(d.o)){d.o.x=d.start.x;d.o.y=d.start.y}
 try{canvas.releasePointerCapture(d.id)}catch{}
 redraw();
 if(!cancelled&&strokes.includes(d.o)&&(d.o.x!==d.start.x||d.o.y!==d.start.y)){
  undoMoves.push({index:strokes.indexOf(d.o),x:d.start.x,y:d.start.y,after:signature()});if(undoMoves.length>100)undoMoves.shift();
  window.__smartBarLastHistory={before:d.before,afterId:d.o.smartId};
 }
 suppressed=cancelled?null:d.o;
 if(e)lastPointer=e;
 cursor(cancelled?'':'released');syncUi();
}
// Run before PDF gestures, and only take a drag on an actual bar outline.
window.addEventListener('pointerdown',e=>{
 if(drag){stop(e);return}
 if(e.button!==undefined&&e.button!==0)return;
 const o=modelAt(e);if(!o)return;
 stop(e);lastPointer=e;suppressed=null;
 drag={id:e.pointerId,o,start:{x:o.x,y:o.y},clientX:e.clientX,clientY:e.clientY,before:copy(strokes)};
 try{canvas.setPointerCapture(e.pointerId)}catch{}
 cursor('moving');
},{capture:true,passive:false});
window.addEventListener('pointermove',e=>{
 lastPointer=e;
 if(drag){if(e.pointerId!==drag.id)return;stop(e);updateDrag(e);return}
 hover(e);
},{capture:true,passive:false});
window.addEventListener('pointerup',e=>{if(!drag||e.pointerId!==drag.id)return;stop(e);endDrag(false,e)},{capture:true,passive:false});
window.addEventListener('pointercancel',e=>{if(!drag||e.pointerId!==drag.id)return;stop(e);endDrag(true)},{capture:true,passive:false});
canvas.addEventListener('lostpointercapture',e=>{if(drag&&e.pointerId===drag.id)endDrag(true)});
board.addEventListener('pointerleave',()=>{if(!drag){lastPointer=null;suppressed=null;cursor('')}});
window.addEventListener('keydown',e=>{if(drag&&(e.key==='Escape'||((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'))){stop(e);endDrag(true)}},true);
window.addEventListener('blur',()=>{endDrag(true);lastPointer=null;suppressed=null;cursor('')});
document.addEventListener('visibilitychange',()=>{if(document.hidden){endDrag(true);lastPointer=null;cursor('')}});
const previousRedraw=redraw;redraw=function(){const r=previousRedraw.apply(this,arguments);schedule();return r};
const previousSync=syncUi;syncUi=function(){const r=previousSync.apply(this,arguments),undo=document.getElementById('undoBtn');if(undo&&canUndoMove())undo.disabled=false;schedule();return r};
const undo=document.getElementById('undoBtn');
if(undo){const previousUndo=undo.onclick;undo.onclick=function(e){
 if(drag){endDrag(true);return}
 if(canUndoMove()){const last=undoMoves.pop(),o=strokes[last.index];o.x=last.x;o.y=last.y;suppressed=null;redraw();syncUi();return}
 if(typeof previousUndo==='function')return previousUndo.call(this,e);
}}
window.addEventListener('resize',schedule);
if(window.ResizeObserver)new ResizeObserver(schedule).observe(board);
schedule();
})();
