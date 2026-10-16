(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined')return;
const wrap=document.getElementById('boardWrap');if(!wrap)return;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const X0=180,MAX_W=650,START_Y=60,ROW_GAP=145,BAR_H=58;

// The segment-options renderer used to paint bracket labels itself. Suppress only
// that text; the braces and selection preview still render normally. Labels are
// redrawn below with collision-safe layout.
if(!window.__comparisonBracketSafeFillPatched){
 const raw=CanvasRenderingContext2D.prototype.fillText;
 window.__comparisonBracketSafeRawFillText=raw;
 CanvasRenderingContext2D.prototype.fillText=function(){
  if(this?.canvas?.id==='comparisonSegmentBracketOverlay')return;
  return raw.apply(this,arguments);
 };
 window.__comparisonBracketSafeFillPatched=true;
}

let ov=document.getElementById('comparisonBracketSafeLabelOverlay');
if(!ov){
 ov=document.createElement('canvas');
 ov.id='comparisonBracketSafeLabelOverlay';
 ov.setAttribute('aria-hidden','true');
 ov.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:945;pointer-events:none;';
 wrap.appendChild(ov);
}
const g=ov.getContext('2d');
function isComparison(o){return !!(o&&o.smartType==='barModel'&&o.smartBarType==='comparison'&&Number.isFinite(o.x)&&Number.isFinite(o.y)&&Number.isFinite(o.w)&&Number.isFinite(o.h));}
function count(o){return clamp(Math.round(Number(o?.barCount)||2),2,5)}
function modelH(o){return Math.max(340,150+count(o)*145)}
function sizeOv(){
 const r=wrap.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2),w=Math.max(1,Math.round(r.width*d)),h=Math.max(1,Math.round(r.height*d));
 if(ov.width!==w)ov.width=w;if(ov.height!==h)ov.height=h;
 ov.style.width=r.width+'px';ov.style.height=r.height+'px';g.setTransform(d,0,0,d,0,0);
 return{W:r.width,H:r.height};
}
function rowGeom(o,row,W,H){
 const Hm=modelH(o),y=START_Y+row*ROW_GAP;
 return{y1:(o.y+o.h*(y/Hm))*H,y2:(o.y+o.h*((y+BAR_H)/Hm))*H};
}
function overlap(a,b,pad=0){return !(a.r+pad<=b.l||a.l>=b.r+pad||a.b+pad<=b.t||a.t>=b.b+pad)}
function roundRect(ctx,x,y,w,h,r){
 r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();
}
function textMetrics(text,maxW){
 let size=18;g.font=`800 ${size}px Inter,Arial,sans-serif`;
 while(size>12&&g.measureText(text).width>maxW-12){size--;g.font=`800 ${size}px Inter,Arial,sans-serif`}
 const measured=g.measureText(text).width;
 return{size,width:Math.min(maxW,Math.max(28,measured+14)),drawMax:Math.max(16,maxW-12),height:size+10};
}
function barsAsForbidden(W,H){
 const out=[];
 for(const o of strokes){if(!isComparison(o))continue;for(let row=0;row<count(o);row++){
  const rg=rowGeom(o,row,W,H),ws=Array.isArray(o.barCompareWidths)?o.barCompareWidths:[],bw=clamp(Number(ws[row]??(1-row*.11))||.5,.16,1);
  const x1=(o.x+o.w*(X0/900))*W,x2=(o.x+o.w*((X0+MAX_W*bw)/900))*W;
  out.push({l:x1-3,r:x2+3,t:rg.y1-3,b:rg.y2+3});
 }}
 return out;
}
function placeBox(x1,x2,baseY,top,m,used,forbidden,W,H){
 const half=m.width/2,spanL=Math.min(x1,x2),spanR=Math.max(x1,x2),mid=(spanL+spanR)/2;
 const minCx=Math.max(half+4,spanL+half),maxCx=Math.min(W-half-4,spanR-half);
 const xs=[];
 const addX=v=>{v=clamp(v,half+4,W-half-4);if(!xs.some(x=>Math.abs(x-v)<2))xs.push(v)};
 addX(mid);
 if(maxCx>=minCx){addX(minCx);addX(maxCx);addX(spanL+(spanR-spanL)*.32);addX(spanL+(spanR-spanL)*.68)}
 const step=m.height+6;
 const ys=[baseY];
 for(let lane=1;lane<=4;lane++)ys.push(baseY+(top?-1:1)*lane*step);
 for(const cy of ys){for(const cx of xs){
  const box={l:cx-half,r:cx+half,t:cy-m.height/2,b:cy+m.height/2};
  if(box.t<3||box.b>H-3)continue;
  if(forbidden.some(q=>overlap(box,q,1)))continue;
  if(used.some(q=>overlap(box,q,3)))continue;
  return{cx,cy,box,moved:Math.abs(cy-baseY)>2};
 }}
 const cx=clamp(mid,half+4,W-half-4),cy=clamp(baseY,m.height/2+4,H-m.height/2-4);
 return{cx,cy,box:{l:cx-half,r:cx+half,t:cy-m.height/2,b:cy+m.height/2},moved:false};
}
function drawPill(text,p,m,braceY){
 const x=p.cx-m.width/2,y=p.cy-m.height/2;
 g.save();
 if(p.moved){
  g.strokeStyle='rgba(23,50,77,.35)';g.lineWidth=1.25;g.beginPath();g.moveTo(p.cx,p.cy+(p.cy<braceY?m.height/2:-m.height/2));g.lineTo(p.cx,braceY);g.stroke();
 }
 g.shadowColor='rgba(23,50,77,.12)';g.shadowBlur=4;g.shadowOffsetY=1;
 g.fillStyle='rgba(255,255,255,.97)';roundRect(g,x,y,m.width,m.height,7);g.fill();
 g.shadowColor='transparent';g.strokeStyle='rgba(23,50,77,.20)';g.lineWidth=1;roundRect(g,x,y,m.width,m.height,7);g.stroke();
 g.font=`800 ${m.size}px Inter,Arial,sans-serif`;g.textAlign='center';g.textBaseline='middle';g.fillStyle='#17324d';
 const raw=window.__comparisonBracketSafeRawFillText||CanvasRenderingContext2D.prototype.fillText;raw.call(g,text,p.cx,p.cy,m.drawMax);
 g.restore();
}
function drawLabels(){
 const {W,H}=sizeOv();g.clearRect(0,0,W,H);
 const forbidden=barsAsForbidden(W,H),used=[];
 for(const o of strokes){
  if(!isComparison(o)||!Array.isArray(o.segmentBrackets))continue;
  const brackets=o.segmentBrackets.filter(b=>b&&b.visible!==false&&String(b.label||'').trim());
  brackets.sort((a,b)=>Math.abs(Number(b.x2)-Number(b.x1))-Math.abs(Number(a.x2)-Number(a.x1)));
  for(const b of brackets){
   const row=clamp(Number(b.row)||0,0,count(o)-1),rg=rowGeom(o,row,W,H),x1=(o.x+o.w*Number(b.x1||0))*W,x2=(o.x+o.w*Number(b.x2||0))*W,top=b.side!=='bottom';
   const braceY=top?rg.y1-13:rg.y2+13;
   const baseY=braceY+(top?-9:9),available=Math.max(34,Math.min(170,Math.abs(x2-x1)-8)),m=textMetrics(String(b.label).trim(),available);
   const p=placeBox(x1,x2,baseY,top,m,used,forbidden,W,H);used.push(p.box);drawPill(String(b.label).trim(),p,m,braceY);
  }
 }
}

if(typeof redraw==='function'){
 const prev=redraw;
 redraw=function(){const r=prev.apply(this,arguments);requestAnimationFrame(drawLabels);return r};
}
window.addEventListener('resize',()=>requestAnimationFrame(drawLabels));
new ResizeObserver(()=>requestAnimationFrame(drawLabels)).observe(wrap);
setInterval(drawLabels,350);
setTimeout(()=>{try{redraw()}catch{drawLabels()}},0);
})();