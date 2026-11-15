/* Mini Whiteboard · Final classroom refinements beta v8.
 * PIN-only, teacher-controlled admission, server-persisted pause timer,
 * End Question and one-click teacher readiness checks.
 */
(function(){
'use strict';
if(new URLSearchParams(location.search).get('mode')==='projector')return;
const $=id=>document.getElementById(id);
if(!$('pupilGrid')||!$('ccClassPauseBar'))return;
const styles=document.createElement('style');
styles.textContent=[
 '#ccV8TeacherControls{padding:12px;margin:9px 0;background:#f4faf8;border:1px solid #b7d9cf;border-radius:12px}',
 '#ccV8TeacherControls h3{font-size:14px;margin:0 0 7px}',
 '#ccV8TeacherControls .cc-v8-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:8px 0}',
 '#ccV8TeacherControls button{font-size:12px;font-weight:800;min-height:40px;padding:7px 11px;border-radius:9px;border:1px solid #b9d4cd;background:#fff;color:#215f55}',
 '#ccV8TeacherControls button[data-active=true]{background:#0f766e;color:white;border-color:#0f766e}',
 '#ccV8TeacherControls button:disabled{opacity:.45;cursor:not-allowed}',
 '#ccV8TeacherControls #ccV8EndQuestion{background:#fff1e8;border-color:#e8b394;color:#99440e}',
 '#ccV8TeacherControls #ccV8Remove{background:#fff0f0;border-color:#dfa8a5;color:#a22e34}',
 '#ccV8TeacherControls select{width:auto;max-width:230px;padding:8px;border-radius:8px;font-size:12px}',
 '#ccV8TeacherControls small{font-size:12px;color:#617c75}',
 '#ccV8TeacherControls .cc-v8-heading{font-size:12px;font-weight:850;color:#385e57}',
 '#ccV8Status{font:750 12px/1.6 system-ui;color:#3b6d63}',
 '#ccV8Readiness{margin-top:9px;padding:9px;background:#fff;border:1px solid #cbded8;border-radius:10px;font:12px/1.6 system-ui;color:#395f57}',
 '#ccV8Readiness p{margin:3px 0}',
 '#ccV8Readiness .cc-ok{color:#117349;font-weight:800}',
 '#ccV8Readiness .cc-warn{color:#9c6513;font-weight:800}',
 '#ccV8Readiness .cc-bad{color:#b13c37;font-weight:800}',
 '#ccV8PupilEnd[hidden]{display:none!important}',
 '#ccV8PupilEnd{position:absolute;inset:0;z-index:400;display:grid;place-content:center;justify-items:center;gap:12px;padding:24px;border-radius:12px;color:#fff;background:#153c53f5;text-align:center}',
 '#ccV8PupilEnd h2{font-size:clamp(23px,4vw,36px);margin:0}',
 '#ccV8PupilEnd p{max-width:480px;margin:0;font-weight:700}',
 '#ccV8JoinHint{font:12px/1.6 system-ui;color:#5b7371;padding:7px 0}',
 '#ccV8JoinHint strong{color:#285d52}',
 '#ccV8WorkerMissing{font:800 12px/1.5 system-ui;color:#9c5a14;background:#fff4e5;border:1px solid #f2c981;border-radius:9px;padding:8px;margin:7px 0}',
 '#ccV8WorkerMissing[hidden]{display:none!important}',
 '@media(max-width:650px){#ccV8TeacherControls{padding:9px}#ccV8TeacherControls button{padding:8px 9px}}'
].join('\n');document.head.appendChild(styles);
const teacher=document.createElement('section');teacher.id='ccV8TeacherControls';
teacher.setAttribute('aria-label','Teacher classroom controls and readiness checks');
teacher.innerHTML=[
 '<h3>Classroom management</h3>',
 '<div class="cc-v8-row"><button id="ccV8EndQuestion" type="button">■ End Question</button><span id="ccV8QuestionStatus" class="cc-v8-heading">Launch a question to begin.</span></div>',
 '<div class="cc-v8-row"><button id="ccV8Lock" type="button" aria-pressed="false">🔓 New pupils can join</button><button id="ccV8Remove" type="button" title="Remove and block the selected pupil">Remove selected pupil</button><small>Existing pupils may reconnect when joining is locked.</small></div>',
 '<div class="cc-v8-row"><label class="cc-v8-heading" for="ccV8Blocked">Blocked names</label><select id="ccV8Blocked"><option value="">None</option></select><button id="ccV8Unblock" type="button">Unblock</button><small id="ccV8AdmissionInfo"></small></div>',
 '<div class="cc-v8-row"><button id="ccV8Check" type="button">✓ Check classroom readiness</button><button id="ccV8CopyPermanent" type="button">Copy permanent pupil URL</button></div>',
 '<div id="ccV8Status"></div><div id="ccV8Readiness" aria-live="polite"><p>Run the readiness check before pupils join. A real-device test is still required.</p></div>'
].join('');
$('ccClassPauseBar').after(teacher);
const pupilWork=$('studentActivity')?.querySelector('.studentWork');
const endedOverlay=document.createElement('div');endedOverlay.id='ccV8PupilEnd';endedOverlay.hidden=true;
endedOverlay.setAttribute('role','status');
endedOverlay.innerHTML='<div style="font-size:55px" aria-hidden="true">✓</div><h2>Question ended</h2><p>Your working and answer have been kept. Please look at your teacher and wait for the next question.</p>';
if(pupilWork){pupilWork.style.position='relative';pupilWork.append(endedOverlay)}
const entryNote=document.createElement('p');entryNote.id='ccV8JoinHint';
entryNote.innerHTML='Only your <strong>4-digit class PIN</strong> and <strong>name</strong> are needed. Your teacher will tell you when to begin.';
$('ccPupilEntryTip')?.after(entryNote);
const missing=document.createElement('p');missing.id='ccV8WorkerMissing';missing.hidden=true;
missing.textContent='This permanent pupil page is not connected to a classroom server yet. Ask your teacher to configure it.';
entryNote.after(missing);
let ended=false,locked=false,blockedNames=[],readinessBusy=false,projectorSeen=false;
let lastRoom='',timerDemoPause=0;
const clean=(s,n=40)=>String(s??'').replace(/[\u0000-\u001f<>]/g,'').trim().slice(0,n);
const live=()=>state.mode==='live'&&state.ws?.readyState===1;
const normName=s=>clean(s,24).replace(/\s+/g,' ').toLowerCase();
const configuredUrl=()=>String(window.MINI_WHITEBOARD_WORKER_URL||'').trim();
const permanentURL=new URL('mini-whiteboard-teacher-control-pupil.html',location.href).href;
function renderAdmission(){
 const has=['live','demo'].includes(state.mode)&&!!state.room;
 $('ccV8Lock').disabled=!has;
 $('ccV8Lock').dataset.active=String(locked);
 $('ccV8Lock').setAttribute('aria-pressed',String(locked));
 $('ccV8Lock').textContent=locked?'🔒 New joining locked':'🔓 New pupils can join';
 const pupil=state.pupils.get(state.selected);
 $('ccV8Remove').disabled=!has||!pupil;
 $('ccV8Remove').textContent=pupil?'Remove '+pupil.name:'Remove selected pupil';
 const combo=$('ccV8Blocked'),previous=combo.value;
 combo.replaceChildren();
 combo.add(new Option(blockedNames.length?'Choose a blocked name':'No blocked names',''));
 for(const name of blockedNames)combo.add(new Option(name,name));
 if(blockedNames.includes(previous))combo.value=previous;
 $('ccV8Unblock').disabled=!has||!combo.value;
 $('ccV8AdmissionInfo').textContent=blockedNames.length?blockedNames.length+' blocked name(s)':'No blocked pupils';
 $('ccV8CopyPermanent').disabled=!configuredUrl();
 $('ccV8Status').textContent=state.mode==='live'?'Admission decisions are enforced by Worker v12.':state.mode==='demo'?'Demo controls only — no real pupils connected.':'Open a room to manage admissions.';
}
function renderEnded(){
 if(state.question)ended=state.question.ended===true;
 else ended=false;
 const has=Boolean(state.question)&&['live','demo'].includes(state.mode);
 $('ccV8EndQuestion').disabled=!has||ended;
 $('ccV8QuestionStatus').textContent=!has?'Launch a question to begin.':ended?'Question ended · submissions frozen':'Question active · submissions open';
 const pupil=state.role==='student'&&ended;
 endedOverlay.hidden=!pupil;
 if(pupilWork)pupilWork.inert=pupil||($('ccEyesOverlay')&&!$('ccEyesOverlay').hidden);
 if(pupil)$('submitAnswer').disabled=true;
 $('ccFormRetry')&&($('ccFormRetry').disabled=ended||!has||(state.question.retryRound||0)>=3);
 if(typeof countdown==='function')countdown();
}
function refreshControlView(){renderAdmission();renderEnded()}
function applyAdmission(d){
 if(typeof d.locked==='boolean')locked=d.locked;
 if(Array.isArray(d.blockedNames))blockedNames=d.blockedNames.map(x=>clean(x,24)).slice(0,45);
 renderAdmission();
}
$('ccV8Blocked').onchange=()=>{renderAdmission()};
$('ccV8Lock').onclick=()=>{
 if(state.mode==='live'){if(!live()){toast('Reconnect before changing admission settings.');return}send({type:'admissionControl',locked:!locked});}
 else if(state.mode==='demo'){locked=!locked;renderAdmission();toast(locked?'New joinings locked in demo.':'New joinings allowed in demo.')}
};
$('ccV8Remove').onclick=()=>{
 const p=state.pupils.get(state.selected);
 if(!p)return;
 if(!confirm('Remove and block '+p.name+'? Their current room data will be deleted, including any saved examples attributed to them. You can unblock the name later.'))return;
 if(state.mode==='live'){if(!live()){toast('Reconnect before removing a pupil.');return}send({type:'removePupil',id:p.id});}
 else if(state.mode==='demo'){const blocked=normName(p.name);if(!blockedNames.includes(blocked))blockedNames.push(blocked);state.pupils.delete(p.id);state.selected=null;state.selectedEvents=[];renderGrid();renderSelected();renderAdmission();toast('Demo pupil removed.')}
};
$('ccV8Unblock').onclick=()=>{
 const name=$('ccV8Blocked').value;if(!name)return;
 if(state.mode==='live'){if(!live()){toast('Reconnect before unblocking.');return}send({type:'unblockName',name});}
 else if(state.mode==='demo'){blockedNames=blockedNames.filter(x=>x!==name);renderAdmission();}
};
$('ccV8EndQuestion').onclick=()=>{
 if(!state.question||ended)return;
 if(!confirm('End this question and freeze further pupil writing, answers and confidence choices? Their earlier working will remain available for review.'))return;
 if(state.mode==='live'){if(!live()){toast('Reconnect before ending the question.');return}send({type:'endQuestion'});}
 else if(state.mode==='demo'){
  state.question.ended=true;ended=true;
  channel?.postMessage({type:'ccV8DemoEnded',room:state.room,questionId:state.question.id});
  refreshControlView();toast('Demo question ended. You can review pupil working or launch another question.');
 }
};
function addCheck(text,status){
 const p=document.createElement('p'),b=document.createElement('strong');b.className='cc-'+status;
 b.textContent=(status==='ok'?'✓ ':status==='bad'?'✕ ':'• ')+text;p.appendChild(b);$('ccV8Readiness').appendChild(p);
}
async function readinessCheck(){
 if(readinessBusy)return;
 readinessBusy=true;$('ccV8Check').disabled=true;$('ccV8Readiness').replaceChildren();
 const raw=clean($('backend')?.value||state.backend||'',600);
 let origin;
 try{const u=new URL(raw);if(u.protocol!=='https:')throw Error('HTTPS required');origin=u.origin}
 catch{addCheck('No valid classroom Worker address. Configure it on the teacher screen.','bad')}
 if(origin){
  try{
   const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),7000);
   let response;try{response=await fetch(origin+'/api/health',{method:'GET',mode:'cors',cache:'no-store',signal:controller.signal})}finally{clearTimeout(timeout)}
   const data=await response.json();
   if(!response.ok||data.version!=='v12'){addCheck('Worker responds but is not the required version 8.','bad');}
   else addCheck('Worker v12 is reachable and supports this classroom.','ok');
  }catch{addCheck('Worker is unreachable or not approved for this website origin.','bad')}
 }
 if(live()){
  addCheck('Teacher WebSocket connected · PIN '+state.room,'ok');
  addCheck('Checking projector and active pupil connections…','warn');
  send({type:'readiness'});
 }else{
  addCheck(state.mode==='demo'?'Demo room only — no real connections.':'No connected live teacher room yet.','warn');
  addCheck('Connect the projector and at least two pupil devices before class.','warn');
 }
 if(!configuredUrl())addCheck('Permanent pupil URL needs a one-time Worker URL configuration.','warn');
 else addCheck('Permanent pupil URL is configured.','ok');
 addCheck('This does not replace 45-device Wi-Fi and privacy testing.','warn');
 readinessBusy=false;$('ccV8Check').disabled=false;
}
$('ccV8Check').onclick=readinessCheck;
$('ccV8CopyPermanent').onclick=async()=>{
 if(!configuredUrl()){toast('Configure the permanent pupil address after Worker v12 is deployed.');return}
 try{await navigator.clipboard.writeText(permanentURL);toast('Permanent pupil address copied. Pupils enter PIN and name.')}
 catch{window.prompt('Copy the permanent pupil address:',permanentURL)}
};
// Persist no credentials in permanent class HTML. Configuration is a public service origin only.
const pupilURLPage=location.pathname.endsWith('/mini-whiteboard-teacher-control-pupil.html');
if(pupilURLPage){
 $('roleTeacher')?.classList.add('hidden');
 const a=$('appHeader')?.querySelector('a[href*="whiteboard-smart-mini-preparation-beta"]');a?.classList.add('hidden');
 if(!configuredUrl()&&!new URLSearchParams(location.search).get('worker'))missing.hidden=false;
}
const priorGrid=renderGrid;
renderGrid=function(){priorGrid();renderAdmission()};
const priorSelect=selectPupil;
selectPupil=function(id){priorSelect(id);renderAdmission()};
const priorHandle=handle;
handle=function(d){
 if(!d||typeof d!=='object')return;
 if(d.type==='admissionStatus'&&state.role==='teacher'){applyAdmission(d);return}
 if(d.type==='rosterRemoved'&&state.role==='teacher'){
  state.pupils.delete(d.id);
  if(state.selected===d.id){state.selected=null;state.selectedEvents=[];renderSelected()}
  renderGrid();renderAdmission();toast(d.name+' was removed and blocked.');return;
 }
 if(d.type==='removedFromClass'&&state.role==='student'){
  try{sessionStorage.removeItem('wscm-student-'+state.room)}catch{}
  state.mode='none';state.room='';state.studentKey='';state.studentId='';state.myEvents=[];
  disconnect();$('studentActivity')?.classList.add('hidden');$('joinBox')?.classList.remove('hidden');
  toast(d.message||'Your teacher has ended this pupil session.');return;
 }
 if(d.type==='readiness'&&state.role==='teacher'){
  if(d.version!=='v12'){addCheck('Classroom connection uses an outdated Worker.','bad');return}
  projectorSeen=d.projectorConnected===true;
  addCheck('Authenticated teacher room verified by Worker v12.','ok');
  addCheck('Projector '+(projectorSeen?'connected':'not connected'),projectorSeen?'ok':'warn');
  addCheck(d.pupilConnections+' pupil device(s) connected · '+d.rosterCount+'/45 registered',d.pupilConnections?'ok':'warn');
  addCheck(d.admissionLocked?'New joining is locked.':'New joining is open.','ok');
  addCheck(d.questionEnded?'Last question has ended.':'Question is open or not started.','ok');
  return;
 }
 if(d.type==='projectorState'&&state.role==='teacher'){projectorSeen=d.connected===true;return}
 if(d.type==='questionEnded'){
  if(d.question&&state.question?.id===d.question.id)state.question={...state.question,...d.question};
  else if(state.question?.id===d.questionId)state.question.ended=true;
  ended=true;refreshControlView();if(state.role==='student')toast('Question ended. Look at your teacher.');return;
 }
 if(d.type==='classroomPause'){
  if(d.question&&state.question?.id===d.question.id)state.question={...state.question,...d.question};
  priorHandle(d); // v7 controls the Eyes on Teacher overlay.
  renderEnded();return;
 }
 const priorQuestion=state.question?.id;
 priorHandle(d);
 if(d.type==='welcome'){
  if(d.role==='teacher'){locked=d.admissionLocked===true;blockedNames=Array.isArray(d.blockedNames)?d.blockedNames:[];lastRoom=state.room;}
  renderAdmission();renderEnded();
 }
 if(d.type==='question'){
  if(state.question?.id!==priorQuestion)ended=false;
  renderEnded();
 }
 if(d.type==='status'&&state.role==='teacher')renderAdmission();
};
const demoChannel=typeof channel!=='undefined'?channel:null;
demoChannel?.addEventListener('message',e=>{
 const d=e.data;
 if(d?.type==='ccV8DemoEnded'&&state.role==='student'&&state.mode==='demo'&&d.room===state.room&&state.question?.id===d.questionId){
  state.question.ended=true;renderEnded();
 }
 if(d?.type==='ccV8DemoTimer'&&state.mode==='demo'&&d.room===state.room&&state.question?.id===d.questionId){
  state.question.timerPausedAt=d.timerPausedAt||0;state.question.endsAt=d.endsAt||0;
  if(typeof countdown==='function')countdown();
 }
});
$('ccEyesButton')?.addEventListener('click',()=>{
 if(state.mode!=='demo'||!state.question)return;
 setTimeout(()=>{
  const paused=$('ccEyesButton')?.dataset.active==='true';
  const q=state.question,now=Date.now();
  if(paused&&!q.timerPausedAt&&q.endsAt)q.timerPausedAt=now;
  else if(!paused&&q.timerPausedAt&&q.endsAt){q.endsAt+=now-q.timerPausedAt;q.timerPausedAt=0}
  demoChannel?.postMessage({type:'ccV8DemoTimer',room:state.room,questionId:q.id,timerPausedAt:q.timerPausedAt||0,endsAt:q.endsAt||0});
  if(typeof countdown==='function')countdown();
 },0);
});
const oldDemo=demoLaunch;
demoLaunch=function(q){oldDemo(q);ended=false;renderEnded()};
const oldSetup=setupDemo;
setupDemo=function(){locked=false;blockedNames=[];ended=false;oldSetup();refreshControlView()};
const oldRole=selectRole;
selectRole=function(role){oldRole(role);refreshControlView()};
refreshControlView();
})();