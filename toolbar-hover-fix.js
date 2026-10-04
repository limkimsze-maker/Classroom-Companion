(function(){
'use strict';
if(window.__classroomToolbarHoverFixV2)return;
window.__classroomToolbarHoverFixV2=true;
const coarse=matchMedia('(pointer:coarse)').matches||matchMedia('(max-width:700px)').matches;
function init(){
  const bar=document.getElementById('ccSmartBar');
  if(!bar){setTimeout(init,60);return}
  if(document.getElementById('ccHoverName'))return;
  const style=document.createElement('style');
  style.id='ccHoverFixStyle';
  style.textContent=`
  #ccSmartBar{inset:auto 0 0 0!important;height:72px!important;overflow:visible!important}
  #ccHoverName{position:fixed;bottom:80px;left:50%;transform:translateX(-50%) translateY(3px);max-width:320px;padding:7px 11px;border-radius:9px;background:#17324d;color:#fff;font:900 12px/1.1 Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-shadow:0 8px 20px rgba(18,32,46,.22);opacity:0;pointer-events:none;transition:opacity .08s ease,transform .08s ease;z-index:2147483647}
  #ccHoverName.show{opacity:1;transform:translateX(-50%) translateY(0)}
  #ccSmartBar.collapsed+#ccHoverName{display:none!important}
  `;
  document.head.appendChild(style);
  const label=document.createElement('div');label.id='ccHoverName';label.setAttribute('role','tooltip');document.body.appendChild(label);
  function showFor(b){if(coarse)return;const r=b.getBoundingClientRect(),vw=document.documentElement.clientWidth||window.innerWidth;label.textContent=b.dataset.toolName||'';let x=r.left+r.width/2;x=Math.max(70,Math.min(vw-70,x));label.style.left=x+'px';label.classList.add('show')}
  function hide(){label.classList.remove('show')}
  bar.querySelectorAll('.ccTool').forEach(b=>{
    const full=(b.getAttribute('title')||b.getAttribute('aria-label')||'').trim();
    b.dataset.toolName=(full.split(' • ')[0]||full).trim();
    b.addEventListener('mouseenter',()=>showFor(b));
    b.addEventListener('mouseleave',hide);
    b.addEventListener('focus',()=>showFor(b));
    b.addEventListener('blur',hide);
  });
  function geometry(){if(coarse)return;const s={left:Number.isFinite(screen.availLeft)?screen.availLeft:0,top:Number.isFinite(screen.availTop)?screen.availTop:0,w:screen.availWidth||1280,h:screen.availHeight||800};if(bar.classList.contains('collapsed'))return;const w=Math.min(960,Math.max(720,s.w-24)),h=122,x=s.left+Math.max(8,Math.round((s.w-w)/2)),y=s.top+s.h-h-8;try{window.resizeTo(w,h);window.moveTo(x,y)}catch(e){}}
  const mo=new MutationObserver(()=>{hide();setTimeout(geometry,30)});mo.observe(bar,{attributes:true,attributeFilter:['class']});
  [40,180,650,1400].forEach(ms=>setTimeout(geometry,ms));
  window.addEventListener('resize',()=>setTimeout(geometry,80));
}
init();
})();
