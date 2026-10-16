(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function'||typeof cssW==='undefined'||typeof cssH==='undefined')return;
const wrap=document.getElementById('boardWrap');if(!wrap)return;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const clone=v=>JSON.parse(JSON.stringify(v));
const X0=180,MAX_W=650,START_Y=60,ROW_GAP=145,BAR_H=76;
let suppressClick=false;

function isComparison(o){return !!(o&&o.smartType==='barModel'&&o.smartBarType==='comparison'&&Number.isFinite(o.x)&&Number.isFinite(o.y)&&Number.isFinite(o.w)&&Number.isFinite(o.h));}
function count(o){return clamp(Math.round(Number(o.barCount)||2),2,5);}
function modelH(o){return Math.max(340,150+count(o)*145);}
function widths(o){const n=count(o),a=Array.isArray(o.barCompareWidths)?o.barCompareWidths:[];return Array.from({length:n},(_,i)=>clamp(Number(a[i]??(1-i*.11))||.5,.16,1));}
function rowGeom(o,row,W,H){const mh=modelH(o),ws=widths(o),x0=(o.x+o.w*(X0/900))*W,x1=(o.x+o.w*((X0+MAX_W*ws[row])/900))*W,y1=(o.y+o.h*((START_Y+row*ROW_GAP)/mh))*H,y2=(o.y+o.h*((START_Y+row*ROW_GAP+BAR_H)/mh))*H;return{x0,x1,y1,y2};}
function modelAt(clientX,clientY){const r=canvas.getBoundingClientRect(),x=(clientX-r.left)/Math.max(1,r.width),y=(clientY-r.top)/Math.max(1,r.height);for(let i=strokes.length-1;i>=0;i--){const o=strokes[i];if(isComparison(o)&&x>=o.x&&x<=o.x+o.w&&y>=o.y&&y<=o.y+o.h)return o}return null;}
function hitRow(o,clientX,clientY){const r=canvas.getBoundingClientRect(),x=clientX-r.left,y=clientY-r.top;for(let i=0;i<count(o);i++){const q=rowGeom(o,i,r.width,r.height);if(x>=q.x0&&x<=q.x1&&y>=q.y1&&y<=q.y2)return i}return-1;}
function segmentAt(o,row,clientX){
 const r=canvas.getBoundingClientRect(),x=clientX-r.left,W=r.width,ws=widths(o),own=ws[row],base=(o.x+o.w*(X0/900))*W,end=(o.x+o.w*((X0+MAX_W*own)/900))*W;
 const shorter=[];for(let i=0;i<ws.length;i++){if(i===row||ws[i]>=own-.002)continue;const ex=(o.x+o.w*((X0+MAX_W*ws[i])/900))*W;if(ex>base+4&&ex<end-4)shorter.push({x:ex,row:i,w:ws[i]});}
 if(!shorter.length)return null;
 shorter.sort((a,b)=>a.x-b.x);
 const uniq=[];for(const s of shorter){const last=uniq[uniq.length-1];if(!last||Math.abs(s.x-last.x)>5)uniq.push(s);}
 const bounds=uniq.map(s=>s.x);bounds.push(end);
 for(let i=0;i<bounds.length-1;i++){
  const x1=bounds[i],x2=bounds[i+1];if(x>=x1+2&&x<=x2-2){
   const leftSource=uniq[i];return{row,x1:(x1/W-o.x)/o.w,x2:(x2/W-o.x)/o.w,sourceRow:leftSource?.row??null};
  }
 }
 // Right-most overhang: from the nearest shorter endpoint to this bar end.
 const last=uniq[uniq.length-1];if(last&&x>=last.x+2&&x<=end-2)return{row,x1:(last.x/W-o.x)/o.w,x2:(end/W-o.x)/o.w,sourceRow:last.row};
 return null;
}
function same(a,b){return a&&b&&a.row===b.row&&Math.abs(a.x1-b.x1)<.002&&Math.abs(a.x2-b.x2)<.002;}
function toggle(o,seg){
 const before=clone(strokes);if(!Array.isArray(o.segmentBrackets))o.segmentBrackets=[];
 const i=o.segmentBrackets.findIndex(b=>same(b,seg));
 if(i>=0)o.segmentBrackets.splice(i,1);else{o.segmentBrackets.push({row:seg.row,x1:seg.x1,x2:seg.x2,sourceRow:seg.sourceRow,side:seg.row===count(o)-1?'bottom':'top',label:''});}
 window.__smartBarLastHistory={before,afterId:o.smartId};
 try{redraw();if(typeof syncUi==='function')syncUi()}catch{}
 if(typeof say==='function')try{say(i>=0?'Segment bracket removed':'Segment bracket added')}catch{}
}

let ov=document.getElementById('comparisonSegmentBracketOverlay');
if(!ov){ov=document.createElement('canvas');ov.id='comparisonSegmentBracketOverlay';ov.setAttribute('aria-hidden','true');ov.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:939;pointer-events:none;';wrap.appendChild(ov)}
const g=ov.getContext('2d');
function sizeOv(){const r=wrap.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2),w=Math.max(1,Math.round(r.width*d)),h=Math.max(1,Math.round(r.height*d));if(ov.width!==w)ov.width=w;if(ov.height!==h)ov.height=h;ov.style.width=r.width+'px';ov.style.height=r.height+'px';g.setTransform(d,0,0,d,0,0);return{W:r.width,H:r.height};}
function brace(x1,x2,y,top,label){if(x2<x1)[x1,x2]=[x2,x1];const w=Math.max(18,x2-x1),mid=(x1+x2)/2,end=clamp(w*.05,5,11),neck=clamp(w*.035,5,9),depth=8,edgeDir=top?1:-1,notchDir=top?-1:1;g.save();g.strokeStyle='#111827';g.fillStyle='#111827';g.lineWidth=2.3;g.lineCap='round';g.lineJoin='round';g.beginPath();g.moveTo(x1,y+edgeDir*depth);g.bezierCurveTo(x1,y+edgeDir*3,x1+2,y,x1+end,y);g.lineTo(mid-neck,y);g.bezierCurveTo(mid-neck*.35,y,mid-4,y+notchDir*2,mid,y+notchDir*depth);g.bezierCurveTo(mid+4,y+notchDir*2,mid+neck*.35,y,mid+neck,y);g.lineTo(x2-end,y);g.bezierCurveTo(x2-2,y,x2,y+edgeDir*3,x2,y+edgeDir*depth);g.stroke();if(label){g.font='700 20px Arial,sans-serif';g.textAlign='center';g.textBaseline=top?'bottom':'top';g.fillText(label,mid,y+(top?-16:16));}g.restore();}
function draw(){const {W,H}=sizeOv();g.clearRect(0,0,W,H);for(const o of strokes){if(!isComparison(o)||!Array.isArray(o.segmentBrackets))continue;for(const b of o.segmentBrackets){const row=clamp(Number(b.row)||0,0,count(o)-1),q=rowGeom(o,row,W,H),x1=(o.x+o.w*clamp(Number(b.x1)||0,0,1))*W,x2=(o.x+o.w*clamp(Number(b.x2)||0,0,1))*W,top=b.side!=='bottom',y=top?q.y1-13:q.y2+13;brace(x1,x2,y,top,b.label||'');}}}
const prev=redraw;redraw=function(){prev();requestAnimationFrame(draw);};

window.addEventListener('pointerdown',e=>{
 if(e.target!==canvas||(e.button!==undefined&&e.button!==0))return;if(typeof tool!=='undefined'&&tool!=='select')return;
 const o=modelAt(e.clientX,e.clientY);if(!o)return;const row=hitRow(o,e.clientX,e.clientY);if(row<0)return;const seg=segmentAt(o,row,e.clientX);if(!seg)return;
 suppressClick=true;toggle(o,seg);e.preventDefault();e.stopImmediatePropagation();setTimeout(()=>{suppressClick=false},120);
},true);
window.addEventListener('click',e=>{if(suppressClick&&e.target===canvas){e.preventDefault();e.stopImmediatePropagation();}},true);
window.addEventListener('resize',()=>requestAnimationFrame(draw));
setTimeout(draw,0);
})();
