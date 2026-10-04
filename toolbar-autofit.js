(function(){
'use strict';
if(window.__classroomToolbarAutofitV1)return;
window.__classroomToolbarAutofitV1=true;
const coarse=matchMedia('(pointer:coarse)').matches||matchMedia('(max-width:700px)').matches;
function init(){
  const bar=document.getElementById('ccSmartBar');
  if(!bar){setTimeout(init,60);return}
  if(coarse)return;
  const style=document.createElement('style');
  style.id='ccToolbarAutofitStyle';
  style.textContent=`
  html,body{margin:0!important;padding:0!important;width:max-content!important;height:max-content!important;min-width:0!important;min-height:0!important;overflow:hidden!important;background:transparent!important}
  #ccSmartBar{position:absolute!important;inset:auto!important;left:0!important;top:0!important;width:max-content!important;min-width:0!important;height:auto!important;min-height:0!important;box-sizing:border-box!important}
  #ccSmartBar .ccRail{flex:0 0 auto!important;width:auto!important;max-width:none!important;overflow-x:hidden!important;overflow-y:hidden!important}
  #ccSmartBar.collapsed{width:58px!important;height:58px!important}
  `;
  document.head.appendChild(style);

  function fit(){
    if(!bar||bar.offsetParent===null)return;
    const collapsed=bar.classList.contains('collapsed');
    const rect=bar.getBoundingClientRect();
    const innerW=Math.ceil(collapsed?58:Math.max(rect.width,bar.scrollWidth));
    const innerH=Math.ceil(collapsed?58:Math.max(rect.height,bar.scrollHeight));
    const decoW=Math.max(0,window.outerWidth-window.innerWidth);
    const decoH=Math.max(0,window.outerHeight-window.innerHeight);
    const targetW=Math.max(120,innerW+decoW+2);
    const targetH=Math.max(90,innerH+decoH+2);
    try{
      window.resizeTo(targetW,targetH);
      const left=(Number.isFinite(screen.availLeft)?screen.availLeft:0)+8;
      const top=(Number.isFinite(screen.availTop)?screen.availTop:0)+(screen.availHeight||800)-targetH-8;
      window.moveTo(left,Math.max((Number.isFinite(screen.availTop)?screen.availTop:0)+8,top));
    }catch(e){}
  }

  const mo=new MutationObserver(()=>setTimeout(fit,40));
  mo.observe(bar,{attributes:true,attributeFilter:['class']});
  [60,220,650,1100,1800].forEach(ms=>setTimeout(fit,ms));
  window.addEventListener('load',()=>setTimeout(fit,80));
  window.addEventListener('resize',()=>{clearTimeout(window.__ccAutoFitResize);window.__ccAutoFitResize=setTimeout(fit,120)});
}
init();
})();
