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
#ccEmbeddedMenu{position:absolute;left:0;top:62px;width:min(520px,calc(100vw - 24px));max-height:min(720px,calc(100vh - 86px));display:none;flex-direction:column;background:linear-gradient(180deg,rgba(255,255,255,.99),rgba(246,251,250,.99));border:1px solid #b8d8d3;border-radius:20px;box-shadow:0 22px 60px rgba(0,0,0,.28);overflow:hidden;color:#17202a}#ccEmbeddedMenu.show{display:flex}.ccEmbeddedHead{display:flex;align-items:center;gap:8px;padding:13px 14px;border-bottom:1px solid #e1e8ec}.ccEmbeddedTitle{font-size:14px;font-weight:1000;flex:1;color:#0b5b55}.ccEmbeddedClose{width:32px;height:32px;border:0;border-radius:10px;background:#eef2f5;font-weight:1000;cursor:pointer}#ccEmbeddedList{overflow:auto;padding:10px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.ccEmbeddedTool{min-height:76px;border:1px solid #d8e1e8;border-radius:15px;background:linear-gradient(145deg,#fff,#f1faf8);padding:11px;text-align:left;color:#17202a;cursor:pointer}.ccEmbeddedTool:hover,.ccEmbeddedTool:focus-visible{background:#eaf8f5;border-color:#83cfc4;outline:none;transform:translateY(-1px)}.ccEmbeddedTool.current{background:#dff6f1;border-color:#65c4b8}.ccIcon{font-size:21px;display:block;margin-bottom:4px}.ccTitle{font-size:11px;font-weight:1000;color:#17324d;display:block}.ccHint{font-size:9px;font-weight:750;color:#667085;display:block;margin-top:2px;line-height:1.25}
#ccClassManager{max-width:1500px;margin:10px auto 0;padding:12px 14px;border:1px solid #cfe0de;border-radius:18px;background:rgba(255,255,255,.96);box-shadow:0 8px 24px rgba(18,32,46,.07);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#17202a}#ccClassManager .ccClassRow{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.ccClassLabel{font-size:13px;font-weight:1000;color:#17324d}.ccClassSelect,.ccClassInput{min-height:40px;border:1px solid #d8e1e8;border-radius:11px;background:#fff;padding:8px 10px;font:850 13px/1.2 inherit;color:#17324d}.ccClassSelect{min-width:190px}.ccClassInput{min-width:210px;flex:1 1 220px}.ccClassBtn{min-height:40px;border:1px solid #b8d8d3;border-radius:11px;background:#fff;color:#0b5b55;padding:8px 12px;font:950 12px/1 inherit;cursor:pointer}.ccClassBtn.primary{background:#0f766e;border-color:#0f766e;color:#fff}.ccClassBtn.danger{background:#fff3f1;border-color:#f0b1a9;color:#b42318;user-select:none;-webkit-user-select:none;touch-action:manipulation}.ccClassBtn.danger.holding{background:#b42318;border-color:#b42318;color:#fff}.ccClassHelp{width:100%;font-size:10px;font-weight:750;color:#667085;margin-top:1px}.ccClassStatus{font-size:10px;font-weight:900;color:#0f766e}
.ccDutyDayOriginal{display:none!important}.ccDutyDays{display:flex;align-items:center;gap:3px;min-width:154px;height:35px}.ccDutyDayChip{height:30px;min-width:27px;padding:0 6px;border:1px solid #d8e1e8;border-radius:8px;background:#fff;color:#667085;font:900 10px/1 inherit;cursor:pointer}.ccDutyDayChip:hover{border-color:#83cfc4;background:#f1faf8}.ccDutyDayChip.active{background:#0f766e;border-color:#0f766e;color:#fff;box-shadow:0 2px 6px rgba(15,118,110,.18)}
@media(max-width:700px){#ccEmbeddedLauncher{left:8px;top:8px}#ccEmbeddedButton{width:48px;height:48px}#ccEmbeddedMenu{top:56px;width:min(380px,calc(100vw - 16px));max-height:calc(100vh - 72px)}#ccEmbeddedList{grid-template-columns:1fr}.ccEmbeddedTool{min-height:66px}#ccClassManager{margin:8px;padding:10px}.ccClassSelect,.ccClassInput{width:100%;min-width:0}.ccClassBtn{flex:1 1 auto}}
`;document.head.appendChild(style);

function safe(raw,fallback){try{return JSON.parse(raw)||fallback}catch(e){return fallback}}
function installClassManager(){
 if(current!=='class-organisation'||document.getElementById('ccClassManager'))return;
 const top=document.querySelector('.shell > .top')||document.querySelector('.top');if(!top)return;
 const MASTER='classroomCompanionClassMasterV1',CC='classroomCompanionV1';
 const SCOPED_STORES=['classroomCompanionDutyRosterV1','classroomCompanionRolesV1','classroomCompanionSavedGroupsV1','classroomCompanionRewardPointsV1'];
 const master=()=>safe(localStorage.getItem(MASTER),{})||{};
 const data=()=>safe(localStorage.getItem(CC),{})||{};
 const hasRows=v=>Array.isArray(v)&&v.some(r=>String(r?.pupil||'').trim());
 function names(){
  const m=master(),d=data(),out=[];
  for(const n of Object.keys(d.classes||{}))if(n&&!out.some(x=>x.toLowerCase()===n.toLowerCase()))out.push(n);
  for(const k of Object.keys(m))if(k!=='_general'&&hasRows(m[k])&&!out.some(x=>x.toLowerCase()===k.toLowerCase()))out.push(k);
  return out.sort((a,b)=>a.localeCompare(b));
 }
 function currentLabel(){const d=data(),ns=names();return d.selectedClass&&ns.some(n=>n===d.selectedClass)?d.selectedClass:'General'}
 function saveSelected(label){const d=data();d.classes=d.classes||{};d.selectedClass=label==='General'?'':label;localStorage.setItem(CC,JSON.stringify(d))}
 function ensureClass(name,pupils=[]){const d=data();d.classes=d.classes||{};if(!d.classes[name])d.classes[name]={names:[]};if(Array.isArray(d.classes[name]))d.classes[name]=[...pupils];else d.classes[name].names=[...pupils];d.selectedClass=name;localStorage.setItem(CC,JSON.stringify(d))}
 function validName(raw){const name=String(raw||'').trim();if(!name){alert('Enter a class name.');return''}if(/^general$/i.test(name)){alert('Please use a specific class name, for example 3 Respect.');return''}const existing=names().find(n=>n.toLowerCase()===name.toLowerCase());if(existing){alert('That class already exists. Choose it from the class list.');return''}return name}
 function deleteScoped(store,key){const all=safe(localStorage.getItem(store),{})||{};if(Object.prototype.hasOwnProperty.call(all,key)){delete all[key];localStorage.setItem(store,JSON.stringify(all))}}
 const box=document.createElement('section');box.id='ccClassManager';top.insertAdjacentElement('afterend',box);
 function draw(){
  const m=master(),ns=names(),active=currentLabel(),generalHas=hasRows(m._general);
  const options=[];if(generalHas||!ns.length)options.push('General');options.push(...ns);
  box.innerHTML=`<div class="ccClassRow"><span class="ccClassLabel">Class</span><select class="ccClassSelect" id="ccMasterClassSelect">${options.map(n=>`<option ${n===active?'selected':''}>${n.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</option>`).join('')}</select><input class="ccClassInput" id="ccNewClassName" placeholder="New class name, e.g. 3 Respect"><button class="ccClassBtn primary" id="ccAddClassBtn">${active==='General'&&generalHas?'Name this class':'＋ Add class'}</button>${active==='General'&&generalHas?'<button class="ccClassBtn" id="ccBlankClassBtn">＋ Blank class</button>':''}${active!=='General'?'<button class="ccClassBtn danger" id="ccDeleteClassBtn">🗑 Hold 2s to delete</button>':''}<span class="ccClassStatus">${active==='General'?'Current: General':'Current: '+active}</span><div class="ccClassHelp">Each class has its own master sheet. CSV import and pupil/group tools use the selected class.</div></div>`;
  const sel=box.querySelector('#ccMasterClassSelect'),inp=box.querySelector('#ccNewClassName'),primary=box.querySelector('#ccAddClassBtn'),blank=box.querySelector('#ccBlankClassBtn'),del=box.querySelector('#ccDeleteClassBtn');
  sel.onchange=()=>{saveSelected(sel.value);location.reload()};
  function create(copyGeneral){
   const name=validName(inp.value);if(!name)return;
   const mm=master(),source=copyGeneral&&hasRows(mm._general)?mm._general.map(r=>({...r})):[];
   mm[name]=source;
   if(copyGeneral)delete mm._general;
   localStorage.setItem(MASTER,JSON.stringify(mm));
   ensureClass(name,source.map(r=>String(r.pupil||'').trim()).filter(Boolean));
   location.reload();
  }
  function removeActive(){
   if(active==='General')return;
   const mm=master();delete mm[active];localStorage.setItem(MASTER,JSON.stringify(mm));
   const d=data();d.classes=d.classes||{};delete d.classes[active];
   const remaining=[];
   for(const n of Object.keys(d.classes))if(n&&!remaining.includes(n))remaining.push(n);
   for(const k of Object.keys(mm))if(k!=='_general'&&hasRows(mm[k])&&!remaining.includes(k))remaining.push(k);
   d.selectedClass=remaining.sort((a,b)=>a.localeCompare(b))[0]||'';
   localStorage.setItem(CC,JSON.stringify(d));
   for(const store of SCOPED_STORES)deleteScoped(store,active);
   location.reload();
  }
  primary.onclick=()=>create(active==='General'&&generalHas);
  if(blank)blank.onclick=()=>create(false);
  if(del){
   let holdTimer=0,tickTimer=0,started=0,completed=false;
   const resetHold=()=>{clearTimeout(holdTimer);clearInterval(tickTimer);holdTimer=0;tickTimer=0;if(!completed){del.classList.remove('holding');del.textContent='🗑 Hold 2s to delete'}};
   const beginHold=e=>{if(holdTimer||completed)return;if(e?.type==='keydown'&&e.repeat)return;if(e?.preventDefault)e.preventDefault();started=performance.now();del.classList.add('holding');del.textContent='Hold… 2.0s';tickTimer=setInterval(()=>{const left=Math.max(0,2000-(performance.now()-started));del.textContent=`Hold… ${(left/1000).toFixed(1)}s`},100);holdTimer=setTimeout(()=>{completed=true;clearInterval(tickTimer);del.textContent='Deleting…';removeActive()},2000)};
   const cancelHold=e=>{if(e?.preventDefault)e.preventDefault();if(!completed)resetHold()};
   del.onclick=e=>e.preventDefault();
   del.oncontextmenu=e=>e.preventDefault();
   del.addEventListener('pointerdown',beginHold);
   ['pointerup','pointerleave','pointercancel'].forEach(t=>del.addEventListener(t,cancelHold));
   del.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter')beginHold(e)});
   del.addEventListener('keyup',e=>{if(e.key===' '||e.key==='Enter')cancelHold(e)});
  }
  inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();primary.click()}});
 }
 draw();
}

function installDutyDayPicker(){
 if(current!=='class-organisation'||window.__ccDutyDayPickerInstalled)return;
 const body=document.querySelector('#masterBody');if(!body)return;
 window.__ccDutyDayPickerInstalled=true;
 const DAY_NAMES=['Monday','Tuesday','Wednesday','Thursday','Friday'];
 const LABELS={Monday:'M',Tuesday:'T',Wednesday:'W',Thursday:'Th',Friday:'F'};
 function canonicalDay(v){
  const s=String(v||'').trim().toLowerCase().replace(/[^a-z]/g,'');
  if(s==='m'||s==='mon'||s==='monday')return'Monday';
  if(s==='t'||s==='tu'||s==='tue'||s==='tues'||s==='tuesday')return'Tuesday';
  if(s==='w'||s==='wed'||s==='weds'||s==='wednesday')return'Wednesday';
  if(s==='th'||s==='thu'||s==='thur'||s==='thurs'||s==='thursday')return'Thursday';
  if(s==='f'||s==='fri'||s==='friday')return'Friday';
  return'';
 }
 function apply(){
  body.querySelectorAll('tr[data-i]').forEach(tr=>{
   const inp=tr.querySelector('input[data-f="dutyDay"]');
   if(!inp||inp.dataset.ccDaysReady)return;
   inp.dataset.ccDaysReady='1';
   const raw=String(inp.value||'').split(/[;,]/).map(x=>x.trim()).filter(Boolean);
   const converted=raw.map(canonicalDay);
   if(raw.length&&converted.every(Boolean)){
    const canonical=DAY_NAMES.filter(d=>converted.includes(d)).join('; ');
    if(canonical!==inp.value.trim()){
     inp.value=canonical;
     inp.dispatchEvent(new Event('change',{bubbles:true}));
     return;
    }
   }
   const selected=new Set(converted.filter(Boolean));
   inp.classList.add('ccDutyDayOriginal');
   const wrap=document.createElement('div');wrap.className='ccDutyDays';wrap.setAttribute('aria-label','Duty days');
   for(const d of DAY_NAMES){
    const b=document.createElement('button');b.type='button';b.className='ccDutyDayChip'+(selected.has(d)?' active':'');b.textContent=LABELS[d];b.title=d;b.setAttribute('aria-pressed',selected.has(d)?'true':'false');
    b.onclick=e=>{e.preventDefault();e.stopPropagation();if(selected.has(d))selected.delete(d);else selected.add(d);inp.value=DAY_NAMES.filter(x=>selected.has(x)).join('; ');inp.dispatchEvent(new Event('change',{bubbles:true}))};
    wrap.appendChild(b);
   }
   inp.insertAdjacentElement('afterend',wrap);
  });
 }
 apply();
 const obs=new MutationObserver(()=>requestAnimationFrame(apply));obs.observe(body,{childList:true,subtree:true});
}

const root=document.createElement('div');root.id='ccEmbeddedLauncher';root.innerHTML='<button id="ccEmbeddedButton" type="button" aria-label="Open educational support tools">✦</button><div id="ccEmbeddedMenu"><div class="ccEmbeddedHead"><div class="ccEmbeddedTitle">Educational Support</div><button class="ccEmbeddedClose" type="button">×</button></div><div id="ccEmbeddedList"></div></div>';document.body.appendChild(root);
const btn=root.querySelector('#ccEmbeddedButton'),menu=root.querySelector('#ccEmbeddedMenu'),list=root.querySelector('#ccEmbeddedList');
function toolWindowName(slug){return 'ClassroomCompanionTool_'+slug.replace(/[^a-z0-9]/gi,'_')}
function closeMenu(){menu.classList.remove('show');btn.classList.remove('active')}
function render(){list.innerHTML='';for(const t of CORE){const b=document.createElement('button');b.type='button';b.className='ccEmbeddedTool'+(t.slug===current?' current':'');b.innerHTML=`<span class="ccIcon">${t.icon}</span><span class="ccTitle">${t.title}</span><span class="ccHint">${t.hint}</span>`;b.onclick=e=>{e.stopPropagation();openTool(t)};list.appendChild(b)}}
function openTool(t){if(t.slug===current){closeMenu();return}const sw=screen.availWidth||1280,sh=screen.availHeight||800,url=t.slug==='class-organisation'?'class-organisation.html?v='+Date.now():'support-tool.html?tool='+encodeURIComponent(t.slug)+'&v='+Date.now();const w=window.open(url,toolWindowName(t.slug),`popup=yes,width=${sw},height=${sh},left=0,top=0,resizable=yes,scrollbars=yes,toolbar=no,location=no,menubar=no,status=no`);if(w){try{w.focus()}catch(e){};closeMenu()}}
function show(next=''){current=String(next||'').trim();render();root.classList.remove('ccHidden');installClassManager();installDutyDayPicker()}function hide(){closeMenu();root.classList.add('ccHidden')}
btn.onclick=e=>{e.stopPropagation();if(menu.classList.contains('show'))closeMenu();else{render();menu.classList.add('show');btn.classList.add('active')}};root.querySelector('.ccEmbeddedClose').onclick=e=>{e.stopPropagation();closeMenu()};menu.onclick=e=>e.stopPropagation();document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.classList.contains('show'))closeMenu()},true);
window.ClassroomCompanionEmbeddedLauncher={show,hide,openTool};show(current);
})();