(function(){
'use strict';
let board=null,pdf=null,pageBox=null;
let mouse=null,edgePull=0,lastSwitch=0;
const touches=new Map();
let lastMid=null,lastDistance=0;

function active(){return document.body.classList.contains('document-open-mode')}
function refresh(){board=document.getElementById('boardWrap');pdf=document.getElementById('documentPdfCanvas');pageBox=document.querySelector('#documentQuickBar input[type="number"]');return !!(board&&pageBox)}
function navOn(){const b=document.getElementById('documentTouchNavBtn');return !b||b.getAttribute('aria-pressed')!=='false'}
function inside(e){if(!board)refresh();if(!board)return false;const r=board.getBoundingClientRect();return e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom}
function pageNow(){return Math.max(1,Number(pageBox?.value)||1)}
function pageMax(){return Math.max(1,Number(pageBox?.max)||1)}
function toast(msg){const t=document.getElementById('toast');if(!t)return;t.textContent=msg;t.classList.add('show');clearTimeout(t._edgeNavTimer);t._edgeNavTimer=setTimeout(()=>t.classList.remove('show'),1300)}
function go(delta){
 if(!pageBox)return false;const now=pageNow(),next=Math.max(1,Math.min(pageMax(),now+delta));
 if(next===now){toast(delta>0?'Last page':'First page');return false}
 pageBox.value=String(next);pageBox.dispatchEvent(new Event('change',{bubbles:true}));edgePull=0;lastSwitch=performance.now();return true;
}
function atVerticalEdge(dy){
 if(!pdf||getComputedStyle(pdf).display==='none'||!board)return false;const pr=pdf.getBoundingClientRect(),br=board.getBoundingClientRect();
 return dy<0?pr.bottom<=br.bottom+8:dy>0?pr.top>=br.top-8:false;
}
function pull(dy){
 if(!dy||performance.now()-lastSwitch<420)return;
 if(atVerticalEdge(dy))edgePull+=dy;else edgePull=0;
 if(edgePull<=-72)go(1);else if(edgePull>=72)go(-1);
}
function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function midpoint(a,b){return{x:(a.x+b.x)/2,y:(a.y+b.y)/2}}
window.addEventListener('pointerdown',e=>{
 if(!active()||!navOn()||!inside(e))return;if(!pageBox)refresh();
 if(e.pointerType==='mouse'&&e.button===0){mouse={id:e.pointerId,y:e.clientY};edgePull=0}
 if(e.pointerType==='touch'){touches.set(e.pointerId,{x:e.clientX,y:e.clientY});if(touches.size===2){const p=[...touches.values()].slice(0,2);lastMid=midpoint(p[0],p[1]);lastDistance=distance(p[0],p[1]);edgePull=0}}
},true);
window.addEventListener('pointermove',e=>{
 if(!active()||!navOn())return;
 if(e.pointerType==='mouse'&&mouse?.id===e.pointerId&&e.buttons){const dy=e.clientY-mouse.y;mouse.y=e.clientY;pull(dy);return}
 if(e.pointerType!=='touch'||!touches.has(e.pointerId))return;touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(touches.size<2)return;const p=[...touches.values()].slice(0,2),m=midpoint(p[0],p[1]),d=distance(p[0],p[1]);
 if(!lastMid){lastMid=m;lastDistance=d;return}
 const dy=m.y-lastMid.y,ratio=lastDistance?d/lastDistance:1;lastMid=m;lastDistance=d;
 if(Math.abs(ratio-1)>.035){edgePull=0;return}
 pull(dy);
},true);
function end(e){
 if(e.pointerType==='mouse'&&mouse?.id===e.pointerId)mouse=null;
 if(e.pointerType==='touch'){touches.delete(e.pointerId);if(touches.size<2){lastMid=null;lastDistance=0;edgePull=0}}
}
window.addEventListener('pointerup',end,true);window.addEventListener('pointercancel',end,true);
new MutationObserver(()=>refresh()).observe(document.documentElement,{childList:true,subtree:true});refresh();
})();
