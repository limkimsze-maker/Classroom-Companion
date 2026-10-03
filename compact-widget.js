(function(){
'use strict';
window.__compactWidgetReady=true;
const oldStrip=document.getElementById('strip');
const oldWrap=document.getElementById('wrap');
const quick=document.getElementById('quickbar');
if(!oldStrip||!oldWrap||!quick||typeof allTools==='undefined')return;

const TOOLBAR_STORE='classroomCompanionCompactToolbarV1';
const MAX_PINNED=5;
const REMOVED_DUPLICATES=new Set(['movement-break','end-of-lesson-self-check']);
const tools=[...new Map(allTools.filter(t=>!REMOVED_DUPLICATES.has(t.slug)).map(t=>[t.slug,t])).values()];
const toolWindows=new Map();
const CATEGORIES=[
  {id:'teach',icon:'⏱️',title:'Teach & Pace',hint:'Timers, stages, transitions',slugs:['timer-calm-music','lesson-stages','transition-countdown','focus-intervals','full-screen-clock','date-day']},
  {id:'manage',icon:'🌿',title:'Settle & Manage',hint:'Attention, behaviour, routines',slugs:['attention-signal','calm-reset','noise-level','class-traffic-light','work-mode','behaviour-expectations','pre-correction','help-before-teacher','screen-shade']},
  {id:'check',icon:'❓',title:'Ask & Check',hint:'Questions, responses, checks',slugs:['think-pair-share','mini-whiteboard-routine','question-spinner','answer-check','confidence-check','participation-counter','engagement-snapshot']},
  {id:'choose',icon:'🎲',title:'Choose & Group',hint:'Pick, randomise, make groups',slugs:['random-number','dice','coin-toss','action-spinner','pick-a-pupil','make-groups']},
  {id:'reflect',icon:'💭',title:'Reflect & Extend',hint:'Brain breaks, reflection, extension',slugs:['early-finisher','brain-break','kwl-chart','reflect','quote-of-the-day']},
  {id:'plan',icon:'⭐',title:'Reward & Plan',hint:'Goals, rewards, tracking, timetable',slugs:['whole-class-goal','rewards','observation-counter','soundboard','daily-visual-timetable','weekly-visual-timetable']}
];

function loadPrefs(){
  try{
    const p=JSON.parse(localStorage.getItem(TOOLBAR_STORE)||'{}');
    return {visible:p.visible!==false,tools:Array.isArray(p.tools)?p.tools.filter((s,i,a)=>a.indexOf(s)===i&&tools.some(t=>t.slug===s)).slice(0,MAX_PINNED):[]};
  }catch(e){return {visible:true,tools:[]}}
}
let prefs=loadPrefs();
function savePrefs(){localStorage.setItem(TOOLBAR_STORE,JSON.stringify(prefs))}

const style=document.createElement('style');
style.textContent=`
html,body{background:transparent!important;overflow:hidden!important}#strip{display:none!important}#wrap{padding:0!important;width:auto!important;max-width:none!important}
#quickbar{position:fixed!important;left:6px!important;top:64px!important;width:min(510px,calc(100vw - 12px))!important;max-width:none!important;max-height:calc(100vh - 72px)!important;margin:0!important;padding:10px!important;border:1px solid #cfe0de!important;border-radius:18px!important;box-shadow:0 18px 50px rgba(18,32,46,.22)!important;z-index:2147483600!important;align-items:flex-start!important;background:linear-gradient(180deg,#ffffff,#f8fbfb)!important}
#quickbar .quick-title{font-size:13px!important;padding:9px 7px!important;max-width:112px!important;white-space:normal!important;line-height:1.15!important;color:#0b5b55!important}
#quickbar .quick-scroll{display:flex!important;flex-wrap:wrap!important;align-items:flex-start!important;gap:7px!important;overflow-x:hidden!important;overflow-y:auto!important;max-width:none!important;max-height:540px!important;padding:2px!important;flex:1!important}
#quickbar .quick-chip{height:auto!important;min-height:38px!important;padding:9px 11px!important;white-space:normal!important;line-height:1.2!important;text-align:left!important;border-radius:11px!important;transition:.12s ease!important}
#quickbar .quick-chip:hover{transform:translateY(-1px);border-color:#7ccbc0!important;background:#f2fbf9!important}
#quickbar .quick-value{white-space:normal!important;line-height:1.35!important;padding:8px!important;max-width:320px!important}#quickbar .quick-close{flex:0 0 auto!important;margin:2px 0 0 auto!important}
#quickbar .quick-scroll.ccCategoryGrid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:9px!important;width:100%!important;max-height:550px!important}
#quickbar .ccCategoryCard{min-height:88px!important;padding:12px!important;border:1px solid #cfe0de!important;border-radius:15px!important;background:linear-gradient(145deg,#fff,#f0faf8)!important;color:#17324d!important;font-size:12px!important;font-weight:950!important;white-space:pre-line!important;box-shadow:0 5px 14px rgba(15,118,110,.07)!important}
#quickbar .ccCategoryCard::first-line{font-size:13px}.ccCategoryUtility{min-height:38px!important;background:#fff!important;color:#0b5b55!important;border-style:dashed!important}
#quickbar .ccBack{background:#eef6f5!important;color:#0b5b55!important;border-color:#b8d8d3!important;font-weight:950!important}
#ccMiniRoot{position:fixed;left:6px;top:6px;z-index:2147483646;display:flex;align-items:center;gap:5px;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
#ccMiniLaunch{width:50px;height:50px;flex:0 0 50px;border:2px solid #0f766e;border-radius:15px;background:linear-gradient(145deg,#0f766e,#0b5f59);color:#fff;box-shadow:0 9px 24px rgba(15,118,110,.30);display:grid;place-items:center;cursor:pointer;padding:0;position:relative}#ccMiniLaunch .spark{font-size:22px;line-height:1}#ccMiniLaunch .dots{position:absolute;right:5px;bottom:4px;font-size:10px;letter-spacing:-1px;font-weight:1000;color:#dff6f1}#ccMiniLaunch .count{position:absolute;left:-5px;top:-6px;min-width:18px;height:18px;padding:0 4px;border-radius:999px;background:#b42318;color:#fff;border:2px solid #fff;display:none;place-items:center;font-size:9px;font-weight:1000;line-height:1}#ccMiniLaunch.has-active .count{display:grid}#ccMiniLaunch.active{background:#fff;color:#0f766e}
#ccPinnedBar{display:none;align-items:center;gap:4px;padding:3px;border:1px solid #b8d8d3;background:rgba(255,255,255,.96);border-radius:13px;box-shadow:0 7px 18px rgba(18,32,46,.12);max-width:420px;overflow-x:auto;scrollbar-width:none}#ccPinnedBar.show{display:flex}#ccPinnedBar::-webkit-scrollbar{display:none}.ccPinnedTool{width:52px;height:44px;flex:0 0 52px;border:1px solid #d8e1e8;background:#fff;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:2px;cursor:pointer;color:#17202a}.ccPinnedTool.running{background:#f0faf8;border-color:#58b9ac;box-shadow:inset 0 0 0 1px #58b9ac}.ccPinnedIcon{font-size:18px;line-height:1}.ccPinnedLabel{width:46px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:7.5px;line-height:1;font-weight:900;text-align:center}
@media(max-width:700px){#quickbar{width:calc(100vw - 12px)!important}#quickbar .quick-scroll{max-height:calc(100vh - 100px)!important}#quickbar .quick-scroll.ccCategoryGrid{grid-template-columns:1fr!important}#ccPinnedBar{max-width:calc(100vw - 72px)}}`;
document.head.appendChild(style);

const root=document.createElement('div');root.id='ccMiniRoot';root.innerHTML=`<button id="ccMiniLaunch" type="button" aria-label="Open classroom tools" title="Classroom tools"><span class="spark">✦</span><span class="dots">•••</span><span class="count" id="ccActiveCount">0</span></button><div id="ccPinnedBar" aria-label="Pinned classroom tools"></div>`;document.body.appendChild(root);
const launch=root.querySelector('#ccMiniLaunch'),activeCount=root.querySelector('#ccActiveCount'),pinnedBar=root.querySelector('#ccPinnedBar');
const mobile=matchMedia('(max-width:700px)').matches||matchMedia('(pointer:coarse)').matches;
function isQuickOpen(){return quick.classList.contains('show')}
function isLauncherOpen(){const t=document.getElementById('quickTitle')?.textContent||'';return isQuickOpen()&&(t==='Classroom tools'||CATEGORIES.some(c=>c.title===t))}
function collapsedWidth(){return prefs.visible&&prefs.tools.length?Math.min(520,122+prefs.tools.length*56):118}
function resizeCollapsed(){if(mobile)return;try{if(!document.fullscreenElement){window.resizeTo(collapsedWidth(),112);window.moveTo(8,8)}}catch(e){}}
function resizeExpanded(){if(mobile)return;try{if(!document.fullscreenElement){window.resizeTo(530,700);window.moveTo(8,8)}}catch(e){}}
function toolWindowName(slug){return 'ClassroomCompanionTool_'+slug.replace(/[^a-z0-9]/gi,'_')}
function clearMenuClasses(){const s=document.getElementById('quickScroll');s?.classList.remove('ccCategoryGrid');s?.querySelectorAll('.ccCategoryCard,.ccCategoryUtility,.ccBack').forEach(x=>x.classList.remove('ccCategoryCard','ccCategoryUtility','ccBack'))}
function markCategoryHome(){const s=document.getElementById('quickScroll');if(!s)return;s.classList.add('ccCategoryGrid');const bs=[...s.querySelectorAll('.quick-chip')];bs.slice(0,CATEGORIES.length).forEach(b=>b.classList.add('ccCategoryCard'));bs.slice(CATEGORIES.length).forEach(b=>b.classList.add('ccCategoryUtility'))}
function markCategoryTools(){const s=document.getElementById('quickScroll');if(!s)return;s.classList.remove('ccCategoryGrid');s.querySelector('.quick-chip')?.classList.add('ccBack')}
function pruneWindows(){for(const [slug,w] of [...toolWindows]){try{if(!w||w.closed)toolWindows.delete(slug)}catch(e){toolWindows.delete(slug)}}updateActiveUI()}
function updateActiveUI(){const n=toolWindows.size;activeCount.textContent=String(n);launch.classList.toggle('has-active',n>0);renderPinned(false)}
function openTool(t){pruneWindows();const existing=toolWindows.get(t.slug);if(existing){try{existing.focus();existing.postMessage({type:'classroom-companion-show-options'},location.origin);closeQuick();resizeCollapsed();return}catch(e){toolWindows.delete(t.slug)}}const index=toolWindows.size,sw=screen.availWidth||1280,sh=screen.availHeight||800,width=Math.min(520,sw),height=Math.min(680,sh),left=Math.max(0,Math.min(sw-width,150+index*36)),top=Math.max(0,Math.min(sh-height,24+index*32));const url='tool-window.html?tool='+encodeURIComponent(t.slug)+'&v='+Date.now();const w=window.open(url,toolWindowName(t.slug),`popup=yes,width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,toolbar=no,location=no,menubar=no,status=no`);if(!w){toast('Allow popups to open this tool');return}toolWindows.set(t.slug,w);try{w.focus()}catch(e){}closeQuick();launch.classList.remove('active');updateActiveUI();resizeCollapsed()}
function showActiveTools(){clearMenuClasses();pruneWindows();const items=[];for(const [slug,w] of toolWindows){const t=tools.find(x=>x.slug===slug);if(!t)continue;items.push({label:`↗ ${t.icon} ${t.title}`,action:()=>{try{w.focus();w.postMessage({type:'classroom-companion-show-options'},location.origin)}catch(e){}closeQuick();resizeCollapsed()}})}if(items.length)items.push({label:'Close all tool windows',stop:true,action:()=>{for(const w of toolWindows.values())try{w.close()}catch(e){}toolWindows.clear();updateActiveUI();closeQuick();resizeCollapsed()}});else items.push({type:'value',label:'No tool windows are open.'});showQuick(`Active tools • ${toolWindows.size}`,items,{withStop:false});launch.classList.add('active');resizeExpanded()}
function renderPinned(resize=true){pinnedBar.innerHTML='';for(const slug of prefs.tools){const t=tools.find(x=>x.slug===slug);if(!t)continue;const b=document.createElement('button');b.type='button';b.className='ccPinnedTool'+(toolWindows.has(slug)?' running':'');b.title=t.title;b.innerHTML=`<span class="ccPinnedIcon">${t.icon}</span><span class="ccPinnedLabel">${escapeHtml(t.title)}</span>`;b.onclick=()=>openTool(t);pinnedBar.appendChild(b)}pinnedBar.classList.toggle('show',prefs.visible&&prefs.tools.length>0);if(resize)setTimeout(()=>isQuickOpen()?resizeExpanded():resizeCollapsed(),40)}
function showToolbarSetup(){clearMenuClasses();const selected=new Set(prefs.tools),items=[];if(selected.size)items.push({label:prefs.visible?'👁 Hide toolbar':'👁 Show toolbar',primary:!prefs.visible,action:()=>{prefs.visible=!prefs.visible;savePrefs();renderPinned();showToolbarSetup()}});for(const t of tools){const on=selected.has(t.slug);items.push({label:`${on?'✓':'＋'} ${t.icon} ${t.title}`,active:on,action:()=>{if(on)prefs.tools=prefs.tools.filter(x=>x!==t.slug);else{if(prefs.tools.length>=MAX_PINNED){toast(`Pin up to ${MAX_PINNED} tools`);return}prefs.tools.push(t.slug);prefs.visible=true}savePrefs();renderPinned();showToolbarSetup()}})}if(selected.size)items.push({label:'Clear toolbar',action:()=>{prefs={visible:true,tools:[]};savePrefs();renderPinned();showToolbarSetup()}});showQuick(`Toolbar • ${prefs.tools.length}/${MAX_PINNED}`,items,{withStop:false});launch.classList.add('active');resizeExpanded()}
function showCategory(cat){clearMenuClasses();const items=[{label:'← All categories',action:showLauncherHome}];for(const slug of cat.slugs){const t=tools.find(x=>x.slug===slug);if(t)items.push({label:`${toolWindows.has(t.slug)?'● ':''}${t.icon} ${t.title}`,action:()=>openTool(t)})}showQuick(cat.title,items,{withStop:false});markCategoryTools();launch.classList.add('active');resizeExpanded()}
function showLauncherHome(){clearMenuClasses();pruneWindows();const items=CATEGORIES.map(c=>({label:`${c.icon} ${c.title}\n${c.hint}`,action:()=>showCategory(c)}));items.push({label:'📌 Customise toolbar',action:showToolbarSetup});if(toolWindows.size)items.push({label:`🟢 Active tools (${toolWindows.size})`,active:true,action:showActiveTools});showQuick('Classroom tools',items,{withStop:false});markCategoryHome();launch.classList.add('active');resizeExpanded()}
launch.onclick=()=>{if(isLauncherOpen()){closeQuick();launch.classList.remove('active');resizeCollapsed();return}showLauncherHome()};
const observer=new MutationObserver(()=>{if(isQuickOpen()){launch.classList.add('active');resizeExpanded()}else{clearMenuClasses();launch.classList.remove('active');setTimeout(resizeCollapsed,80)}});observer.observe(quick,{attributes:true,attributeFilter:['class']});
window.addEventListener('storage',e=>{if(e.key===TOOLBAR_STORE){prefs=loadPrefs();renderPinned()}});setInterval(pruneWindows,700);window.addEventListener('beforeunload',()=>{for(const w of toolWindows.values())try{w.close()}catch(e){}});renderPinned();updateActiveUI();resizeCollapsed();
})();