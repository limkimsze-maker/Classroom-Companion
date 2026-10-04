(function(){
'use strict';
if(window.__classroomDesktopPaletteV2)return;
window.__classroomDesktopPaletteV2=true;
const ua=navigator.userAgent||'';
const isMobileDevice=/Android|iPhone|iPad|iPod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
if(isMobileDevice)return;
const SHORT={
 'timer-calm-music':'Timer',
 'transition-countdown':'Transition',
 'attention-signal':'Attention',
 'noise-level':'Noise',
 'question-spinner':'Starters',
 'confidence-check':'Confidence',
 'pick-a-pupil':'Pick Pupil',
 'make-groups':'Groups',
 'brain-break':'Brain Break',
 'reflect':'Reflect',
 'quote-of-the-day':'Quote',
 'class-organisation':'Class Org',
 'daily-duty-roster':'Duty Roster',
 'pupil-reward-points':'Pupil Points',
 'group-reward-points':'Group Points',
 'daily-visual-timetable':'Timetable'
};
function init(){
 const bar=document.getElementById('ccSmartBar'),rail=document.getElementById('ccRail'),brand=document.getElementById('ccBrand'),collapse=document.getElementById('ccCollapse');
 if(!bar||!rail||!brand||!collapse){setTimeout(init,60);return}
 const old=document.getElementById('ccVerticalLeftStyle');if(old)old.remove();
 const style=document.createElement('style');style.id='ccDesktopPaletteStyle';style.textContent=`
 html,body{margin:0!important;padding:0!important;overflow:hidden!important;background:transparent!important;width:100%!important;height:100%!important}
 #ccSmartBar{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;display:grid!important;grid-template-columns:50px 1fr 36px!important;grid-template-rows:52px 1fr!important;align-items:center!important;gap:7px!important;padding:9px!important;background:rgba(255,255,255,.98)!important;border:1px solid #cfe0de!important;border-radius:16px!important;overflow:hidden!important}
 #ccSmartBar .ccHoverLabel,#ccSmartBar .ccLegend{display:none!important}
 #ccSmartBar .ccBrand{grid-column:1!important;grid-row:1!important;width:46px!important;height:46px!important;flex:none!important}
 #ccPaletteTitle{grid-column:2!important;grid-row:1!important;min-width:0;color:#17324d;font:1000 14px/1.05 Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;letter-spacing:-.01em}
 #ccPaletteTitle span{display:block;margin-top:3px;color:#667085;font-size:9px;font-weight:800;letter-spacing:0}
 #ccSmartBar .ccCollapse{grid-column:3!important;grid-row:1!important;width:34px!important;height:42px!important;flex:none!important;font-size:0!important;border-radius:11px!important}
 #ccSmartBar .ccCollapse::before{content:'‹';font-size:18px;font-weight:1000}
 #ccSmartBar .ccRail{grid-column:1/4!important;grid-row:2!important;width:100%!important;min-width:0!important;max-width:none!important;height:100%!important;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;grid-template-rows:repeat(8,minmax(52px,1fr))!important;gap:6px!important;padding:0!important;overflow:hidden!important;align-items:stretch!important}
 #ccSmartBar .ccTool{width:100%!important;height:100%!important;min-height:52px!important;max-height:64px!important;flex:none!important;display:grid!important;grid-template-columns:30px 1fr!important;align-items:center!important;justify-items:start!important;gap:6px!important;padding:7px 8px!important;overflow:hidden!important;transform:none!important;border-radius:12px!important;background:linear-gradient(145deg,#fff,#f7faf9)!important;box-shadow:0 2px 8px rgba(18,32,46,.05)!important;transition:border-color .12s ease,background .12s ease,box-shadow .12s ease!important}
 #ccSmartBar .ccTool:hover,#ccSmartBar .ccTool:focus-visible{width:100%!important;transform:none!important;justify-content:initial!important;gap:6px!important;border-color:#79c8bc!important;background:#eef9f7!important;box-shadow:0 5px 14px rgba(15,118,110,.10)!important;outline:none!important}
 #ccSmartBar .ccTool .ccToolIcon{grid-column:1!important;display:flex!important;align-items:center!important;justify-content:center!important;width:28px!important;flex:none!important;font-size:21px!important;line-height:1!important}
 #ccSmartBar .ccTool .ccToolName{grid-column:2!important;display:block!important;max-width:none!important;width:100%!important;opacity:1!important;margin:0!important;overflow:hidden!important;white-space:normal!important;text-overflow:ellipsis!important;text-align:left!important;color:#17324d!important;font:900 10.5px/1.08 Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important}
 #ccSmartBar .ccTool::after{left:8px!important;right:8px!important;bottom:2px!important;width:auto!important;height:3px!important;transform:none!important;opacity:.75!important}
 #ccSmartBar.collapsed{display:grid!important;grid-template-columns:1fr!important;grid-template-rows:1fr!important;padding:8px!important}
 #ccSmartBar.collapsed .ccBrand{display:grid!important;grid-column:1!important;grid-row:1!important;width:50px!important;height:50px!important;place-self:start!important}
 #ccSmartBar.collapsed #ccPaletteTitle,#ccSmartBar.collapsed .ccRail,#ccSmartBar.collapsed .ccCollapse{display:none!important}
 `;document.head.appendChild(style);
 let title=document.getElementById('ccPaletteTitle');if(!title){title=document.createElement('div');title.id='ccPaletteTitle';title.innerHTML='Classroom Companion<span>Teacher tools</span>';bar.insertBefore(title,rail)}
 rail.querySelectorAll('.ccTool').forEach(b=>{const n=b.querySelector('.ccToolName');if(n)n.textContent=SHORT[b.dataset.slug]||n.textContent});
 const screenBox=()=>({left:Number.isFinite(screen.availLeft)?screen.availLeft:0,top:Number.isFinite(screen.availTop)?screen.availTop:0,w:screen.availWidth||1280,h:screen.availHeight||800});
 function fit(){
   const s=screenBox(),collapsed=bar.classList.contains('collapsed');
   const decoW=Math.max(0,window.outerWidth-window.innerWidth),decoH=Math.max(0,window.outerHeight-window.innerHeight);
   const innerW=collapsed?76:286,innerH=collapsed?76:Math.min(620,Math.max(500,s.h-decoH-24));
   const outW=Math.max(280,innerW+decoW+2),outH=Math.max(150,innerH+decoH+2);
   try{window.resizeTo(outW,outH);window.moveTo(s.left+8,s.top+8)}catch(e){}
 }
 const mo=new MutationObserver(()=>setTimeout(fit,40));mo.observe(bar,{attributes:true,attributeFilter:['class']});
 [80,260,700,1300].forEach(ms=>setTimeout(fit,ms));
}
init();
})();
