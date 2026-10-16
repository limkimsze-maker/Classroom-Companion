(function(){
'use strict';
if(typeof wrap==='undefined'||typeof canvas==='undefined')return;

const PDFJS_URL='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const MAMMOTH_URL='https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js';

let fileInput=null,openBtn=null,layer=null,controls=null,statusText=null,pageInput=null,pageTotal=null;
let prevBtn=null,nextBtn=null,fitBtn=null,closeBtn=null;
let kind=null,pdfDoc=null,pdfCanvas=null,pdfStage=null,pdfPage=1,pdfFit='page',pdfRenderTask=null;
let wordScroller=null,wordSurface=null,wordPage=1,wordPages=1;
let documentActive=false,savedBoard=null,annotationPages=new Map(),currentKey='';
let loading=false,resizeTimer=null;

function clone(v){try{return structuredClone(v)}catch{return JSON.parse(JSON.stringify(v||[]))}}
function sayDoc(msg){if(typeof say==='function'){try{say(msg);return}catch{}}const t=document.getElementById('toast');if(t){t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1700)}}
function loadScript(src,test){if(test())return Promise.resolve();return new Promise((resolve,reject)=>{const old=[...document.scripts].find(s=>s.src===src);if(old){old.addEventListener('load',resolve,{once:true});old.addEventListener('error',reject,{once:true});return}const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error('Could not load '+src));document.head.appendChild(s)})}
function currentPageKey(){return kind==='pdf'?'pdf:'+pdfPage:kind==='docx'?'docx:'+wordPage:''}
function saveAnnotations(){if(!documentActive||!currentKey)return;annotationPages.set(currentKey,clone(strokes));}
function loadAnnotations(key){currentKey=key;strokes=clone(annotationPages.get(key)||[]);current=null;try{redraw();syncUi()}catch{}}
function enterDocumentBoard(){savedBoard=clone(strokes);annotationPages=new Map();strokes=[];current=null;currentKey='';try{redraw();syncUi()}catch{}documentActive=true;document.body.classList.add('document-mode');wrap.classList.add('document-open');wrap.classList.remove('grid');}
function restoreBoard(){strokes=clone(savedBoard||[]);current=null;savedBoard=null;try{redraw();syncUi()}catch{}document.body.classList.remove('document-mode');wrap.classList.remove('document-open');if(typeof grid!=='undefined'&&grid)wrap.classList.add('grid');}

function ensureOpenButton(){
 const tools=document.querySelector('.tools');if(!tools)return null;
 openBtn=document.getElementById('openDocumentBtn');
 if(openBtn)return openBtn;
 openBtn=document.createElement('button');openBtn.id='openDocumentBtn';openBtn.type='button';openBtn.className='btn soft';openBtn.textContent='📄 Open';openBtn.title='Open a PDF or Word document locally';
 const anchor=document.getElementById('gridBtn');if(anchor)tools.insertBefore(openBtn,anchor);else tools.appendChild(openBtn);
 openBtn.addEventListener('click',()=>{ensureFileInput().click()});
 return openBtn;
}
function ensureFileInput(){
 if(fileInput)return fileInput;
 fileInput=document.createElement('input');fileInput.type='file';fileInput.accept='.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document';fileInput.hidden=true;
 fileInput.addEventListener('change',async()=>{const f=fileInput.files?.[0];fileInput.value='';if(f)await openFile(f)});
 document.body.appendChild(fileInput);return fileInput;
}
function ensureLayer(){
 if(layer)return layer;
 layer=document.createElement('div');layer.id='documentUnderlay';
 Object.assign(layer.style,{position:'absolute',inset:'0',zIndex:'1',display:'none',overflow:'hidden',background:'#dfe5e9',pointerEvents:'none'});
 wrap.insertBefore(layer,canvas);
 canvas.style.position='relative';canvas.style.zIndex='3';
 const badge=document.getElementById('modeBadge');if(badge){badge.style.zIndex='4'}
 return layer;
}
function tiny(text,title){const b=document.createElement('button');b.type='button';b.textContent=text;b.title=title;Object.assign(b.style,{height:'26px',minHeight:'26px',padding:'0 7px',border:'1px solid #cfd9de',borderRadius:'7px',background:'#fff',color:'#17324d',font:'900 11px system-ui,sans-serif',cursor:'pointer',whiteSpace:'nowrap'});return b}
function ensureControls(){
 if(controls)return controls;
 controls=document.createElement('div');controls.id='documentControls';
 Object.assign(controls.style,{position:'fixed',left:'50%',top:'4px',transform:'translateX(-50%)',zIndex:'1000002',display:'none',alignItems:'center',gap:'3px',padding:'3px',border:'1px solid rgba(23,50,77,.18)',borderRadius:'9px',background:'rgba(255,255,255,.97)',boxShadow:'0 3px 14px rgba(18,32,46,.16)',maxWidth:'calc(100vw - 8px)',overflowX:'auto'});
 prevBtn=tiny('‹','Previous page');nextBtn=tiny('›','Next page');fitBtn=tiny('▣','Fit page');closeBtn=tiny('×','Close document');
 statusText=document.createElement('span');statusText.style.cssText='font:900 10px system-ui,sans-serif;color:#17324d;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:0 3px';
 pageInput=document.createElement('input');pageInput.type='number';pageInput.min='1';pageInput.value='1';pageInput.title='Jump to page';pageInput.style.cssText='width:48px;height:26px;border:1px solid #cfd9de;border-radius:7px;text-align:center;font:900 11px system-ui,sans-serif;padding:0 2px';
 pageTotal=document.createElement('span');pageTotal.style.cssText='font:900 10px system-ui,sans-serif;color:#667085;white-space:nowrap';
 prevBtn.onclick=()=>goRelative(-1);nextBtn.onclick=()=>goRelative(1);fitBtn.onclick=toggleFit;closeBtn.onclick=()=>closeDocument(true);
 pageInput.addEventListener('change',()=>jumpTo(Number(pageInput.value)));
 pageInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();pageInput.blur();jumpTo(Number(pageInput.value))}});
 controls.append(statusText,prevBtn,pageInput,pageTotal,nextBtn,fitBtn,closeBtn);document.body.appendChild(controls);return controls;
}
function updateControls(){
 ensureControls();
 if(!documentActive){controls.style.display='none';return}
 controls.style.display='flex';
 const p=kind==='pdf'?pdfPage:wordPage,total=kind==='pdf'?(pdfDoc?.numPages||1):wordPages;
 pageInput.value=String(p);pageInput.max=String(total);pageTotal.textContent='/ '+total;
 prevBtn.disabled=p<=1;nextBtn.disabled=p>=total;
 fitBtn.style.display=kind==='pdf'?'inline-block':'none';fitBtn.textContent=pdfFit==='page'?'▣':'↔';fitBtn.title=pdfFit==='page'?'Switch to fit width':'Switch to fit page';
}
async function openFile(file){
 if(loading)return;loading=true;ensureLayer();ensureControls();
 try{
  if(documentActive)closeDocument(false);
  enterDocumentBoard();layer.style.display='block';controls.style.display='flex';statusText.textContent='Opening…';
  const lower=file.name.toLowerCase();
  if(lower.endsWith('.pdf')||file.type==='application/pdf')await openPdf(file);
  else if(lower.endsWith('.docx')||file.type.includes('wordprocessingml'))await openDocx(file);
  else throw new Error('Please choose a PDF or .docx file.');
  statusText.textContent=file.name;updateControls();sayDoc('Document ready — use your whiteboard tools on top.');
 }catch(err){console.error(err);sayDoc(err?.message||'Could not open document');closeDocument(false)}
 finally{loading=false}
}
function clearLayer(){if(pdfRenderTask){try{pdfRenderTask.cancel()}catch{}pdfRenderTask=null}if(layer)layer.innerHTML='';pdfDoc=null;pdfCanvas=null;pdfStage=null;wordScroller=null;wordSurface=null;kind=null;}
function closeDocument(showToast){
 if(!documentActive)return;
 saveAnnotations();clearLayer();layer.style.display='none';controls.style.display='none';documentActive=false;currentKey='';annotationPages.clear();restoreBoard();if(showToast)sayDoc('Document closed');
}

async function openPdf(file){
 kind='pdf';pdfPage=1;pdfFit='page';
 await loadScript(PDFJS_URL,()=>!!window.pdfjsLib);window.pdfjsLib.GlobalWorkerOptions.workerSrc=PDFJS_WORKER;
 const buffer=await file.arrayBuffer();pdfDoc=await window.pdfjsLib.getDocument({data:new Uint8Array(buffer)}).promise;
 pdfStage=document.createElement('div');pdfStage.style.cssText='position:absolute;inset:0;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#dfe5e9';
 pdfCanvas=document.createElement('canvas');pdfCanvas.style.cssText='display:block;background:#fff;box-shadow:0 2px 16px rgba(0,0,0,.18);max-width:none;max-height:none';pdfStage.appendChild(pdfCanvas);layer.appendChild(pdfStage);
 await renderPdfPage();loadAnnotations(currentPageKey());
}
async function renderPdfPage(){
 if(!pdfDoc||!pdfCanvas)return;
 if(pdfRenderTask){try{pdfRenderTask.cancel()}catch{}pdfRenderTask=null}
 const page=await pdfDoc.getPage(pdfPage);const base=page.getViewport({scale:1});const r=wrap.getBoundingClientRect();
 const margin=10;const fitPage=Math.min((r.width-margin*2)/base.width,(r.height-margin*2)/base.height);const fitWidth=(r.width-margin*2)/base.width;
 const cssScale=pdfFit==='width'?fitWidth:fitPage;const dpr=Math.min(window.devicePixelRatio||1,2);const viewport=page.getViewport({scale:cssScale*dpr});
 pdfCanvas.width=Math.max(1,Math.floor(viewport.width));pdfCanvas.height=Math.max(1,Math.floor(viewport.height));pdfCanvas.style.width=(viewport.width/dpr)+'px';pdfCanvas.style.height=(viewport.height/dpr)+'px';
 pdfStage.style.alignItems=pdfFit==='width'?'flex-start':'center';pdfStage.style.justifyContent='center';pdfStage.style.paddingTop=pdfFit==='width'?'5px':'0';
 pdfRenderTask=page.render({canvasContext:pdfCanvas.getContext('2d'),viewport});try{await pdfRenderTask.promise}catch(e){if(e?.name!=='RenderingCancelledException')throw e}finally{pdfRenderTask=null}
}
async function jumpPdf(p){
 if(!pdfDoc)return;p=Math.max(1,Math.min(pdfDoc.numPages,Math.round(p)||1));if(p===pdfPage){updateControls();return}
 saveAnnotations();pdfPage=p;await renderPdfPage();loadAnnotations(currentPageKey());updateControls();
}

async function openDocx(file){
 kind='docx';wordPage=1;wordPages=1;
 await loadScript(MAMMOTH_URL,()=>!!window.mammoth);
 const buffer=await file.arrayBuffer();const result=await window.mammoth.convertToHtml({arrayBuffer:buffer});
 wordScroller=document.createElement('div');wordScroller.style.cssText='position:absolute;inset:0;overflow:hidden;background:#dfe5e9;pointer-events:none';
 wordSurface=document.createElement('article');wordSurface.className='docxLocalSurface';wordSurface.innerHTML=result.value;
 wordScroller.appendChild(wordSurface);layer.appendChild(wordScroller);
 await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));recountWordPages();showWordPage(1,false);loadAnnotations(currentPageKey());
}
function recountWordPages(){if(!wordScroller)return;const h=Math.max(1,wordScroller.clientHeight);wordPages=Math.max(1,Math.ceil(wordScroller.scrollHeight/h));wordPage=Math.min(wordPage,wordPages)}
function showWordPage(p,save=true){
 if(!wordScroller)return;if(save)saveAnnotations();recountWordPages();wordPage=Math.max(1,Math.min(wordPages,Math.round(p)||1));wordScroller.scrollTop=(wordPage-1)*wordScroller.clientHeight;loadAnnotations(currentPageKey());updateControls();
}
async function jumpTo(p){if(kind==='pdf')await jumpPdf(p);else if(kind==='docx')showWordPage(p)}
async function goRelative(delta){const p=(kind==='pdf'?pdfPage:wordPage)+delta;await jumpTo(p)}
async function toggleFit(){if(kind!=='pdf')return;saveAnnotations();pdfFit=pdfFit==='page'?'width':'page';await renderPdfPage();loadAnnotations(currentPageKey());updateControls()}

const style=document.createElement('style');style.textContent=`
#boardWrap.document-open{background-image:none!important;background-color:#dfe5e9!important}
#boardWrap.document-open::after{opacity:.16}
body.document-mode .shell{padding:2px!important;gap:2px!important}
body.document-mode .top{padding:2px 4px!important;border-radius:7px!important;gap:2px!important}
body.document-mode .brand{display:none!important}
body.document-mode .tools{width:100%!important;gap:2px!important;flex-wrap:nowrap!important;overflow-x:auto!important;scrollbar-width:none!important;padding-right:220px!important}
body.document-mode .tools::-webkit-scrollbar{display:none!important}
body.document-mode .btn{min-height:24px!important;height:24px!important;padding:1px 5px!important;border-radius:6px!important;font-size:10px!important;line-height:1!important;white-space:nowrap!important}
body.document-mode .btn:disabled{opacity:.35!important}
body.document-mode #modeBadge{display:none!important}
body.document-mode .boardWrap{border-radius:6px!important}
.docxLocalSurface{box-sizing:border-box;width:min(794px,calc(100% - 20px));min-height:100%;margin:8px auto 24px;background:#fff;padding:54px 64px;color:#111;font:16px/1.5 Arial,sans-serif;box-shadow:0 2px 16px rgba(0,0,0,.16)}
.docxLocalSurface img{max-width:100%;height:auto}.docxLocalSurface table{border-collapse:collapse;max-width:100%}.docxLocalSurface td,.docxLocalSurface th{border:1px solid #999;padding:4px}.docxLocalSurface p{margin:.55em 0}
@media(max-width:800px){.docxLocalSurface{padding:28px 24px;width:calc(100% - 10px);margin:5px auto 15px}body.document-mode .tools{padding-right:165px!important}#documentControls{left:auto!important;right:4px!important;transform:none!important}}
`;
document.head.appendChild(style);

ensureOpenButton();ensureFileInput();ensureLayer();ensureControls();
window.addEventListener('resize',()=>{if(!documentActive)return;clearTimeout(resizeTimer);resizeTimer=setTimeout(async()=>{if(kind==='pdf'){await renderPdfPage();loadAnnotations(currentPageKey())}else if(kind==='docx'){recountWordPages();showWordPage(wordPage,false)}updateControls()},120)});
window.addEventListener('beforeunload',()=>{try{pdfDoc?.destroy?.()}catch{}});
window.__openTeachingDocument=()=>ensureFileInput().click();
})();
