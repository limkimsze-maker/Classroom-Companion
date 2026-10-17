(function(){
'use strict';
if(typeof wrap==='undefined'||typeof canvas==='undefined'||typeof redraw!=='function'||typeof syncUi!=='function')return;

let layer,pdfFrame,imageView,textView,toolbar,fileInput,pageInput,pageLabel,prevBtn,nextBtn,interactBtn,statusChip;
let active=false,kind='',docName='',objectUrl=null,page=1,interaction=false,pageStore=new Map(),preDocumentStrokes=null;
const clone=v=>{try{return structuredClone(v)}catch{return JSON.parse(JSON.stringify(v))}};
const toast=msg=>{if(typeof say==='function'){try{say(msg);return}catch{}}const t=document.getElementById('toast');if(t){t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800)}};

function addStyles(){
 if(document.getElementById('moeDocumentStyles'))return;
 const s=document.createElement('style');s.id='moeDocumentStyles';s.textContent=`
#documentUnderlay{position:absolute;inset:0;z-index:0;display:none;overflow:hidden;background:#e8edf0}
#documentLocalPdf,#documentLocalImage,#documentLocalText{position:absolute;inset:0;width:100%;height:100%;border:0;background:#fff}
#documentLocalPdf{pointer-events:none}
#documentLocalImage{object-fit:contain;pointer-events:none}
#documentLocalText{overflow:auto;margin:0;padding:32px;white-space:pre-wrap;font:16px/1.5 Arial,sans-serif;color:#172b4d;pointer-events:none}
#documentQuickBar{position:fixed;right:10px;z-index:700;display:none;flex-direction:column;gap:6px;padding:7px;background:rgba(255,255,255,.97);border:1px solid #cfd9de;border-radius:13px;box-shadow:0 8px 24px rgba(18,32,46,.16)}
#documentQuickBar button,#documentQuickBar input{min-height:32px;border:1px solid #d8e1e8;border-radius:8px;background:#fff;color:#17324d;font-weight:800;font-size:12px}
#documentQuickBar button{padding:5px 8px}
#documentQuickBar button.active{background:#0f766e;color:#fff;border-color:#0f766e}
#documentQuickBar .moeSafeChip{padding:5px 7px;border-radius:8px;background:#e7f7f4;color:#0a5d57;font-size:10px;font-weight:950;text-align:center;max-width:142px}
#documentQuickBar .pageRow{display:flex;gap:4px;align-items:center}
#documentQuickBar .pageRow input{width:58px;text-align:center;padding:4px}
#documentQuickBar .pageRow span{font-size:10px;font-weight:900;color:#667085}
`;
 document.head.appendChild(s)
}
function ensureLayer(){
 if(layer)return;addStyles();
 layer=document.createElement('div');layer.id='documentUnderlay';
 pdfFrame=document.createElement('iframe');pdfFrame.id='documentLocalPdf';pdfFrame.title='Local PDF';pdfFrame.referrerPolicy='no-referrer';
 imageView=document.createElement('img');imageView.id='documentLocalImage';imageView.alt='Local document image';
 textView=document.createElement('pre');textView.id='documentLocalText';
 layer.append(pdfFrame,imageView,textView);wrap.insertBefore(layer,wrap.firstChild);
 canvas.style.position='relative';canvas.style.zIndex='5';hideViews()
}
function hideViews(){if(pdfFrame)pdfFrame.style.display='none';if(imageView)imageView.style.display='none';if(textView)textView.style.display='none'}
function smallBtn(text,title,fn){const b=document.createElement('button');b.type='button';b.textContent=text;b.title=title;b.addEventListener('click',fn);return b}
function ensureToolbar(){
 if(toolbar)return;addStyles();
 toolbar=document.createElement('div');toolbar.id='documentQuickBar';
 statusChip=document.createElement('div');statusChip.className='moeSafeChip';statusChip.textContent='🔒 Local only · network blocked';statusChip.title='Document stays in this browser session. Outbound app network APIs are disabled.';
 const row=document.createElement('div');row.className='pageRow';
 prevBtn=smallBtn('‹','Previous PDF page',()=>goPage(page-1));nextBtn=smallBtn('›','Next PDF page',()=>goPage(page+1));
 pageInput=document.createElement('input');pageInput.type='number';pageInput.min='1';pageInput.value='1';pageInput.title='PDF page number';pageInput.addEventListener('change',()=>goPage(Number(pageInput.value)||1));
 pageLabel=document.createElement('span');pageLabel.textContent='Page';row.append(prevBtn,pageInput,pageLabel,nextBtn);
 interactBtn=smallBtn('☝ Interact','Interact with the local PDF viewer',()=>setInteraction(!interaction));
 const replace=smallBtn('↻','Open another local file',()=>fileInput?.click());
 const close=smallBtn('×','Close local document',closeDocument);
 toolbar.append(statusChip,row,interactBtn,replace,close);document.body.appendChild(toolbar)
}
function ensureFileInput(){
 if(fileInput)return;fileInput=document.createElement('input');fileInput.type='file';fileInput.accept='.pdf,image/*,.txt,.md,.csv,.json';fileInput.hidden=true;
 fileInput.addEventListener('change',async()=>{const f=fileInput.files?.[0];fileInput.value='';if(f)await openFile(f)});document.body.appendChild(fileInput)
}
function ensureOpenButton(){
 const tools=document.querySelector('.tools');if(!tools||document.getElementById('openDocumentBtn'))return;
 const b=document.createElement('button');b.id='openDocumentBtn';b.type='button';b.className='btn soft';b.textContent='📄 Open File';b.title='Open a local PDF, image or text file. The file is not uploaded.';b.setAttribute('aria-label','Open local file');
 const grid=document.getElementById('gridBtn');if(grid)tools.insertBefore(b,grid);else tools.appendChild(b);b.addEventListener('click',()=>fileInput.click())
}
function releaseUrl(){
 if(pdfFrame)pdfFrame.src='about:blank';if(imageView)imageView.removeAttribute('src');
 if(objectUrl){try{URL.revokeObjectURL(objectUrl)}catch{}objectUrl=null}
}
function key(){return `${kind}:${page}`}
function savePage(){if(active)pageStore.set(key(),clone(strokes))}
function loadPage(){try{document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))}catch{}strokes=clone(pageStore.get(key())||[]);current=null;drawing=false;redraw();syncUi()}
function enterMode(){
 ensureLayer();ensureToolbar();if(!active)preDocumentStrokes=clone(strokes);active=true;pageStore=new Map();strokes=[];current=null;drawing=false;layer.style.display='block';toolbar.style.display='flex';document.body.classList.add('document-open-mode');wrap.classList.add('document-open-active');setInteraction(false);redraw();syncUi()
}
function restoreBoard(){if(preDocumentStrokes!==null){strokes=clone(preDocumentStrokes);preDocumentStrokes=null;current=null;drawing=false;redraw();syncUi()}}
function closeDocument(){if(!active)return;savePage();active=false;releaseUrl();hideViews();textView.textContent='';layer.style.display='none';toolbar.style.display='none';document.body.classList.remove('document-open-mode');wrap.classList.remove('document-open-active');kind='';docName='';page=1;pageStore.clear();canvas.style.pointerEvents='auto';restoreBoard();updateControls()}
function setInteraction(on){
 interaction=!!on&&kind==='pdf';if(pdfFrame)pdfFrame.style.pointerEvents=interaction?'auto':'none';canvas.style.pointerEvents=interaction?'none':'auto';
 if(interactBtn){interactBtn.classList.toggle('active',interaction);interactBtn.textContent=interaction?'✍ Annotate':'☝ Interact';interactBtn.title=interaction?'Return to whiteboard annotation':'Interact with the local PDF viewer'}
 if(active&&kind==='pdf')toast(interaction?'PDF interaction on':'Annotation tools on')
}
function updateControls(){
 if(!toolbar)return;pageInput.value=String(page);const isPdf=kind==='pdf';prevBtn.disabled=!isPdf||page<=1;nextBtn.disabled=!isPdf;pageInput.disabled=!isPdf;pageLabel.textContent=isPdf?'Page':'Single page';interactBtn.disabled=!isPdf;
}
function pdfSrc(){return objectUrl?`${objectUrl}#page=${Math.max(1,page)}&zoom=page-width`:''}
function goPage(next){
 if(!active||kind!=='pdf')return;savePage();page=Math.max(1,Math.round(next)||1);setInteraction(false);pdfFrame.src=pdfSrc();loadPage();updateControls()
}
async function openFile(file){
 const name=(file.name||'').toLowerCase(),isPdf=file.type==='application/pdf'||name.endsWith('.pdf'),isImage=(file.type||'').startsWith('image/'),isText=(file.type||'').startsWith('text/')||/\.(txt|md|csv|json)$/.test(name);
 if(!isPdf&&!isImage&&!isText){toast('MOE-safe beta: use PDF, image or text files only.');return}
 if(active)savePage();releaseUrl();enterMode();pageStore.clear();strokes=[];current=null;drawing=false;page=1;docName=file.name||'Local file';kind=isPdf?'pdf':isImage?'image':'text';hideViews();
 if(kind==='pdf'){
  objectUrl=URL.createObjectURL(file);pdfFrame.style.display='block';pdfFrame.src=pdfSrc();toast(`${docName} opened locally`)
 }else if(kind==='image'){
  objectUrl=URL.createObjectURL(file);imageView.style.display='block';imageView.src=objectUrl;toast(`${docName} opened locally`)
 }else{
  textView.style.display='block';textView.textContent=await file.text();toast(`${docName} opened locally`)
 }
 loadPage();updateControls();
}

ensureFileInput();ensureOpenButton();ensureToolbar();updateControls();
window.__MOE_LOCAL_DOCUMENT__={isActive:()=>active,getKind:()=>kind,getName:()=>docName,getPage:()=>page};
})();
