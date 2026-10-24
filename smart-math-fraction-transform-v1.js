(function(){
'use strict';
// Beta V2 fractional bar handles; entirely isolated from barModel / comparison.
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function'||typeof syncUi!=='function')return;
const wrap=document.getElementById('boardWrap');if(!wrap)return;
const clone=x=>JSON.parse(JSON.stringify(x));
const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
const layer=document.createElement('div');
layer.id='smartFractionTransformLayer';
layer.setAttribute('aria-label','Fraction bar move and resize controls');
layer.style.cssText='position:absolute;inset:0;z-index:1320;pointer-events:none;';
wrap.appendChild(layer);
const frame=document.createElement('div');
frame.style.cssText='position:absolute;pointer-events:none;border:2px dashed #2563eb;border-radius:3px;box-sizing:border-box;';
layer.appendChild(frame);
let gesture=null,raf=0,latest='';const handles=[];
function fractions(){return strokes.filter(o=>o&&o.smartType==='fractionBar'&&Number.isFinite(o.x)&&Number.isFinite(o.y)&&Number.isFinite(o.w)&&Number.isFinite(o.h)&&o.w>0&&o.h>0)}
function active(){
 const list=fractions(),id=window.ClassroomFractionSegmentOptions?.selected?.()||latest;
 return list.find(o=>o.smartId===id)||list[list.length-1]||null;
}
function dims(){const a=canvas.getBoundingClientRect(),b=wrap.getBoundingClientRect();return {W:Math.max(1,a.width),H:Math.max(1,a.height),ox:a.left-b.left,oy:a.top-b.top,wrapW:Math.max(1,b.width),wrapH:Math.max(1,b.height)}}
const modes=[
 {mode:'move',symbol:'✥',label:'Move fraction bar',cursor:'grab'},
 {mode:'width',symbol:'↔',label:'Resize fraction bar width',cursor:'ew-resize'},
 {mode:'height',symbol:'↕',label:'Resize fraction bar height',cursor:'ns-resize'},
 {mode:'both',symbol:'⤡',label:'Resize fraction bar width and height',cursor:'nwse-resize'}
];
function makeHandle(def){
 const b=document.createElement('button');b.type='button';b.className='smartFractionTransformHandle';
 b.dataset.fractionHandle=def.mode;b.setAttribute('aria-label',def.label);b.title=def.label;
 b.textContent=def.symbol;b.style.cssText='position:absolute;pointer-events:auto;touch-action:none;user-select:none;'+
 'display:none;align-items:center;justify-content:center;box-sizing:border-box;width:38px;height:38px;'+
 'padding:0;border:2px solid #0f766e;border-radius:11px;background:#fff;color:#0f766e;'+
 'box-shadow:0 2px 10px rgba(23,50,77,.27);font:900 22px system-ui;cursor:'+def.cursor+';';
 b.addEventListener('pointerdown',e=>start(def.mode,b,e),true);
 b.addEventListener('pointermove',e=>move(b,e),true);
 b.addEventListener('pointerup',e=>finish(b,e,false),true);
 b.addEventListener('pointercancel',e=>finish(b,e,true),true);
 b.addEventListener('lostpointercapture',e=>{if(gesture?.el===b)finish(b,e,false)},true);
 b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()},true);
 layer.appendChild(b);return b;
}
for(const def of modes)handles.push({...def,el:makeHandle(def)});
function show(){
 const o=active(),d=dims(),enabled=typeof tool!=='undefined'&&tool==='select'&&!document.getElementById('smartFractionOptionsPanel');
 if(!o||!enabled){
  frame.style.display='none';for(const h of handles)h.el.style.display='none';return;
 }
 latest=o.smartId;
 const x=d.ox+o.x*d.W,y=d.oy+o.y*d.H,w=o.w*d.W,h=o.h*d.H;
 frame.style.display='block';frame.style.left=(x-3)+'px';frame.style.top=(y-3)+'px';
 frame.style.width=(w+6)+'px';frame.style.height=(h+6)+'px';
 const pos={
  move:{x:x-17,y:y-28},
  width:{x:x+w,y:y+h/2},
  height:{x:x+w/2,y:y+h},
  both:{x:x+w,y:y+h}
 };
 for(const hnd of handles){
  const p=pos[hnd.mode],b=hnd.el;
  // Clamping retains a thumb-sized grip on compact mobile screens.
  const cx=clamp(p.x,19,Math.max(19,d.wrapW-19)),cy=clamp(p.y,19,Math.max(19,d.wrapH-19));
  b.style.left=(cx-19)+'px';b.style.top=(cy-19)+'px';
  b.style.display='flex';
  b.style.cursor=gesture?.el===b&&hnd.mode==='move'?'grabbing':hnd.cursor;
 }
}
function schedule(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;show()})}
function start(mode,el,e){
 if(gesture||typeof tool==='undefined'||tool!=='select'||(e.button!=null&&e.button!==0))return;
 const o=active();if(!o)return;
 e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
 window.ClassroomFractionSegmentOptions?.select?.(o.smartId);
 const d=dims();
 gesture={
  mode,el,id:o.smartId,pointer:e.pointerId,startX:e.clientX,startY:e.clientY,
  W:d.W,H:d.H,original:{x:o.x,y:o.y,w:o.w,h:o.h},before:clone(strokes)
 };
 try{el.setPointerCapture?.(e.pointerId)}catch(err){}
 el.style.cursor=mode==='move'?'grabbing':modes.find(x=>x.mode===mode).cursor;
}
function move(el,e){
 const g=gesture;if(!g||g.el!==el||(g.pointer!=null&&e.pointerId!=null&&g.pointer!==e.pointerId))return;
 const o=fractions().find(s=>s.smartId===g.id);if(!o)return;
 const dx=(e.clientX-g.startX)/g.W,dy=(e.clientY-g.startY)/g.H,p=g.original;
 const minW=Math.min(p.w,Math.max(.035,55/g.W)),minH=Math.min(p.h,Math.max(.025,36/g.H));
 if(g.mode==='move'){o.x=clamp(p.x+dx,0,1-p.w);o.y=clamp(p.y+dy,0,1-p.h)}
 else{
  if(g.mode==='width'||g.mode==='both')o.w=clamp(p.w+dx,minW,1-p.x);
  if(g.mode==='height'||g.mode==='both')o.h=clamp(p.h+dy,minH,1-p.y);
 }
 redraw();schedule();
 e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
}
function finish(el,e,cancel){
 const g=gesture;if(!g||g.el!==el)return;
 if(e&&g.pointer!=null&&e.pointerId!=null&&g.pointer!==e.pointerId)return;
 gesture=null;
 try{if(el.hasPointerCapture?.(g.pointer))el.releasePointerCapture(g.pointer)}catch(err){}
 const o=fractions().find(s=>s.smartId===g.id),p=g.original;
 if(cancel&&o){Object.assign(o,p)}
 const modified=o&&!cancel&&['x','y','w','h'].some(k=>Math.abs(o[k]-p[k])>1e-6);
 if(modified){
  if(window.ClassroomFractionBars?.recordEdit)window.ClassroomFractionBars.recordEdit(g.before,g.id);
  else window.__smartBarLastHistory={before:g.before,afterId:g.id};
 }
 redraw();syncUi();schedule();
 if(e){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()}
}
const oldRedraw=redraw;
redraw=function(){oldRedraw();schedule()};
window.addEventListener('resize',schedule);
if(typeof ResizeObserver!=='undefined')new ResizeObserver(schedule).observe(wrap);
document.addEventListener('whiteboard-annotation-context',()=>{if(gesture)finish(gesture.el,null,true);latest='';schedule()},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&gesture)finish(gesture.el,null,true)},true);
window.addEventListener('blur',()=>{if(gesture)finish(gesture.el,null,false)});
window.ClassroomFractionTransforms={refresh:schedule,selected:()=>active()?.smartId||null};
schedule();
})();