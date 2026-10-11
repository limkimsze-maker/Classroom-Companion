(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function'||typeof syncUi!=='function')return;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const clone=v=>JSON.parse(JSON.stringify(v));
let selectedId=null,drag=null,suppressClick=false;
function svgData(svg){return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)}
function countFor(obj){return clamp(Math.round(Number(obj.barCount)||2),2,5)}
function widthsFor(obj){
 const n=countFor(obj);
 if(Array.isArray(obj.barCompareWidths)&&obj.barCompareWidths.length>=n)return obj.barCompareWidths.slice(0,n).map(v=>clamp(Number(v)||.5,.16,1));
 return Array.from({length:n},(_,i)=>clamp(1-i*.11,.16,1));
}
function layoutFor(obj){const n=countFor(obj);return{n,H:Math.max(300,120+n*115),x:70,maxW:760,rowGap:105,barH:72,startY:45}}
function normalizeComparison(obj){
 if(!obj||obj.smartType!=='barModel'||obj.smartBarType!=='comparison')return false;
 const n=countFor(obj);let changed=false;
 if(obj.barCount!==n){obj.barCount=n;changed=true}
 if(Array.isArray(obj.barFills)){obj.barFills=obj.barFills.slice(0,n);while(obj.barFills.length<n)obj.barFills.push('#ffffff')}
 const widths=widthsFor(obj);
 if(!Array.isArray(obj.barCompareWidths)||obj.barCompareWidths.length!==n||obj.barCompareWidths.some((v,i)=>Math.abs((Number(v)||0)-widths[i])>.0001)){obj.barCompareWidths=widths;changed=true}
 if(changed)rebuild(obj);return changed;
}
function normalizeAll(){for(const s of strokes)normalizeComparison(s)}
function rebuild(obj){
 const {n,H,x,maxW,rowGap,barH,startY}=layoutFor(obj),stroke='#17324d',fills=Array.from({length:n},(_,i)=>obj.barFills?.[i]||'#ffffff');
 const widths=widthsFor(obj),els=[];
 for(let i=0;i<n;i++){const w=maxW*widths[i];els.push(`<rect x="${x}" y="${startY+i*rowGap}" width="${w}" height="${barH}" rx="2" fill="${fills[i]}" stroke="${stroke}" stroke-width="8"/>`)}
 obj.barCount=n;obj.barCompareWidths=widths;obj.src=svgData(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="${H}" viewBox="0 0 900 ${H}">${els.join('')}</svg>`);
}
function canvasPoint(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)/Math.max(1,r.width),y:(e.clientY-r.top)/Math.max(1,r.height),r}}
function hitComparison(x,y){for(let i=strokes.length-1;i>=0;i--){const s=strokes[i];if(!s||s.smartType!=='barModel'||s.smartBarType!=='comparison'||!s.w||!s.h)continue;if(x>=s.x&&x<=s.x+s.w&&y>=s.y&&y<=s.y+s.h)return s}return null}
function rowGeometry(obj,index){const {H,x,maxW,rowGap,barH,startY}=layoutFor(obj),widths=widthsFor(obj);return{x0:x/900,y0:(startY+index*rowGap)/H,w:(maxW*widths[index])/900,h:barH/H}}
function endHandleHit(obj,x,y,rect){const n=countFor(obj),threshold=14;for(let i=0;i<n;i++){const g=rowGeometry(obj,i),hx=(obj.x+obj.w*(g.x0+g.w))*rect.width,hy=(obj.y+obj.h*(g.y0+g.h/2))*rect.height;if(Math.hypot(x*rect.width-hx,y*rect.height-hy)<=threshold)return i}return -1}
function drawHandles(){if(!selectedId)return;const obj=strokes.find(s=>s&&s.smartId===selectedId&&s.smartType==='barModel'&&s.smartBarType==='comparison');if(!obj)return;const n=countFor(obj);ctx.save();ctx.fillStyle='#fff';ctx.strokeStyle='#2563eb';ctx.lineWidth=2;for(let i=0;i<n;i++){const g=rowGeometry(obj,i),x=(obj.x+obj.w*(g.x0+g.w))*cssW,y=(obj.y+obj.h*(g.y0+g.h/2))*cssH;ctx.beginPath();ctx.arc(x,y,7,0,Math.PI*2);ctx.fill();ctx.stroke()}ctx.restore()}
const baseRedraw=redraw;redraw=function(){normalizeAll();baseRedraw();drawHandles()};
canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;const p=canvasPoint(e),obj=hitComparison(p.x,p.y);if(!obj){selectedId=null;redraw();return}normalizeComparison(obj);selectedId=obj.smartId;const row=endHandleHit(obj,p.x,p.y,p.r);redraw();if(row<0)return;e.preventDefault();e.stopImmediatePropagation();canvas.setPointerCapture?.(e.pointerId);drag={id:obj.smartId,row,before:clone(strokes),pointerId:e.pointerId,moved:false}},true);
canvas.addEventListener('pointermove',e=>{if(!drag)return;const obj=strokes.find(s=>s&&s.smartId===drag.id);if(!obj)return;const p=canvasPoint(e),widths=widthsFor(obj),innerStart=obj.x+obj.w*(70/900),innerMax=obj.w*(760/900);let frac=(p.x-innerStart)/Math.max(.001,innerMax);frac=clamp(frac,.16,1);if(Math.abs(widths[drag.row]-frac)<.001)return;widths[drag.row]=frac;obj.barCompareWidths=widths;rebuild(obj);drag.moved=true;suppressClick=true;redraw();syncUi();e.preventDefault();e.stopImmediatePropagation()},true);
function endDrag(e){if(!drag)return;const obj=strokes.find(s=>s&&s.smartId===drag.id);if(obj&&drag.moved)window.__smartBarLastHistory={before:drag.before,afterId:obj.smartId};try{canvas.releasePointerCapture?.(drag.pointerId)}catch{}drag=null;setTimeout(()=>{suppressClick=false},80);e?.preventDefault?.();e?.stopImmediatePropagation?.()}
canvas.addEventListener('pointerup',endDrag,true);canvas.addEventListener('pointercancel',endDrag,true);document.addEventListener('click',e=>{if(suppressClick&&e.target===canvas){e.preventDefault();e.stopImmediatePropagation()}},true);document.addEventListener('keydown',e=>{if(e.key==='Escape'){selectedId=null;drag=null;redraw()}},true);setTimeout(()=>{try{normalizeAll();redraw()}catch{}},0);
})();
