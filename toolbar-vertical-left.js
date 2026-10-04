(function(){
'use strict';
if(window.__classroomToolbarVerticalLeftV1)return;
window.__classroomToolbarVerticalLeftV1=true;
const coarse=matchMedia('(pointer:coarse)').matches||matchMedia('(max-width:700px)').matches;
if(coarse)return;
function init(){
  const bar=document.getElementById('ccSmartBar'),rail=document.getElementById('ccRail'),collapse=document.getElementById('ccCollapse');
  if(!bar||!rail||!collapse){setTimeout(init,60);return}
  const style=document.createElement('style');style.id='ccVerticalLeftStyle';style.textContent=`
  html,body{margin:0!important;padding:0!important;overflow:hidden!important;background:transparent!important}
  #ccSmartBar{position:absolute!important;left:0!important;top:0!important;right:auto!important;bottom:auto!important;width:66px!important;height:100vh!important;display:flex!important;flex-direction:column!important;align-items:center!important;gap:6px!important;padding:7px!important;border-radius:0 18px 18px 0!important;overflow:hidden!important}
  #ccSmartBar.nameOpen{width:218px!important;align-items:flex-start!important}
  #ccSmartBar .ccHoverLabel,#ccSmartBar .ccLegend{display:none!important}
  #ccSmartBar .ccBrand{width:50px!important;height:50px!important;flex:0 0 50px!important}
  #ccSmartBar .ccRail{width:52px!important;max-width:none!important;min-width:52px!important;flex:1 1 auto!important;display:flex!important;flex-direction:column!important;align-items:center!important;gap:5px!important;overflow-x:hidden!important;overflow-y:auto!important;padding:1px!important;scrollbar-width:none!important}
  #ccSmartBar.nameOpen .ccRail{width:202px!important;align-items:flex-start!important}
  #ccSmartBar .ccRail::-webkit-scrollbar{display:none!important}
  #ccSmartBar .ccTool{width:48px!important;height:48px!important;min-height:48px!important;flex:0 0 48px!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:0!important;padding:0 10px!important;overflow:hidden!important;transform:none!important;transition:width .12s ease,box-shadow .12s ease,border-color .12s ease!important}
  #ccSmartBar .ccTool .ccToolIcon{flex:0 0 24px!important;font-size:21px!important}
  #ccSmartBar .ccTool .ccToolName{display:block!important;max-width:0!important;opacity:0!important;margin:0!important;white-space:nowrap!important;overflow:hidden!important;font:900 12px/1.1 Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;color:#17324d!important}
  #ccSmartBar.nameOpen .ccTool:hover,#ccSmartBar.nameOpen .ccTool:focus-visible{width:198px!important;justify-content:flex-start!important;gap:9px!important;padding:0 11px!important}
  #ccSmartBar.nameOpen .ccTool:hover .ccToolName,#ccSmartBar.nameOpen .ccTool:focus-visible .ccToolName{max-width:152px!important;opacity:1!important}
  #ccSmartBar .ccTool::after{left:50%!important;bottom:3px!important;transform:translateX(-50%)!important}
  #ccSmartBar.nameOpen .ccTool:hover::after,#ccSmartBar.nameOpen .ccTool:focus-visible::after{left:23px!important;transform:none!important}
  #ccSmartBar .ccCollapse{width:50px!important;height:38px!important;flex:0 0 38px!important;border-radius:11px!important;font-size:0!important}
  #ccSmartBar .ccCollapse::before{content:'‹';font-size:18px;font-weight:1000}
  #ccSmartBar.collapsed{width:58px!important;height:58px!important;padding:4px!important;border-radius:0 17px 17px 0!important;display:block!important}
  #ccSmartBar.collapsed .ccBrand{width:50px!important;height:50px!important}
  `;document.head.appendChild(style);

  let shrinkTimer=null;
  const screenBox=()=>({left:Number.isFinite(screen.availLeft)?screen.availLeft:0,top:Number.isFinite(screen.availTop)?screen.availTop:0,w:screen.availWidth||1280,h:screen.availHeight||800});
  function deco(){return{w:Math.max(0,window.outerWidth-window.innerWidth),h:Math.max(0,window.outerHeight-window.innerHeight)}}
  function fit(expanded=false){
    const s=screenBox(),d=deco(),collapsed=bar.classList.contains('collapsed');
    const innerW=collapsed?58:(expanded?218:66);
    const innerH=collapsed?58:Math.max(280,s.h-d.h-16);
    const outerW=Math.max(120,innerW+d.w+2),outerH=Math.max(110,innerH+d.h+2);
    try{window.resizeTo(outerW,outerH);window.moveTo(s.left+8,s.top+8)}catch(e){}
  }
  function expand(){if(bar.classList.contains('collapsed'))return;clearTimeout(shrinkTimer);bar.classList.add('nameOpen');fit(true)}
  function shrink(){clearTimeout(shrinkTimer);shrinkTimer=setTimeout(()=>{bar.classList.remove('nameOpen');fit(false)},90)}
  rail.querySelectorAll('.ccTool').forEach(b=>{b.addEventListener('mouseenter',expand);b.addEventListener('mouseleave',shrink);b.addEventListener('focus',expand);b.addEventListener('blur',shrink)});
  rail.addEventListener('mouseenter',()=>clearTimeout(shrinkTimer));
  rail.addEventListener('mouseleave',shrink);
  const mo=new MutationObserver(()=>{bar.classList.remove('nameOpen');setTimeout(()=>fit(false),30)});mo.observe(bar,{attributes:true,attributeFilter:['class']});
  [80,250,700,1300].forEach(ms=>setTimeout(()=>fit(false),ms));
}
init();
})();
