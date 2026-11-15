/* Mini Whiteboard focus mode: 45 live written-work previews + compact teach/monitor actions.
   Runs inside the new isolated classroom beta; old Classroom Mode is untouched. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const isProjector=new URLSearchParams(location.search).get('mode')==='projector';
const canvases=new Map(), pendingDraw=new Set();
let paintFrame=0,watchAllConfirmed=false;
const css=document.createElement('style');
css.textContent=[
 '#pupilGrid{grid-template-columns:repeat(9,minmax(0,1fr));gap:6px}',
 '#pupilGrid.cc-large-previews{grid-template-columns:repeat(5,minmax(0,1fr))}',
 '#pupilGrid .pupil{padding:5px;min-width:0;min-height:113px;display:flex;flex-direction:column;align-items:stretch;gap:3px;overflow:visible;position:relative;text-align:left}',
 '#pupilGrid .pupil b{font-size:11px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
 '#pupilGrid .pupil small{font-size:10px;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
 '#pupilGrid .cc-ink-thumb{width:100%;height:auto;aspect-ratio:5/3;display:block;background:#fff;border:1px solid #d2e1e3;border-radius:5px;object-fit:contain}',
 '#pupilGrid .pupil:hover{z-index:3}',
 '#pupilGrid .pupil:hover .cc-ink-thumb{border-color:#0f766e}',
 '#ccFocusDashboardBar{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin:10px 0 6px}',
 '#ccFocusDashboardBar button,#ccFocusDashboardBar select{padding:7px 9px;font-size:12px;font-weight:800;max-width:210px;width:auto}',
 '#ccFocusLiveStatus{font-size:11px;font-weight:800;color:#45636a}',
 '#ccFocusFloatingTeach{position:fixed;bottom:12px;right:12px;z-index:99;border:0;border-radius:50px;padding:9px 13px;background:#0f766e;color:#fff;box-shadow:0 3px 12px #0d504b55;font:800 12px system-ui}',
 '@media(max-width:980px){#pupilGrid{grid-template-columns:repeat(6,minmax(0,1fr))}#pupilGrid.cc-large-previews{grid-template-columns:repeat(3,minmax(0,1fr))}}',
 '@media(max-width:580px){#pupilGrid{grid-template-columns:repeat(4,minmax(0,1fr))}#pupilGrid.cc-large-previews{grid-template-columns:repeat(2,minmax(0,1fr))}#pupilGrid .pupil{min-height:86px;padding:3px}#pupilGrid .pupil b{font-size:10px}}'
].join('\n');document.head.appendChild(css);
function notifyParent(type){if(window.parent!==window)window.parent.postMessage({type},location.origin)}
if(isProjector)return;
const studentCanvas=$('studentCanvas');
let lastPartial=0;
if(studentCanvas)studentCanvas.addEventListener('pointermove',()=>{
 if(state.role!=='student'||state.mode!=='live'||!state.question||!state.myQuestionId)return;
 if(!state.ws||state.ws.readyState!==1||typeof stroke==='undefined'||!stroke||stroke.op!=='stroke')return;
 const now=Date.now();if(now-lastPartial<160||stroke.pts.length<2)return;lastPartial=now;
 const skip=Math.max(1,Math.ceil(stroke.pts.length/300));
 const pts=stroke.pts.filter((v,i)=>i%skip===0).slice(-300);
 state.ws.send(JSON.stringify({type:'inkPreview',questionId:state.myQuestionId,event:{op:'stroke',pts,color:stroke.color,width:stroke.width,at:stroke.at}}));
},{passive:true});
const oldRenderGrid=renderGrid;
function paintInk(canvas,events,partial){
 if(!canvas)return;
 const context=canvas.getContext('2d');if(!context)return;
 const w=canvas.width,h=canvas.height;
 context.setTransform(1,0,0,1,0,0);context.fillStyle='#fff';context.fillRect(0,0,w,h);
 const active=[],undone=[];
 for(const e of events||[]){
  if(!e||!['stroke','undo','redo','clear'].includes(e.op))continue;
  if(e.op==='clear'){active.length=0;undone.length=0}
  else if(e.op==='undo'){if(active.length)undone.push(active.pop())}
  else if(e.op==='redo'){if(undone.length)active.push(undone.pop())}
  else if(e.op==='stroke'){active.push(e);undone.length=0}
 }
 if(partial?.op==='stroke')active.push(partial);
 context.save();context.scale(w/1000,h/600);
 context.lineCap='round';context.lineJoin='round';
 for(const e of active){
  if(!Array.isArray(e.pts)||!e.pts.length)continue;
  context.beginPath();context.strokeStyle=/^#[a-f0-9]{6}$/i.test(e.color||'')?e.color:'#17324d';
  context.fillStyle=context.strokeStyle;context.lineWidth=Math.max(1,Math.min(60,Number(e.width)||4));
  const first=e.pts[0];if(!Array.isArray(first))continue;
  context.moveTo(Number(first[0])||0,Number(first[1])||0);
  if(e.pts.length===1){context.arc(Number(first[0])||0,Number(first[1])||0,Math.max(1,context.lineWidth/2),0,Math.PI*2);context.fill()}
  else{for(const p of e.pts.slice(1)){if(Array.isArray(p))context.lineTo(Number(p[0])||0,Number(p[1])||0)}context.stroke()}
 }
 context.restore();
}
function queuePaint(id){
 if(!id)return;
 pendingDraw.add(id);
 if(paintFrame)return;
 paintFrame=requestAnimationFrame(()=>{
  paintFrame=0;for(const key of pendingDraw){
   const p=state.pupils.get(key),canvas=canvases.get(key);
   if(p&&canvas)paintInk(canvas,p.events||[],p.ccPartial||null);
  }
  pendingDraw.clear();
 });
}
renderGrid=function(){
 const root=$('pupilGrid');if(!root)return;
 const existing=new Map(Array.from(root.querySelectorAll('button[data-cc-pupil]'),el=>[el.dataset.ccPupil,el]));
 const pupils=[...state.pupils.values()].sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}));
 for(const p of pupils){
  const status=pupilStatus(p);
  let button=existing.get(p.id);
  if(!button){
   button=document.createElement('button');button.type='button';button.dataset.ccPupil=p.id;
   const n=document.createElement('b'),thumb=document.createElement('canvas'),desc=document.createElement('small');
   thumb.className='cc-ink-thumb';thumb.width=300;thumb.height=180;thumb.setAttribute('aria-hidden','true');
   button.append(n,thumb,desc);button.onclick=()=>selectPupil(p.id);
   button.ondblclick=()=>{selectPupil(p.id);$('projectReplay')?.click()};
   canvases.set(p.id,thumb);
  }
  button.className='pupil '+status+(p.id===state.selected?' selected':'');
  button.setAttribute('aria-label',p.name+', '+status+'. Select to inspect, double-click to show work');
  button.firstElementChild.textContent=p.name;
  button.lastElementChild.textContent=({correct:'✓ Correct',wrong:'✕ Check',working:'✎ Working',unanswered:'○ Pending'})[status]+(!p.online?' · offline':'');
  root.appendChild(button);
  existing.delete(p.id);
  if(!button.dataset.ccInitial){button.dataset.ccInitial='1';queuePaint(p.id)}
 }
 for(const [id,el] of existing){el.remove();canvases.delete(id)}
 const tried=pupils.filter(p=>p.correct!==null||p.worked).length;
 $('statPupils').textContent=pupils.length+'/45';$('statTried').textContent=tried;
 $('statCorrect').textContent=pupils.filter(p=>p.correct===true).length;
 if(!pupils.length){
  const empty=document.createElement('div');empty.className='muted';
  empty.style.cssText='grid-column:1/-1;padding:28px;text-align:center';
  empty.textContent='No pupil connections yet. Start a demo or create a room.';
  root.appendChild(empty);
 }else root.querySelectorAll(':scope > .muted').forEach(x=>x.remove());
};
const oldSelectPupil=selectPupil;
selectPupil=function(id){
 oldSelectPupil(id);
 const p=state.pupils.get(id);
 if(p?.events?.length){state.selectedEvents=p.events.slice();renderSelected()}
};
const oldHandle=handle;
handle=function(d){
 if(!d||typeof d!=='object')return;
 if(d.type==='welcome'){
  oldHandle(d);
  if(d.role==='teacher'&&state.mode==='live'){
   watchAllConfirmed=false;updateStatus();
   send({type:'watchAll',enabled:true});
  }
  return;
 }
 if(d.type==='previewSubscription'){
  watchAllConfirmed=d.enabled===true;updateStatus();return;
 }
 if(d.type==='workPreview'&&state.role==='teacher'){
  if(d.questionId!==state.question?.id)return;
  const p=state.pupils.get(d.id);if(!p)return;
  p.events=Array.isArray(d.events)?d.events.slice(0,1200):[];p.ccPartial=null;
  queuePaint(d.id);
  if(state.selected===d.id){state.selectedEvents=p.events.slice();renderSelected()}
  return;
 }
 if(d.type==='inkPreview'&&state.role==='teacher'){
  if(d.questionId!==state.question?.id)return;
  const p=state.pupils.get(d.id);if(!p)return;
  if(d.event?.op==='stroke'&&Array.isArray(d.event.pts)&&d.event.pts.length<=350)p.ccPartial=d.event;
  queuePaint(d.id);
  if(state.selected===d.id&&!replay.active)drawCommands($('teacherCanvas'),[...state.selectedEvents,d.event]);
  return;
 }
 if(d.type==='work'&&state.role==='teacher'){
  oldHandle(d);
  const p=state.pupils.get(d.id);
  if(p){p.events=Array.isArray(d.events)?d.events.slice(0,1200):[];p.ccPartial=null;queuePaint(d.id)}
  return;
 }
 if(d.type==='ink'&&state.role==='teacher'){
  oldHandle(d);
  if(d.questionId&&d.questionId!==state.question?.id)return;
  const p=state.pupils.get(d.id);
  if(p){p.events=p.events||[];p.events.push(d.event);p.ccPartial=null;queuePaint(d.id)}
  return;
 }
 if(d.type==='question'&&state.role==='teacher'){
  const oldId=state.question?.id;
  if(oldId!==d.question?.id)for(const p of state.pupils.values()){p.events=[];p.ccPartial=null}
  oldHandle(d);renderGrid();
  for(const id of state.pupils.keys())queuePaint(id);
  return;
 }
 if(d.type==='status'&&state.role==='teacher'){
  const wasNew=!state.pupils.has(d.pupil?.id);
  oldHandle(d);
  if(wasNew&&watchAllConfirmed)send({type:'watchAll',enabled:true});
  return;
 }
 oldHandle(d);
};
const dashboardBar=document.createElement('div');dashboardBar.id='ccFocusDashboardBar';
const layout=document.createElement('button');layout.type='button';layout.textContent='▦ Larger previews';layout.title='Switch between all-pupil overview and larger handwriting previews';
const status=document.createElement('span');status.id='ccFocusLiveStatus';status.textContent='Preview demo / waiting for live connection';
const project=document.createElement('button');project.type='button';project.className='soft';project.textContent='↗ Show selected work';project.title='Project the selected pupil’s working (anonymous by default)';
const teach=document.createElement('button');teach.type='button';teach.className='soft';teach.textContent='✏ Teach / Reteach';teach.title='Switch to Whiteboard Smart while pupils continue working';
dashboardBar.append(layout,project,teach,status);
$('pupilGrid')?.before(dashboardBar);
layout.onclick=()=>{const expanded=$('pupilGrid').classList.toggle('cc-large-previews');layout.textContent=expanded?'▦ All 45 compact':'▦ Larger previews'};
project.onclick=()=>{if(!state.selected){toast('Click a pupil first.');return}$('projectReplay').click()};
teach.onclick=()=>notifyParent('ccMiniFocusTeach');
function updateStatus(){
 if(!status)return;
 if(state.mode==='live')status.textContent=watchAllConfirmed?'● Live pupil ink connected':'○ Waiting for all-pupil ink stream · Worker v2 needed';
 else status.textContent='Preview of pupil writing · demo / offline';
}
const oldDemoLaunch=demoLaunch;
demoLaunch=function(q){oldDemoLaunch(q);for(const [id,p] of state.pupils)queuePaint(id);updateStatus()};
const oldSetupDemo=setupDemo;
setupDemo=function(){oldSetupDemo();updateStatus()};
const oldSelectRole=selectRole;
selectRole=function(role){oldSelectRole(role);if(role==='teacher')updateStatus()};
if(new URLSearchParams(location.search).get('embedded')==='1'){
 const quick=document.createElement('button');quick.id='ccFocusFloatingTeach';quick.type='button';quick.textContent='✏ Teach';quick.onclick=()=>notifyParent('ccMiniFocusTeach');document.body.appendChild(quick);
}
if(channel)channel.addEventListener('message',e=>{
 const d=e.data;if(state.role!=='teacher'||state.mode!=='demo'||d?.room!==state.room||d?.type!=='ink')return;
 // Base demo handler appends this event to pupil history.
 requestAnimationFrame(()=>queuePaint(d.id));
});
renderGrid();updateStatus();
})();
