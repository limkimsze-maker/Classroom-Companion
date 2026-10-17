(function(){
'use strict';
const PX_PER_PAGE=12;
let activeId=null,lastY=0,remainder=0;

function pageBox(){return document.querySelector('#documentQuickBar input[type="number"]')}
function maxPage(box){return Math.max(1,+box?.max||1)}
function currentPage(box){return Math.max(1,Math.min(maxPage(box),+box?.value||1))}
function go(delta){
 const box=pageBox();if(!box||!delta)return;
 const next=Math.max(1,Math.min(maxPage(box),currentPage(box)+delta));
 if(next===currentPage(box))return;
 box.value=String(next);
 box.dispatchEvent(new Event('change',{bubbles:true}));
}
function isTouchDialDown(e){
 return e.pointerType==='touch'&&e.target?.closest?.('#documentPageDial .dial-thumb');
}
window.addEventListener('pointerdown',e=>{
 if(!isTouchDialDown(e))return;
 e.preventDefault();e.stopImmediatePropagation();
 activeId=e.pointerId;lastY=e.clientY;remainder=0;
 document.querySelector('#documentPageDial')?.classList.add('dragging');
},{capture:true,passive:false});
window.addEventListener('pointermove',e=>{
 if(activeId===null||e.pointerId!==activeId)return;
 e.preventDefault();e.stopImmediatePropagation();
 remainder+=e.clientY-lastY;lastY=e.clientY;
 let steps=0;
 while(remainder>=PX_PER_PAGE){steps++;remainder-=PX_PER_PAGE}
 while(remainder<=-PX_PER_PAGE){steps--;remainder+=PX_PER_PAGE}
 if(steps)go(steps);
},{capture:true,passive:false});
function end(e){
 if(activeId===null||e.pointerId!==activeId)return;
 e.preventDefault();e.stopImmediatePropagation();
 activeId=null;remainder=0;
 document.querySelector('#documentPageDial')?.classList.remove('dragging');
}
window.addEventListener('pointerup',end,{capture:true,passive:false});
window.addEventListener('pointercancel',end,{capture:true,passive:false});
})();
