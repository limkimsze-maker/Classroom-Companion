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
 ['edit','Edit & arrange'],
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
 if(id==='openDocumentBtn')return'files';
 if(['selectBtn','ccFingerPointerBtn','penBtn','eraserBtn','highlighterBtn','ccHighlighterPalette'].includes(id)||el.classList.contains('colors')||el.classList.contains('sizeControl'))return'draw';
 if(['textBtn','editTextBtn','speechToTextBtn','imageBtn','smartBarFinishBtn','manualComparisonTotalBtn'].includes(id)||/beautify|smart math|shapes|how to use|tutorial|text box|image|speech to text|finished bar model|条形图画完|siap model bar|பார் மாதிரி முடிந்ததா/.test(t))return'create';
 if(['undoBtn','redoBtn','clearBtn','gridBtn','fullBtn'].includes(id)||/duplicate|forward|backward|front|back\b|lock|unlock|redo|undo|grid|clear/.test(t))return'edit';
 if(id==='openDocumentBtn'||/save|restore|export|png|my documents|open file|open document|saved board/.test(t))return'files';
 // Any additional classroom tool now belongs with Create & Teach; no separate Other Tools category.
 return'create';
}
function orderOf(el,kind){
 const id=el.id||'',t=textFor(el);
 if(kind==='draw'){
  if(id==='selectBtn')return 10;if(id==='ccFingerPointerBtn')return 20;
  if(id==='penBtn')return 30;if(el.classList.contains('colors'))return 35;
  if(id==='highlighterBtn')return 40;if(id==='ccHighlighterPalette')return 45;
  if(id==='eraserBtn')return 50;if(el.classList.contains('sizeControl'))return 60;
 }
 if(kind==='create'){
  if(id==='textBtn')return 10;if(id==='editTextBtn')return 15;
  if(id==='speechToTextBtn')return 20;if(id==='imageBtn')return 30;
  if(/shapes/.test(t))return 40;if(/smart math/.test(t))return 50;
  if(id==='smartBarFinishBtn'||/finished bar model|条形图画完|siap model bar|பார் மாதிரி முடிந்ததா/.test(t))return 55;
  if(/beautify/.test(t))return 60;if(/how to use|tutorial/.test(t))return 70;
  if(id==='manualComparisonTotalBtn'||/\btotal\b/.test(t))return 80;
 }
 if(kind==='edit'){
  if(id==='undoBtn')return 10;if(id==='redoBtn')return 15;
  if(/duplicate/.test(t))return 20;if(/forward|front/.test(t))return 30;
  if(/backward|back\b/.test(t))return 40;if(/lock/.test(t))return 50;
  if(id==='gridBtn')return 60;if(id==='clearBtn')return 70;if(id==='fullBtn')return 80;
 }
 if(kind==='files'){
  if(id==='openDocumentBtn')return 10;if(/my documents/.test(t))return 20;
  if(/\bsave\b/.test(t))return 30;if(/restore/.test(t))return 40;
  if(/export|png/.test(t))return 50;
 }
 return 90;
}
let arranging=false;
function arrange(){
 if(arranging)return;
 const loose=[...tools.children].filter(el=>!el.classList.contains('ccToolGroup'));
 if(!loose.length)return;
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
 if(pending||![...tools.children].some(el=>!el.classList.contains('ccToolGroup')))return;
 pending=true;
 requestAnimationFrame(()=>{pending=false;arrange()});
});
observer.observe(tools,{childList:true});
window.ClassroomToolbarGroups={
 refresh:arrange,
 getGroups:()=>headings.map(([kind,name])=>({name,visible:!groups[kind].hidden,controls:[...groups[kind].children].filter(x=>!x.classList.contains('ccToolGroupLabel')).map(x=>x.id||x.textContent?.trim()||x.getAttribute('aria-label'))}))
};
})();