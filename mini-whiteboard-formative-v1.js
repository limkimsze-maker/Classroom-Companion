/* Formative beta: help, answer grouping, human misconception tags,
   targeted private hints, try-again rounds and best-effort ink recovery.
   Server-enforced operations need the separate Worker v4.
   No automated handwriting diagnosis. */
(function(){
'use strict';
if(new URLSearchParams(location.search).get('mode')==='projector')return;
const $=id=>document.getElementById(id);
const labels=['A','B','C','D'];
const tags=new Map(),batch=new Set();
let batchMode=false,help=false,serverRound=0,reconnectAttempts=0,reconnecting=false,lastServerRoom='',misDraft={},summaryTimer=0;
const style=document.createElement('style');style.textContent=[
 '#ccFormInsights{margin:10px 0;padding:12px;border:1px solid #bfded5;border-radius:12px;background:#f6fbfa}',
 '#ccFormInsights header{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}',
 '#ccFormInsights h3{margin:0;font-size:14px}',
 '#ccFormSummary{display:flex;gap:9px;flex-wrap:wrap;margin:9px 0}',
 '#ccFormSummary b{font-size:16px;color:#174b48}',
 '#ccFormSummary span{font-size:12px;color:#586d73}',
 '#ccFormAnswers{display:flex;flex-direction:column;gap:6px}',
 '#ccFormAnswers .cc-form-group{border:1px solid #d8e7e2;border-radius:8px;padding:7px;background:#fff;display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap}',
 '#ccFormAnswers small{display:block;font-size:11px;color:#5d7079}',
 '#ccFormInsights button{padding:6px 9px;font-size:11px;font-weight:750;border-radius:7px;border:1px solid #afd6ca;background:#fff;color:#125b58}',
 '#ccFormAnswers .cc-form-group button{white-space:nowrap}',
 '#ccFormGroupActions{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin:9px 0}',
 '#ccFormHint{flex:1 1 240px;width:auto;min-width:190px;padding:8px;border:1px solid #b8d6cd;border-radius:8px;font:13px system-ui}',
 '#ccFormGroupActions .primary,#ccFormRetry{background:#0f766e!important;color:#fff!important;border-color:#0f766e!important}',
 '#ccFormMisFields{padding:7px;border:1px solid #dbe8e4;border-radius:8px;background:#f4faf8;margin:7px 0}',
 '#ccFormMisFields .cc-misrow{display:flex;align-items:center;gap:6px;margin:5px 0}',
 '#ccFormMisFields input{flex:1;min-width:50px;width:auto;padding:6px;border:1px solid #cbdbd5;border-radius:7px;font-size:12px}',
 '#ccFormStudentHelp{background:#e9f7f4;border:1px solid #9accc2;color:#095d54;border-radius:9px;padding:10px;font:800 13px system-ui;width:100%;margin:8px 0}',
 '#ccFormStudentHelp[aria-pressed=true]{background:#fff0d1;color:#8b5700}',
 '#ccFormStudentHelp:disabled{opacity:.6}',
 '#ccFormHelpInfo{font-size:11px;color:#546c74}',
 '#pupilGrid button.cc-help-needed{outline:3px solid #e6a225;outline-offset:-2px}',
 '#pupilGrid button.cc-form-selected{box-shadow:inset 0 0 0 3px #1a80aa}',
 '#pupilGrid button.cc-help-needed::before{content:"✋";position:absolute;right:4px;bottom:5px;font-size:13px;z-index:2}',
 '#ccFormSelectedTag{border:1px solid #dfebe6;border-radius:10px;padding:8px;margin:8px 0;background:#fff}',
 '#ccFormSelectedTag select{width:100%;padding:6px;margin-top:4px;font-size:12px}',
 '#ccFormRetryBox{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:9px}',
 '#ccFormRetryBox input{width:55px;padding:6px}',
 '#ccFormConnection{font-size:11px;font-weight:700;color:#596f74}',
 '#ccFormProgress{font-size:12px;margin:7px 0;color:#285b55}',
 '@media(max-width:600px){#ccFormInsights{padding:9px}#ccFormSummary{gap:5px}}'
].join('\n');document.head.appendChild(style);
const panel=document.createElement('section');panel.id='ccFormInsights';
panel.innerHTML='<header><h3>Understanding at a glance</h3><small id="ccFormConnection">Demo · no live classroom</small></header><div id="ccFormSummary">Launch a question to see class responses.</div><div id="ccFormAnswers"></div><div id="ccFormProgress"></div><div id="ccFormGroupActions"><button id="ccFormMulti" type="button">☐ Select several pupils</button><button id="ccFormSelectWrong" type="button">Select incorrect</button><button id="ccFormSelectHelp" type="button">Select help requests</button><span id="ccFormSelectedCount" style="font-size:12px;font-weight:750">0 selected</span><input id="ccFormHint" maxlength="280" placeholder="Private hint to selected pupils…"><button id="ccFormSendGroup" class="primary" type="button">Send individually</button></div><div id="ccFormRetryBox"><button id="ccFormRetry" type="button">↻ Try Again after reteaching</button><label style="font-size:12px">Timer <input id="ccFormRetryMinutes" type="number" min="0" max="60" value="3"> min</label><small>Original answers and working are preserved.</small></div>';
$('pupilGrid')?.before(panel);
const manual=document.createElement('div');manual.id='ccFormSelectedTag';
manual.innerHTML='<label for="ccFormTagSelect" style="font-size:12px;font-weight:800">Teacher-confirmed misconception (optional)</label><select id="ccFormTagSelect"><option value="">Not tagged / unsure</option><option>Wrong operation</option><option>Place-value confusion</option><option>Calculation error</option><option>Misread the question</option><option>Correct answer, flawed method</option><option>Other / needs review</option></select><p style="font-size:11px;color:#647781;margin:5px 0 0">Only you confirm a misconception after examining the working.</p><button id="ccFormResolveHelp" type="button" style="padding:6px 8px;margin-top:5px" disabled>✓ Help addressed</button>';
$('inspectDetail')?.after(manual);
const pupilHelp=document.createElement('div');pupilHelp.id='ccFormStudentHelpWrap';
pupilHelp.innerHTML='<button id="ccFormStudentHelp" type="button" aria-pressed="false">✋ I Need Help</button><div id="ccFormHelpInfo">Your teacher will see your request privately.</div>';
$('studentAnswerUI')?.before(pupilHelp);
const mcqLabels=document.createElement('div');mcqLabels.id='ccFormMisFields';
mcqLabels.innerHTML='<strong style="font-size:12px">Possible explanations for wrong choices (optional)</strong><p style="margin:4px 0;font-size:11px;color:#657a78">Teacher-only hypotheses, not automatic diagnoses.</p><div id="ccFormMisRows"></div>';
$('mcqOptions')?.after(mcqLabels);
function safe(v,max=120){return String(v??'').trim().slice(0,max)}
function tagKey(id){return (state.room||'')+':'+(state.question?.id||'')+':'+id}
function setTag(id,v){if(!id)return;const key=tagKey(id);if(v)tags.set(key,v);else tags.delete(key);paintSummary()}
function getTag(id){return tags.get(tagKey(id))||''}
function chosen(){return [...batch].filter(id=>state.pupils.has(id))}
function paintBatch(){
 const root=$('pupilGrid');root?.querySelectorAll('button[data-cc-pupil]').forEach(b=>b.classList.toggle('cc-form-selected',batch.has(b.dataset.ccPupil)));
 $('ccFormSelectedCount').textContent=chosen().length+' selected';
 $('ccFormMulti').textContent=batchMode?'✓ Selecting pupils (tap tiles)':'☐ Select several pupils';
 $('ccFormSendGroup').disabled=!chosen().length||state.mode==='none'||state.mode==='archive';
}
function choose(ids){batch.clear();for(const id of ids)if(state.pupils.has(id))batch.add(id);paintBatch()}
function paintSummary(){
 const pupils=[...state.pupils.values()];
 const responded=pupils.filter(p=>p.answer&&p.correct!==null);
 const right=responded.filter(p=>p.correct===true),wrong=responded.filter(p=>p.correct===false);
 const waiting=pupils.filter(p=>!p.answer||p.correct===null),helping=pupils.filter(p=>p.helpNeeded);
 $('ccFormSummary').replaceChildren();
 const stats=[['Correct',right.length],['Incorrect',wrong.length],['Waiting',waiting.length],['✋ Help',helping.length]];
 for(const [label,num] of stats){const x=document.createElement('span');const b=document.createElement('b');b.textContent=String(num);x.append(b,document.createTextNode(' '+label));$('ccFormSummary').append(x)}
 $('ccFormConnection').textContent=state.mode==='live'?pupils.filter(p=>p.online).length+'/'+pupils.length+' connected · '+(state.ws?.readyState===1?'Live':'Disconnected'):state.mode==='demo'?'Simulated pupils · not real answers':'Start a class for live responses';
 const area=$('ccFormAnswers');area.replaceChildren();
 const q=state.question;
 if(!q){const p=document.createElement('small');p.textContent='Launch a prepared question, or write and capture one on Whiteboard Smart.';area.append(p);$('ccFormProgress').textContent='';paintBatch();return}
 const groups=new Map();
 for(const p of responded){const val=q.type==='mcq'?safe(p.answer,6).toUpperCase():q.type==='tf'?safe(p.answer,20).toLowerCase():safe(p.answer,60).toLowerCase().replace(/\s+/g,' ');if(!groups.has(val))groups.set(val,[]);groups.get(val).push(p.id)}
 if(q.type==='mcq'){
  for(let i=0;i<(q.options||[]).length;i++){const l=labels[i];if(!groups.has(l))groups.set(l,[])}
 }
 for(const [value,ids] of [...groups.entries()].sort((a,b)=>b[1].length-a[1].length)){
  const row=document.createElement('div');row.className='cc-form-group';
  const txt=document.createElement('div');const title=document.createElement('b');title.style.fontSize='12px';
  const option=q.type==='mcq'?(q.options?.[labels.indexOf(value)]||''):value;
  title.textContent=(q.type==='mcq'?value+' · '+safe(option,55):value||'(blank)')+' — '+ids.length+' pupil'+(ids.length===1?'':'s');
  txt.append(title);
  const hypothesis=q.type==='mcq'?q.misconceptions?.[value]:null;
  if(hypothesis){const desc=document.createElement('small');desc.textContent='Possible: '+hypothesis+' (teacher-set; check working)';txt.append(desc)}
  const btn=document.createElement('button');btn.type='button';btn.textContent='Select group';btn.disabled=!ids.length;btn.onclick=()=>choose(ids);
  row.append(txt,btn);area.append(row);
 }
 const grouped=new Map();
 for(const p of pupils){const t=getTag(p.id);if(t)grouped.set(t,(grouped.get(t)||0)+1)}
 if(grouped.size){const p=document.createElement('p');p.style.cssText='font-size:12px;margin:7px 0';p.textContent='Teacher-confirmed tags: '+[...grouped].map(([k,n])=>k+' ('+n+')').join(' · ');area.append(p)}
 const improved=pupils.filter(p=>p.firstCorrect===false&&p.correct===true).length;
 const retried=pupils.filter(p=>p.firstAnswer&&p.answer&&p.retryRound>0).length;
 const round=Number(q.retryRound)||0;
 $('ccFormProgress').textContent=round?'Try Again round '+round+': '+improved+' of '+retried+' re-responding pupils improved from incorrect to correct. Original working retained.':'Round 1 · Review answer groups and pupils’ actual working before reteaching.';
 $('ccFormRetry').disabled=!state.question||state.mode==='none'||state.mode==='archive'||round>=3;
 paintBatch();
}
function scheduleSummary(){if(summaryTimer)return;summaryTimer=setTimeout(()=>{summaryTimer=0;paintSummary()},180)}
function refreshTileMarks(){
 $('pupilGrid')?.querySelectorAll('button[data-cc-pupil]').forEach(b=>{
  const p=state.pupils.get(b.dataset.ccPupil);
  b.classList.toggle('cc-help-needed',!!p?.helpNeeded);
  const t=!!p?.helpNeeded?' · Needs help':'';
  b.title=(p?.name||'Pupil')+t+' · Click to inspect working';
 });
 paintBatch();
}
function renderMisLabels(){
 const holder=$('ccFormMisRows');if(!holder)return;
 for(const el of holder.querySelectorAll('input[data-cc-mis]'))misDraft[el.dataset.ccMis]=el.value;
 holder.replaceChildren();
 for(let i=0;i<Math.min(4,Math.max(2,Number($('choiceCount')?.value)||4));i++){
  const l=labels[i],row=document.createElement('div');row.className='cc-misrow';
  const name=document.createElement('strong');name.textContent=l;
  const inp=document.createElement('input');inp.type='text';inp.dataset.ccMis=l;inp.maxLength=100;inp.placeholder='Possible misconception for '+l;inp.value=misDraft[l]||'';
  inp.addEventListener('change',()=>misDraft[l]=inp.value);
  row.append(name,inp);holder.append(row);
 }
 $('ccFormMisFields').hidden=$('answerType')?.value!=='mcq';
}
const prevAnswerUI=updateAnswerUI;
updateAnswerUI=function(){prevAnswerUI();renderMisLabels()};
$('answerType').onchange=updateAnswerUI;
$('choiceCount').onchange=()=>{buildChoices();renderMisLabels()};
const oldMake=makeQuestion;
makeQuestion=function(){
 const q=oldMake();
 if(q.type==='mcq'){const obj={};for(const input of $('ccFormMisRows')?.querySelectorAll('input[data-cc-mis]')||[]){const label=input.dataset.ccMis,text=safe(input.value,100);if(text&&label!==q.answerKey)obj[label]=text}q.misconceptions=obj}
 return q;
};
window.addEventListener('ccFormativePreparedLoaded',e=>{misDraft={...(e.detail?.misconceptions||{})};renderMisLabels()});
$('ccFormTagSelect').onchange=e=>{if(state.selected)setTag(state.selected,e.target.value)};
const oldSelectedDetails=renderSelectedDetails;
renderSelectedDetails=function(){
 oldSelectedDetails();
 const p=state.pupils.get(state.selected);
 if(p?.retryRound>0&&p.firstAnswer){
  $('inspectDetail').textContent+='\nBefore reteaching: '+p.firstAnswer+' ('+(p.firstCorrect===true?'correct':'incorrect')+')'+'\nAfter reteaching: '+(p.answer||'Awaiting response')+(p.correct===true?' (correct)':p.correct===false?' (incorrect)':'');
 }
};
const priorSelect=selectPupil;
selectPupil=function(id){priorSelect(id);$('ccFormTagSelect').value=getTag(id);$('ccFormResolveHelp').disabled=!state.pupils.get(id)?.helpNeeded;paintSummary()};
const root=$('pupilGrid');
root?.addEventListener('click',e=>{
 if(!batchMode)return;
 const tile=e.target.closest('button[data-cc-pupil]');if(!tile)return;
 e.preventDefault();e.stopImmediatePropagation();
 const id=tile.dataset.ccPupil;
 if(batch.has(id))batch.delete(id);else batch.add(id);
 paintBatch();
},true);
$('ccFormMulti').onclick=()=>{batchMode=!batchMode;paintBatch()};
$('ccFormSelectWrong').onclick=()=>choose([...state.pupils.values()].filter(p=>p.correct===false).map(p=>p.id));
$('ccFormSelectHelp').onclick=()=>choose([...state.pupils.values()].filter(p=>p.helpNeeded).map(p=>p.id));
$('ccFormSendGroup').onclick=()=>{
 const ids=chosen(),text=safe($('ccFormHint').value,280);
 if(!ids.length){toast('Select pupils first.');return}
 if(!text){toast('Write a short hint first.');return}
 if(!$('ccMessagesEnabled')?.checked){toast('Teacher has paused private messaging.');return}
 if(state.mode==='live'){if(state.ws?.readyState!==1){toast('Disconnected. Reconnect before sending.');return}send({type:'chatSendMany',ids,text});$('ccFormHint').value='';}
 else toast('Demo only: '+ids.length+' pupils selected. Live private delivery requires Worker v4.');
};
$('ccFormRetry').onclick=()=>{
 if(!state.question||!['live','demo'].includes(state.mode))return;
 const round=Number(state.question.retryRound)||0;
 if(round>=3){toast('Maximum three retry rounds for this question.');return}
 if(!confirm('Start a new answer round for this question? Original pupil working and first answers will remain available.'))return;
 const mins=Math.max(0,Math.min(60,Number($('ccFormRetryMinutes').value)||0));
 if(state.mode==='live'){send({type:'retryQuestion',minutes:mins});toast('Requested another attempt.');}
 else{
  state.question.retryRound=round+1;state.question.endsAt=mins?Date.now()+mins*60000:0;
  for(const p of state.pupils.values()){
   if(round===0){p.firstAnswer=p.answer||'';p.firstCorrect=p.correct}
   p.answer='';p.correct=null;p.retryRound=round+1;p.helpNeeded=false;
  }
  send({type:'question',question:state.question});renderGrid();renderQuestionMeta();paintSummary();
  toast('Demo retry round started; original working is preserved.');
 }
};
$('ccFormResolveHelp').onclick=()=>{
 if(!state.selected)return;
 if(state.mode==='live')send({type:'helpResolve',id:state.selected});
 else{const p=state.pupils.get(state.selected);if(p)p.helpNeeded=false;renderGrid();paintSummary()}
 toast('Help request marked addressed.');
};
function paintHelp(){
 const el=$('ccFormStudentHelp');if(!el)return;
 const able=state.role==='student'&&state.mode!=='none'&&!!state.question;
 el.disabled=!able;el.setAttribute('aria-pressed',String(help));
 el.textContent=help?'✋ Help requested · Tap to cancel':'✋ I Need Help';
 $('ccFormHelpInfo').textContent=help?'Your teacher can see your help request. Keep your working on screen.':'Your teacher sees your help request privately, not on the projector.';
}
$('ccFormStudentHelp').onclick=()=>{
 if(!state.question)return;
 help=!help;
 if(state.mode==='live'){if(state.ws?.readyState===1)send({type:'helpRequest',questionId:state.question.id,needed:help});else{help=!help;toast('Disconnected. Try again after reconnecting.')}}
 else toast(help?'Demo help indicator active. No real teacher has been alerted.':'Help indicator cleared.');
 paintHelp();
};
const oldRenderGrid=renderGrid;
renderGrid=function(){oldRenderGrid();refreshTileMarks();scheduleSummary()};
const oldDemoLaunch=demoLaunch;
demoLaunch=function(q){q.retryRound=0;oldDemoLaunch(q);batch.clear();help=false;misDraft={...q.misconceptions||{}};paintSummary();renderMisLabels()};
const oldSetupDemo=setupDemo;
setupDemo=function(){batch.clear();tags.clear();help=false;serverRound=0;oldSetupDemo();paintHelp();paintSummary()};
const priorHandle=handle;
handle=function(d){
 if(!d||typeof d!=='object')return;
 if(d.type==='helpStatus'&&state.role==='student'){help=!!d.needed;paintHelp();return}
 if(d.type==='chatBatchReceipt'){toast('Private hint delivered to '+Number(d.count||0)+' pupil'+(Number(d.count)===1?'':'s')+'.');return}
 if(d.type==='inkSyncReceipt'){if(d.merged)toast('Recovered '+d.merged+' locally saved pen marks.');return}
 if(d.type==='welcome'&&d.role==='student'){
  reconnectAttempts=0;const retained=readInk(d.question?.id);
  priorHandle(d);
  help=false;serverRound=Number(d.question?.retryRound)||0;
  if(retained.length){
   const official=Array.isArray(d.work)?d.work:[];
   const existing=new Set(official.map(fingerprint));
   const missing=retained.filter(e=>!existing.has(fingerprint(e)));
   if(missing.length){
    state.myEvents=[...official,...missing].slice(-1200);
    drawCommands($('studentCanvas'),state.myEvents);
    send({type:'inkSync',questionId:d.question.id,events:retained.slice(-220)});
   }
  }
  paintHelp();return;
 }
 if(d.type==='question'){
  const oldId=state.question?.id,oldRound=Number(state.question?.retryRound)||0;
  const advanced=state.role==='student'&&oldId===d.question?.id&&Number(d.question?.retryRound)>oldRound;
  if(state.role==='student'&&oldId&&oldId!==d.question?.id){help=false;serverRound=0}
  priorHandle(d);
  if(state.role==='student'){
   if(advanced){$('studentFinal')&&( $('studentFinal').value='');document.querySelectorAll('input[name=pupilAnswer]').forEach(i=>i.checked=false);help=false;serverRound=Number(d.question.retryRound);toast('Try Again: keep your working, then submit a new answer.')}
   paintHelp();
  }else{batch.clear();misDraft={...d.question?.misconceptions||{}};renderMisLabels();paintSummary()}
  return;
 }
 priorHandle(d);
 if(d.type==='welcome'&&d.role==='teacher'){reconnectAttempts=0;batch.clear();misDraft={...d.question?.misconceptions||{}};renderMisLabels();paintSummary()}
 if(d.type==='status'&&state.role==='teacher')scheduleSummary();
};
function fingerprint(e){
 if(!e)return'';
 const round=v=>Math.round((Number(v)||0)*10)/10;
 return JSON.stringify([e.op,Number(e.at)||0,(e.pts||[]).map(p=>p.map(round)),e.color||'',Number(e.width)||0]);
}
function inkKey(qid){return 'cc-mw-ink4:'+state.room+':'+state.studentId+':'+qid}
function storeInk(){
 if(state.mode!=='live'||state.role!=='student'||!state.question?.id)return;
 try{const relevant=state.myEvents.slice(-220),text=JSON.stringify(relevant);if(text.length<430000)sessionStorage.setItem(inkKey(state.question.id),text)}catch(e){}
}
function readInk(qid){
 if(!qid)return[];
 try{const v=JSON.parse(sessionStorage.getItem(inkKey(qid))||'[]');return Array.isArray(v)?v.filter(e=>e&&['stroke','undo','redo','clear'].includes(e.op)).slice(-220):[]}catch{return[]}
}
const oldAddInk=addInk;
addInk=function(event){oldAddInk(event);storeInk()};
const priorConnect=connect;
connect=function(role,credentials={}){
 const room=state.room;
 if(!reconnecting){reconnectAttempts=0;lastServerRoom=room}
 priorConnect(role,credentials);
 const ws=state.ws;if(!ws)return;
 const onclose=ws.onclose;
 ws.onclose=e=>{
  onclose?.(e);
  if(state.mode!=='live'||state.room!==room||state.ws!==ws)return;
  if(reconnectAttempts>=5){setPill('Connection lost · reconnect manually');return}
  reconnectAttempts++;const n=reconnectAttempts;const ms=Math.min(12000,600*Math.pow(2,n));
  setPill('Reconnecting '+n+'/5');
  setTimeout(()=>{
   if(state.mode!=='live'||state.room!==room||state.ws!==ws)return;
   const key=role==='student'?{studentId:state.studentId,studentKey:state.studentKey,name:state.studentName}:credentials;
   reconnecting=true;try{connect(role,key)}finally{reconnecting=false}
  },ms);
 };
};
const oldUpdateRoom=updateRoomUI;
updateRoomUI=function(){oldUpdateRoom();paintSummary();paintHelp()};
if(channel)channel.addEventListener('message',e=>{
 const d=e.data;
 if(d?.room!==state.room||state.mode!=='demo')return;
 if(d.type==='question'&&state.role==='student'){
  const next=Number(d.question?.retryRound)||0;
  if(next>serverRound){
   serverRound=next;
   setTimeout(()=>{$('studentFinal')&&($('studentFinal').value='');document.querySelectorAll('input[name=pupilAnswer]').forEach(x=>x.checked=false);toast('Try Again: show your corrected working and resubmit.')},0);
  }
 }
});
renderMisLabels();paintHelp();paintSummary();
})();