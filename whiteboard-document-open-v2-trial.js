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
let pageStore=new Map(),preDocumentStrokes=null,preDocumentHistory=[],preDocumentBeautify=[];
let lastAnnotationRect=null,viewBusy=false,viewRevision=0,viewQueue=Promise.resolve();
let pdfDoc=null,pptViewer=null,pptModule=null,pptMatches=[],pptMatchIndex=-1,pptQuery='';
let workbook=null,sheetNames=[];
let objectUrl=null,genericEl=null,interactionMode=false;
let pdfTextCache=new Map(),pdfQuery='',pdfMatches=[],pdfMatchIndex=-1,pdfHasText=true;
let searchRevision=0,documentRevision=0,sheetQuery='',sheetMatches=[],sheetMatchIndex=-1,genericSearchText='';
let wordMatches=[],wordMatchIndex=-1,wordQuery='';

const clone=v=>{try{return structuredClone(v)}catch{return JSON.parse(JSON.stringify(v))}};
function toast(msg){if(typeof say==='function'){try{say(msg);return}catch{}}const t=document.getElementById('toast');if(t){t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800)}}
function loadScript(src,globalName){
 if(globalName&&window[globalName])return Promise.resolve(window[globalName]);
 return new Promise((resolve,reject)=>{
  const old=[...document.scripts].find(s=>s.src===src);
  if(old){if(globalName&&window[globalName])resolve(window[globalName]);else{old.addEventListener('load',()=>resolve(globalName?window[globalName]:true),{once:true});old.addEventListener('error',reject,{once:true})}return}
  const s=document.createElement('script');s.src=src;s.async=true;s.onload=()=>resolve(globalName?window[globalName]:true);s.onerror=()=>reject(new Error('Could not load document engine'));document.head.appendChild(s);
 });
}
function releaseObjectUrl(){if(objectUrl){try{URL.revokeObjectURL(objectUrl)}catch{}objectUrl=null}}
function pageKey(p=currentPage){return `${docKind||'doc'}:${docKind==='word'?'content':p}`}
function finishAnnotationEdit(){window.WhiteboardAnnotationHistory?.finish();window.WhiteboardMarqueeSelection?.clear();try{document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))}catch{}}
// Document-relative coordinates keep ink attached to the rendered page/slide/sheet
// when its screen position or size changes. Never mutate original stroke objects.
function annotationRect(){
 const el=docKind==='pdf'?pdfCanvas:docKind==='word'?wordPaper:docKind==='pptx'?pptViewport?.firstElementChild:docKind==='sheet'?sheetPaper:genericEl;
 let r=el?.getBoundingClientRect();const b=canvas.getBoundingClientRect();
 // Sandboxed HTML has no scripts, but permits parent geometry reads so ink
 // follows the content when the teacher scrolls in Interact mode.
 if(docKind==='html'&&r){try{const d=el.contentDocument,sc=d?.scrollingElement;if(sc){const scale=r.width/el.clientWidth;r={left:r.left-sc.scrollLeft*scale,top:r.top-sc.scrollTop*scale,width:Math.max(sc.scrollWidth,el.clientWidth)*scale,height:Math.max(sc.scrollHeight,el.clientHeight)*scale}}}catch{}}
 if(!r||!b.width||!b.height||r.width<1||r.height<1)return null;
 return{x:r.left-b.left,y:r.top-b.top,w:r.width,h:r.height,bw:b.width,bh:b.height};
}
function convertAnnotations(items,r,toPage){
 if(!r)return clone(items);
 return clone(items).map(s=>{
  const point=p=>{if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))return;
   if(toPage){p.x=(p.x*r.bw-r.x)/r.w;p.y=(p.y*r.bh-r.y)/r.h}
   else{p.x=(r.x+p.x*r.w)/r.bw;p.y=(r.y+p.y*r.h)/r.bh}
  };
  if(Array.isArray(s.points))s.points.forEach(point);
  if(Number.isFinite(s.x)&&Number.isFinite(s.y))point(s);
  // Object extents are normalised against the board; font/pen size is in pixels.
  for(const [key,board,page] of [['w',r.bw,r.w],['h',r.bh,r.h]])if(Number.isFinite(s[key]))s[key]=toPage?s[key]*board/page:s[key]*page/board;
  if(Number.isFinite(s.size))s.size=toPage?s.size/r.w:s.size*r.w;
  if(Array.isArray(s.smartOriginal))s.smartOriginal=convertAnnotations(s.smartOriginal,r,toPage);
  return s;
 });
}
function convertBeautifyHistory(items,r,toPage){return items.map(h=>({...h,before:convertAnnotations(h.before,r,toPage),after:JSON.stringify(convertAnnotations(JSON.parse(h.after),r,toPage))}))}
function savePage(){
 if(!active||viewBusy)return;
 const r=lastAnnotationRect||annotationRect();if(!r)return;
 const undo=window.WhiteboardAnnotationHistory?.get()||[];
 pageStore.set(pageKey(),{relative:true,items:convertAnnotations(strokes,r,true),undo:undo.map(items=>convertAnnotations(items,r,true)),beautify:convertBeautifyHistory(window.WhiteboardBeautifyHistory?.get()||[],r,true)});
}
function loadPageAnnotations(){
 const r=annotationRect();if(!r)return;
 const saved=pageStore.get(pageKey());
 strokes=saved?.relative?convertAnnotations(saved.items,r,false):[];
 window.WhiteboardAnnotationHistory?.set((saved?.undo||[]).map(items=>convertAnnotations(items,r,false)));
 window.WhiteboardBeautifyHistory?.set(convertBeautifyHistory(saved?.beautify||[],r,false));
 lastAnnotationRect=r;current=null;drawing=false;redraw();syncUi();
}
function restoreBlankBoard(){if(preDocumentStrokes!==null){strokes=clone(preDocumentStrokes);preDocumentStrokes=null;window.WhiteboardAnnotationHistory?.set(preDocumentHistory);window.WhiteboardBeautifyHistory?.set(preDocumentBeautify);preDocumentHistory=[];preDocumentBeautify=[];lastAnnotationRect=null;current=null;drawing=false;redraw();syncUi()}}
// Queue rendering and keep only the latest requested view. Pending PDF/slide
// renders must not overwrite a newer page's annotation set.
function changeView(change){
 if(!active)return Promise.resolve();
 if(!viewBusy){finishAnnotationEdit();savePage()}
 viewBusy=true;canvas.style.pointerEvents='none';change();updateControls();
 const token=++viewRevision;
 viewQueue=viewQueue.catch(()=>{}).then(async()=>{
  if(token!==viewRevision||!active)return;
  try{
   if(docKind==='pdf')await renderPdfPage();
   else if(docKind==='word')layoutWord(false);
   else if(docKind==='pptx'&&pptViewer){await pptViewer.goToSlide(currentPage-1);await pptViewer.setZoom(Math.round(zoom*100))}
   else if(docKind==='sheet')renderSheet();else layoutGeneric();
  }finally{if(token===viewRevision&&active){viewBusy=false;loadPageAnnotations();setInteraction(interactionMode)}}
 });
 return viewQueue;
}
function followDocumentGeometry(){
 if(active&&!viewBusy&&!drawing){
  const r=annotationRect();
  if(r&&lastAnnotationRect&&Object.keys(r).some(k=>Math.abs(r[k]-lastAnnotationRect[k])>.05)){
   finishAnnotationEdit();savePage();loadPageAnnotations();
  }else if(r&&!lastAnnotationRect)lastAnnotationRect=r;
 }
 requestAnimationFrame(followDocumentGeometry);
}
requestAnimationFrame(followDocumentGeometry);
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
 const reopen=smallBtn('📄','Open another file',()=>fileInput?.click()),close=smallBtn('×','Close document',closeDocument);
 toolbar.append(prevBtn,pageInput,pageTotal,nextBtn,zOut,zoomLabel,zIn,searchBtn,interactBtn,reopen,close);document.body.appendChild(toolbar);ensureSearchPanel();
}
function ensureOpenButton(){
 const tools=document.querySelector('.tools');if(!tools||document.getElementById('openDocumentBtn'))return;
 const b=document.createElement('button');b.id='openDocumentBtn';b.type='button';b.className='btn soft';b.textContent='📄 Open';b.title='Open PDF, Word, PowerPoint, spreadsheet, image or other displayable file';
 const ov=document.getElementById('liveOverlayBtn');if(ov)tools.insertBefore(b,ov);else{const grid=document.getElementById('gridBtn');if(grid)tools.insertBefore(b,grid);else tools.appendChild(b)}b.addEventListener('click',()=>fileInput.click());
}
function ensureFileInput(){if(fileInput)return;fileInput=document.createElement('input');fileInput.type='file';fileInput.accept='*/*';fileInput.style.display='none';fileInput.addEventListener('change',async()=>{const f=fileInput.files?.[0];fileInput.value='';if(f)await openFile(f)});document.body.appendChild(fileInput)}

function setInteraction(on){interactionMode=!!on;if(interactBtn){interactBtn.classList.toggle('active',interactionMode);interactBtn.textContent=interactionMode?'✍':'☝';interactBtn.title=interactionMode?'Return to annotation mode':'Interact with displayed content'}if(layer)layer.style.pointerEvents=interactionMode?'auto':'none';canvas.style.pointerEvents=(viewBusy||interactionMode)?'none':'auto';}
function enterMode(){ensureLayer();ensureToolbar();finishAnnotationEdit();if(!active){preDocumentStrokes=clone(strokes);preDocumentHistory=window.WhiteboardAnnotationHistory?.get()||[];preDocumentBeautify=window.WhiteboardBeautifyHistory?.get()||[]}viewRevision++;viewBusy=false;lastAnnotationRect=null;active=true;window.WhiteboardAnnotationHistory?.set([]);window.WhiteboardBeautifyHistory?.set([]);pageStore=new Map();strokes=[];current=null;drawing=false;setInteraction(false);layer.style.display='block';toolbar.style.display='flex';document.body.classList.add('document-open-mode');wrap.classList.add('document-open-active');redraw();syncUi()}
function destroyPpt(){if(pptViewer){try{pptViewer.destroy()}catch{}pptViewer=null}if(pptViewport)pptViewport.innerHTML=''}
function exitMode(){viewRevision++;viewBusy=false;lastAnnotationRect=null;active=false;renderToken++;hideSearch();resetSearch(true);interactionMode=false;destroyPpt();pdfDoc=null;workbook=null;sheetNames=[];releaseObjectUrl();docKind=null;docName='';pageStore.clear();if(wordPaper)wordPaper.innerHTML='';if(sheetPaper)sheetPaper.innerHTML='';if(genericViewport)genericViewport.innerHTML='';hideViews();if(layer){layer.style.display='none';layer.style.pointerEvents='none'}if(toolbar)toolbar.style.display='none';canvas.style.pointerEvents='auto';document.body.classList.remove('document-open-mode');wrap.classList.remove('document-open-active');restoreBlankBoard();updateControls()}
function closeDocument(){if(!active)return;finishAnnotationEdit();savePage();exitMode()}
function updateControls(){if(!toolbar)return;pageInput.value=String(currentPage);pageInput.max=String(Math.max(1,totalPages));pageTotal.textContent=`/ ${Math.max(1,totalPages)}`;zoomLabel.textContent=`${Math.round(zoom*100)}%`;prevBtn.disabled=currentPage<=1;nextBtn.disabled=currentPage>=totalPages;searchBtn.disabled=!['pdf','word','pptx','sheet','text','html'].includes(docKind)}

function setZoom(z){return changeView(()=>{zoom=Math.max(.5,Math.min(2.5,Math.round(z*20)/20))})}
function goToPage(p){p=Math.max(1,Math.min(totalPages,Math.round(p)||1));if(p===currentPage){updateControls();return viewQueue}return changeView(()=>{currentPage=p})}

function extOf(file){const n=(file.name||'').toLowerCase(),i=n.lastIndexOf('.');return i>=0?n.slice(i+1):''}
function isImage(file,ext){return (file.type||'').startsWith('image/')||['png','jpg','jpeg','gif','webp','svg','bmp','ico','avif'].includes(ext)}
function isHtml(file,ext){return ['html','htm'].includes(ext)||file.type==='text/html'}
function isText(file,ext){return (file.type||'').startsWith('text/')||['txt','md','markdown','json','xml','log','ini','yaml','yml','css','js','ts','py','java'].includes(ext)}
function isMedia(file,ext){return (file.type||'').startsWith('video/')||(file.type||'').startsWith('audio/')||['mp4','webm','mov','m4v','mp3','wav','ogg','m4a'].includes(ext)}
async function openFile(file){
 try{
  resetSearch(true);hideSearch();releaseObjectUrl();destroyPpt();docName=file.name||'Document';enterMode();currentPage=1;totalPages=1;zoom=1;hideViews();updateControls();const ext=extOf(file);
  if(ext==='pdf'||file.type==='application/pdf')return await openPdf(await file.arrayBuffer());
  if(ext==='docx')return await openWord(await file.arrayBuffer());
  if(['pptx','pptm','ppsx','potx'].includes(ext))return await openPptx(await file.arrayBuffer());
  if(['xlsx','xls','xlsm','xlsb','ods','csv'].includes(ext))return await openSheet(await file.arrayBuffer());
  if(isImage(file,ext))return await openImage(file);
  if(isHtml(file,ext))return await openHtml(file);
  if(isText(file,ext))return await openText(file);
  if(isMedia(file,ext))return await openMedia(file);
  return await openNative(file);
 }catch(err){console.error(err);toast('Could not open this file.');exitMode()}
}

async function openPdf(data){docKind='pdf';pdfCanvas.style.display='block';await loadScript(PDFJS_URL,'pdfjsLib');if(!window.pdfjsLib)throw new Error('PDF engine unavailable');window.pdfjsLib.GlobalWorkerOptions.workerSrc=PDFJS_WORKER;pdfDoc=await window.pdfjsLib.getDocument({data:new Uint8Array(data)}).promise;totalPages=pdfDoc.numPages||1;currentPage=1;updateControls();await renderPdfPage();loadPageAnnotations();toast(`${docName} opened`)}
async function renderPdfPage(){if(!pdfDoc||!active)return;const token=++renderToken,page=await pdfDoc.getPage(currentPage);if(token!==renderToken)return;const base=page.getViewport({scale:1}),r=wrap.getBoundingClientRect(),fit=Math.min((r.width-8)/base.width,(r.height-8)/base.height),vp=page.getViewport({scale:Math.max(.1,fit*zoom)}),dpr=Math.min(devicePixelRatio||1,2),tmp=document.createElement('canvas');tmp.width=Math.max(1,Math.round(vp.width*dpr));tmp.height=Math.max(1,Math.round(vp.height*dpr));await page.render({canvasContext:tmp.getContext('2d'),viewport:vp,transform:[dpr,0,0,dpr,0,0]}).promise;if(token!==renderToken)return;pdfCanvas.width=tmp.width;pdfCanvas.height=tmp.height;pdfCanvas.style.width=`${vp.width}px`;pdfCanvas.style.height=`${vp.height}px`;pdfCanvas.getContext('2d').drawImage(tmp,0,0);updateControls()}

async function openWord(data){docKind='word';wordViewport.style.display='block';await loadScript(MAMMOTH_URL,'mammoth');if(!window.mammoth)throw new Error('Word engine unavailable');const result=await window.mammoth.convertToHtml({arrayBuffer:data});wordPaper.innerHTML=result.value||'<p>(Empty document)</p>';requestAnimationFrame(()=>{layoutWord(false);loadPageAnnotations();toast(`${docName} opened`)})}
function layoutWord(keep){if(docKind!=='word'||!active)return;const r=wordViewport.getBoundingClientRect(),old=currentPage;wordPaper.style.transform='translateX(-50%)';wordPaper.style.width='794px';const h=Math.max(wordPaper.scrollHeight,1123),visible=Math.max(120,r.height-12);totalPages=Math.max(1,Math.ceil((h*zoom)/visible));currentPage=Math.max(1,Math.min(totalPages,old));const offset=((currentPage-1)*visible)/zoom;wordPaper.style.transform=`translateX(-50%) scale(${zoom}) translateY(${-offset}px)`;updateControls();if(keep)loadPageAnnotations()}

async function openPptx(data){docKind='pptx';pptViewport.style.display='block';pptViewport.innerHTML='';if(!pptModule)pptModule=await import(PPTX_ESM_URL);const {PptxViewer,RECOMMENDED_ZIP_LIMITS}=pptModule;if(!PptxViewer)throw new Error('PowerPoint engine unavailable');pptViewer=await PptxViewer.open(data,pptViewport,{renderMode:'slide',fitMode:'contain',zoomPercent:100,zipLimits:RECOMMENDED_ZIP_LIMITS,lazyMedia:true,lazySlides:true,pdfjs:false});totalPages=Math.max(1,pptViewer.slideCount||1);currentPage=1;zoom=1;updateControls();loadPageAnnotations();toast(`${docName} opened`)}

async function openSheet(data){docKind='sheet';sheetViewport.style.display='block';await loadScript(XLSX_URL,'XLSX');if(!window.XLSX)throw new Error('Spreadsheet engine unavailable');workbook=window.XLSX.read(data,{type:'array',dense:false});sheetNames=workbook.SheetNames||[];if(!sheetNames.length)sheetNames=['Sheet1'];totalPages=sheetNames.length;currentPage=1;zoom=1;renderSheet();loadPageAnnotations();toast(`${docName} opened`)}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function renderSheet(){if(docKind!=='sheet'||!workbook)return;const name=sheetNames[currentPage-1],ws=workbook.Sheets[name];sheetPaper.innerHTML=`<div class="docSheetName">${esc(name)}</div>${window.XLSX.utils.sheet_to_html(ws,{id:'documentSheetTable'})}`;const r=sheetViewport.getBoundingClientRect(),w=Math.max(1,sheetPaper.scrollWidth),base=Math.min(1,(r.width-20)/w);sheetPaper.style.transform=`translateX(-50%) scale(${base*zoom})`;updateControls()}

async function openImage(file){docKind='image';genericViewport.style.display='block';objectUrl=URL.createObjectURL(file);const img=document.createElement('img');img.src=objectUrl;img.alt=docName;img.className='documentGenericImage';genericViewport.replaceChildren(img);genericEl=img;img.onload=()=>{layoutGeneric();lastAnnotationRect=annotationRect()};updateControls();loadPageAnnotations();toast(`${docName} opened`)}
async function openText(file){docKind='text';genericViewport.style.display='block';const pre=document.createElement('pre');pre.className='documentGenericText';pre.textContent=await file.text();genericSearchText=normalizedText(pre.textContent);genericViewport.replaceChildren(pre);genericEl=pre;layoutGeneric();updateControls();loadPageAnnotations();toast(`${docName} opened`)}
async function openHtml(file){docKind='html';genericViewport.style.display='block';const frame=document.createElement('iframe');frame.className='documentGenericFrame';frame.setAttribute('sandbox','allow-same-origin');const html=await file.text(),parsed=new DOMParser().parseFromString(html,'text/html');parsed.querySelectorAll('script,style,template,noscript').forEach(el=>el.remove());genericSearchText=normalizedText(parsed.body.textContent);frame.srcdoc=html;frame.onload=()=>{if(genericEl===frame){lastAnnotationRect=annotationRect()}};genericViewport.replaceChildren(frame);genericEl=frame;layoutGeneric();updateControls();loadPageAnnotations();toast(`${docName} opened`)}
async function openMedia(file){docKind='media';genericViewport.style.display='block';objectUrl=URL.createObjectURL(file);const el=(file.type||'').startsWith('audio/')?document.createElement('audio'):document.createElement('video');el.controls=true;el.src=objectUrl;el.className='documentGenericMedia';genericViewport.replaceChildren(el);genericEl=el;layoutGeneric();updateControls();loadPageAnnotations();toast(`${docName} opened — use ☝ for controls`)}
async function openNative(file){docKind='native';genericViewport.style.display='block';objectUrl=URL.createObjectURL(file);const frame=document.createElement('iframe');frame.className='documentGenericFrame';frame.src=objectUrl;genericViewport.replaceChildren(frame);genericEl=frame;layoutGeneric();updateControls();loadPageAnnotations();toast('Opened with browser preview. If it stays blank, this format needs its own renderer.')}
function layoutGeneric(){if(!genericEl)return;if(['IMG','VIDEO','AUDIO'].includes(genericEl.tagName))genericEl.style.transform=`translate(-50%,-50%) scale(${zoom})`;else if(genericEl.tagName==='PRE')genericEl.style.transform=`translateX(-50%) scale(${zoom})`;else{genericEl.style.transform=`scale(${zoom})`;genericEl.style.width=`${100/zoom}%`;genericEl.style.height=`${100/zoom}%`}}

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

ensureFileInput();ensureOpenButton();ensureLayer();ensureToolbar();updateControls();
new ResizeObserver(()=>{if(active)changeView(()=>{})}).observe(wrap);
document.addEventListener('keydown',e=>{if(!active||/INPUT|TEXTAREA/.test(document.activeElement?.tagName))return;if(e.key==='PageDown'){e.preventDefault();goToPage(currentPage+1)}else if(e.key==='PageUp'){e.preventDefault();goToPage(currentPage-1)}else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='f'){e.preventDefault();showSearch()}else if(e.key==='Escape'&&interactionMode)setInteraction(false)});
})();