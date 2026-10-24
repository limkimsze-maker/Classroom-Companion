(function(){
'use strict';
// Everything stays in this browser: original file blobs and relative page annotations.
const DB='cc-my-documents-v1',STORE='files';
let currentFile=null,currentId=null,currentName='',dbPromise=null,dialog=null,list=null,status=null,actionsDialog=null;
const api=()=>window.CCDocumentAnnotations;
function db(){
 if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{
  const r=indexedDB.open(DB,1);
  r.onupgradeneeded=()=>{const s=r.result.createObjectStore(STORE,{keyPath:'id'});s.createIndex('name','name');s.createIndex('savedAt','savedAt')};
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 });
 return dbPromise;
}
async function request(mode,fn){
 const d=await db();
 return new Promise((resolve,reject)=>{
  const tx=d.transaction(STORE,mode),s=tx.objectStore(STORE);let result;
  try{result=fn(s)}catch(e){reject(e);return}
  tx.oncomplete=()=>resolve(result?.result);
  tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
 });
}
const all=async()=>{const d=await db();return new Promise((resolve,reject)=>{
 const r=d.transaction(STORE).objectStore(STORE).getAll();r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error)
})};
const byId=async id=>id?request('readonly',s=>s.get(id)):null;
function say(t){
 if(status)status.textContent=t;
 const b=document.getElementById('ccPermanentSaveBtn');
 if(b&&t.startsWith('Saved locally:'))b.textContent='💾 ✓ Saved to My Documents';
 const actionStatus=document.getElementById('ccAnnotationActionStatus');
 if(actionStatus)actionStatus.textContent=t;
}
function validName(input,old){
 const name=String(input||'').trim();
 if(!name||name==='.'||name==='..'||/[\\/<>:"|?*\x00-\x1f]/.test(name)||name.length>160)throw Error('Enter a valid document name (up to 160 characters).');
 const dot=old.lastIndexOf('.'),extension=dot>0?old.slice(dot):'';
 if(!extension)return name;
 const stem=name.toLowerCase().endsWith(extension.toLowerCase())?name.slice(0,-extension.length):name.replace(/\.[^.]+$/,'');
 if(!stem.trim())throw Error('A document name is required.');
 return stem.trim()+extension;
}
async function save(scope='all'){
 if(!currentFile||!api()?.isOpen()){say('Open a document first.');return false}
 try{
  const snapshot=await api().export(scope);
  const file=currentFile,old=await byId(currentId);
  const pages=scope==='page'?{...(old?.annotations?.pages||{}),...snapshot.pages}:snapshot.pages;
  const record={
   ...(old||{}),id:old?.id||crypto.randomUUID(),name:currentName||file.name||'Document',
   type:file.type||'',size:file.size,lastModified:file.lastModified||0,
   savedAt:Date.now(),blob:file,
   annotations:{version:1,pages}
  };
  await request('readwrite',s=>s.put(record));
  currentId=record.id;
  say('Saved locally: '+record.name+' ('+(scope==='page'?'current page':'all pages')+' annotations)');
  if(dialog&&!dialog.hidden)await refresh(false);
  return true;
 }catch(err){say('Save failed: '+(err.message||err));return false}
}
window.ccSaveCurrentDocument=()=>save('all');
window.ccSaveCurrentPage=()=>save('page');
async function removeAnnotations(scope){
 if(!api()?.isOpen()){say('Open a document first.');return}
 const label=scope==='page'?'all annotations on this page':'all annotations throughout this document';
 if(!confirm('Delete '+label+'? This cannot be undone. The original document will be kept.'))return;
 try{
  await api().clear(scope);
  const record=await byId(currentId);
  if(record){
   const pages=scope==='page'?{...(record.annotations?.pages||{}),...(await api().export('page')).pages}:{};
   record.annotations={version:1,pages};
   record.savedAt=Date.now();
   await request('readwrite',s=>s.put(record));
  }
  say(scope==='page'?'Page annotations deleted.':'All document annotations deleted.');
  if(dialog&&!dialog.hidden)await refresh(false);
 }catch(err){say('Could not delete annotations: '+(err.message||err))}
}
window.ccDeleteDocumentAnnotations=removeAnnotations;
async function renameRecord(id){
 const record=await byId(id);if(!record){say('Document no longer found.');return}
 const entered=prompt('Rename document (file extension is preserved):',record.name);
 if(entered===null)return;
 try{
  const name=validName(entered,record.name);if(name===record.name)return;
  record.name=name;record.savedAt=Date.now();
  await request('readwrite',s=>s.put(record));
  if(id===currentId){currentName=name;api()?.setName(name)}
  say('Renamed to '+name);
  if(dialog&&!dialog.hidden)await refresh(false);
 }catch(err){say('Rename failed: '+(err.message||err))}
}
async function renameCurrent(){
 if(!currentFile){say('Open a document first.');return}
 const old=currentName||currentFile.name||'Document';
 const entered=prompt('Rename document (file extension is preserved):',old);
 if(entered===null)return;
 try{
  const name=validName(entered,old);if(name===old)return;
  if(currentId){const record=await byId(currentId);if(record){record.name=name;record.savedAt=Date.now();await request('readwrite',s=>s.put(record))}}
  currentName=name;api()?.setName(name);
  say('Renamed to '+name+(currentId?'':' — save to My Documents to keep this name'));
  if(dialog&&!dialog.hidden)await refresh(false);
 }catch(err){say('Rename failed: '+(err.message||err))}
}
async function refresh(withCount=true){
 if(!list)return;
 try{
  const q=(document.getElementById('ccDocsSearch')?.value||'').toLowerCase();
  const records=(await all()).filter(x=>x.name.toLowerCase().includes(q)).sort((a,b)=>b.savedAt-a.savedAt);
  list.replaceChildren();
  if(!records.length){const p=document.createElement('p');p.textContent='No saved documents.';list.append(p)}
  for(const x of records){
   const row=document.createElement('div');row.style.cssText='display:flex;align-items:center;gap:7px;padding:8px 0;border-bottom:1px solid #ddd;flex-wrap:wrap';
   const label=document.createElement('span');label.style.cssText='flex:1 1 185px;min-width:0;overflow-wrap:anywhere';
   const pages=Object.values(x.annotations?.pages||{}).filter(v=>Array.isArray(v)&&v.length).length;
   label.textContent=x.name+' ('+(x.size/1048576).toFixed(1)+' MB · '+pages+' annotated page'+(pages===1?'':'s')+')';
   const open=document.createElement('button');open.textContent='Open';open.onclick=()=>{
    const file=new File([x.blob],x.name,{type:x.type,lastModified:x.lastModified||Date.now()});
    window.dispatchEvent(new CustomEvent('cc-my-documents-open',{detail:{file,recordId:x.id,annotations:x.annotations}}));
    dialog.hidden=true;say('Opening '+x.name);
   };
   const rename=document.createElement('button');rename.textContent='Rename';rename.title='Rename saved document';rename.onclick=()=>renameRecord(x.id);
   const del=document.createElement('button');del.textContent='Delete file';del.onclick=async()=>{
    if(!confirm('Permanently delete '+x.name+' and all saved annotations from this browser?'))return;
    await request('readwrite',s=>s.delete(x.id));
    if(currentId===x.id)currentId=null;
    await refresh(false);say('Deleted '+x.name);
   };
   row.append(label,open,rename,del);list.append(row);
  }
  if(withCount)say(records.length+' documents shown · '+(records.reduce((n,x)=>n+x.size,0)/1048576).toFixed(1)+' MB');
 }catch(err){say('Could not load documents: '+(err.message||err))}
}
function addActionButton(parent,label,fn,danger=false){
 const b=document.createElement('button');b.type='button';b.textContent=label;b.className='btn'+(danger?' danger':'');
 b.style.cssText='min-height:39px!important;height:auto!important;padding:8px!important;text-align:left;white-space:normal!important;font-size:12px!important';
 b.onclick=async()=>{b.disabled=true;try{await fn()}finally{b.disabled=false}};
 parent.append(b);return b;
}
function makeActions(){
 actionsDialog=document.createElement('section');actionsDialog.id='ccAnnotationActionsDialog';actionsDialog.hidden=true;

 actionsDialog.setAttribute('role','dialog');actionsDialog.setAttribute('aria-modal','true');
 actionsDialog.setAttribute('aria-label','Document annotation actions');
 const h=document.createElement('div');h.style.cssText='display:flex;justify-content:space-between;gap:12px;align-items:center';
 const heading=document.createElement('strong');heading.textContent='📝 Document annotations';
 const close=document.createElement('button');close.type='button';close.textContent='✕ Close';close.onclick=()=>{actionsDialog.hidden=true};
 h.append(heading,close);
 const desc=document.createElement('p');desc.textContent='Save page or whole document to My Documents. Delete acts immediately on saved annotations (confirmation required); original file stays intact.';
 const buttons=document.createElement('div');buttons.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px';
 addActionButton(buttons,'💾 Save this page',()=>save('page'));
 addActionButton(buttons,'💾 Save whole document',()=>save('all'));
 addActionButton(buttons,'✏️ Rename document',renameCurrent);
 addActionButton(buttons,'🗑 Delete page annotations',()=>removeAnnotations('page'),true);
 addActionButton(buttons,'🗑 Delete all document annotations',()=>removeAnnotations('all'),true);
 const message=document.createElement('p');message.id='ccAnnotationActionStatus';message.setAttribute('role','status');message.style.marginBottom='0';
 actionsDialog.append(h,desc,buttons,message);document.body.append(actionsDialog);
 const slot=document.getElementById('ccSaveSlot');
 if(slot){
  const launch=document.createElement('button');launch.id='ccAnnotationActionsBtn';launch.type='button';launch.textContent='📝 Annotations ▾';launch.title='Save, delete, or rename document annotations';
  launch.onclick=()=>{if(!api()?.isOpen())return;actionsDialog.hidden=false;message.textContent='';close.focus()};
  const exit=document.getElementById('ccPermanentExitBtn');
  slot.insertBefore(launch,exit?.parentElement===slot?exit:null);
 }
 // Ignore synthetic Escape events emitted internally to finish editing.
 window.addEventListener('keydown',e=>{if(e.isTrusted&&e.key==='Escape'&&!actionsDialog.hidden)actionsDialog.hidden=true});
 window.addEventListener('cc-document-closed',()=>{actionsDialog.hidden=true;currentFile=null;currentId=null;currentName=''});
}
function make(){
 const style=document.createElement('style');
 style.textContent='#ccDocsDialog[hidden],#ccAnnotationActionsDialog[hidden]{display:none!important}'+
 '#ccDocsDialog,#ccAnnotationActionsDialog{position:fixed;z-index:2147483000;inset:6% max(12px,calc((100vw - 650px)/2));background:#fff;color:#142334;border:2px solid #0f766e;border-radius:12px;box-shadow:0 0 0 200vmax #0008;padding:16px;overflow:auto;font:15px system-ui;max-height:88vh}'+
 '#ccDocsDialog button,#ccAnnotationActionsDialog button{padding:7px 10px;cursor:pointer}#ccDocsDialog input{width:100%;padding:9px;box-sizing:border-box;margin:10px 0}#ccQuickSave{display:none!important}';
 document.head.append(style);
 const permanentSave=document.getElementById('ccPermanentSaveBtn');
 if(permanentSave)permanentSave.onclick=async()=>{permanentSave.disabled=true;try{await save('all')}finally{permanentSave.disabled=false}};
 dialog=document.createElement('section');dialog.id='ccDocsDialog';dialog.hidden=true;
 dialog.setAttribute('role','dialog');dialog.setAttribute('aria-label','My Documents');
 const head=document.createElement('div');head.style.cssText='display:flex;align-items:center;justify-content:space-between';
 const title=document.createElement('strong');title.textContent='My Documents (saved on this device)';
 const close=document.createElement('button');close.textContent='Close';close.onclick=()=>dialog.hidden=true;head.append(title,close);
 const note=document.createElement('p');note.textContent='Documents and their page annotations stay in this browser. Clearing site data erases them. Save is manual.';
 const saveBtn=document.createElement('button');saveBtn.textContent='Save whole document';saveBtn.onclick=()=>save('all');
 const search=document.createElement('input');search.id='ccDocsSearch';search.placeholder='Search saved documents';search.oninput=()=>refresh(false);
 list=document.createElement('div');status=document.createElement('p');status.setAttribute('role','status');
 dialog.append(head,note,saveBtn,search,list,status);document.body.append(dialog);
 const tools=document.querySelector('.tools'),launch=document.createElement('button');
 launch.type='button';launch.className='btn soft';launch.textContent='📁 My Documents';launch.title='Save, rename and open locally stored documents';
 launch.onclick=()=>{dialog.hidden=false;refresh()};(tools||document.body).append(launch);
 makeActions();
 window.addEventListener('cc-document-opened',e=>{
  if(!(e.detail?.file instanceof Blob))return;
  currentFile=e.detail.file;currentName=currentFile.name||'Document';currentId=e.detail.recordId||null;
  if(permanentSave)permanentSave.textContent='💾 Save to My Documents';
 });
 window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!dialog.hidden)dialog.hidden=true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',make);else make();
})();
