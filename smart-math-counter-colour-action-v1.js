(function(){
'use strict';
// One contextual colour action for a tapped finished counter.
// Does not modify Smart Math model creation, geometry or transform handling.
if(typeof canvas==='undefined'||typeof strokes==='undefined')return;
if(document.getElementById('ccCounterColourAction'))return;
const controller=()=>window.ClassroomCountersWorkflow;
const button=document.createElement('button');
button.id='ccCounterColourAction';button.type='button';
button.textContent='🎨 Colour';
button.setAttribute('aria-label','Change selected counter colour');
button.title='Choose a colour for this counter';
button.style.cssText='display:none;position:fixed;z-index:10045;box-sizing:border-box;'+
 'min-width:99px;min-height:40px;padding:8px 12px;border:2px solid #0f766e;'+
 'border-radius:11px;background:#fff;color:#0f766e;box-shadow:0 3px 15px #17324d44;'+
 'font:800 13px system-ui;cursor:pointer;touch-action:manipulation;';
document.body.appendChild(button);
let selectedId='',press=null;
const clamp=(x,low,high)=>Math.min(Math.max(low,x),Math.max(low,high));
const selectMode=()=>typeof tool==='string'&&tool==='select'&&!controller()?.isActive();
function counterFromId(id){return strokes.find(s=>s?.smartType==='counter'&&s.type==='image'&&s.smartId===id)||null}
function hitCounter(e){
 const r=canvas.getBoundingClientRect();
 const x=(e.clientX-r.left)/Math.max(1,r.width),y=(e.clientY-r.top)/Math.max(1,r.height);
 if(x<0||x>1||y<0||y>1)return null;
 // A different object above the counter should not make a hidden counter selectable.
 for(let i=strokes.length-1;i>=0;i--){
  const s=strokes[i];
  if(s?.type!=='image'||![s.x,s.y,s.w,s.h].every(Number.isFinite))continue;
  if(x>=s.x&&x<=s.x+s.w&&y>=s.y&&y<=s.y+s.h)
   return s.smartType==='counter'?s:null;
 }
 return null;
}
function hide(){selectedId='';button.style.display='none'}
function position(){
 const o=counterFromId(selectedId);
 if(!o||!selectMode()){hide();return}
 const r=canvas.getBoundingClientRect();
 const vw=Math.max(160,window.innerWidth||r.right);
 const vh=Math.max(160,window.innerHeight||r.bottom);
 let x=r.left+(o.x+o.w)*r.width+12;
 let y=r.top+o.y*r.height-10;
 if(x+105>vw-6)x=r.left+o.x*r.width-105;
 x=clamp(x,7,vw-109);y=clamp(y,7,vh-51);
 button.style.left=x+'px';button.style.top=y+'px';button.style.display='inline-flex';
 button.style.alignItems='center';button.style.justifyContent='center';
}
function show(o){if(!o?.smartId)return;selectedId=o.smartId;position()}
button.addEventListener('pointerdown',e=>e.stopPropagation(),true);
button.addEventListener('click',e=>{
 e.preventDefault();e.stopPropagation();
 const id=selectedId;hide();
 controller()?.openColours?.(id);
});
canvas.addEventListener('pointerdown',e=>{
 if(!selectMode()||e.button!=null&&e.button!==0){press=null;hide();return}
 const candidate=hitCounter(e);
 press={id:e.pointerId,x:e.clientX,y:e.clientY,candidate,moved:false};
 hide();
},true);
window.addEventListener('pointermove',e=>{
 if(!press||e.pointerId!==press.id)return;
 if(Math.hypot(e.clientX-press.x,e.clientY-press.y)>8)press.moved=true;
},true);
window.addEventListener('pointerup',e=>{
 if(!press||e.pointerId!==press.id)return;
 const p=press;press=null;
 if(!selectMode()||p.moved||Math.hypot(e.clientX-p.x,e.clientY-p.y)>8)return;
 const target=p.candidate;
 if(!target||!counterFromId(target.smartId))return;
 // If it stayed a tap, Select itself can continue handling object selection.
 show(target);
},true);
window.addEventListener('pointercancel',()=>{press=null;hide()},true);
window.addEventListener('pointerdown',e=>{
 if(e.target===canvas||e.target===button||button.contains(e.target))return;
 if(e.target.closest?.('#ccCounterColourPalette'))return;
 hide();
},true);
document.addEventListener('keydown',e=>{
 if(e.key!=='Escape')return;
 hide();
 const panel=document.getElementById('ccCounterColourPalette');
 if(panel&&!controller()?.isActive())panel.remove();
},true);
window.addEventListener('resize',()=>{if(selectedId)position()});
document.addEventListener('whiteboard-annotation-context',()=>{press=null;hide()},true);
window.ClassroomCounterColourAction={
 openFor(id){const obj=counterFromId(id);if(!obj)return false;show(obj);return true},
 hide,
 selected:()=>selectedId||null
};
})();