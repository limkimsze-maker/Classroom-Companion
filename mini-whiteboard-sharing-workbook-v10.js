/* Whiteboard Smart · original Mathematics workbook v9
 * 3 pages, movable learning objects, teacher tool control and local PDF printing.
 * Drawings are original canvas shapes; no third-party whiteboard assets or code.
 * Live collaboration requires separately deployed Mini Whiteboard Workbook Worker v9.
 */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const MAX_PAGES=3;
const TYPES=['counter','one','ten','hundred','half','third','quarter','numberLine'];
const POLICY_KEYS=['pen','eraser','shapes','text','math','pages'];
const defaultPolicy=()=>({pen:true,eraser:true,shapes:true,text:true,math:true,pages:true});
const palette={ink:'#21495c',blue:'#2b77c7',teal:'#168b77',fill:'#ddf3e8',muted:'#a7d6cd'};
const pageOf=e=>Number.isInteger(e?.page)&&e.page>=1&&e.page<=MAX_PAGES?e.page:1;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number(v)||0));
const color=s=>/^#[a-f0-9]{6}$/i.test(s||'')?s:'#17324d';
const keyOf=(x)=>String(x||'').slice(0,40);
function sizeOf(kind){
 if(kind==='counter')return[34,34];
 if(kind==='one')return[26,26];
 if(kind==='ten')return[152,27];
 if(kind==='hundred')return[122,122];
 if(kind==='numberLine')return[235,65];
 return[140,43];
}
function workModel(events,until=Infinity,forcedPage=null){
 const active=[[],[],[]],undone=[[],[],[]];let lastPage=1;
 for(const e of events||[]){
  if(!e||(Number(e.at)||0)>until)continue;
  if(e.op==='page'){lastPage=pageOf(e);continue}
  const index=pageOf(e)-1;
  if(e.op==='clear'){active[index]=[];undone[index]=[]}
  else if(e.op==='undo'){if(active[index].length)undone[index].push(active[index].pop())}
  else if(e.op==='redo'){if(undone[index].length)active[index].push(undone[index].pop())}
  else if(['stroke','text','math'].includes(e.op)){active[index].push(e);undone[index]=[]}
 }
 const chosen=forcedPage&&Number.isInteger(forcedPage)?clamp(forcedPage,1,MAX_PAGES):lastPage;
 const objects=new Map(),ink=[];
 for(const e of active[chosen-1]){
  if(e.op!=='math'){ink.push(e);continue}
  const id=keyOf(e.id);
  if(e.action==='add'&&TYPES.includes(e.kind))objects.set(id,{id,kind:e.kind,x:clamp(e.x,0,1000),y:clamp(e.y,0,600)});
  else if(e.action==='move'&&objects.has(id)){const item=objects.get(id);item.x=clamp(e.x,0,1000);item.y=clamp(e.y,0,600)}
  else if(e.action==='remove')objects.delete(id);
 }
 return{page:chosen,objects:[...objects.values()],ink};
}
function rounded(ctx,x,y,w,h,r){
 const radius=Math.min(r,w/2,h/2);
 ctx.beginPath();ctx.moveTo(x+radius,y);ctx.arcTo(x+w,y,x+w,y+h,radius);ctx.arcTo(x+w,y+h,x,y+h,radius);
 ctx.arcTo(x,y+h,x,y,radius);ctx.arcTo(x,y,x+w,y,radius);ctx.closePath();
}
function drawObject(ctx,item){
 const [w,h]=sizeOf(item.kind);
 const x=clamp(item.x,0,1000),y=clamp(item.y,0,600);
 ctx.save();ctx.lineWidth=2;ctx.strokeStyle=palette.ink;ctx.fillStyle=palette.fill;
 if(item.kind==='counter'){
  ctx.beginPath();ctx.arc(x,y,17,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.arc(x-4,y-5,4,0,Math.PI*2);ctx.fillStyle='#8fd6bd';ctx.fill();
 }else if(item.kind==='one'){
  rounded(ctx,x-w/2,y-h/2,w,h,3);ctx.fill();ctx.stroke();
 }else if(item.kind==='ten'){
  const left=x-w/2,top=y-h/2;rounded(ctx,left,top,w,h,3);ctx.fill();ctx.stroke();
  ctx.beginPath();for(let i=1;i<10;i++){const a=left+i*w/10;ctx.moveTo(a,top);ctx.lineTo(a,top+h)}ctx.stroke();
 }else if(item.kind==='hundred'){
  const left=x-w/2,top=y-h/2;rounded(ctx,left,top,w,h,3);ctx.fill();ctx.stroke();
  ctx.lineWidth=0.8;ctx.beginPath();
  for(let i=1;i<10;i++){const p=i*w/10;ctx.moveTo(left+p,top);ctx.lineTo(left+p,top+h);ctx.moveTo(left,top+p);ctx.lineTo(left+w,top+p)}
  ctx.stroke();
 }else if(item.kind==='numberLine'){
  const left=x-w/2,mid=y+5;ctx.strokeStyle=palette.blue;ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(left+11,mid);ctx.lineTo(left+w-10,mid);ctx.stroke();
  ctx.beginPath();ctx.moveTo(left+w-19,mid-6);ctx.lineTo(left+w-10,mid);ctx.lineTo(left+w-19,mid+6);ctx.stroke();
  ctx.font='13px system-ui,sans-serif';ctx.fillStyle=palette.ink;ctx.textAlign='center';
  for(let i=0;i<=10;i++){const tx=left+15+i*(w-35)/10;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(tx,mid-6);ctx.lineTo(tx,mid+7);ctx.stroke();ctx.fillText(String(i),tx,mid+25)}
 }else{
  const slices={half:2,third:3,quarter:4}[item.kind]||2;
  const left=x-w/2,top=y-h/2;rounded(ctx,left,top,w,h,5);ctx.fillStyle='#fff';ctx.fill();ctx.stroke();
  ctx.fillStyle='#9ed6cb';ctx.fillRect(left+2,top+2,w/slices-4,h-4);
  ctx.beginPath();for(let i=1;i<slices;i++){const tx=left+i*w/slices;ctx.moveTo(tx,top);ctx.lineTo(tx,top+h)}ctx.stroke();
  ctx.font='bold 17px system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillStyle=palette.ink;ctx.fillText('1/'+slices,x,y+1);
 }
 ctx.restore();
}
function drawInk(ctx,e){
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 ctx.strokeStyle=color(e.color);ctx.fillStyle=ctx.strokeStyle;
 if(e.op==='text'){
  const x=clamp(e.x,0,980),y=clamp(e.y,20,594);
  ctx.font=clamp(e.size,14,64)+'px system-ui,Arial,sans-serif';ctx.textBaseline='alphabetic';
  ctx.fillText(String(e.text||'').slice(0,80),x,y,Math.max(10,990-x));
 }else if(e.op==='stroke'&&Array.isArray(e.pts)&&e.pts.length){
  const pts=e.pts,xy=p=>[Number(p[0])||0,Number(p[1])||0];
  ctx.lineWidth=clamp(e.width,1,60);ctx.beginPath();const [x,y]=xy(pts[0]);ctx.moveTo(x,y);
  if(pts.length===1){ctx.arc(x,y,ctx.lineWidth/2,0,Math.PI*2);ctx.fill()}
  else if(pts.length===2){const [x2,y2]=xy(pts[1]);ctx.lineTo(x2,y2);ctx.stroke()}
  else{
   for(let i=1;i<pts.length-1;i++){const [a,b]=xy(pts[i]),[n,m]=xy(pts[i+1]);ctx.quadraticCurveTo(a,b,(a+n)/2,(b+m)/2)}
   const [xx,yy]=xy(pts.at(-1));ctx.lineTo(xx,yy);ctx.stroke();
  }
 }
 ctx.restore();
}
const backgroundCache=new Map(),backgroundCanvases=new Map();
let lastBackgroundQuestion='';
function renderWork(canvas,events,until=Infinity,forcedPage=null,partial=null,questionOverride=null){
 if(!canvas)return;
 const ctx=canvas.getContext('2d');if(!ctx)return;
 const model=workModel(events,until,forcedPage);
 const question=questionOverride||(typeof state==='object'&&state?.question)||null;
 const showBackground=question?.workspace?.kind==='equalSharing'&&model.page===1&&typeof question.image==='string'&&question.image.startsWith('data:image/');
 ctx.setTransform(1,0,0,1,0,0);
 ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
 ctx.save();ctx.scale(canvas.width/1000,canvas.height/600);
 if(showBackground){
  const key=String(question.id||'')+':'+question.image.length+':'+question.image.slice(-24);
  let entry=backgroundCache.get(key);
  if(!entry&&typeof Image==='function'){
   const image=new Image();
   entry={image,ready:false};backgroundCache.set(key,entry);
   if(question.id!==lastBackgroundQuestion){lastBackgroundQuestion=question.id;backgroundCanvases.clear();}
   image.onload=()=>{
    entry.ready=true;
    for(const [target,args] of [...backgroundCanvases]){
     try{renderWork(target,...args)}catch(_){}
    }
   };
   image.onerror=()=>{entry.ready=false};
   image.src=question.image;
  }
  backgroundCanvases.set(canvas,[events,until,forcedPage,partial,questionOverride]);
  if(entry?.ready&&entry.image.naturalWidth&&entry.image.naturalHeight){
   const im=entry.image,scale=Math.min(1000/im.naturalWidth,600/im.naturalHeight);
   const w=im.naturalWidth*scale,h=im.naturalHeight*scale;
   ctx.drawImage(im,(1000-w)/2,(600-h)/2,w,h);
  }
 }
 for(const item of model.objects)drawObject(ctx,item);
 for(const event of model.ink)drawInk(ctx,event);
 if(partial?.op==='stroke'&&pageOf(partial)===model.page)drawInk(ctx,partial);
 ctx.restore();
 return model;
}
window.ccMathWorkbookModel=workModel;
window.ccMathRenderWork=renderWork;
const previousDraw=drawCommands;
drawCommands=function(canvas,events,until=Infinity){
 const forced=Number(canvas?.dataset?.ccWorkbookPage)||null;
 const content=Array.isArray(events)?events:[];
 if(forced||(typeof state==='object'&&state?.question?.workspace?.kind==='equalSharing')||content.some(e=>e&&(['math','page'].includes(e.op)||pageOf(e)>1))){
  // When the old pupil pen draws a transient, not-yet-committed stroke, treat it
  // as belonging to the visible page rather than defaulting to page one.
  if(canvas?.id==='studentCanvas'&&window.ccWorkbookCurrentPage&&content.length){
   const last=content.at(-1);
   if(last?.op==='stroke'&&last.page===undefined)events=[...content.slice(0,-1),{...last,page:window.ccWorkbookCurrentPage()}];
  }
  return renderWork(canvas,events,until,forced);
 }
 return previousDraw(canvas,events,until);
};
// The pure renderer is also installed on the projector-only window. No tools there.
if(new URLSearchParams(location.search).get('mode')==='projector')return;
const studentCanvas=$('studentCanvas'),teacherCanvas=$('teacherCanvas');
if(!studentCanvas||!teacherCanvas)return;
const css=document.createElement('style');
css.textContent=[
 '#ccMathPalette{padding:10px;background:#f5faf8;border:1px solid #c8e1db;border-radius:11px;margin:7px 8px}',
 '#ccMathPalette summary{cursor:pointer;font:850 13px system-ui;color:#125a52;min-height:40px;display:flex;align-items:center}',
 '#ccMathObjects{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:7px;margin:8px 0}',
 '#ccMathObjects button{min-height:48px;padding:8px 7px;border:1px solid #b7d6ce;border-radius:9px;background:#fff;color:#245d53;font:800 12px system-ui}',
 '#ccMathObjects button[aria-pressed=true]{background:#d1efe5;box-shadow:inset 0 0 0 2px #0f766e}',
 '#ccMathDelete{min-height:43px;padding:8px 11px;border:1px solid #e2b0aa;color:#a43935;background:#fff2f0;border-radius:9px;font-weight:850}',
 '#ccMathHint{margin:6px 0;font:12px/1.5 system-ui;color:#537670}',
 '#ccStudentPages,#ccTeacherPages{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:8px 10px;background:#eef7f5;border:1px solid #cde4dc;border-radius:10px;margin:8px 0}',
 '#ccStudentPages button,#ccTeacherPages button{min-width:46px;min-height:43px;padding:7px 11px;font:800 12px system-ui;border:1px solid #b0d5c8;background:#fff;border-radius:8px;color:#1b6458}',
 '#ccStudentPages button[aria-pressed=true],#ccTeacherPages button[aria-pressed=true]{background:#0f766e;border-color:#0f766e;color:#fff}',
 '#ccStudentPages strong,#ccTeacherPages strong{font:850 12px system-ui;color:#355e55;margin-right:4px}',
 '#ccWorkbookStatus{font:750 11px/1.5 system-ui;color:#53726d;margin:5px 10px}',
 '#ccWorkbookPolicy{padding:10px;margin:10px 0;background:#f6faf8;border:1px solid #c4ded5;border-radius:11px}',
 '#ccWorkbookPolicy h3{font:850 14px system-ui;color:#27544e;margin:0 0 8px}',
 '#ccWorkbookPolicy .cc-policy-options{display:flex;gap:8px 14px;flex-wrap:wrap}',
 '#ccWorkbookPolicy label{display:flex;gap:5px;align-items:center;font:750 12px system-ui;color:#2d6559}',
 '#ccWorkbookPolicy input{width:auto}',
 '#ccWorkbookPolicy small{font:12px/1.5 system-ui;color:#5e7870}',
 '#ccWorkbookReport{padding:9px;margin-top:10px;border-radius:11px;background:#f5f9fe;border:1px solid #cadeed}',
 '#ccWorkbookReport h3{font-size:14px;margin:0 0 8px}',
 '#ccWorkbookReport select{width:auto;min-width:170px;max-width:100%;padding:7px;font-size:12px}',
 '#ccWorkbookReport button{font-size:12px;padding:8px 11px;min-height:42px;border-radius:8px;border:1px solid #aacdc1;color:#095f54;background:#e0f4ec;font-weight:850}',
 '#ccWorkbookReport .cc-report-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}',
 '#ccEqualSharingBank{padding:12px;margin:8px 8px 12px;border:2px solid #b1d8cd;background:#f4fbf7;border-radius:13px}',
 '#ccEqualSharingBank[hidden]{display:none!important}',
 '#ccEqualSharingBank .cc-bank-heading{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;color:#20645b}',
 '#ccEqualSharingBank p{font:12px/1.5 system-ui;color:#426d65;margin:6px 0 9px}',
 '#ccCounterTray{display:flex;flex-wrap:wrap;gap:6px;max-width:520px}',
 '#ccCounterTray .cc-counter-dot{border:1px solid #178778;min-width:37px;min-height:37px;border-radius:50%;padding:3px;color:#0f766e;background:#c4eadc;touch-action:none;font:24px/1 system-ui;cursor:grab;user-select:none}',
 '#ccCounterTray .cc-counter-dot[hidden]{display:none!important}',
 '#ccCounterTray .cc-counter-dot.cc-counter-picked{background:#91d8bd}',

 '@media(max-width:600px){#ccMathObjects{grid-template-columns:repeat(2,minmax(0,1fr))}#ccStudentPages button{min-width:42px}}'
].join('\n');document.head.appendChild(css);
const button=(label,title)=>{
 const b=document.createElement('button');b.type='button';b.textContent=label;b.title=title||label;return b;
};
let currentPage=1,teacherPage=null,mathTool='',selectedMathId='',policy=defaultPolicy(),knownQuestionId='';
window.ccWorkbookCurrentPage=()=>currentPage;
const isPupil=()=>state.role==='student'&&Boolean(state.question);
const isInteractive=()=>isPupil()&&!state.question?.ended&&$ ('ccEyesOverlay')?.hidden!==false&&state.mode!=='archive';
const eventTime=()=>Math.max(0,Date.now()-(state.question?.startedAt||Date.now()));
const pupilPages=document.createElement('div');pupilPages.id='ccStudentPages';
const pupilPagesLabel=document.createElement('strong');pupilPagesLabel.textContent='Working pages';pupilPages.append(pupilPagesLabel);
const pageButtons=[];
for(let page=1;page<=MAX_PAGES;page++){
 const b=button('Page '+page,'Go to working page '+page);b.dataset.page=String(page);
 b.onclick=()=>{
  if(!isInteractive()||(!policy.pages&&page!==1)){toast('Your teacher has restricted working pages.');return}
  if(page===currentPage)return;
  currentPage=page;selectedMathId='';mathTool='';
  chooseMath();
  addInk({op:'page',page,at:eventTime()});
  refreshPupilPage();paintPupilBoard();
 };
 pupilPages.append(b);pageButtons.push(b);
}
const pupilBoardCard=studentCanvas.closest('.card');
pupilBoardCard?.before(pupilPages);
const studentMsg=document.createElement('div');studentMsg.id='ccWorkbookStatus';
studentMsg.textContent='Page 1 of 3 · your work is saved separately on each page.';
pupilPages.after(studentMsg);
const toolPanel=document.createElement('details');toolPanel.id='ccMathPalette';
const toolHeading=document.createElement('summary');toolHeading.textContent='▦ Maths Objects · Counters, Place Value, Fractions';
const choiceWrap=document.createElement('div');choiceWrap.id='ccMathObjects';
const choices=[
 ['counter','● Counter'],['one','□ One'],['ten','▥ Ten'],['hundred','▦ Hundred'],
 ['half','½ Fraction'],['third','⅓ Fraction'],['quarter','¼ Fraction'],['numberLine','↔ Number line']
];
const mathBtns=new Map();
for(const [kind,label] of choices){
 const b=button(label,'Place and move a '+kind+' model on this working page');
 b.dataset.mathKind=kind;b.setAttribute('aria-pressed','false');
 b.onclick=()=>{mathTool=kind;selectedMathId='';chooseMath();toolPanel.open=true;toast('Tap your working to place '+label.replace(/^[^ ]+ /,'')+'. Drag a model to move it.');};
 choiceWrap.append(b);mathBtns.set(kind,b);
}
const moveMath=button('↔ Move existing object','Tap and drag a Mathematics object');
moveMath.id='ccMathMove';
moveMath.onclick=()=>{mathTool='move';selectedMathId='';chooseMath();toolPanel.open=true};
const eraseMath=button('⌫ Remove selected object','Select a Mathematics object to remove it');
eraseMath.id='ccMathDelete';eraseMath.onclick=()=>{
 if(!isInteractive()||!policy.math||!selectedMathId){toast('Tap a Maths object to select it first.');return}
 addInk({op:'math',action:'remove',id:selectedMathId,page:currentPage,at:eventTime()});
 selectedMathId='';paintPupilBoard();
};
const mathHint=document.createElement('p');mathHint.id='ccMathHint';
mathHint.textContent='Choose an object, tap the board to place it, drag to move, or select and remove. Each action can be undone.';
toolPanel.append(toolHeading,choiceWrap,moveMath,eraseMath,mathHint);
pupilPages.after(toolPanel);
function chooseMath(){
 for(const [kind,b] of mathBtns)b.setAttribute('aria-pressed',String(mathTool===kind));
 moveMath.setAttribute('aria-pressed',String(mathTool==='move'));
 studentCanvas.style.cursor=mathTool?'grab':'crosshair';
}
function refreshPupilPage(){
 for(const b of pageButtons){
  const p=Number(b.dataset.page);
  b.setAttribute('aria-pressed',String(p===currentPage));
  b.disabled=(!policy.pages&&p!==1)||!isInteractive();
 }
 studentMsg.textContent='Page '+currentPage+' of '+MAX_PAGES+(policy.pages?' · separate working on each page.':' · page changes restricted by your teacher.');
 for(const b of mathBtns.values())b.disabled=!policy.math||!isInteractive();
 if(typeof refreshSharingBank==='function')refreshSharingBank();
 moveMath.disabled=!policy.math||!isInteractive();
 eraseMath.disabled=!policy.math||!isInteractive()||!selectedMathId;
 toolHeading.textContent=policy.math?'▦ Maths Objects · Counters, Place Value, Fractions':'▦ Maths Objects · Locked by teacher';
}
function paintPupilBoard(){renderWork(studentCanvas,state.myEvents||[],Infinity,currentPage);refreshSharingBank()}
const stage=$('ccPupilStage'),viewport=$('ccZoomViewport');
const xy=e=>{
 const rect=studentCanvas.getBoundingClientRect();
 return{x:clamp((e.clientX-rect.left)/rect.width*1000,0,1000),y:clamp((e.clientY-rect.top)/rect.height*600,0,600)};
};
let mathDrag=null;
function hitObject(point){
 const objects=workModel(state.myEvents,Infinity,currentPage).objects;
 for(const item of objects.slice().reverse()){
  const [w,h]=sizeOf(item.kind);
  if(Math.abs(point.x-item.x)<w/2+8&&Math.abs(point.y-item.y)<h/2+8)return item;
 }
 return null;
}
function previewDrag(x,y){
 const obj=mathDrag?.item;if(!obj||!mathDrag?.dragged)return;
 renderWork(studentCanvas,[...state.myEvents,{op:'math',action:'move',id:obj.id,x,y,page:currentPage,at:eventTime()}],Infinity,currentPage);
}
if(stage){
 stage.addEventListener('pointerdown',e=>{
  if(!mathTool||!policy.math)return;
  e.preventDefault();e.stopImmediatePropagation();
  if(!isInteractive()){toast('Wait for your teacher to resume working.');return}
  if(e.pointerType==='mouse'&&e.button!==0)return;
  // Keep the existing "Move" tool working independently of Maths objects.
  if($('ccMoveTool')?.getAttribute('aria-pressed')==='true')return;
  const point=xy(e),item=hitObject(point);
  mathDrag={pointer:e.pointerId,start:point,last:point,item,dragged:false};
  if(item){selectedMathId=item.id;refreshPupilPage()}
  else{selectedMathId='';refreshPupilPage()}
  try{stage.setPointerCapture(e.pointerId)}catch{}
 },true);
 stage.addEventListener('pointermove',e=>{
  if(!mathDrag||mathDrag.pointer!==e.pointerId)return;
  e.preventDefault();e.stopImmediatePropagation();
  mathDrag.last=xy(e);
  if(mathDrag.item&&Math.hypot(mathDrag.last.x-mathDrag.start.x,mathDrag.last.y-mathDrag.start.y)>3)mathDrag.dragged=true;
  if(mathDrag.dragged)previewDrag(mathDrag.last.x,mathDrag.last.y);
 },true);
 const end=e=>{
  if(!mathDrag||mathDrag.pointer!==e.pointerId)return;
  e.preventDefault();e.stopImmediatePropagation();
  const drag=mathDrag;mathDrag=null;
  if(drag.item&&drag.dragged){
   addInk({op:'math',action:'move',id:drag.item.id,x:drag.last.x,y:drag.last.y,page:currentPage,at:eventTime()});
  }else if(!drag.item&&mathTool!=='move'){
   const count=workModel(state.myEvents,Infinity,currentPage).objects.length;
   const sharing=state.question?.workspace?.kind==='equalSharing'&&currentPage===1&&mathTool==='counter';
   const placed=workModel(state.myEvents,Infinity,1).objects.filter(item=>item.kind==='counter').length;
   if(count>=30)toast('Up to 30 Maths objects per page.');
   else if(sharing&&placed>=state.question.workspace.counterCount)toast('All prepared counters are already on the board. Move or remove one to rearrange.');
   else{
    const id='m'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);
    addInk({op:'math',action:'add',id,kind:mathTool,x:drag.start.x,y:drag.start.y,page:currentPage,at:eventTime()});
    selectedMathId=id;
   }
  }
  refreshPupilPage();paintPupilBoard();
 };
 stage.addEventListener('pointerup',end,true);
 stage.addEventListener('pointercancel',e=>{if(mathDrag?.pointer!==e.pointerId)return;e.preventDefault();e.stopImmediatePropagation();mathDrag=null;paintPupilBoard()},true);
}

/* Equal Sharing: each pupil has an independent supply of teacher-selected counters.
 * Counters are separate, movable Maths events. The teacher's circles remain an
 * uneditable question-image background on working Page 1.
 */
const sharingBank=document.createElement('section');sharingBank.id='ccEqualSharingBank';sharingBank.hidden=true;
sharingBank.setAttribute('aria-label','Your equal-sharing counters');
const bankHeader=document.createElement('div');bankHeader.className='cc-bank-heading';
const bankTitle=document.createElement('strong');bankTitle.textContent='● My counter bank';
const bankRemaining=document.createElement('span');bankRemaining.id='ccBankRemaining';
bankHeader.append(bankTitle,bankRemaining);
const bankHelp=document.createElement('p');bankHelp.textContent='Drag a counter onto the circles. Or tap a counter, then tap where you want to place it.';
const counterTray=document.createElement('div');counterTray.id='ccCounterTray';
const counterButtons=[];
let bankGesture=null;
function currentSharing(){return state.role==='student'&&state.question?.workspace?.kind==='equalSharing'&&state.question?.visibility!=='projector'&&currentPage===1}
function remainingSharing(){
 if(!currentSharing())return 0;
 const max=Number(state.question.workspace.counterCount)||0;
 const placed=workModel(state.myEvents||[],Infinity,1).objects.filter(e=>e.kind==='counter').length;
 return Math.max(0,max-placed);
}
for(let i=0;i<30;i++){
 const dot=document.createElement('button');dot.type='button';dot.className='cc-counter-dot';
 dot.setAttribute('aria-label','Choose counter '+(i+1));
 dot.title='Tap to select, or drag this counter onto a circle';dot.textContent='●';
 dot.addEventListener('click',()=>{
  if(!currentSharing()||!isInteractive()||!policy.math)return;
  mathTool='counter';selectedMathId='';chooseMath();refreshPupilPage();
 });
 dot.addEventListener('pointerdown',e=>{
  if(!currentSharing()||!isInteractive()||!policy.math||remainingSharing()<=0)return;
  if(e.pointerType==='mouse'&&e.button!==0)return;
  e.preventDefault();e.stopPropagation();
  bankGesture={id:e.pointerId,startX:e.clientX,startY:e.clientY,screenX:e.clientX,screenY:e.clientY,moved:false,element:dot};
  try{dot.setPointerCapture(e.pointerId)}catch(_){}
  dot.classList.add('cc-counter-picked');
 });
 dot.addEventListener('pointermove',e=>{
  const drag=bankGesture;if(!drag||drag.id!==e.pointerId)return;
  e.preventDefault();
  drag.screenX=e.clientX;drag.screenY=e.clientY;
  drag.moved=drag.moved||Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>8;
  if(drag.moved){dot.style.transform='scale(1.15)';dot.style.opacity='.55';}
 });
 const finish=e=>{
  const drag=bankGesture;if(!drag||drag.id!==e.pointerId)return;
  e.preventDefault();bankGesture=null;
  dot.style.transform='';dot.style.opacity='';dot.classList.remove('cc-counter-picked');
  if(!drag.moved){mathTool='counter';selectedMathId='';chooseMath();refreshPupilPage();return}
  const rect=studentCanvas.getBoundingClientRect();
  if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom){return}
  if(remainingSharing()<=0||!isInteractive()||!policy.math)return;
  const point=xy(e),id='m'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);
  addInk({op:'math',action:'add',id,kind:'counter',x:point.x,y:point.y,page:1,at:eventTime()});
  selectedMathId=id;refreshPupilPage();paintPupilBoard();
 };
 dot.addEventListener('pointerup',finish);
 dot.addEventListener('pointercancel',e=>{
  if(bankGesture?.id!==e.pointerId)return;
  bankGesture=null;dot.style.transform='';dot.style.opacity='';dot.classList.remove('cc-counter-picked');
 });
 counterTray.append(dot);counterButtons.push(dot);
}
sharingBank.append(bankHeader,bankHelp,counterTray);
toolPanel.after(sharingBank);
function refreshSharingBank(){
 const active=currentSharing();
 sharingBank.hidden=!active;
 if(!active)return;
 const remain=remainingSharing();
 const max=Number(state.question.workspace.counterCount);
 bankRemaining.textContent=remain+' of '+max+' remaining';
 counterButtons.forEach((dot,i)=>{dot.hidden=i>=remain;dot.disabled=!policy.math||!isInteractive()});
 bankHelp.textContent=remain===0?'All counters placed. Drag them between groups, or select one and tap Remove to return it to the bank.':'Drag a counter into a circle, or tap one and then tap the board. Everyone has their own '+max+' counters.';
 const questionBlock=$('studentQuestion');
 if(questionBlock){
  const image=questionBlock.querySelector('img');
  if(image)image.remove();
 }
}

for(const id of ['penTool','eraserTool','ccPupilLine','ccPupilRect','ccPupilText']){
 $(id)?.addEventListener('click',()=>{mathTool='';selectedMathId='';chooseMath();refreshPupilPage()},true);
}
// Existing pupil drawing + undo/redo is preserved; new events carry their page
// to the Worker, teacher, reconnection cache, session export and PDF print.
let shapeTool='';
for(const [id,type] of [['ccPupilLine','line'],['ccPupilRect','rectangle']]){
 $(id)?.addEventListener('click',()=>{shapeTool=type;},false);
}
$('penTool')?.addEventListener('click',()=>{shapeTool=''},false);
$('eraserTool')?.addEventListener('click',()=>{shapeTool=''},false);
function inkAllowed(event){
 if(event.op==='math')return policy.math;
 if(event.op==='page')return policy.pages||event.page===1;
 if(!policy.pages&&pageOf(event)!==1)return false;
 if(event.op==='text')return policy.text;
 if(event.op==='stroke'){
  if(['line','rectangle'].includes(event.tool))return policy.shapes;
  if(event.color==='#ffffff')return policy.eraser;
  return policy.pen;
 }
 return true;
}
const priorAdd=addInk;
addInk=function(event){
 if(state.role==='student'){
  event.page=Number.isInteger(event.page)?event.page:currentPage;
  if(event.op==='stroke'&&shapeTool&&!event.tool)event.tool=shapeTool;
  if(!inkAllowed(event)){toast('Your teacher has disabled this tool.');paintPupilBoard();return}
  if(state.question?.ended){toast('This question has ended.');return}
 }
 priorAdd(event);
 if(state.role==='student')paintPupilBoard();
};
function applyPupilPermissions(){
 const keys={pen:['penTool'],eraser:['eraserTool'],shapes:['ccPupilLine','ccPupilRect'],text:['ccPupilText']};
 for(const [name,ids] of Object.entries(keys))for(const id of ids){
  const element=$(id);if(element)element.disabled=!policy[name];
 }
 if(!policy.math){mathTool='';selectedMathId='';chooseMath();}
 if(!policy.pages&&currentPage!==1){currentPage=1;selectedMathId='';if(isPupil()&&!state.question?.ended)addInk({op:'page',page:1,at:eventTime()});paintPupilBoard();}
 refreshPupilPage();
}
// Teacher: monitor a particular page without changing the pupil's working.
const teacherPages=document.createElement('div');teacherPages.id='ccTeacherPages';
const tLabel=document.createElement('strong');tLabel.textContent='Inspect pupil page';
teacherPages.append(tLabel);
const teacherBtns=[];
for(let i=1;i<=MAX_PAGES;i++){
 const b=button('Page '+i,'Inspect page '+i+' of the selected pupil');
 b.onclick=()=>{
  teacherPage=i;teacherCanvas.dataset.ccWorkbookPage=String(i);
  for(let p=0;p<teacherBtns.length;p++)teacherBtns[p].setAttribute('aria-pressed',String(p+1===teacherPage));
  drawCommands(teacherCanvas,state.selectedEvents||[]);
 };
 teacherPages.append(b);teacherBtns.push(b);
}
teacherCanvas?.closest('.boardBox')?.before(teacherPages);
function updateTeacherPage(pupil){
 const from=Number(pupil?.currentPage)||1;
 teacherPage=clamp(from,1,MAX_PAGES);
 teacherCanvas.dataset.ccWorkbookPage=String(teacherPage);
 teacherBtns.forEach((b,i)=>b.setAttribute('aria-pressed',String(i+1===teacherPage)));
 drawCommands(teacherCanvas,state.selectedEvents||[]);
}
const priorSelectPupil=selectPupil;
selectPupil=function(id){priorSelectPupil(id);updateTeacherPage(state.pupils.get(id))};
// Teacher: persist the tool policy in the authenticated Durable Object.
const teacherPanel=document.createElement('section');teacherPanel.id='ccWorkbookPolicy';
teacherPanel.innerHTML='<h3>Teacher controls · Pupil drawing tools</h3><div class="cc-policy-options"></div><small>Choose which tools pupils may use. Live rules are enforced by the classroom Worker, not just by disabled buttons.</small>';
const policyOptions=teacherPanel.querySelector('.cc-policy-options');
const teacherPolicyInputs=new Map();
const policyLabels={pen:'Freehand pen',eraser:'Eraser',shapes:'Line + Rectangle',text:'Typed text',math:'Maths objects',pages:'Pages 2–3'};
for(const key of POLICY_KEYS){
 const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.checked=true;input.dataset.policyKey=key;
 label.append(input,document.createTextNode(policyLabels[key]));policyOptions.append(label);teacherPolicyInputs.set(key,input);
 input.addEventListener('change',()=>{
  if(state.mode==='live'){
   if(state.ws?.readyState!==1){toast('Reconnect before changing pupil tool permissions.');input.checked=policy[key];return}
   send({type:'toolPolicy',policy:{[key]:input.checked}});
  }else{
   policy[key]=input.checked;applyPolicyUI();toast('Demo tool permission updated. Live enforcement requires Worker v9.');
  }
 });
}
$('ccV8TeacherControls')?.append(teacherPanel);
function applyPolicyUI(){
 for(const [key,input] of teacherPolicyInputs)input.checked=policy[key]!==false;
 applyPupilPermissions();
}
const report=document.createElement('section');report.id='ccWorkbookReport';
report.innerHTML='<h3>PDF work reports</h3><div class="cc-report-row"><select id="ccReportScope" aria-label="PDF report scope"><option value="selected">Selected pupil · All questions</option><option value="class">Whole class · All questions</option></select><button id="ccReportPrint" type="button">Print / Save as PDF</button></div><small>Print-ready workbook showing pupil working pages, answers and retries. In Chrome or Edge, choose “Save as PDF” in the print dialog. Live sessions require an authenticated teacher export.</small>';
$('sessionArchivePanel')?.append(report);
const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function questionsForReport(){
 if(state.mode==='demo'){
  if(!state.question)return[];
  return [{question:state.question,pupils:[...state.pupils.values()].map(p=>({...p,events:p.events||[],history:p.answer?[{value:p.answer,correct:p.correct,round:0}]:[]}))}];
 }
 return [];
}
function pngPage(events,page,question){
 const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=600;
 renderWork(canvas,events||[],Infinity,page,null,question);
 return canvas.toDataURL('image/jpeg',.84);
}
function generatePrintable(win,entries,selected){
 const pages=[];
 for(const entry of entries){
  const q=entry.question||{};
  for(const pupil of entry.pupils||[]){
   if(selected&&pupil.id!==selected)continue;
   const events=Array.isArray(pupil.events)?pupil.events:[];
   const total=Math.min(MAX_PAGES,Math.max(1,...events.map(e=>pageOf(e)),Number(pupil.currentPage)||1));
   for(let page=1;page<=total;page++){
    const answer=Array.isArray(pupil.history)&&pupil.history.length?pupil.history.at(-1)?.value:pupil.answer;
    const result=pupil.correct===true?'Correct':pupil.correct===false?'Review needed':'Not yet marked';
    const image=q.image?.startsWith('data:image/')?'<img class="question-img" alt="Cropped mathematics question" src="'+escapeHTML(q.image)+'">':'';
    const retries=(pupil.history||[]).map(a=>escapeHTML(a.value||'')).filter(Boolean).join(' → ');
    const jpg=pngPage(events,page,q);
    pages.push('<article class="sheet"><header><strong>Mathematics · Learning Record</strong><span>Question '+escapeHTML(q.number||'')+' · Page '+page+'/'+total+'</span></header><h2>'+escapeHTML(pupil.name||'Pupil')+'</h2><p class="prompt">'+escapeHTML(q.prompt||'Maths question')+'</p>'+image+'<p class="response"><b>Answer:</b> '+escapeHTML(answer||'Not submitted')+' <b>· Status:</b> '+result+'</p><p class="history"><b>Answer history:</b> '+(retries||'—')+'</p><img class="drawing" alt="Pupil working on page '+page+'" src="'+jpg+'"><p class="footer">Pupil working remains as originally recorded. Drawings are teacher-review evidence, not automatic assessment.</p></article>');
   }
  }
 }
 if(!pages.length)throw Error('No pupil working is available for this report.');
 const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Mini Whiteboard · Pupil Work PDF</title><style>@page{size:A4 portrait;margin:12mm}*{box-sizing:border-box}body{font:12px/1.45 Arial,sans-serif;color:#17324d;margin:0;background:#eef3f2}.sheet{background:#fff;width:190mm;min-height:255mm;margin:8mm auto;padding:10mm;break-after:page;page-break-after:always;box-shadow:0 2px 12px #0001}.sheet:last-child{break-after:auto}header{display:flex;justify-content:space-between;border-bottom:2px solid #138172;padding-bottom:8px}h2{font-size:22px;margin:12px 0 6px}.prompt{font-size:14px;white-space:pre-wrap}.question-img{max-width:100%;max-height:75mm;object-fit:contain}.response,.history{padding:7px;background:#f3faf7;border-radius:5px;overflow-wrap:anywhere}.drawing{display:block;width:100%;height:auto;border:1px solid #bfd7d2;margin-top:10px}.footer{font-size:10px;color:#697a76;margin-top:11px}.actions{position:sticky;top:0;padding:9px;background:#d8f2e8;text-align:center}.actions button{font-weight:800;padding:8px 15px;border-radius:9px;background:#0f766e;color:white;border:0}@media print{body{background:white}.sheet{margin:0;width:100%;min-height:0;padding:0;box-shadow:none}.actions{display:none}}</style></head><body><div class="actions"><button onclick="window.print()">Print / Save as PDF</button> · Choose Save as PDF in the printer options</div>'+pages.join('')+'</body></html>';
 win.document.open();win.document.write(html);win.document.close();
 const pics=[...win.document.images];
 Promise.all(pics.map(img=>img.complete?Promise.resolve():new Promise(resolve=>{img.onload=resolve;img.onerror=resolve}))).then(()=>win.setTimeout(()=>win.print(),400));
}
$('ccReportPrint').onclick=async()=>{
 if(state.role!=='teacher'){toast('Only the teacher may create pupil reports.');return}
 const scope=$('ccReportScope').value,selected=scope==='selected'?state.selected:null;
 if(scope==='selected'&&!selected){toast('Select a pupil in the dashboard first.');return}
 if(!['live','demo'].includes(state.mode)){toast('Open a live or demo classroom before exporting a PDF.');return}
 const win=window.open('','_blank');
 if(!win){toast('Please allow pop-ups for this page to print reports.');return}
 win.document.write('<p style="font:16px system-ui;padding:25px">Preparing your pupil work report…</p>');
 try{
  let entries;
  if(state.mode==='demo')entries=questionsForReport();
  else{
   if(!state.teacherToken||!state.room)throw Error('Teacher session is not authenticated.');
   const endpoint=state.backend.replace(/\/$/,'')+'/api/export-session?code='+encodeURIComponent(state.room);
   const reply=await fetch(endpoint,{headers:{Authorization:'Bearer '+state.teacherToken},cache:'no-store'});
   if(!reply.ok)throw Error('Teacher-authorised session export failed.');
   const payload=await reply.json();if(!payload.ok||!Array.isArray(payload.session?.questions))throw Error('Session export data is incomplete.');
   entries=payload.session.questions;
  }
  generatePrintable(win,entries,selected);
 }catch(error){
  win.document.open();
  win.document.write('<p style="font:16px system-ui;color:#9a3535;padding:25px">Could not prepare the PDF report. '+escapeHTML(error.message||String(error))+'</p>');
  win.document.close();toast(error.message||String(error));
 }
};
// Prevent accidental live connection to an older classroom Worker that lacks
// the new page and tool policy enforcement.
async function verifyWorkbookWorker(raw){
 const u=new URL(raw);
 if(u.protocol!=='https:')throw Error('Use the HTTPS URL of your Workbook Worker v9.');
 const response=await fetch(u.origin+'/api/health',{cache:'no-store'});
 if(!response.ok)throw Error('Classroom backend is not reachable.');
 const info=await response.json();
 if(info.version!=='v9')throw Error('This beta requires Maths Workbook Worker v9. Your earlier Worker will not support these tools.');
 return true;
}
const oldCreate=$('createRoom')?.onclick;
if(oldCreate)$('createRoom').onclick=async function(){
 try{await verifyWorkbookWorker($('backend').value);return await oldCreate()}catch(error){toast(error.message||String(error))}
};
const oldJoin=$('joinLive')?.onclick;
if(oldJoin)$('joinLive').onclick=async function(){
 try{await verifyWorkbookWorker($('studentBackend').value);return await oldJoin()}catch(error){toast(error.message||String(error))}
};
// Legacy local backup additionally recognises new event types, through a
// versioned recovery script loaded alongside this one.
const priorHandle=handle;
handle=function(d){
 if(d?.type==='toolPolicy'&&d.policy){
  policy={...defaultPolicy(),...d.policy};applyPolicyUI();return;
 }
 if(d?.type==='toolDenied'){
  toast('Your teacher has restricted that tool.');return;
 }
 const prevId=state.question?.id||'';
 priorHandle(d);
 if(d?.type==='welcome'){
  policy={...defaultPolicy(),...(d.toolPolicy||{})};
  if(d.role==='student'){
   knownQuestionId=state.question?.id||'';
   currentPage=clamp(d.currentPage||workModel(state.myEvents).page,1,MAX_PAGES);
   selectedMathId='';mathTool='';chooseMath();
   refreshPupilPage();paintPupilBoard();
  }
  if(d.role==='teacher')updateTeacherPage(state.pupils.get(state.selected));
  applyPolicyUI();
 }
 if(d?.type==='question'){
  const now=state.question?.id||'';
  if(state.role==='student'){
   if(now!==prevId){currentPage=1;knownQuestionId=now;selectedMathId='';mathTool='';chooseMath();}
   refreshPupilPage();paintPupilBoard();
  }
  if(state.role==='teacher')updateTeacherPage(state.pupils.get(state.selected));
 }
 if(d?.type==='workPreview'&&state.role==='teacher'&&d.id===state.selected){
  drawCommands(teacherCanvas,state.selectedEvents||[]);
 }
 if(d?.type==='status'&&state.role==='teacher'&&d.pupil?.id===state.selected&&teacherPage===null){
  updateTeacherPage(state.pupils.get(state.selected));
 }
};
const prevDemo=demoLaunch;
demoLaunch=function(question){prevDemo(question);currentPage=1;selectedMathId='';mathTool='';chooseMath();refreshPupilPage()};
const prevSetup=setupDemo;
setupDemo=function(){prevSetup();policy=defaultPolicy();currentPage=1;teacherPage=null;applyPolicyUI()};
const prevRole=selectRole;
selectRole=function(role){prevRole(role);applyPolicyUI();if(role==='student')refreshPupilPage()};
chooseMath();applyPolicyUI();refreshPupilPage();teacherBtns.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===0)));
})();
