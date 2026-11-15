/* Whiteboard Smart — Private Teacher Annotation v11.
 * Independent from all previous beta versions; no third-party graphics/code.
 * Teacher's pen/text/eraser and non-destructive pupil-stroke erase are sent
 * only after "Send to pupil", through the authenticated v11 Worker.
 */
(function(){
'use strict';
if(new URLSearchParams(location.search).get('mode')==='projector')return;
const $=id=>document.getElementById(id);
const teacherCanvas=$('teacherCanvas'),pupilCanvas=$('studentCanvas');
if(!teacherCanvas||!pupilCanvas)return;
const annotated=new Map(), drafts=[];
let tool='none',color='#c63841',width=5,drag=null,sending=false,dirty=false,seenKey='';
const empty=()=>({marks:[],masked:[],revision:0,updatedAt:0});
const questionId=()=>String(state.question?.id||'');
const roomKey=(id,q=questionId())=>q+'|'+String(id||'');
const stored=(id,q=questionId())=>annotated.get(roomKey(id,q))||empty();
const uid=()=>('t'+Date.now().toString(36)+Math.random().toString(36).slice(2,8));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
const isTeacher=()=>state.role==='teacher'&&!!state.question&&!!state.selected&&['live','demo'].includes(state.mode);
const currentPage=()=>Number(teacherCanvas.dataset.ccWorkbookPage)||1;
const pupilPage=()=>window.ccWorkbookCurrentPage?.()||1;
const canSend=()=>isTeacher()&&!sending&&(state.mode!=='live'||state.ws?.readyState===1);
function approxMark(rec,ops){
 const marks=[...(rec.marks||[])],masked=new Set(rec.masked||[]);
 for(const op of ops){
  if(op.op==='stroke'||op.op==='text')marks.push(op);
  else if(op.op==='eraseTeacher'){const ix=marks.findIndex(m=>m.id===op.id);if(ix>=0)marks.splice(ix,1)}
  else if(op.op==='maskPupil')masked.add(op.index);
  else if(op.op==='restorePupil')masked.delete(op.index);
 }
 return {marks,masked:[...masked]};
}
function selectedRecord(){return approxMark(stored(state.selected),drafts)}
function canvasRecord(canvas){
 if(canvas?.ccAnnotationRecord)return canvas.ccAnnotationRecord;
 if(canvas?.id==='studentCanvas')return stored(state.studentId);
 if(canvas?.id==='teacherCanvas')return selectedRecord();
 if(canvas?.dataset?.ccPupilId&&state.role==='teacher')return stored(canvas.dataset.ccPupilId);
 return null;
}
window.ccAnnotationFilterEvents=(canvas,events,questionOverride)=>{
 if(!Array.isArray(events))return events;
 const record=canvasRecord(canvas);
 if(!record?.masked?.length)return events;
 const masked=new Set(record.masked);
 return events.map((event,index)=>masked.has(index)&&['stroke','text'].includes(event?.op)?{...event,ccHidden:true}:event);
};
window.ccAnnotationHasMaskedEvents=canvas=>Boolean(canvasRecord(canvas)?.masked?.length);
window.ccAnnotationStateForPupil=id=>state.role==='teacher'?stored(id):null;
function drawMark(ctx,mark){
 if(!mark)return;
 ctx.save();
 if(mark.op==='stroke'){
  const pts=mark.pts||[];
  if(!pts.length){ctx.restore();return}
  ctx.strokeStyle=mark.color||'#c63841';ctx.fillStyle=ctx.strokeStyle;
  ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=mark.width||5;
  ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
  if(pts.length===1){ctx.arc(pts[0][0],pts[0][1],ctx.lineWidth/2,0,Math.PI*2);ctx.fill()}
  else{for(const p of pts.slice(1))ctx.lineTo(p[0],p[1]);ctx.stroke()}
 }else if(mark.op==='text'){
  const x=clamp(mark.x,0,1000),y=clamp(mark.y,0,600),size=clamp(mark.size,14,54);
  const lines=String(mark.text||'').split('\n').slice(0,5);
  ctx.font='700 '+size+'px system-ui,Arial,sans-serif';
  const w=Math.min(430,Math.max(120,...lines.map(t=>ctx.measureText(t).width+22)));
  const lineH=size*1.2,h=lines.length*lineH+14;
  const left=Math.min(x,1000-w-5),top=Math.min(y,600-h-4);
  ctx.fillStyle='rgba(255,248,206,.95)';ctx.strokeStyle='#ca983b';ctx.lineWidth=1.5;
  ctx.fillRect(left,top,w,h);ctx.strokeRect(left,top,w,h);
  ctx.fillStyle=mark.color||'#a32326';
  for(let i=0;i<lines.length;i++)ctx.fillText(lines[i],left+9,top+size+5+i*lineH,w-18);
 }
 ctx.restore();
}
function paintLayer(canvas,record,page,withDraft=false){
 if(!canvas)return;
 const c=canvas.getContext('2d');if(!c)return;
 c.setTransform(1,0,0,1,0,0);
 c.clearRect(0,0,canvas.width,canvas.height);
 c.save();c.scale(canvas.width/1000,canvas.height/600);
 for(const mark of record?.marks||[])if((mark.page||1)===page)drawMark(c,mark);
 if(withDraft&&drag?.mode==='pen'&&drag.mark&&(drag.mark.page||1)===page)drawMark(c,drag.mark);
 c.restore();
}
window.ccAnnotationDrawOnCanvas=(canvas,record,page)=>{
 if(!record?.marks?.length)return;
 const ctx=canvas.getContext('2d');if(!ctx)return;
 ctx.save();ctx.scale(canvas.width/1000,canvas.height/600);
 for(const mark of record.marks)if((mark.page||1)===page)drawMark(ctx,mark);
 ctx.restore();
};
const css=document.createElement('style');
css.textContent=[
 '#ccTeacherAnnotation{border:1px solid #c9dadb;border-radius:12px;padding:11px;margin:12px 0;background:#f4faf8}',
 '#ccTeacherAnnotation h3{font:850 15px system-ui;color:#135e54;margin:0 0 6px}',
 '#ccTeacherAnnotation small{font:11px/1.5 system-ui;color:#55756e}',
 '#ccTeacherAnnotation .cc-ann-actions{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:8px 0}',
 '#ccTeacherAnnotation button{border:1px solid #b3d0c9;background:#fff;color:#1d655c;min-height:40px;padding:7px 10px;font:750 12px system-ui;border-radius:8px}',
 '#ccTeacherAnnotation button[aria-pressed=true]{background:#126f62;color:#fff;border-color:#126f62}',
 '#ccTeacherAnnotation button:disabled{opacity:.48;cursor:not-allowed}',
 '#ccTeacherAnnotation #ccAnnSend{background:#0f766e;border-color:#0f766e;color:#fff;font-weight:900}',
 '#ccTeacherAnnotation #ccAnnUndoSent{color:#9c493f;border-color:#d6aaa2}',
 '#ccTeacherAnnotation label{display:flex;align-items:center;gap:5px;font:750 12px system-ui}',
 '#ccTeacherAnnotation input[type=color]{width:36px;height:36px;padding:1px;cursor:pointer;border:1px solid #b5ccc6;border-radius:7px}',
 '#ccTeacherAnnotation input[type=range]{width:80px}',
 '#ccTeacherAnnotation #ccAnnNotice{padding:7px;border-radius:6px;margin-top:6px;background:#ebf4f1;color:#225e55;font:12px/1.4 system-ui}',
 '#ccTeacherAnnotation #ccAnnNotice[hidden]{display:none}',
 '.cc-annotation-overlay{position:absolute;left:0;top:0;width:100%;height:100%;touch-action:none;z-index:20}',
 '#ccFeedbackPupilStatus{display:block;border-radius:8px;background:#fff8df;color:#745b1d;padding:6px 10px;font:750 12px/1.4 system-ui;margin:7px 0}',
 '#ccAnnTextEditor{position:absolute;z-index:31;display:flex;gap:5px;align-items:flex-start;background:#fff7d6;box-shadow:0 4px 15px #193d3c30;padding:8px;border-radius:8px;max-width:min(90vw,400px)}',
 '#ccAnnTextEditor textarea{width:210px;max-width:50vw;min-height:62px;border:1px solid #b8a468;border-radius:6px;background:white;resize:vertical;padding:6px;font:13px system-ui}',
 '#ccAnnTextEditor button{padding:6px 9px;min-height:35px}',
 '#ccAnnTextEditor[hidden]{display:none!important}'
].join('\n');document.head.appendChild(css);
const toolbar=document.createElement('section');toolbar.id='ccTeacherAnnotation';
toolbar.innerHTML='<h3>Private Teacher Annotation</h3><small>Select one pupil to draw, type or erase their working. Your edits appear only on that pupil’s screen after you press Send.</small><div class="cc-ann-actions" id="ccAnnTools"></div><div class="cc-ann-actions"><label>Ink <input type="color" id="ccAnnColor" value="#c63841"></label><label>Width <input id="ccAnnSize" type="range" min="2" max="15" value="5"></label><button id="ccAnnUndoDraft" type="button">↶ Undo draft</button><button id="ccAnnClearDraft" type="button">Clear draft</button><button id="ccAnnUndoSent" type="button">↶ Undo last sent</button><button id="ccAnnSend" type="button">Send to pupil</button></div><div id="ccAnnNotice" role="status">Choose a pupil, then select Pen, Text or an Eraser.</div><small>Erase pupil writing = remove the chosen stroke from the visible answer only. The original remains saved for teacher review. The pupil’s counters and the question background stay protected.</small>';
teacherCanvas.closest('.boardBox')?.before(toolbar);
const toolRow=$('ccAnnTools');
const toolDefs=[
 ['none','👁 Inspect'],['pen','✎ Pen'],['text','T Text box'],
 ['eraseTeacher','⌫ Erase my mark'],['maskPupil','⌫ Erase pupil stroke'],['restorePupil','↶ Restore pupil stroke']
];
const tools=new Map();
for(const [id,label] of toolDefs){
 const b=document.createElement('button');b.type='button';b.textContent=label;
 b.dataset.annTool=id;b.setAttribute('aria-pressed','false');b.onclick=()=>{tool=id;renderToolbar()};
 toolRow.append(b);tools.set(id,b);
}
const notice=$('ccAnnNotice');
function tell(message){notice.textContent=message;notice.hidden=false}
const tcWrap=document.createElement('div');tcWrap.id='ccTeacherCanvasWrap';tcWrap.style.cssText='position:relative;width:100%;line-height:0';
teacherCanvas.before(tcWrap);tcWrap.append(teacherCanvas);
const teacherOverlay=document.createElement('canvas');teacherOverlay.width=1000;teacherOverlay.height=600;
teacherOverlay.className='cc-annotation-overlay';teacherOverlay.id='ccTeacherFeedbackOverlay';tcWrap.append(teacherOverlay);
const textEditor=document.createElement('div');textEditor.id='ccAnnTextEditor';textEditor.hidden=true;
const textArea=document.createElement('textarea');textArea.maxLength=140;textArea.placeholder='Type private feedback…';textArea.setAttribute('aria-label','Teacher feedback text');
const addText=document.createElement('button');addText.type='button';addText.textContent='Add';
const cancelText=document.createElement('button');cancelText.type='button';cancelText.textContent='Cancel';
textEditor.append(textArea,addText,cancelText);tcWrap.append(textEditor);
let textAt=null;
function closeText(){textEditor.hidden=true;textAt=null;textArea.value=''}
function addTextMark(){
 if(!textAt||!textArea.value.trim())return;
 const mark={op:'text',id:uid(),text:textArea.value.trim().slice(0,140),x:textAt.x,y:textAt.y,size:24,color,page:textAt.page};
 drafts.push(mark);closeText();paintAll();tell('Text box drafted. Press Send to pupil.');
}
addText.onclick=addTextMark;cancelText.onclick=closeText;
textArea.onkeydown=e=>{
 if(e.key==='Escape'){e.preventDefault();closeText()}
 if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();addTextMark()}
};
function teacherReady(){
 return isTeacher()&&!sending;
}
function onPupil(){
 return state.role==='student'&&state.myQuestionId===questionId()&&!!state.studentId;
}
function ensureCanEdit(){
 if(!teacherReady()){tell('Select a pupil and launch a question first.');return false}
 if(state.mode==='archive'){tell('Archived work is read-only.');return false}
 return true;
}
function coords(event,canvas){
 const r=canvas.getBoundingClientRect();
 return {x:clamp((event.clientX-r.left)/r.width*1000,0,1000),y:clamp((event.clientY-r.top)/r.height*600,0,600)};
}
function lineDistance(p,a,b){
 const dx=b[0]-a[0],dy=b[1]-a[1];
 const d=dx*dx+dy*dy;
 const t=d?clamp(((p.x-a[0])*dx+(p.y-a[1])*dy)/d,0,1):0;
 return Math.hypot(p.x-a[0]-t*dx,p.y-a[1]-t*dy);
}
function markDistance(p,mark){
 if(mark.op==='text'){
  const size=Number(mark.size)||24,w=Math.min(430,Math.max(120,String(mark.text||'').length*size*.55+22)),h=size*1.2+16;
  const left=Math.min(mark.x,1000-w-5),top=Math.min(mark.y,600-h-4);
  if(p.x>=left-8&&p.x<=left+w+8&&p.y>=top-8&&p.y<=top+h+8)return 0;
  return Infinity;
 }
 if(!Array.isArray(mark.pts)||!mark.pts.length)return Infinity;
 let best=Infinity;
 for(let i=0;i<mark.pts.length;i++){
  const a=mark.pts[i],b=mark.pts[Math.min(i+1,mark.pts.length-1)];
  best=Math.min(best,lineDistance(p,a,b));
 }
 return best;
}
function hitTeacher(p,page){
 const marks=selectedRecord().marks||[];
 let best=null,distance=21;
 for(const mark of marks){if((mark.page||1)!==page)continue;const d=markDistance(p,mark);if(d<distance){distance=d;best=mark}}
 return best;
}
function hitPupil(p,page,restore=false){
 const masked=new Set(selectedRecord().masked||[]);
 const events=state.selectedEvents||[];
 let winner=null,distance=25;
 for(let i=0;i<events.length;i++){
  const ev=events[i];
  if(!['stroke','text'].includes(ev?.op)||(ev.page||1)!==page)continue;
  if(restore!==masked.has(i))continue;
  const d=markDistance(p,ev);
  if(d<distance){winner=i;distance=d}
 }
 return winner;
}
teacherOverlay.addEventListener('pointerdown',e=>{
 if(tool==='none')return;
 e.preventDefault();e.stopPropagation();
 if(!ensureCanEdit())return;
 if(e.pointerType==='mouse'&&e.button!==0)return;
 const p=coords(e,teacherOverlay),page=currentPage();
 if(tool==='text'){
  textAt={...p,page};
  const box=teacherOverlay.getBoundingClientRect();
  textEditor.style.left=Math.max(5,Math.min(box.width-270,Math.max(5,e.clientX-box.left)))+'px';
  textEditor.style.top=Math.min(box.height-95,Math.max(5,e.clientY-box.top))+'px';
  textEditor.hidden=false;textArea.focus();return;
 }
 if(tool==='eraseTeacher'){
  const mark=hitTeacher(p,page);
  if(!mark){tell('Tap directly on one of your teacher marks to erase it.');return}
  if(drafts.some(op=>op.id===mark.id&&(op.op==='stroke'||op.op==='text'))){
   const index=drafts.findIndex(op=>op.id===mark.id);if(index>=0)drafts.splice(index,1);
  }else drafts.push({op:'eraseTeacher',id:mark.id});
  paintAll();tell('Teacher mark removed from draft. Press Send to update the pupil.');return;
 }
 if(tool==='maskPupil'||tool==='restorePupil'){
  const idx=hitPupil(p,page,tool==='restorePupil');
  if(idx===null){tell(tool==='restorePupil'?'Tap near a hidden pupil pen stroke to restore it.':'Tap near a pupil pen stroke or typed entry to erase it.');return}
  drafts.push({op:tool,index:idx});
  paintAll();tell(tool==='maskPupil'?'Pupil stroke hidden in draft; the original is still saved.':'Pupil stroke restored in draft.');
  return;
 }
 if(tool==='pen'){
  drag={id:e.pointerId,mode:'pen',mark:{op:'stroke',id:uid(),page,color,width,pts:[[p.x,p.y]]}};
  try{teacherOverlay.setPointerCapture(e.pointerId)}catch(_){}
  paintAll();
 }
});
teacherOverlay.addEventListener('pointermove',e=>{
 if(!drag||drag.id!==e.pointerId)return;
 e.preventDefault();
 const p=coords(e,teacherOverlay),pts=drag.mark.pts;
 if(pts.length>=200)return;
 const last=pts.at(-1);
 if(Math.hypot(p.x-last[0],p.y-last[1])>=2){pts.push([p.x,p.y]);paintTeacherLayer()}
});
function finishDrawing(e){
 if(!drag||drag.id!==e.pointerId)return;
 e.preventDefault();
 const mark=drag.mark;drag=null;
 if(mark.pts.length>=1){drafts.push(mark);tell('Teacher pen mark drafted. Send to pupil when ready.')}
 paintAll();
}
teacherOverlay.addEventListener('pointerup',finishDrawing);
teacherOverlay.addEventListener('pointercancel',e=>{if(drag?.id===e.pointerId){drag=null;paintAll()}});
function paintTeacherLayer(){
 if(!teacherOverlay)return;
 paintLayer(teacherOverlay,selectedRecord(),currentPage(),true);
}
const pupilStage=$('ccPupilStage')||pupilCanvas.parentElement;
const pupilOverlay=document.createElement('canvas');pupilOverlay.width=1000;pupilOverlay.height=600;
pupilOverlay.id='ccPupilTeacherFeedbackOverlay';pupilOverlay.setAttribute('aria-hidden','true');
pupilOverlay.style.cssText='position:absolute;pointer-events:none;z-index:12;touch-action:none';
pupilStage?.append(pupilOverlay);
const pupilFeedbackStatus=document.createElement('span');pupilFeedbackStatus.id='ccFeedbackPupilStatus';
pupilFeedbackStatus.textContent='Your teacher may write or type feedback directly on your working.';
pupilFeedbackStatus.hidden=true;
pupilStage?.after(pupilFeedbackStatus);
function positionPupilOverlay(){
 if(!pupilStage)return;
 const stageRect=pupilStage.getBoundingClientRect(),rect=pupilCanvas.getBoundingClientRect();
 pupilOverlay.style.left=(rect.left-stageRect.left+pupilStage.scrollLeft)+'px';
 pupilOverlay.style.top=(rect.top-stageRect.top+pupilStage.scrollTop)+'px';
 pupilOverlay.style.width=rect.width+'px';pupilOverlay.style.height=rect.height+'px';
}
function paintPupilLayer(){
 if(!onPupil()){pupilFeedbackStatus.hidden=true;paintLayer(pupilOverlay,empty(),1);return}
 positionPupilOverlay();
 const record=stored(state.studentId);
 paintLayer(pupilOverlay,record,pupilPage());
 pupilFeedbackStatus.hidden=!(record.marks?.length||record.masked?.length);
 if(!pupilFeedbackStatus.hidden)pupilFeedbackStatus.textContent='Private feedback from your teacher · Red/blue marks are teacher annotations. Your original writing is preserved.';
}
function paintAll(){
 if(state.role==='teacher'&&state.selected){
  // Redraw the working itself after a reversible erase mask.
  drawCommands(teacherCanvas,state.selectedEvents||[]);
 }
 paintTeacherLayer();paintPupilLayer();renderToolbar();
}
function renderToolbar(){
 for(const [id,b] of tools){
  b.setAttribute('aria-pressed',String(tool===id));b.disabled=!isTeacher()||sending;
 }
 teacherOverlay.style.pointerEvents=tool==='none'||!isTeacher()?'none':'auto';
 teacherOverlay.style.cursor=tool==='pen'?'crosshair':tool==='text'?'text':tool.includes('Pupil')||tool==='eraseTeacher'?'cell':'default';
 $('ccAnnSend').disabled=!drafts.length||!canSend();
 $('ccAnnSend').textContent=sending?'Sending…':drafts.length?'Send to pupil ('+drafts.length+')':'Send to pupil';
 $('ccAnnUndoDraft').disabled=!drafts.length||sending;
 $('ccAnnClearDraft').disabled=!drafts.length||sending;
 $('ccAnnUndoSent').disabled=!isTeacher()||sending||state.mode!=='live';
 toolbar.hidden=state.role!=='teacher';
}
$('ccAnnColor').oninput=e=>{color=e.target.value};
$('ccAnnSize').oninput=e=>{width=Number(e.target.value)||5};
$('ccAnnUndoDraft').onclick=()=>{
 if(drafts.length){drafts.pop();paintAll();tell('Last draft action undone. Not sent.')}
};
$('ccAnnClearDraft').onclick=()=>{
 drafts.length=0;closeText();paintAll();tell('Unsent annotations cleared. Pupil work is unchanged.');
};
$('ccAnnSend').onclick=()=>{
 if(!drafts.length||!canSend()){tell('Select a pupil and prepare a drawing or text first.');return}
 const id=state.selected,qid=questionId(),ops=drafts.map(op=>structuredClone(op));
 if(state.mode==='demo'){
  const merged=selectedRecord();
  annotated.set(roomKey(id,qid),{...merged,revision:stored(id,qid).revision+1});
  const pupil=state.pupils.get(id);if(pupil)pupil.teacherAnnotations=structuredClone(merged);
  drafts.length=0;paintAll();
  tell('Demo: feedback saved for '+(pupil?.name||'selected pupil')+'. Live delivery requires Worker V11.');
  toast('Demo teacher annotation created. Live private delivery requires Worker V11.');
  return;
 }
 if(ops.length>32){tell('Send a maximum of 32 changes at once.');return}
 sending=true;dirty=true;renderToolbar();
 send({type:'annotationCommit',id,questionId:qid,ops});
 tell('Sending private feedback to '+(state.pupils.get(id)?.name||'the selected pupil')+'…');
};
$('ccAnnUndoSent').onclick=()=>{
 if(!isTeacher()||state.mode!=='live'||state.ws?.readyState!==1)return;
 if(drafts.length){tell('Send or discard your unsent edits before undoing the last sent feedback.');return}
 sending=true;dirty=false;renderToolbar();
 send({type:'annotationUndo',id:state.selected,questionId:questionId()});
 tell('Undoing the last feedback sent to this pupil…');
};
function clearDraftOnSelection(){
 if(sending){tell('Finish sending private feedback before changing pupil.');return false}
 if(!drafts.length)return true;
 if(!confirm('You have unsent teacher annotations. Discard them and switch pupil?'))return false;
 drafts.length=0;closeText();return true;
}
const originalSelect=selectPupil;
selectPupil=function(id){
 if(id!==state.selected&&!clearDraftOnSelection())return;
 originalSelect(id);
 if(state.mode==='live'&&id&&state.question)send({type:'annotationFetch',id,questionId:questionId()});
 renderToolbar();paintTeacherLayer();
};
const originalHandle=handle;
handle=function(d){
 if(!d||typeof d!=='object')return;
 if(d.type==='annotationState'){
  if(!d.questionId||!d.pupilId)return;
  // Only the student's own annotation state or the authenticated teacher's
  // selected pupil is stored by this browser.
  if(state.role==='student'&&d.pupilId!==state.studentId)return;
  if(state.role==='teacher'&&!state.pupils.has(d.pupilId))return;
  const key=roomKey(d.pupilId,d.questionId),old=annotated.get(key);
  const revision=Number(d.revision)||0;
  if(old&&(Number(old.revision)||0)>revision)return;
  annotated.set(key,{marks:Array.isArray(d.marks)?d.marks.slice(0,125):[],masked:Array.isArray(d.masked)?d.masked.filter(Number.isInteger):[],revision,updatedAt:d.updatedAt||0});
  if(state.role==='student'&&d.questionId===questionId()){
   if(old&&revision>old.revision)toast('New private feedback from your teacher.');
   paintPupilLayer();drawCommands(pupilCanvas,state.myEvents||[]);
  }
  if(state.role==='teacher'&&state.selected===d.pupilId&&d.questionId===questionId())paintAll();
  if(state.role==='teacher'&&d.questionId===questionId())renderGrid();
  return;
 }
 if(d.type==='annotationReceipt'&&state.role==='teacher'){
  if(d.questionId===questionId()&&state.selected===d.pupilId){
   sending=false;drafts.length=0;closeText();paintAll();
   tell(d.action==='annotationUndo'?'Last sent feedback undone.':'Feedback delivered privately to '+(state.pupils.get(d.pupilId)?.name||'this pupil')+'.');
  }
  return;
 }
 if(d.type==='annotationRejected'&&state.role==='teacher'){
  sending=false;renderToolbar();tell(d.message||'Feedback could not be sent. You can retry.');return;
 }
 const before=questionId();
 originalHandle(d);
 if(d.type==='question'&&questionId()!==before){
  drafts.length=0;sending=false;closeText();tool='none';paintAll();
 }
 if(d.type==='welcome'){
  if(d.role==='teacher'&&state.selected&&state.question)send({type:'annotationFetch',id:state.selected,questionId:questionId()});
  if(d.role==='student'){paintPupilLayer()}
  renderToolbar();
 }
 if(d.type==='question'&&state.role==='student')paintPupilLayer();
};
const priorDemo=demoLaunch;
demoLaunch=function(q){
 drafts.length=0;tool='none';closeText();
 priorDemo(q);paintAll();
};
const priorSetup=setupDemo;
setupDemo=function(){drafts.length=0;annotated.clear();sending=false;tool='none';priorSetup();paintAll()};
const priorRole=selectRole;
selectRole=function(role){priorRole(role);renderToolbar();if(role==='student')paintPupilLayer()};
for(const id of ['ccTeacherPages','ccStudentPages']){
 $(id)?.addEventListener('click',()=>{paintTeacherLayer();paintPupilLayer();renderToolbar()});
}
window.addEventListener('resize',()=>{positionPupilOverlay();paintAll()});
if(typeof ResizeObserver==='function'){
 const observer=new ResizeObserver(()=>{positionPupilOverlay()});
 observer.observe(pupilCanvas);
}
requestAnimationFrame(()=>{positionPupilOverlay();paintTeacherLayer();paintPupilLayer();renderToolbar()});
})();