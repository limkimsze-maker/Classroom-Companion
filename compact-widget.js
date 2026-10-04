(function(){
'use strict';
if(window.__classroomSmartToolbarV1)return;
window.__classroomSmartToolbarV1=true;
const TOOLS=[
 {slug:'timer-calm-music',icon:'⏱️',title:'Timer + Calm Music',mode:'mini'},
 {slug:'transition-countdown',icon:'⏳',title:'Transition Countdown',mode:'mini'},
 {slug:'attention-signal',icon:'👀',title:'Attention Signal',mode:'mini'},
 {slug:'noise-level',icon:'🔊',title:'Noise Level',mode:'mini'},
 {slug:'question-spinner',icon:'💬',title:'Sentence Starters',mode:'half'},
 {slug:'confidence-check',icon:'📈',title:'Confidence Check',mode:'half'},
 {slug:'pick-a-pupil',icon:'🎯',title:'Pick a Pupil',mode:'mini'},
 {slug:'make-groups',icon:'👥',title:'Make Groups',mode:'half'},
 {slug:'brain-break',icon:'🧠',title:'Brain Break',mode:'full'},
 {slug:'reflect',icon:'💭',title:'Reflect',mode:'half'},
 {slug:'quote-of-the-day',icon:'✨',title:'Quote of the Day',mode:'full'},
 {slug:'class-organisation',icon:'🗂️',title:'Class Organisation',mode:'full'},
 {slug:'daily-duty-roster',icon:'🧹',title:'Daily Duty Roster',mode:'full'},
 {slug:'pupil-reward-points',icon:'⭐',title:'Pupil Reward Points',mode:'half'},
 {slug:'group-reward-points',icon:'🏆',title:'Group Reward Points',mode:'half'},
 {slug:'daily-visual-timetable',icon:'🗓️',title:'Daily Visual Timetable',mode:'full'}
];
const directPages={
 'class-organisation':'class-organisation.html',
 'daily-duty-roster':'daily-duty-roster.html',
 'pupil-reward-points':'reward-points.html?mode=pupil',
 'group-reward-points':'reward-points.html?mode=group'
};
for(const id of ['strip','wrap','quickbar']){const el=document.getElementById(id);if(el)el.style.display='none'}
document.documentElement.style.background='transparent';document.body.style.background='transparent';document.body.style.margin='0';document.body.style.overflow='hidden';
const style=document.createElement('style');style.textContent=`
html,body{background:transparent!important;overflow:hidden!important}#strip,#wrap,#quickbar{display:none!important}
#ccSmartBar{position:fixed;inset:0;display:flex;align-items:center;gap:6px;padding:8px 9px;background:rgba(255,255,255,.97);border:1px solid #cfe0de;border-radius:18px;box-shadow:0 14px 36px rgba(18,32,46,.22);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;backdrop-filter:blur(12px);overflow:hidden}
#ccSmartBar.collapsed{padding:7px;width:58px;height:58px;border-radius:17px}.ccBrand{width:42px;height:42px;flex:0 0 42px;border:0;border-radius:13px;background:#0f766e;color:#fff;font-size:21px;font-weight:1000;cursor:pointer;display:grid;place-items:center}.ccRail{display:flex;gap:5px;align-items:center;overflow-x:auto;overflow-y:hidden;scrollbar-width:none;flex:1;min-width:0;padding:2px}.ccRail::-webkit-scrollbar{display:none}.ccTool{position:relative;width:43px;height:43px;flex:0 0 43px;border:1px solid #d7e4e2;border-radius:13px;background:linear-gradient(145deg,#fff,#f5faf9);font-size:21px;cursor:pointer;display:grid;place-items:center;box-shadow:0 3px 9px rgba(18,32,46,.05);transition:.14s ease}.ccTool:hover{transform:translateY(-2px);border-color:#79c8bc;box-shadow:0 7px 16px rgba(15,118,110,.11)}.ccTool.active{border-color:#0f766e;background:#e9f8f5;box-shadow:0 0 0 2px rgba(15,118,110,.10)}.ccTool.expanded{outline:2px solid #f59e0b;outline-offset:1px}.ccTool::after{content:'';position:absolute;left:50%;bottom:3px;transform:translateX(-50%);width:13px;height:3px;border-radius:99px;opacity:.85}.ccTool.mini::after{background:#0f766e}.ccTool.half::after{background:#6478b5}.ccTool.full::after{background:#f59e0b}.ccCollapse{width:34px;height:42px;flex:0 0 34px;border:0;border-radius:11px;background:#f1f5f5;color:#47615f;font-size:15px;font-weight:1000;cursor:pointer}.ccLegend{position:fixed;left:10px;bottom:2px;font:800 9px/1 system-ui;color:#697b79;pointer-events:none;opacity:.82}#ccSmartBar.collapsed .ccRail,#ccSmartBar.collapsed .ccCollapse,.collapsedLegend{display:none!important}
@media(max-width:700px){#ccSmartBar{border-radius:0;padding:7px}.ccTool{width:42px;height:42px;flex-basis:42px}.ccBrand{width:40px;height:40px;flex-basis:40px}}
`;document.head.appendChild(style);
const root=document.createElement('div');root.id='ccSmartBar';root.innerHTML=`<button class="ccBrand" id="ccBrand" type="button" title="Classroom Companion">✦</button><div class="ccRail" id="ccRail"></div><button class="ccCollapse" id="ccCollapse" type="button" title="Collapse toolbar">‹</button><div class="ccLegend" id="ccLegend">teal mini • blue half • gold full</div>`;document.body.appendChild(root);
const rail=document.getElementById('ccRail'),legend=document.getElementById('ccLegend');
for(const t of TOOLS){const b=document.createElement('button');b.type='button';b.className='ccTool '+t.mode;b.dataset.slug=t.slug;b.textContent=t.icon;b.title=t.title+' • '+(t.mode==='mini'?'Mini':t.mode==='half'?'Half screen':'Full screen')+(t.mode==='full'?'':' • tap again to expand / restore');b.setAttribute('aria-label',b.title);b.onclick=()=>openTool(t);rail.appendChild(b)}
const entries=new Map();const slots={mini:null,half:null,full:null};
const mobile=matchMedia('(max-width:700px)').matches||matchMedia('(pointer:coarse)').matches;
function screenBox(){return{left:Number.isFinite(screen.availLeft)?screen.availLeft:0,top:Number.isFinite(screen.availTop)?screen.availTop:0,w:screen.availWidth||1280,h:screen.availHeight||800}}
function layout(mode){const s=screenBox();if(mode==='full')return{x:s.left,y:s.top,w:s.w,h:s.h};if(mode==='half'){const w=Math.max(560,Math.round(s.w*.48));return{x:s.left+s.w-w,y:s.top,w,h:s.h}}const w=Math.min(500,Math.max(390,Math.round(s.w*.29))),h=Math.min(390,Math.max(285,Math.round(s.h*.32)));return{x:s.left+s.w-w-10,y:s.top+10,w,h}}
function toolbarLayout(){const s=screenBox(),w=Math.min(960,Math.max(720,s.w-24)),h=72;return{x:s.left+Math.max(8,Math.round((s.w-w)/2)),y:s.top+s.h-h-8,w,h}}
function applyWindow(w,spec){if(!w||w.closed)return;try{w.resizeTo(spec.w,spec.h);w.moveTo(spec.x,spec.y);w.focus()}catch(e){}}
function urlFor(t){const base=directPages[t.slug];return base?base+(base.includes('?')?'&':'?')+'v='+Date.now():'support-tool.html?tool='+encodeURIComponent(t.slug)+'&v='+Date.now()}
function btn(slug){return rail.querySelector(`[data-slug="${slug}"]`)}
function clearEntry(slug){const e=entries.get(slug);if(!e)return;if(slots[e.mode]===slug)slots[e.mode]=null;entries.delete(slug);btn(slug)?.classList.remove('active','expanded')}
function closeSlot(mode,except){const slug=slots[mode];if(!slug||slug===except)return;const e=entries.get(slug);try{if(e?.w&&!e.w.closed)e.w.close()}catch(err){}clearEntry(slug)}
function prune(){for(const [slug,e] of [...entries]){let closed=true;try{closed=!e.w||e.w.closed}catch(err){}if(closed)clearEntry(slug)}}
function toggleExisting(t,e){if(t.mode==='full'){try{e.w.focus()}catch(err){}return}e.expanded=!e.expanded;const spec=e.expanded?layout('full'):layout(t.mode);applyWindow(e.w,spec);btn(t.slug)?.classList.toggle('expanded',e.expanded);legend.textContent=e.expanded?`${t.title}: full screen • tap icon again to restore`:`${t.title}: ${t.mode==='mini'?'mini':'half screen'} • tap icon again to expand`;setTimeout(()=>legend.textContent='teal mini • blue half • gold full',2400)}
function openTool(t){prune();const old=entries.get(t.slug);if(old){toggleExisting(t,old);return}closeSlot(t.mode,t.slug);const spec=layout(t.mode),name='ClassroomCompanion_'+t.mode;let w=null;try{w=window.open(urlFor(t),name,`popup=yes,width=${spec.w},height=${spec.h},left=${spec.x},top=${spec.y},resizable=yes,scrollbars=yes,toolbar=no,location=no,menubar=no,status=no`)}catch(e){}if(!w){legend.textContent='Allow pop-ups to open Classroom Companion tools';return}const entry={w,mode:t.mode,expanded:false};entries.set(t.slug,entry);slots[t.mode]=t.slug;btn(t.slug)?.classList.add('active');setTimeout(()=>applyWindow(w,spec),120);setTimeout(()=>applyWindow(w,spec),600)}
let collapsed=false;function setToolbarSize(){if(mobile)return;try{if(collapsed){window.resizeTo(84,82);const s=screenBox();window.moveTo(s.left+8,s.top+s.h-90)}else{const t=toolbarLayout();window.resizeTo(t.w,t.h);window.moveTo(t.x,t.y)}}catch(e){}}
document.getElementById('ccCollapse').onclick=()=>{collapsed=true;root.classList.add('collapsed');legend.classList.add('collapsedLegend');setToolbarSize()};document.getElementById('ccBrand').onclick=()=>{if(!collapsed)return;collapsed=false;root.classList.remove('collapsed');legend.classList.remove('collapsedLegend');setToolbarSize()};
setInterval(prune,800);setTimeout(setToolbarSize,80);setTimeout(setToolbarSize,500);
})();