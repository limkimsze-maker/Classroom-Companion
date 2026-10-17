(function(){
'use strict';
const DB_NAME='ClassroomCompanionLocalDocuments';
const DB_VERSION=1;
const STORE='pdfs';
const MAX_VISIBLE=40;
let recentBtn=null,panel=null,pendingFile=null,pendingSourceKey='',pendingReopenId=null,readyWatch=null,readyStarted=0;

function toast(msg){
 const t=document.getElementById('toast');
 if(!t)return;
 t.textContent=msg;t.classList.add('show');clearTimeout(t._recentPdfTimer);t._recentPdfTimer=setTimeout(()=>t.classList.remove('show'),1800);
}
function baseName(name){return (name||'Recent PDF').replace(/\.pdf$/i,'').trim()||'Recent PDF'}
function sourceKey(file){return `${file.name||''}::${file.size||0}::${file.lastModified||0}`}
function fmtBytes(n){
 n=Number(n)||0;if(n<1024)return `${n} B`;if(n<1048576)return `${(n/1024).toFixed(n<10240?1:0)} KB`;return `${(n/1048576).toFixed(n<10485760?1:0)} MB`;
}
function fmtTime(ms){
 if(!ms)return '';
 try{return new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(ms))}catch{return ''}
}
function isPdfInput(el){return !!(el&&el.tagName==='INPUT'&&el.type==='file'&&/pdf/i.test(el.accept||''))}
function openDb(){
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open(DB_NAME,DB_VERSION);
  req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'id',autoIncrement:true})};
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error('Could not open local PDF storage'));
 });
}
async function getAll(){
 const db=await openDb();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readonly'),req=tx.objectStore(STORE).getAll();
  req.onsuccess=()=>resolve((req.result||[]).sort((a,b)=>(b.lastOpened||b.savedAt||0)-(a.lastOpened||a.savedAt||0)));
  req.onerror=()=>reject(req.error);tx.oncomplete=()=>db.close();
 });
}
async function putRecord(rec){
 const db=await openDb();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readwrite'),req=tx.objectStore(STORE).put(rec);
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);tx.oncomplete=()=>db.close();
 });
}
async function deleteOne(id){
 const db=await openDb();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readwrite'),req=tx.objectStore(STORE).delete(id);
  req.onsuccess=()=>resolve();req.onerror=()=>reject(req.error);tx.oncomplete=()=>db.close();
 });
}
async function clearAll(){
 const db=await openDb();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readwrite'),req=tx.objectStore(STORE).clear();
  req.onsuccess=()=>resolve();req.onerror=()=>reject(req.error);tx.oncomplete=()=>db.close();
 });
}
function findDocumentInput(){return [...document.querySelectorAll('input[type="file"]')].find(el=>/pdf|docx|wordprocessingml/i.test(el.accept||''))||null}

function renderedPdfReady(){
 if(!document.body.classList.contains('document-open-mode'))return false;
 const c=document.getElementById('documentPdfCanvas');if(!c)return false;
 if(getComputedStyle(c).display==='none'||c.width<2||c.height<2)return false;
 const r=c.getBoundingClientRect();return r.width>10&&r.height>10;
}
function stopReadyWatch(){clearInterval(readyWatch);readyWatch=null}
function startReadyWatch(){
 stopReadyWatch();readyStarted=performance.now();
 readyWatch=setInterval(()=>{
  if(!pendingFile){stopReadyWatch();return}
  if(renderedPdfReady()&&performance.now()-readyStarted>450){stopReadyWatch();autoSavePending()}
  else if(performance.now()-readyStarted>30000){pendingFile=null;pendingSourceKey='';pendingReopenId=null;stopReadyWatch()}
 },120);
}
async function autoSavePending(){
 const file=pendingFile,key=pendingSourceKey,reopenId=pendingReopenId;
 pendingFile=null;pendingSourceKey='';pendingReopenId=null;
 if(!file)return;
 const now=Date.now();
 try{
  const rows=await getAll();
  let rec=reopenId?rows.find(r=>r.id===reopenId):null;
  if(!rec)rec=rows.find(r=>r.sourceKey===key);
  const isNew=!rec;
  if(!rec){
   rec={displayName:baseName(file.name),originalName:file.name||'Recent.pdf',sourceKey:key,savedAt:now,lastOpened:now};
  }
  rec.originalName=file.name||rec.originalName||'Recent.pdf';
  rec.sourceKey=rec.sourceKey||key;
  rec.blob=file;
  rec.type=file.type||'application/pdf';
  rec.size=file.size||rec.size||0;
  rec.lastModified=file.lastModified||rec.lastModified||0;
  rec.lastOpened=now;
  if(!rec.savedAt)rec.savedAt=now;
  await putRecord(rec);
  if(isNew)toast(`Added “${rec.displayName}” to Recent PDFs`);
  if(panel?.style.display==='block')showPanel();
 }catch(err){
  console.error(err);
  const quota=err?.name==='QuotaExceededError';
  toast(quota?'PDF opened, but browser storage is full.':'PDF opened, but could not add it to Recents.');
 }
}

function reopenRecord(rec){
 const input=findDocumentInput();
 if(!input){toast('Document opener is not ready.');return}
 try{
  pendingReopenId=rec.id;
  const file=new File([rec.blob],rec.originalName||((rec.displayName||'Recent PDF')+'.pdf'),{type:rec.type||'application/pdf',lastModified:rec.lastModified||rec.savedAt||Date.now()});
  const dt=new DataTransfer();dt.items.add(file);input.files=dt.files;
  input.dispatchEvent(new Event('change',{bubbles:true}));
  hidePanel();
 }catch(err){console.error(err);pendingReopenId=null;toast('Could not reopen this recent PDF.')}
}
async function renameOne(rec){
 let name=prompt('Rename this PDF:',rec.displayName||baseName(rec.originalName));if(name===null)return;name=name.trim();if(!name){toast('Please enter a name.');return}
 rec.displayName=name;await putRecord(rec);toast(`Renamed to “${name}”`);showPanel();
}

function ensurePanel(){
 if(panel)return panel;
 panel=document.createElement('div');panel.id='recentPdfPanel';panel.style.display='none';document.body.appendChild(panel);
 const style=document.createElement('style');style.id='recentPdfPanelStyles';style.textContent=`
#recentPdfPanel{position:fixed;right:12px;top:72px;z-index:100260;width:min(360px,86vw);max-height:72vh;overflow:auto;padding:9px;border:1px solid #cbd6dc;border-radius:13px;background:rgba(255,255,255,.99);box-shadow:0 10px 28px rgba(18,32,46,.22);font-family:system-ui,sans-serif;color:#17324d}
#recentPdfPanel .recentHead{display:flex;align-items:center;gap:7px;position:sticky;top:-9px;background:#fff;padding:8px 0 7px;z-index:2}
#recentPdfPanel .recentHead strong{font-size:13px;margin-right:auto}#recentPdfPanel .recentHead button{height:28px;border:1px solid #d8e1e8;border-radius:7px;background:#fff;color:#17324d;font:900 11px system-ui;padding:0 8px}
#recentPdfPanel .recentSummary{font-size:10px;font-weight:750;color:#667085;padding:0 2px 7px}
#recentPdfPanel .recentEmpty{padding:18px 8px;text-align:center;font-size:11px;font-weight:750;color:#667085}
#recentPdfPanel .recentRow{display:grid;grid-template-columns:minmax(0,1fr) 31px 31px;gap:5px;align-items:center;padding:6px 0;border-top:1px solid #edf1f3}
#recentPdfPanel .recentOpen{min-width:0;text-align:left;border:1px solid #d8e1e8;border-radius:9px;background:#fff;color:#17324d;padding:7px 8px}
#recentPdfPanel .recentName{display:block;font-size:11px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#recentPdfPanel .recentMeta{display:block;margin-top:2px;font-size:9px;font-weight:700;color:#7a8791;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#recentPdfPanel .recentIcon{width:31px;height:31px;border:1px solid #d8e1e8;border-radius:8px;background:#fff;color:#17324d;font-weight:900;padding:0}
#recentPdfPanel .recentDelete{border-color:#efb4ad;background:#fff5f3;color:#b42318}
`;
 document.head.appendChild(style);return panel;
}
function hidePanel(){if(panel)panel.style.display='none'}
async function showPanel(){
 ensurePanel();panel.innerHTML='<div class="recentHead"><strong>Recent PDFs</strong><button type="button" data-clear>Clear all</button><button type="button" data-close>×</button></div><div class="recentEmpty">Loading…</div>';panel.style.display='block';
 panel.querySelector('[data-close]').onclick=hidePanel;
 panel.querySelector('[data-clear]').onclick=async()=>{
  if(!confirm('Remove all Recent PDFs stored in this browser?'))return;
  try{await clearAll();toast('Recent PDFs cleared');showPanel()}catch(err){console.error(err);toast('Could not clear Recent PDFs.')}
 };
 try{
  const all=await getAll(),rows=all.slice(0,MAX_VISIBLE);
  const totalBytes=all.reduce((s,r)=>s+(Number(r.size)||Number(r.blob?.size)||0),0);
  const head=panel.querySelector('.recentHead');panel.innerHTML='';panel.appendChild(head);
  const summary=document.createElement('div');summary.className='recentSummary';summary.textContent=`${all.length} file${all.length===1?'':'s'} · ${fmtBytes(totalBytes)} · stored on this browser only`;panel.appendChild(summary);
  if(!rows.length){const e=document.createElement('div');e.className='recentEmpty';e.textContent='No Recent PDFs yet. Open a PDF once and it will appear here automatically.';panel.appendChild(e);return}
  rows.forEach(rec=>{
   const row=document.createElement('div');row.className='recentRow';
   const open=document.createElement('button');open.type='button';open.className='recentOpen';
   const n=document.createElement('span');n.className='recentName';n.textContent=rec.displayName||baseName(rec.originalName);
   const m=document.createElement('span');m.className='recentMeta';m.textContent=[fmtTime(rec.lastOpened||rec.savedAt),fmtBytes(rec.size||rec.blob?.size)].filter(Boolean).join(' · ');
   open.append(n,m);open.title=rec.originalName||'';open.onclick=()=>reopenRecord(rec);
   const ren=document.createElement('button');ren.type='button';ren.className='recentIcon';ren.textContent='✎';ren.title='Rename';ren.onclick=e=>{e.stopPropagation();renameOne(rec)};
   const del=document.createElement('button');del.type='button';del.className='recentIcon recentDelete';del.textContent='×';del.title='Delete';del.onclick=async e=>{e.stopPropagation();if(!confirm(`Delete “${rec.displayName||baseName(rec.originalName)}” from this browser?`))return;await deleteOne(rec.id);showPanel()};
   row.append(open,ren,del);panel.appendChild(row);
  });
 }catch(err){console.error(err);panel.innerHTML='<div class="recentEmpty">Could not read Recent PDFs.</div>'}
}
function ensureRecentButton(){
 const tools=document.querySelector('.tools');if(!tools)return false;
 if(!recentBtn){
  recentBtn=document.createElement('button');recentBtn.id='recentPdfBtn';recentBtn.type='button';recentBtn.className='btn soft';recentBtn.textContent='📂 Recent';recentBtn.title='Recent PDFs stored on this browser';recentBtn.addEventListener('click',()=>panel?.style.display==='block'?hidePanel():showPanel());
 }
 if(!tools.contains(recentBtn)){
  const open=document.getElementById('openDocumentBtn');
  if(open?.nextSibling)tools.insertBefore(recentBtn,open.nextSibling);else if(open)tools.appendChild(recentBtn);else tools.appendChild(recentBtn);
 }
 return true;
}

// Capture the PDF before the working opener clears its file input. No opener code is changed.
document.addEventListener('change',e=>{
 const input=e.target;if(!isPdfInput(input))return;
 const f=input.files&&input.files[0];if(!f||!f.name.toLowerCase().endsWith('.pdf'))return;
 pendingFile=f;pendingSourceKey=sourceKey(f);startReadyWatch();
},true);

new MutationObserver(()=>ensureRecentButton()).observe(document.documentElement,{childList:true,subtree:true});
ensurePanel();ensureRecentButton();
})();
