(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof cssW==='undefined'||typeof cssH==='undefined')return;

function point(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left),y:(e.clientY-r.top)}}
function modelBounds(s){return{x:s.x*cssW,y:s.y*cssH,w:s.w*cssW,h:s.h*cssH}}
function inBox(p,b,pad=0){return p.x>=b.x-pad&&p.x<=b.x+b.w+pad&&p.y>=b.y-pad&&p.y<=b.y+b.h+pad}
function visibleComparisonHit(s,p){
 const b=modelBounds(s),rx=(p.x-b.x)/Math.max(1,b.w),ry=(p.y-b.y)/Math.max(1,b.h),n=Math.max(2,Math.min(5,Number(s.barCount)||2));
 const H=Math.max(340,150+n*145),sx=rx*900,sy=ry*H,x=180,maxW=650,rowGap=145,barH=76,startY=60;
 const widths=Array.isArray(s.barCompareWidths)?s.barCompareWidths:[];
 for(let i=0;i<n;i++){
  const w=maxW*Math.max(.16,Math.min(1,Number(widths[i]??(1-i*.11))||.5)),y=startY+i*rowGap;
  if(sx>=x-14&&sx<=x+w+14&&sy>=y-14&&sy<=y+barH+14)return true;
 }
 return false;
}
function visibleOtherBarHit(s,p){
 const b=modelBounds(s),rx=(p.x-b.x)/Math.max(1,b.w),ry=(p.y-b.y)/Math.max(1,b.h),sx=rx*900,sy=ry*300;
 return sx>=42&&sx<=858&&sy>=68&&sy<=232;
}
function visibleModelHit(s,p){
 if(s.smartBarType==='comparison')return visibleComparisonHit(s,p);
 return visibleOtherBarHit(s,p);
}
function cornerHandleHit(s,p){const b=modelBounds(s);return Math.abs(p.x-(b.x+b.w+7))<=24&&Math.abs(p.y-(b.y+b.h+7))<=24}
function blankSmartModelAt(p){
 for(let i=strokes.length-1;i>=0;i--){
  const s=strokes[i];
  if(!s||s.type!=='image'||s.smartType!=='barModel'||!Number.isFinite(s.x)||!Number.isFinite(s.y)||!Number.isFinite(s.w)||!Number.isFinite(s.h))continue;
  const b=modelBounds(s);if(!inBox(p,b,6))continue;
  if(visibleModelHit(s,p)||cornerHandleHit(s,p))return null;
  return s;
 }
 return null;
}

canvas.addEventListener('pointerdown',e=>{
 if(typeof tool!=='undefined'&&tool!=='select')return;
 if(e.button!==undefined&&e.button!==0)return;
 const p=point(e),blank=blankSmartModelAt(p);if(!blank)return;
 e.preventDefault();e.stopImmediatePropagation();canvas.style.cursor='default';
 // Clicking transparent whitespace releases selection instead of grabbing the whole model.
 try{document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))}catch{}
},true);

canvas.addEventListener('pointermove',e=>{
 if(typeof tool!=='undefined'&&tool!=='select')return;
 const p=point(e);if(blankSmartModelAt(p))canvas.style.cursor='default';
},false);
})();
