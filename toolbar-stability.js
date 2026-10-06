(function(){
'use strict';
if(window.__ccToolbarStabilityV1)return;
window.__ccToolbarStabilityV1=true;

const originalResize=window.resizeTo&&window.resizeTo.bind(window);
const originalMove=window.moveTo&&window.moveTo.bind(window);
const started=performance.now();
const HOLD_MS=1700;

function holding(){return performance.now()-started<HOLD_MS;}

if(originalResize){
  try{
    window.resizeTo=function(w,h){
      if(holding())return;
      return originalResize(w,h);
    };
  }catch(e){}
}
if(originalMove){
  try{
    window.moveTo=function(x,y){
      if(holding())return;
      return originalMove(x,y);
    };
  }catch(e){}
}

// Keep the popup geometry chosen by the bookmark completely still while
// the temporary toolbar layers initialise. User-triggered resizing remains
// available after the short startup hold (for example Collapse / Restore).
setTimeout(()=>{
  try{if(originalResize)window.resizeTo=originalResize}catch(e){}
  try{if(originalMove)window.moveTo=originalMove}catch(e){}
  document.documentElement.classList.add('ccToolbarGeometryUnlocked');
},HOLD_MS+30);
})();
