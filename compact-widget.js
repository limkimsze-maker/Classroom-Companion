(function(){
'use strict';
window.__compactWidgetReady=true;
const oldStrip=document.getElementById('strip');
const oldWrap=document.getElementById('wrap');
const quick=document.getElementById('quickbar');
if(!oldStrip||!oldWrap||!quick||typeof allTools==='undefined')return;

const TOOLBAR_STORE='classroomCompanionCompactToolbarV1',MAX_PINNED=5;
const uniqueTools=[...new Map(allTools.map(t=>[t.slug,t])).values()];
function loadToolbarPrefs(){
  try{
    const p=JSON.parse(localStorage.getItem(TOOLBAR_STORE)||'{}');
    return {visible:p.visible!==false,tools:Array.isArray(p.tools)?p.tools.filter((s,i,a)=>a.indexOf(s)===i&&uniqueTools.some(t=>t.slug===s)).slice(0,MAX_PINNED):[]};
  }catch(e){return {visible:true,tools:[]}}
}
let toolbarPrefs=loadToolbarPrefs();
function saveToolbarPrefs(){localStorage.setItem(TOOLBAR_STORE,JSON.stringify(toolbarPrefs))}

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
#ccMiniRoot{position:fixed;left:6px;top:6px;z-index:2147483646;display:flex;align-items:center;gap:5px;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
#ccMiniLaunch{width:50px;height:50px;flex:0 0 50px;border:2px solid #0f766e;border-radius:15px;background:#0f766e;color:#fff;box-shadow:0 8px 22px rgba(15,118,110,.28);display:grid;place-items:center;cursor:pointer;padding:0;position:relative}
#ccMiniLaunch .spark{font-size:22px;line-height:1}
#ccMiniLaunch .dots{position:absolute;right:5px;bottom:4px;font-size:10px;letter-spacing:-1px;font-weight:1000;color:#dff6f1}
#ccMiniLaunch.active{background:#fff;color:#0f766e}
#ccPinnedBar{display:none;align-items:center;gap:4px;padding:3px;border:1px solid #b8d8d3;background:rgba(255,255,255,.96);border-radius:13px;box-shadow:0 7px 18px rgba(18,32,46,.12);max-width:340px;overflow-x:auto;scrollbar-width:none}
#ccPinnedBar.show{display:flex}#ccPinnedBar::-webkit-scrollbar{display:none}
.ccPinnedTool{width:52px;height:44px;flex:0 0 52px;border:1px solid #d8e1e8;background:#fff;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:2px;cursor:pointer;color:#17202a}
.ccPinnedTool:hover,.ccPinnedTool:focus-visible{background:#f0faf8;border-color:#83cfc4;outline:none}.ccPinnedIcon{font-size:18px;line-height:1}.ccPinnedLabel{width:46px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:7.5px;line-height:1;font-weight:900;text-align:center}
@media(max-width:700px){#quickbar{width:calc(100vw - 12px)!important}#quickbar .quick-scroll{max-height:calc(100vh - 100px)!important}#ccPinnedBar{max-width:calc(100vw - 72px)}}
`;
document.head.appendChild(style);

const root=document.createElement('div');root.id='ccMiniRoot';
root.innerHTML=`<button id="ccMiniLaunch" type="button" aria-label="Open classroom tools" title="Classroom tools"><span class="spark">✦</span><span class="dots">•••</span></button><div id="ccPinnedBar" aria-label="Pinned classroom tools"></div>`;
document.body.appendChild(root);
const launch=root.querySelector('#ccMiniLaunch'),pinnedBar=root.querySelector('#ccPinnedBar');
const mobile=matchMedia('(max-width:700px)').matches||matchMedia('(pointer:coarse)').matches;

function collapsedWidth(){return toolbarPrefs.visible&&toolbarPrefs.tools.length?Math.min(430,122+toolbarPrefs.tools.length*56):118}
function resizeCollapsed(){if(mobile)return;try{if(!document.fullscreenElement)window.resizeTo(collapsedWidth(),112)}catch(e){}}
function resizeExpanded(){if(mobile)return;try{if(!document.fullscreenElement)window.resizeTo(450,680)}catch(e){}}
function isQuickOpen(){return quick.classList.contains('show')}
function isAllToolsOpen(){return isQuickOpen()&&document.getElementById('quickTitle')?.textContent==='All Tools'}

function openToolOptions(t){
  launch.classList.add('active');resizeExpanded();
  try{toolOptions(t)}catch(e){try{instantTool(t)}catch(_){}}
}
function renderPinnedToolbar(){
  pinnedBar.innerHTML='';
  for(const slug of toolbarPrefs.tools){
    const t=uniqueTools.find(x=>x.slug===slug);if(!t)continue;
    const b=document.createElement('button');b.type='button';b.className='ccPinnedTool';b.title=t.title;b.setAttribute('aria-label',t.title);
    b.innerHTML=`<span class="ccPinnedIcon">${t.icon}</span><span class="ccPinnedLabel">${escapeHtml(t.title)}</span>`;
    b.onclick=()=>openToolOptions(t);pinnedBar.appendChild(b);
  }
  pinnedBar.classList.toggle('show',toolbarPrefs.visible&&toolbarPrefs.tools.length>0);
  setTimeout(resizeCollapsed,40);
}
function showToolbarSetup(){
  const selected=new Set(toolbarPrefs.tools);
  const items=[];
  if(selected.size){items.push({label:toolbarPrefs.visible?'👁 Hide toolbar':'👁 Show toolbar',primary:!toolbarPrefs.visible,action:()=>{toolbarPrefs.visible=!toolbarPrefs.visible;saveToolbarPrefs();renderPinnedToolbar();showToolbarSetup()}})}
  for(const t of uniqueTools){
    const on=selected.has(t.slug);
    items.push({label:`${on?'✓':'＋'} ${t.icon} ${t.title}`,active:on,action:()=>{
      if(on)toolbarPrefs.tools=toolbarPrefs.tools.filter(x=>x!==t.slug);
      else{
        if(toolbarPrefs.tools.length>=MAX_PINNED){toast(`Pin up to ${MAX_PINNED} tools`);return}
        toolbarPrefs.tools.push(t.slug);toolbarPrefs.visible=true;
      }
      saveToolbarPrefs();renderPinnedToolbar();showToolbarSetup();
    }});
  }
  if(selected.size)items.push({label:'Clear toolbar',action:()=>{toolbarPrefs={visible:true,tools:[]};saveToolbarPrefs();renderPinnedToolbar();showToolbarSetup()}});
  showQuick(`Toolbar • ${toolbarPrefs.tools.length}/${MAX_PINNED}`,items,{withStop:false});
  launch.classList.add('active');resizeExpanded();
}
function showAllTools(){
  const items=[{label:'📌 Toolbar setup',primary:toolbarPrefs.tools.length>0,action:showToolbarSetup},...uniqueTools.map(t=>({label:`${t.icon} ${t.title}`,action:()=>openToolOptions(t)}))];
  showQuick('All Tools',items,{withStop:false});
  launch.classList.add('active');resizeExpanded();
}

launch.onclick=()=>{
  if(isAllToolsOpen()){
    closeQuick();launch.classList.remove('active');resizeCollapsed();return;
  }
  showAllTools();
};

const observer=new MutationObserver(()=>{
  if(isQuickOpen()){launch.classList.add('active');resizeExpanded()}
  else{launch.classList.remove('active');setTimeout(resizeCollapsed,80)}
});
observer.observe(quick,{attributes:true,attributeFilter:['class']});

document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&!isQuickOpen())setTimeout(resizeCollapsed,120)});
window.addEventListener('message',()=>{if(!isQuickOpen())setTimeout(resizeCollapsed,120)});
window.addEventListener('storage',e=>{if(e.key===TOOLBAR_STORE){toolbarPrefs=loadToolbarPrefs();renderPinnedToolbar()}});
renderPinnedToolbar();
})();