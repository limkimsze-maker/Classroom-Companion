(function(){
'use strict';
if(window.__classroomToolbarTooltipsV1)return;
window.__classroomToolbarTooltipsV1=true;
function init(){
  const bar=document.getElementById('ccSmartBar');
  if(!bar){setTimeout(init,60);return}
  if(document.getElementById('ccToolbarTooltipStyle'))return;
  const style=document.createElement('style');
  style.id='ccToolbarTooltipStyle';
  style.textContent=`
  #ccSmartBar .ccTool{overflow:visible!important}
  #ccSmartBar .ccTool::before{content:attr(data-tip);position:absolute;left:50%;bottom:calc(100% + 10px);transform:translateX(-50%) translateY(4px);background:#17324d;color:#fff;padding:7px 10px;border-radius:9px;font:850 12px/1.15 Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;white-space:nowrap;box-shadow:0 8px 20px rgba(18,32,46,.22);opacity:0;pointer-events:none;transition:opacity .1s ease,transform .1s ease;z-index:2147483647}
  #ccSmartBar .ccTool:hover::before,#ccSmartBar .ccTool:focus-visible::before{opacity:1;transform:translateX(-50%) translateY(0)}
  #ccSmartBar .ccTool:first-of-type::before{left:0;transform:translateX(0) translateY(4px)}
  #ccSmartBar .ccTool:first-of-type:hover::before,#ccSmartBar .ccTool:first-of-type:focus-visible::before{transform:translateX(0) translateY(0)}
  @media(pointer:coarse){#ccSmartBar .ccTool::before{display:none!important}}
  `;
  document.head.appendChild(style);
  bar.querySelectorAll('.ccTool').forEach(b=>{
    const title=(b.getAttribute('title')||'').split(' • ')[0].trim();
    b.dataset.tip=title||b.getAttribute('aria-label')||'';
  });
}
init();
})();
