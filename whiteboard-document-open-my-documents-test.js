/* MOE SAFE BUILD: same-origin pinned document engines; no document upload endpoint. */
(function(){
'use strict';
if(typeof wrap==='undefined'||typeof canvas==='undefined'||typeof redraw!=='function'||typeof syncUi!=='function')return;

const PDFJS_URL='vendor/moe/pdf.min.js';
const PDFJS_WORKER='vendor/moe/pdf.worker.min.js';
const MAMMOTH_URL='vendor/moe/mammoth.browser.min.js';
const PPTX_ESM_URL='./vendor/moe/pptx-renderer.browser.es.js';
const XLSX_URL='vendor/moe/xlsx.full.min.js';

let layer,pdfCanvas,wordViewport,wordPaper,pptViewport,sheetViewport,sheetPaper,genericViewport;
let toolbar,fileInput,pageInput,pageTotal,zoomLabel,prevBtn,nextBtn,searchBtn,searchPanel,searchInput,searchStatus,interactBtn;
let active=false,docKind=null,docName='',currentPage=1,totalPages=1,zoom=1,renderToken=0;
let pageStore=new Map(),preDocumentStrokes=null;
let pdfDoc=null,pdfLoadingTask=null,pdfRefineTask=null,pdfRefineTimer=0,pptViewer=null,pptModule=null,pptMatches=[],pptMatchIndex=-1,pptQuery='';
let workbook=null,sheetNames=[];
let objectUrl=null,genericEl=null,interactionMode=false;
let pdfTextCache=new Map(),pdfQuery='',pdfMatches=[],pdfMatchIndex=-1,pdfHasText=true;
let searchRevision=0,documentRevision=0,sheetQuery='',sheetMatches=[],sheetMatchIndex=-1,genericSearchText='';
let wordMatches=[],wordMatchIndex=-1,wordQuery='';

const clone=v=>{try{return structuredClone(v)}catch{return JSON.parse(JSON.stringify(v))}};
let documentLoading=null,loadingTimer=0,loadingRevision=0,openingDocument=false;
let pickerPending=false,pickerSerial=0;
function ensureDocumentLoading(){
 if(documentLoading)return documentLoading;
 const overlay=document.createElement('div');overlay.id='ccDocumentLoading';overlay.hidden=true;
 overlay.setAttribute('role','status');overlay.setAttribute('aria-live','polite');
 overlay.setAttribute('aria-label','Loading...Please wait.');
 const message=document.createElement('div');message.className='cc-loading-message';
 const spinner=document.createElement('span');spinner.className='cc-loading-spinner';spinner.setAttribute('aria-hidden','true');
 const copy=document.createElement('div');copy.className='cc-loading-copy';
 const headline=document.createElement('strong');headline.id='ccLoadingHeadline';headline.textContent='Loading...Please wait.';
 const detail=document.createElement('span');detail.id='ccLoadingDetail';detail.textContent='Opening document…';
 const tip=document.createElement('span');tip.id='ccLoadingTip';
 tip.textContent='Tip: Save to My Documents for quicker access next time. The file still needs to be processed when reopened.';
 copy.append(headline,detail,tip);message.append(spinner,copy);overlay.append(message);document.body.appendChild(overlay);
 // Place above the whiteboard and document underlay even while they re-render.
 // Fixed positioning prevents board layout/transforms from hiding the status.
 Object.assign(overlay.style,{position:'fixed',inset:'0',zIndex:'2147483000',display:'grid',placeItems:'center',background:'rgba(245,249,250,.92)',pointerEvents:'auto'});
 documentLoading=overlay;return overlay;
}
function setDocumentLoadingCopy(file,fromSaved=false){
 ensureDocumentLoading();
 const ext=extOf(file),mime=file?.type||'';
 const format=ext==='pdf'||mime==='application/pdf'?'PDF':ext==='docx'?'Word document':['pptx','pptm','ppsx','potx'].includes(ext)?'PowerPoint': 'document';
 document.getElementById('ccLoadingDetail').textContent='Opening '+format+'…';
 document.getElementById('ccLoadingTip').textContent=fromSaved
  ?'Opening your saved copy from My Documents. It may still take time to process and display.'
  :'Tip: Save to My Documents for quicker access next time. Reopening still requires processing and displaying the file.';
}
// Give the browser a chance to paint the message before starting expensive
// Word/PowerPoint conversion. The message stays visible until content is ready.
function paintDocumentLoading(){
 return new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
}
// Display the message on the first Open click, before the native file
// chooser. Two animation frames allow the browser to paint the message;
 // the brief delay still falls within the browser's transient user activation.
async function chooseDocumentFile(){
 if(pickerPending)return;
 pickerPending=true;
 const id=++pickerSerial;
 const overlay=ensureDocumentLoading();
 const detail=overlay.querySelector('#ccLoadingDetail');
 const tip=overlay.querySelector('#ccLoadingTip');
 if(detail)detail.textContent='Choose a PDF, PowerPoint, Word or other file…';
 if(tip)tip.textContent='Tip: Saving to My Documents lets you reopen a local copy without choosing the original file again. The document still requires processing.';
 showDocumentLoading();
 warmPdfEngine();
 await paintDocumentLoading();
 if(!pickerPending||id!==pickerSerial)return;
 try{fileInput.click()}catch(err){pickerPending=false;hideDocumentLoading();console.error(err)}
}
function closeFileChooserWithoutSelection(){
 if(!pickerPending||openingDocument||fileInput?.files?.length)return;
 pickerPending=false;
 ++pickerSerial;
 hideDocumentLoading();
}
function showDocumentLoading(delay=false){
 const overlay=ensureDocumentLoading(),ticket=++loadingRevision;
 clearTimeout(loadingTimer);loadingTimer=0;
 if(delay)loadingTimer=setTimeout(()=>{if(ticket===loadingRevision&&active)overlay.hidden=false},180);
 else overlay.hidden=false;
}
function hideDocumentLoading(){
 if(openingDocument)return;
 loadingRevision++;clearTimeout(loadingTimer);loadingTimer=0;
 if(documentLoading)documentLoading.hidden=true;
}

function toast(msg){if(typeof say==='function'){try{say(msg);return}catch{}}const t=document.getElementById('toast');if(t){t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800)}}
// Reuse a single engine request when PDF selection, a saved-document open and
// idle preparation happen together. Comparing relative src to script.src
// (absolute URL) used to miss in-flight loads and could request duplicates.
const engineRequests=new Map();
function loadScript(src,globalName){
 if(globalName&&window[globalName])return Promise.resolve(window[globalName]);
 if(engineRequests.has(src))return engineRequests.get(src);
 const ready=new Promise((resolve,reject)=>{
  const url=new URL(src,document.baseURI).href;
  const old=[...document.scripts].find(s=>s.src===url);
  if(old){
   if(globalName&&window[globalName])return resolve(window[globalName]);
   old.addEventListener('load',()=>resolve(globalName?window[globalName]:true),{once:true});
   old.addEventListener('error',()=>reject(new Error('Could not load document engine')),{once:true});
   return;
  }
  const script=document.createElement('script');
  script.src=src;script.async=true;
  script.onload=()=>resolve(globalName?window[globalName]:true);
  script.onerror=()=>{script.remove();reject(new Error('Could not load document engine'))};
  document.head.appendChild(script);
 }).catch(error=>{engineRequests.delete(src);throw error});
 engineRequests.set(src,ready);
 return ready;
}
// Load PDF.js once the whiteboard is idle; never block the initial board.
// File-picker activation additionally starts it while the teacher chooses a file.
function preparePdfEngine(){
 return loadScript(PDFJS_URL,'pdfjsLib').then(lib=>{
  if(lib?.GlobalWorkerOptions)lib.GlobalWorkerOptions.workerSrc=PDFJS_WORKER;
  return lib;
 });
}
// One PDF.js worker can process multiple documents without downloading its
// 1 MB script for each. PDF.js keeps shared workers alive when a document task
// is destroyed, allowing us to release the document without losing the worker.
let pdfWorkerPromise=null;
function preparePdfWorker(){
 if(pdfWorkerPromise)return pdfWorkerPromise;
 pdfWorkerPromise=preparePdfEngine().then(async lib=>{
  const worker=new lib.PDFWorker({name:'classroom-companion-pdf'});
  await worker.promise;
  return worker;
 }).catch(error=>{pdfWorkerPromise=null;throw error});
 return pdfWorkerPromise;
}
function warmPdfEngine(){void preparePdfWorker().catch(()=>{});}
window.CCWarmPdfEngine=warmPdfEngine;

function releaseObjectUrl(){if(objectUrl){try{URL.revokeObjectURL(objectUrl)}catch{}objectUrl=null}}
// Only the V2 trial loads this controller. Stable V1 source stays unchanged.
let annotationBasis=null,annotationKey='',viewSerial=0,viewChanging=false,documentSession=0,viewQueue=Promise.resolve();
function pageKey(p=currentPage){return docKind==='word'?'word:document':`${docKind||'doc'}:${p}`}
function contextKey(key=annotationKey){return key?`document:${documentSession}:${key}`:'whiteboard'}
function annotationElement(){
 return docKind==='pdf'?pdfCanvas:docKind==='word'?wordPaper:docKind==='pptx'?pptViewport?.firstElementChild:docKind==='sheet'?sheetPaper:genericEl;
}
function annotationRect(){
 const el=annotationElement(),b=canvas.getBoundingClientRect();let r=el?.getBoundingClientRect();
 if(!r||!b.width||!b.height||r.width<1||r.height<1)return null;
 // Script-free HTML previews are same-origin so their own scroll offset is visible.
 if(docKind==='html'&&el.tagName==='IFRAME')try{
  const body=el.contentDocument?.body;
  if(body){const inner=body.getBoundingClientRect(),sx=r.width/el.clientWidth,sy=r.height/el.clientHeight;r={left:r.left+inner.left*sx,top:r.top+inner.top*sy,width:inner.width*sx,height:inner.height*sy}}
 }catch{}
 if(r.width<1||r.height<1)return null;
 return{x:r.left-b.left,y:r.top-b.top,w:r.width,h:r.height,bw:cssW,bh:cssH};
}
function mapAnnotation(s,from,to){
 if(!s||!from||!to)return s;
 const point=p=>{if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))return;
  p.x=(to.x+(p.x*from.bw-from.x)/from.w*to.w)/to.bw;
  p.y=(to.y+(p.y*from.bh-from.y)/from.h*to.h)/to.bh;
 };
 if(Array.isArray(s.points))s.points.forEach(point);
 if(Number.isFinite(s.x)&&Number.isFinite(s.y))point(s);
 if(Number.isFinite(s.w))s.w=s.w*from.bw/from.w*to.w/to.bw;
 if(Number.isFinite(s.h))s.h=s.h*from.bh/from.h*to.h/to.bh;
 if(Number.isFinite(s.size))s.size=s.size/from.w*to.w;
 if(Array.isArray(s.smartOriginal))s.smartOriginal.forEach(item=>mapAnnotation(item,from,to));
 return s;
}
const pageSpace={x:0,y:0,w:1,h:1,bw:1,bh:1};
function convertAnnotations(items,from,to){const out=clone(items);if(from&&to)out.forEach(s=>mapAnnotation(s,from,to));return out}
function historyTransform(from,to){if(!from||!to)return;document.dispatchEvent(new CustomEvent('whiteboard-annotation-transform',{detail:{map:items=>convertAnnotations(convertAnnotations(items,from,pageSpace),pageSpace,to)}}))}
function setAnnotationContext(key){document.dispatchEvent(new CustomEvent('whiteboard-annotation-context',{detail:{key}}))}
function resetPan(){document.dispatchEvent(new Event('whiteboard-document-view-reset'))}
function savePage(){
 if(!active||!annotationKey||!annotationBasis)return;
 pageStore.set(annotationKey,{relative:true,items:convertAnnotations(strokes,annotationBasis,pageSpace),basis:{...annotationBasis}});
}
// The persisted format stores each page relative to its actual document page,
 // rather than relative to the current canvas or its zoom level.
 // That keeps page annotations independent through page changes and reloads.
async function exportDocumentAnnotations(scope='all'){
 if(!active)throw new Error('Open a document first.');
 await viewQueue.catch(()=>{});
 if(!annotationBasis||viewChanging||annotationKey!==pageKey())throw Error('Document page is still loading.');
 finishAnnotationEdit();savePage();
 const pages={};
 const keys=scope==='page'?[pageKey()]:[...pageStore.keys()];
 for(const key of keys){
  const entry=pageStore.get(key);
  pages[key]=entry?.items?clone(entry.items):[];
 }
 return {version:1,kind:docKind,pages,page:currentPage};
}
async function clearDocumentAnnotations(scope='page'){
 if(!active)throw new Error('Open a document first.');
 await viewQueue.catch(()=>{});
 if(!annotationBasis||viewChanging||annotationKey!==pageKey())throw Error('Document page is still loading.');
 finishAnnotationEdit();savePage();
 if(scope==='all')pageStore.clear();
 else pageStore.delete(pageKey());
 strokes=[];current=null;drawing=false;
 window.WhiteboardAnnotationHistory?.set([]);
 redraw();syncUi();
 return true;
}
function importDocumentAnnotations(snapshot){
 const pages=snapshot?.pages;
 if(!pages||typeof pages!=='object'||Array.isArray(pages))return;
 for(const [key,items] of Object.entries(pages)){
  if(!/^(?:pdf|word|pptx|sheet|image|html|text|media|native):(?:\d+|document)$/.test(key))continue;
  if(!Array.isArray(items)||items.length>10000)continue;
  pageStore.set(key,{relative:true,items:clone(items)});
 }
}
window.CCDocumentAnnotations={
 isOpen:()=>active,
 ready:()=>active&&!viewChanging&&!!annotationBasis&&annotationKey===pageKey(),
 currentPage:()=>currentPage,
 pageCount:()=>totalPages,
 name:()=>docName,
 setName:name=>{docName=String(name||docName);document.title=docName+' · Classroom Companion'},
 export:exportDocumentAnnotations,
 clear:clearDocumentAnnotations
};
function loadPageAnnotations(){
 viewChanging=false;const key=pageKey(),r=annotationRect();if(!r)return;
 const saved=pageStore.get(key);setAnnotationContext(contextKey(key));
 historyTransform(saved?.basis,r);
 try{document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))}catch{}
 strokes=saved?convertAnnotations(saved.items,pageSpace,r):[];
 annotationBasis=r;annotationKey=key;current=null;drawing=false;redraw();syncUi();if(!openingDocument)hideDocumentLoading();
}
function syncAnnotationGeometry(){
 if(!active||viewChanging||!annotationBasis||annotationKey!==pageKey())return;
 const r=annotationRect();if(!r)return;
 if(['x','y','w','h','bw','bh'].every(k=>Math.abs(r[k]-annotationBasis[k])<.01))return;
 const old=annotationBasis;strokes.forEach(s=>{mapAnnotation(s,old,pageSpace);mapAnnotation(s,pageSpace,r)});if(current){mapAnnotation(current,old,pageSpace);mapAnnotation(current,pageSpace,r)}
 historyTransform(old,r);annotationBasis=r;redraw();
}
function watchAnnotations(){syncAnnotationGeometry();requestAnimationFrame(watchAnnotations)}
window.WhiteboardDocumentView={panElement:()=>active?annotationElement():null,sync:syncAnnotationGeometry};
function finishAnnotationEdit(){window.WhiteboardAnnotationHistory?.finish();window.WhiteboardMarqueeSelection?.clear();try{document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))}catch{}}
// Render one view at a time, discarding requests superseded before they start.
function changeView(change){
 if(!active)return Promise.resolve();
 cancelPdfRefinement();
 if(!viewChanging){finishAnnotationEdit();savePage()}
 viewChanging=true;canvas.style.pointerEvents='none';showDocumentLoading(true);change();updateControls();
 const serial=++viewSerial;
 viewQueue=viewQueue.catch(()=>{}).then(async()=>{
  if(serial!==viewSerial||!active)return;
  try{
   if(docKind==='pdf')await renderPdfPage();else if(docKind==='word')layoutWord(false);
   else if(docKind==='pptx'&&pptViewer){await pptViewer.goToSlide(currentPage-1);await pptViewer.setZoom(Math.round(zoom*100))}
   else if(docKind==='sheet')renderSheet();else layoutGeneric();
  }finally{if(serial===viewSerial&&active){viewChanging=false;loadPageAnnotations();setInteraction(interactionMode)}}
 });
 return viewQueue;
}

function restoreBlankBoard(){if(preDocumentStrokes!==null){strokes=clone(preDocumentStrokes);preDocumentStrokes=null;current=null;drawing=false;redraw();syncUi()}}
function resetSearch(clearText=false){
 searchRevision++;if(clearText){documentRevision++;pdfTextCache.clear();genericSearchText=''}
 pdfQuery='';pdfMatches=[];pdfMatchIndex=-1;pdfHasText=true;wordMatches=[];wordMatchIndex=-1;wordQuery='';pptMatches=[];pptMatchIndex=-1;pptQuery='';sheetQuery='';sheetMatches=[];sheetMatchIndex=-1;
 try{pptViewer?.clearSearchHighlights()}catch{}
 if(searchStatus)searchStatus.textContent='';
}
const searchCurrent=token=>active&&token===searchRevision;
const normalizedText=text=>String(text||'').replace(/\s+/g,' ').trim().toLowerCase();
function matchOffsets(text,q){const found=[];let from=0,i;while((i=text.indexOf(q,from))!==-1){found.push(i);from=i+q.length}return found}
function initialPageMatch(matches,dir,pageOf){
 if(dir>0){const i=matches.findIndex(m=>pageOf(m)>=currentPage);return i<0?0:i}
 for(let i=matches.length-1;i>=0;i--)if(pageOf(matches[i])<=currentPage)return i;
 return matches.length-1;
}

function ensureLayer(){
 if(layer)return;
 layer=document.createElement('div');layer.id='documentUnderlay';
 layer.innerHTML='<canvas id="documentPdfCanvas"></canvas><div id="documentWordViewport"><article id="documentWordPaper"></article></div><div id="documentPptViewport"></div><div id="documentSheetViewport"><div id="documentSheetPaper"></div></div><div id="documentGenericViewport"></div>';
 Object.assign(layer.style,{position:'absolute',inset:'0',zIndex:'0',display:'none',overflow:'hidden',background:'#e9edf0',pointerEvents:'none'});
 wrap.insertBefore(layer,wrap.firstChild);
 pdfCanvas=layer.querySelector('#documentPdfCanvas');wordViewport=layer.querySelector('#documentWordViewport');wordPaper=layer.querySelector('#documentWordPaper');pptViewport=layer.querySelector('#documentPptViewport');sheetViewport=layer.querySelector('#documentSheetViewport');sheetPaper=layer.querySelector('#documentSheetPaper');genericViewport=layer.querySelector('#documentGenericViewport');
 Object.assign(pdfCanvas.style,{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',display:'none',background:'#fff',boxShadow:'0 2px 12px rgba(0,0,0,.18)'});
 Object.assign(wordViewport.style,{position:'absolute',inset:'0',overflow:'hidden',display:'none',background:'#e9edf0'});
 Object.assign(wordPaper.style,{position:'absolute',left:'50%',top:'12px',width:'794px',minHeight:'1123px',transformOrigin:'top center',background:'#fff',padding:'54px 66px',boxShadow:'0 2px 12px rgba(0,0,0,.18)',font:'16px/1.45 Arial,sans-serif',color:'#111'});
 Object.assign(pptViewport.style,{position:'absolute',inset:'4px',display:'none',overflow:'hidden',background:'#dfe4e8'});
 Object.assign(sheetViewport.style,{position:'absolute',inset:'0',display:'none',overflow:'hidden',background:'#e9edf0'});
 Object.assign(sheetPaper.style,{position:'absolute',left:'50%',top:'10px',transformOrigin:'top center',background:'#fff',padding:'14px',boxShadow:'0 2px 12px rgba(0,0,0,.15)'});
 Object.assign(genericViewport.style,{position:'absolute',inset:'0',display:'none',overflow:'hidden',background:'#e9edf0'});
 canvas.style.position='relative';canvas.style.zIndex='5';
}
function hideViews(){[pdfCanvas,wordViewport,pptViewport,sheetViewport,genericViewport].forEach(el=>{if(el)el.style.display='none'})}
function smallBtn(text,title,fn){const b=document.createElement('button');b.type='button';b.textContent=text;b.title=title;b.addEventListener('click',fn);return b}

function ensureSearchPanel(){
 if(searchPanel)return;
 searchPanel=document.createElement('div');searchPanel.id='documentSearchPanel';searchPanel.style.display='none';
 searchInput=document.createElement('input');searchInput.type='search';searchInput.placeholder='Find in document';searchInput.setAttribute('aria-label','Find in document');searchInput.autocomplete='off';searchInput.spellcheck=false;
 searchStatus=document.createElement('span');searchStatus.id='documentSearchStatus';searchStatus.setAttribute('role','status');searchStatus.setAttribute('aria-live','polite');
 const up=smallBtn('↑','Previous match',()=>runSearch(-1)),down=smallBtn('↓','Next match',()=>runSearch(1)),close=smallBtn('×','Close search',hideSearch);
 searchInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();runSearch(e.shiftKey?-1:1)}else if(e.key==='Escape'){e.preventDefault();hideSearch()}});
 searchInput.addEventListener('input',()=>resetSearch());searchPanel.append(searchInput,searchStatus,up,down,close);document.body.appendChild(searchPanel);
}
function showSearch(){if(!active)return;ensureSearchPanel();searchPanel.style.display='flex';requestAnimationFrame(()=>{searchInput.focus();searchInput.select()})}
function hideSearch(){searchRevision++;if(searchStatus?.textContent.startsWith('Searching'))searchStatus.textContent='';if(searchPanel)searchPanel.style.display='none';if(searchInput)searchInput.blur()}
function toggleSearch(){if(searchPanel?.style.display==='flex')hideSearch();else showSearch()}

function ensureToolbar(){
 if(toolbar)return;
 toolbar=document.createElement('div');toolbar.id='documentQuickBar';toolbar.style.display='none';
 prevBtn=smallBtn('‹','Previous page / slide / sheet',()=>goToPage(currentPage-1));nextBtn=smallBtn('›','Next page / slide / sheet',()=>goToPage(currentPage+1));
 pageInput=document.createElement('input');pageInput.type='number';pageInput.min='1';pageInput.value='1';pageInput.title='Page / slide / sheet';pageInput.addEventListener('change',()=>goToPage(Number(pageInput.value)||1));
 pageTotal=document.createElement('span');pageTotal.textContent='/ 1';
 const zOut=smallBtn('−','Zoom out',()=>setZoom(zoom-.15)),zIn=smallBtn('+','Zoom in',()=>setZoom(zoom+.15));zoomLabel=document.createElement('span');zoomLabel.textContent='100%';
 searchBtn=smallBtn('🔎','Search document',toggleSearch);interactBtn=smallBtn('☝','Interact with displayed content',()=>setInteraction(!interactionMode));
 const reopen=smallBtn('📄','Open another file',chooseDocumentFile),close=smallBtn('×','Close document',closeDocument);
 toolbar.append(prevBtn,pageInput,pageTotal,nextBtn,zOut,zoomLabel,zIn,searchBtn,interactBtn,reopen,close);document.body.appendChild(toolbar);ensureSearchPanel();
}
function ensureOpenButton(){
 const tools=document.querySelector('.tools');if(!tools||document.getElementById('openDocumentBtn'))return;
 const b=document.createElement('button');b.id='openDocumentBtn';b.type='button';b.className='btn soft';b.textContent='📄 Open';b.title='Open PDF, Word, PowerPoint, spreadsheet, image or other displayable file';
 const ov=document.getElementById('liveOverlayBtn');if(ov)tools.insertBefore(b,ov);else{const grid=document.getElementById('gridBtn');if(grid)tools.insertBefore(b,grid);else tools.appendChild(b)}b.addEventListener('click',chooseDocumentFile);
}
function ensureFileInput(){
 if(fileInput)return;
 fileInput=document.createElement('input');fileInput.type='file';fileInput.accept='*/*';fileInput.style.display='none';
 fileInput.addEventListener('change',async()=>{
  const f=fileInput.files?.[0];
  if(f)openingDocument=true; // Set synchronously, before a focus/cancel callback can hide the message.
  fileInput.value='';
  pickerPending=false;++pickerSerial;
  if(f){setDocumentLoadingCopy(f);showDocumentLoading();await paintDocumentLoading();await openFile(f);}
  else hideDocumentLoading();
 });
 // File-input cancel is supported by current Chrome and other modern browsers.
 fileInput.addEventListener('cancel',closeFileChooserWithoutSelection);
 // Fallback for older browsers: focus is restored when the system dialog closes.
 window.addEventListener('focus',()=>setTimeout(()=>{
  if(pickerPending&&!fileInput.files?.length)closeFileChooserWithoutSelection();
 },350));
 document.body.appendChild(fileInput);
}

function setInteraction(on){interactionMode=!!on;if(interactBtn){interactBtn.classList.toggle('active',interactionMode);interactBtn.textContent=interactionMode?'✍':'☝';interactBtn.title=interactionMode?'Return to annotation mode':'Interact with displayed content'}if(layer)layer.style.pointerEvents=interactionMode?'auto':'none';canvas.style.pointerEvents=interactionMode?'none':'auto';if(active)toast(interactionMode?'Interact mode — tap the document':'Annotation mode')}
function enterMode(){ensureLayer();ensureToolbar();if(!active)preDocumentStrokes=clone(strokes);resetPan();documentSession++;viewSerial++;viewChanging=true;annotationBasis=null;annotationKey='';active=true;setAnnotationContext(contextKey('opening'));pageStore=new Map();strokes=[];current=null;drawing=false;setInteraction(false);layer.style.display='block';toolbar.style.display='flex';document.body.classList.add('document-open-mode');wrap.classList.add('document-open-active');showDocumentLoading();redraw();syncUi()}
function destroyPpt(){if(pptViewer){try{pptViewer.destroy()}catch{}pptViewer=null}if(pptViewport)pptViewport.innerHTML=''}
function exitMode(){hideDocumentLoading();window.dispatchEvent(new Event('cc-document-closed'));cancelPdfRefinement();if(pdfLoadingTask){const task=pdfLoadingTask;pdfLoadingTask=null;void task.destroy().catch(()=>{})}resetPan();active=false;viewSerial++;viewChanging=false;annotationBasis=null;annotationKey='';setAnnotationContext('whiteboard');renderToken++;hideSearch();resetSearch(true);interactionMode=false;destroyPpt();pdfDoc=null;workbook=null;sheetNames=[];releaseObjectUrl();docKind=null;docName='';pageStore.clear();if(wordPaper)wordPaper.innerHTML='';if(sheetPaper)sheetPaper.innerHTML='';if(genericViewport)genericViewport.innerHTML='';hideViews();if(layer){layer.style.display='none';layer.style.pointerEvents='none'}if(toolbar)toolbar.style.display='none';canvas.style.pointerEvents='auto';document.body.classList.remove('document-open-mode');wrap.classList.remove('document-open-active');restoreBlankBoard();updateControls()}
function closeDocument(){if(!active)return;finishAnnotationEdit();savePage();exitMode()}
const permanentExit=document.getElementById('ccPermanentExitBtn');if(permanentExit)permanentExit.addEventListener('click',closeDocument);
function updateControls(){if(!toolbar)return;pageInput.value=String(currentPage);pageInput.max=String(Math.max(1,totalPages));pageTotal.textContent=`/ ${Math.max(1,totalPages)}`;zoomLabel.textContent=`${Math.round(zoom*100)}%`;prevBtn.disabled=currentPage<=1;nextBtn.disabled=currentPage>=totalPages;searchBtn.disabled=!['pdf','word','pptx','sheet','text','html'].includes(docKind)}

function setZoom(z){return changeView(()=>{zoom=Math.max(.5,Math.min(2.5,Math.round(z*20)/20))})}
function goToPage(p){
 p=Math.max(1,Math.min(totalPages,Math.round(p)||1));if(p===currentPage){updateControls();return Promise.resolve()}
 return changeView(()=>{resetPan();currentPage=p});
}

function extOf(file){const n=(file.name||'').toLowerCase(),i=n.lastIndexOf('.');return i>=0?n.slice(i+1):''}
function isImage(file,ext){return (file.type||'').startsWith('image/')||['png','jpg','jpeg','gif','webp','svg','bmp','ico','avif'].includes(ext)}
function isHtml(file,ext){return ['html','htm'].includes(ext)||file.type==='text/html'}
function isText(file,ext){return (file.type||'').startsWith('text/')||['txt','md','markdown','json','xml','log','ini','yaml','yml','css','js','ts','py','java'].includes(ext)}
function isMedia(file,ext){return (file.type||'').startsWith('video/')||(file.type||'').startsWith('audio/')||['mp4','webm','mov','m4v','mp3','wav','ogg','m4a'].includes(ext)}
async function openFile(file,options={}){
 openingDocument=true;
 setDocumentLoadingCopy(file,!!options.recordId);
 showDocumentLoading();
 await paintDocumentLoading();
 try{
  if(active){finishAnnotationEdit();savePage();exitMode()}
  window.dispatchEvent(new CustomEvent('cc-document-opened',{detail:{file,recordId:options.recordId||null}}));
  resetSearch(true);hideSearch();releaseObjectUrl();destroyPpt();docName=file.name||'Document';enterMode();setDocumentLoadingCopy(file,!!options.recordId);importDocumentAnnotations(options.annotations);currentPage=1;totalPages=1;zoom=1;hideViews();updateControls();const ext=extOf(file);
   if(ext==='pdf'||file.type==='application/pdf'||ext==='docx'||['pptx','pptm','ppsx','potx'].includes(ext))await paintDocumentLoading();
  if(ext==='pdf'||file.type==='application/pdf'){
    // Read the local PDF and load its offline renderer concurrently.
    const timing={start:performance.now(),readMs:0,workerReadyMs:0};
    const [data,worker]=await Promise.all([
     file.arrayBuffer().then(buf=>{timing.readMs=Math.round(performance.now()-timing.start);return buf}),
     preparePdfWorker().then(w=>{timing.workerReadyMs=Math.round(performance.now()-timing.start);return w})
    ]);
    return await openPdf(data,worker,timing);
   }
  if(ext==='docx')return await openWord(await file.arrayBuffer());
  if(['pptx','pptm','ppsx','potx'].includes(ext))return await openPptx(await file.arrayBuffer());
  if(['xlsx','xls','xlsm','xlsb','ods','csv'].includes(ext))return await openSheet(await file.arrayBuffer());
  if(isImage(file,ext))return await openImage(file);
  if(isHtml(file,ext))return await openHtml(file);
  if(isText(file,ext))return await openText(file);
  if(isMedia(file,ext))return await openMedia(file);
  return await openNative(file);
 }catch(err){console.error(err);toast('Could not open this file.');openingDocument=false;exitMode()}
 finally{openingDocument=false;hideDocumentLoading()}
}

// Fast first paint: display the initial PDF page at ordinary CSS-pixel
// resolution, then refine it at device-pixel resolution while the board is
// idle. The CSS page rectangle remains identical, so annotation coordinates
// and page-edge geometry do not change when detail is added.
function cancelPdfRefinement(){
 if(pdfRefineTimer){if(typeof cancelIdleCallback==='function')cancelIdleCallback(pdfRefineTimer);else clearTimeout(pdfRefineTimer);pdfRefineTimer=0}
 if(pdfRefineTask){try{pdfRefineTask.cancel()}catch{}pdfRefineTask=null}
}
window.CCPdfOpenDiagnostics=null;
async function openPdf(data,worker,timing=null){
 docKind='pdf';pdfCanvas.style.display='block';
 if(!window.pdfjsLib)throw new Error('PDF engine unavailable');
 const t=timing||{start:performance.now(),readMs:0,workerReadyMs:0};
 const startedParsing=performance.now();
 // PDF.js transfers the bytes to its worker and detaches the ArrayBuffer;
 // record size *before* passing it to the worker.
 const heavyDocument=data.byteLength>=400000;
 pdfLoadingTask=window.pdfjsLib.getDocument({data:new Uint8Array(data),worker});
 pdfDoc=await pdfLoadingTask.promise;
 const parseMs=Math.round(performance.now()-startedParsing);
 totalPages=pdfDoc.numPages||1;currentPage=1;updateControls();
 const initial=await renderPdfPage(true,heavyDocument);
 if(!active||docKind!=='pdf')return;
 loadPageAnnotations();
 const elapsed=Math.round(performance.now()-t.start);
 const diagnostics={readMs:t.readMs,workerReadyMs:t.workerReadyMs,
  parseMs,getPageMs:initial?.getPageMs||0,renderMs:initial?.renderMs||0,
  firstVisibleMs:elapsed,preview:!!initial?.preview,quality:initial?.preview?'preview':'full'};
 window.CCPdfOpenDiagnostics=diagnostics;
 toast(`${docName} opened`);
 if(initial?.preview)schedulePdfRefinement(initial,diagnostics);
}
function schedulePdfRefinement(view,diagnostics){
 const {page,vp,token,pdfSource,docSession}=view;
 if(!page||!vp||!active)return;
 const refine=async()=>{
  pdfRefineTimer=0;
  if(!active||pdfDoc!==pdfSource||documentSession!==docSession||token!==renderToken)return;
  const ratio=Math.min(devicePixelRatio||1,2);
  const next=document.createElement('canvas');
  next.width=Math.max(1,Math.round(vp.width*ratio));
  next.height=Math.max(1,Math.round(vp.height*ratio));
  const started=performance.now();
  try{
   const task=page.render({canvasContext:next.getContext('2d'),viewport:vp,transform:[ratio,0,0,ratio,0,0]});
   pdfRefineTask=task;
   await task.promise;
   if(!active||pdfDoc!==pdfSource||documentSession!==docSession||token!==renderToken)return;
   pdfCanvas.width=next.width;pdfCanvas.height=next.height;
   // pdfCanvas.style.width and height were set at initial paint and are
   // deliberately left unchanged. Existing pen annotations stay aligned.
   pdfCanvas.getContext('2d').drawImage(next,0,0);
   diagnostics.quality='full';
   diagnostics.refineMs=Math.round(performance.now()-started);
  }catch(error){
   if(error?.name!=='RenderingCancelledException')console.warn('PDF detail refinement unavailable',error);
  }finally{if(pdfRefineTask?.promise)pdfRefineTask=null}
 };
 if(typeof requestIdleCallback==='function')pdfRefineTimer=requestIdleCallback(refine,{timeout:2200});
 else pdfRefineTimer=setTimeout(refine,450);
}
async function renderPdfPage(firstPaint=false,heavyDocument=false){
 if(!pdfDoc||!active)return;
 const token=++renderToken,pdfSource=pdfDoc,docSession=documentSession,started=performance.now();
 const page=await pdfDoc.getPage(currentPage);
 if(token!==renderToken||pdfDoc!==pdfSource)return;
 const getPageMs=Math.round(performance.now()-started);
 const base=page.getViewport({scale:1}),r=wrap.getBoundingClientRect();
 const fit=Math.min((r.width-8)/base.width,(r.height-8)/base.height);
 const vp=page.getViewport({scale:Math.max(.1,fit*zoom)});
 const actualDpr=Math.min(devicePixelRatio||1,2);
 // The quick preview matters even on 1x desktop monitors for large scanned PDFs.
 // Small PDFs retain full resolution immediately to avoid redundant work.
 const dpr=firstPaint?Math.min(actualDpr,heavyDocument?.82:1):actualDpr;
 const preview=firstPaint&&dpr<actualDpr*.98;
 const tmp=firstPaint?pdfCanvas:document.createElement('canvas');
 tmp.width=Math.max(1,Math.round(vp.width*dpr));tmp.height=Math.max(1,Math.round(vp.height*dpr));
 if(firstPaint){pdfCanvas.style.width=`${vp.width}px`;pdfCanvas.style.height=`${vp.height}px`;}
 const drawingStarted=performance.now();
 await page.render({canvasContext:tmp.getContext('2d'),viewport:vp,transform:[dpr,0,0,dpr,0,0]}).promise;
 if(token!==renderToken||pdfDoc!==pdfSource)return;
 if(!firstPaint){
  pdfCanvas.width=tmp.width;pdfCanvas.height=tmp.height;
  pdfCanvas.style.width=`${vp.width}px`;pdfCanvas.style.height=`${vp.height}px`;
  pdfCanvas.getContext('2d').drawImage(tmp,0,0);
 }
 updateControls();
 return {getPageMs,renderMs:Math.round(performance.now()-drawingStarted),
  preview,page,vp,token,pdfSource,docSession};
}

async function openWord(data){docKind='word';wordViewport.style.display='block';await loadScript(MAMMOTH_URL,'mammoth');if(!window.mammoth)throw new Error('Word engine unavailable');const result=await window.mammoth.convertToHtml({arrayBuffer:data});wordPaper.innerHTML=result.value||'<p>(Empty document)</p>';requestAnimationFrame(()=>{layoutWord(false);loadPageAnnotations();toast(`${docName} opened`)})}
function layoutWord(keep){if(docKind!=='word'||!active)return;const r=wordViewport.getBoundingClientRect(),old=currentPage;wordPaper.style.transform='translateX(-50%)';wordPaper.style.width='794px';const h=Math.max(wordPaper.scrollHeight,1123),visible=Math.max(120,r.height-12);totalPages=Math.max(1,Math.ceil((h*zoom)/visible));currentPage=Math.max(1,Math.min(totalPages,old));const offset=((currentPage-1)*visible)/zoom;wordPaper.style.transform=`translateX(-50%) scale(${zoom}) translateY(${-offset}px)`;updateControls();}

async function openPptx(data){docKind='pptx';pptViewport.style.display='block';pptViewport.innerHTML='';if(!pptModule)pptModule=await import(PPTX_ESM_URL);const {PptxViewer,RECOMMENDED_ZIP_LIMITS}=pptModule;if(!PptxViewer)throw new Error('PowerPoint engine unavailable');pptViewer=await PptxViewer.open(data,pptViewport,{renderMode:'slide',fitMode:'contain',zoomPercent:100,zipLimits:RECOMMENDED_ZIP_LIMITS,lazyMedia:true,lazySlides:true,pdfjs:false});totalPages=Math.max(1,pptViewer.slideCount||1);currentPage=1;zoom=1;updateControls();loadPageAnnotations();toast(`${docName} opened`)}

async function openSheet(data){docKind='sheet';sheetViewport.style.display='block';await loadScript(XLSX_URL,'XLSX');if(!window.XLSX)throw new Error('Spreadsheet engine unavailable');workbook=window.XLSX.read(data,{type:'array',dense:false});sheetNames=workbook.SheetNames||[];if(!sheetNames.length)sheetNames=['Sheet1'];totalPages=sheetNames.length;currentPage=1;zoom=1;renderSheet();loadPageAnnotations();toast(`${docName} opened`)}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function renderSheet(){if(docKind!=='sheet'||!workbook)return;const name=sheetNames[currentPage-1],ws=workbook.Sheets[name];sheetPaper.innerHTML=`<div class="docSheetName">${esc(name)}</div>${window.XLSX.utils.sheet_to_html(ws,{id:'documentSheetTable'})}`;const r=sheetViewport.getBoundingClientRect(),w=Math.max(1,sheetPaper.scrollWidth),base=Math.min(1,(r.width-20)/w);sheetPaper.style.transform=`translateX(-50%) scale(${base*zoom})`;updateControls()}

async function openImage(file){docKind='image';genericViewport.style.display='block';objectUrl=URL.createObjectURL(file);const img=document.createElement('img');img.src=objectUrl;img.alt=docName;img.className='documentGenericImage';genericViewport.replaceChildren(img);genericEl=img;img.onload=()=>{layoutGeneric();loadPageAnnotations()};updateControls();loadPageAnnotations();toast(`${docName} opened`)}
async function openText(file){docKind='text';genericViewport.style.display='block';const pre=document.createElement('pre');pre.className='documentGenericText';pre.textContent=await file.text();genericSearchText=normalizedText(pre.textContent);genericViewport.replaceChildren(pre);genericEl=pre;layoutGeneric();updateControls();loadPageAnnotations();toast(`${docName} opened`)}
async function openHtml(file){docKind='html';genericViewport.style.display='block';const frame=document.createElement('iframe');frame.className='documentGenericFrame';frame.setAttribute('sandbox','allow-same-origin');frame.addEventListener('load',()=>{loadPageAnnotations()});const html=await file.text(),parsed=new DOMParser().parseFromString(html,'text/html');parsed.querySelectorAll('script,style,template,noscript').forEach(el=>el.remove());genericSearchText=normalizedText(parsed.body.textContent);frame.srcdoc=html;genericViewport.replaceChildren(frame);genericEl=frame;layoutGeneric();updateControls();loadPageAnnotations();toast(`${docName} opened`)}
async function openMedia(file){docKind='media';genericViewport.style.display='block';objectUrl=URL.createObjectURL(file);const el=(file.type||'').startsWith('audio/')?document.createElement('audio'):document.createElement('video');el.controls=true;el.src=objectUrl;el.className='documentGenericMedia';genericViewport.replaceChildren(el);genericEl=el;layoutGeneric();updateControls();loadPageAnnotations();toast(`${docName} opened — use ☝ for controls`)}
async function openNative(file){docKind='native';genericViewport.style.display='block';objectUrl=URL.createObjectURL(file);const frame=document.createElement('iframe');frame.className='documentGenericFrame';frame.src=objectUrl;genericViewport.replaceChildren(frame);genericEl=frame;layoutGeneric();updateControls();loadPageAnnotations();toast('Opened with browser preview. If it stays blank, this format needs its own renderer.')}
function layoutGeneric(){if(!genericEl)return;if(['IMG','VIDEO','AUDIO'].includes(genericEl.tagName))genericEl.style.transform=`translate(-50%,-50%) scale(${zoom})`;else if(genericEl.tagName==='PRE')genericEl.style.transform=`translateX(-50%) scale(${zoom})`;else{genericEl.style.transform=`scale(${zoom})`;genericEl.style.width='100%';genericEl.style.height='100%'}}

async function pdfPageText(p,source=pdfDoc,revision=documentRevision){
 if(pdfTextCache.has(p))return pdfTextCache.get(p);
 const page=await source.getPage(p),tc=await page.getTextContent(),txt=normalizedText((tc.items||[]).map(x=>x.str||'').join(' '));
 if(source===pdfDoc&&revision===documentRevision)pdfTextCache.set(p,txt);
 return txt;
}
async function searchPdf(q,dir,token){
 if(q!==pdfQuery){
  const matches=[],source=pdfDoc,revision=documentRevision,count=totalPages;let hasText=false;
  for(let p=1;p<=count;p++){
   const text=await pdfPageText(p,source,revision);if(!searchCurrent(token))return;
   hasText||=!!text;matchOffsets(text,q).forEach(offset=>matches.push({page:p,offset}));
   searchStatus.textContent=`Searching… ${p}/${count}`;
  }
  pdfMatches=matches;pdfHasText=hasText;pdfQuery=q;pdfMatchIndex=matches.length?initialPageMatch(matches,dir,m=>m.page):-1;
  if(!matches.length){searchStatus.textContent=hasText?'0 found':'No searchable text — scanned PDF';return}
 }else if(pdfMatches.length)pdfMatchIndex=(pdfMatchIndex+dir+pdfMatches.length)%pdfMatches.length;
 if(!pdfMatches.length){searchStatus.textContent=pdfHasText?'0 found':'No searchable text — scanned PDF';return}
 if(!searchCurrent(token))return;
 const m=pdfMatches[pdfMatchIndex];searchStatus.textContent=`${pdfMatchIndex+1}/${pdfMatches.length} · Page ${m.page}`;await goToPage(m.page);
}
function collectWordMatches(q){const out=[],walker=document.createTreeWalker(wordPaper,NodeFilter.SHOW_TEXT);let node;while((node=walker.nextNode())){const raw=node.nodeValue||'',low=raw.toLowerCase();let from=0,idx;while((idx=low.indexOf(q,from))!==-1){out.push({node,start:idx,end:idx+q.length});from=idx+Math.max(1,q.length)}}return out}
function wordMatchPage(m){const range=document.createRange();range.setStart(m.node,m.start);range.setEnd(m.node,m.end);const rr=range.getBoundingClientRect(),pr=wordPaper.getBoundingClientRect(),y=Math.max(0,(rr.top-pr.top)/Math.max(.01,zoom)),visible=Math.max(120,wordViewport.clientHeight-12);return Math.max(1,Math.min(totalPages,Math.floor((y*zoom)/visible)+1))}
async function searchWord(q,dir,token){if(q!==wordQuery||!wordMatches.length){wordMatches=collectWordMatches(q);wordMatchIndex=dir>0?-1:0;wordQuery=q}if(!wordMatches.length){searchStatus.textContent='0 found';return}wordMatchIndex=(wordMatchIndex+dir+wordMatches.length)%wordMatches.length;const m=wordMatches[wordMatchIndex];searchStatus.textContent=`${wordMatchIndex+1}/${wordMatches.length}`;await goToPage(wordMatchPage(m));if(!searchCurrent(token))return;try{const r=document.createRange();r.setStart(m.node,m.start);r.setEnd(m.node,m.end);const sel=getSelection();sel.removeAllRanges();sel.addRange(r)}catch{}}
async function searchPpt(q,dir,token){if(q!==pptQuery){pptMatches=pptViewer.searchText(q)||[];pptMatchIndex=dir>0?-1:0;pptQuery=q;try{pptViewer.clearSearchHighlights()}catch{}}if(!pptMatches.length){searchStatus.textContent='0 found';return}pptMatchIndex=(pptMatchIndex+dir+pptMatches.length)%pptMatches.length;const m=pptMatches[pptMatchIndex];searchStatus.textContent=`${pptMatchIndex+1}/${pptMatches.length}`;await goToPage((m.slideIndex||0)+1);if(!searchCurrent(token))return;try{pptViewer.clearSearchHighlights();await pptViewer.highlightSearchResult(m)}catch{}}
async function searchSheet(q,dir,token){
 if(q!==sheetQuery){
  sheetMatches=[];
  for(let p=1;p<=totalPages;p++){const text=normalizedText(window.XLSX.utils.sheet_to_csv(workbook.Sheets[sheetNames[p-1]]));if(text.includes(q))sheetMatches.push(p)}
  sheetQuery=q;sheetMatchIndex=sheetMatches.length?initialPageMatch(sheetMatches,dir,p=>p):-1;
 }else if(sheetMatches.length)sheetMatchIndex=(sheetMatchIndex+dir+sheetMatches.length)%sheetMatches.length;
 if(!sheetMatches.length){searchStatus.textContent='0 found';return}
 if(!searchCurrent(token))return;
 const p=sheetMatches[sheetMatchIndex];searchStatus.textContent=`${sheetMatchIndex+1}/${sheetMatches.length} · Sheet ${p}`;await goToPage(p);
}
async function runSearch(dir){
 if(!active)return;
 const raw=(searchInput?.value||'').trim();if(!raw){resetSearch();showSearch();return}
 const q=normalizedText(raw),token=++searchRevision;searchStatus.textContent='Searching…';
 try{
  if(docKind==='pdf')await searchPdf(q,dir,token);
  else if(docKind==='word')await searchWord(q,dir,token);
  else if(docKind==='pptx')await searchPpt(raw,dir,token);
  else if(docKind==='sheet')await searchSheet(q,dir,token);
  else if(['text','html'].includes(docKind)){const n=matchOffsets(genericSearchText,q).length;searchStatus.textContent=n?`${n} found`:'0 found'}
  else searchStatus.textContent='No searchable text';
 }catch(err){if(searchCurrent(token)){console.error(err);searchStatus.textContent='Search error'}}
}

const style=document.createElement('style');style.textContent=`

#documentQuickBar{position:fixed;right:4px;top:4px;z-index:100200;display:flex;align-items:center;gap:2px;padding:2px 3px;border:1px solid rgba(23,50,77,.22);border-radius:8px;background:rgba(255,255,255,.97);box-shadow:0 3px 12px rgba(18,32,46,.18)}
#documentQuickBar button{height:26px;min-width:26px;padding:0 6px;border:1px solid #d8e1e8;border-radius:6px;background:#fff;color:#17324d;font:900 11px system-ui,sans-serif}#documentQuickBar button.active{background:#17324d;color:#fff}#documentQuickBar button:disabled{opacity:.3}
#documentQuickBar input{width:44px;height:26px;padding:1px 3px;border:1px solid #d8e1e8;border-radius:6px;text-align:center;font:900 11px system-ui,sans-serif}#documentQuickBar span{min-width:34px;text-align:center;font:900 10px system-ui,sans-serif;color:#17324d}
#documentSearchPanel{position:fixed;right:5px;top:35px;z-index:100201;align-items:center;gap:3px;padding:4px;border:1px solid #cfd9de;border-radius:9px;background:#fff;box-shadow:0 4px 16px rgba(18,32,46,.18)}#documentSearchPanel input{width:180px;min-width:0;height:28px;border:1px solid #cfd9de;border-radius:6px;padding:3px 7px;font:700 11px system-ui,sans-serif}#documentSearchPanel button{height:27px;min-width:27px;border:1px solid #d8e1e8;border-radius:6px;background:#fff;font:900 11px system-ui,sans-serif}#documentSearchPanel span{min-width:58px;max-width:180px;overflow-wrap:anywhere;text-align:center;font:800 10px system-ui,sans-serif;color:#667085}
body.document-open-mode .shell{padding:2px!important;gap:2px!important}body.document-open-mode .top{padding:2px 4px!important;border-radius:7px!important;gap:2px!important}body.document-open-mode .brand{display:none!important}body.document-open-mode .tools{width:100%!important;gap:2px!important;flex-wrap:nowrap!important;overflow-x:auto!important;scrollbar-width:none!important;padding-right:310px!important}body.document-open-mode .tools::-webkit-scrollbar{display:none!important}body.document-open-mode .btn{min-height:24px!important;height:24px!important;padding:1px 5px!important;border-radius:6px!important;font-size:10px!important;line-height:1!important;white-space:nowrap!important}body.document-open-mode #modeBadge{display:none!important}body.document-open-mode .boardWrap{border-radius:6px!important;background-image:none!important;background:#e9edf0!important}body.document-open-mode .boardWrap::after{display:none!important}
#documentWordPaper img{max-width:100%;height:auto}#documentWordPaper table{border-collapse:collapse;max-width:100%}#documentWordPaper td,#documentWordPaper th{border:1px solid #aaa;padding:4px}#documentPptViewport>*{margin:auto!important}
#documentSheetPaper table{border-collapse:collapse;background:#fff;font:13px/1.3 Arial,sans-serif}#documentSheetPaper td,#documentSheetPaper th{border:1px solid #b8c1c8;padding:4px 7px;min-width:54px;height:25px;white-space:nowrap}.docSheetName{font:900 12px system-ui,sans-serif;color:#17324d;margin:0 0 8px}
.documentGenericImage,.documentGenericMedia{position:absolute;left:50%;top:50%;max-width:96%;max-height:96%;transform-origin:center center;object-fit:contain;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,.15)}.documentGenericMedia{width:min(92%,1100px)}.documentGenericText{position:absolute;left:50%;top:10px;transform-origin:top center;min-width:min(900px,94%);max-width:94%;margin:0;padding:22px;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,.15);white-space:pre-wrap;overflow-wrap:anywhere;font:14px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace;color:#111}.documentGenericFrame{position:absolute;left:0;top:0;width:100%;height:100%;border:0;background:#fff;transform-origin:top left}
@media(max-width:800px){#documentQuickBar{right:2px;top:2px}#documentQuickBar button{padding:0 4px;min-width:24px}#documentQuickBar span{min-width:30px}#documentSearchPanel{right:3px;top:33px}#documentSearchPanel{max-width:calc(100vw - 142px);flex-wrap:wrap}#documentSearchPanel input{width:100%}body.document-open-mode .tools{padding-right:300px!important}}
`;document.head.appendChild(style);

window.addEventListener('cc-my-documents-open',e=>{if(e.detail?.file instanceof Blob)openFile(e.detail.file,e.detail)});
ensureFileInput();ensureOpenButton();ensureLayer();ensureToolbar();updateControls();
// Background preparation starts only after the board has settled, avoiding
// competition with the initial whiteboard load.
setTimeout(()=>{
 const idle=window.requestIdleCallback;
 if(typeof idle==='function')idle(()=>{if(!active)warmPdfEngine()},{timeout:10000});
 else if(!active)warmPdfEngine();
},3500);
window.addEventListener('resize',()=>{if(!active)return;changeView(()=>{}).catch(console.error)});
requestAnimationFrame(watchAnnotations);
document.addEventListener('keydown',e=>{if(!active||/INPUT|TEXTAREA/.test(document.activeElement?.tagName))return;if(e.key==='PageDown'){e.preventDefault();goToPage(currentPage+1)}else if(e.key==='PageUp'){e.preventDefault();goToPage(currentPage-1)}else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='f'){e.preventDefault();showSearch()}else if(e.key==='Escape'&&interactionMode)setInteraction(false)});
})();