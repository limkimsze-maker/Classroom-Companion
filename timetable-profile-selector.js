(function(){
'use strict';
const S=window.Support;
if(!S||S.slug!=='daily-visual-timetable'||window.__ttProfileSelector)return;
window.__ttProfileSelector=true;

const PROFILE_STORE='classroomCompanionTimetableProfilesV1';
const DEFAULT_TEACHER='My Timetable';
const $=s=>document.querySelector(s);

function readProfiles(){return S.safe(localStorage.getItem(PROFILE_STORE),{})||{}}
function writeProfiles(v){localStorage.setItem(PROFILE_STORE,JSON.stringify(v||{}))}
function profileType(name){const p=readProfiles();return p[name]?.type||(name===DEFAULT_TEACHER?'teacher':'class')}
function rememberProfile(name,type){const p=readProfiles();p[name]={...(p[name]||{}),type:type==='teacher'?'teacher':'class'};writeProfiles(p)}
function clean(v){return String(v??'').replace(/\s+/g,' ').trim()}
function esc(v){return S.esc?S.esc(v):String(v??'')}

function ensureNamedProfile(name,type='class',selectIt=false){
  name=clean(name);
  if(!name)return false;
  const d=S.classData();
  d.classes=d.classes||{};
  if(!d.classes[name])d.classes[name]={};
  if(selectIt)d.selectedClass=name;
  localStorage.setItem(S.CC_STORE,JSON.stringify(d));
  rememberProfile(name,type);
  return true;
}

function seedTeacherProfile(){
  const d=S.classData(),hadSelection=!!clean(d.selectedClass);
  d.classes=d.classes||{};
  if(!d.classes[DEFAULT_TEACHER])d.classes[DEFAULT_TEACHER]={};
  if(!hadSelection&&Object.keys(d.classes).length===1)d.selectedClass=DEFAULT_TEACHER;
  localStorage.setItem(S.CC_STORE,JSON.stringify(d));
  rememberProfile(DEFAULT_TEACHER,'teacher');
}

function injectStyles(){
  if($('#ttProfileStyle'))return;
  const s=document.createElement('style');
  s.id='ttProfileStyle';
  s.textContent=`
  .ttProfileLabel{font-size:12px;font-weight:1000;color:#667085;text-transform:uppercase;letter-spacing:.08em;margin-right:2px}
  .ttProfileOverlay{position:fixed;inset:0;background:rgba(15,23,42,.46);display:grid;place-items:center;padding:18px;z-index:2147483646;backdrop-filter:blur(5px)}
  .ttProfileDialog{width:min(520px,100%);background:#fff;border:1px solid #d8e1e8;border-radius:24px;padding:24px;box-shadow:0 28px 80px rgba(15,23,42,.24);text-align:left}
  .ttProfileDialog h2{margin:0 0 8px;color:#17324d;font-size:27px;letter-spacing:-.02em}.ttProfileDialog p{margin:0 0 18px;color:#667085;font-weight:750;line-height:1.45}
  .ttProfileField{display:grid;gap:6px;margin:13px 0}.ttProfileField label{font-size:12px;font-weight:1000;color:#435466;text-transform:uppercase;letter-spacing:.06em}
  .ttProfileField input,.ttProfileField select{width:100%;min-height:46px;border:1px solid #d8e1e8;border-radius:12px;padding:9px 11px;background:#fff;color:#17324d;font-weight:900}
  .ttProfileButtons{display:flex;justify-content:flex-end;gap:9px;margin-top:20px;flex-wrap:wrap}
  @media(max-width:620px){.ttProfileLabel{width:100%;text-align:center}.ttProfileDialog{padding:20px;border-radius:20px}}
  `;
  document.head.appendChild(s);
}

function closeDialog(){document.querySelector('.ttProfileOverlay')?.remove()}
function openDialog(){
  closeDialog();
  const overlay=document.createElement('div');
  overlay.className='ttProfileOverlay';
  overlay.innerHTML=`<div class="ttProfileDialog" role="dialog" aria-modal="true" aria-labelledby="ttProfileTitle">
    <h2 id="ttProfileTitle">Add timetable</h2>
    <p>Create a timetable on its own. A class timetable does not need a pupil list, and a teacher timetable can be kept separately from all classes.</p>
    <div class="ttProfileField"><label for="ttProfileType">Type</label><select id="ttProfileType"><option value="class">👥 Class timetable</option><option value="teacher">👨‍🏫 Teacher timetable</option></select></div>
    <div class="ttProfileField"><label for="ttProfileName">Name</label><input id="ttProfileName" autocomplete="off" placeholder="e.g. 3 Respect"></div>
    <div class="ttProfileButtons"><button class="btn" id="ttProfileCancel">Cancel</button><button class="btn primary" id="ttProfileSave">＋ Add timetable</button></div>
  </div>`;
  document.body.appendChild(overlay);
  const type=overlay.querySelector('#ttProfileType'),name=overlay.querySelector('#ttProfileName');
  type.onchange=()=>{if(type.value==='teacher'&&!clean(name.value))name.value=DEFAULT_TEACHER;else if(type.value==='class'&&name.value===DEFAULT_TEACHER)name.value=''};
  overlay.querySelector('#ttProfileCancel').onclick=closeDialog;
  overlay.addEventListener('click',e=>{if(e.target===overlay)closeDialog()});
  overlay.querySelector('#ttProfileSave').onclick=()=>{
    const n=clean(name.value);
    if(!n){name.focus();return}
    ensureNamedProfile(n,type.value,true);
    S.toast?.('Timetable added');
    setTimeout(()=>location.reload(),120);
  };
  name.addEventListener('keydown',e=>{if(e.key==='Enter')overlay.querySelector('#ttProfileSave').click();if(e.key==='Escape')closeDialog()});
  setTimeout(()=>name.focus(),20);
}

function decorateSelector(){
  const bar=document.querySelector('.classBar');
  if(!bar)return;
  const select=bar.querySelector('#classSelect');
  if(select){
    select.setAttribute('aria-label','Choose timetable');
    [...select.options].forEach(opt=>{
      const raw=opt.dataset.ttRawName||opt.value||opt.textContent.replace(/^[^A-Za-z0-9]+/,'').trim();
      opt.dataset.ttRawName=raw;
      opt.value=raw;
      opt.textContent=(profileType(raw)==='teacher'?'👨‍🏫 ':'👥 ')+raw;
    });
    if(!bar.querySelector('.ttProfileLabel')){
      const label=document.createElement('span');label.className='ttProfileLabel';label.textContent='Timetable';bar.insertBefore(label,select);
    }
  }
  const add=bar.querySelector('#addClassInline');
  if(add&&!add.dataset.ttProfileBound){
    const fresh=add.cloneNode(true);
    fresh.dataset.ttProfileBound='1';
    fresh.textContent='＋ Add timetable';
    fresh.title='Add a class or teacher timetable';
    add.replaceWith(fresh);
    fresh.onclick=e=>{e.preventDefault();e.stopPropagation();openDialog()};
  }
  document.querySelectorAll('.ttBar label b').forEach(b=>{if(b.textContent.trim()==='Class')b.textContent='Timetable name'});
}

seedTeacherProfile();
injectStyles();
const observer=new MutationObserver(()=>requestAnimationFrame(decorateSelector));
observer.observe(S.panel,{childList:true,subtree:true});
decorateSelector();
window.addEventListener('storage',e=>{if(e.key===S.CC_STORE||e.key===PROFILE_STORE)decorateSelector()});
window.ClassroomTimetableProfiles={add:ensureNamedProfile,openAddDialog:openDialog,type:profileType,store:PROFILE_STORE};
})();