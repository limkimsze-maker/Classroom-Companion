(function(){
'use strict';
const QUICK='#documentQuickBar', WORD='#documentWordPaper', WORDVIEW='#documentWordViewport';
let searchBtn=null,panel=null,input=null,status=null;
let currentFile=null,currentKind=null,pdfSearchDoc=null,pdfTextCache=new Map(),pdfPreparing=null;
let lastQuery='',lastPage=0,wordMatches=[],wordIndex=-1;

function toast(msg){
 if(typeof say==='function'){try{say(msg);return}catch{}}
 const t=document.getElementById('toast');if(t){t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1600)}
}
function active(){return document.body.classList.contains('document-open-mode')}
function quickbar(){return document.querySelector(QUICK)}
function pageBox(){return quickbar()?.querySelector('input[type="number"]')||null}
function visiblePage(){return Math.max(1,Number(pageBox()?.value)||1)}
function jumpPage(n){
 const box=pageBox();if(!box)return;
 box.value=String(Math.max(1,Math.round(n)||1));
 box.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
}
function waitForPdfJs(timeout=10000){
 if(window.pdfjsLib)return Promise.resolve(window.pdfjsLib);
 return new Promise((resolve,reject)=>{
  const start=performance.now();
  const id=setInterval(()=>{
   if(window.pdfjsLib){clearInterval(id);resolve(window.pdfjsLib)}
   else if(performance.now()-start>timeout){clearInterval(id);reject(new Error('PDF engine unavailable'))}
  },80);
 });
}
async function preparePdf(file){
 pdfSearchDoc=null;pdfTextCache.clear();pdfPreparing=null;
 if(!file||!file.name.toLowerCase().endsWith('.pdf'))return;
 pdfPreparing=(async()=>{
  const lib=await waitForPdfJs();
  const data=new Uint8Array(await file.arrayBuffer());
  pdfSearchDoc=await lib.getDocument({data}).promise;
  return pdfSearchDoc;
 })().catch(err=>{console.warn('Document search PDF preparation failed',err);pdfSearchDoc=null;return null});
 return pdfPreparing;
}
async function pageText(p){
 if(pdfTextCache.has(p))return pdfTextCache.get(p);
 if(!pdfSearchDoc&&pdfPreparing)await pdfPreparing;
 if(!pdfSearchDoc)return '';
 const page=await pdfSearchDoc.getPage(p),tc=await page.getTextContent();
 const text=(tc.items||[]).map(x=>x.str||'').join(' ').replace(/\s+/g,' ').toLowerCase();
 pdfTextCache.set(p,text);return text;
}
function ensureUi(){
 const bar=quickbar();if(!bar||searchBtn)return;
 searchBtn=document.createElement('button');searchBtn.type='button';searchBtn.id='documentSearchBtn';searchBtn.textContent='🔎';searchBtn.title='Search document (Ctrl+F)';searchBtn.setAttribute('aria-label','Search document');
 const buttons=bar.querySelectorAll('button');const reopen=[...buttons].find(b=>b.textContent==='📄');
 if(reopen)bar.insertBefore(searchBtn,reopen);else bar.appendChild(searchBtn);
 searchBtn.addEventListener('click',()=>toggleSearch());

 panel=document.createElement('div');panel.id='documentSearchPanel';panel.style.display='none';
 input=document.createElement('input');input.type='search';input.placeholder='Find in document';input.autocomplete='off';input.spellcheck=false;input.setAttribute('aria-label','Search document');
 status=document.createElement('span');status.id='documentSearchStatus';status.textContent='';
 const prev=document.createElement('button');prev.type='button';prev.textContent='↑';prev.title='Previous match';
 const next=document.createElement('button');next.type='button';next.textContent='↓';next.title='Next match';
 const close=document.createElement('button');close.type='button';close.textContent='×';close.title='Close search';
 prev.addEventListener('click',()=>runSearch(-1));next.addEventListener('click',()=>runSearch(1));close.addEventListener('click',hideSearch);
 input.addEventListener('keydown',e=>{
  if(e.key==='Enter'){e.preventDefault();runSearch(e.shiftKey?-1:1)}
  else if(e.key==='Escape'){e.preventDefault();hideSearch()}
 });
 input.addEventListener('input',()=>{status.textContent='';lastQuery='';wordMatches=[];wordIndex=-1});
 panel.append(input,status,prev,next,close);document.body.appendChild(panel);

 const st=document.createElement('style');st.textContent=`
 #documentSearchPanel{position:fixed;right:4px;top:34px;z-index:100210;align-items:center;gap:2px;padding:3px;border:1px solid rgba(23,50,77,.22);border-radius:8px;background:rgba(255,255,255,.98);box-shadow:0 3px 12px rgba(18,32,46,.18)}
 #documentSearchPanel input{width:180px;height:27px;padding:2px 7px;border:1px solid #bfcbd3;border-radius:6px;font:700 11px system-ui,sans-serif;outline:none}
 #documentSearchPanel input:focus{border-color:#0f766e;box-shadow:0 0 0 2px rgba(15,118,110,.12)}
 #documentSearchPanel button{height:27px;min-width:27px;padding:0 5px;border:1px solid #d8e1e8;border-radius:6px;background:#fff;color:#17324d;font:900 11px system-ui,sans-serif}
 #documentSearchStatus{min-width:38px;max-width:90px;text-align:center;font:900 10px system-ui,sans-serif;color:#17324d;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 `;document.head.appendChild(st);
}
function showSearch(){
 ensureUi();if(!panel||!active())return;
 panel.style.display='flex';requestAnimationFrame(()=>{input.focus();input.select()});
}
function hideSearch(){if(panel)panel.style.display='none';if(input)input.blur()}
function toggleSearch(){if(panel?.style.display==='flex')hideSearch();else showSearch()}

async function searchPdf(q,dir){
 if(!pdfSearchDoc&&pdfPreparing)await pdfPreparing;
 if(!pdfSearchDoc){status.textContent='Not ready';toast('PDF search is still preparing.');return}
 const total=pdfSearchDoc.numPages||1;
 let start=visiblePage();
 if(q===lastQuery&&lastPage===start)start+=dir;
 for(let i=0;i<total;i++){
  const p=((start-1+dir*i)%total+total)%total+1;
  status.textContent=`… ${p}/${total}`;
  const text=await pageText(p);
  if(text.includes(q)){
   lastQuery=q;lastPage=p;status.textContent=`Page ${p}`;jumpPage(p);return;
  }
 }
 status.textContent='0 found';toast(`No match for “${input.value.trim()}”`);
}
function collectWordMatches(q){
 const paper=document.querySelector(WORD);if(!paper)return [];
 const matches=[],walker=document.createTreeWalker(paper,NodeFilter.SHOW_TEXT);
 let node;
 while((node=walker.nextNode())){
  const raw=node.nodeValue||'',low=raw.toLowerCase();let from=0,idx;
  while((idx=low.indexOf(q,from))!==-1){matches.push({node,start:idx,end:idx+q.length});from=idx+Math.max(1,q.length)}
 }
 return matches;
}
function wordMatchPage(m){
 const paper=document.querySelector(WORD),view=document.querySelector(WORDVIEW);if(!paper||!view)return 1;
 const range=document.createRange();range.setStart(m.node,m.start);range.setEnd(m.node,m.end);
 const rr=range.getBoundingClientRect(),pr=paper.getBoundingClientRect();
 const zoomText=quickbar()?.querySelectorAll('span');let z=1;
 if(zoomText){for(const s of zoomText){if(/%$/.test((s.textContent||'').trim())){z=(parseInt(s.textContent,10)||100)/100;break}}}
 const localY=Math.max(0,(rr.top-pr.top)/Math.max(.01,z));
 const visible=Math.max(120,view.clientHeight-12);
 return Math.max(1,Math.floor((localY*z)/visible)+1);
}
function selectWordMatch(m){
 try{const r=document.createRange();r.setStart(m.node,m.start);r.setEnd(m.node,m.end);const sel=getSelection();sel.removeAllRanges();sel.addRange(r)}catch{}
}
function searchWord(q,dir){
 if(q!==lastQuery||!wordMatches.length){wordMatches=collectWordMatches(q);wordIndex=dir>0?-1:0}
 if(!wordMatches.length){status.textContent='0 found';toast(`No match for “${input.value.trim()}”`);lastQuery=q;return}
 wordIndex=(wordIndex+dir+wordMatches.length)%wordMatches.length;
 const m=wordMatches[wordIndex],p=wordMatchPage(m);lastQuery=q;lastPage=p;
 status.textContent=`${wordIndex+1}/${wordMatches.length}`;jumpPage(p);
 setTimeout(()=>selectWordMatch(m),120);
}
async function runSearch(dir){
 if(!active())return;
 const raw=(input?.value||'').trim();if(!raw){showSearch();return}
 const q=raw.toLowerCase();status.textContent='Searching…';
 try{
  if(currentKind==='pdf')await searchPdf(q,dir);
  else if(currentKind==='word')searchWord(q,dir);
  else{status.textContent='Open file';toast('Open a PDF or Word document first.')}
 }catch(err){console.error(err);status.textContent='Search error';toast('Search could not be completed.')}
}
function hookFileInput(){
 const inputs=[...document.querySelectorAll('input[type="file"]')];
 const file=inputs.find(x=>(x.accept||'').includes('.pdf')&&(x.accept||'').includes('.docx'));
 if(!file||file.dataset.searchHooked)return;
 file.dataset.searchHooked='1';
 file.addEventListener('change',()=>{
  const f=file.files?.[0];if(!f)return;
  currentFile=f;lastQuery='';lastPage=0;wordMatches=[];wordIndex=-1;status&&(status.textContent='');
  const n=f.name.toLowerCase();currentKind=n.endsWith('.pdf')?'pdf':n.endsWith('.docx')?'word':null;
  if(currentKind==='pdf')preparePdf(f);else{pdfSearchDoc=null;pdfTextCache.clear();pdfPreparing=null}
 },true);
}

const obs=new MutationObserver(()=>{ensureUi();hookFileInput();if(!active())hideSearch()});obs.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
ensureUi();hookFileInput();
document.addEventListener('keydown',e=>{
 if(!active())return;
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='f'){e.preventDefault();e.stopImmediatePropagation();showSearch();}
 else if(e.key==='Escape'&&panel?.style.display==='flex'&&document.activeElement===input){e.preventDefault();hideSearch()}
},true);
})();
