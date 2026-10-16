(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined')return;
function partWholeAt(clientX,clientY){
 const r=canvas.getBoundingClientRect(),x=(clientX-r.left)/Math.max(1,r.width),y=(clientY-r.top)/Math.max(1,r.height);
 for(let i=strokes.length-1;i>=0;i--){
  const o=strokes[i];
  if(!o||o.smartType!=='barModel'||o.smartBarType!=='partwhole'||!o.w||!o.h)continue;
  if(x>=o.x&&x<=o.x+o.w&&y>=o.y&&y<=o.y+o.h)return o;
 }
 return null;
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
