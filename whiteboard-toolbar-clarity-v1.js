(function(){
'use strict';
const edition=(new URLSearchParams(location.search).get('edition')||'en').toLowerCase();
const restoreLabels={en:'Restore',zh:'恢复',ms:'Pulihkan',ta:'மீட்டமை'};
const restoreTitles={en:'Restore saved whiteboard',zh:'恢复已保存的白板',ms:'Pulihkan papan putih yang disimpan',ta:'சேமித்த வெண்பலகையை மீட்டமை'};
const exportLabels={en:'Export PNG',zh:'导出 PNG',ms:'Eksport PNG',ta:'PNG ஏற்றுமதி'};
let queued=false;
function setText(el,text){text=window.CCWhiteboardLabels?.translate(text)||text;if(el&&el.textContent!==text)el.textContent=text}
function setAttr(el,name,value){value=window.CCWhiteboardLabels?.translate(value)||value;if(el&&el.getAttribute(name)!==value)el.setAttribute(name,value)}
function removeLegacyOverlay(){
 const video=document.getElementById('liveOverlayVideo');
 if(video?.srcObject){try{for(const t of video.srcObject.getTracks())t.stop()}catch{}}
 for(const id of ['liveOverlayBtn','overlayQuickControls','liveOverlayVideo'])document.getElementById(id)?.remove();
 document.body.classList.remove('live-overlay-mode');
 document.getElementById('boardWrap')?.classList.remove('live-overlay-active');
 const tools=document.querySelector('.tools');
 if(tools){
  for(const b of tools.querySelectorAll('button')){
   const txt=(b.textContent||'').trim().toLowerCase();
   const aria=(b.getAttribute('aria-label')||'').trim().toLowerCase();
   const title=(b.title||'').trim().toLowerCase();
   if(txt==='overlay'||aria==='overlay'||title.includes('place behind the whiteboard'))b.remove();
  }
 }
}
function tidyToolbar(){
 queued=false;
 removeLegacyOverlay();
 const tools=document.querySelector('.tools');if(!tools)return;
 const docOpen=document.getElementById('openDocumentBtn');
 const label=restoreLabels[edition]||restoreLabels.en;
 const title=restoreTitles[edition]||restoreTitles.en;
 const exportLabel=exportLabels[edition]||exportLabels.en;
 for(const b of [...tools.querySelectorAll('button')]){
  if(b===docOpen)continue;
  const txt=(b.textContent||'').trim();
  const lower=txt.toLowerCase();
  const bTitle=(b.title||'').trim().toLowerCase();
  if(/^📂\s*(Open|打开|Buka|திற)$/i.test(txt)){
   setText(b,'📂 '+label);setAttr(b,'title',title);setAttr(b,'aria-label',title);continue;
  }
  if(lower.includes('background')||lower.includes('背景')||lower.includes('latar')||lower.includes('பின்னணி')||bTitle==='background'||bTitle==='背景'||bTitle==='latar'||bTitle==='பின்னணி'){
   b.remove();continue;
  }
  if(/png/i.test(txt)||/png/i.test(b.title||'')){
   setText(b,'⇩ '+exportLabel);setAttr(b,'title','Export the current whiteboard as a PNG image');setAttr(b,'aria-label','Export whiteboard as PNG');
  }
 }
 if(docOpen){
  setText(docOpen,({zh:'📂 打开文件',ms:'📂 Buka Fail',ta:'📂 கோப்பைத் திற'})[edition]||'📄 Open File');
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
