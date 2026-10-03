(function(){
'use strict';
window.__compactWidgetReady=true;
const oldStrip=document.getElementById('strip');
const oldWrap=document.getElementById('wrap');
const quick=document.getElementById('quickbar');
if(!oldStrip||!oldWrap||!quick||typeof allTools==='undefined')return;

const TOOLBAR_STORE='classroomCompanionCompactToolbarV1',MAX_PINNED=5;
const uniqueTools=[...new Map(allTools.map(t=>[t.slug,t])).values()];
const panels=new Map();
let capturePanel=null;

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
#quickbar{position:fixed!important;left:6px!important;top:64px!important;width:min(520px,calc(100vw - 12px))!important;max-width:none!important;max-height:calc(100vh - 72px)!important;margin:0!important;padding:7px 8px!important;border-radius:13px!important;box-shadow:0 12px 34px rgba(18,32,46,.20)!important;z-index:2147483600!important;align-items:flex-start!important;background:#fff!important}
#quickbar .quick-title{font-size:11.5px!important;padding:7px 5px!important;max-width:100px!important;white-space:normal!important;line-height:1.15!important}
#quickbar .quick-scroll{display:flex!important;flex-wrap:wrap!important;align-items:flex-start!important;gap:5px!important;overflow-x:hidden!important;overflow-y:auto!important;max-width:none!important;max-height:520px!important;padding:2px!important}
#quickbar .quick-chip{height:auto!important;min-height:34px!important;padding:7px 9px!important;white-space:normal!important;line-height:1.15!important;text-align:left!important}
#quickbar .quick-value{white-space:normal!important;line-height:1.35!important;padding:8px!important;max-width:320px!important}
#quickbar .quick-close{flex:0 0 auto!important;margin:2px 0 0 auto!important}
#ccMiniRoot{position:fixed;left:6px;top:6px;z-index:2147483646;display:flex;align-items:center;gap:5px;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
#ccMiniLaunch{width:50px;height:50px;flex:0 0 50px;border:2px solid #0f766e;border-radius:15px;background:#0f766e;color:#fff;box-shadow:0 8px 22px rgba(15,118,110,.28);display:grid;place-items:center;cursor:pointer;padding:0;position:relative}
#ccMiniLaunch .spark{font-size:22px;line-height:1}
#ccMiniLaunch .dots{position:absolute;right:5px;bottom:4px;font-size:10px;letter-spacing:-1px;font-weight:1000;color:#dff6f1}
#ccMiniLaunch .count{position:absolute;left:-5px;top:-6px;min-width:18px;height:18px;padding:0 4px;border-radius:999px;background:#b42318;color:#fff;border:2px solid #fff;display:none;place-items:center;font-size:9px;font-weight:1000;line-height:1}
#ccMiniLaunch.has-active .count{display:grid}
#ccMiniLaunch.active{background:#fff;color:#0f766e}
#ccPinnedBar{display:none;align-items:center;gap:4px;padding:3px;border:1px solid #b8d8d3;background:rgba(255,255,255,.96);border-radius:13px;box-shadow:0 7px 18px rgba(18,32,46,.12);max-width:420px;overflow-x:auto;scrollbar-width:none}
#ccPinnedBar.show{display:flex}#ccPinnedBar::-webkit-scrollbar{display:none}
.ccPinnedTool{width:52px;height:44px;flex:0 0 52px;border:1px solid #d8e1e8;background:#fff;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:2px;cursor:pointer;color:#17202a}
.ccPinnedTool.running{background:#f0faf8;border-color:#58b9ac;box-shadow:inset 0 0 0 1px #58b9ac}
.ccPinnedTool:hover,.ccPinnedTool:focus-visible{background:#f0faf8;border-color:#83cfc4;outline:none}.ccPinnedIcon{font-size:18px;line-height:1}.ccPinnedLabel{width:46px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:7.5px;line-height:1;font-weight:900;text-align:center}
#ccPanelDock{position:fixed;left:6px;top:64px;right:6px;bottom:6px;z-index:2147483500;display:none;grid-template-columns:repeat(auto-fit,minmax(275px,1fr));gap:8px;align-content:start;overflow:auto;padding:2px;scrollbar-width:thin}
#ccPanelDock.show{display:grid}
.ccToolPanel{background:#fff;border:1px solid #cfdde3;border-radius:15px;box-shadow:0 10px 28px rgba(18,32,46,.15);overflow:hidden;min-height:150px;max-height:310px;display:flex;flex-direction:column}
.ccPanelHead{display:flex;align-items:center;gap:7px;padding:8px 9px;background:#f4fbf9;border-bottom:1px solid #dce9e6;flex:0 0 auto}.ccPanelIcon{font-size:19px}.ccPanelTitles{min-width:0;flex:1}.ccPanelName{font-size:12px;font-weight:1000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ccPanelStatus{font-size:8.5px;color:#0f766e;font-weight:850;margin-top:1px}.ccPanelBtn{width:29px;height:29px;border:1px solid #d8e1e8;border-radius:8px;background:#fff;font-weight:950;cursor:pointer}.ccPanelBody{padding:8px;display:flex;flex-wrap:wrap;gap:5px;align-content:flex-start;overflow:auto}.ccPanelChip{min-height:34px;border:1px solid #d8e1e8;border-radius:9px;background:#fff;padding:6px 9px;font-size:10.5px;font-weight:900;text-align:left;cursor:pointer}.ccPanelChip:hover{background:#f0faf8;border-color:#83cfc4}.ccPanelChip.primary{background:#0f766e;border-color:#0f766e;color:#fff}.ccPanelChip.active{background:#dff6f1;border-color:#85cfc4;color:#0b5b55}.ccPanelChip.stop{background:#fff1f0;border-color:#f0a7a2;color:#b42318}.ccPanelValue{width:100%;font-size:16px;line-height:1.35;font-weight:950;padding:10px;border-radius:10px;background:#f6f8fb;white-space:normal}.ccPanelHint{width:100%;font-size:8.5px;color:#667085;font-weight:700;margin-top:3px}
@media(max-width:700px){#quickbar{width:calc(100vw - 12px)!important}#quickbar .quick-scroll{max-height:calc(100vh - 100px)!important}#ccPinnedBar{max-width:calc(100vw - 72px)}#ccPanelDock{grid-template-columns:1fr}.ccToolPanel{max-height:260px}}
`;
document.head.appendChild(style);

const root=document.createElement('div');root.id='ccMiniRoot';
root.innerHTML=`<button id="ccMiniLaunch" type="button" aria-label="Open classroom tools" title="Classroom tools"><span class="spark">✦</span><span class="dots">•••</span><span class="count" id="ccActiveCount">0</span></button><div id="ccPinnedBar" aria-label="Pinned classroom tools"></div>`;
document.body.appendChild(root);
const dock=document.createElement('div');dock.id='ccPanelDock';document.body.appendChild(dock);
const launch=root.querySelector('#ccMiniLaunch'),activeCount=root.querySelector('#ccActiveCount'),pinnedBar=root.querySelector('#ccPinnedBar');
const mobile=matchMedia('(max-width:700px)').matches||matchMedia('(pointer:coarse)').matches;

function collapsedWidth(){return toolbarPrefs.visible&&toolbarPrefs.tools.length?Math.min(520,122+toolbarPrefs.tools.length*56):118}
function resizeCollapsed(){if(mobile)return;try{if(!document.fullscreenElement)window.resizeTo(collapsedWidth(),112)}catch(e){}}
function resizeWorkspace(){if(mobile)return;try{if(!document.fullscreenElement)window.resizeTo(760,700)}catch(e){}}
function isQuickOpen(){return quick.classList.contains('show')}
function isAllToolsOpen(){return isQuickOpen()&&document.getElementById('quickTitle')?.textContent==='All Tools'}
function updateWorkspace(){
  const n=panels.size;activeCount.textContent=String(n);launch.classList.toggle('has-active',n>0);dock.classList.toggle('show',n>0);renderPinnedToolbar(false);
  if(n||isQuickOpen())resizeWorkspace();else resizeCollapsed();
}
function statusFor(t){
  try{
    if(t.slug==='timer-calm-music')return `${format(timer.sec)} • ${timer.running?'Running':'Ready'}`;
    if(t.slug==='noise-level')return $('#noiseVal')?.textContent||'';
    if(t.slug==='question-spinner')return $('#questionVal')?.textContent||'';
    if(t.slug==='pick-a-pupil')return $('#pickVal')?.textContent||'';
    if(t.slug==='participation-counter')return `${participation} responses`;
    if(t.slug==='whole-class-goal')return `${goal}`;
  }catch(e){}
  return 'Active';
}
function makePanel(t){
  const el=document.createElement('section');el.className='ccToolPanel';el.dataset.slug=t.slug;
  el.innerHTML=`<div class="ccPanelHead"><span class="ccPanelIcon">${t.icon}</span><div class="ccPanelTitles"><div class="ccPanelName">${escapeHtml(t.title)}</div><div class="ccPanelStatus">Active</div></div><button class="ccPanelBtn ccOptions" type="button" title="Show options">•••</button><button class="ccPanelBtn ccClose" type="button" title="Close">×</button></div><div class="ccPanelBody"><div class="ccPanelValue">Loading…</div></div>`;
  el.querySelector('.ccOptions').onclick=()=>refreshPanel(t,el);
  el.querySelector('.ccClose').onclick=()=>{panels.delete(t.slug);el.remove();updateWorkspace()};
  dock.appendChild(el);panels.set(t.slug,{el,tool:t});return el;
}
function renderPanel(el,t,title,items,{withStop=true}={}){
  if(!el||!el.isConnected)return;
  const body=el.querySelector('.ccPanelBody');body.innerHTML='';
  const list=[...items];if(withStop)list.push({label:'■ Stop',stop:true,action:universalStop});
  for(const item of list){
    if(item.type==='value'){
      const v=document.createElement('div');v.className='ccPanelValue';v.textContent=item.label;body.appendChild(v);continue;
    }
    const b=document.createElement('button');b.type='button';b.className='ccPanelChip'+(item.active?' active':'')+(item.primary?' primary':'')+(item.stop?' stop':'');b.textContent=item.label;
    b.onclick=async()=>{
      const prev=capturePanel;capturePanel={el,tool:t};
      try{await item.action?.(b)}catch(e){try{toast('Tool action could not run')}catch(_){}}
      finally{capturePanel=prev;setTimeout(()=>{const s=el.querySelector('.ccPanelStatus');if(s)s.textContent=statusFor(t)},80)}
    };
    body.appendChild(b);
  }
  const hint=document.createElement('div');hint.className='ccPanelHint';hint.textContent=title+' • Press ✦ to open another tool.';body.appendChild(hint);
  const status=el.querySelector('.ccPanelStatus');if(status)status.textContent=statusFor(t);
}

const baseShowQuick=window.showQuick;
window.showQuick=function(title,items,opts={}){
  if(capturePanel?.el?.isConnected){renderPanel(capturePanel.el,capturePanel.tool,title,items,opts);return}
  return baseShowQuick(title,items,opts);
};

function invokeOptions(t){
  switch(t.slug){
    case'timer-calm-music':timerOptions();break;
    case'noise-level':showQuick('Noise level',noiseLevels.map(x=>({label:x,active:$('#noiseVal').textContent===x,action:()=>{chooseNoise(x);showValue('Noise level',x)}})));break;
    case'question-spinner':showQuick('Question',questionPrompts.map(x=>({label:x,action:()=>{$('#questionVal').textContent=x;showValue('Question',x)}})));break;
    case'pick-a-pupil':showQuick('Pick pupil',[{label:'Pick now',primary:true,action:()=>{pickPupil();showValue('Pick pupil',$('#pickVal').textContent)}},{label:'New round',action:()=>{resetPicker();showValue('Pick pupil','New round ready')}},{label:'Manage class',action:()=>openConfig('class')}]);break;
    case'rewards':showQuick('Reward',[...['Focus','Effort','Kindness','Teamwork','Ready','Helpful','Perseverance','Responsible','Improved'].map(x=>({label:x,action:()=>{addPoint(x);showValue('Reward',`${x} • ${$('#pointVal')?.textContent||''}`)}})),{label:'Reset points',action:()=>{data.classPoints[classKey()]=0;saveData();renderPoints();showValue('Reward','Points reset')}}]);break;
    default:toolOptions(t);
  }
}
function refreshPanel(t,el){
  if(!el?.isConnected)return;
  const prev=capturePanel;capturePanel={el,tool:t};
  try{invokeOptions(t)}catch(e){try{instantTool(t)}catch(_){renderPanel(el,t,t.title,[{type:'value',label:'This tool could not open.'}],{withStop:false})}}
  finally{capturePanel=prev}
}
function openToolPanel(t){
  let rec=panels.get(t.slug);
  if(rec?.el?.isConnected){rec.el.scrollIntoView({block:'nearest',behavior:'smooth'});refreshPanel(t,rec.el);closeQuick();updateWorkspace();return}
  const el=makePanel(t);refreshPanel(t,el);closeQuick();launch.classList.remove('active');updateWorkspace();
}

function renderPinnedToolbar(resize=true){
  pinnedBar.innerHTML='';
  for(const slug of toolbarPrefs.tools){
    const t=uniqueTools.find(x=>x.slug===slug);if(!t)continue;
    const b=document.createElement('button');b.type='button';b.className='ccPinnedTool'+(panels.has(slug)?' running':'');b.title=t.title;b.setAttribute('aria-label',t.title);
    b.innerHTML=`<span class="ccPinnedIcon">${t.icon}</span><span class="ccPinnedLabel">${escapeHtml(t.title)}</span>`;
    b.onclick=()=>openToolPanel(t);pinnedBar.appendChild(b);
  }
  pinnedBar.classList.toggle('show',toolbarPrefs.visible&&toolbarPrefs.tools.length>0);
  if(resize)setTimeout(()=>{if(panels.size||isQuickOpen())resizeWorkspace();else resizeCollapsed()},40);
}
function showToolbarSetup(){
  const selected=new Set(toolbarPrefs.tools),items=[];
  if(selected.size)items.push({label:toolbarPrefs.visible?'👁 Hide toolbar':'👁 Show toolbar',primary:!toolbarPrefs.visible,action:()=>{toolbarPrefs.visible=!toolbarPrefs.visible;saveToolbarPrefs();renderPinnedToolbar();showToolbarSetup()}});
  for(const t of uniqueTools){
    const on=selected.has(t.slug);
    items.push({label:`${on?'✓':'＋'} ${t.icon} ${t.title}`,active:on,action:()=>{
      if(on)toolbarPrefs.tools=toolbarPrefs.tools.filter(x=>x!==t.slug);
      else{if(toolbarPrefs.tools.length>=MAX_PINNED){toast(`Pin up to ${MAX_PINNED} tools`);return}toolbarPrefs.tools.push(t.slug);toolbarPrefs.visible=true}
      saveToolbarPrefs();renderPinnedToolbar();showToolbarSetup();
    }});
  }
  if(selected.size)items.push({label:'Clear toolbar',action:()=>{toolbarPrefs={visible:true,tools:[]};saveToolbarPrefs();renderPinnedToolbar();showToolbarSetup()}});
  showQuick(`Toolbar • ${toolbarPrefs.tools.length}/${MAX_PINNED}`,items,{withStop:false});launch.classList.add('active');resizeWorkspace();
}
function showActiveTools(){
  const items=[];
  for(const {el,tool} of panels.values())items.push({label:`↘ ${tool.icon} ${tool.title}`,action:()=>{closeQuick();el.scrollIntoView({block:'nearest',behavior:'smooth'})}});
  if(items.length)items.push({label:'× Close all tool panels',stop:true,action:()=>{for(const {el} of panels.values())el.remove();panels.clear();updateWorkspace();showAllTools()}});
  else items.push({type:'value',label:'No tool panels are open.'});
  showQuick(`Active Tools • ${panels.size}`,items,{withStop:false});launch.classList.add('active');resizeWorkspace();
}
function showAllTools(){
  const items=[];
  if(panels.size)items.push({label:`🟢 Active tools (${panels.size})`,primary:true,action:showActiveTools});
  items.push({label:'📌 Toolbar setup',primary:toolbarPrefs.tools.length>0,action:showToolbarSetup});
  items.push(...uniqueTools.map(t=>({label:`${panels.has(t.slug)?'● ':''}${t.icon} ${t.title}`,active:panels.has(t.slug),action:()=>openToolPanel(t)})));
  showQuick('All Tools',items,{withStop:false});launch.classList.add('active');resizeWorkspace();
}

launch.onclick=()=>{
  if(isAllToolsOpen()){closeQuick();launch.classList.remove('active');updateWorkspace();return}
  showAllTools();
};

const observer=new MutationObserver(()=>{
  if(isQuickOpen()){launch.classList.add('active');resizeWorkspace()}
  else{launch.classList.remove('active');setTimeout(updateWorkspace,80)}
});
observer.observe(quick,{attributes:true,attributeFilter:['class']});

document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement)setTimeout(updateWorkspace,120)});
window.addEventListener('message',()=>setTimeout(updateWorkspace,80));
window.addEventListener('storage',e=>{if(e.key===TOOLBAR_STORE){toolbarPrefs=loadToolbarPrefs();renderPinnedToolbar()}});
renderPinnedToolbar();updateWorkspace();
})();