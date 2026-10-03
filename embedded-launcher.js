(function(){
'use strict';
const script=document.currentScript,requested=(script?.dataset?.currentTool||'').trim();
if(window.ClassroomCompanionEmbeddedLauncher){window.ClassroomCompanionEmbeddedLauncher.show(requested);return}
let current=requested;
const CORE=[
 {slug:'timer-calm-music',icon:'⏱️',title:'Timer + Calm Music',hint:'Make time visible.'},
 {slug:'transition-countdown',icon:'⏳',title:'Transition Countdown',hint:'Move safely and be ready.'},
 {slug:'attention-signal',icon:'👀',title:'Attention Signal',hint:'Stop, look and listen.'},
 {slug:'noise-level',icon:'🔊',title:'Noise Level',hint:'Expected voice level.'},
 {slug:'question-spinner',icon:'❓',title:'Question Spinner',hint:'Prompt deeper thinking.'},
 {slug:'confidence-check',icon:'📈',title:'Confidence Check',hint:'Show support needed.'},
 {slug:'pick-a-pupil',icon:'🎯',title:'Pick a Pupil',hint:'Fair participation.'},
 {slug:'make-groups',icon:'👥',title:'Make Groups',hint:'Create groups quickly.'},
 {slug:'brain-break',icon:'🧠',title:'Brain Break',hint:'Short learning reset.'},
 {slug:'reflect',icon:'💭',title:'Reflect',hint:'Think about learning.'},
 {slug:'quote-of-the-day',icon:'✨',title:'Quote of the Day',hint:'Encouragement to persist.'},
 {slug:'class-organisation',icon:'🗂️',title:'Class Organisation',hint:'Master pupil sheet.'},
 {slug:'daily-visual-timetable',icon:'🗓️',title:'Daily Visual Timetable',hint:'Make today predictable.'}
];
const style=document.createElement('style');style.textContent=`
#ccEmbeddedLauncher{position:fixed;left:12px;top:12px;z-index:2147483647;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}#ccEmbeddedLauncher.ccHidden{display:none!important}#ccEmbeddedButton{width:52px;height:52px;border:2px solid rgba(255,255,255,.75);border-radius:16px;background:linear-gradient(145deg,#0f766e,#0b5f59);color:#fff;display:grid;place-items:center;font:1000 23px/1 inherit;cursor:pointer;box-shadow:0 10px 28px rgba(0,0,0,.24)}#ccEmbeddedButton.active{background:#fff;color:#0f766e;border-color:#0f766e}
#ccEmbeddedMenu{position:absolute;left:0;top:62px;width:min(520px,calc(100vw - 24px));max-height:min(720px,calc(100vh - 86px));display:none;flex-direction:column;background:linear-gradient(180deg,rgba(255,255,255,.99),rgba(246,251,250,.99));border:1px solid #b8d8d3;border-radius:20px;box-shadow:0 22px 60px rgba(0,0,0,.28);overflow:hidden;color:#17202a}#ccEmbeddedMenu.show{display:flex}.ccEmbeddedHead{display:flex;align-items:center;gap:8px;padding:13px 14px;border-bottom:1px solid #e1e8ec}.ccEmbeddedTitle{font-size:14px;font-weight:1000;flex:1;color:#0b5b55}.ccEmbeddedClose{width:32px;height:32px;border:0;border-radius:10px;background:#eef2f5;font-weight:1000;cursor:pointer}#ccEmbeddedList{overflow:auto;padding:10px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.ccEmbeddedTool{min-height:76px;border:1px solid #d8e1e8;border-radius:15px;background:linear-gradient(145deg,#fff,#f1faf8);padding:11px;text-align:left;color:#17202a;cursor:pointer}.ccEmbeddedTool:hover,.ccEmbeddedTool:focus-visible{background:#eaf8f5;border-color:#83cfc4;outline:none;transform:translateY(-1px)}.ccEmbeddedTool.current{background:#dff6f1;border-color:#65c4b8}.ccIcon{font-size:21px;display:block;margin-bottom:4px}.ccTitle{font-size:11px;font-weight:1000;color:#17324d;display:block}.ccHint{font-size:9px;font-weight:750;color:#667085;display:block;margin-top:2px;line-height:1.25}@media(max-width:700px){#ccEmbeddedLauncher{left:8px;top:8px}#ccEmbeddedButton{width:48px;height:48px}#ccEmbeddedMenu{top:56px;width:min(380px,calc(100vw - 16px));max-height:calc(100vh - 72px)}#ccEmbeddedList{grid-template-columns:1fr}.ccEmbeddedTool{min-height:66px}}
`;document.head.appendChild(style);
const root=document.createElement('div');root.id='ccEmbeddedLauncher';root.innerHTML='<button id="ccEmbeddedButton" type="button" aria-label="Open educational support tools">✦</button><div id="ccEmbeddedMenu"><div class="ccEmbeddedHead"><div class="ccEmbeddedTitle">Educational Support</div><button class="ccEmbeddedClose" type="button">×</button></div><div id="ccEmbeddedList"></div></div>';document.body.appendChild(root);
const btn=root.querySelector('#ccEmbeddedButton'),menu=root.querySelector('#ccEmbeddedMenu'),list=root.querySelector('#ccEmbeddedList');
function toolWindowName(slug){return 'ClassroomCompanionTool_'+slug.replace(/[^a-z0-9]/gi,'_')}
function closeMenu(){menu.classList.remove('show');btn.classList.remove('active')}
function render(){list.innerHTML='';for(const t of CORE){const b=document.createElement('button');b.type='button';b.className='ccEmbeddedTool'+(t.slug===current?' current':'');b.innerHTML=`<span class="ccIcon">${t.icon}</span><span class="ccTitle">${t.title}</span><span class="ccHint">${t.hint}</span>`;b.onclick=e=>{e.stopPropagation();openTool(t)};list.appendChild(b)}}
function openTool(t){if(t.slug===current){closeMenu();return}const sw=screen.availWidth||1280,sh=screen.availHeight||800,url=t.slug==='class-organisation'?'class-organisation.html?v='+Date.now():'support-tool.html?tool='+encodeURIComponent(t.slug)+'&v='+Date.now();const w=window.open(url,toolWindowName(t.slug),`popup=yes,width=${sw},height=${sh},left=0,top=0,resizable=yes,scrollbars=yes,toolbar=no,location=no,menubar=no,status=no`);if(w){try{w.focus()}catch(e){};closeMenu()}}
function show(next=''){current=String(next||'').trim();render();root.classList.remove('ccHidden')}function hide(){closeMenu();root.classList.add('ccHidden')}
btn.onclick=e=>{e.stopPropagation();if(menu.classList.contains('show'))closeMenu();else{render();menu.classList.add('show');btn.classList.add('active')}};root.querySelector('.ccEmbeddedClose').onclick=e=>{e.stopPropagation();closeMenu()};menu.onclick=e=>e.stopPropagation();document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.classList.contains('show'))closeMenu()},true);
window.ClassroomCompanionEmbeddedLauncher={show,hide,openTool};show(current);
})();