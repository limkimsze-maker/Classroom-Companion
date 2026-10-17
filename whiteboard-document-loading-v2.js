(function(){
'use strict';
let overlay=null,fill=null,title=null,sub=null,timer=null,timeout=null,progress=8,shownAt=0,hideDelay=null;
let awaitingSelection=false,opening=false,focusTimer=null,readyTimer=null,positionTimer=null;

function board(){return document.getElementById('boardWrap')}
function ensure(){
 if(overlay)return overlay;
 overlay=document.createElement('div');
 overlay.id='documentLoadingV2';
 overlay.innerHTML='<div class="docLoadingCard"><div class="docLoadingTitle">Choose a PDF or Word file…</div><div class="docLoadingSub">Waiting for file selection</div><div class="docLoadingTrack"><div class="docLoadingFill"></div></div></div>';
 document.body.appendChild(overlay);
 fill=overlay.querySelector('.docLoadingFill');title=overlay.querySelector('.docLoadingTitle');sub=overlay.querySelector('.docLoadingSub');
 const style=document.createElement('style');style.id='documentLoadingV2Styles';style.textContent=`
#documentLoadingV2{position:fixed;z-index:2147483000;display:none;align-items:center;justify-content:center;background:rgba(238,244,245,.68);pointer-events:none}
#documentLoadingV2 .docLoadingCard{width:min(380px,78vw);padding:18px 20px;border:1px solid #bfcfd6;border-radius:16px;background:rgba(255,255,255,.995);box-shadow:0 14px 38px rgba(18,32,46,.26);text-align:center;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#17324d}
#documentLoadingV2 .docLoadingTitle{font-size:16px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#documentLoadingV2 .docLoadingSub{margin-top:4px;font-size:12px;font-weight:750;color:#667085}
#documentLoadingV2 .docLoadingTrack{height:9px;margin-top:13px;border-radius:999px;overflow:hidden;background:#e3ebee}
#documentLoadingV2 .docLoadingFill{height:100%;width:8%;border-radius:999px;background:#0f766e;transition:width .18s ease}
`;
 document.head.appendChild(style);return overlay;
}
function placeOverBoard(){
 if(!overlay)return;const b=board();if(!b)return;
 const r=b.getBoundingClientRect();
 overlay.style.left=Math.round(r.left)+'px';overlay.style.top=Math.round(r.top)+'px';
 overlay.style.width=Math.max(0,Math.round(r.width))+'px';overlay.style.height=Math.max(0,Math.round(r.height))+'px';
}
function startPositioning(){clearInterval(positionTimer);placeOverBoard();positionTimer=setInterval(placeOverBoard,120)}
function stopTimers(){
 clearInterval(timer);clearTimeout(timeout);clearTimeout(hideDelay);clearTimeout(focusTimer);clearInterval(readyTimer);clearInterval(positionTimer);
 timer=null;timeout=null;hideDelay=null;focusTimer=null;readyTimer=null;positionTimer=null;
}
function showWaiting(){
 ensure();stopTimers();awaitingSelection=true;opening=false;progress=10;fill.style.width='10%';
 title.textContent='Choose a PDF or Word file…';sub.textContent='Waiting for file selection';
 placeOverBoard();overlay.style.display='flex';shownAt=performance.now();startPositioning();
 // Force layout so the card is committed before the native file picker takes focus.
 void overlay.offsetHeight;
}
function showOpening(name){
 ensure();clearInterval(timer);clearTimeout(timeout);clearTimeout(hideDelay);clearInterval(readyTimer);
 awaitingSelection=false;opening=true;progress=Math.max(progress,12);fill.style.width=progress+'%';
 title.textContent=name?`Opening ${name}…`:'Opening document…';sub.textContent='Please wait';
 placeOverBoard();overlay.style.display='flex';shownAt=performance.now();startPositioning();
 timer=setInterval(()=>{const step=progress<48?7:progress<72?4:progress<88?2:1;progress=Math.min(94,progress+step);fill.style.width=progress+'%'},180);
 timeout=setTimeout(()=>{if(opening){sub.textContent='Still opening…';progress=Math.max(progress,94);fill.style.width=progress+'%'}},30000);
 readyTimer=setInterval(checkReady,60);
}
function hide(complete=true){
 if(!overlay||overlay.style.display==='none')return;
 awaitingSelection=false;opening=false;
 const elapsed=performance.now()-shownAt;
 const finish=()=>{
  clearInterval(timer);clearTimeout(timeout);clearInterval(readyTimer);clearInterval(positionTimer);
  timer=null;timeout=null;readyTimer=null;positionTimer=null;
  if(complete){progress=100;fill.style.width='100%';setTimeout(()=>{if(overlay)overlay.style.display='none'},180)}
  else overlay.style.display='none';
 };
 if(complete&&elapsed<650){clearTimeout(hideDelay);hideDelay=setTimeout(finish,650-elapsed);return}
 finish();
}
function isDocumentInput(el){return !!(el&&el.tagName==='INPUT'&&el.type==='file'&&/pdf|docx|wordprocessingml/i.test(el.accept||''))}
function isDocumentOpenButton(target){
 const btn=target?.closest?.('button');if(!btn)return false;
 if(btn.id==='openDocumentBtn')return true;
 const titleText=(btn.title||'').toLowerCase(),text=(btn.textContent||'').trim();
 return (titleText.includes('pdf')||titleText.includes('word'))&&text.includes('Open');
}
function visibleReady(){
 if(!opening||!document.body.classList.contains('document-open-mode'))return false;
 const underlay=document.getElementById('documentUnderlay');
 if(!underlay||getComputedStyle(underlay).display==='none')return false;
 const pdf=document.getElementById('documentPdfCanvas');
 if(pdf&&getComputedStyle(pdf).display!=='none'&&pdf.width>1&&pdf.height>1&&pdf.style.width&&pdf.style.height){
  const r=pdf.getBoundingClientRect();if(r.width>10&&r.height>10)return true;
 }
 const vp=document.getElementById('documentWordViewport'),paper=document.getElementById('documentWordPaper');
 if(vp&&paper&&getComputedStyle(vp).display!=='none'&&paper.innerHTML.trim()&&paper.style.transform.includes('scale(')){
  const r=paper.getBoundingClientRect();if(r.width>10&&r.height>10)return true;
 }
 return false;
}
function checkReady(){
 if(!visibleReady())return;
 requestAnimationFrame(()=>requestAnimationFrame(()=>{if(visibleReady())hide(true)}));
}

document.addEventListener('click',e=>{if(isDocumentOpenButton(e.target))showWaiting()},true);

document.addEventListener('change',e=>{
 const input=e.target;if(!isDocumentInput(input))return;
 const f=input.files&&input.files[0];if(f)showOpening(f.name||'document');
},true);

window.addEventListener('focus',()=>{
 if(!awaitingSelection||opening)return;
 clearTimeout(focusTimer);focusTimer=setTimeout(()=>{if(awaitingSelection&&!opening)hide(false)},650);
});
window.addEventListener('resize',placeOverBoard);

function wireToast(){
 const t=document.getElementById('toast');if(!t||t.dataset.loadingV2Error==='1')return;
 t.dataset.loadingV2Error='1';
 const check=()=>{
  const text=(t.textContent||'').trim().toLowerCase();
  if(opening&&text.includes('could not open this document'))hide(true);
 };
 new MutationObserver(check).observe(t,{childList:true,subtree:true,characterData:true});
}
wireToast();new MutationObserver(()=>wireToast()).observe(document.documentElement,{childList:true,subtree:true});
})();
