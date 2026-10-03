(function(){
'use strict';
window.__compactWidgetReady=true;
const oldStrip=document.getElementById('strip');
const oldWrap=document.getElementById('wrap');
const quick=document.getElementById('quickbar');
if(!oldStrip||!oldWrap||!quick||typeof allTools==='undefined')return;

const style=document.createElement('style');
style.textContent=`
html,body{background:transparent!important;overflow:hidden!important}
#strip{display:none!important}
#wrap{padding:0!important;width:auto!important;max-width:none!important}
#quickbar{position:fixed!important;left:6px!important;top:64px!important;width:min(430px,calc(100vw - 12px))!important;max-width:none!important;max-height:calc(100vh - 72px)!important;margin:0!important;padding:7px 8px!important;border-radius:13px!important;box-shadow:0 12px 34px rgba(18,32,46,.20)!important;z-index:2147483600!important;align-items:flex-start!important;background:#fff!important}
#quickbar .quick-title{font-size:11.5px!important;padding:7px 5px!important;max-width:92px!important;white-space:normal!important;line-height:1.15!important}
#quickbar .quick-scroll{display:flex!important;flex-wrap:wrap!important;align-items:flex-start!important;gap:5px!important;overflow-x:hidden!important;overflow-y:auto!important;max-width:none!important;max-height:520px!important;padding:2px!important}
#quickbar .quick-chip{height:auto!important;min-height:34px!important;padding:7px 9px!important;white-space:normal!important;line-height:1.15!important;text-align:left!important}
#quickbar .quick-value{white-space:normal!important;line-height:1.35!important;padding:8px!important;max-width:285px!important}
#quickbar .quick-close{flex:0 0 auto!important;margin:2px 0 0 auto!important}
#ccMiniRoot{position:fixed;left:6px;top:6px;z-index:2147483646;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
#ccMiniLaunch{width:50px;height:50px;border:2px solid #0f766e;border-radius:15px;background:#0f766e;color:#fff;box-shadow:0 8px 22px rgba(15,118,110,.28);display:grid;place-items:center;cursor:pointer;padding:0;position:relative}
#ccMiniLaunch .spark{font-size:22px;line-height:1}
#ccMiniLaunch .dots{position:absolute;right:5px;bottom:4px;font-size:10px;letter-spacing:-1px;font-weight:1000;color:#dff6f1}
#ccMiniLaunch.active{background:#fff;color:#0f766e}
@media(max-width:700px){#quickbar{width:calc(100vw - 12px)!important}#quickbar .quick-scroll{max-height:calc(100vh - 100px)!important}}
`;
document.head.appendChild(style);

const root=document.createElement('div');root.id='ccMiniRoot';
root.innerHTML=`<button id="ccMiniLaunch" type="button" aria-label="Open classroom tools" title="Classroom tools"><span class="spark">✦</span><span class="dots">•••</span></button>`;
document.body.appendChild(root);
const launch=root.querySelector('#ccMiniLaunch');
const mobile=matchMedia('(max-width:700px)').matches||matchMedia('(pointer:coarse)').matches;

function resizeCollapsed(){if(mobile)return;try{if(!document.fullscreenElement)window.resizeTo(118,112)}catch(e){}}
function resizeExpanded(){if(mobile)return;try{if(!document.fullscreenElement)window.resizeTo(450,680)}catch(e){}}
function isQuickOpen(){return quick.classList.contains('show')}
function isAllToolsOpen(){return isQuickOpen()&&document.getElementById('quickTitle')?.textContent==='All Tools'}

function showAllTools(){
  const items=allTools.map(t=>({
    label:`${t.icon} ${t.title}`,
    action:()=>{
      launch.classList.add('active');
      resizeExpanded();
      try{toolOptions(t)}catch(e){try{instantTool(t)}catch(_){}}
    }
  }));
  showQuick('All Tools',items,{withStop:false});
  launch.classList.add('active');
  resizeExpanded();
}

launch.onclick=()=>{
  if(isAllToolsOpen()){
    closeQuick();
    launch.classList.remove('active');
    resizeCollapsed();
    return;
  }
  showAllTools();
};

// Keep the tiny launcher visible while any tool's existing dropdown is open.
const observer=new MutationObserver(()=>{
  if(isQuickOpen()){
    launch.classList.add('active');
    resizeExpanded();
  }else{
    launch.classList.remove('active');
    setTimeout(resizeCollapsed,80);
  }
});
observer.observe(quick,{attributes:true,attributeFilter:['class']});

document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&!isQuickOpen())setTimeout(resizeCollapsed,120)});
window.addEventListener('message',()=>{if(!isQuickOpen())setTimeout(resizeCollapsed,120)});
resizeCollapsed();
})();