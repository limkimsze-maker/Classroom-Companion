(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined')return;
const PART_Y=90,PART_H=120,VB_H=300,BRACKET_GAP_PX=13;
function partWholeAt(clientX,clientY){
 const r=canvas.getBoundingClientRect(),x=(clientX-r.left)/Math.max(1,r.width),y=(clientY-r.top)/Math.max(1,r.height);
 for(let i=strokes.length-1;i>=0;i--){
  const o=strokes[i];
  if(!o||o.smartType!=='barModel'||o.smartBarType!=='partwhole'||!o.w||!o.h)continue;
  if(x>=o.x&&x<=o.x+o.w&&y>=o.y&&y<=o.y+o.h)return o;
 }
 return null;
}
function alignCompactBrackets(){
 const H=Math.max(1,(typeof cssH==='number'&&cssH)||canvas.getBoundingClientRect().height||1);
 for(const o of strokes){
  if(!o||o.smartType!=='barModel'||o.smartBarType!=='partwhole'||!o.h||!Array.isArray(o.userDrawnBrackets))continue;
  const displayedObjectH=Math.max(1,o.h*H),gap=BRACKET_GAP_PX/displayedObjectH;
  const topY=PART_Y/VB_H-gap,bottomY=(PART_Y+PART_H)/VB_H+gap;
  for(const b of o.userDrawnBrackets){
   if(!b||!b.__partWholeCompact)continue;
   b.y=b.position==='bottom'?bottomY:topY;
  }
 }
}
// Keep Part-Whole manual brackets at the same visual distance from the bar
// as Comparison brackets: 13 CSS pixels, independent of model size.
if(typeof redraw==='function'){
 const priorRedraw=redraw;
 redraw=function(){alignCompactBrackets();return priorRedraw.apply(this,arguments)};
}
// Registered before smart-math-bars-v2.js. Once the compact Part options
// feature is loaded, block the older colour-dot/label click panel so there is
// only one Part-Whole interaction pattern, matching Comparison.
canvas.addEventListener('click',e=>{
 if(!window.__smartPartWholeCompactOptions)return;
 if(!partWholeAt(e.clientX,e.clientY))return;
 e.preventDefault();
 e.stopImmediatePropagation();
},true);
})();
