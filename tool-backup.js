(function(){
'use strict';
const p=new URLSearchParams(location.search);
const page=location.pathname.split('/').pop();
const slug=p.get('tool')||'';
const isReward=page==='reward-points.html';
const isTimetable=page==='support-tool.html'&&slug==='daily-visual-timetable';
const isCustom=page==='custom-text.html';
const isEditable=page==='support-tool.html'&&['question-spinner','reflect'].includes(slug)||page==='quote.html';
if(!isReward&&!isTimetable&&!isCustom&&!isEditable)return;
const rewardKey='classroomCompanionRewardPointsV1',timetableKey='classroomCompanionWeeklyTimetableV1',customKey='classroom-companion-custom-text-v1';
const mode=isReward?(p.get('mode')==='group'?'group':'pupil'):null;
const type=page==='quote.html'?'quote':slug==='reflect'?'reflection':'sentence';
const edition=/Chinese-Edition/i.test(location.pathname)?'zh':/Malay-Edition/i.test(location.pathname)?'ms':/Tamil-Edition/i.test(location.pathname)?'ta':'en';
const editKey='classroomCompanionEditableContentV1:'+edition+':'+type;
const kind=isReward?'reward-'+mode:isTimetable?'timetable':isCustom?'custom-text':'editable-'+type;
const key=isReward?rewardKey:isTimetable?timetableKey:isCustom?customKey:editKey;
function parse(raw){try{return JSON.parse(raw)}catch(e){return null}}
function validObject(x){return !!x&&typeof x==='object'&&!Array.isArray(x)}
function getClass(){return isTimetable?(window.Support?.selectedClass?.()||window.ClassroomTimetableData?.load?.()?.className||'General'):(document.getElementById('classSelect')?.value||'General')}
function classKey(){const c=getClass();return !c||c==='General'?'_general':c}
function current(){const value=parse(localStorage.getItem(key));if(isReward){const all=validObject(value)?value:{};const v=all[classKey()]||{};return {className:getClass(),scores:v[mode==='pupil'?'pupils':'groups']||{},history:(Array.isArray(v.history)?v.history:[]).filter(h=>h.kind===(mode==='pupil'?'pupils':'groups'))}}if(isTimetable){const all=validObject(value)?value:{};const n=getClass();return {className:n,timetable:all[n]||null}}return value}
function download(obj){const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='classroom-companion-'+kind+'-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)}
function exportData(){if(isTimetable&&!current().timetable){alert('No saved timetable for this class to export.');return false}download({app:'Classroom Companion',schema:1,kind,edition,created:new Date().toISOString(),data:current()});return true}
function validate(data){
 if(isReward)return validObject(data)&&validObject(data.scores)&&Array.isArray(data.history)&&typeof data.className==='string'&&Object.values(data.scores).every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0)&&data.history.every(h=>validObject(h)&&h.kind===(mode==='pupil'?'pupils':'groups'));
 if(isTimetable)return validObject(data)&&typeof data.className==='string'&&validObject(data.timetable)&&typeof data.timetable.className==='string'&&data.className===data.timetable.className;
 if(isCustom)return validObject(data)&&typeof data.heading==='string'&&typeof data.body==='string'&&Number.isFinite(Number(data.fontSize));
 return Array.isArray(data)&&data.length>0&&data.every(x=>typeof x==='string');
}
function restoreData(data){
 const old=localStorage.getItem(key);
 try{
  if(isReward){
   const all=parse(old)||{},c=classKey(),v=validObject(all[c])?all[c]:{pupils:{},groups:{},history:[]},field=mode==='pupil'?'pupils':'groups';
   v[field]=data.scores;v.history=(Array.isArray(v.history)?v.history:[]).filter(h=>h.kind!==field).concat(data.history).slice(-100);all[c]=v;
   localStorage.setItem(key,JSON.stringify(all));
  }else if(isTimetable){const all=validObject(parse(old))?parse(old):{};all[data.className]=data.timetable;localStorage.setItem(key,JSON.stringify(all));}else localStorage.setItem(key,JSON.stringify(data));
 }catch(e){if(old===null)localStorage.removeItem(key);else localStorage.setItem(key,old);throw e}
}
function pick(){
 const input=document.createElement('input');input.type='file';input.accept='.json,application/json';
 input.onchange=async()=>{const f=input.files?.[0];if(!f)return;
  try{
   if(f.size>2000000)throw Error('Backup file is too large');
   const obj=JSON.parse(await f.text());
   if(obj.app!=='Classroom Companion'||obj.schema!==1||obj.kind!==kind||obj.edition!==edition||!validate(obj.data))throw Error('This file is not a compatible '+kind+' backup');
   if(isReward&&obj.data.className!==getClass())throw Error('Select the same class as the backup ('+obj.data.className+') before importing');
   const summary=isReward?Object.keys(obj.data.scores).length+' score entries':isTimetable?'timetable for '+obj.data.className:isCustom?'custom text and font size':obj.data.length+' saved prompts';
   if(!confirm('Restore '+summary+' from '+f.name+'? Existing data for this section will be replaced. Other tools will not be changed.'))return;
   // Automatic pre-restore safety copy, downloaded before any write.
   if(isTimetable){const existing=parse(localStorage.getItem(key))||{};if(existing[obj.data.className])download({app:'Classroom Companion',schema:1,kind,edition,created:new Date().toISOString(),data:{className:obj.data.className,timetable:existing[obj.data.className]}})}else exportData();
   restoreData(obj.data);
   if(isTimetable){const d=window.Support?.classData?.()||{};d.classes=d.classes||{};if(!d.classes[obj.data.className])d.classes[obj.data.className]={};d.selectedClass=obj.data.className;localStorage.setItem('classroomCompanionV1',JSON.stringify(d))}
   alert('Restore completed. The previous data was downloaded as a safety copy. This page will reload.');
   location.reload();
  }catch(e){alert('Import cancelled: '+e.message)}
 };
 input.click();
}
function boot(){
 const host=isReward?document.querySelector('.topActions'):isTimetable?document.querySelector('.topActions'):isCustom?document.querySelector('.top'):document.querySelector('#ccEditContentGear')?.parentElement;
 if(!host)return false;
 if(document.getElementById('ccBackupControls'))return true;
 const wrap=document.createElement('span');wrap.id='ccBackupControls';wrap.style.cssText='display:inline-flex;gap:4px;align-items:center;flex-wrap:wrap';
 for(const [label,fn] of [['⬇ Export',exportData],['⬆ Import',pick]]){const b=document.createElement('button');b.type='button';b.textContent=label;b.title=(label.includes('Export')?'Download':'Restore')+' this tool\'s saved data';b.style.cssText='font:800 11px system-ui;border:1px solid #cbd5d1;background:#fff;color:#17324d;border-radius:9px;padding:7px 8px;cursor:pointer';b.onclick=fn;wrap.append(b)}
 if(isCustom)host.append(wrap);else if(isEditable)host.append(wrap);else host.insertBefore(wrap,host.firstChild);
 return true;
}
let attempts=0;const timer=setInterval(()=>{if(boot()||++attempts>100)clearInterval(timer)},100);
})();