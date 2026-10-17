(function(){
'use strict';
let bar,pageBox,dial,interact,pdf,lastPdf=false;
function activePdf(){return !!(pdf&&getComputedStyle(pdf).display!=='none')}
function find(){
 bar=document.getElementById('documentQuickBar');
 pageBox=bar?.querySelector('input[type=number]')||null;
 dial=document.getElementById('documentPageDial');
 pdf=document.getElementById('documentPdfCanvas');
 if(bar){
  const buttons=[...bar.querySelectorAll('button')];
  interact=buttons.find(b=>/interact with displayed content|return to annotation mode/i.test(b.title||''))||null;
 }
 return !!(bar&&pageBox);
}
function sync(){
 if(!find())return;
 const isPdf=activePdf();
 if(interact){
  interact.style.display=isPdf?'none':'';
  interact.setAttribute('aria-hidden',isPdf?'true':'false');
  interact.tabIndex=isPdf?-1:0;
 }
 if(dial){
  dial.dataset.zoomIndependent='true';
  dial.title='Drag to jump to any page at the current zoom level';
 }
 if(isPdf!==lastPdf)lastPdf=isPdf;
}
// The dial already changes page through the document page input. Do not touch zoom controls
// or reset the document zoom when the dial is used.
document.addEventListener('change',e=>{
 if(e.target===pageBox&&activePdf())requestAnimationFrame(sync);
},true);
setInterval(sync,300);
sync();
})();
