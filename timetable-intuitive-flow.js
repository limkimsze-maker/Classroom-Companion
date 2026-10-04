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
function hidden(){return S.safe(localStorage.getItem(HIDDEN_STORE),[])||[]}
function writeHidden(a){localStorage.setItem(HIDDEN_STORE,JSON.stringify([...new Set(a.filter(Boolean))]))}
function unhide(name){writeHidden(hidden().filter(x=>x!==name))}
function selected(){return clean(S.selectedClass())||DEFAULT_TEACHER}
function closeModal(){document.querySelector('.ttFlowOverlay')?.remove()}

function patchClassNames(){
  if(S.__ttOriginalClassNames)return;
  S.__ttOriginalClassNames=S.classNames.bind(S);
  S.classNames=function(){const h=new Set(hidden());return S.__ttOriginalClassNames().filter(n=>n===DEFAULT_TEACHER||!h.has(n))};
}

function ensureVisibleSelection(){
  const cur=selected(),h=new Set(hidden());
  if(cur===DEFAULT_TEACHER||!h.has(cur))return;
  const d=S.classData();d.classes=d.classes||{};
  if(!d.classes[DEFAULT_TEACHER])d.classes[DEFAULT_TEACHER]={};
  d.selectedClass=DEFAULT_TEACHER;
  localStorage.setItem(S.CC_STORE,JSON.stringify(d));
}

function injectStyle(){
  if($('#ttFlowStyle'))return;
  const s=document.createElement('style');s.id='ttFlowStyle';s.textContent=`
  .ttFlowOverlay{position:fixed;inset:0;background:rgba(15,23,42,.48);z-index:2147483646;display:grid;place-items:center;padding:18px;backdrop-filter:blur(5px)}
  .ttFlowCard{width:min(530px,100%);background:#fff;border:1px solid #d8e1e8;border-radius:24px;padding:24px;box-shadow:0 28px 80px rgba(15,23,42,.24);text-align:left}
  .ttFlowCard h2{margin:0 0 6px;color:#17324d;font-size:27px;letter-spacing:-.02em}.ttFlowCard>p{margin:0 0 18px;color:#667085;font-weight:750;line-height:1.45}
  .ttFlowChoices{display:grid;gap:10px}.ttFlowChoice{width:100%;border:1px solid #d8e1e8;border-radius:16px;background:#fff;padding:14px 16px;text-align:left;color:#17324d;font-weight:1000;font-size:15px}
  .ttFlowChoice:hover{background:#f3fbf9;border-color:#80cfc4;transform:translateY(-1px)}.ttFlowChoice span{display:block;font-size:12px;color:#667085;font-weight:750;margin-top:4px;line-height:1.35}
  .ttFlowDanger{margin-top:18px;padding-top:16px;border-top:1px solid #edf1f3}.ttFlowDanger .ttFlowChoice{color:#b42318;background:#fff8f7;border-color:#f0c2bd}.ttFlowDanger .ttFlowChoice span{color:#8f4b44}
  .ttFlowDanger .ttFlowChoice:disabled{opacity:.48;cursor:not-allowed;transform:none}.ttFlowCancel{display:flex;justify-content:flex-end;margin-top:16px}
  .ttManagedNav #ttNavUpdate{min-width:94px}.ttWeekActions.ttFlowHiddenActions{display:none!important}
  `;document.head.appendChild(s);
}

function openNew(){
  const P=window.ClassroomTimetableProfiles;
  if(!P?.openAddDialog)return;
  P.openAddDialog();
  setTimeout(()=>{
    const o=document.querySelector('.ttProfileOverlay');if(!o)return;
    const h=o.querySelector('h2');if(h)h.textContent='New timetable';
    const p=o.querySelector('p');if(p)p.textContent='Create another timetable to switch between. It can be for a class or for a teacher.';
    const lab=o.querySelector('label[for="ttProfileType"]');if(lab)lab.textContent='Timetable for';
    const save=o.querySelector('#ttProfileSave');
    if(save){
      save.textContent='＋ Create timetable';
      const old=save.onclick;
      save.onclick=function(e){const n=clean(o.querySelector('#ttProfileName')?.value);if(n)unhide(n);return old?.call(this,e)};
    }
  },0);
}

function deleteCurrent(){
  const name=selected();
  if(name===DEFAULT_TEACHER){alert('“My Timetable” is kept as the built-in fallback. You can edit or replace its contents, but it cannot be deleted.');return}
  if(!confirm(`Delete “${name}” timetable?\n\nThis removes the saved timetable from this browser. Your pupil/class roster is not deleted.`))return;

  writeHidden([...hidden(),name]);
  const profiles=S.safe(localStorage.getItem(PROFILE_STORE),{})||{};delete profiles[name];localStorage.setItem(PROFILE_STORE,JSON.stringify(profiles));
  const store=window.ClassroomTimetableData?.STORE||WEEK_STORE;
  const all=S.safe(localStorage.getItem(store),{})||{};delete all[name];localStorage.setItem(store,JSON.stringify(all));

  const d=S.classData();d.classes=d.classes||{};if(!d.classes[DEFAULT_TEACHER])d.classes[DEFAULT_TEACHER]={};
  const next=S.classNames().find(n=>n!==name)||DEFAULT_TEACHER;d.selectedClass=next;localStorage.setItem(S.CC_STORE,JSON.stringify(d));
  S.toast?.('Timetable deleted');setTimeout(()=>location.reload(),160);
}

function quickEdit(){
  closeModal();
  $('#ttNavWeek')?.click();
  let tries=0;const timer=setInterval(()=>{const b=$('#ttEditWeek');if(b){clearInterval(timer);b.click()}else if(++tries>30)clearInterval(timer)},50);
}

function openEdit(originalUpdate){
  closeModal();
  const name=selected(),canDelete=name!==DEFAULT_TEACHER;
  const o=document.createElement('div');o.className='ttFlowOverlay';o.innerHTML=`<div class="ttFlowCard" role="dialog" aria-modal="true" aria-labelledby="ttFlowTitle">
    <h2 id="ttFlowTitle">Edit ${name.replace(/[&<>]/g,'')}</h2>
    <p>Choose what you want to change.</p>
    <div class="ttFlowChoices">
      <button class="ttFlowChoice" id="ttFlowQuick">✏️ Quick edit subjects<span>Change individual lesson cells in the weekly timetable.</span></button>
      <button class="ttFlowChoice" id="ttFlowReplace">📷 Replace from screenshot<span>Paste or choose a newer timetable screenshot and replace this timetable.</span></button>
    </div>
    <div class="ttFlowDanger"><button class="ttFlowChoice" id="ttFlowDelete" ${canDelete?'':'disabled'}>🗑️ Delete this timetable<span>${canDelete?'Remove this timetable only. Your class/pupil roster is kept.':'My Timetable is the built-in fallback and is kept.'}</span></button></div>
    <div class="ttFlowCancel"><button class="btn" id="ttFlowCancel">Cancel</button></div>
  </div>`;
  document.body.appendChild(o);
  o.addEventListener('click',e=>{if(e.target===o)closeModal()});
  $('#ttFlowCancel').onclick=closeModal;
  $('#ttFlowQuick').onclick=quickEdit;
  $('#ttFlowReplace').onclick=()=>{closeModal();originalUpdate?.()};
  if(canDelete)$('#ttFlowDelete').onclick=deleteCurrent;
}

function decorate(){
  const label=$('.ttProfileLabel');if(label)label.textContent='Viewing';
  const add=$('#addClassInline');if(add){add.textContent='＋ New';add.title='Create another timetable';if(!add.dataset.ttFlowNew){add.dataset.ttFlowNew='1';add.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();openNew()},true)}}

  const edit=$('#ttNavUpdate');
  if(edit&&!edit.dataset.ttFlowEdit){
    edit.dataset.ttFlowEdit='1';edit.textContent='✏️ Edit';edit.title='Edit, replace or delete this timetable';
    const original=edit.onclick;
    edit.onclick=e=>{e?.preventDefault?.();openEdit(()=>original?.call(edit,e))};
  }else if(edit)edit.textContent='✏️ Edit';

  const weekQuick=$('#ttEditWeek');
  if(weekQuick){const actions=weekQuick.closest('.ttWeekActions');if(actions)actions.classList.add('ttFlowHiddenActions')}

  document.querySelectorAll('#classSelect option').forEach(opt=>{if(hidden().includes(opt.value)&&opt.value!==DEFAULT_TEACHER)opt.remove()});
}

patchClassNames();ensureVisibleSelection();injectStyle();
const observer=new MutationObserver(()=>requestAnimationFrame(decorate));observer.observe(S.panel,{childList:true,subtree:true});
decorate();
})();