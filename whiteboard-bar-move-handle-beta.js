(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function'||typeof syncUi!=='function')return;
const board=document.getElementById('boardWrap');
if(!board||document.getElementById('barModelMoveLayer'))return;

const WIDTH=120,HEIGHT=44,GAP=8;
const records=new Map(),byButton=new WeakMap(),undoMoves=[];
let drag=null,framePending=false;
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const copy=value=>JSON.parse(JSON.stringify(value));
const signature=()=>JSON.stringify(strokes);
const isModel=o=>o?.type==='image'&&o.smartType==='barModel'&&[o.x,o.y,o.w,o.h].every(Number.isFinite)&&o.w>0&&o.h>0;
const names={partwhole:'Part–Whole',comparison:'Comparison',multiplicative:'Multiplicative Comparison',equalauto:'Equal Grouping',equalsharing:'Equal Sharing',equal:'Equal Groups'};
const style=document.createElement('style');
style.id='barModelMoveHandleStyles';
style.textContent=`
#barModelMoveLayer{position:absolute;inset:0;z-index:1500;pointer-events:none;overflow:hidden}
#barModelMoveLayer .bar-model-move-handle{position:absolute;display:flex;align-items:center;justify-content:center;gap:6px;width:120px;height:44px;min-height:44px;padding:0 9px;border:2px solid #0f766e;border-radius:12px;background:#f0fdfa;color:#075e56;box-shadow:0 3px 10px rgba(15,118,110,.17);font:800 12px/1 system-ui,sans-serif;cursor:grab;touch-action:none;user-select:none;pointer-events:auto;-webkit-user-select:none}
#barModelMoveLayer .bar-model-move-handle svg{width:21px;height:21px;flex:none;pointer-events:none}
#barModelMoveLayer .bar-model-move-handle:hover,#barModelMoveLayer .bar-model-move-handle:focus-visible{background:#ccfbf1;outline:3px solid rgba(15,118,110,.22);outline-offset:2px}
#barModelMoveLayer .bar-model-move-handle.is-moving{cursor:grabbing;background:#0f766e;color:#fff}
#barModelMoveLayer .bar-model-move-handle:disabled{border-color:#94a3b8;background:#f1f5f9;color:#64748b;cursor:not-allowed;box-shadow:none}
#barModelMoveLayer .bar-model-move-outline{position:absolute;display:none;border:2px dashed #0f766e;border-radius:6px;pointer-events:none;background:transparent}
`;
document.head.appendChild(style);
const layer=document.createElement('div');layer.id='barModelMoveLayer';board.appendChild(layer);
const icon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2v20M2 12h20M8 6l4-4 4 4M8 18l4 4 4-4M6 8l-4 4 4 4M18 8l4 4-4 4"/></svg>';

function selectable(){return typeof tool!=='undefined'&&tool==='select'}
function geometry(){
 const r=canvas.getBoundingClientRect(),b=board.getBoundingClientRect();
 return {width:Math.max(1,r.width),height:Math.max(1,r.height),left:r.left-b.left-(board.clientLeft||0),top:r.top-b.top-(board.clientTop||0)};
}
function limits(o,start){
 return {minX:Math.min(0,1-o.w,start.x),maxX:Math.max(0,1-o.w,start.x),minY:Math.min(0,1-o.h,start.y),maxY:Math.max(0,1-o.h,start.y)};
}
function moveTo(o,start,dx,dy){
 const l=limits(o,start);o.x=clamp(start.x+dx,l.minX,l.maxX);o.y=clamp(start.y+dy,l.minY,l.maxY);
}
function showOutline(record,on){record.outline.style.display=on?'block':'none'}
function makeRecord(o){
 const outline=document.createElement('div');outline.className='bar-model-move-outline';outline.setAttribute('aria-hidden','true');
 const button=document.createElement('button');button.type='button';button.className='bar-model-move-handle';
 button.innerHTML=icon+'<span>Move model</span>';
 const record={o,button,outline};records.set(o,record);byButton.set(button,record);layer.append(outline,button);
 button.addEventListener('mouseenter',()=>showOutline(record,true));
 button.addEventListener('mouseleave',()=>{if(drag?.record!==record&&document.activeElement!==button)showOutline(record,false)});
 button.addEventListener('focus',()=>showOutline(record,true));
 button.addEventListener('blur',()=>{if(drag?.record!==record)showOutline(record,false)});
 button.addEventListener('lostpointercapture',e=>{if(drag?.record===record&&e.pointerId===drag.id)endDrag(true)});
 button.addEventListener('keydown',e=>{
  if(o.locked||drag)return;
  const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];
  if(!delta)return;e.preventDefault();e.stopPropagation();
  const before=copy(strokes),start={x:o.x,y:o.y},g=geometry(),step=e.shiftKey?10:1;
  moveTo(o,start,delta[0]*step/g.width,delta[1]*step/g.height);redraw();commitMove(o,start,before);
 });
 button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation()});
 return record;
}
function refresh(){
 framePending=false;
 const visible=selectable(),list=strokes.filter(isModel),g=geometry();
 if(drag&&(!visible||!strokes.includes(drag.record.o))){endDrag(true);return}
 for(const [o,r] of records)if(!list.includes(o)){r.button.remove();r.outline.remove();records.delete(o)}
 layer.hidden=!visible||!list.length;
 if(layer.hidden)return;
 const occupied=[];
 for(const o of list){
  const r=records.get(o)||makeRecord(o),x=g.left+o.x*g.width,y=g.top+o.y*g.height,w=o.w*g.width,h=o.h*g.height;
  let left=clamp(x,6,Math.max(6,board.clientWidth-WIDTH-6)),top=y-HEIGHT-GAP;
  if(top<6)top=y+h+GAP;
  top=clamp(top,6,Math.max(6,board.clientHeight-HEIGHT-6));
  // Stagger handles on overlapping models without changing either drawing.
  for(const used of occupied)if(Math.abs(top-used.top)<HEIGHT+4&&Math.abs(left-used.left)<WIDTH+4)left=clamp(used.left+WIDTH+6,6,Math.max(6,board.clientWidth-WIDTH-6));
  occupied.push({left,top});
  r.button.style.left=left+'px';r.button.style.top=top+'px';r.button.disabled=!!o.locked;
  const label=(o.locked?'Locked: ':'Move ')+(names[o.smartBarType]||'bar')+' model';
  if(r.button.getAttribute('aria-label')!==label){r.button.setAttribute('aria-label',label);r.button.title=o.locked?'Unlock this model to move it':label+' — drag this handle; arrow keys move, Shift + arrow keys move faster'}
  r.button.querySelector('span').textContent=o.locked?'Locked model':'Move model';
  Object.assign(r.outline.style,{left:(x-4)+'px',top:(y-4)+'px',width:(w+8)+'px',height:(h+8)+'px'});
 }
}
function schedule(){if(framePending)return;framePending=true;requestAnimationFrame(refresh)}
function stop(e){e.preventDefault();e.stopImmediatePropagation()}
function canUndoMove(){const last=undoMoves[undoMoves.length-1];return !!last&&last.after===signature()}
function commitMove(o,start,before){
 if(o.x===start.x&&o.y===start.y){syncUi();return}
 undoMoves.push({index:strokes.indexOf(o),x:start.x,y:start.y,after:signature()});if(undoMoves.length>100)undoMoves.shift();
 window.__smartBarLastHistory={before,afterId:o.smartId};syncUi();
}
function updateDrag(e){
 if(!drag||e.pointerId!==drag.id)return;
 const r=canvas.getBoundingClientRect();
 moveTo(drag.record.o,drag.start,(e.clientX-drag.clientX)/Math.max(1,r.width),(e.clientY-drag.clientY)/Math.max(1,r.height));redraw();
}
function endDrag(cancelled,e){
 if(!drag)return;
 const d=drag;
 if(e&&!cancelled)updateDrag(e);
 drag=null;
 if(cancelled&&strokes.includes(d.record.o)){d.record.o.x=d.start.x;d.record.o.y=d.start.y}
 d.record.button.classList.remove('is-moving');
 try{d.record.button.releasePointerCapture(d.id)}catch{}
 redraw();
 if(!cancelled&&strokes.includes(d.record.o))commitMove(d.record.o,d.start,d.before);else syncUi();
 showOutline(d.record,document.activeElement===d.record.button);schedule();
}
// Loaded before document gestures: a grab on this labelled handle belongs to the model.
window.addEventListener('pointerdown',e=>{
 if(drag){stop(e);return}
 const button=e.target?.closest?.('.bar-model-move-handle'),record=button&&byButton.get(button);
 if(!record||!selectable()||record.o.locked||!strokes.includes(record.o))return;
 if(e.button!==undefined&&e.button!==0)return;
 stop(e);button.focus({preventScroll:true});
 drag={id:e.pointerId,record,start:{x:record.o.x,y:record.o.y},clientX:e.clientX,clientY:e.clientY,before:copy(strokes)};
 button.classList.add('is-moving');showOutline(record,true);
 try{button.setPointerCapture(e.pointerId)}catch{}
}, {capture:true,passive:false});
window.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;stop(e);updateDrag(e)}, {capture:true,passive:false});
window.addEventListener('pointerup',e=>{if(!drag||e.pointerId!==drag.id)return;stop(e);endDrag(false,e)}, {capture:true,passive:false});
window.addEventListener('pointercancel',e=>{if(!drag||e.pointerId!==drag.id)return;stop(e);endDrag(true)}, {capture:true,passive:false});
window.addEventListener('keydown',e=>{if(drag&&(e.key==='Escape'||((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'))){stop(e);endDrag(true)}},true);
window.addEventListener('blur',()=>endDrag(true));
document.addEventListener('visibilitychange',()=>{if(document.hidden)endDrag(true)});
const previousRedraw=redraw;redraw=function(){const result=previousRedraw.apply(this,arguments);schedule();return result};
const previousSync=syncUi;syncUi=function(){const result=previousSync.apply(this,arguments);const undo=document.getElementById('undoBtn');if(undo&&canUndoMove())undo.disabled=false;schedule();return result};
const undo=document.getElementById('undoBtn');
if(undo){const previousUndo=undo.onclick;undo.onclick=function(e){
 if(drag){endDrag(true);return}
 if(canUndoMove()){
  const last=undoMoves.pop(),o=strokes[last.index];o.x=last.x;o.y=last.y;redraw();syncUi();return;
 }
 if(typeof previousUndo==='function')return previousUndo.call(this,e);
}}
window.addEventListener('resize',schedule);
if(window.ResizeObserver)new ResizeObserver(schedule).observe(board);
schedule();
})();
