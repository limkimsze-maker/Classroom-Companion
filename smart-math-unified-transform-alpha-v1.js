(function(){
'use strict';
// Alpha shared presentation grips for Counters / Fraction Bars / all Bar Models.
// Only outer x,y,w,h transforms change. Internal segments, labels, equations,
// ratios and specialised divider controls are deliberately left untouched.
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function'||typeof syncUi!=='function')return;
const wrap=document.getElementById('boardWrap'),undo=document.getElementById('undoBtn');
if(!wrap||document.getElementById('ccUnifiedSmartTransformLayer'))return;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const clone=v=>JSON.parse(JSON.stringify(v));
const TYPES=new Set(['counter','fractionBar','barModel']);
const kind=o=>o?.smartType==='counter'?'Counter':o?.smartType==='fractionBar'?'Fraction Bar':'Bar Model';
const valid=o=>o&&o.type==='image'&&TYPES.has(o.smartType)&&[o.x,o.y,o.w,o.h].every(Number.isFinite)&&o.w>0&&o.h>0;
const candidates=()=>strokes.filter(valid);
const byId=id=>candidates().find(o=>o.smartId===id);
let selectedId='',latest=null,gesture=null,lastTransform=null,raf=0;
const layer=document.createElement('div');layer.id='ccUnifiedSmartTransformLayer';
layer.setAttribute('aria-label','Move and resize Smart Math objects');
layer.style.cssText='position:absolute;inset:0;pointer-events:none;z-index:1460';
const frame=document.createElement('div');
frame.id='ccUnifiedSmartSelectionFrame';
frame.style.cssText='position:absolute;pointer-events:none;box-sizing:border-box;border:2px dashed #2563eb;border-radius:4px;display:none';
layer.appendChild(frame);wrap.appendChild(layer);
const defs=[
 {mode:'move',glyph:'✥',cursor:'grab',verb:'Move'},
 {mode:'width',glyph:'↔',cursor:'ew-resize',verb:'Resize width'},
 {mode:'height',glyph:'↕',cursor:'ns-resize',verb:'Resize height'},
 {mode:'both',glyph:'⤡',cursor:'nwse-resize',verb:'Resize'}
];
const grips=[];
function info(){
 const c=canvas.getBoundingClientRect(),w=wrap.getBoundingClientRect();
 return{W:Math.max(1,c.width),H:Math.max(1,c.height),ox:c.left-w.left,oy:c.top-w.top,wrapW:Math.max(1,w.width),wrapH:Math.max(1,w.height)};
}
function active(){
 const list=candidates();if(!list.length)return null;
 return byId(selectedId)||list[list.length-1]||null;
}
function panelOpen(){return !!document.querySelector('#smartFractionOptionsPanel,#smartBarTypeMenu[style*="display: block"],.comparison-segment-options-popup,#smartFractionColourPanel')}
function allowed(){return typeof tool==='string'&&tool==='select'&&!panelOpen()&&!document.body.classList.contains('live-overlay-active')}
function makeGrip(def){
 const el=document.createElement('button');el.type='button';el.className='cc-unified-grip';
 el.dataset.smartTransform=def.mode;el.setAttribute('aria-label',def.verb+' selected Smart Math object');
 el.style.cssText='position:absolute;display:none;width:38px;height:38px;box-sizing:border-box;align-items:center;justify-content:center;'+
  'border:2px solid #0f766e;border-radius:11px;background:#ffffff;color:#0f766e;box-shadow:0 2px 9px #17324d44;'+
  'font:900 21px system-ui;cursor:'+def.cursor+';pointer-events:auto;touch-action:none;user-select:none;padding:0;';
 el.textContent=def.glyph;el.title=def.verb+' selected Smart Math object';
 el.addEventListener('pointerdown',e=>begin(def.mode,el,e),true);
 el.addEventListener('pointermove',e=>move(el,e),true);
 el.addEventListener('pointerup',e=>finish(el,e,false),true);
 el.addEventListener('pointercancel',e=>finish(el,e,true),true);
 el.addEventListener('lostpointercapture',e=>{if(gesture?.el===el)finish(el,null,true)},true);
 el.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()},true);
 layer.appendChild(el);return {...def,el};
}
defs.forEach(d=>grips.push(makeGrip(d)));
function repaint(){
 const d=info(),o=active(),show=allowed()&&!!o&&!o.locked;
 if(!show){frame.style.display='none';grips.forEach(x=>x.el.style.display='none');return}
 const left=d.ox+o.x*d.W,top=d.oy+o.y*d.H,w=o.w*d.W,h=o.h*d.H;
 frame.style.display='block';frame.style.left=(left-4)+'px';frame.style.top=(top-4)+'px';
 frame.style.width=(w+8)+'px';frame.style.height=(h+8)+'px';
 const locations={
  move:[left-23,top-25],
  width:[left+w+24,top+h/2],
  height:[left+w/2,top+h+25],
  both:[left+w+25,top+h+25]
 };
 for(const grip of grips){
  const p=locations[grip.mode],cx=clamp(p[0],19,Math.max(19,d.wrapW-19)),cy=clamp(p[1],19,Math.max(19,d.wrapH-19));
  grip.el.style.left=(cx-19)+'px';grip.el.style.top=(cy-19)+'px';grip.el.style.display='flex';
  grip.el.style.cursor=gesture?.el===grip.el&&grip.mode==='move'?'grabbing':grip.cursor;
  grip.el.setAttribute('aria-label',grip.verb+' '+kind(o));
  grip.el.title=grip.verb+' '+kind(o)+(o.smartType==='counter'?' (keeps circle round)':'');
 }
}
function schedule(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;repaint()})}
function select(id){
 if(!byId(id))return false;
 selectedId=id;
 if(byId(id).smartType==='fractionBar')window.ClassroomFractionSegmentOptions?.select?.(id);
 schedule();return true;
}
function begin(mode,el,e){
 if(gesture||!allowed()||(e.button!=null&&e.button!==0))return;
 const o=active();if(!o||o.locked)return;
 e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
 select(o.smartId);
 const d=info();
 gesture={id:o.smartId,el,mode,pointer:e.pointerId,startX:e.clientX,startY:e.clientY,
  W:d.W,H:d.H,original:{x:o.x,y:o.y,w:o.w,h:o.h},before:clone(strokes)};
 try{el.setPointerCapture?.(e.pointerId)}catch(_){}
 el.style.cursor=mode==='move'?'grabbing':defs.find(x=>x.mode===mode).cursor;
}
function transform(o,g,dx,dy){
 const p=g.original;
 if(g.mode==='move'){
  o.x=clamp(p.x+dx,0,Math.max(0,1-p.w));o.y=clamp(p.y+dy,0,Math.max(0,1-p.h));return;
 }
 if(o.smartType==='counter'){
  // Counters stay circular in rendered CSS pixels regardless of which grip is pulled.
  const sx=dx/Math.max(p.w,.0001),sy=dy/Math.max(p.h,.0001);
  const delta=g.mode==='width'?sx:g.mode==='height'?sy:Math.abs(sx)>Math.abs(sy)?sx:sy;
  const minScale=Math.min(1,Math.max(22/(p.w*g.W),22/(p.h*g.H),.20));
  const maxScale=Math.min(8,(1-p.x)/p.w,(1-p.y)/p.h);
  const scale=clamp(1+delta,Math.min(minScale,maxScale),Math.max(minScale,maxScale));
  o.w=p.w*scale;o.h=p.h*scale;return;
 }
 const minW=Math.min(p.w,Math.max(.04,48/g.W)),minH=Math.min(p.h,Math.max(.035,32/g.H));
 if(g.mode==='width'||g.mode==='both')o.w=clamp(p.w+dx,minW,Math.max(minW,1-p.x));
 if(g.mode==='height'||g.mode==='both')o.h=clamp(p.h+dy,minH,Math.max(minH,1-p.y));
}
function move(el,e){
 const g=gesture;if(!g||g.el!==el||(g.pointer!=null&&e.pointerId!=null&&g.pointer!==e.pointerId))return;
 const o=byId(g.id);if(!o)return;
 transform(o,g,(e.clientX-g.startX)/g.W,(e.clientY-g.startY)/g.H);
 redraw();schedule();e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
}
function finish(el,e,cancel){
 const g=gesture;if(!g||g.el!==el)return;
 if(e&&g.pointer!=null&&e.pointerId!=null&&g.pointer!==e.pointerId)return;
 gesture=null;
 try{if(el.hasPointerCapture?.(g.pointer))el.releasePointerCapture(g.pointer)}catch(_){}
 const o=byId(g.id),p=g.original;
 if(cancel&&o)Object.assign(o,p);
 const changed=!cancel&&o&&['x','y','w','h'].some(k=>Math.abs(o[k]-p[k])>1e-7);
 if(changed){
  lastTransform={before:g.before,after:JSON.stringify(strokes),id:g.id};
 }
 syncUi();redraw();schedule();
 if(e){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()}
}
window.addEventListener('pointerdown',e=>{
 if(!allowed()||gesture||e.button!=null&&e.button!==0)return;
 if(e.target.closest?.('#ccUnifiedSmartTransformLayer'))return;
 const c=canvas.getBoundingClientRect(),x=(e.clientX-c.left)/Math.max(1,c.width),y=(e.clientY-c.top)/Math.max(1,c.height);
 // Ignore taps on controls outside the canvas; do not intercept segment/bracket editors.
 if(x<0||x>1||y<0||y>1)return;
 for(let i=strokes.length-1;i>=0;i--){
  const o=strokes[i];if(!valid(o))continue;
  if(x>=o.x&&x<=o.x+o.w&&y>=o.y&&y<=o.y+o.h){
   select(o.smartId);break;
  }
 }
},true);
window.addEventListener('click',e=>{
 if(e.target!==undo||!lastTransform||JSON.stringify(strokes)!==lastTransform.after)return;
 e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
 strokes=clone(lastTransform.before);lastTransform=null;
 redraw();syncUi();
},true);
const originalRedraw=redraw;
redraw=function(){const r=originalRedraw.apply(this,arguments);
 const newest=candidates().at(-1)||null;
 if(newest&&newest!==latest){latest=newest;selectedId=newest.smartId}
 if(selectedId&&!byId(selectedId))selectedId='';
 schedule();return r;
};
const originalSync=syncUi;
syncUi=function(){const r=originalSync.apply(this,arguments);
 if(lastTransform&&JSON.stringify(strokes)===lastTransform.after&&undo)undo.disabled=false;
 schedule();return r;
};
window.addEventListener('resize',schedule);
if(window.ResizeObserver)new ResizeObserver(schedule).observe(wrap);
document.addEventListener('whiteboard-annotation-context',()=>{if(gesture)finish(gesture.el,null,true);selectedId='';lastTransform=null;schedule()},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&gesture)finish(gesture.el,null,true)},true);
window.addEventListener('blur',()=>{if(gesture)finish(gesture.el,null,true)});
window.ClassroomUnifiedSmartTransforms={
 enabled:true,
 selected:()=>active()?.smartId||null,
 select,
 refresh:schedule,
 supportedTypes:['counter','fractionBar','barModel'],
 getGrips:()=>grips.map(g=>({mode:g.mode,cursor:g.cursor}))
};
schedule();
})();