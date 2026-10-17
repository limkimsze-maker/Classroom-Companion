(function(){
'use strict';
let canvasEl=null,bar=null,pageBox=null,plusBtn=null,minusBtn=null;
let wheelSum=0,wheelLockUntil=0,zoomWheelSum=0;
const touches=new Map();
let pinch=null,pinchUndoPending=false;

function active(){return document.body.classList.contains('document-open-mode')}
function findControls(){
 canvasEl=document.getElementById('board');
 bar=document.getElementById('documentQuickBar');
 if(!canvasEl||!bar)return false;
 pageBox=bar.querySelector('input[type="number"]');
 const buttons=[...bar.querySelectorAll('button')];
 minusBtn=buttons.find(b=>b.textContent.trim()==='−')||null;
 plusBtn=buttons.find(b=>b.textContent.trim()==='+')||null;
 return !!pageBox;
}
function pageNow(){return Math.max(1,Number(pageBox?.value)||1)}
function pageMax(){return Math.max(1,Number(pageBox?.max)||1)}
function goPage(delta){
 if(!active()||!pageBox)return;
 const next=Math.max(1,Math.min(pageMax(),pageNow()+delta));
 if(next===pageNow())return;
 pageBox.value=String(next);
 pageBox.dispatchEvent(new Event('change',{bubbles:true}));
}
function zoomStep(dir){
 if(!active())return;
 const b=dir>0?plusBtn:minusBtn;
 if(b&&!b.disabled)b.click();
}
function onWheel(e){
 if(!active())return;
 if(!bar||!pageBox)findControls();
 if(e.ctrlKey||e.metaKey){
  e.preventDefault();e.stopPropagation();
  zoomWheelSum+=e.deltaY;
  while(Math.abs(zoomWheelSum)>=18){
   const dir=zoomWheelSum<0?1:-1;
   zoomStep(dir);zoomWheelSum+=dir>0?18:-18;
  }
  return;
 }
 if(Math.abs(e.deltaY)<2)return;
 e.preventDefault();e.stopPropagation();
 wheelSum+=e.deltaY;
 const now=performance.now();
 if(now<wheelLockUntil)return;
 if(Math.abs(wheelSum)>=55){
  goPage(wheelSum>0?1:-1);
  wheelSum=0;wheelLockUntil=now+220;
 }
}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function mid(a,b){return{x:(a.x+b.x)/2,y:(a.y+b.y)/2}}
function twoPoints(){return [...touches.values()].slice(0,2)}
function onPointerDown(e){
 if(!active()||e.pointerType!=='touch')return;
 touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(touches.size===2){
  const p=twoPoints();
  pinch={distance:Math.max(1,dist(p[0],p[1])),mid:mid(p[0],p[1]),lastDistance:Math.max(1,dist(p[0],p[1])),lastMid:mid(p[0],p[1])};
  pinchUndoPending=true;
  e.preventDefault();e.stopImmediatePropagation();
 }
}
function onPointerMove(e){
 if(!active()||e.pointerType!=='touch'||!touches.has(e.pointerId))return;
 touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(!pinch||touches.size<2)return;
 const p=twoPoints(),d=Math.max(1,dist(p[0],p[1])),m=mid(p[0],p[1]);
 const ratio=d/pinch.lastDistance;
 if(ratio>=1.11){zoomStep(1);pinch.lastDistance=d;pinch.lastMid=m}
 else if(ratio<=0.90){zoomStep(-1);pinch.lastDistance=d;pinch.lastMid=m}
 else{
  const dy=m.y-pinch.lastMid.y;
  if(Math.abs(d/pinch.distance-1)<0.08&&Math.abs(dy)>=58){
   goPage(dy<0?1:-1);pinch.lastMid=m;pinch.distance=d;pinch.lastDistance=d;
  }
 }
 e.preventDefault();e.stopImmediatePropagation();
}
function onPointerEnd(e){
 if(e.pointerType!=='touch')return;
 const wasPinching=!!pinch;
 touches.delete(e.pointerId);
 if(wasPinching&&pinchUndoPending){
  pinchUndoPending=false;
  queueMicrotask(()=>{
   const undo=document.getElementById('undoBtn');
   if(undo&&!undo.disabled)undo.click();
  });
 }
 if(touches.size<2)pinch=null;
}
function wire(){
 if(!findControls())return false;
 if(canvasEl.dataset.documentGestures==='1')return true;
 canvasEl.dataset.documentGestures='1';
 canvasEl.addEventListener('wheel',onWheel,{passive:false,capture:true});
 canvasEl.addEventListener('pointerdown',onPointerDown,true);
 canvasEl.addEventListener('pointermove',onPointerMove,true);
 canvasEl.addEventListener('pointerup',onPointerEnd,true);
 canvasEl.addEventListener('pointercancel',onPointerEnd,true);
 pageBox.addEventListener('keydown',e=>{
  if(e.key==='Enter'){
   e.preventDefault();e.stopPropagation();
   pageBox.dispatchEvent(new Event('change',{bubbles:true}));
   requestAnimationFrame(()=>{pageBox.focus();pageBox.select()});
  }
 });
 pageBox.addEventListener('focus',()=>requestAnimationFrame(()=>pageBox.select()));
 pageBox.addEventListener('click',()=>pageBox.select());
 return true;
}
wire();
const obs=new MutationObserver(()=>wire());
obs.observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('keydown',e=>{
 if(!active()||/INPUT|TEXTAREA/.test(document.activeElement?.tagName))return;
 if(e.key.toLowerCase()==='g'&&pageBox){e.preventDefault();pageBox.focus();pageBox.select()}
},true);
})();
