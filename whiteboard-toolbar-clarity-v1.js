(function(){
'use strict';
const edition=(new URLSearchParams(location.search).get('edition')||'en').toLowerCase();
const restoreLabels={en:'Restore',zh:'恢复',ms:'Pulihkan',ta:'மீட்டமை'};
const restoreTitles={en:'Restore saved whiteboard',zh:'恢复已保存的白板',ms:'Pulihkan papan putih yang disimpan',ta:'சேமித்த வெண்பலகையை மீட்டமை'};
let queued=false;
function setText(el,text){if(el&&el.textContent!==text)el.textContent=text}
function setAttr(el,name,value){if(el&&el.getAttribute(name)!==value)el.setAttribute(name,value)}
function tidyToolbar(){
 queued=false;
 const tools=document.querySelector('.tools');if(!tools)return;
 const docOpen=document.getElementById('openDocumentBtn');
 const label=restoreLabels[edition]||restoreLabels.en;
 const title=restoreTitles[edition]||restoreTitles.en;
 for(const b of tools.querySelectorAll('button')){
  if(b===docOpen)continue;
  const txt=(b.textContent||'').trim();
  if(/^📂\s*(Open|打开|Buka|திற)$/i.test(txt)){
   setText(b,'📂 '+label);setAttr(b,'title',title);setAttr(b,'aria-label',title);
  }
 }
 if(docOpen){
  setText(docOpen,'📄 Open File');
  setAttr(docOpen,'title','Open a PDF, Word, PowerPoint, spreadsheet, image or other displayable file');
  setAttr(docOpen,'aria-label','Open teaching file');
  const wanted=document.body.classList.contains('document-open-mode')?'none':'';
  if(docOpen.style.display!==wanted)docOpen.style.display=wanted;
 }
 const quick=document.getElementById('documentQuickBar');
 if(quick){
  for(const b of quick.querySelectorAll('button')){
   const t=(b.title||'').toLowerCase();
   if(t.includes('open another')){setText(b,'↻');setAttr(b,'title','Replace file');setAttr(b,'aria-label','Replace file')}
  }
 }
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(tidyToolbar)}
const obs=new MutationObserver(schedule);
obs.observe(document.body,{subtree:true,childList:true});
new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['class']});
schedule();
})();
