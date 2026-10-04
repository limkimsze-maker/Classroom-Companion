(function(){
'use strict';
window.__compactWidgetReady=true;
const oldStrip=document.getElementById('strip'),oldWrap=document.getElementById('wrap'),quick=document.getElementById('quickbar');
if(!oldStrip||!oldWrap||!quick||typeof showQuick!=='function')return;
const CORE=[
 {slug:'timer-calm-music',icon:'⏱️',title:'Timer + Calm Music',hint:'Make time visible and predictable.'},
 {slug:'transition-countdown',icon:'⏳',title:'Transition Countdown',hint:'Move safely and be ready.'},
 {slug:'attention-signal',icon:'👀',title:'Attention Signal',hint:'Stop, look and listen.'},
 {slug:'noise-level',icon:'🔊',title:'Noise Level',hint:'Show the expected voice level.'},
 {slug:'question-spinner',icon:'💬',title:'Sentence Starters',hint:'Simple ways to start an answer.'},
 {slug:'confidence-check',icon:'📈',title:'Confidence Check',hint:'Show what support is needed.'},
 {slug:'pick-a-pupil',icon:'🎯',title:'Pick a Pupil',hint:'Invite participation fairly.'},
 {slug:'make-groups',icon:'👥',title:'Make Groups',hint:'Create groups from the class list.'},
 {slug:'brain-break',icon:'🧠',title:'Brain Break',hint:'Take a short learning reset.'},
 {slug:'reflect',icon:'💭',title:'Reflect',hint:'Think about what helped learning.'},
 {slug:'quote-of-the-day',icon:'✨',title:'Quote of the Day',hint:'Encouragement when learning feels hard.'},
 {slug:'class-organisation',icon:'🗂️',title:'Class Organisation',hint:'Master sheet, duties, roles and dismissal.'},
 {slug:'daily-visual-timetable',icon:'🗓️',title:'Daily Visual Timetable',hint:'Make the day predictable.'}
];
const toolWindows=new Map();
const style=document.createElement('style');style.textContent=`
html,body{background:transparent!important;overflow:hidden!important}#strip{display:none!important}#wrap{padding:0!important;width:auto!important;max-width:none!important}
#quickbar{position:fixed!important;left:6px!important;top:64px!important;width:min(620px,calc(100vw - 12px))!important;max-width:none!important;max-height:calc(100vh - 72px)!important;margin:0!important;padding:12px!important;border:1px solid #cfe0de!important;border-radius:22px!important;box-shadow:0 20px 60px rgba(18,32,46,.24)!important;z-index:2147483600!important;align-items:flex-start!important;background:linear-gradient(180deg,#fff,#f6fbfa)!important}
#quickbar .quick-title{display:none!important}#quickbar .quick-close{position:absolute!important;right:10px!important;top:10px!important;width:32px!important;height:32px!important;border-radius:10px!important;z-index:2!important}
#quickbar .quick-scroll{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;width:100%!important;max-width:none!important;max-height:620px!important;overflow:auto!important;padding:34px 2px 2px!important}
#quickbar .quick-chip{min-height:92px!important;height:auto!important;border:1px solid #d5e4e1!important;border-radius:17px!important;background:linear-gradient(145deg,#fff,#f1faf8)!important;color:#17324d!important;padding:13px!important;text-align:left!important;white-space:pre-line!important;font-size:12px!important;line-height:1.35!important;font-weight:900!important;box-shadow:0 6px 18px rgba(15,118,110,.06)!important;transition:.14s ease!important}
#quickbar .quick-chip:hover{transform:translateY(-2px)!important;border-color:#72c7bb!important;box-shadow:0 10px 24px rgba(15,118,110,.11)!important}.ccCoreTitle{position:absolute;left:14px;top:13px;font-size:15px;font-weight:1000;color:#0b5b55;z-index:1}.ccCoreSub{position:absolute;left:14px;top:34px;font-size:10px;font-weight:800;color:#667085;z-index:1}
#ccMiniRoot{position:fixed;left:6px;top:6px;z-index:2147483646;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}#ccMiniLaunch{width:50px;height:50px;border:2px solid #0f766e;border-radius:15px;background:linear-gradient(145deg,#0f766e,#0b5f59);color:#fff;box-shadow:0 9px 24px rgba(15,118,110,.30);display:grid;place-items:center;cursor:pointer;padding:0;position:relative}#ccMiniLaunch .spark{font-size:22px;line-height:1}#ccMiniLaunch .dots{position:absolute;right:5px;bottom:4px;font-size:10px;letter-spacing:-1px;font-weight:1000;color:#dff6f1}#ccMiniLaunch.active{background:#fff;color:#0f766e}
@media(max-width:700px){#quickbar{width:calc(100vw - 12px)!important}#quickbar .quick-scroll{grid-template-columns:1fr!important;max-height:calc(100vh - 92px)!important}.quick-chip{min-height:76px!important}}
`;document.head.appendChild(style);
const root=document.createElement('div');root.id='ccMiniRoot';root.innerHTML='<button id="ccMiniLaunch" type="button" aria-label="Open educational support tools" title="Educational support tools"><span class="spark">✦</span><span class="dots">•••</span></button>';document.body.appendChild(root);const launch=root.querySelector('#ccMiniLaunch');
const mobile=matchMedia('(max-width:700px)').matches||matchMedia('(pointer:coarse)').matches;
function toolWindowName(slug){return 'ClassroomCompanionTool_'+slug.replace(/[^a-z0-9]/gi,'_')}
function resizeCollapsed(){if(mobile)return;try{window.resizeTo(118,112);window.moveTo(8,8)}catch(e){}}
function resizeExpanded(){if(mobile)return;try{window.resizeTo(640,760);window.moveTo(8,8)}catch(e){}}
function closeMenu(){try{closeQuick()}catch(e){}launch.classList.remove('active');resizeCollapsed()}
function prune(){for(const [slug,w] of [...toolWindows])try{if(!w||w.closed)toolWindows.delete(slug)}catch(e){toolWindows.delete(slug)}}
function openTool(t){
 prune();const existing=toolWindows.get(t.slug);if(existing){try{existing.focus();closeMenu();return}catch(e){toolWindows.delete(t.slug)}}
 const sw=screen.availWidth||1280,sh=screen.availHeight||800,url=t.slug==='class-organisation'?'class-organisation.html?v='+Date.now():'support-tool.html?tool='+encodeURIComponent(t.slug)+'&v='+Date.now();
 const w=window.open(url,toolWindowName(t.slug),`popup=yes,width=${sw},height=${sh},left=0,top=0,resizable=yes,scrollbars=yes,toolbar=no,location=no,menubar=no,status=no`);
 if(!w){try{toast('Allow pop-ups to open the tool')}catch(e){}return}toolWindows.set(t.slug,w);try{w.focus()}catch(e){}closeMenu()
}
function showCore(){
 const items=CORE.map(t=>({label:`${t.icon}  ${t.title}\n${t.hint}`,action:()=>openTool(t)}));showQuick('Support tools',items,{withStop:false});launch.classList.add('active');resizeExpanded();
 if(!quick.querySelector('.ccCoreTitle')){const h=document.createElement('div');h.className='ccCoreTitle';h.textContent='Educational Support';const s=document.createElement('div');s.className='ccCoreSub';s.textContent='Choose one tool';quick.append(h,s)}
}
launch.onclick=()=>{if(quick.classList.contains('show'))closeMenu();else showCore()};
const mo=new MutationObserver(()=>{const open=quick.classList.contains('show');launch.classList.toggle('active',open);if(!open)setTimeout(resizeCollapsed,60)});mo.observe(quick,{attributes:true,attributeFilter:['class']});
setInterval(prune,1000);resizeCollapsed();
})();