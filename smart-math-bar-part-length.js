(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function'||typeof syncUi!=='function')return;
const edition=(new URLSearchParams(location.search).get('edition')||'en').toLowerCase();
const MISSING={en:'Missing Part',zh:'缺失部分',ms:'Bahagian Hilang',ta:'காணாத பகுதி'};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const clone=v=>JSON.parse(JSON.stringify(v));
let selectedId=null,drag=null,suppressClick=false;

function svgData(svg){return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]))}
function cutsFor(obj){
 const n=Math.max(2,obj.barCount||2);
 if(Array.isArray(obj.barCuts)&&obj.barCuts.length===n-1)return obj.barCuts.slice().sort((a,b)=>a-b);
 return Array.from({length:n-1},(_,i)=>(i+1)/n);
}
function rebuild(obj){
 const count=Math.max(2,obj.barCount||2),cuts=cutsFor(obj),bounds=[0,...cuts,1];
 const fills=Array.from({length:count},(_,i)=>obj.barFills?.[i]||'#ffffff');
 const labels=Array.from({length:count},(_,i)=>obj.barLabels?.[i]||'');
 const W=900,H=300,x=60,y=90,w=780,h=120,stroke='#17324d',els=[];
 for(let i=0;i<count;i++){
  const left=x+w*bounds[i],right=x+w*bounds[i+1],pw=right-left;
  els.push(`<rect x="${left}" y="${y}" width="${pw}" height="${h}" fill="${fills[i]}"/>`);
  if(labels[i]){
   const fs=labels[i].length>12?24:labels[i].length>7?30:38;
   els.push(`<text x="${left+pw/2}" y="${y+h/2+fs*.34}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${fs}" font-weight="700" fill="${stroke}">${esc(labels[i])}</text>`);
  }
 }
 els.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="none" stroke="${stroke}" stroke-width="8"/>`);
 for(const r of cuts){const px=x+w*r;els.push(`<line x1="${px}" y1="${y}" x2="${px}" y2="${y+h}" stroke="${stroke}" stroke-width="7"/>`)}
 obj.barCuts=cuts;obj.src=svgData(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${els.join('')}</svg>`);
}
function canvasPoint(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)/Math.max(1,r.width),y:(e.clientY-r.top)/Math.max(1,r.height),r}}
function hitPartWhole(x,y){
 for(let i=strokes.length-1;i>=0;i--){const s=strokes[i];if(!s||s.smartType!=='barModel'||s.smartBarType!=='partwhole'||!s.w||!s.h)continue;if(x>=s.x&&x<=s.x+s.w&&y>=s.y&&y<=s.y+s.h)return s}return null;
}
function dividerHit(obj,x,rect){
 const cuts=cutsFor(obj),px=x*rect.width,threshold=13;
 for(let i=0;i<cuts.length;i++){
  const cx=(obj.x+obj.w*(60/900+(780/900)*cuts[i]))*rect.width;
  if(Math.abs(px-cx)<=threshold)return i;
 }
 return -1;
}
function barEdges(obj){return{top:obj.y+obj.h*(90/300),bottom:obj.y+obj.h*(210/300),cx:obj.x+obj.w*.5}}
function heightHandleHit(obj,x,y,rect){
 const g=barEdges(obj),px=x*rect.width,py=y*rect.height,cx=g.cx*rect.width,top=g.top*rect.height,bottom=g.bottom*rect.height,threshold=12;
 if(Math.abs(px-cx)<=18&&Math.abs(py-top)<=threshold)return'top';
 if(Math.abs(px-cx)<=18&&Math.abs(py-bottom)<=threshold)return'bottom';
 return null;
}
function drawHandles(){
 if(!selectedId)return;
 const obj=strokes.find(s=>s&&s.smartId===selectedId&&s.smartType==='barModel'&&s.smartBarType==='partwhole');if(!obj)return;
 const cuts=cutsFor(obj),g=barEdges(obj);ctx.save();ctx.fillStyle='#ffffff';ctx.strokeStyle='#2563eb';ctx.lineWidth=2;
 for(const r of cuts){
  const x=(obj.x+obj.w*(60/900+(780/900)*r))*cssW,y=(obj.y+obj.h*.5)*cssH;
  ctx.beginPath();ctx.arc(x,y,7,0,Math.PI*2);ctx.fill();ctx.stroke();
 }
 const cx=g.cx*cssW,top=g.top*cssH,bottom=g.bottom*cssH;
 for(const y of [top,bottom]){ctx.beginPath();ctx.rect(cx-7,y-7,14,14);ctx.fill();ctx.stroke()}
 ctx.restore();
}
const baseRedraw=redraw;redraw=function(){baseRedraw();drawHandles()};

canvas.addEventListener('pointerdown',e=>{
 if(e.button!==0)return;
 const p=canvasPoint(e),obj=hitPartWhole(p.x,p.y);
 if(!obj){selectedId=null;redraw();return}
 selectedId=obj.smartId;const hh=heightHandleHit(obj,p.x,p.y,p.r),di=dividerHit(obj,p.x,p.r);redraw();
 if(!hh&&di<0)return;
 e.preventDefault();e.stopImmediatePropagation();canvas.setPointerCapture?.(e.pointerId);
 drag=hh?{id:obj.smartId,kind:'height',edge:hh,before:clone(strokes),pointerId:e.pointerId,moved:false}:{id:obj.smartId,kind:'divider',index:di,before:clone(strokes),pointerId:e.pointerId,moved:false};
},true);
canvas.addEventListener('pointermove',e=>{
 if(!drag)return;const obj=strokes.find(s=>s&&s.smartId===drag.id);if(!obj)return;
 const p=canvasPoint(e);
 if(drag.kind==='divider'){
  const cuts=cutsFor(obj),i=drag.index;
  const innerStart=obj.x+obj.w*(60/900),innerW=obj.w*(780/900);
  let r=(p.x-innerStart)/Math.max(.001,innerW);
  const minGap=.05,left=i===0?minGap:cuts[i-1]+minGap,right=i===cuts.length-1?1-minGap:cuts[i+1]-minGap;
  r=clamp(r,left,right);if(Math.abs(cuts[i]-r)<.001)return;
  cuts[i]=r;obj.barCuts=cuts;rebuild(obj);
 }else{
  const g=barEdges(obj),minVisible=30/Math.max(1,p.r.height),maxVisible=.55;
  let newH,newY;
  if(drag.edge==='bottom'){
   const top=g.top,visible=clamp(p.y-top,minVisible,maxVisible);newH=visible/.4;newY=top-.3*newH;
  }else{
   const bottom=g.bottom,visible=clamp(bottom-p.y,minVisible,maxVisible);newH=visible/.4;newY=p.y-.3*newH;
  }
  newH=clamp(newH,.08,.92);newY=clamp(newY,0,1-newH);
  if(Math.abs(obj.h-newH)<.001&&Math.abs(obj.y-newY)<.001)return;
  obj.h=newH;obj.y=newY;
 }
 drag.moved=true;suppressClick=true;redraw();syncUi();e.preventDefault();e.stopImmediatePropagation();
},true);
function endDrag(e){if(!drag)return;const obj=strokes.find(s=>s&&s.smartId===drag.id);if(obj&&drag.moved)window.__smartBarLastHistory={before:drag.before,afterId:obj.smartId};try{canvas.releasePointerCapture?.(drag.pointerId)}catch{};drag=null;setTimeout(()=>{suppressClick=false},80);e?.preventDefault?.();e?.stopImmediatePropagation?.()}
canvas.addEventListener('pointerup',endDrag,true);canvas.addEventListener('pointercancel',endDrag,true);
document.addEventListener('click',e=>{if(suppressClick&&e.target===canvas){e.preventDefault();e.stopImmediatePropagation()}},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'){selectedId=null;drag=null;redraw()}},true);

function removeMissing(){const m=document.getElementById('smartBarTypeMenu');if(!m)return;const label=MISSING[edition]||MISSING.en;for(const b of m.querySelectorAll('button'))if((b.textContent||'').trim()===label)b.remove()}
new MutationObserver(removeMissing).observe(document.body,{childList:true,subtree:true});
removeMissing();
})();
