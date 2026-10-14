(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function')return;
const wrap=document.getElementById('boardWrap');
if(!wrap)return;
let overlay=document.getElementById('comparisonDottedGuideOverlay');
if(!overlay){
 overlay=document.createElement('canvas');
 overlay.id='comparisonDottedGuideOverlay';
 overlay.setAttribute('aria-hidden','true');
 overlay.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:920;pointer-events:none;';
 wrap.appendChild(overlay);
}
const g=overlay.getContext('2d');
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
function hasVisibleDifference(obj){
 if(Array.isArray(obj.userDrawnBrackets)&&obj.userDrawnBrackets.some(b=>b&&b.isDifference&&b.visible!==false))return true;
 return false;
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
function drawOne(obj,W,H){
 if(!obj||obj.smartType!=='barModel'||obj.smartBarType!=='comparison'||Number(obj.barCount)!==2)return;
 if(!hasVisibleDifference(obj))return;
 const widths=Array.isArray(obj.barCompareWidths)?obj.barCompareWidths:[];
 if(widths.length<2)return;
 const w0=Number(widths[0]||0),w1=Number(widths[1]||0);
 if(Math.abs(w0-w1)<.025)return;
 const long=w0>=w1?0:1,short=1-long;
 const modelH=440,startY=60,rowGap=145,barH=76;
 const x=(Number(obj.x||0)+Number(obj.w||0)*(180+650*Number(widths[short]||0))/900)*W;
 const rowY=startY+long*rowGap;
 const y1=(Number(obj.y||0)+Number(obj.h||0)*(rowY/modelH))*H;
 const y2=(Number(obj.y||0)+Number(obj.h||0)*((rowY+barH)/modelH))*H;
 const fill=Array.isArray(obj.barFills)?obj.barFills[long]:'#ffffff';
 const main=contrastFor(fill),halo=main==='#ffffff'?'rgba(0,0,0,.55)':'rgba(255,255,255,.8)';
 const top=y1+5,bottom=y2-5;
 if(bottom<=top)return;
 g.save();
 g.lineCap='round';
 g.setLineDash([6,6]);
 g.strokeStyle=halo;g.lineWidth=8;
 g.beginPath();g.moveTo(x,top);g.lineTo(x,bottom);g.stroke();
 g.strokeStyle=main;g.lineWidth=4;
 g.beginPath();g.moveTo(x,top);g.lineTo(x,bottom);g.stroke();
 g.restore();
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
