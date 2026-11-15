/* Mini Whiteboard private teacher-pupil feedback v1.
 * Authenticated WebSocket chat is enforced by the separate v3 Classroom Worker.
 * No message is broadcast to pupils or projected. Private chat is not part of
 * the session export; Worker expires room data after six hours.
 */
(function(){
'use strict';
if(new URLSearchParams(location.search).get('mode')==='projector')return;
const $=id=>document.getElementById(id);
const MAX=280, histories=new Map(), unread=new Set(),drafts=new Map();
let messagesEnabled=true,repliesEnabled=true,chatServerReady=false,selectedId=null;
let pupilPolicy={canReply:false,chatInitiated:false,messagesEnabled:true,globalReplies:true,replyEnabled:true};
const css=document.createElement('style');
css.textContent=[
'#ccPrivateTeacher,#ccPrivateStudent{margin-top:14px;border:1px solid #b9dcd5;background:#f7fcfa;border-radius:13px;padding:13px}',
'#ccPrivateTeacher h3,#ccPrivateStudent h3{margin:0 0 5px;font-size:15px;color:#174a4a}',
'.ccChatSettings{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:6px 0}',
'.ccChatSettings label,.ccChatPupilSetting label{display:inline-flex;align-items:center;gap:6px;font:750 12px system-ui;color:#24515e}',
'.ccChatSettings input,.ccChatPupilSetting input{width:16px;height:16px;accent-color:#0f766e}',
'.ccChatStatus{font-size:12px;color:#5b737b;line-height:1.4;margin:6px 0}',
'.ccChatThread{height:150px;overflow-y:auto;border:1px solid #d4e8e4;border-radius:9px;background:#fff;padding:9px;margin:9px 0;display:flex;flex-direction:column;gap:7px}',
'.ccChatBubble{border-radius:10px;padding:7px 9px;max-width:90%;font:13px/1.45 system-ui;overflow-wrap:anywhere;white-space:pre-wrap}',
'.ccChatBubble small{display:block;font-size:10px;color:#6b8088;margin-bottom:3px}',
'.ccChatBubble.fromTeacher{background:#e2f5f0;align-self:flex-end}',
'.ccChatBubble.fromStudent{background:#edf2fb;align-self:flex-start}',
'.ccChatComposer{display:flex;flex-wrap:wrap;gap:7px;align-items:stretch}',
'.ccChatComposer textarea{flex:1 1 250px;resize:vertical;min-height:48px;max-height:110px;border:1px solid #bfd7d3;border-radius:8px;padding:8px;font:13px system-ui}',
'.ccChatComposer button{flex:0 0 auto;padding:8px 13px;border-radius:8px;background:#0f766e;color:#fff;border:0;font-weight:800}',
'.ccChatComposer button:disabled,.ccChatComposer textarea:disabled{opacity:.5;cursor:not-allowed}',
'.ccChatPresets{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}',
'.ccChatPresets button{font:750 11px system-ui;padding:5px 7px;border-radius:20px;border:1px solid #b9d4cf;background:#fff;color:#126a62}',
'.ccChatPresets button:disabled{opacity:.45}',
'.pupil.cc-newreply::after{content:"Reply";position:absolute;right:3px;top:3px;background:#164e9c;color:white;border-radius:12px;padding:2px 5px;font:700 9px system-ui}',
'#ccPrivateStudent.cc-new-private{border:2px solid #0f766e;background:#e7f6f1}',
'#ccPrivateStudent .ccChatThread{height:126px}',
 '#ccPrivateTeacher.cc-chat-docked{position:fixed;top:55px;right:10px;width:min(455px,calc(100vw - 20px));max-height:calc(100dvh - 68px);overflow:auto;background:#f7fcfa;z-index:900;box-shadow:0 15px 50px #112d4366;border:2px solid #0f766e}',
 '#ccPrivateTeacher.cc-chat-docked .ccChatThread{height:190px}',
 '#ccChatDockClose{display:none;float:right;padding:4px 8px;font-size:12px;font-weight:850;border:1px solid #b5d1cd;border-radius:7px;background:#fff;color:#174a4a}',
 '#ccPrivateTeacher.cc-chat-docked #ccChatDockClose{display:inline-block}',
 '#ccChatQuickOpen{background:#e3f6ef;border:1px solid #a5d4ca;border-radius:7px;color:#0f665d;font-size:12px;font-weight:850;padding:7px 10px}',
'@media(max-width:600px){#ccPrivateTeacher,#ccPrivateStudent{padding:9px}.ccChatThread{height:118px}}'
].join('\n');document.head.appendChild(css);

const teacherPanel=document.createElement('section');
teacherPanel.id='ccPrivateTeacher';
teacherPanel.setAttribute('aria-label','Private messages to the selected pupil');
teacherPanel.innerHTML='<div class="row between"><h3>✉ Private feedback</h3><span id="ccTeacherChatRecipient" class="pill amber">Select a pupil</span></div><p class="ccChatStatus" id="ccTeacherChatInfo">Select a pupil above. Send a private hint while they work or after a wrong answer.</p><div class="ccChatPupilSetting"><label><input type="checkbox" id="ccTeacherPupilReplies" checked> This pupil may reply</label></div><div id="ccTeacherThread" class="ccChatThread" role="log" aria-live="polite"></div><div class="ccChatComposer"><textarea id="ccTeacherChatText" maxlength="280" placeholder="Write a private hint for this pupil…" aria-label="Private message to selected pupil"></textarea><button type="button" id="ccTeacherChatSend">Send privately</button></div><div class="ccChatPresets" id="ccTeacherChatPresets"></div>';
$('inspectTitle')?.closest('section')?.appendChild(teacherPanel);

const closeDock=document.createElement('button');closeDock.type='button';closeDock.id='ccChatDockClose';closeDock.textContent='✕ Close';closeDock.onclick=()=>teacherPanel.classList.remove('cc-chat-docked');teacherPanel.prepend(closeDock);
const quickMessage=document.createElement('button');quickMessage.type='button';quickMessage.id='ccChatQuickOpen';quickMessage.textContent='✉ Private hint';quickMessage.title='Send a discreet note to the selected pupil without leaving the dashboard';
quickMessage.onclick=()=>{
 if(!state.selected||!state.pupils.has(state.selected)){toast('Select a pupil tile first.');return;}
 teacherPanel.classList.add('cc-chat-docked');$('ccTeacherChatText')?.focus();
};
$('ccFocusDashboardBar')?.prepend(quickMessage);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&teacherPanel.classList.contains('cc-chat-docked')){teacherPanel.classList.remove('cc-chat-docked');e.stopPropagation();}},true);
const global=document.createElement('div');global.id='ccPrivateGlobalControls';global.className='ccChatSettings';
global.innerHTML='<label><input type="checkbox" id="ccMessagesEnabled" checked> Private messaging ON</label><label><input type="checkbox" id="ccRepliesEnabled" checked> Pupils may reply</label><span id="ccChatServerStatus" class="ccChatStatus">Demo preview · Live messages need Worker v3</span>';
$('ccFocusDashboardBar')?.appendChild(global);

const pupilPanel=document.createElement('section');pupilPanel.id='ccPrivateStudent';pupilPanel.setAttribute('aria-label','Private messages from your teacher');
pupilPanel.innerHTML='<h3>✉ Private message from your teacher</h3><p class="ccChatStatus" id="ccStudentChatInfo">Your teacher can send a private hint. No other pupil can see this conversation.</p><div id="ccStudentThread" class="ccChatThread" role="log" aria-live="polite"></div><div class="ccChatComposer"><textarea id="ccStudentChatText" maxlength="280" placeholder="Reply privately to your teacher…" aria-label="Private reply to your teacher"></textarea><button type="button" id="ccStudentChatSend">Reply</button></div>';
$('answerFeedback')?.after(pupilPanel);
const canned=[
['Check working','Please check your working and try again.'],
['Explain thinking','Can you explain how you got your answer?'],
['Try a diagram','Try drawing a diagram or bar model to explain your method.'],
['Check units','Check that you have used the correct units.'],
['Good effort','Good effort showing your working. Keep going!']
];
for(const [label,msg] of canned){
 const b=document.createElement('button');b.type='button';b.textContent=label;b.title=msg;
 b.onclick=()=>{const input=$('ccTeacherChatText');input.value=msg;input.focus();};
 $('ccTeacherChatPresets').appendChild(b);
}
function chatList(id){if(!histories.has(id))histories.set(id,[]);return histories.get(id)}
function pushChat(id,msg){
 if(!id||!msg||typeof msg.text!=='string'||!['teacher','student'].includes(msg.role))return;
 const list=chatList(id);
 if(list.some(x=>x.id===msg.id))return;
 list.push({id:String(msg.id||Date.now()),text:msg.text.slice(0,MAX),role:msg.role,at:Number(msg.at)||Date.now()});
 if(list.length>40)list.splice(0,list.length-40);
 if(msg.role==='student'&&id!==state.selected)unread.add(id);
}
function historyReplace(id,messages){
 if(!id||!Array.isArray(messages))return;
 const clean=[];
 for(const m of messages.slice(-40)){
  if(!m||!['teacher','student'].includes(m.role)||typeof m.text!=='string')continue;
  clean.push({id:String(m.id||Math.random()),role:m.role,text:m.text.slice(0,MAX),at:Number(m.at)||Date.now()});
 }
 histories.set(id,clean);
}
function paintThread(el,messages,pupilSide=false){
 if(!el)return;const atBottom=el.scrollHeight-el.clientHeight-el.scrollTop<75;
 el.replaceChildren();
 if(!messages.length){
  const blank=document.createElement('span');blank.className='ccChatStatus';blank.textContent=pupilSide?'No messages yet. Continue working on your whiteboard.':'No messages yet. A private hint will appear only on this pupil’s screen.';el.appendChild(blank);return;
 }
 for(const m of messages){
  const wrap=document.createElement('div');wrap.className='ccChatBubble '+(m.role==='teacher'?'fromTeacher':'fromStudent');
  const label=document.createElement('small'),at=Number(m.at);
  label.textContent=(m.role==='teacher'?'Teacher':'Pupil')+' · '+(at?new Date(at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}):'');
  const body=document.createElement('div');body.textContent=m.text;
  wrap.append(label,body);el.appendChild(wrap);
 }
 if(atBottom||pupilSide)el.scrollTop=el.scrollHeight;
}
function updateBadges(){
 $('pupilGrid')?.querySelectorAll('button[data-cc-pupil]').forEach(x=>x.classList.toggle('cc-newreply',unread.has(x.dataset.ccPupil)));
}
function usable(){return state.mode==='demo'||state.mode==='live'&&chatServerReady&&state.ws?.readyState===1}
function teacherControls(){
 const chosen=state.selected?state.pupils.get(state.selected):null;
 $('ccTeacherChatRecipient').textContent=chosen?chosen.name:'Select a pupil';
 const enabled=Boolean(chosen)&&usable()&&messagesEnabled&&state.role==='teacher'&&state.mode!=='archive';
 $('ccTeacherChatText').disabled=!enabled;$('ccTeacherChatSend').disabled=!enabled;
 const pCheck=$('ccTeacherPupilReplies');
 pCheck.disabled=!chosen||!usable()||!messagesEnabled||state.role!=='teacher'||state.mode==='archive';
 pCheck.checked=chosen?.replyEnabled!==false;
 $('ccTeacherChatInfo').textContent=!chosen?'Click any pupil to send a discreet, private hint.':!messagesEnabled?'Teacher has paused private messaging.':state.mode==='live'&&!chatServerReady?'Deploy the private-feedback Worker v3 to enable messaging.':chosen.correct===false?'Incorrect answer received. You can send a gentle hint and invite a reply.':'Private messages are visible only to the selected pupil; they never appear on the projector.';
 $('ccMessagesEnabled').checked=messagesEnabled;$('ccRepliesEnabled').checked=repliesEnabled;
 $('ccRepliesEnabled').disabled=!messagesEnabled||state.mode==='archive'||!usable();
 $('ccMessagesEnabled').disabled=state.mode==='archive'||!usable();
 $('ccChatServerStatus').textContent=state.mode==='live'?(chatServerReady?'● Private feedback connected':'○ Worker v3 needed for private feedback'):state.mode==='demo'?'Simulated messaging demo; no real pupil delivery':'Start a class to use feedback';
 paintThread($('ccTeacherThread'),chosen?chatList(chosen.id):[]);
 updateBadges();
}
function studentControls(){
 const id=state.studentId;
 const ready=state.role==='student'&&state.mode!=='none';
 const allowed=ready&&pupilPolicy.canReply&&pupilPolicy.messagesEnabled!==false&&(state.mode==='demo'||state.ws?.readyState===1);
 $('ccStudentChatText').disabled=!allowed;$('ccStudentChatSend').disabled=!allowed;
 $('ccStudentChatInfo').textContent=!ready?'Join a classroom to receive a private note.':!pupilPolicy.messagesEnabled?'Teacher has paused private messaging.':!pupilPolicy.chatInitiated?'Your teacher may send a private hint. Replies become available afterwards.':!pupilPolicy.canReply?'Teacher has temporarily disabled pupil replies. You can still read earlier notes.':'Your reply goes only to your teacher. Keep it about your learning.';
 paintThread($('ccStudentThread'),id?chatList(id):[],true);
}
function updateUI(){teacherControls();studentControls()}
const oldSelect=selectPupil;
selectPupil=function(id){
 if(selectedId&&$('ccTeacherChatText'))drafts.set(selectedId,$('ccTeacherChatText').value);
 oldSelect(id);selectedId=id;unread.delete(id);
 $('ccTeacherChatText').value=drafts.get(id)||'';
 if(state.mode==='live'&&chatServerReady&&id)send({type:'chatHistory',id});
 updateUI();
};
function setGlobal(){
 if(state.mode==='live'){
  if(!chatServerReady){toast('Private messaging needs Worker v3.');updateUI();return}
  send({type:'chatSettings',messagesEnabled,repliesEnabled});
 }
 updateUI();
}
$('ccMessagesEnabled').onchange=e=>{messagesEnabled=Boolean(e.target.checked);setGlobal()};
$('ccRepliesEnabled').onchange=e=>{repliesEnabled=Boolean(e.target.checked);setGlobal()};
$('ccTeacherPupilReplies').onchange=e=>{
 if(!state.selected)return;const p=state.pupils.get(state.selected);if(!p)return;
 p.replyEnabled=Boolean(e.target.checked);
 if(state.mode==='live')send({type:'chatPupilReply',id:state.selected,enabled:p.replyEnabled});
 updateUI();
};
function safeInput(v){return String(v||'').replace(/[\u0000-\u001f<>]/g,'').trim().slice(0,MAX)}
$('ccTeacherChatSend').onclick=()=>{
 const id=state.selected,text=safeInput($('ccTeacherChatText').value);
 if(!id||!text||!usable()||!messagesEnabled)return;
 if(state.mode==='live')send({type:'chatSend',id,text});
 else{
  const p=state.pupils.get(id);if(!p)return;
  p.chatInitiated=true;
  pushChat(id,{id:'demo-'+Date.now(),role:'teacher',text,at:Date.now()});
  toast('Simulated private hint sent to '+p.name+' (demo only).');
 }
 $('ccTeacherChatText').value='';drafts.delete(id);
 updateUI();
};
$('ccTeacherChatText').addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();$('ccTeacherChatSend').click()}});
$('ccStudentChatSend').onclick=()=>{
 const text=safeInput($('ccStudentChatText').value);if(!text||!pupilPolicy.canReply)return;
 if(state.mode==='live'){
  if(state.ws?.readyState!==1)return;
  send({type:'chatReply',text});$('ccStudentChatText').value='';
 }else if(state.mode==='demo'){
  pushChat(state.studentId,{id:'demo-reply-'+Date.now(),role:'student',text,at:Date.now()});
  $('ccStudentChatText').value='';
  toast('Demo reply shown locally only; no teacher received it.');
  studentControls();
 }
};
$('ccStudentChatText').addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();$('ccStudentChatSend').click()}});
const demoReply=document.createElement('button');demoReply.type='button';demoReply.id='ccDemoPupilReply';demoReply.className='small soft';demoReply.textContent='Simulate pupil reply';demoReply.title='Preview a reply to your private message (demo only)';
demoReply.onclick=()=>{
 if(state.mode!=='demo'||!state.selected||!messagesEnabled||!repliesEnabled)return;
 const p=state.pupils.get(state.selected);if(!p?.chatInitiated||p.replyEnabled===false)return;
 const options=['I understand now. Thank you!','I tried again but I am still unsure about this step.','I used a different method. May I show you?'];
 pushChat(p.id,{id:'sim-'+Date.now(),role:'student',text:options[Math.floor(Math.random()*options.length)],at:Date.now()});
 toast('Simulated reply received from '+p.name+'.');updateUI();
};
$('ccTeacherChatSend').after(demoReply);
const prevHandle=handle;
handle=function(d){
 if(!d||typeof d!=='object')return;
 if(d.type==='chatSettings'&&state.role==='teacher'){
  chatServerReady=true;messagesEnabled=d.messagesEnabled!==false;repliesEnabled=d.repliesEnabled!==false;if(state.selected)send({type:'chatHistory',id:state.selected});updateUI();return;
 }
 if(d.type==='chatPolicy'&&state.role==='student'){
  pupilPolicy={...pupilPolicy,...d};studentControls();return;
 }
 if(d.type==='chatHistory'){
  const id=d.pupilId||state.studentId;
  if(state.role==='student'&&id!==state.studentId)return;
  if(state.role==='teacher'&&!state.pupils.has(id))return;
  historyReplace(id,d.messages);
  if(state.role==='student')pupilPolicy={...pupilPolicy,...d};
  if(state.role==='teacher'){const p=state.pupils.get(id);if(p){p.replyEnabled=d.replyEnabled!==false;p.chatInitiated=d.chatInitiated===true;}}
  updateUI();return;
 }
 if(d.type==='chatMessage'&&d.message){
  if(state.role==='student'&&d.pupilId!==state.studentId)return;
  if(state.role==='teacher'&&!state.pupils.has(d.pupilId))return;
  pushChat(d.pupilId,d.message);
  if(state.role==='student'&&d.message.role==='teacher'){
   pupilPolicy.chatInitiated=true;
   $('ccPrivateStudent')?.classList.add('cc-new-private');
   toast('Your teacher has sent you a private note.');
  }
  if(state.role==='teacher'&&d.message.role==='student'){
   if(d.pupilId!==state.selected)toast('A pupil replied privately. Select their tile to read it.');
   else toast('Private reply received.');
  }
  updateUI();return;
 }
 if(d.type==='chatRejected'){
  toast(d.message||'Private message not sent.');return;
 }
 prevHandle(d);
 if(['welcome','status','question','feedback'].includes(d.type))updateUI();
};
const oldSetupDemo=setupDemo;
setupDemo=function(){
 histories.clear();unread.clear();drafts.clear();selectedId=null;
 messagesEnabled=true;repliesEnabled=true;chatServerReady=false;
 oldSetupDemo();updateUI();
};
const oldDemoStudent=$('joinDemo')?.onclick;
if(oldDemoStudent)$('joinDemo').onclick=function(){
 oldDemoStudent();pupilPolicy={canReply:false,chatInitiated:false,messagesEnabled:true,replyEnabled:true,globalReplies:true};
 studentControls();
};
const oldCreateRoom=$('createRoom')?.onclick;
if(oldCreateRoom)$('createRoom').onclick=async function(){
 chatServerReady=false;messagesEnabled=true;repliesEnabled=true;histories.clear();unread.clear();drafts.clear();selectedId=null;
 updateUI();return oldCreateRoom();
};
const originalRenderGrid=renderGrid;
renderGrid=function(){originalRenderGrid();updateBadges()};
const t=setInterval(()=>{
 if($('ccDemoPupilReply'))$('ccDemoPupilReply').hidden=state.mode!=='demo'||!messagesEnabled||!repliesEnabled||!state.selected||!state.pupils.get(state.selected)?.chatInitiated||state.pupils.get(state.selected)?.replyEnabled===false;
 if(state.mode==='live'&&state.ws?.readyState!==1&&chatServerReady){chatServerReady=false;teacherControls()}
},1500);
window.addEventListener('pagehide',()=>clearInterval(t),{once:true});
updateUI();
})();
