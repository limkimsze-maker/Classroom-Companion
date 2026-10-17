(function(){
'use strict';
if(typeof wrap==='undefined'||typeof canvas==='undefined'||typeof redraw!=='function'||typeof syncUi!=='function')return;

const PDFJS_URL='https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
const PDFJS_WORKER='https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
const MAMMOTH_URL='https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js';

let layer=null,pdfCanvas=null,wordViewport=null,wordPaper=null,toolbar=null,fileInput=null;
let docKind=null,docName='',pdfDoc=null,currentPage=1,totalPages=1,zoom=1,renderToken=0;
let wordHtml='',wordContentHeight=0;
let pageStore=new Map(),preDocumentStrokes=null,active=false;
let pageInput=null,pageTotal=null,zoomLabel=null,prevBtn=null,nextBtn=null;
let searchBtn=null,searchPanel=null,searchInput=null,searchStatus=null;
let pdfSearchCache=new Map(),pdfSearchQuery='',pdfSearchLastPage=0;
let wordMatches=[],wordMatchIndex=-1,wordSearchQuery='';

const clone=v=>{try{return structuredClone(v)}catch{return JSON.parse(JSON.stringify(v))}};
function toast(msg){if(typeof say==='function'){try{say(msg);return}catch{}}const t=document.getElementById('toast');if(t){t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1700)}}
function loadScript(src,globalName){
 if(globalName&&window[globalName])return Promise.resolve(window[globalName]);
 return new Promise((resolve,reject)=>{
  const old=[...document.scripts].find(s=>s.src===src);
  if(old){old.addEventListener('load',()=>resolve(globalName?window[globalName]:true),{once:true});old.addEventListener('error',reject,{once:true});return}
  const s=document.createElement('script');s.src=src;s.async=true;s.onload=()=>resolve(globalName?window[globalName]:true);s.onerror=()=>reject(new Error('Could not load document engine'));document.head.appendChild(s);
 });
}
function pageKey(p=currentPage){return `${docKind||'doc'}:${p}`}
function savePage(){if(!active)return;pageStore.set(pageKey(),clone(strokes))}
function loadPageAnnotations(){
 try{document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))}catch{}
 strokes=clone(pageStore.get(pageKey())||[]);current=null;drawing=false;redraw();syncUi();
}
function restoreBlankBoard(){if(preDocumentStrokes!==null){strokes=clone(preDocumentStrokes);preDocumentStrokes=null;current=null;drawing=false;redraw();syncUi()}}
function resetSearchState(){
 pdfSearchCache.clear();pdfSearchQuery='';pdfSearchLastPage=0;wordMatches=[];wordMatchIndex=-1;wordSearchQuery='';
 if(searchStatus)searchStatus.textContent='';
}

function ensureLayer(){
 if(layer)return layer;
 layer=document.createElement('div');layer.id='documentUnderlay';
 layer.innerHTML='<canvas id="documentPdfCanvas"></canvas><div id="documentWordViewport"><article id="documentWordPaper"></article></div>';
 Object.assign(layer.style,{position:'absolute',inset:'0',zIndex:'0',display:'none',overflow:'hidden',background:'#e9edf0',pointerEvents:'none'});
 wrap.insertBefore(layer,wrap.firstChild);
 pdfCanvas=layer.querySelector('#documentPdfCanvas');wordViewport=layer.querySelector('#documentWordViewport');wordPaper=layer.querySelector('#documentWordPaper');
 Object.assign(pdfCanvas.style,{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',display:'none',background:'#fff',boxShadow:'0 2px 12px rgba(0,0,0,.18)'});
 Object.assign(wordViewport.style,{position:'absolute',inset:'0',overflow:'hidden',display:'none',background:'#e9edf0'});
 Object.assign(wordPaper.style,{position:'absolute',left:'50%',top:'12px',width:'794px',minHeight:'1123px',transformOrigin:'top center',background:'#fff',padding:'54px 66px',boxShadow:'0 2px 12px rgba(0,0,0,.18)',font:'16px/1.45 Arial,sans-serif',color:'#111'});
 canvas.style.position='relative';canvas.style.zIndex='5';
 return layer;
}

function smallBtn(text,title,fn){const b=document.createElement('button');b.type='button';b.textContent=text;b.title=title;b.addEventListener('click',fn);return b}
function ensureSearchPanel(){
 if(searchPanel)return searchPanel;
 searchPanel=document.createElement('div');searchPanel.id='documentSearchPanel';searchPanel.style.display='none';
 searchInput=document.createElement('input');searchInput.type='search';searchInput.placeholder='Find in document';searchInput.autocomplete='off';searchInput.spellcheck=false;searchInput.setAttribute('aria-label','Search document');
 searchStatus=document.createElement('span');searchStatus.id='documentSearchStatus';
 const up=smallBtn('↑','Previous match',()=>runSearch(-1));
 const down=smallBtn('↓','Next match',()=>runSearch(1));
 const close=smallBtn('×','Close search',hideSearch);
 searchInput.addEventListener('keydown',e=>{
  if(e.key==='Enter'){e.preventDefault();runSearch(e.shiftKey?-1:1)}
  else if(e.key==='Escape'){e.preventDefault();hideSearch()}
 });
 searchInput.addEventListener('input',()=>{pdfSearchQuery='';pdfSearchLastPage=0;wordMatches=[];wordMatchIndex=-1;wordSearchQuery='';searchStatus.textContent=''});
 searchPanel.append(searchInput,searchStatus,up,down,close);document.body.appendChild(searchPanel);
 return searchPanel;
}
function showSearch(){if(!active)return;ensureSearchPanel();searchPanel.style.display='flex';requestAnimationFrame(()=>{searchInput.focus();searchInput.select()})}
function hideSearch(){if(searchPanel)searchPanel.style.display='none';if(searchInput)searchInput.blur()}
function toggleSearch(){if(searchPanel?.style.display==='flex')hideSearch();else showSearch()}
async function pdfPageText(p){
 if(pdfSearchCache.has(p))return pdfSearchCache.get(p);
 if(!pdfDoc)return '';
 const page=await pdfDoc.getPage(p);const tc=await page.getTextContent();
 const text=(tc.items||[]).map(x=>x.str||'').join(' ').replace(/\s+/g,' ').toLowerCase();
 pdfSearchCache.set(p,text);return text;
}
async function searchPdf(q,dir){
 if(!pdfDoc)return;
 const startBase=(q===pdfSearchQuery&&pdfSearchLastPage)?pdfSearchLastPage:currentPage;
 for(let i=1;i<=totalPages;i++){
  const p=((startBase-1+dir*i)%totalPages+totalPages)%totalPages+1;
  searchStatus.textContent=`… ${p}/${totalPages}`;
  if((await pdfPageText(p)).includes(q)){
   pdfSearchQuery=q;pdfSearchLastPage=p;searchStatus.textContent=`Page ${p}`;await goToPage(p);return;
  }
 }
 searchStatus.textContent='0 found';toast(`No match for “${searchInput.value.trim()}”`);
}
function collectWordMatches(q){
 const matches=[],walker=document.createTreeWalker(wordPaper,NodeFilter.SHOW_TEXT);let node;
 while((node=walker.nextNode())){
  const raw=node.nodeValue||'',low=raw.toLowerCase();let from=0,idx;
  while((idx=low.indexOf(q,from))!==-1){matches.push({node,start:idx,end:idx+q.length});from=idx+Math.max(1,q.length)}
 }
 return matches;
}
function wordMatchPage(m){
 const range=document.createRange();range.setStart(m.node,m.start);range.setEnd(m.node,m.end);
 const rr=range.getBoundingClientRect(),pr=wordPaper.getBoundingClientRect();
 const localY=Math.max(0,(rr.top-pr.top)/Math.max(.01,zoom));const visible=Math.max(120,wordViewport.clientHeight-12);
 return Math.max(1,Math.min(totalPages,Math.floor((localY*zoom)/visible)+1));
}
function selectWordMatch(m){try{const r=document.createRange();r.setStart(m.node,m.start);r.setEnd(m.node,m.end);const sel=getSelection();sel.removeAllRanges();sel.addRange(r)}catch{}}
async function searchWord(q,dir){
 if(q!==wordSearchQuery||!wordMatches.length){wordMatches=collectWordMatches(q);wordMatchIndex=dir>0?-1:0;wordSearchQuery=q}
 if(!wordMatches.length){searchStatus.textContent='0 found';toast(`No match for “${searchInput.value.trim()}”`);return}
 wordMatchIndex=(wordMatchIndex+dir+wordMatches.length)%wordMatches.length;
 const m=wordMatches[wordMatchIndex],p=wordMatchPage(m);searchStatus.textContent=`${wordMatchIndex+1}/${wordMatches.length}`;
 await goToPage(p);setTimeout(()=>selectWordMatch(m),100);
}
async function runSearch(dir){
 if(!active)return;const raw=(searchInput?.value||'').trim();if(!raw){showSearch();return}
 const q=raw.toLowerCase();searchStatus.textContent='Searching…';
 try{if(docKind==='pdf')await searchPdf(q,dir);else if(docKind==='word')await searchWord(q,dir)}catch(err){console.error(err);searchStatus.textContent='Search error';toast('Search could not be completed.')}
}

function ensureToolbar(){
 if(toolbar)return toolbar;
 toolbar=document.createElement('div');toolbar.id='documentQuickBar';toolbar.style.display='none';
 prevBtn=smallBtn('‹','Previous page',()=>goToPage(currentPage-1));
 nextBtn=smallBtn('›','Next page',()=>goToPage(currentPage+1));
 pageInput=document.createElement('input');pageInput.type='number';pageInput.min='1';pageInput.value='1';pageInput.title='Page';pageInput.addEventListener('change',()=>goToPage(Number(pageInput.value)||1));
 pageTotal=document.createElement('span');pageTotal.textContent='/ 1';
 const zOut=smallBtn('−','Zoom out',()=>setZoom(zoom-.15));
 zoomLabel=document.createElement('span');zoomLabel.textContent='100%';
 const zIn=smallBtn('+','Zoom in',()=>setZoom(zoom+.15));
 searchBtn=smallBtn('🔎','Search document',toggleSearch);
 const reopen=smallBtn('📄','Open another document',()=>fileInput?.click());
 const close=smallBtn('×','Close document',closeDocument);
 toolbar.append(prevBtn,pageInput,pageTotal,nextBtn,zOut,zoomLabel,zIn,searchBtn,reopen,close);document.body.appendChild(toolbar);ensureSearchPanel();
 return toolbar;
}
function ensureOpenButton(){
 const tools=document.querySelector('.tools');if(!tools)return;
 if(document.getElementById('openDocumentBtn'))return;
 const b=document.createElement('button');b.id='openDocumentBtn';b.type='button';b.className='btn soft';b.textContent='📄 Open';b.title='Open PDF or Word document';
 const ov=document.getElementById('liveOverlayBtn');if(ov)tools.insertBefore(b,ov);else{const grid=document.getElementById('gridBtn');if(grid)tools.insertBefore(b,grid);else tools.appendChild(b)}
 b.addEventListener('click',()=>fileInput.click());
}
function ensureFileInput(){
 if(fileInput)return;
 fileInput=document.createElement('input');fileInput.type='file';fileInput.accept='.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document';fileInput.style.display='none';
 fileInput.addEventListener('change',async()=>{const f=fileInput.files?.[0];fileInput.value='';if(f)await openFile(f)});document.body.appendChild(fileInput);
}

function enterDocumentMode(){
 ensureLayer();ensureToolbar();
 if(!active)preDocumentStrokes=clone(strokes);
 active=true;pageStore=new Map();strokes=[];current=null;drawing=false;
 layer.style.display='block';toolbar.style.display='flex';document.body.classList.add('document-open-mode');wrap.classList.add('document-open-active');
 redraw();syncUi();
}
function exitDocumentMode(){
 active=false;docKind=null;pdfDoc=null;wordHtml='';pageStore.clear();renderToken++;hideSearch();resetSearchState();
 if(layer)layer.style.display='none';if(toolbar)toolbar.style.display='none';document.body.classList.remove('document-open-mode');wrap.classList.remove('document-open-active');
 restoreBlankBoard();updateControls();
}
function closeDocument(){if(!active)return;savePage();exitDocumentMode()}

function updateControls(){
 if(!toolbar)return;
 pageInput.value=String(currentPage);pageInput.max=String(Math.max(1,totalPages));pageTotal.textContent=`/ ${Math.max(1,totalPages)}`;
 zoomLabel.textContent=`${Math.round(zoom*100)}%`;prevBtn.disabled=currentPage<=1;nextBtn.disabled=currentPage>=totalPages;
}
function setZoom(z){zoom=Math.max(.55,Math.min(2.2,Math.round(z*20)/20));updateControls();if(docKind==='pdf')renderPdfPage();else if(docKind==='word')layoutWord(true)}
async function goToPage(p){
 p=Math.max(1,Math.min(totalPages,Math.round(p)||1));if(p===currentPage){updateControls();return}
 savePage();currentPage=p;updateControls();if(docKind==='pdf')await renderPdfPage();else layoutWord(false);loadPageAnnotations();
}

async function openFile(file){
 const name=(file.name||'').toLowerCase();
 if(!name.endsWith('.pdf')&&!name.endsWith('.docx')){toast('Please choose a PDF or .docx file.');return}
 try{
  resetSearchState();hideSearch();
  const data=await file.arrayBuffer();docName=file.name||'Document';enterDocumentMode();currentPage=1;totalPages=1;zoom=1;updateControls();
  if(name.endsWith('.pdf'))await openPdf(data);else await openWord(data);
 }catch(err){console.error(err);toast('Could not open this document.');exitDocumentMode()}
}
async function openPdf(data){
 docKind='pdf';pdfCanvas.style.display='block';wordViewport.style.display='none';
 await loadScript(PDFJS_URL,'pdfjsLib');if(!window.pdfjsLib)throw new Error('PDF engine unavailable');
 window.pdfjsLib.GlobalWorkerOptions.workerSrc=PDFJS_WORKER;
 pdfDoc=await window.pdfjsLib.getDocument({data:new Uint8Array(data)}).promise;totalPages=pdfDoc.numPages||1;currentPage=1;updateControls();await renderPdfPage();loadPageAnnotations();toast(`${docName} opened`)
}
async function renderPdfPage(){
 if(!pdfDoc||!active)return;const token=++renderToken;const page=await pdfDoc.getPage(currentPage);if(token!==renderToken)return;
 const base=page.getViewport({scale:1});const r=wrap.getBoundingClientRect();const fit=Math.min((r.width-8)/base.width,(r.height-8)/base.height);const vp=page.getViewport({scale:Math.max(.1,fit*zoom)});const dpr=Math.min(devicePixelRatio||1,2);
 const tmp=document.createElement('canvas');tmp.width=Math.max(1,Math.round(vp.width*dpr));tmp.height=Math.max(1,Math.round(vp.height*dpr));const c=tmp.getContext('2d');
 await page.render({canvasContext:c,viewport:vp,transform:[dpr,0,0,dpr,0,0]}).promise;if(token!==renderToken)return;
 pdfCanvas.width=tmp.width;pdfCanvas.height=tmp.height;pdfCanvas.style.width=`${vp.width}px`;pdfCanvas.style.height=`${vp.height}px`;pdfCanvas.getContext('2d').drawImage(tmp,0,0);updateControls();
}

async function openWord(data){
 docKind='word';pdfCanvas.style.display='none';wordViewport.style.display='block';
 await loadScript(MAMMOTH_URL,'mammoth');if(!window.mammoth)throw new Error('Word engine unavailable');
 const result=await window.mammoth.convertToHtml({arrayBuffer:data});wordHtml=result.value||'<p>(Empty document)</p>';wordPaper.innerHTML=wordHtml;currentPage=1;zoom=1;
 requestAnimationFrame(()=>{layoutWord(false);loadPageAnnotations();toast(`${docName} opened`)});
}
function layoutWord(keepVisualPage){
 if(docKind!=='word'||!active)return;const r=wordViewport.getBoundingClientRect();const oldPage=currentPage;
 wordPaper.style.transform='translateX(-50%)';wordPaper.style.width='794px';
 wordContentHeight=Math.max(wordPaper.scrollHeight,1123);const visible=Math.max(120,r.height-12);totalPages=Math.max(1,Math.ceil((wordContentHeight*zoom)/visible));
 currentPage=Math.max(1,Math.min(totalPages,oldPage));const offset=((currentPage-1)*visible)/zoom;
 wordPaper.style.transform=`translateX(-50%) scale(${zoom}) translateY(${-offset}px)`;updateControls();
 if(keepVisualPage)loadPageAnnotations();
}

const style=document.createElement('style');
style.textContent=`
#documentQuickBar{position:fixed;right:4px;top:4px;z-index:100200;align-items:center;gap:2px;padding:2px 3px;border:1px solid rgba(23,50,77,.22);border-radius:8px;background:rgba(255,255,255,.96);box-shadow:0 3px 12px rgba(18,32,46,.18)}
#documentQuickBar button{height:25px;min-width:25px;padding:0 5px;border:1px solid #d8e1e8;border-radius:6px;background:white;color:#17324d;font:900 11px system-ui,sans-serif}
#documentQuickBar button:disabled{opacity:.3}
#documentQuickBar input{width:44px;height:25px;padding:1px 3px;border:1px solid #d8e1e8;border-radius:6px;text-align:center;font:900 11px system-ui,sans-serif}
#documentQuickBar span{min-width:34px;text-align:center;font:900 10px system-ui,sans-serif;color:#17324d}
#documentSearchPanel{position:fixed;right:4px;top:34px;z-index:100210;align-items:center;gap:2px;padding:3px;border:1px solid rgba(23,50,77,.22);border-radius:8px;background:rgba(255,255,255,.98);box-shadow:0 3px 12px rgba(18,32,46,.18)}
#documentSearchPanel input{width:180px;height:27px;padding:2px 7px;border:1px solid #bfcbd3;border-radius:6px;font:700 11px system-ui,sans-serif;outline:none}
#documentSearchPanel input:focus{border-color:#0f766e;box-shadow:0 0 0 2px rgba(15,118,110,.12)}
#documentSearchPanel button{height:27px;min-width:27px;padding:0 5px;border:1px solid #d8e1e8;border-radius:6px;background:#fff;color:#17324d;font:900 11px system-ui,sans-serif}
#documentSearchStatus{min-width:38px;max-width:90px;text-align:center;font:900 10px system-ui,sans-serif;color:#17324d;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
body.document-open-mode .shell{padding:2px!important;gap:2px!important}
body.document-open-mode .top{padding:2px 4px!important;border-radius:7px!important;gap:2px!important}
body.document-open-mode .brand{display:none!important}
body.document-open-mode .tools{width:100%!important;gap:2px!important;flex-wrap:nowrap!important;overflow-x:auto!important;scrollbar-width:none!important;padding-right:305px!important}
body.document-open-mode .tools::-webkit-scrollbar{display:none!important}
body.document-open-mode .btn{min-height:24px!important;height:24px!important;padding:1px 5px!important;border-radius:6px!important;font-size:10px!important;line-height:1!important;white-space:nowrap!important}
body.document-open-mode #modeBadge{display:none!important}
body.document-open-mode .boardWrap{border-radius:6px!important;background-image:none!important;background:#e9edf0!important}
body.document-open-mode .boardWrap::after{display:none!important}
#documentWordPaper img{max-width:100%;height:auto}#documentWordPaper table{border-collapse:collapse;max-width:100%}#documentWordPaper td,#documentWordPaper th{border:1px solid #aaa;padding:4px}#documentWordPaper p{margin:.45em 0}#documentWordPaper h1,#documentWordPaper h2,#documentWordPaper h3{margin:.7em 0 .35em}
`;
document.head.appendChild(style);

ensureFileInput();ensureOpenButton();ensureLayer();ensureToolbar();updateControls();
window.addEventListener('resize',()=>{if(!active)return;if(docKind==='pdf')renderPdfPage();else if(docKind==='word')layoutWord(false)});
document.addEventListener('keydown',e=>{
 if(!active)return;
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='f'){e.preventDefault();showSearch();return}
 if(/INPUT|TEXTAREA/.test(document.activeElement?.tagName))return;
 if(e.key==='PageDown'){e.preventDefault();goToPage(currentPage+1)}else if(e.key==='PageUp'){e.preventDefault();goToPage(currentPage-1)}
});
})();
