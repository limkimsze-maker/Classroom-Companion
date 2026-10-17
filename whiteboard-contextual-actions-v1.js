(function(){
'use strict';
const style=document.createElement('style');
style.textContent=`#editTextBtn{display:none!important}.wb-context-action[disabled],.wb-context-action[data-context-off="1"]{display:none!important}`;
document.head.appendChild(style);

const words=[
 'Duplicate','Duplikasi','复制','நகல்',
 'Forward','Ke depan','上移一层','முன்னே',
 'Backward','Ke belakang','下移一层','பின்னே',
 'Lock','Unlock','Kunci','Buka kunci','锁定','解锁','பூட்டு','திற'
];
let queued=false;
function contextual(b){
 if(!b||b.tagName!=='BUTTON'||b.id==='editTextBtn')return false;
 const s=((b.textContent||'')+' '+(b.title||'')).trim();
 return words.some(w=>s.includes(w));
}
function sync(){
 queued=false;
 const tools=document.querySelector('.tools');
 if(!tools)return;
 const edit=document.getElementById('editTextBtn');
 if(edit){edit.hidden=true;edit.setAttribute('aria-hidden','true')}
 for(const b of tools.querySelectorAll('button')){
  if(!contextual(b))continue;
  b.classList.add('wb-context-action');
  if(b.disabled){b.dataset.contextOff='1';b.hidden=true}
  else{delete b.dataset.contextOff;b.hidden=false}
 }
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(sync)}
new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['disabled','class']});
document.addEventListener('pointerup',schedule,true);
document.addEventListener('click',schedule,true);
document.addEventListener('keyup',schedule,true);
schedule();
})();

/* PDF rail cleanup: Interact is unnecessary for PDFs; page dial remains zoom-independent. */
(function(){
'use strict';
function syncPdfRail(){
 const bar=document.getElementById('documentQuickBar');
 const pdf=document.getElementById('documentPdfCanvas');
 if(!bar||!pdf)return;
 const isPdf=getComputedStyle(pdf).display!=='none'&&document.body.classList.contains('document-open-mode');
 const interact=[...bar.querySelectorAll('button')].find(b=>/interact with displayed content|return to annotation mode/i.test(b.title||''));
 if(interact){
  interact.style.display=isPdf?'none':'';
  interact.hidden=isPdf;
  interact.setAttribute('aria-hidden',isPdf?'true':'false');
  interact.tabIndex=isPdf?-1:0;
 }
 const dial=document.getElementById('documentPageDial');
 if(dial){
  dial.dataset.zoomIndependent='true';
  dial.title='Drag or use the trackpad to scrub to any page while keeping the current zoom level';
 }
}
const observer=new MutationObserver(()=>requestAnimationFrame(syncPdfRail));
observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']});
document.addEventListener('change',e=>{if(e.target?.matches?.('#documentQuickBar input[type="number"]'))requestAnimationFrame(syncPdfRail)},true);
setInterval(syncPdfRail,500);
syncPdfRail();
})();

/* Reliable wheel/trackpad page scrolling in Hand mode, even when document controls are created after startup. */
(function(){
'use strict';
let accX=0,accY=0,lastT=0,cooldownUntil=0,resetTimer=0;
const WINDOW_MS=220,THRESHOLD=42,COOLDOWN_MS=360;
function active(){return document.body.classList.contains('document-open-mode')}
function inside(board,e){
 const r=board?.getBoundingClientRect();if(!r)return false;
 const x=Number.isFinite(e.clientX)?e.clientX:r.left+r.width/2;
 const y=Number.isFinite(e.clientY)?e.clientY:r.top+r.height/2;
 return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;
}
function go(box,dir){
 const now=Math.max(1,+box.value||1),max=Math.max(1,+box.max||1),to=Math.max(1,Math.min(max,now+dir));
 if(to===now)return false;
 box.value=String(to);
 box.dispatchEvent(new Event('change',{bubbles:true}));
 const toast=document.getElementById('toast');
 if(toast){toast.textContent=`Page ${to}`;toast.classList.add('show');clearTimeout(go.t);go.t=setTimeout(()=>toast.classList.remove('show'),700)}
 return true;
}
function onWheel(e){
 if(e.target?.closest?.('#documentQuickBar'))return;
 if(!active()||e.ctrlKey||e.metaKey)return;
 const board=document.getElementById('boardWrap');
 const bar=document.getElementById('documentQuickBar');
 const hand=document.getElementById('documentTouchNavBtn');
 const box=bar?.querySelector('input[type=number]');
 if(!board||!box||!inside(board,e))return;
 const handOn=!hand||hand.classList.contains('active')||hand.getAttribute('aria-pressed')==='true';
 if(!handOn)return;
 let dy=e.deltaY||0,dx=e.deltaX||0;
 if(e.deltaMode===1){dy*=18;dx*=18}else if(e.deltaMode===2){dy*=innerHeight;dx*=innerWidth}
 if(Math.abs(dy)<=Math.abs(dx)*1.08)return;
 e.preventDefault();
 e.stopImmediatePropagation();
 const t=performance.now();
 if(t<cooldownUntil)return;
 if(t-lastT>WINDOW_MS){accX=0;accY=0}
 lastT=t;accX+=dx;accY+=dy;
 clearTimeout(resetTimer);
 resetTimer=setTimeout(()=>{accX=0;accY=0},WINDOW_MS);
 if(Math.abs(accY)>=THRESHOLD){
  const dir=accY>0?1:-1;accX=0;accY=0;
  if(go(box,dir))cooldownUntil=t+COOLDOWN_MS;
 }
}
window.addEventListener('wheel',onWheel,{passive:false,capture:true});
})();

/* Page dial: lock input type and direction for an entire wheel/trackpad flick.
   Trackpad finger DOWN must always move the dial down and increase page number.
   Trackpad finger UP must always move the dial up and decrease page number.
   A physical mouse wheel keeps wheel-down = higher page number. */
(function(){
'use strict';
let inputMode=null,lastEvent=0,dialY=null,finishTimer=0;
const GESTURE_GAP=240,COMMIT_DELAY=160;
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function current(box,max){return clamp(+box.value||1,1,max)}
function yForPage(stage,p,max){const h=Math.max(1,stage.clientHeight-20);return 10+(max<=1?0:(p-1)/(max-1))*h}
function pageForY(stage,y,max){const h=Math.max(1,stage.clientHeight-20),q=clamp((y-10)/h,0,1);return clamp(Math.round(1+q*(max-1)),1,max)}
function showPreview(stage,p,max,y){
 const dial=stage.closest('#documentPageDial');if(!dial)return;
 const head=dial.querySelector('.dial-head strong'),total=dial.querySelector('.dial-head span'),thumb=dial.querySelector('.dial-thumb'),bubble=dial.querySelector('.dial-bubble'),progress=dial.querySelector('.dial-progress');
 if(head)head.textContent=String(p);if(total)total.textContent=`/ ${max}`;if(thumb)thumb.style.top=`${y}px`;if(bubble){bubble.textContent=`Page ${p}`;bubble.style.top=`${y}px`}if(progress)progress.style.height=`${Math.max(0,y-10)}px`;
 dial.classList.add('dragging');stage.setAttribute('aria-valuenow',String(p));stage.setAttribute('aria-valuetext',`Page ${p} of ${max}`);
}
function classify(e){
 if(e.deltaMode!==0)return 'mouse';
 const raw=Math.abs(e.deltaY||0),wd=Math.abs(e.wheelDeltaY||0),frac=Math.abs((e.deltaY||0)-Math.round(e.deltaY||0))>.001,x=Math.abs(e.deltaX||0);
 const discreteMouse=(wd===120||wd===240||wd===360)&&raw>=70&&x<.01&&!frac;
 return discreteMouse?'mouse':'trackpad';
}
function onDialWheel(e){
 const stage=e.target?.closest?.('#documentPageDial .dial-stage');if(!stage)return;
 const bar=document.getElementById('documentQuickBar'),box=bar?.querySelector('input[type=number]');if(!box)return;
 const max=Math.max(1,+box.max||1),now=performance.now(),newGesture=!inputMode||now-lastEvent>GESTURE_GAP;
 e.preventDefault();e.stopImmediatePropagation();
 if(newGesture){inputMode=classify(e);dialY=yForPage(stage,current(box,max),max)}
 lastEvent=now;
 let dy=e.deltaY||0;if(e.deltaMode===1)dy*=18;else if(e.deltaMode===2)dy*=stage.clientHeight;
 if(inputMode==='trackpad')dy=-dy;
 dy=clamp(dy,-70,70);dialY=clamp((dialY??yForPage(stage,current(box,max),max))+dy,10,Math.max(10,stage.clientHeight-10));
 const p=pageForY(stage,dialY,max);showPreview(stage,p,max,dialY);
 clearTimeout(finishTimer);finishTimer=setTimeout(()=>{
  const dial=stage.closest('#documentPageDial');dial?.classList.remove('dragging');
  const target=pageForY(stage,dialY,max);box.value=String(target);box.dispatchEvent(new Event('change',{bubbles:true}));
  inputMode=null;dialY=null;
 },COMMIT_DELAY);
}
window.addEventListener('wheel',onDialWheel,{passive:false,capture:true});
})();
