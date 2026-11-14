(function(){'use strict';
/* Mini Whiteboard uses the existing Whiteboard Smart PDF/image viewer; no full textbook upload.
   The classroom iframe has its own Cloudflare connection, independent of this MOE-local-only page. */
const $=id=>document.getElementById(id),wrap=$('boardWrap'),tools=document.querySelector('.tools');
if(!wrap||!tools)return;
const css=document.createElement('style');css.textContent=[
'#ccMiniModal[hidden],#ccMiniSelection[hidden],#ccMiniHint[hidden]{display:none!important}',
'#ccMiniModal{position:fixed;inset:0;z-index:2147483200;display:grid;place-items:center;background:#132e40aa;padding:8px}',
'#ccMiniBox{width:min(1520px,99vw);height:min(950px,98dvh);display:flex;flex-direction:column;background:white;border-radius:14px;overflow:hidden;box-shadow:0 16px 50px #0006}',
'#ccMiniHeader{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:9px 12px;background:#ecf8f5;border-bottom:1px solid #c9e3df;font:800 13px system-ui;color:#17324d}',
'#ccMiniHeader strong{font-size:17px;margin-right:auto}#ccMiniHeader button{border:1px solid #b8d7d0;background:#fff;border-radius:9px;padding:8px 10px;font:800 12px system-ui;cursor:pointer}#ccMiniHeader button.primary{background:#0f766e;color:#fff}',
'#ccMiniFrame{width:100%;height:100%;border:0;min-height:0;flex:1}',
'#ccMiniSelection{position:absolute;inset:0;z-index:1100;cursor:crosshair;touch-action:none;background:#0f766e11}',
'#ccMiniRect{position:absolute;border:2px dashed #0f766e;pointer-events:none;background:#0f766e22}',
'#ccMiniHint{position:fixed;bottom:12px;left:50%;transform:translateX(-50%);z-index:2147483201;color:#fff;background:#17324d;border-radius:12px;padding:10px 14px;font:800 13px system-ui;box-shadow:0 5px 22px #0004;max-width:95vw;text-align:center}',
'#ccMiniSelectQuick{background:#def6ef!important;color:#075c56!important;border:1px solid #0f766e!important}',
'@media(max-width:700px){#ccMiniHeader strong{width:100%}#ccMiniBox{height:99dvh}#ccMiniHeader button{padding:6px 7px}}'
].join('\n');document.head.appendChild(css);
const main=document.createElement('button');main.id='ccMiniOpen';main.type='button';main.className='btn soft';main.textContent='▣ Mini Whiteboard';main.title='Open teacher classroom dashboard';
const after=$('openDocumentBtn');if(after)after.insertAdjacentElement('afterend',main);else tools.appendChild(main);
const modal=document.createElement('div');modal.id='ccMiniModal';modal.hidden=true;modal.innerHTML='<div id="ccMiniBox" role="dialog" aria-label="Mini Whiteboard classroom"><div id="ccMiniHeader"><strong>▣ Mini Whiteboard</strong><button class="primary" id="ccMiniChoose">✂ Select Question from Textbook</button><button id="ccMiniReturn">← Back to Textbook</button><button id="ccMiniExit">Close</button></div><iframe title="Mini Whiteboard classroom" id="ccMiniFrame"></iframe></div>';document.body.appendChild(modal);
const frame=$('ccMiniFrame');let loaded=false,pending=null,sourceName='Textbook',selection=null,selecting=false,active=null;
const overlay=document.createElement('div');overlay.id='ccMiniSelection';overlay.hidden=true;overlay.innerHTML='<div id="ccMiniRect"></div>';wrap.appendChild(overlay);const mark=$('ccMiniRect');
const hint=document.createElement('div');hint.id='ccMiniHint';hint.hidden=true;document.body.appendChild(hint);
function toast(s){hint.textContent=s;hint.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>{if(!selecting)hint.hidden=true},4300)}
function sendCrop(){if(loaded&&pending&&frame.contentWindow)frame.contentWindow.postMessage(pending,location.origin)}
function show(){modal.hidden=false;main.classList.add('active');if(!frame.getAttribute('src'))frame.src='./mini-whiteboard-classroom.html?embedded=1';sendCrop()}
function hide(){modal.hidden=true;main.classList.remove('active')}
frame.addEventListener('load',()=>{loaded=true;sendCrop()});
window.addEventListener('message',e=>{if(e.origin===location.origin&&e.source===frame.contentWindow&&e.data?.type==='ccMiniQuestionAccepted'&&pending?.id===e.data.id){pending=null;toast('Question transferred. Set the answer and launch in Mini Whiteboard.')}});
main.onclick=show;$('ccMiniExit').onclick=hide;$('ccMiniReturn').onclick=hide;
$('ccMiniChoose').onclick=()=>{hide();startSelection()};
window.addEventListener('cc-document-opened',e=>{sourceName=e.detail?.file?.name||'Textbook'});
function getSource(){
 if(!document.body.classList.contains('document-open-mode'))return null;
 const under=$('documentUnderlay');if(!under||getComputedStyle(under).display==='none')return null;
 const pdf=$('documentPdfCanvas');if(pdf?.width&&getComputedStyle(pdf).display!=='none')return{el:pdf,w:pdf.width,h:pdf.height};
 const img=document.querySelector('#documentGenericViewport img.documentGenericImage');
 if(img?.complete&&img.naturalWidth)return{el:img,w:img.naturalWidth,h:img.naturalHeight};
 return null;
}
function startSelection(){
 active=getSource();if(!active){toast('Open a PDF textbook or image in Whiteboard Smart first.');return}
 selecting=true;selection=null;overlay.hidden=false;mark.style.display='none';hint.textContent='Drag around a question. Press Esc to cancel.';hint.hidden=false;
}
function stop(){selecting=false;selection=null;active=null;overlay.hidden=true;mark.style.display='none';hint.hidden=true}
function point(e){const r=wrap.getBoundingClientRect();return{x:Math.max(0,Math.min(r.width,e.clientX-r.left)),y:Math.max(0,Math.min(r.height,e.clientY-r.top))}}
function paint(){if(!selection)return;const a=selection.a,b=selection.b;Object.assign(mark.style,{display:'block',left:Math.min(a.x,b.x)+'px',top:Math.min(a.y,b.y)+'px',width:Math.abs(a.x-b.x)+'px',height:Math.abs(a.y-b.y)+'px'})}
overlay.addEventListener('pointerdown',e=>{if(!selecting)return;e.preventDefault();e.stopPropagation();overlay.setPointerCapture(e.pointerId);selection={a:point(e),b:point(e)};paint()});
overlay.addEventListener('pointermove',e=>{if(!selection||!overlay.hasPointerCapture(e.pointerId))return;selection.b=point(e);paint()});
overlay.addEventListener('pointercancel',()=>{selection=null;mark.style.display='none'});
overlay.addEventListener('pointerup',e=>{
 if(!selecting||!selection||!active)return;selection.b=point(e);
 const board=wrap.getBoundingClientRect(),r=active.el.getBoundingClientRect(),a=selection.a,b=selection.b;
 const left=Math.max(r.left,board.left+Math.min(a.x,b.x)),right=Math.min(r.right,board.left+Math.max(a.x,b.x)),top=Math.max(r.top,board.top+Math.min(a.y,b.y)),bottom=Math.min(r.bottom,board.top+Math.max(a.y,b.y));
 if(right-left<12||bottom-top<12){selection=null;mark.style.display='none';toast('Select a larger area inside the textbook page.');return}
 try{
  const scale=Math.min(1,1700/(right-left),1300/(bottom-top));const out=document.createElement('canvas');out.width=Math.max(1,Math.round((right-left)*scale));out.height=Math.max(1,Math.round((bottom-top)*scale));const ctx=out.getContext('2d',{alpha:false});
  ctx.fillStyle='white';ctx.fillRect(0,0,out.width,out.height);
  ctx.drawImage(active.el,(left-r.left)/r.width*active.w,(top-r.top)/r.height*active.h,(right-left)/r.width*active.w,(bottom-top)/r.height*active.h,0,0,out.width,out.height);
  const ink=$('board'),ir=ink?.getBoundingClientRect();if(ink?.width&&ir?.width)ctx.drawImage(ink,(left-ir.left)/ir.width*ink.width,(top-ir.top)/ir.height*ink.height,(right-left)/ir.width*ink.width,(bottom-top)/ir.height*ink.height,0,0,out.width,out.height);
  let image=out.toDataURL('image/png');if(image.length>1100000)image=out.toDataURL('image/jpeg',.83);
  if(image.length>1800000)throw Error('Selected area too large. Please select a smaller question.');
  pending={type:'ccMiniWhiteboardQuestion',id:String(Date.now())+Math.random().toString(36).slice(2),image,filename:sourceName,page:Number(document.querySelector('#documentQuickBar input[type=number]')?.value||1)};
  stop();show();sendCrop();
 }catch(err){stop();toast('Could not select question: '+(err.message||String(err)))}
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&selecting){e.preventDefault();e.stopImmediatePropagation();stop()}},true);
function addQuick(){const bar=$('documentQuickBar');if(!bar||$('ccMiniSelectQuick'))return;const b=document.createElement('button');b.type='button';b.id='ccMiniSelectQuick';b.textContent='✂ Select Q';b.title='Select a question on this textbook page';b.onclick=startSelection;bar.insertBefore(b,bar.lastElementChild)}
addQuick();new MutationObserver(addQuick).observe(document.body,{childList:true,subtree:false});
window.MiniWhiteboard={open:show,selectQuestion:startSelection};
})();