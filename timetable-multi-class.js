(function(){
'use strict';
const S=window.Support;
if(!S||S.slug!=='daily-visual-timetable'||window.__ccTimetableClassManagerV1)return;
window.__ccTimetableClassManagerV1=true;
const KEY='classroomCompanionWeeklyTimetableV1';
const read=()=>{try{const v=JSON.parse(localStorage.getItem(KEY)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}catch{return {}}};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function choose(n){const d=S.classData();d.classes=d.classes||{};if(!d.classes[n])d.classes[n]={};d.selectedClass=n;localStorage.setItem(S.CC_STORE,JSON.stringify(d));location.reload()}
function download(v,filename){const b=new Blob([JSON.stringify(v,null,2)],{type:'application/json'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=(filename||'classroom-companion-all-timetables')+'-'+new Date().toISOString().slice(0,10)+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000)}
function exportAll(){const a=read();if(!Object.keys(a).length)return alert('No saved class timetables yet.');download({app:'Classroom Companion',schema:1,kind:'all-timetables',created:new Date().toISOString(),data:a})}
function exportSelected(){
 const a=read(),name=document.querySelector('#ccTimetableClasses select')?.value||S.selectedClass();
 if(!a[name])return alert('Select a saved class timetable first.');
 download({app:'Classroom Companion',schema:1,kind:'timetable',edition:'en',created:new Date().toISOString(),data:{className:name,timetable:a[name]}},'classroom-companion-timetable-'+name.replace(/[^a-z0-9_-]/gi,'-'));
}
function importBackup(mode){
 const input=document.createElement('input');input.type='file';input.accept='.json,application/json';
 input.onchange=async()=>{
  const f=input.files?.[0];if(!f)return;
  try{
   if(f.size>2000000)throw Error('File too large');
   const o=JSON.parse(await f.text());
   if(o.app!=='Classroom Companion'||o.schema!==1)throw Error('This is not a Classroom Companion backup.');
   let incoming;
   if(o.kind==='all-timetables'&&mode==='all')incoming=o.data;
   else if(o.kind==='timetable'&&mode==='selected'&&o.data?.className&&o.data?.timetable)incoming={[o.data.className]:o.data.timetable};
   else throw Error(mode==='all'?'Choose an Export All timetable backup.':'Choose an Export Selected Class timetable backup.');
   if(!incoming||typeof incoming!=='object'||Array.isArray(incoming)||!Object.keys(incoming).length||
     !Object.entries(incoming).every(([n,v])=>n.trim()&&v&&typeof v==='object'&&!Array.isArray(v)&&v.className===n&&Array.isArray(v.times)&&v.days&&typeof v.days==='object'))
     throw Error('The timetable backup has missing or invalid class data.');
   const old=read(),names=Object.keys(incoming),over=names.filter(n=>Object.prototype.hasOwnProperty.call(old,n));
   if(!confirm('Import '+names.length+' class timetable(s): '+names.join(', ')+'.\\n'+
     (over.length?'Will replace existing: '+over.join(', ')+'.\\n':'No existing timetables will be replaced.\\n')+
     'All other saved classes will be preserved. Continue?'))return;
   if(Object.keys(old).length)exportAll();
   localStorage.setItem(KEY,JSON.stringify({...old,...incoming}));
   const d=S.classData();d.classes=d.classes||{};
   names.forEach(n=>{if(!d.classes[n])d.classes[n]={}});
   d.selectedClass=names[0];localStorage.setItem(S.CC_STORE,JSON.stringify(d));
   alert('Imported '+names.length+' timetable(s). The page will reload.');location.reload();
  }catch(e){alert('Import cancelled: '+e.message)}
 };
 input.click();
}
function render(){const panel=S.panel;if(!panel)return;const oldButtons=document.getElementById('ccBackupControls');if(oldButtons)oldButtons.style.display='none';const a=read(),names=Object.keys(a),existing=document.getElementById('ccTimetableClasses');if(existing)return;const bar=document.createElement('div');bar.id='ccTimetableClasses';bar.style.cssText='display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:10px 12px;margin:0 0 14px;background:#eff8f6;border:1px solid #c9e2dc;border-radius:14px;color:#17324d;font:800 13px system-ui';
const label=document.createElement('span');label.textContent='Saved classes:';bar.append(label);
const sel=document.createElement('select');sel.style.cssText='min-height:36px;max-width:180px;border:1px solid #b9d3ce;border-radius:8px;padding:5px;background:white';sel.innerHTML=names.length?names.map(n=>'<option value="'+esc(n)+'">'+esc(n)+'</option>').join(''):'<option>No timetables yet</option>';sel.disabled=!names.length;const selected=S.selectedClass();if(names.includes(selected))sel.value=selected;else if(names.length)sel.value=names[0];sel.onchange=()=>choose(sel.value);bar.append(sel);
for(const [name,fn] of [['⬇ Export Selected Class',exportSelected],['⬆ Import Selected Class',()=>importBackup('selected')],['⬇ Export All',exportAll],['⬆ Import All',()=>importBackup('all')]]){const b=document.createElement('button');b.type='button';b.textContent=name;b.style.cssText='min-height:36px;border:1px solid #b9d3ce;border-radius:8px;background:white;padding:5px 9px;font:800 12px system-ui;cursor:pointer';b.onclick=fn;bar.append(b)}
const note=document.createElement('span');note.textContent='Add another class by pasting its timetable screenshot and saving under a new class name.';note.style.cssText='font-size:11px;color:#506b69';bar.append(note);panel.insertBefore(bar,panel.firstChild)}
setInterval(render,650);render();
})();