(function(){
'use strict';
let overlay=null,fill=null,title=null,sub=null,timer=null,timeout=null,progress=8,shownAt=0,hideDelay=null;
let awaitingSelection=false,opening=false,focusTimer=null,readyTimer=null,successSeen=false;

function board(){return document.getElementById('boardWrap')}
function ensure(){
 if(overlay)return overlay;
 const host=board()||document.body;
 overlay=document.createElement('div');
 overlay.id='documentLoadingV2';
 overlay.innerHTML='<div class="docLoadingCard"><div class="docLoadingTitle">Choose a PDF or Word file…</div><div class="docLoadingSub">Waiting for file selection</div><div class="docLoadingTrack"><div class="docLoadingFill"></div></div></div>';
 host.appendChild(overlay);
 fill=overlay.querySelector('.docLoadingFill');title=overlay.querySelector('.docLoadingTitle');sub=overlay.querySelector('.docLoadingSub');
 const style=document.createElement('style');style.id='documentLoadingV2Styles';style.textContent=`
#documentLoadingV2{position:absolute;inset:0;z-index:100500;display:none;align-items:center;justify-content:center;background:rgba(238,244,245,.58);pointer-events:none}
#documentLoadingV2 .docLoadingCard{width:min(360px,78vw);padding:18px 20px;border:1px solid #bfcfd6;border-radius:16px;background:rgba(255,255,255,.99);box-shadow:0 14px 38px rgba(18,32,46,.24);text-align:center;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#17324d}
#documentLoadingV2 .docLoadingTitle{font-size:16px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#documentLoadingV2 .docLoadingSub{margin-top:4px;font-size:12px;font-weight:750;color:#667085}
#documentLoadingV2 .docLoadingTrack{height:9px;margin-top:13px;border-radius:999px;overflow:hidden;background:#e3ebee}
#documentLoadingV2 .docLoadingFill{height:100%;width:8%;border-radius:999px;background:#0f766e;transition:width .18s ease}
`;
 document.head.appendChild(style);return overlay;
}
function stopTimers(){clearInterval(timer);clearTimeout(timeout);clearTimeout(hideDelay);clearTimeout(focusTimer);clearInterval(readyTimer);timer=null;timeout=null;hideDelay=null;focusTimer=null;readyTimer=null}
function showWaiting(){
 ensure();stopTimers();awaitingSelection=true;opening=false;successSeen=false;progress=10;fill.style.width='10%';
 title.textContent='Choose a PDF or Word file…';sub.textContent='Waiting for file selection';overlay.style.display='flex';shownAt=performance.now();
}
function showOpening(name){
 ensure();clearInterval(timer);clearTimeout(timeout);clearTimeout(hideDelay);clearInterval(readyTimer);awaitingSelection=false;opening=true;successSeen=false;progress=Math.max(progress,12);fill.style.width=progress+'%';
 title.textContent=name?`Opening ${name}…`:'Opening document…';sub.textContent='Please wait';overlay.style.display='flex';shownAt=performance.now();
 timer=setInterval(()=>{const step=progress<48?7:progress<72?4:progress<88?2:1;progress=Math.min(92,progress+step);fill.style.width=progress+'%'},180);
 timeout=setTimeout(()=>{sub.textContent='Still opening…';progress=Math.max(progress,92);fill.style.width=progress+'%'},30000);
 readyTimer=setInterval(checkReady,80);
}
function hide(complete=true){
 if(!overlay||overlay.style.display==='none')return;
 awaitingSelection=false;opening=false;successSeen=false;
 const elapsed=performance.now()-shownAt;
 const finish=()=>{clearInterval(timer);clearTimeout(timeout);clearInterval(readyTimer);timer=null;timeout=null;readyTimer=null;if(complete){progress=100;fill.style.width='100%';setTimeout(()=>{if(overlay)overlay.style.display='none'},180)}else overlay.style.display='none'};
 if(complete&&elapsed<650){clearTimeout(hideDelay);hideDelay=setTimeout(finish,650-elapsed);return}finish();
}
function isDocumentInput(el){return !!(el&&el.tagName==='INPUT'&&el.type==='file'&&/pdf|docx|wordprocessingml/i.test(el.accept||''))}
function visibleReady(){
 if(!document.body.classList.contains('document-open-mode'))return false;
 const pdf=document.getElementById('documentPdfCanvas');
 if(pdf&&getComputedStyle(pdf).display!=='none'&&pdf.width>1&&pdf.height>1){
  const r=pdf.getBoundingClientRect();if(r.width>10&&r.height>10)return true;
 }
 const vp=document.getElementById('documentWordViewport'),paper=document.getElementById('documentWordPaper');
 if(vp&&paper&&getComputedStyle(vp).display!=='none'&&paper.innerHTML.trim()){
  const r=paper.getBoundingClientRect();if(r.width>10&&r.height>10)return true;
 }
 return false;
}
function checkReady(){
 if(!opening||!successSeen||!visibleReady())return;
 requestAnimationFrame(()=>requestAnimationFrame(()=>{if(opening&&successSeen&&visibleReady())hide(true)}));
}

// Show on the whiteboard immediately when the document Open button is pressed.
document.addEventListener('click',e=>{
 const btn=e.target?.closest?.('#openDocumentBtn');
 if(btn)showWaiting();
},true);

// Capture the chosen file before the existing opener clears its input.
document.addEventListener('change',e=>{
 const input=e.target;if(!isDocumentInput(input))return;
 const f=input.files&&input.files[0];
 if(f)showOpening(f.name||'document');
},true);

// If the file picker is cancelled, remove the waiting card when focus returns.
window.addEventListener('focus',()=>{
 if(!awaitingSelection||opening)return;
 clearTimeout(focusTimer);focusTimer=setTimeout(()=>{if(awaitingSelection&&!opening)hide(false)},450);
});

function wireToast(){
 const t=document.getElementById('toast');if(!t||t.dataset.loadingV2==='1')return;
 t.dataset.loadingV2='1';
 const check=()=>{
  const text=(t.textContent||'').trim().toLowerCase();if(!text)return;
  if(text.includes('could not open this document')){hide(true);return}
  if(text.endsWith(' opened')||text==='opened'){successSeen=true;checkReady()}
 };
 new MutationObserver(check).observe(t,{childList:true,subtree:true,characterData:true});
}
wireToast();new MutationObserver(()=>wireToast()).observe(document.documentElement,{childList:true,subtree:true});
})();
