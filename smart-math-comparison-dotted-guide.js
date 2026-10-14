(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function'||typeof ctx==='undefined')return;

function parseColour(c){
 const s=String(c||'').trim();
 if(/^#[0-9a-f]{3}$/i.test(s))return[s[1]+s[1],s[2]+s[2],s[3]+s[3]].map(v=>parseInt(v,16));
 if(/^#[0-9a-f]{6}$/i.test(s))return[parseInt(s.slice(1,3),16),parseInt(s.slice(3,5),16),parseInt(s.slice(5,7),16)];
 const m=s.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
 return m?[+m[1],+m[2],+m[3]]:[255,255,255];
}
function contrastFor(c){
 const [r,g,b]=parseColour(c);
 const lum=(0.2126*r+0.7152*g+0.0722*b)/255;
 return lum<.6?'#ffffff':'#111827';
}
function hasVisibleDifference(obj){
 return Array.isArray(obj.userDrawnBrackets)&&obj.userDrawnBrackets.some(b=>b&&b.isDifference&&b.visible!==false);
}
function drawGuide(obj){
 if(!obj||obj.smartType!=='barModel'||obj.smartBarType!=='comparison'||Number(obj.barCount)!==2)return;
 if(!hasVisibleDifference(obj))return;
 const widths=Array.isArray(obj.barCompareWidths)?obj.barCompareWidths:[];
 if(widths.length<2)return;
 const w0=Number(widths[0]||0),w1=Number(widths[1]||0);
 if(Math.abs(w0-w1)<.025)return;
 const long=w0>=w1?0:1,short=1-long;
 const H=440,startY=60,rowGap=145,barH=76;
 const x=(Number(obj.x||0)+Number(obj.w||0)*(180+650*Number(widths[short]||0))/900)*cssW;
 const rowY=startY+long*rowGap;
 const y1=(Number(obj.y||0)+Number(obj.h||0)*(rowY/H))*cssH;
 const y2=(Number(obj.y||0)+Number(obj.h||0)*((rowY+barH)/H))*cssH;
 const fill=Array.isArray(obj.barFills)?obj.barFills[long]:'#ffffff';
 const main=contrastFor(fill),halo=main==='#ffffff'?'rgba(0,0,0,.28)':'rgba(255,255,255,.55)';
 ctx.save();
 ctx.lineCap='round';
 ctx.setLineDash([7,6]);
 ctx.strokeStyle=halo;ctx.lineWidth=7;
 ctx.beginPath();ctx.moveTo(x,y1+7);ctx.lineTo(x,y2-7);ctx.stroke();
 ctx.strokeStyle=main;ctx.lineWidth=4;
 ctx.beginPath();ctx.moveTo(x,y1+7);ctx.lineTo(x,y2-7);ctx.stroke();
 ctx.restore();
}
function drawAllGuides(){
 for(const obj of strokes)drawGuide(obj);
}
const previousRedraw=redraw;
redraw=function(){previousRedraw();drawAllGuides()};
setTimeout(()=>{try{redraw()}catch{}},0);
})();
