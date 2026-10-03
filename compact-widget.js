(function(){
'use strict';
window.__compactWidgetReady=true;
const oldStrip=document.getElementById('strip');
const oldWrap=document.getElementById('wrap');
const quick=document.getElementById('quickbar');
if(!oldStrip||!oldWrap||!quick||typeof allTools==='undefined')return;

const TOOLBAR_STORE='classroomCompanionCompactToolbarV1',MAX_PINNED=5;
const uniqueTools=[...new Map(allTools.map(t=>[t.slug,t])).values()];
const panelWins=new Map();
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
#ccMiniLaunch .count{position:absolute;left:-5px;top:-6px;min-width:18px;height:18px;padding:0 4px;border-radius:999px;background:#b42318;color:#fff;border:2px solid #fff;display:none;place-items:center;font-size:9px;font-weight:1000;line-height:1}
#ccMiniLaunch.has-active .count{display:grid}
#ccMiniLaunch.active{background:#fff;color:#0f766e}
#ccPinnedBar{display:none;align-items:center;gap:4px;padding:3px;border:1px solid #b8d8d3;background:rgba(255,255,255,.96);border-radius:13px;box-shadow:0 7px 18px rgba(18,32,46,.12);max-width:340px;overflow-x:auto;scrollbar-width:none}
#ccPinnedBar.show{display:flex}#ccPinnedBar::-webkit-scrollbar{display:none}
.ccPinnedTool{width:52px;height:44px;flex:0 0 52px;border:1px solid #d8e1e8;background:#fff;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:2px;cursor:pointer;color:#17202a}
.ccPinnedTool.running{background:#f0faf8;border-color:#58b9ac;box-shadow:inset 0 0 0 1px #58b9ac}
.ccPinnedTool:hover,.ccPinnedTool:focus-visible{background:#f0faf8;border-color:#83cfc4;outline:none}.ccPinnedIcon{font-size:18px;line-height:1}.ccPinnedLabel{width:46px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:7.5px;line-height:1;font-weight:900;text-align:center}
@media(max-width:700px){#quickbar{width:calc(100vw - 12px)!important}#quickbar .quick-scroll{max-height:calc(100vh - 100px)!important}#ccPinnedBar{max-width:calc(100vw - 72px)}}
`;
document.head.appendChild(style);

const root=document.createElement('div');root.id='ccMiniRoot';
root.innerHTML=`<button id="ccMiniLaunch" type="button" aria-label="Open classroom tools" title="Classroom tools"><span class="spark">✦</span><span class="dots">•••</span><span class="count" id="ccActiveCount">0</span></button><div id="ccPinnedBar" aria-label="Pinned classroom tools"></div>`;
document.body.appendChild(root);
const launch=root.querySelector('#ccMiniLaunch'),activeCount=root.querySelector('#ccActiveCount'),pinnedBar=root.querySelector('#ccPinnedBar');
const mobile=matchMedia('(max-width:700px)').matches||matchMedia('(pointer:coarse)').matches;

function collapsedWidth(){return toolbarPrefs.visible&&toolbarPrefs.tools.length?Math.min(430,122+toolbarPrefs.tools.length*56):118}
function resizeCollapsed(){if(mobile)return;try{if(!document.fullscreenElement)window.resizeTo(collapsedWidth(),112)}catch(e){}}
function resizeExpanded(){if(mobile)return;try{if(!document.fullscreenElement)window.resizeTo(450,680)}catch(e){}}
function isQuickOpen(){return quick.classList.contains('show')}
function isAllToolsOpen(){return isQuickOpen()&&document.getElementById('quickTitle')?.textContent==='All Tools'}

function cleanPanels(){
  for(const [slug,p] of [...panelWins])if(!p.win||p.win.closed)panelWins.delete(slug);
  const n=panelWins.size;activeCount.textContent=String(n);launch.classList.toggle('has-active',n>0);renderPinnedToolbar(false);
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
function panelShell(w,t){
  const safeTitle=escapeHtml(t.title),safeIcon=escapeHtml(t.icon);
  w.document.open();
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safeTitle}</title><style>*{box-sizing:border-box}html,body{margin:0;background:#f6f8fb;color:#17202a;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif}body{padding:8px}.panel{min-height:calc(100vh - 16px);background:#fff;border:1px solid #cfdde3;border-radius:16px;box-shadow:0 12px 32px rgba(18,32,46,.14);overflow:hidden}.head{display:flex;align-items:center;gap:8px;padding:9px 10px;background:#f4fbf9;border-bottom:1px solid #dce9e6}.ico{font-size:20px}.titles{min-width:0;flex:1}.name{font-size:13px;font-weight:1000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.status{font-size:9px;color:#0f766e;font-weight:850;margin-top:1px}.hbtn{width:30px;height:30px;border:1px solid #d8e1e8;border-radius:9px;background:#fff;font-weight:950;cursor:pointer}.body{padding:9px;display:flex;flex-wrap:wrap;gap:6px;align-content:flex-start}.chip{min-height:36px;border:1px solid #d8e1e8;border-radius:10px;background:#fff;padding:7px 10px;font-size:11px;font-weight:900;text-align:left;cursor:pointer}.chip:hover{background:#f0faf8;border-color:#83cfc4}.chip.primary{background:#0f766e;border-color:#0f766e;color:#fff}.chip.active{background:#dff6f1;border-color:#85cfc4;color:#0b5b55}.chip.stop{background:#fff1f0;border-color:#f0a7a2;color:#b42318}.value{width:100%;font-size:18px;line-height:1.35;font-weight:950;padding:12px;border-radius:12px;background:#f6f8fb;white-space:normal}.hint{width:100%;font-size:9px;color:#667085;font-weight:700;margin-top:4px}.empty{font-size:11px;color:#667085;padding:10px}</style></head><body><div class="panel"><div class="head"><div class="ico">${safeIcon}</div><div class="titles"><div class="name">${safeTitle}</div><div class="status" id="ccPanelStatus">Active</div></div><button class="hbtn" id="ccPanelOptions" title="Show options">•••</button><button class="hbtn" id="ccPanelClose" title="Close panel">×</button></div><div class="body" id="ccPanelBody"><div class="empty">Loading options…</div></div></div></body></html>`);
  w.document.close();
  w.document.getElementById('ccPanelOptions').onclick=()=>refreshPanel(t,w);
  w.document.getElementById('ccPanelClose').onclick=()=>w.close();
  try{w.addEventListener('beforeunload',()=>setTimeout(cleanPanels,80))}catch(e){}
}
function renderPanel(w,t,title,items,{withStop=true}={}){
  if(!w||w.closed)return;
  const body=w.document.getElementById('ccPanelBody');if(!body)return;
  body.innerHTML='';
  const list=[...items];
  if(withStop)list.push({label:'■ Stop',stop:true,action:universalStop});
  for(const item of list){
    if(item.type==='value'){
      const v=w.document.createElement('div');v.className='value';v.textContent=item.label;body.appendChild(v);continue;
    }
    const b=w.document.createElement('button');b.type='button';b.className='chip'+(item.active?' active':'')+(item.primary?' primary':'')+(item.stop?' stop':'');b.textContent=item.label;
    b.onclick=async()=>{
      const prev=capturePanel;capturePanel={win:w,tool:t};
      try{await item.action?.(b)}catch(e){try{toast('Tool action could not run')}catch(_){}}
      finally{capturePanel=prev;setTimeout(()=>{try{const s=w.document.getElementById('ccPanelStatus');if(s)s.textContent=statusFor(t)}catch(e){};if(!isQuickOpen())resizeCollapsed()},70)}
    };
    body.appendChild(b);
  }
  const hint=w.document.createElement('div');hint.className='hint';hint.textContent=title+' • Use ✦ to open another tool.';body.appendChild(hint);
  const status=w.document.getElementById('ccPanelStatus');if(status)status.textContent=statusFor(t);
}

const baseShowQuick=window.showQuick;
window.showQuick=function(title,items,opts={}){
  if(capturePanel?.win&&!capturePanel.win.closed){renderPanel(capturePanel.win,capturePanel.tool,title,items,opts);return}
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
function refreshPanel(t,w){
  if(!w||w.closed)return;
  const prev=capturePanel;capturePanel={win:w,tool:t};
  try{invokeOptions(t)}catch(e){try{instantTool(t)}catch(_){renderPanel(w,t,t.title,[{type:'value',label:'This tool could not open.'}],{withStop:false})}}
  finally{capturePanel=prev}
}
function openToolPanel(t){
  cleanPanels();
  const existing=panelWins.get(t.slug);
  if(existing?.win&&!existing.win.closed){try{existing.win.focus();refreshPanel(t,existing.win)}catch(e){};closeQuick();resizeCollapsed();return}
  const idx=panelWins.size;
  const left=(screen.availLeft||0)+80+(idx%3)*370,top=(screen.availTop||0)+90+Math.floor(idx/3)*80;
  let w=null;
  try{w=window.open('',`ClassroomTool_${t.slug}`,`popup=yes,width=350,height=360,left=${left},top=${top},resizable=yes,scrollbars=yes,toolbar=no,location=no,menubar=no,status=no`)}catch(e){}
  if(!w){toast('Popup blocked — showing options here');invokeOptions(t);resizeExpanded();return}
  panelWins.set(t.slug,{win:w,tool:t});panelShell(w,t);refreshPanel(t,w);try{w.focus()}catch(e){}
  closeQuick();launch.classList.remove('active');cleanPanels();resizeCollapsed();
}

function renderPinnedToolbar(resize=true){
  pinnedBar.innerHTML='';
  for(const slug of toolbarPrefs.tools){
    const t=uniqueTools.find(x=>x.slug===slug);if(!t)continue;
    const b=document.createElement('button');b.type='button';b.className='ccPinnedTool'+(panelWins.has(slug)&&!panelWins.get(slug)?.win?.closed?' running':'');b.title=t.title;b.setAttribute('aria-label',t.title);
    b.innerHTML=`<span class="ccPinnedIcon">${t.icon}</span><span class="ccPinnedLabel">${escapeHtml(t.title)}</span>`;
    b.onclick=()=>openToolPanel(t);pinnedBar.appendChild(b);
  }
  pinnedBar.classList.toggle('show',toolbarPrefs.visible&&toolbarPrefs.tools.length>0);
  if(resize)setTimeout(resizeCollapsed,40);
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
  showQuick(`Toolbar • ${toolbarPrefs.tools.length}/${MAX_PINNED}`,items,{withStop:false});launch.classList.add('active');resizeExpanded();
}
function showActiveTools(){
  cleanPanels();const items=[];
  for(const {win,tool} of panelWins.values())items.push({label:`↗ ${tool.icon} ${tool.title}`,action:()=>{try{win.focus()}catch(e){}}});
  if(items.length)items.push({label:'× Close all tool panels',stop:true,action:()=>{for(const {win} of panelWins.values())try{win.close()}catch(e){}panelWins.clear();cleanPanels();showAllTools()}});
  else items.push({type:'value',label:'No tool panels are open.'});
  showQuick(`Active Tools • ${panelWins.size}`,items,{withStop:false});launch.classList.add('active');resizeExpanded();
}
function showAllTools(){
  cleanPanels();
  const items=[];
  if(panelWins.size)items.push({label:`🟢 Active tools (${panelWins.size})`,primary:true,action:showActiveTools});
  items.push({label:'📌 Toolbar setup',primary:toolbarPrefs.tools.length>0,action:showToolbarSetup});
  items.push(...uniqueTools.map(t=>({label:`${panelWins.has(t.slug)?'● ':''}${t.icon} ${t.title}`,active:panelWins.has(t.slug),action:()=>openToolPanel(t)})));
  showQuick('All Tools',items,{withStop:false});launch.classList.add('active');resizeExpanded();
}

launch.onclick=()=>{
  if(isAllToolsOpen()){closeQuick();launch.classList.remove('active');resizeCollapsed();return}
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
window.addEventListener('beforeunload',()=>{for(const {win} of panelWins.values())try{win.close()}catch(e){}});
setInterval(cleanPanels,700);
renderPinnedToolbar();cleanPanels();
})();