(function(){
'use strict';
let board=null,canvasEl=null,bar=null,pageBox=null,plusBtn=null,minusBtn=null,zoomLabel=null;
let wheelTotal=0,wheelLockUntil=0,zoomLockUntil=0;
const pointers=new Map();
let gesture=null;

function active(){return document.body.classList.contains('document-open-mode')}
function findControls(){
 board=document.getElementById('boardWrap');
 canvasEl=document.getElementById('board');
 bar=document.getElementById('documentQuickBar');
 if(!board||!canvasEl||!bar)return false;
 pageBox=bar.querySelector('input[type="number"]');
 const buttons=[...bar.querySelectorAll('button')];
 minusBtn=buttons.find(b=>b.textContent.trim()==='−')||null;
 plusBtn=buttons.find(b=>b.textContent.trim()==='+')||null;
 zoomLabel=[...bar.querySelectorAll('span')].find(s=>/%$/.test((s.textContent||'').trim()))||null;
 return !!pageBox;
}
function insideBoard(e){
 if(!board)return false;
 const path=e.composedPath?.()||[];
 if(path.includes(board)||path.includes(canvasEl))return true;
 if(typeof e.clientX!=='number'||typeof e.clientY!=='number')return false;
 const r=board.getBoundingClientRect();
 return e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;
}
function pageNow(){return Math.max(1,Number(pageBox?.value)||1)}
function pageMax(){return Math.max(1,Number(pageBox?.max)||1)}
function goPage(delta){
 if(!active()||!pageBox)return false;
 const now=pageNow(),next=Math.max(1,Math.min(pageMax(),now+delta));
 if(next===now)return false;
 pageBox.value=String(next);
 pageBox.dispatchEvent(new Event('change',{bubbles:true}));
 return true;
}
function zoomStep(dir){
 if(!active())return false;
 const b=dir>0?plusBtn:minusBtn;
 if(!b||b.disabled)return false;
 b.click();
 return true;
}
function cancelDrawing(){
 try{
  if(typeof drawing!=='undefined')drawing=false;
  if(typeof current!=='undefined')current=null;
  if(typeof redraw==='function')redraw();
 }catch{}
}
function normaliseWheel(e){
 let y=e.deltaY;
 if(e.deltaMode===1)y*=18;
 else if(e.deltaMode===2)y*=window.innerHeight;
 return y;
}
function onWheel(e){
 if(!active())return;
 if(!board||!pageBox)if(!findControls())return;
 if(!insideBoard(e))return;
 const dy=normaliseWheel(e);
 if(e.ctrlKey||e.metaKey){
  e.preventDefault();e.stopImmediatePropagation();
  const now=performance.now();
  if(now<zoomLockUntil||Math.abs(dy)<0.2)return;
  zoomStep(dy<0?1:-1);
  zoomLockUntil=now+70;
  return;
 }
 if(Math.abs(dy)<0.5)return;
 e.preventDefault();e.stopImmediatePropagation();
 wheelTotal+=dy;
 const now=performance.now();
 if(now<wheelLockUntil)return;
 if(Math.abs(wheelTotal)>=20){
  const dir=wheelTotal>0?1:-1;
  if(goPage(dir))wheelLockUntil=now+170;
  wheelTotal=0;
 }
}
function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function midpoint(a,b){return{x:(a.x+b.x)/2,y:(a.y+b.y)/2}}
function twoPointers(){return [...pointers.values()].slice(0,2)}
function beginGesture(){
 if(pointers.size<2)return;
 const p=twoPointers(),d=Math.max(1,distance(p[0],p[1])),m=midpoint(p[0],p[1]);
 gesture={baseDistance:d,lastDistance:d,baseMid:m,lastMid:m,lastAction:0};
 cancelDrawing();
}
function onPointerDown(e){
 if(!active()||e.pointerType!=='touch')return;
 if(!board||!pageBox)findControls();
 if(!insideBoard(e))return;
 pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pointers.size===2){
  beginGesture();
  e.preventDefault();e.stopImmediatePropagation();
 }
}
function onPointerMove(e){
 if(!active()||e.pointerType!=='touch'||!pointers.has(e.pointerId))return;
 pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(!gesture||pointers.size<2)return;
 const p=twoPointers(),d=Math.max(1,distance(p[0],p[1])),m=midpoint(p[0],p[1]);
 const now=performance.now();
 const ratio=d/gesture.lastDistance;
 const totalRatio=d/gesture.baseDistance;
 const dy=m.y-gesture.lastMid.y;
 const totalDy=m.y-gesture.baseMid.y;
 const isPinch=Math.abs(totalRatio-1)>=0.045;
 if(isPinch&&now-gesture.lastAction>=80){
  if(ratio>=1.035){zoomStep(1);gesture.lastDistance=d;gesture.lastAction=now}
  else if(ratio<=0.966){zoomStep(-1);gesture.lastDistance=d;gesture.lastAction=now}
 }else if(Math.abs(totalRatio-1)<0.08&&Math.abs(totalDy)>=42&&now-gesture.lastAction>=170){
  goPage(totalDy<0?1:-1);
  gesture.baseMid=m;gesture.lastMid=m;gesture.baseDistance=d;gesture.lastDistance=d;gesture.lastAction=now;
 }
 gesture.lastMid=m;
 cancelDrawing();
 e.preventDefault();e.stopImmediatePropagation();
}
function onPointerEnd(e){
 if(e.pointerType!=='touch')return;
 pointers.delete(e.pointerId);
 if(pointers.size<2){gesture=null;cancelDrawing()}
}
function wirePageBox(){
 if(!pageBox||pageBox.dataset.fastPageJump==='1')return;
 pageBox.dataset.fastPageJump='1';
 pageBox.addEventListener('keydown',e=>{
  if(e.key==='Enter'){
   e.preventDefault();e.stopImmediatePropagation();
   pageBox.dispatchEvent(new Event('change',{bubbles:true}));
   requestAnimationFrame(()=>{pageBox.focus();pageBox.select()});
  }
 });
 pageBox.addEventListener('focus',()=>requestAnimationFrame(()=>pageBox.select()));
 pageBox.addEventListener('click',()=>pageBox.select());
}
function wire(){
 if(!findControls())return false;
 wirePageBox();
 if(document.documentElement.dataset.documentGesturesV2==='1')return true;
 document.documentElement.dataset.documentGesturesV2='1';
 window.addEventListener('wheel',onWheel,{passive:false,capture:true});
 board.addEventListener('pointerdown',onPointerDown,true);
 board.addEventListener('pointermove',onPointerMove,true);
 board.addEventListener('pointerup',onPointerEnd,true);
 board.addEventListener('pointercancel',onPointerEnd,true);
 board.addEventListener('lostpointercapture',onPointerEnd,true);
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
