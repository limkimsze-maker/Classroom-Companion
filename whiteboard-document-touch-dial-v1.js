(function(){
'use strict';
const PX_PER_PAGE=12;
const STYLE_ID='documentTouchDialFollowStylesV1';
let activeId=null,lastY=0,remainder=0,grabOffsetY=0;

function pageBox(){return document.querySelector('#documentQuickBar input[type="number"]')}
function maxPage(box){return Math.max(1,+box?.max||1)}
function currentPage(box){return Math.max(1,Math.min(maxPage(box),+box?.value||1))}
function dial(){return document.querySelector('#documentPageDial')}
function stage(){return document.querySelector('#documentPageDial .dial-stage')}
function thumb(){return document.querySelector('#documentPageDial .dial-thumb')}
function bubble(){return document.querySelector('#documentPageDial .dial-bubble')}
function progress(){return document.querySelector('#documentPageDial .dial-progress')}

function addStyles(){
 if(document.getElementById(STYLE_ID))return;
 const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
#documentPageDial.touch-following .dial-thumb{top:var(--touch-dial-y)!important;transition:none!important}
#documentPageDial.touch-following .dial-bubble{top:var(--touch-dial-y)!important;transition:none!important}
#documentPageDial.touch-following .dial-progress{height:var(--touch-dial-progress)!important;transition:none!important}
`;
 document.head.appendChild(s);
}
function go(delta){
 const box=pageBox();if(!box||!delta)return;
 const now=currentPage(box),next=Math.max(1,Math.min(maxPage(box),now+delta));
 if(next===now)return;
 box.value=String(next);
 box.dispatchEvent(new Event('change',{bubbles:true}));
}
function isTouchDialDown(e){
 return e.pointerType==='touch'&&e.target?.closest?.('#documentPageDial .dial-thumb');
}
function setFingerY(clientY){
 const d=dial(),s=stage();if(!d||!s)return;
 const r=s.getBoundingClientRect();
 const y=Math.max(10,Math.min(Math.max(10,r.height-10),clientY-r.top-grabOffsetY));
 d.style.setProperty('--touch-dial-y',`${y}px`);
 d.style.setProperty('--touch-dial-progress',`${Math.max(0,y-10)}px`);
}
function settleToPage(){
 const box=pageBox(),s=stage(),t=thumb(),b=bubble(),p=progress();if(!box||!s||!t)return;
 const m=maxPage(box),page=currentPage(box),y=10+(m<=1?0:(page-1)/(m-1))*Math.max(1,s.clientHeight-20);
 t.style.top=`${y}px`;if(b)b.style.top=`${y}px`;if(p)p.style.height=`${Math.max(0,y-10)}px`;
}

addStyles();
window.addEventListener('pointerdown',e=>{
 if(!isTouchDialDown(e))return;
 const t=thumb();if(!t)return;
 e.preventDefault();e.stopImmediatePropagation();
 const tr=t.getBoundingClientRect();
 activeId=e.pointerId;lastY=e.clientY;remainder=0;grabOffsetY=e.clientY-(tr.top+tr.height/2);
 const d=dial();d?.classList.add('dragging','touch-following');
 setFingerY(e.clientY);
},{capture:true,passive:false});
window.addEventListener('pointermove',e=>{
 if(activeId===null||e.pointerId!==activeId)return;
 e.preventDefault();e.stopImmediatePropagation();
 setFingerY(e.clientY);
 remainder+=e.clientY-lastY;lastY=e.clientY;
 let steps=0;
 while(remainder>=PX_PER_PAGE){steps++;remainder-=PX_PER_PAGE}
 while(remainder<=-PX_PER_PAGE){steps--;remainder+=PX_PER_PAGE}
 if(steps)go(steps);
},{capture:true,passive:false});
function end(e){
 if(activeId===null||e.pointerId!==activeId)return;
 e.preventDefault();e.stopImmediatePropagation();
 activeId=null;remainder=0;grabOffsetY=0;
 const d=dial();
 d?.classList.remove('dragging','touch-following');
 d?.style.removeProperty('--touch-dial-y');
 d?.style.removeProperty('--touch-dial-progress');
 settleToPage();
}
window.addEventListener('pointerup',end,{capture:true,passive:false});
window.addEventListener('pointercancel',end,{capture:true,passive:false});
})();
