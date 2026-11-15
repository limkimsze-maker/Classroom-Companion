/* V12 · Teacher Take Control.
 * Authenticated live teacher can assist ONE pupil. Original V11 private
 * annotations still coexist. Teacher work is saved as original pupil
 * work events with by:'teacher', and cannot come from a pupil's socket.
 */
(function(){
'use strict';
if(new URLSearchParams(location.search).get('mode')==='projector')return;
const $=id=>document.getElementById(id);
const teacherCanvas=$('teacherCanvas'),pupilCanvas=$('studentCanvas'),
      pupilView=$('studentView'),teacherStage=$('ccTeacherCanvasWrap');
if(!teacherCanvas||!pupilCanvas||!pupilView||!teacherStage)return;
let activeId='',activeQuestion='',enabledOnPupil=false,pending=false,
    tool='off',pointer=null,color='#ad3142',thickness=5,objectKind='counter';
const modes=[['off','👁 Inspect'],['move','✋ Move'],['add','➕ Add object'],['remove','⌫ Remove object'],['pen','✎ Live pen'],['text','T Live text'],['erase','⌫ Erase pupil stroke']];
const kinds=[['counter','Counter'],['one','One'],['ten','Ten'],['hundred','Hundred'],['half','½ fraction'],['third','⅓ fraction'],['quarter','¼ fraction'],['numberLine','Number line']];
const canHelp=()=>state.role==='teacher'&&!!state.question&&!state.question.ended&&!!state.selected&&['demo','live'].includes(state.mode);
const myPage=()=>Math.max(1,Math.min(3,Number(teacherCanvas.dataset.ccWorkbookPage)||1));
const uid=()=>('tc'+Date.now().toString(36)+Math.random().toString(36).slice(2,7));
const validCurrent=()=>activeId===state.selected&&activeQuestion===state.question?.id;
const liveReady=()=>state.mode==='live'&&state.ws?.readyState===1;
const xy=e=>{const r=overlay.getBoundingClientRect();return{x:Math.min(1000,Math.max(0,(e.clientX-r.left)/r.width*1000)),y:Math.min(600,Math.max(0,(e.clientY-r.top)/r.height*600))}};
const tNow=()=>Math.max(0,Date.now()-(state.question?.startedAt||Date.now()));
const existingObjects=()=>window.ccMathWorkbookModel?.(state.selectedEvents||[],Infinity,myPage())?.objects||[];
const qName=()=>state.pupils.get(state.selected)?.name||'selected pupil';

window.ccPupilTeacherTakeoverActive=false;
const css=document.createElement('style');
css.textContent=[
'#ccTeacherTakeover{margin:10px 0;padding:12px;background:#f6fafc;border:1px solid #b5d7d9;border-radius:12px}',
'#ccTeacherTakeover h3{font:850 15px system-ui;margin:0 0 5px;color:#144e59}',
'#ccTeacherTakeover p{font:12px/1.45 system-ui;color:#456c73;margin:6px 0 10px}',
'#ccTeacherTakeover .cc-take-row{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:6px 0}',
'#ccTeacherTakeover button,#ccTeacherTakeover select{border-radius:8px;border:1px solid #9dbfc2;padding:8px 10px;min-height:39px;background:white;color:#225b64;font:750 12px system-ui}',
'#ccTeacherTakeover button[aria-pressed=true]{background:#116c79;color:white;border-color:#116c79}',
'#ccTeacherTakeover button:disabled{opacity:.44;cursor:not-allowed}',
'#ccTeacherTakeover #ccTakeStart{background:#146c6e;color:#fff;font-weight:900}',
'#ccTeacherTakeover #ccTakeRelease{background:#fff5ee;color:#a34c24;border-color:#d8ae99;font-weight:900}',
'#ccTeacherTakeover #ccTakeStatus{font:750 12px/1.45 system-ui;color:#28586b;background:#e5f3f5;padding:8px;border-radius:8px}',
'#ccTeacherTakeover #ccTakeStatus[data-active=true]{background:#fef0c6;color:#735517}',
'#ccTeacherTakeover input[type=color]{width:35px;height:35px;padding:1px}',
'#ccTakeOverlay{z-index:26;position:absolute;inset:0;width:100%;height:100%;touch-action:none;pointer-events:none}',
'#ccPupilTakeoverBanner{display:block;background:#fff2c8;color:#70501b;border:2px solid #d6a844;padding:13px;margin:9px 0;border-radius:12px;font:850 15px/1.5 system-ui}',
'#ccPupilTakeoverBanner[hidden]{display:none!important}',
'#studentView.ccTakeoverLocked .studentBoard,#studentView.ccTakeoverLocked #studentAnswerUI,#studentView.ccTakeoverLocked #submitAnswer{opacity:.79}',
'#studentView.ccTakeoverLocked #studentCanvas{cursor:not-allowed!important}'
].join('\n');document.head.append(css);
const box=document.createElement('section');box.id='ccTeacherTakeover';
box.innerHTML='<h3>Teacher Take Control · Individual Pupil</h3><p>Select a pupil, then temporarily control their whiteboard. Only that pupil is locked. You can move objects, write or erase, and return control instantly. All teacher movements are recorded.</p><div class="cc-take-row"><button id="ccTakeStart" type="button">✋ Take control of pupil</button><button id="ccTakeRelease" type="button">↪ Return control</button></div><div class="cc-take-row" id="ccTakeTools"></div><div class="cc-take-row"><label for="ccTakeKind">Object</label><select id="ccTakeKind"></select><label for="ccTakeColor">Pen</label><input id="ccTakeColor" type="color" value="#ad3142"><label for="ccTakeWidth">Width</label><input id="ccTakeWidth" type="range" min="2" max="16" value="5" style="width:80px"></div><div id="ccTakeStatus" role="status">Choose a pupil to assist.</div><p>Pen and text on this toolbar update the pupil’s work immediately after each stroke or entry. Your V11 private annotation tools remain available for erasing or restoring previous teacher marks.</p>';
$('ccTeacherAnnotation')?.after(box);
if(!box.isConnected)teacherStage.before(box);
const toolRow=$('ccTakeTools'),buttons=new Map();
for(const [key,label] of modes){const button=document.createElement('button');button.type='button';button.textContent=label;button.dataset.tool=key;button.setAttribute('aria-pressed','false');button.onclick=()=>{tool=key;render();};buttons.set(key,button);toolRow.append(button)}
for(const [kind,label] of kinds){const option=new Option(label,kind);$('ccTakeKind').add(option)}
$('ccTakeKind').onchange=e=>objectKind=e.target.value;
$('ccTakeColor').oninput=e=>color=e.target.value;
$('ccTakeWidth').oninput=e=>thickness=Number(e.target.value)||5;
const overlay=document.createElement('canvas');overlay.id='ccTakeOverlay';overlay.width=1000;overlay.height=600;
teacherStage.append(overlay);
const banner=document.createElement('div');banner.id='ccPupilTakeoverBanner';banner.hidden=true;
banner.textContent='Your teacher is helping on your whiteboard. Watch the working. You can continue when your teacher returns control.';
$('studentActivity')?.prepend(banner);
const setMessage=t=>{$('ccTakeStatus').textContent=t};
function render(){
 const active=validCurrent();
 box.hidden=state.role!=='teacher';
 $('ccTakeStart').disabled=!canHelp()||pending||active;
 $('ccTakeRelease').disabled=!active||pending;
 $('ccTakeStatus').dataset.active=String(active);
 if(!pending){
  if(active)setMessage('TEACHER IN CONTROL · '+qName()+'. Work together, then press Return control.');
  else setMessage(state.selected?'Ready to help '+qName()+'. Use Take control when needed.':'Select a pupil to assist.');
 }
 for(const [key,b] of buttons){b.setAttribute('aria-pressed',String(tool===key));b.disabled=!active||pending}
 overlay.style.pointerEvents=active&&!pending&&tool!=='off'?'auto':'none';
 overlay.style.cursor=tool==='move'?'grab':tool==='pen'?'crosshair':tool==='text'?'text':tool==='add'?'copy':tool==='remove'||tool==='erase'?'cell':'auto';
 $('ccTakeKind').disabled=!active||pending;
 $('ccTakeColor').disabled=!active||pending;
 $('ccTakeWidth').disabled=!active||pending;
 pupilView.classList.toggle('ccTakeoverLocked',enabledOnPupil);
 banner.hidden=!enabledOnPupil;
}
function returnControl(){
 if(!activeId)return;
 const id=activeId,qid=activeQuestion;
 activeId='';activeQuestion='';tool='off';pointer=null;
 if(state.mode==='live'&&liveReady()){
  pending=true;send({type:'takeoverControl',id,questionId:qid,enabled:false});
  setMessage('Returning '+(state.pupils.get(id)?.name||'pupil')+' to independent working…');
 }else pending=false;
 render();
}
$('ccTakeStart').onclick=()=>{
 if(!canHelp()||pending)return;
 if(state.mode==='demo'){
  activeId=state.selected;activeQuestion=state.question.id;tool='move';render();return;
 }
 if(!liveReady()){setMessage('Create or join a live V12 classroom Worker before taking control.');return}
 pending=true;send({type:'takeoverControl',id:state.selected,questionId:state.question.id,enabled:true});
 setMessage('Requesting control of '+qName()+'…');render();
};
$('ccTakeRelease').onclick=returnControl;
function sendInk(event){
 if(!validCurrent()||!state.question)return;
 if(state.mode==='demo'){
  const p=state.pupils.get(activeId);
  event.by='teacher';event.at=tNow();
  if(p){p.events=p.events||[];p.events.push(event);state.selectedEvents=p.events.slice();renderSelected();renderGrid();}
  setMessage('Demo teacher action recorded. Live delivery requires Worker V12.');
  return;
 }
 if(!liveReady()){setMessage('Connection unavailable. No change was sent.');return}
 send({type:'takeoverInk',id:activeId,questionId:activeQuestion,clientId:uid(),event});
}
function hitObject(point){
 const objects=existingObjects();
 let best=null,dist=55;
 for(const o of objects){
  const size=o.kind==='numberLine'?110:o.kind==='hundred'?80:o.kind==='ten'?65:40;
  const d=Math.hypot(point.x-o.x,point.y-o.y);
  if(d<Math.max(35,size)&&d<dist){best=o;dist=d}
 }
 return best;
}
function nearStroke(point){
 const record=window.ccAnnotationStateForPupil?.(state.selected);
 const masked=new Set(record?.masked||[]);
 let index=-1,dist=22;
 for(let i=0;i<(state.selectedEvents||[]).length;i++){
  const e=state.selectedEvents[i];
  if(masked.has(i)||(e?.page||1)!==myPage()||!['stroke','text'].includes(e?.op))continue;
  if(e.op==='text'){
   if(Math.hypot(point.x-e.x,point.y-e.y)<50){index=i;break}
  }else for(const p of e.pts||[]){
   const d=Math.hypot(point.x-p[0],point.y-p[1]);
   if(d<dist){index=i;dist=d}
  }
 }
 return index;
}
function preview(event){
 if(!state.selectedEvents)return;
 drawCommands(teacherCanvas,[...state.selectedEvents,event]);
}
function pointerDown(e){
 if(!validCurrent()||tool==='off'||pending)return;
 if(e.pointerType==='mouse'&&e.button!==0)return;
 e.preventDefault();e.stopPropagation();
 const pos=xy(e),page=myPage();
 if(tool==='move'||tool==='remove'){
  const item=hitObject(pos);
  if(!item){setMessage('Tap directly on an object to '+(tool==='move'?'move':'remove')+' it.');return}
  if(tool==='remove'){sendInk({op:'math',action:'remove',id:item.id,page,at:tNow()});return}
  pointer={id:e.pointerId,mode:'move',item,page,pt:pos,moved:false};
 }else if(tool==='add'){
  sendInk({op:'math',action:'add',id:uid(),kind:objectKind,x:pos.x,y:pos.y,page,at:tNow()});return;
 }else if(tool==='pen'){
  pointer={id:e.pointerId,mode:'pen',page,pts:[[pos.x,pos.y]]};
 }else if(tool==='text'){
  const text=window.prompt('Type a short note directly onto this pupil’s working (up to 80 characters):','');
  if(text?.trim())sendInk({op:'text',text:text.trim().slice(0,80),x:pos.x,y:pos.y,size:28,color,page,at:tNow()});
  return;
 }else if(tool==='erase'){
  const index=nearStroke(pos);
  if(index<0){setMessage('Tap near the pupil’s handwritten stroke or typed text to erase it.');return}
  if(state.mode==='demo'){setMessage('Use V11 Erase pupil stroke for demo work. Live erasing is available after V12 deployment.');return}
  send({type:'annotationCommit',id:activeId,questionId:activeQuestion,ops:[{op:'maskPupil',index}]});
  setMessage('Erasing the selected pupil stroke, while preserving its original in history…');
  return;
 }
 try{overlay.setPointerCapture(e.pointerId)}catch(_){}
}
function pointerMove(e){
 if(!pointer||e.pointerId!==pointer.id)return;
 e.preventDefault();
 const pos=xy(e);
 if(pointer.mode==='move'){
  pointer.pt=pos;pointer.moved=true;
  preview({op:'math',action:'move',id:pointer.item.id,x:pos.x,y:pos.y,page:pointer.page,at:tNow()});
 }else{
  if(pointer.pts.length<350){const prior=pointer.pts.at(-1);if(Math.hypot(pos.x-prior[0],pos.y-prior[1])>3)pointer.pts.push([pos.x,pos.y]);}
  preview({op:'stroke',pts:pointer.pts,color,width:thickness,page:pointer.page,at:tNow()});
 }
}
function pointerFinish(e){
 if(!pointer||e.pointerId!==pointer.id)return;
 e.preventDefault();
 const gesture=pointer;pointer=null;
 if(gesture.mode==='move'){
  if(gesture.moved)sendInk({op:'math',action:'move',id:gesture.item.id,x:gesture.pt.x,y:gesture.pt.y,page:gesture.page,at:tNow()});
 }else{
  if(gesture.pts.length)sendInk({op:'stroke',pts:gesture.pts,color,width:thickness,page:gesture.page,at:tNow()});
 }
 drawCommands(teacherCanvas,state.selectedEvents||[]);
}
overlay.addEventListener('pointerdown',pointerDown);
overlay.addEventListener('pointermove',pointerMove);
overlay.addEventListener('pointerup',pointerFinish);
overlay.addEventListener('pointercancel',()=>{pointer=null;drawCommands(teacherCanvas,state.selectedEvents||[])});
function setPupilLock(flag){enabledOnPupil=Boolean(flag);window.ccPupilTeacherTakeoverActive=enabledOnPupil;render();}
const activity=$('studentActivity');
function blockPupilEvent(e){
 if(!enabledOnPupil)return;
 if(e.target===banner||banner.contains(e.target))return;
 if(e.type==='keydown'&&e.key==='Tab')return;
 // Lock all pupil drawing and answer controls while allowing page scrolling.
 const editable=e.target.closest?.('canvas,button,input,textarea,select,[contenteditable=true],#ccPupilStage,#ccStudentPages');
 if(editable){e.preventDefault();e.stopImmediatePropagation()}
}
for(const ev of ['pointerdown','click','keydown','input','change'])activity?.addEventListener(ev,blockPupilEvent,true);
$('ccAnnTools')?.addEventListener('click',()=>{if(tool!=='off'){tool='off';render()} });
const oldSelect=selectPupil;
selectPupil=function(id){
 if(id!==state.selected&&validCurrent())returnControl();
 oldSelect(id);
 render();
};
const oldHandle=handle;
handle=function(d){
 if(!d||typeof d!=='object')return;
 if(d.type==='teacherTakeover'&&state.role==='student'){
  if(d.questionId===state.question?.id){
   setPupilLock(d.enabled===true);
   if(d.enabled)toast('Your teacher is helping with your working.');
   else toast('You can continue working independently.');
  }
  return;
 }
 if(d.type==='teacherWork'&&state.role==='student'){
  if(d.questionId!==state.question?.id||d.id!==state.studentId)return;
  state.myEvents=state.myEvents||[];
  state.myEvents.push(d.event);
  if(d.event?.page)window.ccWorkbookGotoPage?.(d.event.page);
  drawCommands(pupilCanvas,state.myEvents);
  return;
 }
 if(d.type==='takeoverState'&&state.role==='teacher'){
  pending=false;
  if(d.enabled===true){activeId=d.id;activeQuestion=d.questionId;tool='move'}
  else{activeId='';activeQuestion='';tool='off'}
  render();return;
 }
 if(d.type==='takeoverRejected'&&state.role==='teacher'){
  pending=false;render();setMessage(d.message||'Teacher control was not accepted.');return;
 }
 if(d.type==='takeoverInkReceipt'&&state.role==='teacher'){
  setMessage('Teacher action applied to '+(state.pupils.get(d.id)?.name||'the pupil')+'.');
  return;
 }
 const prevQ=state.question?.id;
 oldHandle(d);
 if(d.type==='welcome'){
  if(state.role==='teacher'){
   const info=d.teacherTakeover;
   activeId=info?.id||'';activeQuestion=info?.questionId||'';
  }else if(state.role==='student')setPupilLock(d.teacherTakeover===true);
 }
 if(d.type==='question'&&state.question?.id!==prevQ){
  activeId='';activeQuestion='';pending=false;tool='off';setPupilLock(false);
 }
 if(d.type==='questionEnded'){activeId='';activeQuestion='';pending=false;tool='off';setPupilLock(false)}
 if(['welcome','question','questionEnded','status','ink','work'].includes(d.type))render();
};
const oldDemo=demoLaunch;
demoLaunch=function(q){returnControl();oldDemo(q);activeId='';activeQuestion='';tool='off';render()};
const oldSetup=setupDemo;
setupDemo=function(){activeId='';activeQuestion='';pending=false;tool='off';oldSetup();render()};
const oldSelectRole=selectRole;
selectRole=function(role){oldSelectRole(role);render()};
render();
})();