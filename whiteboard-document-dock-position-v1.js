(function(){
'use strict';
const STYLE_ID='documentDockLowerStyles';
function ensureStyle(){
 if(document.getElementById(STYLE_ID))return;
 const s=document.createElement('style');s.id=STYLE_ID;
 s.textContent=`
#documentQuickBar{top:var(--document-dock-top,64px)!important;bottom:auto!important;transform:none!important;max-height:calc(100vh - var(--document-dock-top,64px) - 8px)!important}
#documentSearchPanel{top:var(--document-dock-top,64px)!important;bottom:auto!important;transform:none!important;max-height:calc(100vh - var(--document-dock-top,64px) - 8px)!important;overflow:auto!important}
`;
 document.head.appendChild(s);
}
function placeDock(){
 ensureStyle();
 const header=document.querySelector('.top');
 const bottom=header?.getBoundingClientRect().bottom||52;
 const y=Math.max(64,Math.round(bottom+10));
 document.documentElement.style.setProperty('--document-dock-top',`${y}px`);
}
placeDock();
window.addEventListener('resize',placeDock);
const header=document.querySelector('.top');
if(header&&window.ResizeObserver)new ResizeObserver(placeDock).observe(header);
new MutationObserver(placeDock).observe(document.body,{childList:true,subtree:true});
})();

/* Seamless vertical PDF page handoff for MOE Safe Beta. */
(function(){
'use strict';
const STYLE_ID='documentSeamlessPageStylesV1';
let board,layer,ink,pdf,bar,pageBox,prevBtn,nextBtn;
let shownPage=1,pending=null,paintSerial=0,ctxWrapped=false,stableTimer=0;
const DURATION=280;

function ensureStyle(){
 if(document.getElementById(STYLE_ID))return;
 const s=document.createElement('style');s.id=STYLE_ID;
 s.textContent=`
#boardWrap.document-seamless-active{isolation:isolate}
#boardWrap.document-seamless-active.doc-turn-next #documentUnderlay,
#boardWrap.document-seamless-active.doc-turn-next #board,
#boardWrap.document-seamless-active.doc-turn-prev #documentUnderlay,
#boardWrap.document-seamless-active.doc-turn-prev #board{animation:none!important}
.document-seamless-snapshot{position:absolute;inset:0;z-index:40;overflow:hidden;pointer-events:none;contain:layout paint;will-change:transform;transform:translate3d(0,0,0)}
@media (prefers-reduced-motion:reduce){.document-seamless-snapshot{transition-duration:1ms!important}}
`;
 document.head.appendChild(s);
}
function active(){return document.body.classList.contains('document-open-mode')}
function pdfVisible(){return !!(pdf&&getComputedStyle(pdf).display!=='none')}
function pageNow(){return Math.max(1,+pageBox?.value||1)}
function pageMax(){return Math.max(1,+pageBox?.max||1)}
function stripIds(root){if(!root)return;root.removeAttribute?.('id');root.querySelectorAll?.('[id]').forEach(el=>el.removeAttribute('id'))}
function copyCanvases(srcRoot,dstRoot){
 const src=[...srcRoot.querySelectorAll('canvas')],dst=[...dstRoot.querySelectorAll('canvas')];
 src.forEach((c,i)=>{const d=dst[i];if(!d)return;try{d.width=c.width;d.height=c.height;d.getContext('2d')?.drawImage(c,0,0)}catch{}})
}
function makeSnapshot(){
 if(!board||!layer||!ink)return null;
 const shot=document.createElement('div');shot.className='document-seamless-snapshot';
 const bg=getComputedStyle(board).backgroundColor;shot.style.background=bg||'#fff';
 const layerClone=layer.cloneNode(true);copyCanvases(layer,layerClone);stripIds(layerClone);
 Object.assign(layerClone.style,{position:'absolute',inset:'0',display:'block',pointerEvents:'none'});
 const inkClone=ink.cloneNode(true);stripIds(inkClone);try{inkClone.width=ink.width;inkClone.height=ink.height;inkClone.getContext('2d')?.drawImage(ink,0,0)}catch{}
 Object.assign(inkClone.style,{position:'absolute',inset:'0',width:'100%',height:'100%',zIndex:'5',pointerEvents:'none'});
 shot.append(layerClone,inkClone);board.appendChild(shot);return shot;
}
function saveInline(el){return {transition:el.style.transition,transform:el.style.transform,willChange:el.style.willChange}}
function restoreInline(el,s){if(!el||!s)return;el.style.transition=s.transition;el.style.transform=s.transform;el.style.willChange=s.willChange}
function cancelPending(showLive=true){
 if(!pending)return;
 clearTimeout(pending.fallback);clearTimeout(pending.cleanup);
 if(showLive){restoreInline(layer,pending.layerStyle);restoreInline(ink,pending.inkStyle)}
 pending.shot?.remove();board?.classList.remove('document-seamless-active');
 pending=null;
}
function finishTurn(token){
 const p=pending;if(!p||p.token!==token||p.started)return;p.started=true;
 requestAnimationFrame(()=>requestAnimationFrame(()=>{
  if(!pending||pending.token!==token)return;
  const dur=matchMedia('(prefers-reduced-motion: reduce)').matches?1:DURATION;
  const ease='cubic-bezier(.22,.61,.36,1)';
  const oldTo=p.dir>0?'-100%':'100%';
  [layer,ink].forEach(el=>{el.style.transition=`transform ${dur}ms ${ease}`;el.style.transform='translate3d(0,0,0)';el.style.willChange='transform'});
  p.shot.style.transition=`transform ${dur}ms ${ease}`;p.shot.style.transform=`translate3d(0,${oldTo},0)`;
  p.cleanup=setTimeout(()=>{
   if(!pending||pending.token!==token)return;
   shownPage=p.target;restoreInline(layer,p.layerStyle);restoreInline(ink,p.inkStyle);p.shot.remove();board.classList.remove('document-seamless-active');pending=null;
  },dur+40);
 }))
}
function beginTurn(dir,target){
 if(!active()||!pdfVisible()||!pageBox)return false;
 const from=shownPage||pageNow();target=Math.max(1,Math.min(pageMax(),Math.round(target)||from));
 if(target===from)return false;
 cancelPending(true);
 const shot=makeSnapshot();if(!shot)return false;
 const token=Symbol('pageTurn'),off=dir>0?'100%':'-100%';
 const layerStyle=saveInline(layer),inkStyle=saveInline(ink);
 pending={token,dir:dir>0?1:-1,target,shot,layerStyle,inkStyle,serial:paintSerial,started:false,fallback:0,cleanup:0};
 board.classList.add('document-seamless-active');
 [layer,ink].forEach(el=>{el.style.transition='none';el.style.transform=`translate3d(0,${off},0)`;el.style.willChange='transform'});
 pending.fallback=setTimeout(()=>finishTurn(token),520);
 return true;
}
function instrumentPdf(){
 if(!pdf||ctxWrapped)return;
 try{
  const ctx=pdf.getContext('2d');if(!ctx)return;
  const original=ctx.drawImage;
  if(typeof original!=='function')return;
  ctx.drawImage=function(){const out=original.apply(this,arguments);paintSerial++;const p=pending;if(p&&paintSerial>p.serial)finishTurn(p.token);return out};
  ctxWrapped=true;
 }catch{}
}
function wireControls(){
 if(!bar||!pageBox)return;
 if(!pageBox.dataset.seamlessPageV1){
  pageBox.dataset.seamlessPageV1='1';
  pageBox.addEventListener('focus',()=>{shownPage=pageNow()});
  pageBox.addEventListener('change',()=>{
   if(pending)return;
   const to=pageNow(),from=shownPage||to;if(to!==from)beginTurn(to>from?1:-1,to);
  },true);
 }
 if(prevBtn&&!prevBtn.dataset.seamlessPageV1){prevBtn.dataset.seamlessPageV1='1';prevBtn.addEventListener('click',()=>{if(!prevBtn.disabled)beginTurn(-1,pageNow()-1)},true)}
 if(nextBtn&&!nextBtn.dataset.seamlessPageV1){nextBtn.dataset.seamlessPageV1='1';nextBtn.addEventListener('click',()=>{if(!nextBtn.disabled)beginTurn(1,pageNow()+1)},true)}
}
function find(){
 board=document.getElementById('boardWrap');layer=document.getElementById('documentUnderlay');ink=document.getElementById('board');pdf=document.getElementById('documentPdfCanvas');bar=document.getElementById('documentQuickBar');
 if(!board||!layer||!ink||!pdf||!bar)return false;
 pageBox=bar.querySelector('input[type=number]');if(!pageBox)return false;
 const buttons=[...bar.querySelectorAll('button')];prevBtn=buttons.find(b=>/^Previous page/i.test(b.title||''));nextBtn=buttons.find(b=>/^Next page/i.test(b.title||''));
 ensureStyle();instrumentPdf();wireControls();
 if(!pending&&document.activeElement!==pageBox)shownPage=pageNow();
 return true;
}
function maintain(){
 if(!active()){cancelPending(true);shownPage=1;ctxWrapped=false}
 else find();
 stableTimer=requestAnimationFrame(maintain)
}
ensureStyle();find();
new MutationObserver(()=>find()).observe(document.body,{childList:true,subtree:true});
stableTimer=requestAnimationFrame(maintain);
})();
