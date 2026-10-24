/* Beta-only pointer UI. Frozen model scripts remain unchanged. */
(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function'||typeof syncUi!=='function')return;
const board=document.getElementById('boardWrap');
if(!board||document.getElementById('barModelMoveCursorStyles'))return;
const cache=new WeakMap(),undoMoves=[];
let drag=null,lastPointer=null,suppressed=null,queued=false,suppressClickUntil=0;
let selectedModel=null,lastSeenNewest=null;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const copy=v=>JSON.parse(JSON.stringify(v));
const signature=()=>JSON.stringify(strokes);
const selectable=()=>typeof tool!=='undefined'&&tool==='select';
const isModel=o=>o?.type==='image'&&o.smartType==='barModel'&&[o.x,o.y,o.w,o.h].every(Number.isFinite)&&o.w>0&&o.h>0;
const style=document.createElement('style');style.id='barModelMoveCursorStyles';
style.textContent=`
#boardWrap.bar-model-move-ready,#boardWrap.bar-model-move-ready *,#boardWrap.bar-model-moving,#boardWrap.bar-model-moving *{cursor:move!important}
#boardWrap.bar-model-move-released,#boardWrap.bar-model-move-released *{cursor:default!important}
#boardWrap.bar-model-resize-ready,#boardWrap.bar-model-resize-ready *{cursor:default!important}
#barModelPointerTip{position:fixed;width:5px;height:5px;margin:0;border:1px solid white;border-radius:50%;box-sizing:content-box;background:#ef2020;transform:translate(-50%,-50%);pointer-events:none!important;z-index:2147483647;display:none}
#boardWrap #barModelScaleGrip{cursor:nwse-resize!important;touch-action:none!important}
`;
document.head.appendChild(style);
const tip=document.createElement('span');tip.id='barModelPointerTip';tip.setAttribute('aria-hidden','true');document.body.appendChild(tip);
/* Explicit bottom-right resize grip. Only the bar-model presentation changes:
   comparison segments, row endpoints and bracket model data remain untouched. */
const selectionOutline=document.createElement('div');
selectionOutline.id='barModelSelectionOutline';
selectionOutline.setAttribute('aria-hidden','true');
selectionOutline.style.cssText='position:absolute;z-index:1290;pointer-events:none;border:2px dashed #0f766e;border-radius:3px;display:none;box-sizing:border-box;';
board.appendChild(selectionOutline);
const modelGrip=document.createElement('button');
modelGrip.id='barModelScaleGrip';
modelGrip.type='button';
modelGrip.textContent='⤡';
modelGrip.title='Drag to resize the whole bar model';
modelGrip.setAttribute('aria-label','Resize selected bar model proportionally');
modelGrip.style.cssText='position:absolute;z-index:1350;width:38px;height:38px;display:none;border:3px solid white;border-radius:10px;background:#0f766e;color:white;font:900 23px system-ui;box-shadow:0 2px 9px #0005;padding:0;align-items:center;justify-content:center;touch-action:none;user-select:none;';
board.appendChild(modelGrip);
function pointerTip(e){
 if(window.__ccUnifiedTransformsAlpha){tip.style.display='none';return}
 const r=canvas.getBoundingClientRect(),inside=e.clientX>=r.left&&e.clientX<=r.left+r.width&&e.clientY>=r.top&&e.clientY<=r.top+r.height;
 const show=selectable()&&(drag||inside&&usableTarget(e.target))&&(e.pointerType!=='touch'||!!drag||e.type==='pointerdown');
 tip.style.display=show?'block':'none';
 if(show){tip.style.left=e.clientX+'px';tip.style.top=e.clientY+'px'}
}
function cursor(state){
 for(const [name,on] of [['bar-model-move-ready',state==='ready'],['bar-model-moving',state==='moving'],['bar-model-move-released',state==='released']])board.classList.toggle(name,on);
}
function usableTarget(target){
 return target===canvas||!!target?.closest?.('.partwhole-compact-hit-zone,.comparison-segment-hit-zone,.comparison-segment-bracket-hit,.comparison-manual-total-hit,.multiplicative-unit-zone');
}
function cutsFor(o){const n=Math.max(2,o.barCount||2);return Array.isArray(o.barCuts)&&o.barCuts.length===n-1?o.barCuts.slice().sort((a,b)=>a-b):Array.from({length:n-1},(_,i)=>(i+1)/n)}
function compareLayout(o){const n=clamp(Math.round(Number(o.barCount)||2),2,5);return{n,H:Math.max(340,150+n*145)}}
function widthsFor(o){const {n}=compareLayout(o);return Array.isArray(o.barCompareWidths)&&o.barCompareWidths.length>=n?o.barCompareWidths.slice(0,n).map(v=>clamp(Number(v)||.5,.16,1)):Array.from({length:n},(_,i)=>clamp(1-i*.11,.16,1))}
function handles(o,r){
 const out=[],cx=(o.x+o.w*.5)*r.width;
 if(o.smartBarType==='comparison'){
  const {n,H}=compareLayout(o),widths=widthsFor(o);
  for(const [edge,y] of [['top',60/H],['bottom',(60+(n-1)*145+58)/H]])out.push({kind:'height',edge,x:cx,y:(o.y+o.h*y)*r.height,size:9});
  for(let row=0;row<n;row++)out.push({kind:'width',row,x:(o.x+o.w*(180+650*widths[row])/900)*r.width,y:(o.y+o.h*(60+row*145+29)/H)*r.height,size:7});
 }else if(o.smartBarType==='partwhole'){
  for(const [edge,y] of [['top',.3],['bottom',.7]])out.push({kind:'height',edge,x:cx,y:(o.y+o.h*y)*r.height,size:7});
  cutsFor(o).forEach((cut,index)=>out.push({kind:'divider',index,x:(o.x+o.w*(60+780*cut)/900)*r.width,y:(o.y+o.h*.5)*r.height,size:7}));
 }
 return out;
}
function handleAt(e){
 if(!selectable()||!usableTarget(e.target))return null;
 const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
 for(let i=strokes.length-1;i>=0;i--){
  const o=strokes[i];if(!isModel(o))continue;
  // Never reach through a model above this one to a hidden handle.
  const inBounds=x>=o.x*r.width&&x<=(o.x+o.w)*r.width&&y>=o.y*r.height&&y<=(o.y+o.h)*r.height;
  if(!inBounds)continue;
  if(o.locked)return null;
  const hits=handles(o,r).filter(h=>h.kind==='height'?Math.abs(x-h.x)<=h.size+1&&Math.abs(y-h.y)<=h.size+1:Math.hypot(x-h.x,y-h.y)<=h.size+1);
  hits.sort((a,b)=>Math.hypot(x-a.x,y-a.y)-Math.hypot(x-b.x,y-b.y));
  return hits.length?{o,...hits[0]}:null;
 }
 return null;
}
// Match the existing length editors' SVG geometry, colours, labels and limits.
function rebuildLength(o){
 const els=[],stroke='#17324d';let H=300;
 if(o.smartBarType==='comparison'){
  const l=compareLayout(o);H=l.H;const widths=widthsFor(o);o.barCount=l.n;o.barCompareWidths=widths;o.barCompareLayoutVersion=3;
  for(let i=0;i<l.n;i++)els.push(`<rect x="180" y="${60+i*145}" width="${650*widths[i]}" height="58" rx="2" fill="${o.barFills?.[i]||'#ffffff'}" stroke="${stroke}" stroke-width="8"/>`);
 }else{
  const n=Math.max(2,o.barCount||2),cuts=cutsFor(o),bs=[0,...cuts,1],esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  for(let i=0;i<n;i++){
   const left=60+780*bs[i],right=60+780*bs[i+1],w=right-left,label=o.barLabels?.[i]||'';
   els.push(`<rect x="${left}" y="90" width="${w}" height="120" fill="${o.barFills?.[i]||'#ffffff'}"/>`);
   if(label){const fs=label.length>12?24:label.length>7?30:38;els.push(`<text x="${left+w/2}" y="${150+fs*.34}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${fs}" font-weight="700" fill="${stroke}">${esc(label)}</text>`)}
  }
  els.push(`<rect x="60" y="90" width="780" height="120" rx="2" fill="none" stroke="${stroke}" stroke-width="8"/>`);
  for(const cut of cuts){const x=60+780*cut;els.push(`<line x1="${x}" y1="90" x2="${x}" y2="210" stroke="${stroke}" stroke-width="7"/>`)}
  o.barCuts=cuts;
 }
 o.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="${H}" viewBox="0 0 900 ${H}">${els.join('')}</svg>`);
}
function resizeTo(d,e){
 if(d.kind==='scale'){
  const r=canvas.getBoundingClientRect(),dx=e.clientX-d.clientX,dy=e.clientY-d.clientY;
  const w=Math.max(1,d.objectBefore.w*r.width),h=Math.max(1,d.objectBefore.h*r.height);
  const delta=Math.abs(dx/w)>Math.abs(dy/h)?dx/w:dy/h;
  const maxFactor=Math.min(6,(1-d.objectBefore.x)/Math.max(.001,d.objectBefore.w),(1-d.objectBefore.y)/Math.max(.001,d.objectBefore.h));
  const factor=clamp(1+delta,Math.min(.2,maxFactor),Math.max(.2,maxFactor));
  d.o.w=Math.max(.001,d.objectBefore.w*factor);
  d.o.h=Math.max(.001,d.objectBefore.h*factor);
  redraw();return;
 }
 const o=d.o,r=canvas.getBoundingClientRect(),x=(e.clientX-r.left-d.grabX)/Math.max(1,r.width),y=(e.clientY-r.top-d.grabY)/Math.max(1,r.height);
 if(d.kind==='width'){
  const widths=widthsFor(o),v=clamp((x-o.x-o.w*(180/900))/Math.max(.001,o.w*(650/900)),.16,1);
  if(Math.abs(widths[d.row]-v)<.001)return;widths[d.row]=v;o.barCompareWidths=widths;rebuildLength(o);
 }else if(d.kind==='divider'){
  const cuts=cutsFor(o),i=d.index,left=i===0?.05:cuts[i-1]+.05,right=i===cuts.length-1?.95:cuts[i+1]-.05,v=clamp((x-o.x-o.w*(60/900))/Math.max(.001,o.w*(780/900)),left,right);
  if(Math.abs(cuts[i]-v)<.001)return;cuts[i]=v;o.barCuts=cuts;rebuildLength(o);
 }else{
  const comparison=o.smartBarType==='comparison',l=compareLayout(o),topRatio=comparison?60/l.H:.3,bottomRatio=comparison?(60+(l.n-1)*145+58)/l.H:.7;
  const span=comparison?Math.max(.12,bottomRatio-topRatio):.4,min=(comparison?36:30)/Math.max(1,r.height),max=comparison?.75:.55;
  const top=o.y+o.h*topRatio,bottom=o.y+o.h*bottomRatio,visible=clamp(d.edge==='bottom'?y-top:bottom-y,min,max);
  let h=visible/span,ny=d.edge==='bottom'?top-topRatio*h:y-topRatio*h;h=clamp(h,.08,.92);ny=clamp(ny,0,1-h);
  if(Math.abs(o.h-h)<.001&&Math.abs(o.y-ny)<.001)return;o.h=h;o.y=ny;
 }
 redraw();syncUi();
}
function restoreObject(o,before){for(const key of Object.keys(o))if(!(key in before))delete o[key];Object.assign(o,copy(before))}
function shape(o){
 const prior=cache.get(o);if(prior?.src===o.src)return prior;
 const result={src:o.src,rects:[],lines:[]};cache.set(o,result);
 try{
  const src=String(o.src||''),comma=src.indexOf(',');
  if(comma<0||!/^data:image\/svg\+xml[;,]/i.test(src))return result;
  const xml=src.slice(0,comma).includes(';base64')?atob(src.slice(comma+1)):decodeURIComponent(src.slice(comma+1));
  const svg=new DOMParser().parseFromString(xml,'image/svg+xml').documentElement;
  const vb=(svg.getAttribute('viewBox')||'').trim().split(/[ ,]+/).map(Number);
  const ox=vb.length===4?vb[0]:0,oy=vb.length===4?vb[1]:0,W=vb.length===4?vb[2]:parseFloat(svg.getAttribute('width')),H=vb.length===4?vb[3]:parseFloat(svg.getAttribute('height'));
  if(!(W>0&&H>0))return result;
  for(const rect of svg.querySelectorAll('rect')){
   if(!rect.getAttribute('stroke')||rect.getAttribute('stroke')==='none')continue;
   const x=(parseFloat(rect.getAttribute('x')||'0')-ox)/W,y=(parseFloat(rect.getAttribute('y')||'0')-oy)/H,w=parseFloat(rect.getAttribute('width'))/W,h=parseFloat(rect.getAttribute('height'))/H;
   if([x,y,w,h].every(Number.isFinite)&&w>0&&h>0)result.rects.push({x,y,w,h});
  }
  // Equal Grouping uses dashed horizontal edges between its end groups.
  if(o.smartBarType==='equalauto')for(const line of svg.querySelectorAll('line')){
   const x1=(parseFloat(line.getAttribute('x1'))-ox)/W,x2=(parseFloat(line.getAttribute('x2'))-ox)/W,y1=(parseFloat(line.getAttribute('y1'))-oy)/H,y2=(parseFloat(line.getAttribute('y2'))-oy)/H;
   if([x1,x2,y1,y2].every(Number.isFinite)&&Math.abs(y1-y2)<.001)result.lines.push({x1,x2,y:y1});
  }
 }catch{}
 return result;
}
function boxes(o,r){return shape(o).rects.map(q=>({x:(o.x+o.w*q.x)*r.width,y:(o.y+o.h*q.y)*r.height,w:o.w*q.w*r.width,h:o.h*q.h*r.height}))}
function visibleBounds(o,r){
 const rs=boxes(o,r),fallback={x:o.x*r.width,y:o.y*r.height,w:o.w*r.width,h:o.h*r.height};
 if(!rs.length)return fallback;
 const x=Math.min(...rs.map(b=>b.x)),y=Math.min(...rs.map(b=>b.y));
 return{x,y,w:Math.max(20,...rs.map(b=>b.x+b.w-x)),h:Math.max(20,...rs.map(b=>b.y+b.h-y))};
}
function modelInVisibleContent(e){
 if(!selectable()||!usableTarget(e.target))return null;
 const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
 for(let i=strokes.length-1;i>=0;i--){
  const o=strokes[i];if(!isModel(o))continue;
  const pieces=boxes(o,r);
  if(pieces.some(b=>x>=b.x-5&&x<=b.x+b.w+5&&y>=b.y-5&&y<=b.y+b.h+5))return o;
 }
 return null;
}
function refreshModelGrip(){
 if(window.__ccUnifiedTransformsAlpha){selectionOutline.style.display='none';modelGrip.style.display='none';return}
 if(!selectable()||!selectedModel||!strokes.includes(selectedModel)||selectedModel.locked){
  selectionOutline.style.display='none';modelGrip.style.display='none';return;
 }
 const cr=canvas.getBoundingClientRect(),br=board.getBoundingClientRect(),b=visibleBounds(selectedModel,cr);
 const left=cr.left-br.left,top=cr.top-br.top;
 selectionOutline.style.left=(left+b.x-5)+'px';selectionOutline.style.top=(top+b.y-5)+'px';
 selectionOutline.style.width=(b.w+10)+'px';selectionOutline.style.height=(b.h+10)+'px';
 selectionOutline.style.display='block';
 const gx=clamp(left+b.x+b.w+2,19,Math.max(19,br.width-19)),gy=clamp(top+b.y+b.h+2,19,Math.max(19,br.height-19));
 modelGrip.style.left=(gx-19)+'px';modelGrip.style.top=(gy-19)+'px';modelGrip.style.display='flex';
}

function reservedHandle(o,p,rects,r){
 if(!rects.length)return false;
 if(o.smartBarType==='partwhole'||o.smartBarType==='comparison'){
  const cx=(o.x+o.w*.5)*r.width,top=Math.min(...rects.map(q=>q.y)),bottom=Math.max(...rects.map(q=>q.y+q.h));
  if(Math.abs(p.x-cx)<=24&&(Math.abs(p.y-top)<=17||Math.abs(p.y-bottom)<=17))return true;
 }
 if(o.smartBarType==='comparison')for(const q of rects)if(Math.hypot(p.x-(q.x+q.w),p.y-(q.y+q.h/2))<=17)return true;
 if(o.smartBarType==='partwhole'){
  const n=Math.max(2,Number(o.barCount)||2),cuts=Array.isArray(o.barCuts)&&o.barCuts.length===n-1?o.barCuts:Array.from({length:n-1},(_,i)=>(i+1)/n);
  for(const cut of cuts)if(Math.abs(p.x-(o.x+o.w*(60/900+780/900*cut))*r.width)<=14)return true;
 }
 return false;
}
function modelAt(e){
 if(!selectable()||!usableTarget(e.target))return null;
 const r=canvas.getBoundingClientRect(),p={x:e.clientX-r.left,y:e.clientY-r.top},tol=e.pointerType==='touch'?12:6;
 for(let i=strokes.length-1;i>=0;i--){
  const o=strokes[i];if(!isModel(o)||o.locked)continue;
  const rects=boxes(o,r);if(reservedHandle(o,p,rects,r))continue;
  for(const q of rects){
   const inside=p.x>=q.x-tol&&p.x<=q.x+q.w+tol&&p.y>=q.y-tol&&p.y<=q.y+q.h+tol;
   if(inside&&Math.min(Math.abs(p.x-q.x),Math.abs(p.x-q.x-q.w),Math.abs(p.y-q.y),Math.abs(p.y-q.y-q.h))<=tol)return o;
  }
  for(const q of shape(o).lines){const x1=(o.x+o.w*q.x1)*r.width,x2=(o.x+o.w*q.x2)*r.width,y=(o.y+o.h*q.y)*r.height;if(p.x>=Math.min(x1,x2)-tol&&p.x<=Math.max(x1,x2)+tol&&Math.abs(p.y-y)<=tol)return o}
 }
 return null;
}
function hover(e){
 if(window.__ccUnifiedTransformsAlpha){tip.style.display='none';cursor('');board.classList.remove('bar-model-resize-ready');return}
 pointerTip(e);
 const resize=!!drag&&drag.kind!=='move'||!drag&&!!handleAt(e);board.classList.toggle('bar-model-resize-ready',resize);
 if(resize){cursor('');return}
 if(drag){cursor('moving');return}
 const o=modelAt(e);
 if(suppressed&&o===suppressed){cursor('released');return}
 suppressed=null;cursor(o?'ready':'');
}
function schedule(){
 if(queued)return;queued=true;requestAnimationFrame(()=>{
  queued=false;
  if(drag&&(!selectable()||!strokes.includes(drag.o)))endDrag(true);
  else if(lastPointer)hover(lastPointer);
  else{cursor('');board.classList.remove('bar-model-resize-ready');tip.style.display='none'}
  if(selectedModel&&!strokes.includes(selectedModel))selectedModel=null;
  const current=strokes.filter(isModel).at(-1)||null;
  if(current&&current!==lastSeenNewest){lastSeenNewest=current;if(selectable())selectedModel=current}
  refreshModelGrip();
 });
}
function stop(e){e.preventDefault();e.stopImmediatePropagation()}
function moveTo(o,start,dx,dy){
 o.x=clamp(start.x+dx,Math.min(0,1-o.w,start.x),Math.max(0,1-o.w,start.x));
 o.y=clamp(start.y+dy,Math.min(0,1-o.h,start.y),Math.max(0,1-o.h,start.y));
}
function canUndoMove(){return !!undoMoves.length&&undoMoves[undoMoves.length-1].after===signature()}
function updateDrag(e){
 if(!drag||e.pointerId!==drag.id)return;
 pointerTip(e);
 if(drag.kind!=='move'){
  if(!drag.moved&&e.clientX===drag.clientX&&e.clientY===drag.clientY)return;
  drag.moved=true;resizeTo(drag,e);return;
 }
 const r=canvas.getBoundingClientRect();moveTo(drag.o,drag.start,(e.clientX-drag.clientX)/Math.max(1,r.width),(e.clientY-drag.clientY)/Math.max(1,r.height));redraw();cursor('moving');
}
function endDrag(cancelled,e){
 if(!drag)return;const d=drag;
 if(e&&!cancelled)updateDrag(e);
 drag=null;
 if(cancelled&&strokes.includes(d.o))restoreObject(d.o,d.objectBefore);
 try{(d.captureElement||canvas).releasePointerCapture?.(d.id)}catch{}
 redraw();
 if(!cancelled&&strokes.includes(d.o)&&JSON.stringify(d.o)!==JSON.stringify(d.objectBefore)){
  undoMoves.push({index:strokes.indexOf(d.o),before:d.objectBefore,after:signature()});if(undoMoves.length>100)undoMoves.shift();
  window.__smartBarLastHistory={before:d.before,afterId:d.o.smartId};
 }
 suppressed=cancelled||d.kind!=='move'?null:d.o;suppressClickUntil=Date.now()+120;
 lastPointer=e||null;
 cursor(cancelled||d.kind!=='move'?'':'released');board.classList.remove('bar-model-resize-ready');if(e?.pointerType==='touch')tip.style.display='none';syncUi();
}
// Visible controls win over segment/bracket overlays and global gestures.
window.addEventListener('pointerdown',e=>{
 if(drag){stop(e);return}
 if(e.button!==undefined&&e.button!==0)return;
 // The explicit green grip is handled by its own pointer listener below.
 // Do not clear the selected model during the window capture phase.
 if(e.target===modelGrip)return;
 pointerTip(e);
 const handle=handleAt(e),o=handle?.o||modelAt(e);
 const visible=o||modelInVisibleContent(e);
 selectedModel=visible||null;
 schedule();
 // Alpha uses one shared outer move/resize handler. Keep these legacy
 // listeners only for internal comparison-row and divider handles.
 if(window.__ccUnifiedTransformsAlpha&&!handle)return;
 if(!o)return;
 stop(e);lastPointer=e;suppressed=null;
 const r=canvas.getBoundingClientRect();
 drag={...handle,kind:handle?.kind||'move',id:e.pointerId,o,start:{x:o.x,y:o.y},objectBefore:copy(o),clientX:e.clientX,clientY:e.clientY,grabX:handle?e.clientX-r.left-handle.x:0,grabY:handle?e.clientY-r.top-handle.y:0,before:copy(strokes)};
 try{canvas.setPointerCapture(e.pointerId)}catch{}
 hover(e);
},{capture:true,passive:false});
window.addEventListener('pointermove',e=>{
 if(drag&&e.pointerId!==drag.id)return;
 lastPointer=e;
 if(drag){stop(e);updateDrag(e);return}
 hover(e);
},{capture:true,passive:false});
window.addEventListener('pointerup',e=>{if(!drag||e.pointerId!==drag.id)return;stop(e);endDrag(false,e)},{capture:true,passive:false});
window.addEventListener('pointercancel',e=>{if(!drag||e.pointerId!==drag.id)return;stop(e);endDrag(true)},{capture:true,passive:false});
canvas.addEventListener('lostpointercapture',e=>{if(drag&&e.pointerId===drag.id)endDrag(true)});
modelGrip.addEventListener('pointerdown',e=>{
 if(!selectable()||!selectedModel||!strokes.includes(selectedModel)||selectedModel.locked||(e.button!==undefined&&e.button!==0))return;
 if(drag){stop(e);return}
 const o=selectedModel;
 drag={kind:'scale',id:e.pointerId,o,start:{x:o.x,y:o.y},objectBefore:copy(o),clientX:e.clientX,clientY:e.clientY,before:copy(strokes),captureElement:modelGrip};
 try{modelGrip.setPointerCapture?.(e.pointerId)}catch{}
 e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
 modelGrip.style.cursor='nwse-resize';
});
modelGrip.addEventListener('lostpointercapture',e=>{if(drag?.kind==='scale'&&drag.id===e.pointerId)endDrag(true)});
board.addEventListener('pointerleave',()=>{if(!drag){lastPointer=null;suppressed=null;cursor('');board.classList.remove('bar-model-resize-ready');tip.style.display='none'}});
window.addEventListener('click',e=>{if(Date.now()<suppressClickUntil&&usableTarget(e.target))stop(e)},true);
window.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&!drag){selectedModel=null;schedule()}
 if(drag&&(e.key==='Escape'||((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'))){stop(e);endDrag(true)}
},true);
window.addEventListener('blur',()=>{endDrag(true);lastPointer=null;suppressed=null;cursor('');board.classList.remove('bar-model-resize-ready');tip.style.display='none'});
document.addEventListener('visibilitychange',()=>{if(document.hidden){endDrag(true);lastPointer=null;cursor('');board.classList.remove('bar-model-resize-ready');tip.style.display='none'}});
const previousRedraw=redraw;redraw=function(){const r=previousRedraw.apply(this,arguments);schedule();return r};
const previousSync=syncUi;syncUi=function(){const r=previousSync.apply(this,arguments),undo=document.getElementById('undoBtn');if(undo&&canUndoMove())undo.disabled=false;schedule();return r};
const undo=document.getElementById('undoBtn');
if(undo){const previousUndo=undo.onclick;undo.onclick=function(e){
 if(drag){endDrag(true);return}
 if(canUndoMove()){const last=undoMoves.pop(),o=strokes[last.index];restoreObject(o,last.before);suppressed=null;redraw();syncUi();return}
 if(typeof previousUndo==='function')return previousUndo.call(this,e);
}}
window.addEventListener('resize',schedule);
if(window.ResizeObserver)new ResizeObserver(schedule).observe(board);
schedule();
})();
