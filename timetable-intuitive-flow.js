(function(){
'use strict';
const S=window.Support;
if(!S||S.slug!=='daily-visual-timetable'||window.__ttSimpleMode)return;
window.__ttSimpleMode=true;
const STORE='classroomCompanionWeeklyTimetableV1';
const $=s=>document.querySelector(s);
function safe(raw,f){return S.safe(raw,f)||f}
function all(){return safe(localStorage.getItem(STORE),{})}
function selected(){return String(S.selectedClass()||'').trim()}
function loadScript(src){return new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=no;document.body.appendChild(s)})}
function deleteTimetable(){
  const name=selected(),data=window.ClassroomTimetableData?.load?.();
  const key=String(data?.className||name||'').trim();
  if(!key)return;
  if(!confirm(`Delete ${key} timetable?`))return;
  const a=all();delete a[key];localStorage.setItem(STORE,JSON.stringify(a));
  const d=S.classData();d.classes=d.classes||{};
  const c=d.classes[key],hasNames=Array.isArray(c?.names)&&c.names.length;
  if(!hasNames)delete d.classes[key];
  const next=Object.keys(a)[0]||'';d.selectedClass=next;localStorage.setItem(S.CC_STORE,JSON.stringify(d));
  location.reload();
}
function tidy(){
  document.getElementById('classBtn')?.classList.add('hidden');
  const add=$('#addClassInline');if(add)add.style.display='none';
  const bar=document.querySelector('.classBar'),sel=$('#classSelect'),keys=new Set(Object.keys(all()));
  if(sel){
    [...sel.options].forEach(o=>{if(!keys.has(o.value))o.remove()});
    if(!sel.options.length){sel.style.display='none';if(bar)bar.style.display='none'}
    else{sel.style.display='';if(bar)bar.style.display='flex'}
  }else if(bar&&!keys.size)bar.style.display='none';
  document.querySelectorAll('.ttCell').forEach(i=>{if(!i.dataset.scFixed&&String(i.value||'').trim().toUpperCase()==='SCIENCE'){i.dataset.scFixed='1';i.value='SC';i.dispatchEvent(new Event('input',{bubbles:true}))}});
  const T=window.ClassroomTimetableData,data=T?.load?.();
  if(data&&bar&&!$('#ttDeleteSimple')){
    const b=document.createElement('button');b.id='ttDeleteSimple';b.className='btn danger';b.type='button';b.textContent='🗑️ Delete timetable';b.onclick=deleteTimetable;bar.appendChild(b);
  }
}
async function boot(){
  try{
    await loadScript('timetable-screenshot.js?v=20261004simple1');
    await loadScript('timetable-print.js?v=20261004simple1');
    await loadScript('timetable-subject-aliases.js?v=20261004simple1');
    await loadScript('timetable-side-layout.js?v=20261004layout1');
  }catch(e){console.error(e)}
  tidy();setInterval(tidy,500);
}
boot();
})();