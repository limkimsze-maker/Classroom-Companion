/* Whiteboard Smart · classroom usability beta v1
 * Teacher-controlled correctness, fast dashboard attention filters, pupil Move/Zoom,
 * smoothed writing, cautious palm rejection and honest writing-sync indicators.
 * Live feedback and ink acknowledgements require the separate v6 Worker.
 */
(function(){
'use strict';
if(new URLSearchParams(location.search).get('mode')==='projector')return;
const $=id=>document.getElementById(id);
const pupilCanvas=$('studentCanvas');
const teacherGrid=$('pupilGrid');
if(!pupilCanvas||!teacherGrid)return;
const css=document.createElement('style');
css.textContent=[
 '#ccAttentionBar{display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin:8px 0;padding:8px;border-radius:10px;background:#eff7f5;border:1px solid #c8e2db}',
 '#ccAttentionBar button{padding:7px 9px;min-height:38px;font-size:12px;font-weight:750;border-radius:9px;background:white;color:#275a57;border:1px solid #b6d4cc}',
 '#ccAttentionBar button[aria-pressed=true]{background:#0f766e;color:white;border-color:#0f766e}',
 '#ccAttentionCount{font:750 12px system-ui;color:#586d72;margin-left:auto}',
 '#ccFeedbackEditor{padding:9px 11px;border-radius:11px;background:#f3faf7;border:1px solid #c7ddd7;margin:10px 0}',
 '#ccFeedbackEditor select{max-width:100%;width:auto;min-width:190px;padding:7px;font-size:12px}',
 '#ccFeedbackEditor label{font-size:12px;font-weight:850}',
 '#ccFeedbackLive{display:flex;gap:9px;align-items:center;flex-wrap:wrap;margin:7px 0 0}',
 '#ccFeedbackLive select{min-width:205px;width:auto;max-width:100%;padding:7px;font-size:12px}',
 '#ccFeedbackLive button{padding:7px 11px;border-radius:8px;font-size:12px;background:#0f766e;color:#fff;border:1px solid #0f766e}',
 '#ccFeedbackLive button:disabled{opacity:.5}',
 '#ccFeedbackExplain{font-size:11px;color:#657b77;margin-top:6px}',
 '#ccWritingState{font:750 12px/1.45 system-ui;display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:7px 9px;margin:8px 0;border-radius:9px;border:1px solid #c7ddd5;background:#eff8f4;color:#286053}',
 '#ccWritingState[data-state=offline]{color:#915b18;background:#fff6e2;border-color:#f1d49b}',
 '#ccWritingState[data-state=error]{color:#ae3830;background:#fff0ed;border-color:#e7b9b4}',
 '#ccWritingState strong{font-weight:850}',
 '#ccWritingState span{font-weight:600}',
 '#ccMoveZoom{display:flex;align-items:center;gap:4px;flex-wrap:wrap;padding:3px;border-radius:8px;background:#f4f9f9;border:1px solid #d4e4e1}',
 '#ccMoveZoom button{min-height:43px!important;min-width:40px!important;padding:7px 9px!important;font-size:12px!important;font-weight:800}',
 '#ccMoveZoom .cc-is-moving{background:#0f766e!important;border-color:#0f766e!important;color:white!important}',
 '#ccZoomValue{font:800 12px system-ui;min-width:48px;display:inline-block;text-align:center;color:#335b5a}',
 '#ccZoomViewport{max-width:100%;overflow:auto;overscroll-behavior:contain;border-radius:0 0 8px 8px;background:#fff;touch-action:pan-x pan-y}',
 '#ccZoomViewport.cc-zooming{border:1px solid #b2d4ce}',
 '#ccZoomViewport.cc-zoom-moving{cursor:grab}',
 '#ccZoomViewport.cc-zoom-dragging{cursor:grabbing;user-select:none}',
 '#ccMoveHint{font:700 11px system-ui;color:#577c75;padding:4px 10px;background:#f4faf7;border-top:1px solid #e3efeb}',
 '#ccMoveHint[hidden]{display:none!important}',
 '#studentActivity.cc-pupil-expanded #ccWritingState{position:sticky;top:0;z-index:40}',
 '@media(max-width:670px){#ccAttentionBar{gap:4px;padding:6px}#ccAttentionBar button{padding:6px 8px;font-size:11px}#ccMoveZoom button{min-width:38px!important}#ccFeedbackLive select{width:100%}}'
].join('\n');document.head.appendChild(css);

// TEACHER: one-tap filters, never changes the teacher's selection or the pupils' work.
const filterBar=document.createElement('div');filterBar.id='ccAttentionBar';filterBar.setAttribute('aria-label','Filter pupils needing teacher attention');
const options=[
 ['all','All 45'],['help','✋ Need help'],['wrong','✕ Incorrect'],
 ['waiting','○ Not submitted'],['offline','⌁ Disconnected']
];
let activeFilter='all';
const filterBtns=new Map();
for(const [key,label] of options){
 const b=document.createElement('button');b.type='button';b.textContent=label;
 b.setAttribute('aria-pressed',String(key===activeFilter));
 b.onclick=()=>{activeFilter=key;applyFilter()};
 filterBar.append(b);filterBtns.set(key,b);
}
const count=document.createElement('span');count.id='ccAttentionCount';filterBar.append(count);
teacherGrid.before(filterBar);
function matchesFilter(p){
 if(activeFilter==='help')return p.helpNeeded===true;
 if(activeFilter==='wrong')return p.correct===false;
 if(activeFilter==='waiting')return !p.answer||p.correct===null;
 if(activeFilter==='offline')return p.online===false;
 return true;
}
function applyFilter(){
 let visible=0;
 for(const el of teacherGrid.querySelectorAll('button[data-cc-pupil]')){
  const p=state.pupils.get(el.dataset.ccPupil);
  const keep=!!p&&matchesFilter(p);
  el.hidden=!keep;el.style.display=keep?'':'none';
  if(keep)visible++;
 }
 for(const [k,b] of filterBtns)b.setAttribute('aria-pressed',String(k===activeFilter));
 count.textContent=visible+' / '+state.pupils.size+' shown';
}
const oldGrid=renderGrid;
renderGrid=function(){oldGrid();applyFilter()};
const oldHandle=handle;

// TEACHER: question-level and live feedback controls. The Worker, not CSS,
// decides whether correctness is disclosed. Default to hold for new questions.
const editor=document.createElement('div');editor.id='ccFeedbackEditor';
editor.innerHTML='<label for="ccFeedbackDraft">When should pupils see whether their answer is correct?</label><div style="margin-top:6px"><select id="ccFeedbackDraft"><option value="hold" selected>After I reveal the results</option><option value="instant">Immediately on submission</option></select></div><div id="ccFeedbackExplain">Holding correctness helps you discuss methods before pupils try guessing.</div>';
$('launchQuestion')?.closest('.row')?.before(editor);
const live=document.createElement('div');live.id='ccFeedbackLive';
live.innerHTML='<label for="ccFeedbackDuring" style="font-size:12px;font-weight:800">Current question:</label><select id="ccFeedbackDuring"><option value="hold">Keep correctness hidden</option><option value="instant">Show correctness immediately</option></select><button id="ccFeedbackReveal" type="button">Reveal results to pupils</button><small id="ccFeedbackLabel" style="font-size:11px;color:#52716d">Launch a question first</small>';
$('ccFormInsights')?.append(live);
let currentFeedback='hold',hasRevealed=false;
const oldQuestionMaker=makeQuestion;
makeQuestion=function(){const q=oldQuestionMaker();q.feedbackMode=$('ccFeedbackDraft').value;return q};
window.addEventListener('ccFormativePreparedLoaded',e=>{
 const mode=e.detail?.feedbackMode;
 if(['hold','instant'].includes(mode))$('ccFeedbackDraft').value=mode;
});
function showFeedbackControls(){
 const has=!!state.question&&['live','demo'].includes(state.mode);
 if(!has){$('ccFeedbackDuring').disabled=true;$('ccFeedbackReveal').disabled=true;$('ccFeedbackLabel').textContent='Launch a question first';return}
 const q=state.question;
 currentFeedback=q.feedbackMode==='instant'?'instant':'hold';
 hasRevealed=q.feedbackReleased===true;
 $('ccFeedbackDuring').value=currentFeedback;
 $('ccFeedbackDuring').disabled=state.mode!=='live';
 $('ccFeedbackReveal').disabled=state.mode!=='live'||currentFeedback==='instant'||hasRevealed;
 $('ccFeedbackLabel').textContent=state.mode==='demo'?'Demo only — no pupil delivery':currentFeedback==='instant'?'Pupils see marking immediately':hasRevealed?'Correctness has been revealed':'Pupils see “Answer received” until you reveal';
}
$('ccFeedbackDuring').onchange=e=>{
 const mode=e.target.value;
 if(state.mode!=='live'||!state.question)return;
 if(mode==='instant'&&!confirm('Show correctness to pupils who already submitted, and on future submissions? This cannot be undone for results already viewed.')){showFeedbackControls();return}
 send({type:'feedbackControl',action:'set',mode});
 $('ccFeedbackLabel').textContent='Updating feedback setting…';
};
$('ccFeedbackReveal').onclick=()=>{
 if(state.mode!=='live'||!state.question||currentFeedback!=='hold')return;
 if(!confirm('Reveal correctness privately to pupils who have submitted this question?'))return;
 send({type:'feedbackControl',action:'reveal'});
 $('ccFeedbackLabel').textContent='Requesting release of results…';
};

// PUPIL: Zoom & Move, without changing the saved 1000×600 coordinates.
const stage=$('ccPupilStage');
const boardbar=$('penTool')?.closest('.boardbar');
let zoom=1,move=false,pan=null,penAt=0,activeInkPointer=null,seq=0;
const rejectedPointers=new Set();
const viewport=document.createElement('div');viewport.id='ccZoomViewport';
stage.before(viewport);viewport.append(stage);
const moveHint=document.createElement('div');moveHint.id='ccMoveHint';moveHint.hidden=true;
moveHint.textContent='Move mode: drag to pan your working. Switch to Pen to continue writing.';
viewport.after(moveHint);
const zoomToolbar=document.createElement('div');zoomToolbar.id='ccMoveZoom';
const makeBtn=(id,txt,title)=>{
 const b=document.createElement('button');b.id=id;b.textContent=txt;b.type='button';b.title=title;return b;
};
const moveBtn=makeBtn('ccMoveTool','✥ Move','Move the zoomed whiteboard without drawing');
const minus=makeBtn('ccZoomOut','−','Zoom out');const plus=makeBtn('ccZoomIn','+','Zoom in');
const reset=makeBtn('ccZoomReset','100%','Reset view to 100%');reset.id='ccZoomValue';
zoomToolbar.append(moveBtn,minus,reset,plus);
boardbar.append(zoomToolbar);
function paintMove(){
 moveBtn.classList.toggle('cc-is-moving',move);
 moveBtn.setAttribute('aria-pressed',String(move));
 moveHint.hidden=!move;
 viewport.classList.toggle('cc-zoom-moving',move);
 if(!move&&pan){pan=null;viewport.classList.remove('cc-zoom-dragging')}
 if(move){$('penTool').classList.remove('active');$('eraserTool').classList.remove('active');}
 moveBtn.textContent=move?'✓ Move':'✥ Move';
}
function zoomTo(next){
 const z=Math.max(1,Math.min(2,Math.round(next*4)/4));
 const oldWidth=stage.getBoundingClientRect().width||viewport.clientWidth;
 const previousCenter=(viewport.scrollLeft+viewport.clientWidth/2)/Math.max(1,oldWidth);
 const prevTop=(viewport.scrollTop+viewport.clientHeight/2)/Math.max(1,stage.getBoundingClientRect().height);
 zoom=z;
 if(z===1){
  stage.style.width='100%';
  viewport.style.height='';
  viewport.classList.remove('cc-zooming');
  viewport.scrollLeft=0;viewport.scrollTop=0;
 }else{
  viewport.style.height=Math.round(viewport.clientWidth*3/5)+'px';
  stage.style.width=Math.round(z*100)+'%';
  viewport.classList.add('cc-zooming');
  requestAnimationFrame(()=>{
   viewport.scrollLeft=Math.max(0,previousCenter*stage.getBoundingClientRect().width-viewport.clientWidth/2);
   viewport.scrollTop=Math.max(0,prevTop*stage.getBoundingClientRect().height-viewport.clientHeight/2);
  });
 }
 reset.textContent=Math.round(zoom*100)+'%';
 minus.disabled=zoom<=1;plus.disabled=zoom>=2;
 reset.setAttribute('aria-label','Reset whiteboard zoom to 100 percent; currently '+Math.round(zoom*100)+' percent');
}
function setMove(on){
 if(on)$('penTool').click();
 move=on;
 paintMove();
}
moveBtn.onclick=()=>setMove(!move);
minus.onclick=()=>zoomTo(zoom-.25);
plus.onclick=()=>zoomTo(zoom+.25);
reset.onclick=()=>zoomTo(1);
for(const id of ['penTool','eraserTool','ccPupilLine','ccPupilRect','ccPupilText']){
 $(id)?.addEventListener('click',()=>{if(move){move=false;paintMove()}});
}
$('ccPupilExpand')?.addEventListener('click',()=>{if(zoom>1)requestAnimationFrame(()=>{viewport.style.height=Math.round(viewport.clientWidth*3/5)+'px'})});
window.addEventListener('resize',()=>{if(zoom>1)viewport.style.height=Math.round(viewport.clientWidth*3/5)+'px'},{passive:true});
function reject(e){rejectedPointers.add(e.pointerId);e.preventDefault();e.stopImmediatePropagation()}
function ignoredTouch(e){
 if(e.pointerType!=='touch')return false;
 return !e.isPrimary||Date.now()-penAt<1100||Math.max(Number(e.width)||0,Number(e.height)||0)>42;
}
pupilCanvas.addEventListener('pointerdown',e=>{
 if(move){
  if(e.pointerType==='mouse'&&e.button!==0)return reject(e);
  if(ignoredTouch(e))return reject(e);
  e.preventDefault();e.stopImmediatePropagation();
  pupilCanvas.setPointerCapture(e.pointerId);
  pan={id:e.pointerId,x:e.clientX,y:e.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};
  viewport.classList.add('cc-zoom-dragging');
  return;
 }
 if(ignoredTouch(e)||(activeInkPointer!==null&&activeInkPointer!==e.pointerId))return reject(e);
 if(e.pointerType==='pen')penAt=Date.now();
 activeInkPointer=e.pointerId;
},true);
pupilCanvas.addEventListener('pointermove',e=>{
 if(e.pointerType==='pen')penAt=Date.now();
 if(rejectedPointers.has(e.pointerId))return reject(e);
 if(pan&&pan.id===e.pointerId){
  e.preventDefault();e.stopImmediatePropagation();
  viewport.scrollLeft=pan.left-(e.clientX-pan.x);
  viewport.scrollTop=pan.top-(e.clientY-pan.y);
  return;
 }
},true);
for(const kind of ['pointerup','pointercancel']){
 pupilCanvas.addEventListener(kind,e=>{
  if(rejectedPointers.has(e.pointerId)){rejectedPointers.delete(e.pointerId);return reject(e)}
  if(pan&&pan.id===e.pointerId){e.preventDefault();e.stopImmediatePropagation();pan=null;viewport.classList.remove('cc-zoom-dragging');return}
  if(activeInkPointer===e.pointerId)activeInkPointer=null;
  if(e.pointerType==='pen')penAt=Date.now();
 },true);
}

// Smoothed rendering applies to the pupil, teacher inspection and projector replay.
// The event history stays untouched: undo, replay, and exact pupil working remain available.
drawCommands=function(canvas,events,until=Infinity){
 if(!canvas)return;
 const c=canvas.getContext('2d');if(!c)return;
 c.setTransform(1,0,0,1,0,0);
 c.clearRect(0,0,canvas.width,canvas.height);
 c.fillStyle='#fff';c.fillRect(0,0,canvas.width,canvas.height);
 const strokes=[],undone=[];
 for(const e of events||[]){
  if(!e||(Number(e.at)||0)>until)continue;
  if(e.op==='clear'){strokes.length=0;undone.length=0}
  else if(e.op==='undo'){if(strokes.length)undone.push(strokes.pop())}
  else if(e.op==='redo'){if(undone.length)strokes.push(undone.pop())}
  else if(e.op==='stroke'||e.op==='text'){strokes.push(e);undone.length=0}
 }
 c.save();c.scale(canvas.width/1000,canvas.height/600);
 c.lineCap='round';c.lineJoin='round';c.textBaseline='alphabetic';
 for(const e of strokes){
  c.fillStyle=/^#[a-f0-9]{6}$/i.test(e.color||'')?e.color:'#17324d';c.strokeStyle=c.fillStyle;
  if(e.op==='text'){
   const x=Math.min(980,Math.max(0,Number(e.x)||0)),y=Math.min(594,Math.max(20,Number(e.y)||0));
   c.font=Math.min(64,Math.max(14,Number(e.size)||30))+'px ui-sans-serif,system-ui,Arial,sans-serif';
   c.fillText(String(e.text||'').slice(0,80),x,y,Math.max(10,990-x));continue;
  }
  const pts=e.pts;
  if(!Array.isArray(pts)||!pts.length)continue;
  c.lineWidth=Math.min(60,Math.max(1,Number(e.width)||4));
  const first=pts[0];if(!Array.isArray(first))continue;
  const xy=p=>[Number(p[0])||0,Number(p[1])||0];
  const [x,y]=xy(first);c.beginPath();c.moveTo(x,y);
  if(pts.length===1){c.arc(x,y,c.lineWidth/2,0,Math.PI*2);c.fill();continue}
  if(pts.length===2){const [a,b]=xy(pts[1]);c.lineTo(a,b);c.stroke();continue}
  for(let i=1;i<pts.length-1;i++){
   const [px,py]=xy(pts[i]),[nx,ny]=xy(pts[i+1]);
   c.quadraticCurveTo(px,py,(px+nx)/2,(py+ny)/2);
  }
  const [endX,endY]=xy(pts.at(-1));c.lineTo(endX,endY);c.stroke();
 }
 c.restore();
};

// Pupil save status: only promise a teacher save on an actual Worker receipt.
const save=document.createElement('div');save.id='ccWritingState';save.setAttribute('role','status');save.setAttribute('aria-live','polite');
save.innerHTML='<strong id="ccSaveText">Writing status</strong><span id="ccAnswerSaveText">Start working to see your progress.</span>';
$('ccPupilStage')?.closest('.card')?.after(save);
const pending=new Set();
let lastInk=false,backupGood=true,answerPending=false,answerConfirmed=false,latestAck=0;
function backup(){
 if(state.mode!=='live'||!state.studentId||!state.question?.id)return true;
 try{
  const text=JSON.stringify(state.myEvents.slice(-220));
  if(text.length>430000)return false;
  sessionStorage.setItem('cc-mw-ink4:'+state.room+':'+state.studentId+':'+state.question.id,text);
  return true;
 }catch{return false}
}
function saveMessage(){
 if(state.role!=='student'||state.mode==='none'){save.hidden=true;return}
 save.hidden=false;
 const live=state.mode==='live',online=live&&state.ws?.readyState===1;
 let head='',detail='',status='normal';
 if(!live){head='Demo working';detail='Not sent to a real teacher.'}
 else if(!online){
  status='offline';head='Reconnecting…';
  detail=!lastInk?'Waiting to reconnect. Do not submit an answer yet.':backupGood?'Writing retained on this device. Do not close this tab.':'Local backup unavailable. Keep this tab open.';
 }else if(!lastInk){head='Connected';detail='Ready to write. Your working will sync to your teacher.'}
 else if(pending.size){head='Saving working…';detail=pending.size+' writing action'+(pending.size===1?'':'s')+' awaiting confirmation.'}
 else{head='✓ Working saved';detail='Confirmed received by classroom service.'}
 if(answerPending){detail+=' · Answer being sent';if(!online)status='offline'}
 else if(answerConfirmed)detail+=' · Answer received by teacher';
 save.dataset.state=status;$('ccSaveText').textContent=head;$('ccAnswerSaveText').textContent=detail;
 $('submitAnswer').disabled=live&&!online;
 $('submitAnswer').title=live&&!online?'Reconnect before submitting your answer':'Submit your final answer';
}
const originalAddInk=addInk;
addInk=function(event){
 if(state.mode!=='live'||state.role!=='student'){originalAddInk(event);saveMessage();return}
 const id='ink-'+Date.now().toString(36)+'-'+(++seq).toString(36);
 state.myEvents.push(event);drawCommands(pupilCanvas,state.myEvents);
 lastInk=true;backupGood=backup();
 pending.add(id);
 if(state.ws?.readyState===1)state.ws.send(JSON.stringify({type:'ink',questionId:state.myQuestionId,event,clientEventId:id}));
 saveMessage();
};
$('submitAnswer')?.addEventListener('click',()=>{
 if(state.mode==='live'&&state.ws?.readyState===1){
  if(myAnswer()){answerPending=true;answerConfirmed=false;saveMessage()}
 }
},false);
const originalHandle=handle;
handle=function(d){
 if(!d||typeof d!=='object')return;
 if(d.type==='inkReceipt'&&state.role==='student'){
  if(d.questionId===state.myQuestionId&&pending.has(d.clientEventId)){pending.delete(d.clientEventId);latestAck=Date.now()}
  saveMessage();return;
 }
 if(d.type==='answerReceipt'&&state.role==='student'){
  answerPending=false;answerConfirmed=true;
  $('answerFeedback').textContent='Answer received by your teacher. Feedback will be shared later.';
  $('answerFeedback').style.color='#287169';
  $('studentStatus').textContent='✓ Answer received';
  saveMessage();return;
 }
 if(d.type==='feedbackPolicy'&&state.role==='student'){saveMessage();return}
 if(d.type==='feedbackSettings'&&state.role==='teacher'){
  if(state.question?.id===d.questionId){state.question.feedbackMode=d.mode;state.question.feedbackReleased=d.released;showFeedbackControls()}
  return;
 }
 const previous=state.question?.id;
 oldHandle(d);
 if(d.type==='feedback'&&state.role==='student'){answerPending=false;answerConfirmed=true;saveMessage()}
 if(d.type==='welcome'&&d.role==='student'){
  if(Array.isArray(d.work)&&d.work.length){lastInk=true;latestAck=Date.now()}
  // The Worker already sent its version of this pupil's working.
  // Any missing writing will be recovered by the existing formative inkSync path.
  if(Array.isArray(d.work)&&pending.size){
   const fingerprint=e=>JSON.stringify([e.op,Number(e.at)||0,e.pts||[],e.color||'',e.text||'',e.x||0,e.y||0]);
   const onServer=new Set(d.work.map(fingerprint));
   if(state.myEvents.every(e=>onServer.has(fingerprint(e))))pending.clear();
  }
  saveMessage();
 }
 if(d.type==='inkSyncReceipt'&&state.role==='student'){pending.clear();latestAck=Date.now();saveMessage()}
 if(d.type==='question'){
  if(previous!==d.question?.id){pending.clear();lastInk=false;answerPending=false;answerConfirmed=false}
  if(state.role==='teacher')showFeedbackControls();
  else saveMessage();
 }
 if(d.type==='welcome'&&d.role==='teacher')showFeedbackControls();
};
const prevDemo=demoLaunch;
demoLaunch=function(q){prevDemo(q);if(state.question){state.question.feedbackMode=q.feedbackMode||'hold';state.question.feedbackReleased=false}showFeedbackControls()};
const prevSetup=setupDemo;
setupDemo=function(){prevSetup();showFeedbackControls()};
const prevRole=selectRole;
selectRole=function(role){prevRole(role);saveMessage();showFeedbackControls()};
let lastOnline=null;
setInterval(()=>{
 const online=state.mode==='live'&&state.ws?.readyState===1;
 if(lastOnline!==online){lastOnline=online;saveMessage()}
},900);
minus.disabled=true;
paintMove();showFeedbackControls();saveMessage();applyFilter();
})();