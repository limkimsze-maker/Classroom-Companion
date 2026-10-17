(function(){
'use strict';
const DB_NAME='ClassroomCompanionLocalDocuments';
const DB_VERSION=1;
const STORE='pdfs';
let currentPdfFile=null,currentPdfOriginalName='',saveBtn=null,savedBtn=null,panel=null;

function toast(msg){
 const t=document.getElementById('toast');
 if(!t)return;
 t.textContent=msg;t.classList.add('show');clearTimeout(t._localSaveTimer);t._localSaveTimer=setTimeout(()=>t.classList.remove('show'),1700);
}
function isPdfInput(el){return !!(el&&el.tagName==='INPUT'&&el.type==='file'&&/pdf/i.test(el.accept||''))}
function openDb(){
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open(DB_NAME,DB_VERSION);
  req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'id',autoIncrement:true})};
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error('Could not open local document storage'));
 });
}
async function putPdf(displayName,file){
 const db=await openDb();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readwrite');
  const st=tx.objectStore(STORE);
  const req=st.add({displayName,originalName:file.name||displayName+'.pdf',blob:file,type:file.type||'application/pdf',savedAt:Date.now()});
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);tx.oncomplete=()=>db.close();
 });
}
async function getAll(){
 const db=await openDb();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readonly'),req=tx.objectStore(STORE).getAll();
  req.onsuccess=()=>resolve((req.result||[]).sort((a,b)=>(b.savedAt||0)-(a.savedAt||0)));req.onerror=()=>reject(req.error);tx.oncomplete=()=>db.close();
 });
}
async function deleteOne(id){
 const db=await openDb();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readwrite'),req=tx.objectStore(STORE).delete(id);
  req.onsuccess=()=>resolve();req.onerror=()=>reject(req.error);tx.oncomplete=()=>db.close();
 });
}
function findDocumentInput(){return [...document.querySelectorAll('input[type="file"]')].find(el=>/pdf|docx|wordprocessingml/i.test(el.accept||''))||null}
function reopenRecord(rec){
 const input=findDocumentInput();
 if(!input){toast('Document opener is not ready.');return}
 try{
  const file=new File([rec.blob],rec.originalName||((rec.displayName||'Saved PDF')+'.pdf'),{type:rec.type||'application/pdf',lastModified:Date.now()});
  const dt=new DataTransfer();dt.items.add(file);input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));hidePanel();
 }catch(err){console.error(err);toast('Could not reopen the saved PDF.')}
}
function ensurePanel(){
 if(panel)return panel;
 panel=document.createElement('div');panel.id='savedPdfPanel';panel.style.display='none';document.body.appendChild(panel);
 const style=document.createElement('style');style.id='savedPdfPanelStyles';style.textContent=`
#savedPdfPanel{position:fixed;right:58px;top:170px;z-index:100260;width:min(280px,70vw);max-height:55vh;overflow:auto;padding:8px;border:1px solid #cbd6dc;border-radius:12px;background:rgba(255,255,255,.99);box-shadow:0 8px 24px rgba(18,32,46,.22);font-family:system-ui,sans-serif;color:#17324d}
#savedPdfPanel .savedPdfHead{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;font-size:12px;font-weight:900}
#savedPdfPanel .savedPdfHead button{width:28px;height:26px;border:1px solid #d8e1e8;border-radius:7px;background:#fff;font-weight:900;color:#17324d}
#savedPdfPanel .savedPdfEmpty{padding:12px 6px;text-align:center;font-size:11px;font-weight:700;color:#667085}
#savedPdfPanel .savedPdfRow{display:grid;grid-template-columns:1fr auto;gap:6px;align-items:center;padding:5px 0;border-top:1px solid #edf1f3}
#savedPdfPanel .savedPdfOpen{min-width:0;text-align:left;border:1px solid #d8e1e8;border-radius:8px;background:#fff;color:#17324d;padding:7px 8px;font-size:11px;font-weight:850;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#savedPdfPanel .savedPdfDelete{width:30px;height:30px;border:1px solid #efb4ad;border-radius:8px;background:#fff5f3;color:#b42318;font-weight:900}
`;
 document.head.appendChild(style);return panel;
}
function hidePanel(){if(panel)panel.style.display='none'}
async function showPanel(){
 ensurePanel();panel.innerHTML='<div class="savedPdfHead"><span>Saved PDFs</span><button type="button" aria-label="Close">×</button></div><div class="savedPdfEmpty">Loading…</div>';panel.style.display='block';
 panel.querySelector('.savedPdfHead button').onclick=hidePanel;
 try{
  const rows=await getAll();
  if(!rows.length){panel.querySelector('.savedPdfEmpty').textContent='No saved PDFs yet.';return}
  const head=panel.querySelector('.savedPdfHead');panel.innerHTML='';panel.appendChild(head);
  rows.forEach(rec=>{
   const row=document.createElement('div');row.className='savedPdfRow';
   const open=document.createElement('button');open.type='button';open.className='savedPdfOpen';open.textContent=rec.displayName||rec.originalName||'Saved PDF';open.title=rec.originalName||'';open.onclick=()=>reopenRecord(rec);
   const del=document.createElement('button');del.type='button';del.className='savedPdfDelete';del.textContent='×';del.title='Delete saved PDF';del.onclick=async e=>{e.stopPropagation();if(!confirm(`Delete “${rec.displayName||rec.originalName||'Saved PDF'}” from this browser?`))return;await deleteOne(rec.id);showPanel()};
   row.append(open,del);panel.appendChild(row);
  });
 }catch(err){console.error(err);panel.innerHTML='<div class="savedPdfEmpty">Could not read saved PDFs.</div>'}
}
async function saveCurrent(){
 if(!currentPdfFile){toast('Open a PDF first.');return}
 let suggested=(currentPdfOriginalName||currentPdfFile.name||'Saved PDF').replace(/\.pdf$/i,'').trim();
 let name=prompt('Name this saved PDF:',suggested);if(name===null)return;name=name.trim();if(!name){toast('Please enter a name.');return}
 try{await putPdf(name,currentPdfFile);toast(`Saved locally as “${name}”`)}catch(err){console.error(err);toast('Could not save this PDF locally.')}
}
function ensureButtons(){
 const bar=document.getElementById('documentQuickBar');if(!bar)return false;
 if(!saveBtn){
  saveBtn=document.createElement('button');saveBtn.id='saveCurrentPdfLocalBtn';saveBtn.type='button';saveBtn.textContent='💾';saveBtn.title='Save this PDF locally';saveBtn.setAttribute('aria-label','Save this PDF locally');saveBtn.addEventListener('click',saveCurrent);
 }
 if(!savedBtn){
  savedBtn=document.createElement('button');savedBtn.id='openSavedPdfLocalBtn';savedBtn.type='button';savedBtn.textContent='📂';savedBtn.title='Open a saved PDF';savedBtn.setAttribute('aria-label','Open a saved PDF');savedBtn.addEventListener('click',()=>panel?.style.display==='block'?hidePanel():showPanel());
 }
 if(!bar.contains(saveBtn)){
  const search=[...bar.querySelectorAll('button')].find(b=>(b.textContent||'').includes('🔎'));
  if(search)bar.insertBefore(saveBtn,search);else bar.appendChild(saveBtn);
 }
 if(!bar.contains(savedBtn)){
  const search=[...bar.querySelectorAll('button')].find(b=>(b.textContent||'').includes('🔎'));
  if(search)bar.insertBefore(savedBtn,search);else bar.appendChild(savedBtn);
 }
 saveBtn.disabled=!currentPdfFile;return true;
}

// Capture the original PDF before the working opener clears its file input.
document.addEventListener('change',e=>{
 const input=e.target;if(!isPdfInput(input))return;
 const f=input.files&&input.files[0];if(!f||!f.name.toLowerCase().endsWith('.pdf'))return;
 currentPdfFile=f;currentPdfOriginalName=f.name;ensureButtons();
},true);

// Keep save disabled until a PDF has been chosen in this session.
new MutationObserver(()=>ensureButtons()).observe(document.documentElement,{childList:true,subtree:true});
ensureButtons();
})();
