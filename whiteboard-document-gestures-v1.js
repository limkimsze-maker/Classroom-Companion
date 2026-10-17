(function(){
'use strict';
let board=null,canvasEl=null,bar=null,pageBox=null,plusBtn=null,minusBtn=null,zoomLabel=null,handBtn=null,pdfCanvas=null;
let navigationOn=true,panX=0,panY=0,liveScale=1,lastPageSeen='';
let mouseDrag=null,wheelEdge=0,wheelPinch=null,wheelCommitTimer=0;
const touches=new Map();
let pinch=null;

function active(){return document.body.classList.contains('document-open-mode')}
function findControls(){
 board=document.getElementById('boardWrap');
 canvasEl=document.getElementById('board');
 bar=document.getElementById('documentQuickBar');
 pdfCanvas=document.getElementById('documentPdfCanvas');
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
  handBtn=document.createElement('button');handBtn.id='documentTouchNavBtn';handBtn.type='button';handBtn.textContent='✋';
  handBtn.title='Grab document: finger/mouse moves page, stylus draws';handBtn.setAttribute('aria-label','Grab document');
  const search=[...bar.querySelectorAll('button')].find(b=>(b.textContent||'').includes('🔎'));
  if(search)bar.insertBefore(handBtn,search);else bar.appendChild(handBtn);
  handBtn.addEventListener('click',()=>setNavigation(!navigationOn));
 }
 paintHandButton();
}
function paintHandButton(){
 if(!handBtn)return;
 handBtn.setAttribute('aria-pressed',String(navigationOn));
 handBtn.style.background=navigationOn?'#0f766e':'#fff';handBtn.style.color=navigationOn?'#fff':'#17324d';handBtn.style.borderColor=navigationOn?'#0f766e':'#d8e1e8';
 if(canvasEl)canvasEl.style.cursor=navigationOn?'grab':'crosshair';
}
function setNavigation(on){navigationOn=!!on;touches.clear();mouseDrag=null;pinch=null;paintHandButton()}
function insideBoard(e){
 if(!board)return false;
 const path=e.composedPath?.()||[];if(path.includes(board)||path.includes(canvasEl))return true;
 if(typeof e.clientX!=='number'||typeof e.clientY!=='number')return false;
 const r=board.getBoundingClientRect();return e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;
}
function pdfVisible(){return !!(pdfCanvas&&getComputedStyle(pdfCanvas).display!=='none')}
function currentZoomPercent(){const n=parseInt((zoomLabel?.textContent||'100').replace(/[^0-9]/g,''),10);return Number.isFinite(n)?n:100}
function pageNow(){return Math.max(1,Number(pageBox?.value)||1)}
function pageMax(){return Math.max(1,Number(pageBox?.max)||1)}
function goPage(delta){
 if(!active()||!pageBox)return false;
 const now=pageNow(),next=Math.max(1,Math.min(pageMax(),now+delta));if(next===now)return false;
 pageBox.value=String(next);pageBox.dispatchEvent(new Event('change',{bubbles:true}));resetPan();return true;
}
function zoomStep(dir){const b=dir>0?plusBtn:minusBtn;if(!b||b.disabled)return false;b.click();return true}
function commitZoom(targetPercent){
 targetPercent=Math.max(55,Math.min(220,Number(targetPercent)||100));
 let current=currentZoomPercent(),guard=0;
 while(targetPercent>current+7&&guard++<14){if(!zoomStep(1))break;current=currentZoomPercent()}
 guard=0;
 while(targetPercent<current-7&&guard++<14){if(!zoomStep(-1))break;current=currentZoomPercent()}
}
function cancelDrawing(){try{if(typeof drawing!=='undefined')drawing=false;if(typeof current!=='undefined')current=null;if(typeof redraw==='function')redraw()}catch{}}
function panBounds(){
 if(!board||!pdfCanvas)return{x:140,y:140};
 const br=board.getBoundingClientRect();const w=(parseFloat(pdfCanvas.style.width)||pdfCanvas.getBoundingClientRect().width||br.width)*liveScale;const h=(parseFloat(pdfCanvas.style.height)||pdfCanvas.getBoundingClientRect().height||br.height)*liveScale;
 return{x:Math.max(140,(w-br.width)/2+140),y:Math.max(140,(h-br.height)/2+140)};
}
function clampPan(){const b=panBounds();panX=Math.max(-b.x,Math.min(b.x,panX));panY=Math.max(-b.y,Math.min(b.y,panY))}
function applyTransform(){
 if(!pdfVisible())return;
 clampPan();pdfCanvas.style.transformOrigin='center center';
 pdfCanvas.style.transform=`translate(-50%,-50%) translate(${panX}px,${panY}px) scale(${liveScale})`;
}
function panBy(dx,dy){
 const beforeX=panX,beforeY=panY;panX+=dx;panY+=dy;applyTransform();return{x:panX-beforeX,y:panY-beforeY};
}
function resetPan(){panX=0;panY=0;liveScale=1;wheelEdge=0;applyTransform()}
function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function midpoint(a,b){return{x:(a.x+b.x)/2,y:(a.y+b.y)/2}}
function touchPair(){return [...touches.values()].slice(0,2)}

function onPointerDown(e){
 if(!active()||!navigationOn||!insideBoard(e))return;
 if(e.pointerType==='pen')return;
 if(e.pointerType==='mouse'){
  if(e.button!==0)return;
  e.preventDefault();e.stopImmediatePropagation();cancelDrawing();
  mouseDrag={id:e.pointerId,x:e.clientX,y:e.clientY};canvasEl&&canvasEl.style.setProperty('cursor','grabbing');return;
 }
 if(e.pointerType!=='touch')return;
 e.preventDefault();e.stopImmediatePropagation();cancelDrawing();
 touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(touches.size>=2){
  const p=touchPair(),m=midpoint(p[0],p[1]);
  pinch={startDistance:Math.max(1,distance(p[0],p[1])),startZoom:currentZoomPercent(),startPanX:panX,startPanY:panY,startMid:m};
 }
}
function onPointerMove(e){
 if(!active()||!navigationOn)return;
 if(e.pointerType==='mouse'&&mouseDrag&&mouseDrag.id===e.pointerId){
  if(e.buttons===0){mouseDrag=null;paintHandButton();return}
  e.preventDefault();e.stopImmediatePropagation();cancelDrawing();
  const dx=e.clientX-mouseDrag.x,dy=e.clientY-mouseDrag.y;mouseDrag.x=e.clientX;mouseDrag.y=e.clientY;panBy(dx,dy);return;
 }
 if(e.pointerType!=='touch'||!touches.has(e.pointerId))return;
 e.preventDefault();e.stopImmediatePropagation();cancelDrawing();touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(touches.size>=2){
  if(!pinch){const p=touchPair(),m=midpoint(p[0],p[1]);pinch={startDistance:Math.max(1,distance(p[0],p[1])),startZoom:currentZoomPercent(),startPanX:panX,startPanY:panY,startMid:m}}
  const p=touchPair(),m=midpoint(p[0],p[1]),d=Math.max(1,distance(p[0],p[1]));
  const minScale=55/Math.max(1,pinch.startZoom),maxScale=220/Math.max(1,pinch.startZoom);
  liveScale=Math.max(minScale,Math.min(maxScale,d/pinch.startDistance));
  panX=pinch.startPanX+(m.x-pinch.startMid.x);panY=pinch.startPanY+(m.y-pinch.startMid.y);applyTransform();return;
 }
 const p=[...touches.values()][0];
 if(!p._lastX){p._lastX=p.x;p._lastY=p.y;return}
 const dx=p.x-p._lastX,dy=p.y-p._lastY;p._lastX=p.x;p._lastY=p.y;panBy(dx,dy);
}
function onPointerEnd(e){
 if(e.pointerType==='mouse'&&mouseDrag&&mouseDrag.id===e.pointerId){mouseDrag=null;paintHandButton();return}
 if(e.pointerType!=='touch'||!touches.has(e.pointerId))return;
 e.preventDefault();e.stopImmediatePropagation();touches.delete(e.pointerId);cancelDrawing();
 if(pinch&&touches.size<2){
  const target=pinch.startZoom*liveScale;liveScale=1;applyTransform();commitZoom(target);pinch=null;setTimeout(applyTransform,80);
 }
 if(touches.size===1){const p=[...touches.values()][0];p._lastX=p.x;p._lastY=p.y}
}
function normaliseWheel(e){let y=e.deltaY;if(e.deltaMode===1)y*=18;else if(e.deltaMode===2)y*=window.innerHeight;return y}
function onWheel(e){
 if(!active()||!navigationOn||!insideBoard(e))return;
 e.preventDefault();e.stopImmediatePropagation();cancelDrawing();
 const dy=normaliseWheel(e),dx=e.deltaX||0;
 if(e.ctrlKey||e.metaKey){
  if(!wheelPinch)wheelPinch={baseZoom:currentZoomPercent(),scale:1};
  wheelPinch.scale=Math.max(0.5,Math.min(2.2,wheelPinch.scale*Math.exp(-dy*0.0025)));liveScale=wheelPinch.scale;applyTransform();
  clearTimeout(wheelCommitTimer);wheelCommitTimer=setTimeout(()=>{const target=wheelPinch.baseZoom*wheelPinch.scale;liveScale=1;applyTransform();commitZoom(target);wheelPinch=null;setTimeout(applyTransform,80)},120);return;
 }
 const moved=panBy(-dx,-dy);
 const blocked=Math.abs(dy)>2&&Math.abs(moved.y)<Math.min(2,Math.abs(dy)*0.15);
 if(blocked){wheelEdge+=dy;if(Math.abs(wheelEdge)>90){goPage(wheelEdge>0?1:-1);wheelEdge=0}}else wheelEdge=0;
}
function wirePageBox(){
 if(!pageBox||pageBox.dataset.fastPageJump==='1')return;pageBox.dataset.fastPageJump='1';
 pageBox.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();pageBox.dispatchEvent(new Event('change',{bubbles:true}));requestAnimationFrame(()=>{pageBox.focus();pageBox.select()})}});
 pageBox.addEventListener('focus',()=>requestAnimationFrame(()=>pageBox.select()));pageBox.addEventListener('click',()=>pageBox.select());
}
function installRightDock(){
 if(document.getElementById('documentRightDockStyles'))return;
 const style=document.createElement('style');style.id='documentRightDockStyles';
 style.textContent=`
#documentQuickBar{position:fixed!important;right:6px!important;top:50%!important;left:auto!important;bottom:auto!important;transform:translateY(-50%)!important;width:44px!important;max-height:calc(100vh - 18px)!important;overflow-y:auto!important;overflow-x:hidden!important;flex-direction:column!important;align-items:center!important;justify-content:flex-start!important;gap:4px!important;padding:5px 4px!important;border-radius:12px!important;background:rgba(255,255,255,.96)!important;box-shadow:0 5px 18px rgba(18,32,46,.18)!important;scrollbar-width:none!important}
#documentQuickBar::-webkit-scrollbar{display:none!important}
#documentQuickBar button{width:34px!important;min-width:34px!important;height:30px!important;min-height:30px!important;padding:0!important;flex:0 0 auto!important}
#documentQuickBar input[type="number"]{width:36px!important;height:30px!important;min-height:30px!important;padding:1px 2px!important;flex:0 0 auto!important}
#documentQuickBar span{width:36px!important;min-width:36px!important;line-height:1.05!important;white-space:normal!important;text-align:center!important;flex:0 0 auto!important}
body.document-open-mode .tools{padding-right:0!important}
#documentSearchPanel{position:fixed!important;right:56px!important;top:50%!important;left:auto!important;bottom:auto!important;transform:translateY(-50%)!important;width:176px!important;flex-direction:column!important;align-items:stretch!important;gap:4px!important;padding:6px!important;border-radius:10px!important;background:rgba(255,255,255,.98)!important;box-shadow:0 5px 18px rgba(18,32,46,.18)!important}
#documentSearchPanel input{width:100%!important;min-width:0!important;height:30px!important}
#documentSearchPanel #documentSearchStatus{width:100%!important;max-width:none!important;min-width:0!important;text-align:center!important}
#documentSearchPanel button{width:100%!important;min-width:0!important;height:29px!important}
@media(max-height:620px){#documentQuickBar{top:6px!important;transform:none!important;max-height:calc(100vh - 12px)!important}#documentQuickBar button{height:27px!important;min-height:27px!important}#documentQuickBar input[type="number"]{height:27px!important;min-height:27px!important}#documentSearchPanel{top:6px!important;transform:none!important;max-height:calc(100vh - 12px)!important;overflow:auto!important}}
`;
 document.head.appendChild(style);
}
function wire(){
 if(!findControls())return false;wirePageBox();installRightDock();
 if(document.documentElement.dataset.documentGesturesV4==='1')return true;
 document.documentElement.dataset.documentGesturesV4='1';
 window.addEventListener('wheel',onWheel,{passive:false,capture:true});
 window.addEventListener('pointerdown',onPointerDown,true);window.addEventListener('pointermove',onPointerMove,true);window.addEventListener('pointerup',onPointerEnd,true);window.addEventListener('pointercancel',onPointerEnd,true);
 return true;
}
function watch(){
 if(active()&&pageBox){const p=pageBox.value;if(lastPageSeen&&p!==lastPageSeen)resetPan();lastPageSeen=p}else if(!active()){lastPageSeen='';panX=panY=0;liveScale=1}
 requestAnimationFrame(watch);
}
wire();const obs=new MutationObserver(()=>wire());obs.observe(document.documentElement,{childList:true,subtree:true});watch();
document.addEventListener('keydown',e=>{if(!active()||/INPUT|TEXTAREA/.test(document.activeElement?.tagName))return;if(e.key.toLowerCase()==='g'&&pageBox){e.preventDefault();pageBox.focus();pageBox.select()}},true);
})();
