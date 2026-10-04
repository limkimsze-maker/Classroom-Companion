(function(){
'use strict';
const S=window.Support;
if(!S||S.slug!=='daily-visual-timetable'||window.__ttIntuitiveFlow)return;
window.__ttIntuitiveFlow=true;

const $=s=>document.querySelector(s);
const DEFAULT_TEACHER='My Timetable';
const PROFILE_STORE='classroomCompanionTimetableProfilesV1';
const WEEK_STORE='classroomCompanionWeeklyTimetableV1';
const HIDDEN_STORE='classroomCompanionHiddenTimetablesV1';

function clean(v){return String(v??'').replace(/\s+/g,' ').trim()}
function safe(raw,f){return S.safe(raw,f)}
function hidden(){return safe(localStorage.getItem(HIDDEN_STORE),[])||[]}
function writeHidden(a){localStorage.setItem(HIDDEN_STORE,JSON.stringify([...new Set((a||[]).filter(Boolean))]))}
function unhide(name){writeHidden(hidden().filter(x=>x!==name))}
function selected(){return clean(S.selectedClass())||DEFAULT_TEACHER}
function closeModal(){document.querySelectorAll('.ttFlowOverlay').forEach(x=>x.remove())}
function readProfiles(){return safe(localStorage.getItem(PROFILE_STORE),{})||{}}
function writeProfiles(v){localStorage.setItem(PROFILE_STORE,JSON.stringify(v||{}))}

function ensureTeacherFallback(){
  const d=S.classData();d.classes=d.classes||{};
  if(!d.classes[DEFAULT_TEACHER])d.classes[DEFAULT_TEACHER]={};
  localStorage.setItem(S.CC_STORE,JSON.stringify(d));
  const p=readProfiles();p[DEFAULT_TEACHER]={...(p[DEFAULT_TEACHER]||{}),type:'teacher'};writeProfiles(p);
}

function createProfile(name,type){
  name=clean(name);if(!name)return false;
  const d=S.classData();d.classes=d.classes||{};
  if(!d.classes[name])d.classes[name]={};
  d.selectedClass=name;localStorage.setItem(S.CC_STORE,JSON.stringify(d));
  const p=readProfiles();p[name]={...(p[name]||{}),type:type==='teacher'?'teacher':'class'};writeProfiles(p);
  unhide(name);return true;
}

function ensureVisibleSelection(){
  ensureTeacherFallback();
  const cur=selected();if(cur===DEFAULT_TEACHER||!hidden().includes(cur))return;
  const d=S.classData();d.selectedClass=DEFAULT_TEACHER;localStorage.setItem(S.CC_STORE,JSON.stringify(d));
}

function injectStyle(){
  if($('#ttFlowStyle'))return;
  const s=document.createElement('style');s.id='ttFlowStyle';s.textContent=`
  .ttFlowOverlay{position:fixed;inset:0;background:rgba(15,23,42,.48);z-index:2147483647;display:grid;place-items:center;padding:18px;backdrop-filter:blur(5px);pointer-events:auto}
  .ttFlowCard{width:min(540px,100%);max-height:calc(100vh - 36px);overflow:auto;background:#fff;border:1px solid #d8e1e8;border-radius:24px;padding:24px;box-shadow:0 28px 80px rgba(15,23,42,.24);text-align:left;pointer-events:auto}
  .ttFlowCard h2{margin:0 0 6px;color:#17324d;font-size:27px;letter-spacing:-.02em}.ttFlowCard>p{margin:0 0 18px;color:#667085;font-weight:750;line-height:1.45}
  .ttFlowField{display:grid;gap:6px;margin:13px 0}.ttFlowField label{font-size:12px;font-weight:1000;color:#435466;text-transform:uppercase;letter-spacing:.06em}
  .ttFlowField input,.ttFlowField select{display:block;width:100%;min-height:48px;border:1px solid #cfdbe1;border-radius:12px;padding:10px 12px;background:#fff;color:#17324d;font-weight:900;pointer-events:auto;user-select:text;outline:none}
  .ttFlowField input:focus,.ttFlowField select:focus{border-color:#4fb8ab;box-shadow:0 0 0 4px rgba(15,118,110,.12)}
  .ttFlowChoices{display:grid;gap:10px}.ttFlowChoice{width:100%;border:1px solid #d8e1e8;border-radius:16px;background:#fff;padding:14px 16px;text-align:left;color:#17324d;font-weight:1000;font-size:15px;pointer-events:auto}
  .ttFlowChoice:hover{background:#f3fbf9;border-color:#80cfc4;transform:translateY(-1px)}.ttFlowChoice span{display:block;font-size:12px;color:#667085;font-weight:750;margin-top:4px;line-height:1.35}
  .ttFlowDanger{margin-top:18px;padding-top:16px;border-top:1px solid #edf1f3}.ttFlowDanger .ttFlowChoice{color:#b42318;background:#fff8f7;border-color:#f0c2bd}.ttFlowDanger .ttFlowChoice span{color:#8f4b44}
  .ttFlowDanger .ttFlowChoice:disabled{opacity:.48;cursor:not-allowed;transform:none}.ttFlowButtons{display:flex;justify-content:flex-end;gap:9px;margin-top:20px;flex-wrap:wrap}
  .ttManagedNav #ttNavUpdate{min-width:94px}.ttWeekActions.ttFlowHiddenActions{display:none!important}
  @media(max-width:620px){.ttFlowCard{padding:20px;border-radius:20px}}
  `;document.head.appendChild(s);
}

function openNew(){
  closeModal();
  const o=document.createElement('div');o.className='ttFlowOverlay';
  o.innerHTML=`<div class="ttFlowCard" role="dialog" aria-modal="true" aria-labelledby="ttNewTitle">
    <h2 id="ttNewTitle">New timetable</h2>
    <p>Create another timetable, then add its timetable screenshot.</p>
    <div class="ttFlowField"><label for="ttNewType">Timetable for</label><select id="ttNewType"><option value="class">👥 Class</option><option value="teacher">👨‍🏫 Teacher</option></select></div>
    <div class="ttFlowField"><label for="ttNewName">Name</label><input id="ttNewName" type="text" autocomplete="off" spellcheck="false" placeholder="e.g. 3C or Mr Lim"></div>
    <div class="ttFlowButtons"><button type="button" class="btn" id="ttNewCancel">Cancel</button><button type="button" class="btn primary" id="ttNewCreate">＋ Create timetable</button></div>
  </div>`;
  document.body.appendChild(o);
  const type=o.querySelector('#ttNewType'),name=o.querySelector('#ttNewName'),create=o.querySelector('#ttNewCreate');
  o.addEventListener('mousedown',e=>{if(e.target===o)closeModal()});
  o.querySelector('#ttNewCancel').onclick=closeModal;
  type.onchange=()=>{if(type.value==='teacher'&&!clean(name.value))name.placeholder='e.g. Mr Lim';else if(type.value==='class')name.placeholder='e.g. 3C'};
  create.onclick=()=>{
    const n=clean(name.value);if(!n){name.focus();name.select();return}
    createProfile(n,type.value);closeModal();S.toast?.('Timetable created');setTimeout(()=>location.reload(),120);
  };
  name.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();create.click()}else if(e.key==='Escape'){e.preventDefault();closeModal()}});
  setTimeout(()=>{name.focus();name.click()},40);
}

function waitFor(selector,fn,limit=40){let n=0;const id=setInterval(()=>{const el=$(selector);if(el){clearInterval(id);fn(el)}else if(++n>=limit)clearInterval(id)},50)}

function quickEdit(){
  closeModal();
  const edit=$('#ttEditWeek');if(edit){edit.click();return}
  const week=$('#ttNavWeek');if(week){week.click();waitFor('#ttEditWeek',b=>b.click())}
}

function replaceFromScreenshot(){
  closeModal();
  const show=()=>{const d=$('#ttImportDrawer');if(!d)return false;d.hidden=false;setTimeout(()=>d.scrollIntoView({behavior:'smooth',block:'start'}),30);return true};
  if(show())return;
  const today=$('#ttNavToday');if(today){today.click();waitFor('#ttImportDrawer',()=>show())}
}

function deleteCurrent(){
  const name=selected();
  if(name===DEFAULT_TEACHER){alert('“My Timetable” is the built-in fallback and cannot be deleted. You can edit or replace its contents.');return}
  if(!confirm(`Delete “${name}” timetable?\n\nOnly its timetable is removed. Any class/pupil roster with the same name is kept.`))return;

  writeHidden([...hidden(),name]);
  const p=readProfiles();delete p[name];writeProfiles(p);
  const store=window.ClassroomTimetableData?.STORE||WEEK_STORE;
  const a=safe(localStorage.getItem(store),{})||{};delete a[name];localStorage.setItem(store,JSON.stringify(a));

  ensureTeacherFallback();
  const d=S.classData(),blocked=new Set(hidden()),names=Object.keys(d.classes||{}).filter(n=>n!==name&&!blocked.has(n));
  d.selectedClass=names[0]||DEFAULT_TEACHER;localStorage.setItem(S.CC_STORE,JSON.stringify(d));
  closeModal();S.toast?.('Timetable deleted');setTimeout(()=>location.reload(),140);
}

function openEdit(){
  closeModal();
  const name=selected(),canDelete=name!==DEFAULT_TEACHER;
  const o=document.createElement('div');o.className='ttFlowOverlay';
  o.innerHTML=`<div class="ttFlowCard" role="dialog" aria-modal="true" aria-labelledby="ttEditTitle">
    <h2 id="ttEditTitle">Edit ${name.replace(/[&<>]/g,'')}</h2>
    <p>Choose what you want to change.</p>
    <div class="ttFlowChoices">
      <button type="button" class="ttFlowChoice" id="ttFlowQuick">✏️ Quick edit subjects<span>Change individual lesson cells directly.</span></button>
      <button type="button" class="ttFlowChoice" id="ttFlowReplace">📷 Replace from screenshot<span>Paste or choose a newer screenshot for this timetable.</span></button>
    </div>
    <div class="ttFlowDanger"><button type="button" class="ttFlowChoice" id="ttFlowDelete" ${canDelete?'':'disabled'}>🗑️ Delete this timetable<span>${canDelete?'Remove this timetable only. The class/pupil roster is kept.':'My Timetable is the built-in fallback.'}</span></button></div>
    <div class="ttFlowButtons"><button type="button" class="btn" id="ttFlowCancel">Cancel</button></div>
  </div>`;
  document.body.appendChild(o);
  o.addEventListener('mousedown',e=>{if(e.target===o)closeModal()});
  o.querySelector('#ttFlowCancel').onclick=closeModal;
  o.querySelector('#ttFlowQuick').onclick=quickEdit;
  o.querySelector('#ttFlowReplace').onclick=replaceFromScreenshot;
  if(canDelete)o.querySelector('#ttFlowDelete').onclick=deleteCurrent;
}

function filterHiddenOptions(){
  const h=new Set(hidden());document.querySelectorAll('#classSelect option').forEach(opt=>{if(opt.value!==DEFAULT_TEACHER&&h.has(opt.value))opt.remove()});
}

function bindNewButton(){
  const old=$('#addClassInline');if(!old)return;
  if(old.dataset.ttFlowBound==='1'){old.textContent='＋ New';old.title='Create another timetable';return}
  const b=old.cloneNode(true);b.dataset.ttFlowBound='1';b.dataset.ttProfileBound='1';b.textContent='＋ New';b.title='Create another timetable';b.type='button';
  b.onclick=e=>{e.preventDefault();e.stopPropagation();openNew()};old.replaceWith(b);
}

function bindEditButton(){
  const old=$('#ttNavUpdate');if(!old)return;
  if(old.dataset.ttFlowBound==='1'){old.textContent='✏️ Edit';old.title='Edit, replace or delete this timetable';return}
  const b=old.cloneNode(true);b.dataset.ttFlowBound='1';b.textContent='✏️ Edit';b.title='Edit, replace or delete this timetable';b.type='button';
  b.onclick=e=>{e.preventDefault();e.stopPropagation();openEdit()};old.replaceWith(b);
}

function decorate(){
  const label=$('.ttProfileLabel');if(label)label.textContent='Viewing';
  bindNewButton();bindEditButton();filterHiddenOptions();
  const weekQuick=$('#ttEditWeek');if(weekQuick){const actions=weekQuick.closest('.ttWeekActions');if(actions)actions.classList.add('ttFlowHiddenActions')}
}

ensureVisibleSelection();injectStyle();
const observer=new MutationObserver(()=>requestAnimationFrame(decorate));observer.observe(S.panel,{childList:true,subtree:true});
decorate();
})();