(function(){
'use strict';
const S=window.Support;
if(!S||S.slug!=='daily-visual-timetable'||window.__ttProfileSelector)return;
window.__ttProfileSelector=true;

const PROFILE_STORE='classroomCompanionTimetableProfilesV1';
const DEFAULT_TEACHER='My Timetable';
let scheduled=false;

function clean(v){return String(v??'').replace(/\s+/g,' ').trim()}
function readProfiles(){return S.safe(localStorage.getItem(PROFILE_STORE),{})||{}}
function writeProfiles(v){localStorage.setItem(PROFILE_STORE,JSON.stringify(v||{}))}
function profileType(name){return readProfiles()[name]?.type||(name===DEFAULT_TEACHER?'teacher':'class')}
function rememberProfile(name,type){const p=readProfiles();const next=type==='teacher'?'teacher':'class';if(p[name]?.type===next)return;p[name]={...(p[name]||{}),type:next};writeProfiles(p)}

function ensureNamedProfile(name,type='class',selectIt=false){
  name=clean(name);if(!name)return false;
  const d=S.classData();d.classes=d.classes||{};
  if(!d.classes[name])d.classes[name]={};
  if(selectIt)d.selectedClass=name;
  localStorage.setItem(S.CC_STORE,JSON.stringify(d));
  rememberProfile(name,type);
  return true;
}

function seedTeacherProfile(){
  const d=S.classData(),hadSelection=!!clean(d.selectedClass);d.classes=d.classes||{};
  let changed=false;
  if(!d.classes[DEFAULT_TEACHER]){d.classes[DEFAULT_TEACHER]={};changed=true}
  if(!hadSelection&&Object.keys(d.classes).length===1){d.selectedClass=DEFAULT_TEACHER;changed=true}
  if(changed)localStorage.setItem(S.CC_STORE,JSON.stringify(d));
  rememberProfile(DEFAULT_TEACHER,'teacher');
}

function installSubjectAliases(){
  const T=window.ClassroomTimetableData;if(!T||T.__subjectAliasesInstalled)return;
  T.__subjectAliasesInstalled=true;const oldIcon=T.icon;
  T.icon=function(subject){
    const s=clean(subject).toUpperCase();
    if(!s)return'✏️';
    if(/^(RECESS|BREAK)$/.test(s))return'🍎';
    if(/^(MATH|MATHS|MATHEMATICS)$/.test(s))return'🔢';
    if(/^(SC|SCI|SCIENCE)$/.test(s))return'🔬';
    if(/^(SS|SOCIAL STUDIES)$/.test(s))return'🌏';
    if(/^MUSIC$/.test(s))return'🎵';
    if(/^ART$/.test(s))return'🎨';
    if(/^(PE|PHYSICAL EDUCATION)$/.test(s))return'⚽';
    if(/^(MTL|MOTHER TONGUE|CHINESE|CL|HCL|MALAY|ML|TAMIL|TL)$/.test(s))return'🗣️';
    if(/^(EL|ENGLISH|ENGLISH LANGUAGE|LSP)$/.test(s))return'📚';
    if(/^(FTGP|FORM TEACHER GUIDANCE PERIOD|CCE)$/.test(s))return'🌟';
    if(/^(ASSEMBLY|ASSEMB)$/.test(s))return'🏫';
    if(/^POP$/.test(s))return'🧩';
    if(/^(PAL|PROGRAMME FOR ACTIVE LEARNING)$/.test(s))return'🎯';
    if(/^(ICT|COMPUTING|COMPUTER|ROBOTICS)$/.test(s))return'💻';
    return oldIcon?oldIcon(subject):'✏️';
  };
}

function decorateSelector(){
  scheduled=false;installSubjectAliases();
  const bar=document.querySelector('.classBar');if(!bar)return;
  const select=bar.querySelector('#classSelect');
  if(select){
    if(select.getAttribute('aria-label')!=='Choose timetable')select.setAttribute('aria-label','Choose timetable');
    const existing=new Set([...select.options].map(o=>o.dataset.ttRawName||o.value));
    for(const name of S.classNames()){
      if(existing.has(name))continue;
      const opt=document.createElement('option');opt.value=name;opt.dataset.ttRawName=name;select.appendChild(opt);
    }
    [...select.options].forEach(opt=>{
      const raw=opt.dataset.ttRawName||opt.value||clean(opt.textContent.replace(/^[^A-Za-z0-9]+/,''));
      opt.dataset.ttRawName=raw;if(opt.value!==raw)opt.value=raw;
      const expected=(profileType(raw)==='teacher'?'👨‍🏫 ':'👥 ')+raw;
      if(opt.textContent!==expected)opt.textContent=expected;
    });
    const chosen=S.selectedClass();if(chosen&&select.value!==chosen)select.value=chosen;
    let label=bar.querySelector('.ttProfileLabel');
    if(!label){label=document.createElement('span');label.className='ttProfileLabel';label.textContent='Viewing';bar.insertBefore(label,select)}
    else if(label.textContent!=='Viewing')label.textContent='Viewing';
  }
  document.querySelectorAll('.ttBar label b').forEach(b=>{if(b.textContent.trim()==='Class')b.textContent='Timetable name'});
}

function scheduleDecorate(){if(scheduled)return;scheduled=true;requestAnimationFrame(decorateSelector)}

seedTeacherProfile();installSubjectAliases();
const observer=new MutationObserver(scheduleDecorate);observer.observe(S.panel,{childList:true,subtree:true});
scheduleDecorate();
window.addEventListener('storage',e=>{if(e.key===S.CC_STORE||e.key===PROFILE_STORE)scheduleDecorate()});
window.ClassroomTimetableProfiles={add:ensureNamedProfile,type:profileType,store:PROFILE_STORE};
})();