(function(){
'use strict';
let loading=null,fill=null,label=null,progress=0,progressTimer=0,hideTimer=0;
const touchPoints=new Map();
let pinchStart=null,limitSaid=false;

function active(){return document.body.classList.contains('document-open-mode')}
function board(){return document.getElementById('boardWrap')}
function insideBoard(e){
 const b=board();if(!b)return false;
 const p=e.composedPath?.()||[];if(p.includes(b)||p.includes(document.getElementById('board')))return true;
 const r=b.getBoundingClientRect();return typeof e.clientX==='number'&&e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;
}
function toast(msg){
 const t=document.getElementById('toast');if(!t)return;
 t.textContent=msg;t.classList.add('show');clearTimeout(t._docFeedbackTimer);t._docFeedbackTimer=setTimeout(()=>t.classList.remove('show'),1500);
}
function zoomPercent(){
 const bar=document.getElementById('documentQuickBar');if(!bar)return 100;
 const s=[...bar.querySelectorAll('span')].find(x=>/%$/.test((x.textContent||'').trim()));
 const n=parseInt((s?.textContent||'100').replace(/[^0-9]/g,''),10);return Number.isFinite(n)?n:100;
}
function ensureLoading(){
 if(loading)return;
 loading=document.createElement('div');loading.id='documentLoading';loading.innerHTML='<div class="docLoadCard"><div class="docLoadTitle">Opening document…</div><div class="docLoadSub">Please wait</div><div class="docLoadTrack"><div class="docLoadFill"></div></div></div>';
 document.body.appendChild(loading);fill=loading.querySelector('.docLoadFill');label=loading.querySelector('.docLoadTitle');
 const st=document.createElement('style');st.id='documentLoadingStyles';st.textContent=`
#documentLoading{position:fixed;inset:0;z-index:100500;display:none;align-items:center;justify-content:center;pointer-events:none;background:rgba(238,244,245,.28)}
#documentLoading .docLoadCard{width:min(320px,72vw);padding:14px 16px;border:1px solid #cbd8de;border-radius:14px;background:rgba(255,255,255,.97);box-shadow:0 10px 30px rgba(18,32,46,.2);text-align:center;font-family:system-ui,sans-serif;color:#17324d}
#documentLoading .docLoadTitle{font-size:14px;font-weight:900}.docLoadSub{margin-top:2px;font-size:11px;font-weight:700;color:#667085}
#documentLoading .docLoadTrack{height:8px;margin-top:10px;border-radius:999px;overflow:hidden;background:#e5ecef}.docLoadFill{height:100%;width:8%;border-radius:999px;background:#0f766e;transition:width .18s ease}
`;
 document.head.appendChild(st);
}
function showLoading(name){
 ensureLoading();clearInterval(progressTimer);clearTimeout(hideTimer);progress=8;fill.style.width=progress+'%';
 label.textContent=name?`Opening ${name}…`:'Opening document…';loading.style.display='flex';
 progressTimer=setInterval(()=>{progress=Math.min(90,progress+(progress<55?7:progress<78?3:1));fill.style.width=progress+'%'},180);
 hideTimer=setTimeout(()=>hideLoading(),30000);
}
function hideLoading(){
 if(!loading)return;clearInterval(progressTimer);clearTimeout(hideTimer);progress=100;fill.style.width='100%';setTimeout(()=>{if(loading)loading.style.display='none'},160);
}
function isDocumentFileInput(el){return el&&el.tagName==='INPUT'&&el.type==='file'&&/pdf|docx/i.test(el.accept||'')}
document.addEventListener('change',e=>{
 const el=e.target;if(!isDocumentFileInput(el)||!el.files?.length)return;showLoading(el.files[0]?.name||'document');
},true);
const toastEl=document.getElementById('toast');
if(toastEl)new MutationObserver(()=>{
 const txt=(toastEl.textContent||'').trim().toLowerCase();
 if(txt.endsWith('opened')||txt.includes('could not open'))hideLoading();
}).observe(toastEl,{childList:true,subtree:true,characterData:true});

function monitorZoomButtons(e){
 if(!active())return;const bar=document.getElementById('documentQuickBar');if(!bar||!bar.contains(e.target))return;
 const txt=(e.target.closest('button')?.textContent||'').trim(),z=zoomPercent();
 if(txt==='+'&&z>=220){e.preventDefault();e.stopImmediatePropagation();toast('Maximum zoom: 220%')}
 else if(txt==='−'&&z<=55){e.preventDefault();e.stopImmediatePropagation();toast('Minimum zoom: 55%')}
}
document.addEventListener('click',monitorZoomButtons,true);
window.addEventListener('wheel',e=>{
 if(!active()||!insideBoard(e)||!(e.ctrlKey||e.metaKey))return;const z=zoomPercent();
 if(e.deltaY<0&&z>=220)toast('Maximum zoom: 220%');else if(e.deltaY>0&&z<=55)toast('Minimum zoom: 55%');
},{capture:true,passive:true});
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
window.addEventListener('pointerdown',e=>{
 if(!active()||e.pointerType!=='touch'||!insideBoard(e))return;touchPoints.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(touchPoints.size===2){const p=[...touchPoints.values()];pinchStart={d:Math.max(1,dist(p[0],p[1])),z:zoomPercent()};limitSaid=false}
},true);
window.addEventListener('pointermove',e=>{
 if(!active()||e.pointerType!=='touch'||!touchPoints.has(e.pointerId))return;touchPoints.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(!pinchStart||touchPoints.size<2||limitSaid)return;const p=[...touchPoints.values()].slice(0,2),ratio=dist(p[0],p[1])/pinchStart.d;
 if(pinchStart.z>=220&&ratio>1.035){toast('Maximum zoom: 220%');limitSaid=true}
 else if(pinchStart.z<=55&&ratio<.965){toast('Minimum zoom: 55%');limitSaid=true}
},true);
function endTouch(e){if(e.pointerType!=='touch')return;touchPoints.delete(e.pointerId);if(touchPoints.size<2){pinchStart=null;limitSaid=false}}
window.addEventListener('pointerup',endTouch,true);window.addEventListener('pointercancel',endTouch,true);
})();
