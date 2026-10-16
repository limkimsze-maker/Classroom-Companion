(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function')return;
const wrap=document.getElementById('boardWrap');
if(!wrap)return;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const X0=180,MAX_W=650,START_Y=60,ROW_GAP=145,BAR_H=76;
let overlay=document.getElementById('comparisonDottedGuideOverlay');
if(!overlay){
 overlay=document.createElement('canvas');
 overlay.id='comparisonDottedGuideOverlay';
 overlay.setAttribute('aria-hidden','true');
 overlay.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:920;pointer-events:none;';
 wrap.appendChild(overlay);
}
const g=overlay.getContext('2d');
function count(o){return clamp(Math.round(Number(o?.barCount)||2),2,5)}
function modelH(o){return Math.max(340,150+count(o)*145)}
function widths(o){const n=count(o),a=Array.isArray(o?.barCompareWidths)?o.barCompareWidths:[];return Array.from({length:n},(_,i)=>clamp(Number(a[i]??(1-i*.11))||.5,.16,1))}
function parseColour(c){
 const s=String(c||'').trim();
 if(/^#[0-9a-f]{3}$/i.test(s))return[s[1]+s[1],s[2]+s[2],s[3]+s[3]].map(v=>parseInt(v,16));
 if(/^#[0-9a-f]{6}$/i.test(s))return[parseInt(s.slice(1,3),16),parseInt(s.slice(3,5),16),parseInt(s.slice(5,7),16)];
 const m=s.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
 return m?[+m[1],+m[2],+m[3]]:[255,255,255];
}
function contrastFor(c){
 const [r,gg,b]=parseColour(c),lum=(0.2126*r+0.7152*gg+0.0722*b)/255;
 return lum<.6?'#ffffff':'#111827';
}
function resizeOverlay(){
 const r=wrap.getBoundingClientRect(),d=Math.min(window.devicePixelRatio||1,2);
 const w=Math.max(1,Math.round(r.width*d)),h=Math.max(1,Math.round(r.height*d));
 if(overlay.width!==w)overlay.width=w;
 if(overlay.height!==h)overlay.height=h;
 overlay.style.width=r.width+'px';overlay.style.height=r.height+'px';
 g.setTransform(d,0,0,d,0,0);
 return{W:r.width,H:r.height};
}
function uniqueSorted(values){
 const out=[];
 for(const v of values.slice().sort((a,b)=>a-b)){
  if(!out.length||Math.abs(v-out[out.length-1])>.012)out.push(v);
 }
 return out;
}
function drawGuideAt(obj,row,boundary,W,H,ws){
 const Hm=modelH(obj),x=(Number(obj.x||0)+Number(obj.w||0)*((X0+MAX_W*boundary)/900))*W;
 const yTop=(Number(obj.y||0)+Number(obj.h||0)*((START_Y+row*ROW_GAP)/Hm))*H;
 const yBottom=(Number(obj.y||0)+Number(obj.h||0)*((START_Y+row*ROW_GAP+BAR_H)/Hm))*H;
 const fill=Array.isArray(obj.barFills)?obj.barFills[row]:'#ffffff';
 const main=contrastFor(fill),halo=main==='#ffffff'?'rgba(0,0,0,.55)':'rgba(255,255,255,.82)';
 const top=yTop+5,bottom=yBottom-5;if(bottom<=top)return;
 g.save();g.lineCap='round';g.setLineDash([6,6]);
 g.strokeStyle=halo;g.lineWidth=8;g.beginPath();g.moveTo(x,top);g.lineTo(x,bottom);g.stroke();
 g.strokeStyle=main;g.lineWidth=4;g.beginPath();g.moveTo(x,top);g.lineTo(x,bottom);g.stroke();
 g.restore();
}
function drawOne(obj,W,H){
 if(!obj||obj.smartType!=='barModel'||obj.smartBarType!=='comparison')return;
 const n=count(obj),ws=widths(obj),distinct=uniqueSorted(ws);
 if(distinct.length<2)return;
 for(let row=0;row<n;row++){
  const own=ws[row];
  for(const boundary of distinct){
   if(boundary>=own-.012)break;
   drawGuideAt(obj,row,boundary,W,H,ws);
  }
 }
}
function drawGuides(){
 const {W,H}=resizeOverlay();
 g.clearRect(0,0,W,H);
 for(const obj of strokes)drawOne(obj,W,H);
}
const previousRedraw=redraw;
redraw=function(){previousRedraw();requestAnimationFrame(drawGuides)};
new ResizeObserver(()=>requestAnimationFrame(drawGuides)).observe(wrap);
window.addEventListener('resize',()=>requestAnimationFrame(drawGuides));
setTimeout(()=>{try{drawGuides()}catch{}},0);
})();
