(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function')return;
const wrap=document.getElementById('boardWrap');if(!wrap)return;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const clone=v=>JSON.parse(JSON.stringify(v));
const FALLBACK_X=180,FALLBACK_MAX_W=650,FALLBACK_START_Y=60,FALLBACK_GAP=145,FALLBACK_H=76;
let suppressClick=false;

function isComparison(o){return !!(o&&o.smartType==='barModel'&&o.smartBarType==='comparison'&&Number.isFinite(o.x)&&Number.isFinite(o.y)&&Number.isFinite(o.w)&&Number.isFinite(o.h));}
function count(o){return clamp(Math.round(Number(o.barCount)||2),2,5);}
function fallbackModelH(o){return Math.max(340,150+count(o)*145);}
function fallbackWidths(o){const n=count(o),a=Array.isArray(o.barCompareWidths)?o.barCompareWidths:[];return Array.from({length:n},(_,i)=>clamp(Number(a[i]??(1-i*.11))||.5,.16,1));}

function decodeSvg(src){
 if(typeof src!=='string'||!src.startsWith('data:image/svg+xml'))return'';
 const comma=src.indexOf(',');if(comma<0)return'';
 const body=src.slice(comma+1);try{return decodeURIComponent(body)}catch{return body}
}
function actualSvgGeometry(o){
 const svg=decodeSvg(o.src);if(!svg)return null;
 const vm=svg.match(/viewBox\s*=\s*["']\s*([\d.+-]+)\s+([\d.+-]+)\s+([\d.+-]+)\s+([\d.+-]+)\s*["']/i);
 const wm=svg.match(/<svg[^>]*\bwidth\s*=\s*["']([\d.+-]+)["']/i),hm=svg.match(/<svg[^>]*\bheight\s*=\s*["']([\d.+-]+)["']/i);
 const vbX=vm?Number(vm[1]):0,vbY=vm?Number(vm[2]):0,W=vm?Number(vm[3]):Number(wm?.[1]||900),H=vm?Number(vm[4]):Number(hm?.[1]||fallbackModelH(o));
 if(!Number.isFinite(W)||!Number.isFinite(H)||W<=0||H<=0)return null;
 const rects=[];const re=/<rect\b[^>]*>/gi;let m;
 while((m=re.exec(svg))){
  const tag=m[0],read=n=>{const q=tag.match(new RegExp('\\b'+n+'\\s*=\\s*["\\']([\\d.+-]+)["\\']','i'));return q?Number(q[1]):NaN};
  const x=read('x'),y=read('y'),w=read('width'),h=read('height');if(![x,y,w,h].every(Number.isFinite)||w<=0||h<=0)continue;
  const fill=(tag.match(/\bfill\s*=\s*["']([^"']+)["']/i)||[])[1]||'';if(fill==='none')continue;
  rects.push({x,y,w,h});
 }
 if(rects.length<count(o))return null;
 let bars=rects.filter(r=>r.w>=W*.12&&r.h>=H*.035&&r.w>=r.h*2);
 if(bars.length<count(o))bars=rects.filter(r=>r.w>=W*.10&&r.w>=r.h*1.6);
 if(bars.length<count(o))return null;
 bars.sort((a,b)=>a.y-b.y);
 if(bars.length>count(o))bars=bars.sort((a,b)=>(b.w*b.h)-(a.w*a.h)).slice(0,count(o)).sort((a,b)=>a.y-b.y);
 return{W,H,vbX,vbY,bars};
}
function geometry(o){
 const actual=actualSvgGeometry(o);if(actual)return actual;
 const n=count(o),H=fallbackModelH(o),ws=fallbackWidths(o);return{W:900,H,vbX:0,vbY:0,bars:Array.from({length:n},(_,i)=>({x:FALLBACK_X,y:FALLBACK_START_Y+i*FALLBACK_GAP,w:FALLBACK_MAX_W*ws[i],h:FALLBACK_H}))};
}
function rowGeom(o,row,W,H){const geo=geometry(o),b=geo.bars[row];if(!b)return null;return{x0:(o.x+o.w*((b.x-geo.vbX)/geo.W))*W,x1:(o.x+o.w*((b.x+b.w-geo.vbX)/geo.W))*W,y1:(o.y+o.h*((b.y-geo.vbY)/geo.H))*H,y2:(o.y+o.h*((b.y+b.h-geo.vbY)/geo.H))*H};}
function modelAt(clientX,clientY){const r=canvas.getBoundingClientRect(),x=(clientX-r.left)/Math.max(1,r.width),y=(clientY-r.top)/Math.max(1,r.height);for(let i=strokes.length-1;i>=0;i--){const o=strokes[i];if(isComparison(o)&&x>=o.x&&x<=o.x+o.w&&y>=o.y&&y<=o.y+o.h)return o}return null;}
function hitRow(o,clientX,clientY){const r=canvas.getBoundingClientRect(),x=clientX-r.left,y=clientY-r.top;for(let i=0;i<count(o);i++){const q=rowGeom(o,i,r.width,r.height);if(q&&x>=q.x0-4&&x<=q.x1+4&&y>=q.y1-4&&y<=q.y2+4)return i}return-1;}
function segmentAt(o,row,clientX){
 const r=canvas.getBoundingClientRect(),x=clientX-r.left,W=r.width,H=r.height,own=rowGeom(o,row,W,H);if(!own)return null;
 const endpoints=[];
 for(let i=0;i<count(o);i++){if(i===row)continue;const q=rowGeom(o,i,W,H);if(q&&q.x1>own.x0+6&&q.x1<own.x1-6)endpoints.push({x:q.x1,row:i});}
 if(!endpoints.length)return null;
 endpoints.sort((a,b)=>a.x-b.x);
 const uniq=[];for(const e of endpoints){const last=uniq[uniq.length-1];if(!last||Math.abs(e.x-last.x)>5)uniq.push(e);}
 for(let i=0;i<uniq.length;i++){
  const x1=uniq[i].x,x2=i+1<uniq.length?uniq[i+1].x:own.x1;
  if(x2-x1<10)continue;
  if(x>=x1&&x<=x2)return{row,x1:(x1/W-o.x)/o.w,x2:(x2/W-o.x)/o.w,sourceRow:uniq[i].row};
 }
 return null;
}
function same(a,b){return a&&b&&a.row===b.row&&Math.abs(Number(a.x1)-Number(b.x1))<.0025&&Math.abs(Number(a.x2)-Number(b.x2))<.0025;}
function toggle(o,seg){
 const before=clone(strokes);if(!Array.isArray(o.segmentBrackets))o.segmentBrackets=[];
 const i=o.segmentBrackets.findIndex(b=>same(b,seg));
 if(i>=0)o.segmentBrackets.splice(i,1);else o.segmentBrackets.push({type:'segment',row:seg.row,x1:seg.x1,x2:seg.x2,sourceRow:seg.sourceRow,side:seg.row===count(o)-1?'bottom':'top',label:''});
 window.__smartBarLastHistory={before,afterId:o.smartId};
 try{redraw();if(typeof syncUi==='function')syncUi()}catch{}
 if(typeof say==='function')try{say(i>=0?'Segment bracket removed':'Segment bracket added')}catch{}
}

let ov=document.getElementById('comparisonSegmentBracketOverlay');
if(!ov){ov=document.createElement('canvas');ov.id='comparisonSegmentBracketOverlay';ov.setAttribute('aria-hidden','true');ov.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:939;pointer-events:none;';wrap.appendChild(ov)}
const g=ov.getContext('2d');
function sizeOv(){const r=wrap.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2),w=Math.max(1,Math.round(r.width*d)),h=Math.max(1,Math.round(r.height*d));if(ov.width!==w)ov.width=w;if(ov.height!==h)ov.height=h;ov.style.width=r.width+'px';ov.style.height=r.height+'px';g.setTransform(d,0,0,d,0,0);return{W:r.width,H:r.height};}
function brace(x1,x2,y,top,label){if(x2<x1)[x1,x2]=[x2,x1];const w=Math.max(18,x2-x1),mid=(x1+x2)/2,end=clamp(w*.05,5,11),neck=clamp(w*.035,5,9),depth=8,edgeDir=top?1:-1,notchDir=top?-1:1;g.save();g.strokeStyle='#111827';g.fillStyle='#111827';g.lineWidth=2.3;g.lineCap='round';g.lineJoin='round';g.beginPath();g.moveTo(x1,y+edgeDir*depth);g.bezierCurveTo(x1,y+edgeDir*3,x1+2,y,x1+end,y);g.lineTo(mid-neck,y);g.bezierCurveTo(mid-neck*.35,y,mid-4,y+notchDir*2,mid,y+notchDir*depth);g.bezierCurveTo(mid+4,y+notchDir*2,mid+neck*.35,y,mid+neck,y);g.lineTo(x2-end,y);g.bezierCurveTo(x2-2,y,x2,y+edgeDir*3,x2,y+edgeDir*depth);g.stroke();if(label){g.font='700 20px Arial,sans-serif';g.textAlign='center';g.textBaseline=top?'bottom':'top';g.fillText(label,mid,y+(top?-16:16));}g.restore();}
function draw(){const {W,H}=sizeOv();g.clearRect(0,0,W,H);for(const o of strokes){if(!isComparison(o)||!Array.isArray(o.segmentBrackets))continue;for(const b of o.segmentBrackets){const row=clamp(Number(b.row)||0,0,count(o)-1),q=rowGeom(o,row,W,H);if(!q)continue;const x1=(o.x+o.w*clamp(Number(b.x1)||0,0,1))*W,x2=(o.x+o.w*clamp(Number(b.x2)||0,0,1))*W,top=b.side!=='bottom',y=top?q.y1-13:q.y2+13;brace(x1,x2,y,top,b.label||'');}}}
const prev=redraw;redraw=function(){prev();requestAnimationFrame(draw);};

window.addEventListener('pointerdown',e=>{
 if(e.target!==canvas||(e.button!==undefined&&e.button!==0))return;
 const o=modelAt(e.clientX,e.clientY);if(!o)return;const row=hitRow(o,e.clientX,e.clientY);if(row<0)return;const seg=segmentAt(o,row,e.clientX);if(!seg)return;
 suppressClick=true;toggle(o,seg);e.preventDefault();e.stopImmediatePropagation();setTimeout(()=>{suppressClick=false},160);
},true);
window.addEventListener('click',e=>{if(suppressClick&&e.target===canvas){e.preventDefault();e.stopImmediatePropagation();}},true);
window.addEventListener('resize',()=>requestAnimationFrame(draw));
setTimeout(draw,0);
})();
