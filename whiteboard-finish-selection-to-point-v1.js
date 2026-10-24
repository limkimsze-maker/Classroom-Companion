(function(){
'use strict';
// Classroom-wide finish gesture: once a teacher has selected/edited an object,
// a TAP on truly empty canvas deselects and returns to the pointing finger.
// Never terminate freehand drawing, selection of another object, marquee
// drags, resize handles, or a still-active Smart Math drawing workflow.
if(typeof canvas==='undefined'||typeof strokes==='undefined'||!window.ClassroomFingerPointer)return;
if(window.ClassroomFinishSelectionToPoint)return;
let press=null,sequence=0;
const within=(p,b,pad=0)=>p.x>=b.x-pad&&p.x<=b.x+b.w+pad&&p.y>=b.y-pad&&p.y<=b.y+b.h+pad;
function locationOnCanvas(e){
 const r=canvas.getBoundingClientRect();
 const x=(e.clientX-r.left)/Math.max(1,r.width),y=(e.clientY-r.top)/Math.max(1,r.height);
 return {x,y,W:Math.max(1,r.width),H:Math.max(1,r.height)};
}
function distanceToSegment(px,py,a,b,W,H){
 const ax=a.x*W,ay=a.y*H,bx=b.x*W,by=b.y*H;
 const dx=bx-ax,dy=by-ay,len=dx*dx+dy*dy;
 const t=len?Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/len)):0;
 return Math.hypot(px-(ax+t*dx),py-(ay+t*dy));
}
function touchesInk(s,p){
 if(!s||s.erase||s.background)return false;
 if(Number.isFinite(s.x)&&Number.isFinite(s.y)&&Number.isFinite(s.w)&&Number.isFinite(s.h)&&s.w>0&&s.h>0){
  const extra=5/Math.max(1,Math.min(p.W,p.H));
  return within(p,s,extra);
 }
 const dots=s.points;if(!Array.isArray(dots)||!dots.length)return false;
 const px=p.x*p.W,py=p.y*p.H;
 const tolerance=Math.max(9,Math.min(19,(Number(s.size)||4)*.7+6));
 if(dots.length===1)return Math.hypot(px-dots[0].x*p.W,py-dots[0].y*p.H)<=tolerance;
 for(let j=1;j<dots.length;j++){
  if(distanceToSegment(px,py,dots[j-1],dots[j],p.W,p.H)<=tolerance)return true;
 }
 return false;
}
function blank(e){
 const p=locationOnCanvas(e);
 if(p.x<0||p.x>1||p.y<0||p.y>1)return false;
 // A blank space means nothing was hit, including unconverted drawings.
 for(let i=strokes.length-1;i>=0;i--)if(touchesInk(strokes[i],p))return false;
 return true;
}
function hasSelection(){
 return !!(window.ClassroomObjectSelection?.hasSelection?.()||
 window.ClassroomUnifiedSmartTransforms?.selected?.()||
 window.ClassroomFractionTransforms?.selected?.()||
 window.ClassroomFractionSegmentOptions?.selected?.()||
 window.WhiteboardMarqueeSelection?.get?.()?.length||
 window.ClassroomCounterColourAction?.selected?.());
}
function finish(){
 if(tool!=='select')return false;
 window.ClassroomObjectSelection?.clear?.();
 window.WhiteboardMarqueeSelection?.clear?.();
 window.ClassroomCounterColourAction?.hide?.();
 window.ClassroomUnifiedSmartTransforms?.clear?.();
 // Existing fraction/bar options already implement Escape cancellation. It is
 // dispatched while still in Select, before enabling the finger pointer.
 try{document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))}catch(_){}
 window.ClassroomUnifiedSmartTransforms?.clear?.();
 const finger=window.ClassroomFingerPointer;
 if(!finger||typeof finger.setActive!=='function')return false;
 finger.setActive(true);
 return !!finger.isActive?.();
}
window.addEventListener('pointerdown',e=>{
 // A new gesture cancels any queued finish; never change tools if the teacher
 // immediately starts another selection, drag, or freehand stroke.
 sequence++;press=null;
 if(e.target!==canvas||tool!=='select'||e.button!=null&&e.button!==0)return;
 // Remember the selection BEFORE other modules clear it on this same press.
 if(!hasSelection())return;
 press={id:e.pointerId,x:e.clientX,y:e.clientY,wasBlank:blank(e),sequence};
},true);
window.addEventListener('pointercancel',()=>{press=null;sequence++},true);
function completeTap(e){
 const p=press;
 if(!p||p.id!=null&&e.pointerId!=null&&p.id!==e.pointerId)return;
 press=null;
 if(!p.wasBlank||tool!=='select'||e.target!==canvas)return;
 if(Math.hypot(e.clientX-p.x,e.clientY-p.y)>8)return; // drags are not taps
 if(!blank(e))return; // releasing over a different object must not finish
 // Let other Select handlers finish clearing the old selection first.
 // In particular, the marquee controller forwards short taps because it
 // consumes pointerup before this window listener receives that event.
 setTimeout(()=>{if(sequence===p.sequence&&tool==='select')finish()},0);
}
window.addEventListener('pointerup',completeTap,true);
document.addEventListener('whiteboard-marquee-blank-tap',e=>completeTap(e.detail||{}),true);
document.addEventListener('whiteboard-annotation-context',()=>{press=null;sequence++},true);
window.ClassroomFinishSelectionToPoint={finish,hitBlank:blank,hasSelection};
})();