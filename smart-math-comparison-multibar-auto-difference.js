(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function'||typeof cssW==='undefined'||typeof cssH==='undefined')return;
const wrap=document.getElementById('boardWrap');
if(!wrap)return;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const START_Y=60,ROW_GAP=145,BAR_H=76,X0=180,MAX_W=650;
function countFor(o){return clamp(Math.round(Number(o?.barCount)||2),2,5)}
function modelH(n){return Math.max(340,150+n*145)}
function widthsFor(o){const n=countFor(o),a=Array.isArray(o.barCompareWidths)?o.barCompareWidths:[];return Array.from({length:n},(_,i)=>clamp(Number(a[i]??(1-i*.11))||.5,.16,1))}
function endpoint(w){return(X0+MAX_W*w)/900}
function pairGeometry(o,a,b){
 const widths=widthsFor(o),n=countFor(o),H=modelH(n),wa=widths[a],wb=widths[b];
 if(Math.abs(wa-wb)<.025)return null;
 const long=wa>=wb?a:b,short=long===a?b:a;
 const upper=Math.min(a,b),lower=Math.max(a,b);
 // Adjacent-pair bracket sits in the gap, attached to the longer member of that pair.
 const longIsUpper=long===upper;
 const yModel=longIsUpper?(START_Y+upper*ROW_GAP+BAR_H+8):(START_Y+lower*ROW_GAP-8);
 return{long,short,upper,lower,x1:endpoint(widths[short]),x2:endpoint(widths[long]),y:clamp(yModel/H,.01,.99),position:longIsUpper?'bottom':'top',widths,H};
}
function ensureOne(o){
 if(!o||o.smartType!=='barModel'||o.smartBarType!=='comparison'||countFor(o)<3)return false;
 const n=countFor(o);if(!Array.isArray(o.userDrawnBrackets))o.userDrawnBrackets=[];
 let changed=false;
 const expected=new Set();
 for(let i=0;i<n-1;i++){
  const j=i+1,id=`auto-adj-difference-${o.smartId}-${i}-${j}`;expected.add(id);
  const g=pairGeometry(o,i,j);let e=o.userDrawnBrackets.find(x=>x&&x.id===id);
  if(!g){if(e&&e.visible!==false){e.visible=false;e.__autoEqualHidden=true;changed=true}continue}
  if(!e){
   e={id,autoMultiDifference:true,diffRows:[i,j],visible:true,label:'',position:g.position,x1:g.x1,x2:g.x2,y:g.y,compareRow:g.long,compareAnchorLeft:{kind:'end',row:g.short},compareAnchorRight:{kind:'end',row:g.long},verticalOffset:0};
   o.userDrawnBrackets.push(e);changed=true;
  }else{
   if(e.__autoEqualHidden){e.visible=true;e.__autoEqualHidden=false;changed=true}
   const vals={position:g.position,x1:g.x1,x2:g.x2,y:g.y,compareRow:g.long};
   for(const [k,v] of Object.entries(vals))if(e[k]!==v){e[k]=v;changed=true}
   if(!Array.isArray(e.diffRows)||e.diffRows[0]!==i||e.diffRows[1]!==j){e.diffRows=[i,j];changed=true}
   e.compareAnchorLeft={kind:'end',row:g.short};e.compareAnchorRight={kind:'end',row:g.long};e.autoMultiDifference=true;
  }
 }
 // Remove only stale automatic entries left behind after a bar-count change.
 const before=o.userDrawnBrackets.length;
 o.userDrawnBrackets=o.userDrawnBrackets.filter(e=>!e?.autoMultiDifference||expected.has(e.id));
 if(o.userDrawnBrackets.length!==before)changed=true;
 return changed;
}
function ensureAll(){let c=false;for(const o of strokes)if(ensureOne(o))c=true;return c}

let overlay=document.getElementById('comparisonMultiGuideOverlay');
if(!overlay){overlay=document.createElement('canvas');overlay.id='comparisonMultiGuideOverlay';overlay.setAttribute('aria-hidden','true');overlay.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:925;pointer-events:none;';wrap.appendChild(overlay)}
const g=overlay.getContext('2d');
function parseColour(c){const s=String(c||'').trim();if(/^#[0-9a-f]{3}$/i.test(s))return[s[1]+s[1],s[2]+s[2],s[3]+s[3]].map(v=>parseInt(v,16));if(/^#[0-9a-f]{6}$/i.test(s))return[parseInt(s.slice(1,3),16),parseInt(s.slice(3,5),16),parseInt(s.slice(5,7),16)];const m=s.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);return m?[+m[1],+m[2],+m[3]]:[255,255,255]}
function contrastFor(c){const [r,gg,b]=parseColour(c),lum=(.2126*r+.7152*gg+.0722*b)/255;return lum<.6?'#ffffff':'#111827'}
function resizeOverlay(){const r=wrap.getBoundingClientRect(),d=Math.min(window.devicePixelRatio||1,2),w=Math.max(1,Math.round(r.width*d)),h=Math.max(1,Math.round(r.height*d));if(overlay.width!==w)overlay.width=w;if(overlay.height!==h)overlay.height=h;overlay.style.width=r.width+'px';overlay.style.height=r.height+'px';g.setTransform(d,0,0,d,0,0);return{W:r.width,H:r.height}}
function drawDots(){
 const {W,H}=resizeOverlay();g.clearRect(0,0,W,H);
 for(const o of strokes){
  if(!o||o.smartType!=='barModel'||o.smartBarType!=='comparison'||countFor(o)<3||!Array.isArray(o.userDrawnBrackets))continue;
  const n=countFor(o),MH=modelH(n),widths=widthsFor(o);
  for(const e of o.userDrawnBrackets){
   if(!e?.autoMultiDifference||e.visible===false||!Array.isArray(e.diffRows))continue;
   const [a,b]=e.diffRows.map(v=>clamp(Number(v)||0,0,n-1)),geo=pairGeometry(o,a,b);if(!geo)continue;
   const x=(Number(o.x||0)+Number(o.w||0)*endpoint(widths[geo.short]))*W;
   const rowY=START_Y+geo.long*ROW_GAP;
   const y1=(Number(o.y||0)+Number(o.h||0)*(rowY/MH))*H,y2=(Number(o.y||0)+Number(o.h||0)*((rowY+BAR_H)/MH))*H;
   const fill=Array.isArray(o.barFills)?o.barFills[geo.long]:'#ffffff',main=contrastFor(fill),halo=main==='#ffffff'?'rgba(0,0,0,.55)':'rgba(255,255,255,.82)';
   const top=y1+5,bottom=y2-5;if(bottom<=top)continue;
   g.save();g.lineCap='round';g.setLineDash([6,6]);g.strokeStyle=halo;g.lineWidth=8;g.beginPath();g.moveTo(x,top);g.lineTo(x,bottom);g.stroke();g.strokeStyle=main;g.lineWidth=4;g.beginPath();g.moveTo(x,top);g.lineTo(x,bottom);g.stroke();g.restore();
  }
 }
}
const previousRedraw=redraw;
redraw=function(){ensureAll();previousRedraw();requestAnimationFrame(drawDots)};
new ResizeObserver(()=>requestAnimationFrame(drawDots)).observe(wrap);window.addEventListener('resize',()=>requestAnimationFrame(drawDots));
setTimeout(()=>{try{ensureAll();redraw()}catch{}},0);
})();
