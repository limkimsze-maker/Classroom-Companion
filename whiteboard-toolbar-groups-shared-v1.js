(function(){
'use strict';
// Presentation only: reparent the *existing* buttons without cloning handlers,
// changing Smart Math code, reading documents, or changing whiteboard state.
const tools=document.querySelector('header.top .tools');
if(!tools||tools.dataset.ccGroupedToolbar==='1')return;
tools.dataset.ccGroupedToolbar='1';
const headings=[
 ['draw','Draw'],
 ['create','Create & teach'],
 ['files','Files']
];
const groups={};
for(const [kind,title] of headings){
 const group=document.createElement('div');
 group.className='ccToolGroup';group.dataset.kind=kind;
 group.setAttribute('role','group');group.setAttribute('aria-label',title);
 const label=document.createElement('span');
 label.className='ccToolGroupLabel';label.textContent=title;label.setAttribute('aria-hidden','true');
 group.appendChild(label);tools.appendChild(group);groups[kind]=group;
}
const textFor=el=>[(el.textContent||''),(el.title||''),(el.getAttribute('aria-label')||'')].join(' ').toLowerCase();
function kindOf(el){
 const id=el.id||'',t=textFor(el);
 // File-picker tooltip also mentions "image"; route by exact ID first.
 // This must precede the generic Create & Teach /image/ text match.
 if(['openDocumentBtn','ccPermanentSaveBtn','ccAnnotationActionsBtn','ccSavePageAnnotationsBtn','ccSaveAllAnnotationsBtn','ccDeletePageAnnotationsBtn','ccDeleteAllAnnotationsBtn'].includes(id))return'files';
 if(id==='ccHandGrabToolbarBtn')return'draw';
 if(['selectBtn','ccFingerPointerBtn','penBtn','eraserBtn','highlighterBtn','ccHighlighterPalette','undoBtn','redoBtn','gridBtn','clearBtn','fullBtn'].includes(id)||el.classList.contains('colors')||el.classList.contains('sizeControl'))return'draw';
 if(['textBtn','editTextBtn','speechToTextBtn','imageBtn','smartCounterFinishBtn','smartFractionFinishBtn','smartBarFinishBtn','manualComparisonTotalBtn'].includes(id)||/beautify|smart math|shapes|how to use|tutorial|text box|image|speech to text|finished bar model|条形图画完|siap model bar|பார் மாதிரி முடிந்ததா/.test(t))return'create';
 if(/duplicate|forward|backward|front|back\b|lock|unlock|redo|undo|grid|clear/.test(t))return'draw';
 if(id==='openDocumentBtn'||/save|restore|export|png|my documents|open file|open document|saved board/.test(t))return'files';
 // Any additional classroom tool now belongs with Create & Teach; no separate Other Tools category.
 return'create';
}
function orderOf(el,kind){
 const id=el.id||'',t=textFor(el);
 if(kind==='draw'){
  if(id==='selectBtn')return 10;if(id==='ccHandGrabToolbarBtn')return 12;if(id==='ccFingerPointerBtn')return 20;
  if(id==='penBtn')return 30;if(el.classList.contains('colors'))return 35;
  if(id==='highlighterBtn')return 40;if(id==='ccHighlighterPalette')return 45;
  if(id==='eraserBtn')return 50;if(el.classList.contains('sizeControl'))return 60;
  if(id==='undoBtn')return 70;if(id==='redoBtn')return 72;
  if(id==='gridBtn')return 80;if(id==='clearBtn')return 90;
  if(id==='fullBtn')return 95;
  if(/duplicate/.test(t))return 73;if(/forward|front/.test(t))return 74;
  if(/backward|back\b/.test(t))return 75;if(/lock/.test(t))return 76;
 }
 if(kind==='create'){
  if(id==='textBtn')return 10;if(id==='editTextBtn')return 15;
  if(id==='speechToTextBtn')return 20;if(id==='imageBtn')return 30;
  if(/shapes/.test(t))return 40;if(/smart math/.test(t))return 50;
  if(id==='smartCounterFinishBtn')return 52;
  if(id==='smartFractionFinishBtn')return 54;
  if(id==='smartBarFinishBtn'||/finished bar model|条形图画完|siap model bar|பார் மாதிரி முடிந்ததா/.test(t))return 55;
  if(/beautify/.test(t))return 60;if(/how to use|tutorial/.test(t))return 70;
  if(id==='manualComparisonTotalBtn'||/\btotal\b/.test(t))return 80;
 }
 if(kind==='files'){
  if(id==='openDocumentBtn')return 10;if(/my documents/.test(t))return 20;
  if(id==='ccUsualWhiteboardInSlot')return 23;
  if(id==='ccSavePageAnnotationsBtn')return 60;if(id==='ccSaveAllAnnotationsBtn')return 65;
  if(id==='ccDeletePageAnnotationsBtn')return 70;if(id==='ccDeleteAllAnnotationsBtn')return 75;
  if(id==='ccPermanentSaveBtn')return 55;if(id==='ccAnnotationActionsBtn')return 95;
  if(/\bsave\b/.test(t))return 30;if(/restore/.test(t))return 40;
  if(/export|png/.test(t))return 50;
 }
 return 90;
}
let arranging=false;
const docSlot=document.getElementById('ccSaveSlot');
const documentSave=document.getElementById('ccPermanentSaveBtn');
const documentExit=document.getElementById('ccPermanentExitBtn');
if(documentSave){documentSave.textContent='💾 Save to My Documents';documentSave.setAttribute('aria-label','Save to My Documents');}

// Direct access to the four existing annotation operations.
// Saving page/all also saves the document copy to My Documents.
const directAnnotations=[
 ['ccSavePageAnnotationsBtn','💾 Save Page',()=>window.ccSaveCurrentPage?.(),false],
 ['ccSaveAllAnnotationsBtn','💾 Save All',()=>window.ccSaveCurrentDocument?.(),false],
 ['ccDeletePageAnnotationsBtn','🗑 Delete Page',()=>window.ccDeleteDocumentAnnotations?.('page'),true],
 ['ccDeleteAllAnnotationsBtn','🗑 Delete All',()=>window.ccDeleteDocumentAnnotations?.('all'),true]
];
for(const [id,text,run,danger] of directAnnotations){
 let button=document.getElementById(id);
 if(!button){
  button=document.createElement('button');button.id=id;button.type='button';button.className='btn'+(danger?' danger':' soft');
  button.textContent=text;button.title=text.replace(/^[^A-Za-z]+/,'')+(danger?' (confirmation required)':' (saves locally to My Documents)');
  button.setAttribute('aria-label',text.replace(/^[^A-Za-z]+/,''));
  button.addEventListener('click',async()=>{
   if(!document.body.classList.contains('document-open-mode'))return;
   button.disabled=true;
   try{
    const success=await run();
    const toast=document.getElementById('toast');
    if(toast&&!danger){toast.textContent=success===false?'Document not saved.':'Saved locally to My Documents.';toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1600)}
   }catch(err){const toast=document.getElementById('toast');if(toast){toast.textContent='Annotation action failed: '+(err?.message||err);toast.classList.add('show')}}
   finally{button.disabled=false}
  });
 }
 groups.files.appendChild(button);
}
function positionDocumentActions(){
 const files=groups.files;
 if(documentSave&&documentSave.parentElement!==files)files.appendChild(documentSave);
 const usual=document.getElementById('ccUsualWhiteboardInSlot');
 if(usual&&usual.parentElement!==files)files.appendChild(usual);
 const annotation=document.getElementById('ccAnnotationActionsBtn');
 if(annotation){
  annotation.textContent='📝 Save Annotations ▾';
  annotation.hidden=true;
  annotation.setAttribute('aria-label','Save Annotations');
  annotation.title='Save page or document annotations, rename, or delete saved annotations';
  if(annotation.parentElement!==files)files.appendChild(annotation);
 }
 if(documentExit){
  documentExit.classList.add('ccStandaloneDocumentExit');
  if(documentExit.parentElement!==tools||documentExit!==tools.lastElementChild)tools.appendChild(documentExit);
 }
}
const handShortcut=document.createElement('button');
handShortcut.type='button';handShortcut.id='ccHandGrabToolbarBtn';handShortcut.className='btn soft';
handShortcut.textContent='✋ Hand';
handShortcut.title='Grab and pan the opened document';
handShortcut.setAttribute('aria-label','Hand tool: drag document to pan');
handShortcut.setAttribute('aria-pressed','false');
tools.appendChild(handShortcut);
function syncHand(){
 const documentOpen=document.body.classList.contains('document-open-mode');
 const real=document.getElementById('documentTouchNavBtn');
 const pressed=documentOpen&&!!real&&real.classList.contains('active');
 // The shortcut is always visible beside Select. It becomes usable as soon
 // as a document opens; on the plain whiteboard there is no page to pan.
 handShortcut.disabled=!documentOpen;
 handShortcut.title=documentOpen
  ?'Hand: drag to pan the open document; pinch or scroll to zoom'
  :'Hand: open a document to enable page panning';
 handShortcut.setAttribute('aria-pressed',String(pressed));
 handShortcut.classList.toggle('active',pressed);
}
handShortcut.addEventListener('click',()=>{
 if(!document.body.classList.contains('document-open-mode'))return;
 document.getElementById('documentTouchNavBtn')?.click();
 syncHand();
});
document.addEventListener('click',e=>{
 if(e.target?.id==='documentTouchNavBtn'||e.target?.id==='documentPenModeBtn')requestAnimationFrame(syncHand);
},true);
window.addEventListener('cc-document-opened',()=>requestAnimationFrame(syncHand));
window.addEventListener('cc-document-closed',()=>requestAnimationFrame(syncHand));
positionDocumentActions();
function arrange(){
 if(arranging)return;
 positionDocumentActions();
 const loose=[...tools.children].filter(el=>!el.classList.contains('ccToolGroup')&&el.id!=='ccPermanentExitBtn');
 // Re-sort existing group content too, including newly inserted document actions.
 arranging=true;
 try{
  // Preserve every control; sort the same physical DOM nodes for easy scanning.
  const items=[...headings.flatMap(([kind])=>[...groups[kind].children].filter(el=>!el.classList.contains('ccToolGroupLabel'))),...loose];
  const sorted=Object.fromEntries(headings.map(([kind])=>[kind,[]]));
  let ix=0;
  for(const el of items)sorted[kindOf(el)].push({el,ix:ix++});
  for(const [kind] of headings){
   const group=groups[kind];
   const list=sorted[kind].sort((a,b)=>orderOf(a.el,kind)-orderOf(b.el,kind)||a.ix-b.ix);
   for(const {el} of list)group.appendChild(el);
   group.hidden=list.length===0;
  }
 }finally{arranging=false}
}
arrange();
// Support tools registered on DOMContentLoaded or after delayed initialisation.
let pending=false;
const observer=new MutationObserver(()=>{
 if(pending||![...tools.children].some(el=>!el.classList.contains('ccToolGroup')&&el.id!=='ccPermanentExitBtn'))return;
 pending=true;
 requestAnimationFrame(()=>{pending=false;arrange()});
});
observer.observe(tools,{childList:true});
if(docSlot)new MutationObserver(()=>{
 requestAnimationFrame(()=>{positionDocumentActions();arrange()});
}).observe(docSlot,{childList:true});
document.addEventListener('DOMContentLoaded',()=>{positionDocumentActions();arrange();syncHand()});
setTimeout(()=>{positionDocumentActions();arrange();syncHand()},0);
window.ClassroomToolbarGroups={
 refresh:arrange,
 getGroups:()=>headings.map(([kind,name])=>({name,visible:!groups[kind].hidden,controls:[...groups[kind].children].filter(x=>!x.classList.contains('ccToolGroupLabel')).map(x=>x.id||x.textContent?.trim()||x.getAttribute('aria-label'))}))
};
})();