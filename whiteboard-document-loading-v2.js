(function(){
'use strict';
let overlay=null,fill=null,title=null,timer=null,timeout=null,progress=8,shownAt=0,hideDelay=null;

function ensure(){
 if(overlay)return overlay;
 overlay=document.createElement('div');
 overlay.id='documentLoadingV2';
 overlay.innerHTML='<div class="docLoadingCard"><div class="docLoadingTitle">Opening document…</div><div class="docLoadingSub">Please wait</div><div class="docLoadingTrack"><div class="docLoadingFill"></div></div></div>';
 document.body.appendChild(overlay);
 fill=overlay.querySelector('.docLoadingFill');
 title=overlay.querySelector('.docLoadingTitle');
 const style=document.createElement('style');
 style.id='documentLoadingV2Styles';
 style.textContent=`
#documentLoadingV2{position:fixed;inset:0;z-index:100500;display:none;align-items:center;justify-content:center;background:rgba(238,244,245,.38);pointer-events:none}
#documentLoadingV2 .docLoadingCard{width:min(330px,76vw);padding:15px 17px;border:1px solid #cbd8de;border-radius:14px;background:rgba(255,255,255,.99);box-shadow:0 12px 34px rgba(18,32,46,.22);text-align:center;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#17324d}
#documentLoadingV2 .docLoadingTitle{font-size:14px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#documentLoadingV2 .docLoadingSub{margin-top:3px;font-size:11px;font-weight:750;color:#667085}
#documentLoadingV2 .docLoadingTrack{height:8px;margin-top:11px;border-radius:999px;overflow:hidden;background:#e4ecef}
#documentLoadingV2 .docLoadingFill{height:100%;width:8%;border-radius:999px;background:#0f766e;transition:width .18s ease}
`;
 document.head.appendChild(style);
 return overlay;
}
function stopTimers(){clearInterval(timer);clearTimeout(timeout);clearTimeout(hideDelay);timer=null;timeout=null;hideDelay=null}
function show(name){
 ensure();stopTimers();progress=8;fill.style.width='8%';
 title.textContent=name?`Opening ${name}…`:'Opening document…';
 overlay.style.display='flex';shownAt=performance.now();
 timer=setInterval(()=>{
  const step=progress<48?7:progress<72?4:progress<88?2:1;
  progress=Math.min(92,progress+step);fill.style.width=progress+'%';
 },180);
 timeout=setTimeout(()=>hide(false),30000);
}
function hide(complete=true){
 if(!overlay||overlay.style.display==='none')return;
 const elapsed=performance.now()-shownAt;
 const finish=()=>{
  clearInterval(timer);clearTimeout(timeout);timer=null;timeout=null;
  if(complete){progress=100;fill.style.width='100%';setTimeout(()=>{if(overlay)overlay.style.display='none'},180)}
  else overlay.style.display='none';
 };
 if(complete&&elapsed<650){clearTimeout(hideDelay);hideDelay=setTimeout(finish,650-elapsed);return}
 finish();
}
function isDocumentInput(el){return !!(el&&el.tagName==='INPUT'&&el.type==='file'&&/pdf|docx|wordprocessingml/i.test(el.accept||''))}

// Capture the selection before the document opener clears the file input.
document.addEventListener('change',e=>{
 const input=e.target;
 if(!isDocumentInput(input))return;
 const f=input.files&&input.files[0];
 if(f)show(f.name||'document');
},true);

function wireToast(){
 const t=document.getElementById('toast');if(!t||t.dataset.loadingV2==='1')return;
 t.dataset.loadingV2='1';
 const check=()=>{
  const text=(t.textContent||'').trim().toLowerCase();
  if(!text)return;
  if(text.endsWith(' opened')||text==='opened'||text.includes('could not open this document'))hide(true);
 };
 new MutationObserver(check).observe(t,{childList:true,subtree:true,characterData:true});
}
wireToast();
new MutationObserver(()=>wireToast()).observe(document.documentElement,{childList:true,subtree:true});
})();
