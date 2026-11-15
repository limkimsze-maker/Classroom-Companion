/* Classroom usability v7: PIN-only pupil join, teacher Eyes on Teacher,
 * 45-seat plan, pupil confidence, anonymous saved working examples.
 * All live controls are enforced by the separate Cloudflare Worker v7.
 * No QR codes, no pupil Worker address field, no pupil account registration.
 */
(function(){
'use strict';
if(new URLSearchParams(location.search).get('mode')==='projector')return;
const $=id=>document.getElementById(id);
const root=$('pupilGrid'),studentPanel=$('studentActivity');
if(!root||!studentPanel)return;
const css=document.createElement('style');
css.textContent=[
 '#ccClassPauseBar{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin:9px 0;padding:9px 10px;background:#fff7e6;border:1px solid #e4c98b;border-radius:11px}',
 '#ccClassPauseBar button{min-height:44px;padding:9px 14px;font:850 13px system-ui;border-radius:9px;border:1px solid #d4ba83;background:white;color:#74520e}',
 '#ccClassPauseBar button[data-active=true]{background:#0f766e;color:white;border-color:#0f766e}',
 '#ccClassPauseBar small{color:#6a654c;font-weight:700}',
 '#ccEyesOverlay{position:absolute;inset:0;z-index:250;background:#17324df2;color:white;display:grid;align-content:center;justify-items:center;gap:15px;padding:18px;text-align:center;border-radius:13px}',
 '#ccEyesOverlay[hidden]{display:none!important}',
 '#ccEyesOverlay .cc-eyes-big{font:900 clamp(22px,3vw,34px)/1.15 system-ui;letter-spacing:-.02em}',
 '#ccEyesOverlay p{font:700 15px/1.5 system-ui;max-width:560px;margin:0}',
 '#ccEyesOverlay .cc-eyes-icon{font-size:54px}',
 '#ccConfidence{padding:10px 0;border-top:1px solid #dbe9e5;margin-top:8px}',
 '#ccConfidence strong{display:block;font:800 13px system-ui;margin-bottom:7px;color:#254c50}',
 '#ccConfidence .cc-conf-choices{display:flex;gap:6px;flex-wrap:wrap}',
 '#ccConfidence button{min-height:45px;flex:1 1 90px;white-space:normal;padding:7px;border:1px solid #b6d5cc;border-radius:9px;font:800 12px system-ui;background:#fff;color:#204f49}',
 '#ccConfidence button[aria-pressed=true]{background:#d9f5e8;border-color:#138873;box-shadow:inset 0 0 0 1px #138873}',
 '#ccConfidence p{font-size:11px;color:#607575;margin:7px 0 0}',
 '#ccConfidenceOverview{font:750 12px system-ui;color:#37635c;padding:5px 4px;display:flex;gap:9px;flex-wrap:wrap}',
 '#ccSeatToolbar{display:flex;align-items:center;gap:7px;flex-wrap:wrap;padding:9px 0}',
 '#ccSeatToolbar button{min-height:38px;padding:7px 10px;font-size:12px;border:1px solid #bdd8d0;border-radius:8px;color:#245d53;background:#fff;font-weight:750}',
 '#ccSeatToolbar button[aria-pressed=true]{color:#fff;background:#0f766e;border-color:#0f766e}',
 '#ccSeatToolbar small{color:#627e77}',
 '#ccSeatScroll{width:100%;overflow-x:auto;overscroll-behavior-x:contain}',
 '#pupilGrid.cc-seating-mode{display:grid;grid-template-columns:repeat(9,minmax(108px,1fr));min-width:1020px;gap:6px;align-items:stretch}',
 '#pupilGrid.cc-seating-mode .pupil{position:relative;min-width:0}',
 '#pupilGrid.cc-seating-mode .pupil.cc-seat-selected{outline:3px solid #f0a43b;outline-offset:-3px}',
 '#pupilGrid.cc-seating-mode .cc-seat-empty{border:1px dashed #c2d8d2;border-radius:9px;background:#f5f9f8;min-height:92px;padding:7px;font:750 11px system-ui;color:#869b95;cursor:default}',
 '#pupilGrid.cc-seating-mode.cc-seat-arranging .cc-seat-empty{cursor:pointer;background:#edf8f4;color:#407d70}',
 '#pupilGrid.cc-seating-mode.cc-seat-arranging .pupil{cursor:move}',
 '#ccSeatMessage{font:750 12px system-ui;color:#536f6b;margin:0 0 5px}',
 '#ccBookPanel{margin:12px 0 0;padding:11px;background:#f4faf8;border:1px solid #c3dcd4;border-radius:11px}',
 '#ccBookPanel h3{font-size:14px;margin:0 0 7px}',
 '#ccBookList{display:grid;gap:7px;max-height:250px;overflow-y:auto}',
 '#ccBookList .cc-book-row{border:1px solid #d4e6df;border-radius:9px;padding:8px;background:white;display:flex;gap:7px;justify-content:space-between;align-items:center;flex-wrap:wrap}',
 '#ccBookList .cc-book-row small{font-size:11px;color:#607774;display:block}',
 '#ccBookList .cc-book-actions{display:flex;gap:5px;flex-wrap:wrap}',
 '#ccBookList .cc-book-actions button,#ccBookSave{padding:6px 9px;border-radius:7px;border:1px solid #c6dbd4;color:#1b6155;background:#fff;font-weight:800;font-size:12px}',
 '#ccBookSave{background:#e7f6ef;color:#0f695d;min-height:38px}',
 '#ccBookModal[hidden]{display:none!important}',
 '#ccBookModal{position:fixed;inset:0;z-index:100100;background:#122f44aa;display:grid;place-items:center;padding:12px}',
 '#ccBookModal .cc-book-modalbody{width:min(900px,98vw);max-height:95vh;overflow:auto;background:white;border-radius:12px;padding:16px;box-shadow:0 16px 50px #0007}',
 '#ccBookModal canvas{width:100%;height:auto;aspect-ratio:5/3;border:1px solid #d7e6e1;border-radius:8px;background:white}',
 '#ccBookModal button{padding:9px 11px;min-height:42px;border-radius:8px;background:white;border:1px solid #a5cdc2;font-weight:800}',
 '#ccPupilLinkBtn{padding:6px 9px;font-size:12px;background:#dff5ee;border:1px solid #b3dacf;border-radius:8px;font-weight:850;color:#166458}',
 '#ccPupilEntryTip{font-size:12px;color:#437069;line-height:1.45;margin-top:8px}',
 '@media(max-width:650px){#ccClassPauseBar{gap:6px}#ccConfidence .cc-conf-choices button{font-size:11px}#ccBookPanel{padding:8px}}'
].join('\n');document.head.appendChild(css);
const safeText=(s,n=100)=>String(s??'').replace(/[\u0000-\u001f<>]/g,'').trim().slice(0,n);
const isLive=()=>state.mode==='live'&&state.ws?.readyState===1;

// PIN-only joining: the public service URL is embedded in the teacher's shared link.
// A configured address is a prerequisite for live use, never something a pupil must type.
const query=new URLSearchParams(location.search);
const configuredWorker=()=>{
 let fallback='';try{fallback=localStorage.getItem('wscm-worker-url')||''}catch{}const input=query.get('worker')||window.MINI_WHITEBOARD_WORKER_URL||fallback||'';
 try{
  if(!input)return '';
  const u=new URL(input);
  if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash)return '';
  return u.origin;
 }catch{return ''}
};
const backendInput=$('studentBackend');
const joinedURL=configuredWorker();
if(backendInput){
 const parent=backendInput.closest('.field');
 if(parent)parent.hidden=true;
 if(joinedURL)backendInput.value=joinedURL;
 else backendInput.value='';
}
const joinHelp=document.createElement('p');joinHelp.id='ccPupilEntryTip';
joinHelp.textContent='Enter your class PIN and name. No account or technical settings required.';
$('joinLive')?.closest('.row')?.after(joinHelp);
const copyLink=document.createElement('button');copyLink.type='button';copyLink.id='ccPupilLinkBtn';
copyLink.textContent='Copy pupil link';copyLink.title='Give pupils this web address. They only enter their PIN and name.';
$('copyPin')?.after(copyLink);
const pupilPage='mini-whiteboard-pupil.html';
copyLink.onclick=async()=>{
 if(state.mode!=='live'){
  toast('Create a live classroom before copying the pupil link.');return;
 }
 const address=String($('backend')?.value||state.backend||'').trim();
 let worker;
 try{const u=new URL(address);if(u.protocol!=='https:'||u.username||u.password)throw Error('bad');worker=u.origin}
 catch{toast('Set your classroom Worker address in the teacher setup first.');return}
 const url=new URL(pupilPage,location.href);
 if((window.MINI_WHITEBOARD_WORKER_URL||'').replace(/\/$/,'')!==worker)url.searchParams.set('worker',worker);
 try{await navigator.clipboard.writeText(url.href);toast('Pupil link copied. Pupils enter the 4-digit PIN and their names.')}
 catch{window.prompt('Copy this pupil link:',url.href)}
};
const oldJoin=$('joinLive')?.onclick;
if(oldJoin)$('joinLive').onclick=function(){
 if(!backendInput?.value||!/^https:\/\//.test(backendInput.value)){
  toast('This pupil link is not configured. Ask your teacher to share the classroom link.');return;
 }
 return oldJoin();
};
if(query.has('pupil')||location.pathname.endsWith('/mini-whiteboard-pupil.html')){
 selectRole('student');
 $('roleTeacher')?.classList.add('hidden');
 const oldTop=$('appHeader')?.querySelector('a[href*="whiteboard-smart-mini-preparation-beta"]');
 oldTop?.classList.add('hidden');
 $('joinPin')?.focus();
}

// Teacher: Eyes on Teacher (server enforced for writing, confidence and answers).
let classPaused=false;
const pauseBar=document.createElement('div');pauseBar.id='ccClassPauseBar';
const pauseButton=document.createElement('button');pauseButton.type='button';pauseButton.id='ccEyesButton';pauseButton.textContent='👀 Eyes on Teacher';
const pauseState=document.createElement('small');pauseState.id='ccEyesState';pauseState.textContent='Start a class to control pupil working.';
pauseBar.append(pauseButton,pauseState);
$('ccAttentionBar')?.before(pauseBar);
const work=$('studentActivity')?.querySelector('.studentWork');
const blocker=document.createElement('div');blocker.id='ccEyesOverlay';blocker.hidden=true;
blocker.setAttribute('role','status');blocker.setAttribute('aria-live','polite');
blocker.innerHTML='<div class="cc-eyes-icon" aria-hidden="true">👀</div><div class="cc-eyes-big">Eyes on Teacher</div><p>Look at the classroom screen. Your working is kept safely. You can continue when your teacher says so.</p>';
if(work){work.style.position='relative';work.append(blocker)}
function applyPauseUI(){
 const has=Boolean(state.room)&&['live','demo'].includes(state.mode);
 pauseButton.disabled=!has||state.role!=='teacher';
 pauseButton.dataset.active=String(classPaused);
 pauseButton.textContent=classPaused?'▶ Resume Working':'👀 Eyes on Teacher';
 pauseState.textContent=!has?'Start a class to pause pupil working.':classPaused?'Working and answer submissions are paused.':'Pupils may work and submit answers.';
 const pupil=state.role==='student'&&classPaused;
 blocker.hidden=!pupil;
 if(work)work.inert=pupil;
 // Existing connection logic also manages disabled submit; do not enable it here.
 if(pupil)$('submitAnswer').disabled=true;
}
pauseButton.onclick=()=>{
 if(!state.room||!['live','demo'].includes(state.mode))return;
 const paused=!classPaused;
 if(state.mode==='live'){if(!isLive()){toast('Teacher is disconnected. Reconnect first.');return}send({type:'classroomPause',paused});pauseState.textContent='Updating class…';}
 else{classPaused=paused;channel?.postMessage({type:'ccEyesDemo',room:state.room,paused});applyPauseUI()}
};
channel?.addEventListener('message',e=>{
 const d=e.data;
 if(d?.type==='ccEyesDemo'&&state.mode==='demo'&&state.role==='student'&&d.room===state.room){
  classPaused=d.paused===true;applyPauseUI();
 }
});

// Pupil confidence: non-diagnostic signals; the teacher interprets working.
let confidence='',lastQuestion='',lastRound=0;
const confidencePanel=document.createElement('section');confidencePanel.id='ccConfidence';
confidencePanel.innerHTML='<strong>How confident are you?</strong><div class="cc-conf-choices"></div><p id="ccConfidenceInfo">Tell your teacher how you feel about this question.</p>';
const confidenceBox=confidencePanel.querySelector('.cc-conf-choices');
const confidenceOptions=[['confident','😊 I understand'],['unsure','😐 Not sure'],['help','🙋 Need help']];
const confidenceButtons=new Map();
function paintConfidence(){
 const enabled=state.role==='student'&&Boolean(state.question)&&['live','demo'].includes(state.mode)&&!classPaused;
 for(const [k,b] of confidenceButtons){
  b.setAttribute('aria-pressed',String(confidence===k));
  b.disabled=!enabled;
 }
 $('ccConfidenceInfo').textContent=classPaused?'Wait until your teacher resumes.':confidence==='help'?'Your teacher can see that you need help.':confidence?'Your confidence was selected privately.':'Tell your teacher how you feel about this question.';
}
for(const [key,label] of confidenceOptions){
 const b=document.createElement('button');b.type='button';b.textContent=label;b.setAttribute('aria-pressed','false');
 b.onclick=()=>{
  if(classPaused||!state.question)return;
  if(state.mode==='live'&&!isLive()){toast('Reconnect before sharing your confidence.');return}
  confidence=key;paintConfidence();
  if(state.mode==='live')send({type:'confidence',questionId:state.question.id,value:key});
  else toast('Demo confidence choice selected. No real teacher was notified.');
 };
 confidenceBox.append(b);confidenceButtons.set(key,b);
}
$('submitAnswer')?.before(confidencePanel);
const summary=document.createElement('div');summary.id='ccConfidenceOverview';
$('ccFormSummary')?.after(summary);
function paintConfidenceSummary(){
 if(state.role!=='teacher')return;
 const pupils=[...state.pupils.values()],tally={confident:0,unsure:0,help:0};
 for(const p of pupils)if(tally[p.confidence]!==undefined)tally[p.confidence]++;
 summary.textContent='Confidence: 😊 '+tally.confident+' understand · 😐 '+tally.unsure+' not sure · 🙋 '+tally.help+' need help';
 for(const tile of root.querySelectorAll('button[data-cc-pupil]')){
  const pupil=state.pupils.get(tile.dataset.ccPupil);
  const suffix=({confident:'😊',unsure:'😐',help:'🙋'})[pupil?.confidence]||'';
  const info=tile.querySelector('small:last-of-type');
  if(info){
   info.textContent=info.textContent.replace(/\s·\s[😊😐🙋]$/u,'')+(suffix?' · '+suffix:'');
  }
 }
}
function refreshQuestion(){
 const q=state.question;
 if(state.role!=='student')return;
 const newId=q?.id||'',round=Number(q?.retryRound)||0;
 if(newId!==lastQuestion||round!==lastRound){confidence='';lastQuestion=newId;lastRound=round}
 paintConfidence();
}

// Seating plan: 5 rows × 9 seats, stable pupil names, saved on this browser.
// Normal alphabetical grid remains available at all times.
const seats=45,columns=9;
const storageKey='ccMiniSeatPlan-v7';
let seatMap={};
try{const parsed=JSON.parse(localStorage.getItem(storageKey)||'{}');if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))seatMap=parsed}catch{}
const normName=x=>safeText(x,24).toLowerCase().replace(/\s+/g,' ');
function persistSeats(){try{localStorage.setItem(storageKey,JSON.stringify(seatMap))}catch{}}
const seatWrap=document.createElement('div');seatWrap.id='ccSeatScroll';root.before(seatWrap);seatWrap.append(root);
const seatBar=document.createElement('div');seatBar.id='ccSeatToolbar';
const seatToggle=document.createElement('button');seatToggle.type='button';seatToggle.textContent='▦ Seating plan';seatToggle.setAttribute('aria-pressed','false');
const arrangeToggle=document.createElement('button');arrangeToggle.type='button';arrangeToggle.textContent='Arrange seats';arrangeToggle.hidden=true;arrangeToggle.setAttribute('aria-pressed','false');
const resetSeats=document.createElement('button');resetSeats.type='button';resetSeats.textContent='Reset layout';resetSeats.hidden=true;
const seatNote=document.createElement('small');seatNote.textContent='5 rows × 9 seats · front of class at top';
seatBar.append(seatToggle,arrangeToggle,resetSeats,seatNote);
seatWrap.before(seatBar);
const seatMessage=document.createElement('div');seatMessage.id='ccSeatMessage';seatMessage.hidden=true;seatWrap.before(seatMessage);
let seatMode=false,arrange=false,selectedSeatPupil=null,dragPupilId=null;
function assignments(){
 const pupils=[...state.pupils.values()].sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}));
 const used=new Set,position=new Map;let changed=false;
 for(const p of pupils){
  const key=normName(p.name),candidate=Number(seatMap[key]);
  if(Number.isInteger(candidate)&&candidate>=0&&candidate<seats&&!used.has(candidate)&&seatMap[key]!==undefined){used.add(candidate);position.set(p.id,candidate)}
 }
 for(const p of pupils){
  if(position.has(p.id))continue;
  let idx=0;while(used.has(idx)&&idx<seats)idx++;
  if(idx===seats)break;
  used.add(idx);position.set(p.id,idx);seatMap[normName(p.name)]=idx;changed=true;
 }
 if(changed)persistSeats();
 return position;
}
function seatInfo(target){
 const tile=target?.closest?.('[data-cc-pupil],[data-seat-empty]');
 if(!tile)return null;
 if(tile.dataset.ccPupil)return {id:tile.dataset.ccPupil,index:Number(tile.dataset.seatIndex)};
 return {id:null,index:Number(tile.dataset.seatEmpty)};
}
function setSeat(id,target){
 if(id==null||!Number.isInteger(target)||target<0||target>=seats)return;
 const pos=assignments(),original=pos.get(id);
 if(original===undefined||original===target)return;
 const other=[...pos.entries()].find(([,seat])=>seat===target)?.[0];
 const moving=state.pupils.get(id);if(!moving)return;
 seatMap[normName(moving.name)]=target;
 if(other){const p2=state.pupils.get(other);if(p2)seatMap[normName(p2.name)]=original}
 persistSeats();selectedSeatPupil=null;paintSeats();
}
function paintSeats(){
 root.querySelectorAll('[data-seat-empty]').forEach(e=>e.remove());
 root.classList.toggle('cc-seating-mode',seatMode);
 root.classList.toggle('cc-seat-arranging',seatMode&&arrange);
 seatToggle.setAttribute('aria-pressed',String(seatMode));arrangeToggle.setAttribute('aria-pressed',String(arrange));
 arrangeToggle.hidden=!seatMode;resetSeats.hidden=!seatMode;seatMessage.hidden=!seatMode;
 if(!seatMode){
  for(const tile of root.querySelectorAll('button[data-cc-pupil]')){
   tile.style.order='';tile.removeAttribute('data-seat-index');tile.draggable=false;tile.classList.remove('cc-seat-selected');
  }
  seatWrap.scrollLeft=0;return;
 }
 const pos=assignments(),used=new Set(pos.values());
 for(const tile of root.querySelectorAll('button[data-cc-pupil]')){
  const seat=pos.get(tile.dataset.ccPupil);if(seat===undefined)continue;
  tile.style.order=String(seat);tile.dataset.seatIndex=String(seat);tile.draggable=arrange;
  tile.title='Seat '+(seat+1)+' · '+(state.pupils.get(tile.dataset.ccPupil)?.name||'');
  tile.classList.toggle('cc-seat-selected',tile.dataset.ccPupil===selectedSeatPupil);
 }
 for(let i=0;i<seats;i++)if(!used.has(i)){
  const blank=document.createElement('button');blank.type='button';blank.className='cc-seat-empty';blank.dataset.seatEmpty=String(i);
  blank.style.order=String(i);blank.textContent='Seat '+(i+1);blank.setAttribute('aria-label','Empty seat '+(i+1));
  root.append(blank);
 }
 seatMessage.textContent=arrange?(selectedSeatPupil?'Tap the new seat to move or swap this pupil.':'Tap a pupil, then tap the new seat. You can also drag on a laptop.'):'Front of class ↑ · Arrangements are saved privately in this browser by pupil name.';
}
seatToggle.onclick=()=>{seatMode=!seatMode;arrange=false;selectedSeatPupil=null;paintSeats()};
arrangeToggle.onclick=()=>{arrange=!arrange;selectedSeatPupil=null;paintSeats()};
resetSeats.onclick=()=>{
 if(!confirm('Reset the seating plan to alphabetical order?'))return;
 seatMap={};persistSeats();selectedSeatPupil=null;paintSeats();
};
seatWrap.addEventListener('click',e=>{
 if(!seatMode||!arrange||state.role!=='teacher')return;
 const clicked=seatInfo(e.target);if(!clicked)return;
 e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
 if(!selectedSeatPupil){if(clicked.id){selectedSeatPupil=clicked.id;paintSeats()}return}
 setSeat(selectedSeatPupil,clicked.index);
},true);
seatWrap.addEventListener('dblclick',e=>{if(seatMode&&arrange){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()}},true);
seatWrap.addEventListener('dragstart',e=>{
 if(!seatMode||!arrange)return;
 const item=seatInfo(e.target);if(!item?.id)return;
 dragPupilId=item.id;
 try{e.dataTransfer.setData('text/plain',item.id);e.dataTransfer.effectAllowed='move'}catch{}
},true);
seatWrap.addEventListener('dragover',e=>{if(seatMode&&arrange&&dragPupilId){e.preventDefault();e.dataTransfer.dropEffect='move'}},true);
seatWrap.addEventListener('drop',e=>{
 if(!seatMode||!arrange||!dragPupilId)return;
 const clicked=seatInfo(e.target);
 if(clicked){e.preventDefault();e.stopPropagation();setSeat(dragPupilId,clicked.index)}
 dragPupilId=null;
},true);
seatWrap.addEventListener('dragend',()=>{dragPupilId=null},true);

// Bookmarks: teacher may save the current *snapshot*, review it and project anonymously.
const bookPanel=document.createElement('section');bookPanel.id='ccBookPanel';
bookPanel.innerHTML='<h3>🔖 Saved teaching examples</h3><p style="font-size:12px;color:#627a73;margin:0 0 8px">Bookmark a good method or an interesting mistake. Only the teacher sees pupil names; projection is anonymous.</p><div id="ccBookList"></div>';
$('inspectTitle')?.closest('section')?.append(bookPanel);
const rejoin=document.createElement('button');rejoin.type='button';rejoin.id='ccPupilRejoin';rejoin.className='small soft';rejoin.textContent='↻ Approve new device';rejoin.title='Allow a disconnected pupil to rejoin on a new device for five minutes while preserving their working';
rejoin.style.marginTop='8px';
$('ccFormResolveHelp')?.after(rejoin);
function paintRejoin(){
 const p=state.pupils.get(state.selected);
 rejoin.disabled=!p||p.online!==false||state.mode!=='live'||state.ws?.readyState!==1;
 rejoin.title=p?.online?'Ask the pupil to close the original tab before approving a device change.':'Approve a one-time five-minute new-device reconnect for this pupil';
}
rejoin.onclick=()=>{
 const p=state.pupils.get(state.selected);
 if(!p||p.online!==false||!isLive())return;
 if(confirm('Allow '+p.name+' to reconnect on a new device within five minutes? The original device key will be invalidated.'))send({type:'permitRejoin',id:p.id});
};
const prevSelectPupil=selectPupil;
selectPupil=function(id){prevSelectPupil(id);paintRejoin()};
const addBook=document.createElement('button');addBook.type='button';addBook.id='ccBookSave';addBook.textContent='🔖 Save example';addBook.title='Bookmark this pupil’s current working as a teaching example';
$('projectReplay')?.after(addBook);
const bookModal=document.createElement('div');bookModal.id='ccBookModal';bookModal.hidden=true;
bookModal.innerHTML='<div class="cc-book-modalbody"><div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:9px"><strong id="ccBookmarkTitle">Saved example</strong><button id="ccBookmarkClose" type="button">✕ Close</button></div><canvas id="ccBookmarkCanvas" width="1000" height="600" aria-label="Bookmarked pupil working"></canvas><div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:10px"><button type="button" id="ccBookmarkProject">↗ Project anonymously</button><small style="align-self:center;color:#587670">Pupil name and teacher label stay private.</small></div></div>';
document.body.append(bookModal);
$('ccBookmarkClose').onclick=()=>{bookModal.hidden=true;currentBookmark=null};
let bookmarks=[],demoBookmarks=new Map(),currentBookmark=null,bookmarkEvents=[];
function paintBookmarks(){
 const list=$('ccBookList');list.replaceChildren();
 if(!bookmarks.length){const text=document.createElement('p');text.style.cssText='font-size:12px;color:#718580;margin:6px 0';text.textContent='No examples saved yet. Select a pupil and click Save example.';list.append(text);return}
 for(const mark of bookmarks.slice().reverse()){
  const row=document.createElement('div');row.className='cc-book-row';
  const info=document.createElement('div');
  const name=document.createElement('strong');name.textContent=mark.caption||'Saved working';name.style.fontSize='12px';
  const meta=document.createElement('small');meta.textContent='Question '+mark.questionNumber+' · '+mark.pupilName;
  info.append(name,meta);
  const acts=document.createElement('div');acts.className='cc-book-actions';
  for(const [title,action] of [['Preview','view'],['Project','project'],['Remove','remove']]){
   const b=document.createElement('button');b.type='button';b.textContent=title;
   b.onclick=()=>{
    if(action==='view'){
     if(state.mode==='demo'){const a=demoBookmarks.get(mark.id);if(a)showBookmark(mark,a.events)}
     else if(isLive())send({type:'bookmarkView',id:mark.id});
    }else if(action==='project'){
     if(isLive())send({type:'bookmarkProject',id:mark.id});
     else toast('Demo preview only. Live projection requires Worker v7.');
    }else if(confirm('Remove this saved example?')){
     if(state.mode==='demo'){bookmarks=bookmarks.filter(x=>x.id!==mark.id);demoBookmarks.delete(mark.id);paintBookmarks()}
     else if(isLive())send({type:'bookmarkRemove',id:mark.id});
    }
   };
   acts.append(b);
  }
  row.append(info,acts);list.append(row);
 }
}
function showBookmark(mark,events){
 currentBookmark=mark.id;bookmarkEvents=Array.isArray(events)?events:[];
 $('ccBookmarkTitle').textContent='Question '+mark.questionNumber+' · '+(mark.caption||'Saved working');
 bookModal.hidden=false;
 drawCommands($('ccBookmarkCanvas'),bookmarkEvents);
}
$('ccBookmarkProject').onclick=()=>{
 if(!currentBookmark)return;
 if(isLive())send({type:'bookmarkProject',id:currentBookmark});
 else toast('Projector demonstration requires the live classroom.');
};
addBook.onclick=()=>{
 const p=state.pupils.get(state.selected);
 if(!p||!state.question){toast('Select a pupil with written working first.');return}
 const caption=window.prompt('Short label for this teaching example:', 'Interesting method');
 if(caption===null)return;
 const label=safeText(caption,90)||'Interesting method';
 if(state.mode==='live'){
  if(!isLive()){toast('Reconnect before saving this example.');return}
  send({type:'bookmarkAdd',id:p.id,caption:label});
 }else if(state.mode==='demo'){
  if(bookmarks.length>=30){toast('30 example limit reached.');return}
  const events=(p.events||[]).map(e=>({...e}));
  if(!events.length){toast('No written working to save yet.');return}
  const id='demo-book-'+Date.now()+'-'+Math.random().toString(36).slice(2,6);
  const mark={id,caption:label,pupilName:p.name,questionNumber:state.question.number,createdAt:Date.now()};
  bookmarks.push(mark);demoBookmarks.set(id,{events});paintBookmarks();toast('Demo example bookmarked.');
 }else toast('Start a class before saving examples.');
};

// Extend existing event stream without modifying previous app versions.
const priorGrid=renderGrid;
renderGrid=function(){priorGrid();paintSeats();paintConfidenceSummary()};
const priorHandle=handle;
handle=function(d){
 if(!d||typeof d!=='object')return;
 if(d.type==='classroomPause'){
  classPaused=d.paused===true;applyPauseUI();paintConfidence();return;
 }
 if(d.type==='confidenceReceipt'&&state.role==='student'){
  if(d.questionId===state.question?.id){confidence=d.value||'';paintConfidence()}return;
 }
 if(d.type==='rejoinPermit'){toast('New-device reconnect approved for '+d.name+'. Ask this pupil to enter the same name and class PIN within five minutes.');paintRejoin();return}
 if(d.type==='bookmarkList'&&state.role==='teacher'){
  bookmarks=Array.isArray(d.bookmarks)?d.bookmarks.slice(0,30):[];paintBookmarks();return;
 }
 if(d.type==='bookmarkView'&&state.role==='teacher'){
  const found=bookmarks.find(b=>b.id===d.id);if(found)showBookmark(found,d.events);return;
 }
 if(d.type==='bookmarkProjected'){toast('Saved example sent anonymously to the projector.');return}
 const previous=state.question?.id;
 priorHandle(d);
 if(d.type==='welcome'){
  classPaused=d.paused===true;applyPauseUI();
  if(d.role==='student'){confidence=d.confidence||'';lastQuestion=state.question?.id||'';lastRound=Number(state.question?.retryRound)||0;paintConfidence();}
  if(d.role==='teacher'){paintConfidenceSummary();paintBookmarks()}
 }
 if(d.type==='question'){
  if(state.role==='student')refreshQuestion();
  if(state.role==='teacher')paintConfidenceSummary();
 }
 if(d.type==='status'&&state.role==='teacher'){paintConfidenceSummary();paintSeats();paintRejoin()}
 if(d.type==='feedbackPolicy'&&state.role==='student')applyPauseUI();
};
const priorSetup=setupDemo;
setupDemo=function(){
 bookmarks=[];demoBookmarks.clear();classPaused=false;confidence='';lastQuestion='';lastRound=0;
 priorSetup();applyPauseUI();paintConfidence();paintBookmarks();
};
const originalDemoStudent=$('joinDemo')?.onclick;
if(originalDemoStudent)$('joinDemo').onclick=function(){
 originalDemoStudent();classPaused=false;confidence='';refreshQuestion();applyPauseUI();
};
const oldSelectRole=selectRole;
selectRole=function(role){oldSelectRole(role);applyPauseUI();paintConfidence();if(role==='teacher')paintConfidenceSummary()};
const priorCreateRoom=$('createRoom')?.onclick;
if(priorCreateRoom)$('createRoom').onclick=async function(){
 bookmarks=[];demoBookmarks.clear();classPaused=false;
 const result=await priorCreateRoom();applyPauseUI();paintBookmarks();return result;
};
const priorClose=$('closeRoom')?.onclick;
if(priorClose)$('closeRoom').onclick=function(){const result=priorClose();applyPauseUI();return result};
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!bookModal.hidden){bookModal.hidden=true;currentBookmark=null}},true);
applyPauseUI();paintConfidence();paintConfidenceSummary();paintSeats();paintBookmarks();paintRejoin();
})();