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
#quickbar{position:fixed!important;left:6px!important;top:64px!important;width:min(410px,calc(100vw - 12px))!important;max-width:none!important;max-height:calc(100vh - 72px)!important;margin:0!important;padding:9px!important;border-radius:14px!important;box-shadow:0 12px 34px rgba(18,32,46,.20)!important;z-index:2147483600!important;align-items:flex-start!important;background:#fff!important}
#quickbar .quick-title{font-size:12px!important;padding:7px 5px!important;max-width:92px!important;white-space:normal!important;line-height:1.15!important}
#quickbar .quick-scroll{display:flex!important;flex-wrap:wrap!important;align-items:flex-start!important;gap:6px!important;overflow-x:hidden!important;overflow-y:auto!important;max-width:none!important;max-height:500px!important;padding:2px!important}
#quickbar .quick-chip{height:auto!important;min-height:36px!important;padding:8px 10px!important;white-space:normal!important;line-height:1.15!important;text-align:left!important}
#quickbar .quick-value{white-space:normal!important;line-height:1.35!important;padding:8px!important;max-width:270px!important}
#quickbar .quick-close{flex:0 0 auto!important;margin:2px 0 0 auto!important}
#ccMiniRoot{position:fixed;left:6px;top:6px;z-index:2147483646;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
#ccMiniLaunch{width:50px;height:50px;border:2px solid #0f766e;border-radius:15px;background:#0f766e;color:#fff;box-shadow:0 8px 22px rgba(15,118,110,.28);display:grid;place-items:center;cursor:pointer;padding:0;position:relative}
#ccMiniLaunch .spark{font-size:22px;line-height:1}
#ccMiniLaunch .dots{position:absolute;right:5px;bottom:4px;font-size:10px;letter-spacing:-1px;font-weight:1000;color:#dff6f1}
#ccMiniLaunch.active{background:#fff;color:#0f766e}
#ccToolTray{position:fixed;left:6px;top:64px;width:min(410px,calc(100vw - 12px));height:min(590px,calc(100vh - 72px));background:#fff;border:1px solid #b8d8d3;border-radius:16px;box-shadow:0 14px 38px rgba(18,32,46,.22);display:none;flex-direction:column;overflow:hidden;z-index:2147483645}
#ccToolTray.show{display:flex}
.ccTrayHead{display:flex;align-items:center;gap:8px;padding:11px 12px 9px;border-bottom:1px solid #e4eaee;flex:0 0 auto}
.ccTrayTitle{font-size:14px;font-weight:1000;color:#0b5b55;flex:1}.ccTrayHint{font-size:10px;color:#667085;font-weight:750}.ccTrayClose{width:30px;height:30px;border:0;border-radius:9px;background:#eef2f5;font-weight:1000;cursor:pointer}
#ccToolGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;padding:10px;overflow-y:auto;overscroll-behavior:contain}
.ccToolCard{min-height:72px;border:1px solid #d8e1e8;border-radius:12px;background:#fff;padding:8px 6px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;text-align:center;cursor:pointer;color:#17202a}
.ccToolCard:active{transform:scale(.98)}.ccToolCard:hover{background:#f0faf8;border-color:#83cfc4}.ccToolIcon{font-size:23px;line-height:1}.ccToolName{font-size:10px;line-height:1.15;font-weight:900}
@media(max-width:700px){#ccToolTray{width:calc(100vw - 12px);height:calc(100vh - 72px)}#ccToolGrid{grid-template-columns:repeat(3,minmax(0,1fr))}#quickbar{width:calc(100vw - 12px)!important}#quickbar .quick-scroll{max-height:calc(100vh - 100px)!important}}
`;
document.head.appendChild(style);

const root=document.createElement('div');root.id='ccMiniRoot';
root.innerHTML=`<button id="ccMiniLaunch" type="button" aria-label="Open classroom tools" title="Classroom tools"><span class="spark">✦</span><span class="dots">•••</span></button>`;
document.body.appendChild(root);

const tray=document.createElement('div');tray.id='ccToolTray';
tray.innerHTML=`<div class="ccTrayHead"><div><div class="ccTrayTitle">Classroom Tools</div><div class="ccTrayHint">Choose a tool, then choose an option</div></div><button class="ccTrayClose" type="button" aria-label="Close tools">×</button></div><div id="ccToolGrid"></div>`;
document.body.appendChild(tray);
const grid=tray.querySelector('#ccToolGrid');
allTools.forEach(t=>{
  const b=document.createElement('button');b.type='button';b.className='ccToolCard';b.dataset.slug=t.slug;
  b.innerHTML=`<span class="ccToolIcon">${t.icon}</span><span class="ccToolName">${escapeHtml(t.title)}</span>`;
  b.onclick=()=>{
    tray.classList.remove('show');
    document.getElementById('ccMiniLaunch').classList.remove('active');
    try{toolOptions(t)}catch(e){try{instantTool(t)}catch(_){}}
    resizeExpanded();
  };
  grid.appendChild(b);
});

const launch=root.querySelector('#ccMiniLaunch');
const mobile=matchMedia('(max-width:700px)').matches||matchMedia('(pointer:coarse)').matches;
function resizeCollapsed(){if(mobile)return;try{if(!document.fullscreenElement)window.resizeTo(118,112)}catch(e){}}
function resizeExpanded(){if(mobile)return;try{if(!document.fullscreenElement)window.resizeTo(430,680)}catch(e){}}
function hideTray(){tray.classList.remove('show');launch.classList.remove('active');}
function showTray(){
  try{closeQuick()}catch(e){}
  tray.classList.add('show');launch.classList.add('active');resizeExpanded();
}
function collapseAll(){hideTray();try{closeQuick()}catch(e){}resizeCollapsed()}
launch.onclick=()=>{
  if(tray.classList.contains('show')){collapseAll();return}
  showTray();
};
tray.querySelector('.ccTrayClose').onclick=collapseAll;

// If an option menu closes itself after an action, return the window to its tiny launcher size.
const observer=new MutationObserver(()=>{
  if(tray.classList.contains('show'))return;
  if(!quick.classList.contains('show'))setTimeout(resizeCollapsed,80);
});
observer.observe(quick,{attributes:true,attributeFilter:['class']});

// Keep the tiny launcher available after returning from fullscreen tools.
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&!tray.classList.contains('show')&&!quick.classList.contains('show'))setTimeout(resizeCollapsed,120)});
window.addEventListener('message',()=>{if(!tray.classList.contains('show')&&!quick.classList.contains('show'))setTimeout(resizeCollapsed,120)});

resizeCollapsed();
})();