(function(){
'use strict';
let accX=0,accY=0,lastT=0,cooldown=0,resetTimer=0;
const WINDOW_MS=220,THRESHOLD=42,COOLDOWN_MS=360;
function active(){return document.body.classList.contains('document-open-mode')}
function controls(){
 const board=document.getElementById('boardWrap');
 const bar=document.getElementById('documentQuickBar');
 const hand=document.getElementById('documentTouchNavBtn');
 const pageBox=bar?.querySelector('input[type=number]');
 return {board,hand,pageBox};
}
function inside(board,e){
 const r=board?.getBoundingClientRect();
 if(!r)return false;
 const x=Number.isFinite(e.clientX)?e.clientX:r.left+r.width/2;
 const y=Number.isFinite(e.clientY)?e.clientY:r.top+r.height/2;
 return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;
}
function pageMax(box){return Math.max(1,+box.max||1)}
function pageNow(box){return Math.max(1,+box.value||1)}
function go(box,dir){
 const now=pageNow(box),to=Math.max(1,Math.min(pageMax(box),now+dir));
 if(to===now)return false;
 box.value=String(to);
 box.dispatchEvent(new Event('change',{bubbles:true}));
 const toast=document.getElementById('toast');
 if(toast){toast.textContent=`Page ${to}`;toast.classList.add('show');clearTimeout(go.t);go.t=setTimeout(()=>toast.classList.remove('show'),700)}
 return true;
}
function onWheel(e){
 if(!active()||e.ctrlKey||e.metaKey)return;
 const {board,hand,pageBox}=controls();
 if(!board||!pageBox||!inside(board,e))return;
 const handOn=!hand||hand.classList.contains('active')||hand.getAttribute('aria-pressed')==='true';
 if(!handOn)return;
 let dy=e.deltaY||0,dx=e.deltaX||0;
 if(e.deltaMode===1){dy*=18;dx*=18}else if(e.deltaMode===2){dy*=innerHeight;dx*=innerWidth}
 if(Math.abs(dy)<=Math.abs(dx)*1.08)return;
 e.preventDefault();
 e.stopImmediatePropagation();
 const t=performance.now();
 if(t<cooldown)return;
 if(t-lastT>WINDOW_MS){accX=0;accY=0}
 lastT=t;accX+=dx;accY+=dy;
 clearTimeout(resetTimer);
 resetTimer=setTimeout(()=>{accX=0;accY=0},WINDOW_MS);
 if(Math.abs(accY)>=THRESHOLD){
  const dir=accY>0?1:-1;
  accX=0;accY=0;
  if(go(pageBox,dir))cooldown=t+COOLDOWN_MS;
 }
}
window.addEventListener('wheel',onWheel,{passive:false,capture:true});
})();
