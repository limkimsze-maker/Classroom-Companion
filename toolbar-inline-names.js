(function(){
'use strict';
if(window.__classroomToolbarInlineNamesV1)return;
window.__classroomToolbarInlineNamesV1=true;
function init(){
  const bar=document.getElementById('ccSmartBar');
  if(!bar){setTimeout(init,60);return}
  if(document.getElementById('ccInlineNameStyle'))return;
  const style=document.createElement('style');
  style.id='ccInlineNameStyle';
  style.textContent=`
  #ccSmartBar{padding-top:9px!important;align-items:center!important}
  #ccSmartBar .ccHoverLabel{display:none!important}
  #ccSmartBar .ccLegend{display:none!important}
  #ccSmartBar .ccRail{overflow-x:auto!important;overflow-y:visible!important}
  #ccSmartBar .ccTool{display:flex!important;align-items:center!important;justify-content:center!important;gap:0!important;overflow:hidden!important;padding:0 9px!important;transition:width .14s ease,flex-basis .14s ease,transform .14s ease,border-color .14s ease,box-shadow .14s ease!important}
  #ccSmartBar .ccTool .ccToolIcon{display:inline-flex;align-items:center;justify-content:center;flex:0 0 24px;font-size:21px;line-height:1}
  #ccSmartBar .ccTool .ccToolName{display:block;max-width:0;opacity:0;overflow:hidden;white-space:nowrap;font:900 12px/1.1 Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#17324d;transition:max-width .14s ease,opacity .1s ease,margin .14s ease}
  #ccSmartBar .ccTool:hover,#ccSmartBar .ccTool:focus-visible{width:190px!important;flex-basis:190px!important;justify-content:flex-start!important;gap:8px!important;transform:translateY(-1px)!important;z-index:20!important}
  #ccSmartBar .ccTool:hover .ccToolName,#ccSmartBar .ccTool:focus-visible .ccToolName{max-width:145px;opacity:1;margin-left:1px}
  #ccSmartBar .ccTool::after{left:21px!important;transform:none!important}
  @media(max-width:700px),(pointer:coarse){#ccSmartBar .ccTool:hover,#ccSmartBar .ccTool:focus-visible{width:42px!important;flex-basis:42px!important;justify-content:center!important;gap:0!important}#ccSmartBar .ccTool .ccToolName{display:none!important}}
  `;
  document.head.appendChild(style);
  bar.querySelectorAll('.ccTool').forEach(b=>{
    const detail=(b.getAttribute('aria-label')||'').trim();
    const name=(detail.split(' • ')[0]||detail).trim();
    const icon=b.textContent.trim();
    b.innerHTML='';
    const i=document.createElement('span');i.className='ccToolIcon';i.textContent=icon;
    const n=document.createElement('span');n.className='ccToolName';n.textContent=name;
    b.append(i,n);
  });
}
init();
})();
