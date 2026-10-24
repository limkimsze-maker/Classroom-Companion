(function(){
'use strict';
// Classroom Companion: tap an existing object while in 👆 Point to reopen editing.
// Pointing, hovering, dragging, Pen and Eraser remain untouched.
if(typeof canvas==='undefined'||typeof strokes==='undefined'||
   !window.ClassroomFingerPointer||window.ClassroomPointTapReselect)return;

const finger=window.ClassroomFingerPointer;
let press=null,sequence=0;
function coords(e){
 const r=canvas.getBoundingClientRect();
 const W=Math.max(1,r.width),H=Math.max(1,r.height);
 return {x:(e.clientX-r.left)/W,y:(e.clientY-r.top)/H,W,H};
}
function markAt(s,p){
 const pts=s.points;
 if(!Array.isArray(pts)||!pts.length)return false;
 const px=p.x*p.W,py=p.y*p.H;
 const tol=Math.max(7,Math.min(16,Number(s.size)||5));
 if(pts.length===1)return Math.hypot(px-pts[0].x*p.W,py-pts[0].y*p.H)<=tol;
 for(let i=1;i<pts.length;i++){
  const a=pts[i-1],b=pts[i],ax=a.x*p.W,ay=a.y*p.H,bx=b.x*p.W,by=b.y*p.H;
  const dx=bx-ax,dy=by-ay,den=dx*dx+dy*dy;
  const t=den?Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/den)):0;
  if(Math.hypot(px-ax-dx*t,py-ay-dy*t)<=tol)return true;
 }
 return false;
}
function at(e){
 const p=coords(e);
 if(p.x<0||p.x>1||p.y<0||p.y>1)return null;
 for(let i=strokes.length-1;i>=0;i--){
  const obj=strokes[i];
  if(!obj||obj.erase||obj.background)continue;
  if([obj.x,obj.y,obj.w,obj.h].every(Number.isFinite)&&obj.w>0&&obj.h>0){
   const inside=p.x>=obj.x&&p.x<=obj.x+obj.w&&p.y>=obj.y&&p.y<=obj.y+obj.h;
   if(!inside)continue;
   // Counters are circular. A tap in the empty corner of their outer
   // bounding box should keep pointing, not enter editing.
   if(obj.smartType==='counter'){
    const dx=(p.x-obj.x-obj.w/2)/(obj.w/2);
    const dy=(p.y-obj.y-obj.h/2)/(obj.h/2);
    if(dx*dx+dy*dy>1.05)continue;
   }
   // Never select a locked/background or unsupported object behind this one.
   return obj.locked||!['text','image'].includes(obj.type)?null:obj;
  }
  // Handwriting over a model should not select the obscured model underneath.
  if(markAt(obj,p))return null;
 }
 return null;
}
function cancel(){sequence++;press=null}
window.addEventListener('pointerdown',e=>{
 cancel();
 if(!finger.isActive?.()||e.target!==canvas||(e.button!=null&&e.button!==0)||
    e.isPrimary===false)return;
 const obj=at(e);
 if(obj)press={id:e.pointerId,x:e.clientX,y:e.clientY,obj,sequence};
},true);
window.addEventListener('pointercancel',cancel,true);
window.addEventListener('pointerup',e=>{
 const p=press;press=null;
 if(!p||!finger.isActive?.()||e.target!==canvas||
    (p.id!=null&&e.pointerId!=null&&p.id!==e.pointerId)||
    Math.hypot(e.clientX-p.x,e.clientY-p.y)>8||
    at(e)!==p.obj)return;
 // The finger tool owns the actual pointer events. Change modes only AFTER
 // that gesture has finished: no synthetic pointerdown, no accidental drag.
 setTimeout(()=>{
  if(sequence!==p.sequence||!finger.isActive?.()||!strokes.includes(p.obj))return;
  finger.setActive(false);
  if(typeof tool!=='string'||tool!=='select')return;
  const chosen=window.ClassroomObjectSelection?.select?.(p.obj);
  if(!chosen)return;
  if(p.obj.smartType==='counter'||p.obj.smartType==='barModel'||
     p.obj.smartType==='fractionBar'){
   window.ClassroomUnifiedSmartTransforms?.select?.(p.obj.smartId);
  }
  if(p.obj.smartType==='counter')window.ClassroomCounterColourAction?.openFor?.(p.obj.smartId);
 },0);
},true);
document.addEventListener('whiteboard-annotation-context',cancel,true);
window.ClassroomPointTapReselect={hitObject:at};
})();
