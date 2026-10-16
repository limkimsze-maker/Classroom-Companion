(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function')return;
const wrap=document.getElementById('boardWrap');if(!wrap)return;
const X0=180,MAX_W=650,START_Y=60,ROW_GAP=145,BAR_H=58,VB_W=900,VB_H=440;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function isMC(o){return !!(o&&o.smartType==='barModel'&&o.smartBarType==='multiplicative'&&Number.isFinite(o.x)&&Number.isFinite(o.y)&&Number.isFinite(o.w)&&Number.isFinite(o.h))}
function count(o){return clamp(Math.round(Number(o.multiCount)||2),2,8)}
let ov=document.getElementById('multiplicativeDividerOverlay');
if(!ov){ov=document.createElement('canvas');ov.id='multiplicativeDividerOverlay';ov.setAttribute('aria-hidden','true');ov.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:916;pointer-events:none';wrap.appendChild(ov)}
const g=ov.getContext('2d');
function size(){const r=wrap.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2),w=Math.max(1,Math.round(r.width*d)),h=Math.max(1,Math.round(r.height*d));if(ov.width!==w)ov.width=w;if(ov.height!==h)ov.height=h;ov.style.width=r.width+'px';ov.style.height=r.height+'px';g.setTransform(d,0,0,d,0,0);return{W:r.width,H:r.height}}
function draw(){const{W,H}=size();g.clearRect(0,0,W,H);g.save();g.strokeStyle='#17324d';g.lineWidth=3;g.lineCap='butt';for(const o of strokes){if(!isMC(o))continue;const n=count(o),row=clamp(Math.round(Number(o.multiLongRow)||0),0,1),unit=MAX_W/n,y1=(o.y+o.h*((START_Y+row*ROW_GAP)/VB_H))*H,y2=(o.y+o.h*((START_Y+row*ROW_GAP+BAR_H)/VB_H))*H;for(let i=1;i<n;i++){const x=(o.x+o.w*((X0+i*unit)/VB_W))*W;g.beginPath();g.moveTo(x,y1+1);g.lineTo(x,y2-1);g.stroke()}}g.restore()}
const previous=redraw;redraw=function(){const r=previous.apply(this,arguments);requestAnimationFrame(draw);return r};
window.addEventListener('resize',()=>requestAnimationFrame(draw));
new ResizeObserver(()=>requestAnimationFrame(draw)).observe(wrap);
setTimeout(draw,0);
})();
