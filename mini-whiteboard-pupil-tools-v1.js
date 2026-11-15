/* Pupil Mini Whiteboard tools v1: deliberately small Maths-focused interface.
 * Live typed-text events require the separately deployed Worker v5.
 * Shapes are normal stroke events; every action participates in undo/replay.
 */
(function(){
'use strict';
if(new URLSearchParams(location.search).get('mode')==='projector')return;
const $=id=>document.getElementById(id);
const canvas=$('studentCanvas'), bar=$('penTool')?.closest('.boardbar'), student=$('studentActivity');
if(!canvas||!bar||!student)return;
let mode='pen',drawing=null,txtPoint=null,gridOn=false,expanded=false;
const css=document.createElement('style');
css.textContent=[
 '#studentView .boardbar{position:relative;gap:7px;align-items:center;padding:9px}',
 '#studentView .boardbar button:not(.colButton){min-height:44px;min-width:44px;padding:8px 11px;font:800 13px system-ui}',
 '#studentView .boardbar .colButton{min-width:43px;width:43px;height:43px;border-radius:50%;touch-action:manipulation}',
 '#studentView .boardbar .cc-size-pill{min-width:45px!important;border-radius:9px;border:1px solid #c0d8d3;background:#fff}',
 '#studentView .boardbar .cc-size-pill[aria-pressed=true]{background:#d8f6ea;color:#075d55;box-shadow:inset 0 0 0 2px #0f766e}',
 '#studentView .boardbar .cc-tool-on{background:#0f766e!important;color:white!important;border-color:#0f766e!important}',
 '#ccPupilMore{position:relative;font-size:13px;color:#17324d}',
 '#ccPupilMore summary{list-style:none;cursor:pointer;padding:12px 10px;border-radius:10px;border:1px solid #b9d2ce;background:#fff;font-weight:800;white-space:nowrap;min-height:44px;display:flex;align-items:center}',
 '#ccPupilMore summary::-webkit-details-marker{display:none}',
 '#ccPupilMore[open] .cc-more-content{position:absolute;right:0;top:calc(100% + 5px);z-index:75;width:min(315px,90vw);background:#fff;box-shadow:0 10px 28px #17324d44;border:1px solid #bad8d2;border-radius:10px;padding:12px;display:grid;gap:8px}',
 '#ccPupilMore .cc-more-row{display:flex;gap:7px;flex-wrap:wrap;align-items:center}',
 '#ccPupilMore .cc-more-row label{margin-right:auto;font-weight:800;color:#52687b;font-size:12px}',
 '#ccPupilMore .cc-more-row button{flex:1}',
 '#ccPupilMore #penWidth{width:130px}',
 '#ccPupilStage{position:relative;isolation:isolate;background:#fff}',
 '#ccPupilStage #studentCanvas{display:block;width:100%;aspect-ratio:5 / 3;touch-action:none;user-select:none;-webkit-user-select:none}',
 '#ccPupilGrid{position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(to right,#1e6e8d28 1px,transparent 1px),linear-gradient(to bottom,#1e6e8d28 1px,transparent 1px);background-size:5% 8.333%;display:none;z-index:1}',
 '#ccPupilStage.cc-show-grid #ccPupilGrid{display:block}',
 '#ccPupilTextEntry[hidden]{display:none!important}',
 '#ccPupilTextEntry{position:absolute;z-index:10;background:#effaf7;border:2px solid #0f766e;border-radius:12px;box-shadow:0 8px 23px #153c4555;padding:9px;width:min(310px,90%);display:grid;gap:7px}',
 '#ccPupilTextEntry input{width:100%;padding:9px;border:1px solid #a7c9c3;border-radius:7px;font-size:16px}',
 '#ccPupilTextEntry .cc-type-buttons{display:flex;gap:7px}',
 '#ccPupilTextEntry .cc-type-buttons button{min-height:42px;padding:8px 11px;flex:1;border-radius:8px;border:1px solid #bcd8ce}',
 '#ccPupilTextEntry #ccPupilTextInsert{background:#0f766e;color:white}',
 '#studentActivity.cc-pupil-expanded{position:fixed;inset:0;z-index:99999;background:#f3f8f8;padding:12px 18px;overflow:auto;overscroll-behavior:contain}',
 '#studentActivity.cc-pupil-expanded .studentWork{grid-template-columns:minmax(0,1fr) minmax(210px,260px);align-items:start}',
 '#studentActivity.cc-pupil-expanded .studentBoard .card{box-shadow:0 4px 15px #17324d17}',
 '#studentActivity.cc-pupil-expanded .questionCard{margin-bottom:6px;padding:9px}',
 '#studentView #ccPupilExpand{background:#e0f3ec;color:#0b6559;border:1px solid #a4d8c8}',
 '@media(max-width:800px){#studentActivity.cc-pupil-expanded .studentWork{grid-template-columns:1fr}#studentActivity.cc-pupil-expanded{padding:7px}#ccPupilMore[open] .cc-more-content{right:auto;left:-135px}}',
 '@media(prefers-reduced-motion:reduce){#ccPupilTextEntry{transition:none!important}}'
].join('\n');document.head.appendChild(css);
function button(id,label,title){
 const e=document.createElement('button');e.id=id;e.type='button';e.textContent=label;e.title=title||label;
 return e;
}
const stage=document.createElement('div');stage.id='ccPupilStage';canvas.before(stage);stage.append(canvas);
const grid=document.createElement('div');grid.id='ccPupilGrid';grid.setAttribute('aria-hidden','true');stage.append(grid);
const typeBox=document.createElement('div');typeBox.id='ccPupilTextEntry';typeBox.hidden=true;
const typeInput=document.createElement('input');typeInput.type='text';typeInput.maxLength=80;typeInput.placeholder='Type numbers or words';typeInput.setAttribute('aria-label','Text to insert into your whiteboard');
const actions=document.createElement('div');actions.className='cc-type-buttons';
const insert=button('ccPupilTextInsert','Insert','Add text to your drawing');
const cancel=button('ccPupilTextCancel','Cancel','Do not add text');
actions.append(insert,cancel);typeBox.append(typeInput,actions);stage.append(typeBox);
const sizes=document.createElement('div');sizes.id='ccPupilSizes';sizes.className='cc-more-row';
const options=[['Thin',3],['Medium',6],['Thick',12]];
for(const [label,w] of options){
 const b=button('ccPupilSize'+label,label,label+' pen');
 b.className='cc-size-pill';b.dataset.penSize=String(w);b.setAttribute('aria-pressed','false');
 b.onclick=()=>{$('penWidth').value=String(w);$('penWidth').dispatchEvent(new Event('input',{bubbles:true}));changeMode('pen');updateSizes()};
 sizes.append(b);
}
function updateSizes(){
 const current=Number($('penWidth').value);
 for(const b of sizes.querySelectorAll('button'))b.setAttribute('aria-pressed',String(Number(b.dataset.penSize)===current));
}
const more=document.createElement('details');more.id='ccPupilMore';
const sum=document.createElement('summary');sum.textContent='More Tools ▾';
const moreBody=document.createElement('div');moreBody.className='cc-more-content';
const toolsRow=document.createElement('div');toolsRow.className='cc-more-row';
const line=button('ccPupilLine','／ Line','Draw a straight mathematical line');
const rect=button('ccPupilRect','▭ Rectangle','Draw a bar model or box');
const type=button('ccPupilText','T Text','Tap the board to type mathematics or words');
toolsRow.append(line,rect,type);
const optRow=document.createElement('div');optRow.className='cc-more-row';
const gridButton=button('ccPupilGridToggle','▦ Grid: Off','Toggle the faint working grid');
gridButton.setAttribute('aria-pressed','false');
optRow.append(gridButton);
const customSize=document.createElement('div');customSize.className='cc-more-row';
const oldWidth=$('penWidth');const widthLabel=oldWidth.closest('label');
if(widthLabel){widthLabel.style.cssText='display:flex;align-items:center;gap:6px;font-size:12px';customSize.append(widthLabel)}
moreBody.append(toolsRow,optRow,customSize);more.append(sum,moreBody);
bar.append(sizes,more);
const expand=button('ccPupilExpand','⛶ Expand','Expand working space while keeping answer submission available');
expand.onclick=()=>{
 expanded=!expanded;student.classList.toggle('cc-pupil-expanded',expanded);
 expand.textContent=expanded?'↙ Exit expanded':'⛶ Expand';
 expand.setAttribute('aria-pressed',String(expanded));
 if(expanded)student.scrollTop=0;
};
bar.append(expand);
function changeMode(next){
 mode=next;drawing=null;hideTextBox();
 if(next==='pen')$('penTool').click();
 if(next==='eraser')$('eraserTool').click();
 if(next!=='pen'&&next!=='eraser')setTool(false);
 for(const e of [line,rect,type])e.classList.toggle('cc-tool-on',e===({line:line,rect:rect,text:type}[mode]));
 $('penTool').classList.toggle('active',mode==='pen');
 $('eraserTool').classList.toggle('active',mode==='eraser');
 canvas.style.cursor=mode==='text'?'text':'crosshair';
}
$('penTool').addEventListener('click',()=>{mode='pen';hideTextBox();syncModes()});
$('eraserTool').addEventListener('click',()=>{mode='eraser';hideTextBox();syncModes()});
for(const b of document.querySelectorAll('#studentView [data-ink]'))b.addEventListener('click',()=>{mode='pen';hideTextBox();syncModes()});
function syncModes(){
 for(const e of [line,rect,type])e.classList.remove('cc-tool-on');
 $('penTool').classList.toggle('active',mode==='pen');$('eraserTool').classList.toggle('active',mode==='eraser');
 canvas.style.cursor=mode==='text'?'text':'crosshair';
}
line.onclick=()=>{changeMode('line');more.open=false};
rect.onclick=()=>{changeMode('rect');more.open=false};
type.onclick=()=>{changeMode('text');more.open=false};
gridButton.onclick=()=>{gridOn=!gridOn;stage.classList.toggle('cc-show-grid',gridOn);gridButton.textContent=gridOn?'▦ Grid: On':'▦ Grid: Off';gridButton.setAttribute('aria-pressed',String(gridOn))};
oldWidth?.addEventListener('input',updateSizes);
function coords(e){
 const r=canvas.getBoundingClientRect();
 return{x:Math.max(0,Math.min(1000,(e.clientX-r.left)/r.width*1000)),y:Math.max(0,Math.min(600,(e.clientY-r.top)/r.height*600))};
}
function eventTime(){return Math.max(0,Date.now()-(state.question?.startedAt||Date.now()))}
function shapeEvent(first,last){
 const x=Math.max(0,Math.min(1000,first.x)),y=Math.max(0,Math.min(600,first.y));
 const X=Math.max(0,Math.min(1000,last.x)),Y=Math.max(0,Math.min(600,last.y));
 const pts=mode==='line'?[[x,y],[X,Y]]:[[x,y],[X,y],[X,Y],[x,Y],[x,y]];
 return{op:'stroke',pts,color:state.inkColor,width:state.inkWidth,at:eventTime()};
}
function preview(){
 if(!drawing)return;
 drawCommands(canvas,[...state.myEvents,shapeEvent(drawing.start,drawing.end)]);
}
function hideTextBox(){typeBox.hidden=true;txtPoint=null}
function showText(e){
 if(!state.question){toast('Wait for the teacher to launch a question.');return}
 const point=coords(e);txtPoint=point;
 typeBox.hidden=false;typeInput.value='';
 typeBox.style.left=Math.min(58,Math.max(0,point.x/10))+'%';
 typeBox.style.top=Math.min(76,Math.max(0,point.y/6))+'%';
 typeInput.focus();
}
function stopEvent(e){e.preventDefault();e.stopImmediatePropagation()}
canvas.addEventListener('pointerdown',e=>{
 if(e.button!==0&&e.pointerType==='mouse')return;
 if(mode==='pen'||mode==='eraser'){e.preventDefault();return}
 stopEvent(e);
 if(!state.question){toast('Wait for the teacher to launch a question.');return}
 if(mode==='text'){showText(e);return}
 if(mode==='line'||mode==='rect'){
  canvas.setPointerCapture(e.pointerId);
  const p=coords(e);drawing={id:e.pointerId,start:p,end:p};preview();
 }
},true);
canvas.addEventListener('pointermove',e=>{
 if(!drawing||drawing.id!==e.pointerId)return;
 stopEvent(e);drawing.end=coords(e);preview();
},true);
canvas.addEventListener('pointerup',e=>{
 if(!drawing||drawing.id!==e.pointerId)return;
 stopEvent(e);
 drawing.end=coords(e);const first=drawing.start,last=drawing.end;
 const next=shapeEvent(first,last);drawing=null;
 if(Math.hypot(first.x-last.x,first.y-last.y)>=5)addInk(next);
 else drawCommands(canvas,state.myEvents);
},true);
canvas.addEventListener('pointercancel',e=>{
 if(!drawing||drawing.id!==e.pointerId)return;
 stopEvent(e);drawing=null;drawCommands(canvas,state.myEvents);
},true);
insert.onclick=()=>{
 const text=typeInput.value.trim();
 if(!txtPoint||!state.question){hideTextBox();return}
 if(!text){typeInput.focus();return}
 const e={op:'text',text:text.slice(0,80),x:txtPoint.x,y:Math.max(20,Math.min(594,txtPoint.y)),size:Math.max(22,Math.min(52,24+state.inkWidth)),color:state.inkColor,at:eventTime()};
 hideTextBox();addInk(e);changeMode('pen');
};
cancel.onclick=hideTextBox;
typeInput.addEventListener('keydown',e=>{
 e.stopPropagation();
 if(e.key==='Enter'){e.preventDefault();insert.click()}
 if(e.key==='Escape'){e.preventDefault();hideTextBox()}
});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'){if(!typeBox.hidden)hideTextBox();else if(expanded){expanded=false;student.classList.remove('cc-pupil-expanded');expand.textContent='⛶ Expand';expand.setAttribute('aria-pressed','false')}}
},true);
document.addEventListener('pointerdown',e=>{
 if(more.open&&!more.contains(e.target))more.open=false;
 if(!typeBox.hidden&&!typeBox.contains(e.target)&&e.target!==canvas)hideTextBox();
});
/* Replay and teacher-selected working preserve typed text as one atomic action. */
const oldDraw=drawCommands;
drawCommands=function(target,events,until=Infinity){
 if(!events||!events.some(e=>e?.op==='text'))return oldDraw(target,events,until);
 if(!target)return;
 const c=target.getContext('2d');if(!c)return;
 c.setTransform(1,0,0,1,0,0);
 c.fillStyle='#fff';c.clearRect(0,0,target.width,target.height);c.fillRect(0,0,target.width,target.height);
 const keep=[],undone=[];
 for(const e of events){
  if((Number(e?.at)||0)>until)break;
  if(e.op==='clear'){keep.length=0;undone.length=0}
  else if(e.op==='undo'){if(keep.length)undone.push(keep.pop())}
  else if(e.op==='redo'){if(undone.length)keep.push(undone.pop())}
  else if(e.op==='stroke'||e.op==='text'){keep.push(e);undone.length=0}
 }
 c.save();c.scale(target.width/1000,target.height/600);c.lineCap='round';c.lineJoin='round';
 for(const e of keep){
  c.fillStyle=/^#[a-f0-9]{6}$/i.test(e.color||'')?e.color:'#17324d';
  c.strokeStyle=c.fillStyle;
  if(e.op==='text'){
   const x=Math.max(0,Math.min(980,Number(e.x)||0)),y=Math.max(20,Math.min(594,Number(e.y)||0));
   c.font=Math.max(14,Math.min(64,Number(e.size)||30))+'px ui-sans-serif,system-ui,Arial,sans-serif';
   c.textBaseline='alphabetic';c.fillText(String(e.text||'').slice(0,80),x,y,Math.max(10,990-x));continue;
  }
  const points=e.pts;
  if(!Array.isArray(points)||!points.length)continue;
  c.lineWidth=Math.max(1,Math.min(60,Number(e.width)||4));
  c.beginPath();c.moveTo(Number(points[0][0])||0,Number(points[0][1])||0);
  if(points.length===1){c.arc(Number(points[0][0])||0,Number(points[0][1])||0,c.lineWidth/2,0,2*Math.PI);c.fill()}
  else{for(const xy of points.slice(1))if(Array.isArray(xy))c.lineTo(Number(xy[0])||0,Number(xy[1])||0);c.stroke()}
 }
 c.restore();
};
updateSizes();
})();
