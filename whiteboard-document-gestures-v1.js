(function(){
'use strict';
let board=null,canvasEl=null,bar=null,pageBox=null,plusBtn=null,minusBtn=null,zoomLabel=null,handBtn=null;
let navigationOn=true,wheelTotal=0,wheelLockUntil=0,zoomLockUntil=0;
const pointers=new Map();
let drag=null,pinch=null;

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
 ensureHandButton();
 return !!pageBox;
}
function ensureHandButton(){
 if(!bar)return;
 handBtn=document.getElementById('documentTouchNavBtn');
 if(!handBtn){
  handBtn=document.createElement('button');handBtn.id='documentTouchNavBtn';handBtn.type='button';handBtn.textContent='✋';handBtn.title='Touch navigation: finger scrolls/zooms, stylus draws';handBtn.setAttribute('aria-label','Touch navigation');
  const search=[...bar.querySelectorAll('button')].find(b=>(b.textContent||'').includes('🔎'));
  if(search)bar.insertBefore(handBtn,search);else bar.appendChild(handBtn);
  handBtn.addEventListener('click',()=>setNavigation(!navigationOn));
 }
 paintHandButton();
}
function paintHandButton(){
 if(!handBtn)return;
 handBtn.setAttribute('aria-pressed',String(navigationOn));
 handBtn.style.background=navigationOn?'#0f766e':'#fff';
 handBtn.style.color=navigationOn?'#fff':'#17324d';
 handBtn.style.borderColor=navigationOn?'#0f766e':'#d8e1e8';
}
function setNavigation(on){navigationOn=!!on;paintHandButton();pointers.clear();drag=null;pinch=null}
function insideBoard(e){
 if(!board)return false;
 const path=e.composedPath?.()||[];
 if(path.includes(board)||path.includes(canvasEl))return true;
 if(typeof e.clientX!=='number'||typeof e.clientY!=='number')return false;
 const r=board.getBoundingClientRect();
 return e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;
}
function isNavigationPointer(e){
 if(!navigationOn)return false;
 if(e.pointerType==='pen')return false;
 if(e.pointerType==='touch')return true;
 if(e.pointerType==='mouse')return true;
 return false;
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
function currentZoomPercent(){
 const n=parseInt((zoomLabel?.textContent||'100').replace(/[^0-9]/g,''),10);
 return Number.isFinite(n)?n:100;
}
function zoomStep(dir){
 if(!active())return false;
 const b=dir>0?plusBtn:minusBtn;
 if(!b||b.disabled)return false;
 b.click();return true;
}
function zoomToward(targetPercent){
 targetPercent=Math.max(55,Math.min(220,targetPercent));
 let current=currentZoomPercent(),guard=0;
 while(targetPercent>current+5&&guard++<3){if(!zoomStep(1))break;current=currentZoomPercent()}
 guard=0;
 while(targetPercent<current-5&&guard++<3){if(!zoomStep(-1))break;current=currentZoomPercent()}
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
 e.preventDefault();e.stopImmediatePropagation();
 if(e.ctrlKey||e.metaKey){
  const now=performance.now();
  if(now<zoomLockUntil||Math.abs(dy)<0.1)return;
  zoomStep(dy<0?1:-1);zoomLockUntil=now+45;return;
 }
 if(Math.abs(dy)<0.15)return;
 wheelTotal+=dy;
 const now=performance.now();
 if(now<wheelLockUntil)return;
 if(Math.abs(wheelTotal)>=12){
  const dir=wheelTotal>0?1:-1;
  if(goPage(dir))wheelLockUntil=now+120;
  wheelTotal=0;
 }
}
function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function midpoint(a,b){return{x:(a.x+b.x)/2,y:(a.y+b.y)/2}}
function twoPointers(){return [...pointers.values()].slice(0,2)}
function startPinch(){
 if(pointers.size<2)return;
 const p=twoPointers(),d=Math.max(1,distance(p[0],p[1])),m=midpoint(p[0],p[1]);
 pinch={startDistance:d,startZoom:currentZoomPercent(),lastMid:m,lastPageMid:m};
 drag=null;cancelDrawing();
}
function onPointerDown(e){
 if(!active())return;
 if(!board||!pageBox)if(!findControls())return;
 if(!insideBoard(e)||!isNavigationPointer(e))return;
 if(e.pointerType==='mouse'&&e.button!==0)return;
 e.preventDefault();e.stopImmediatePropagation();cancelDrawing();
 pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,type:e.pointerType});
 if(pointers.size>=2)startPinch();
 else drag={id:e.pointerId,lastY:e.clientY,accumY:0,lastAction:0};
}
function onPointerMove(e){
 if(!active()||!navigationOn||!pointers.has(e.pointerId))return;
 if(e.pointerType==='mouse'&&e.buttons===0){onPointerEnd(e);return}
 e.preventDefault();e.stopImmediatePropagation();cancelDrawing();
 pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,type:e.pointerType});
 if(pointers.size>=2){
  if(!pinch)startPinch();
  const p=twoPointers(),d=Math.max(1,distance(p[0],p[1])),m=midpoint(p[0],p[1]);
  const ratio=d/Math.max(1,pinch.startDistance);
  zoomToward(pinch.startZoom*ratio);
  const pageDy=m.y-pinch.lastPageMid.y;
  const distanceChange=Math.abs(ratio-1);
  if(distanceChange<0.035&&Math.abs(pageDy)>=26){
   goPage(pageDy<0?1:-1);pinch.lastPageMid=m;pinch.startDistance=d;pinch.startZoom=currentZoomPercent();
  }
  pinch.lastMid=m;return;
 }
 if(!drag||drag.id!==e.pointerId)drag={id:e.pointerId,lastY:e.clientY,accumY:0,lastAction:0};
 const dy=e.clientY-drag.lastY;drag.lastY=e.clientY;drag.accumY+=dy;
 const now=performance.now();
 if(Math.abs(drag.accumY)>=24&&now-drag.lastAction>=90){
  goPage(drag.accumY<0?1:-1);drag.accumY=0;drag.lastAction=now;
 }
}
function onPointerEnd(e){
 if(!pointers.has(e.pointerId))return;
 e.preventDefault?.();e.stopImmediatePropagation?.();
 pointers.delete(e.pointerId);
 if(pointers.size>=2)startPinch();
 else if(pointers.size===1){
  const [id,p]=[...pointers.entries()][0];drag={id,lastY:p.y,accumY:0,lastAction:performance.now()};pinch=null;
 }else{drag=null;pinch=null}
 cancelDrawing();
}
function wirePageBox(){
 if(!pageBox||pageBox.dataset.fastPageJump==='1')return;
 pageBox.dataset.fastPageJump='1';
 pageBox.addEventListener('keydown',e=>{
  if(e.key==='Enter'){
   e.preventDefault();e.stopImmediatePropagation();pageBox.dispatchEvent(new Event('change',{bubbles:true}));
   requestAnimationFrame(()=>{pageBox.focus();pageBox.select()});
  }
 });
 pageBox.addEventListener('focus',()=>requestAnimationFrame(()=>pageBox.select()));
 pageBox.addEventListener('click',()=>pageBox.select());
}
function wire(){
 if(!findControls())return false;
 wirePageBox();
 if(document.documentElement.dataset.documentGesturesV3==='1')return true;
 document.documentElement.dataset.documentGesturesV3='1';
 window.addEventListener('wheel',onWheel,{passive:false,capture:true});
 window.addEventListener('pointerdown',onPointerDown,true);
 window.addEventListener('pointermove',onPointerMove,true);
 window.addEventListener('pointerup',onPointerEnd,true);
 window.addEventListener('pointercancel',onPointerEnd,true);
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
