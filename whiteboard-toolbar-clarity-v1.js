(function(){
'use strict';
const edition=(new URLSearchParams(location.search).get('edition')||'en').toLowerCase();
const restoreLabels={en:'Restore',zh:'恢复',ms:'Pulihkan',ta:'மீட்டமை'};
const restoreTitles={en:'Restore saved whiteboard',zh:'恢复已保存的白板',ms:'Pulihkan papan putih yang disimpan',ta:'சேமித்த வெண்பலகையை மீட்டமை'};
function tidyToolbar(){
 const tools=document.querySelector('.tools');if(!tools)return;
 const docOpen=document.getElementById('openDocumentBtn');
 const label=restoreLabels[edition]||restoreLabels.en;
 const title=restoreTitles[edition]||restoreTitles.en;
 for(const b of tools.querySelectorAll('button')){
  if(b===docOpen)continue;
  const txt=(b.textContent||'').trim();
  const isSavedBoardOpen=/^📂\s*(Open|打开|Buka|திற)$/i.test(txt);
  if(isSavedBoardOpen){b.textContent='📂 '+label;b.title=title;b.setAttribute('aria-label',title)}
 }
 if(docOpen){
  docOpen.textContent='📄 Open File';
  docOpen.title='Open a PDF, Word, PowerPoint, spreadsheet, image or other displayable file';
  docOpen.setAttribute('aria-label','Open teaching file');
  docOpen.style.display=document.body.classList.contains('document-open-mode')?'none':'';
 }
 const quick=document.getElementById('documentQuickBar');
 if(quick){
  for(const b of quick.querySelectorAll('button')){
   if((b.title||'').toLowerCase().includes('open another')){b.textContent='↻';b.title='Replace file';b.setAttribute('aria-label','Replace file')}
  }
 }
}
const obs=new MutationObserver(tidyToolbar);obs.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
tidyToolbar();
})();
