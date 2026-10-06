(function(){
'use strict';
if(window.__ccToolbarStabilityV2)return;
window.__ccToolbarStabilityV2=true;

const ua=navigator.userAgent||'';
const mobile=/Android|iPhone|iPad|iPod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)||matchMedia('(max-width:700px)').matches||matchMedia('(pointer:coarse)').matches;
if(mobile)return;

const originalResize=window.resizeTo&&window.resizeTo.bind(window);
const originalMove=window.moveTo&&window.moveTo.bind(window);
const started=performance.now();
const HOLD_MS=1400;

const s=window.screen||{};
const sw=s.availWidth||s.width||1280;
const sh=s.availHeight||s.height||800;
const left=(Number.isFinite(s.availLeft)?s.availLeft:0)+8;
const top=(Number.isFinite(s.availTop)?s.availTop:0)+8;
const width=330;
const height=Math.min(720,Math.max(600,sh-40));

// A named popup can reopen using the geometry from its last state (for
// example after it had been collapsed). Correct that once before any layout
// script runs, then freeze the rectangle during startup.
try{if(originalResize)originalResize(width,height)}catch(e){}
try{if(originalMove)originalMove(left,top)}catch(e){}

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

setTimeout(()=>{
  try{if(originalResize)window.resizeTo=originalResize}catch(e){}
  try{if(originalMove)window.moveTo=originalMove}catch(e){}
  document.documentElement.classList.add('ccToolbarGeometryUnlocked');
},HOLD_MS+30);
})();
