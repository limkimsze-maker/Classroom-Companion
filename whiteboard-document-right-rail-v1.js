(function(){
'use strict';
const STYLE_ID='documentRightRailStylesV1';
let bar,pageBox,pageTotal,zoomLabel,minusBtn,plusBtn,searchBtn,interactBtn,reopenBtn,closeBtn,penBtn,handBtn;
let railTop,zoomRow,dial,dialStage,dialProgress,dialThumb,dialReadout,dialTotal,dialBubble,dialMarks,railModes,railActions;
let dragging=false,previewPage=1,lastPage=0,lastMax=0,lastZoom='';

function ensureStyle(){
 if(document.getElementById(STYLE_ID))return;
 const s=document.createElement('style');s.id=STYLE_ID;
 s.textContent=`
#documentQuickBar.document-right-rail{
 position:fixed!important;left:auto!important;right:12px!important;top:var(--document-dock-top,72px)!important;bottom:12px!important;
 width:108px!important;max-height:none!important;height:auto!important;transform:none!important;z-index:320!important;
 display:flex!important;flex-direction:column!important;align-items:stretch!important;justify-content:flex-start!important;gap:8px!important;
 padding:10px 9px!important;border:1px solid rgba(15,118,110,.24)!important;border-radius:22px!important;
 background:linear-gradient(180deg,rgba(255,255,255,.97),rgba(244,250,249,.96))!important;
 box-shadow:0 16px 42px rgba(23,50,77,.18),inset 0 1px 0 rgba(255,255,255,.9)!important;
 backdrop-filter:blur(14px);overflow:visible!important;
}
body:not(.document-open-mode) #documentQuickBar.document-right-rail{display:none!important}
#documentQuickBar.document-right-rail>input[type=number],#documentQuickBar.document-right-rail>.document-page-total,
#documentQuickBar.document-right-rail>.document-page-nav-hidden{display:none!important}
#documentQuickBar.document-right-rail button{min-width:0!important;min-height:38px!important;border-radius:12px!important;font-weight:950!important}
.doc-rail-section{display:flex;flex-direction:column;gap:6px}
.doc-rail-kicker{font-size:9px;line-height:1;text-align:center;font-weight:1000;letter-spacing:.12em;color:#718096;text-transform:uppercase}
#documentRailZoomRow{display:grid;grid-template-columns:30px 1fr 30px;align-items:center;gap:4px;padding:4px;border:1px solid #dce8e6;border-radius:14px;background:#f7fbfa}
#documentRailZoomRow button{width:30px!important;height:32px!important;min-height:32px!important;padding:0!important;font-size:18px!important;background:#fff!important}
#documentRailZoomRow .doc-zoom-value{font-size:11px;font-weight:1000;text-align:center;color:#17324d;white-space:nowrap}
#documentQuickBar.document-right-rail .doc-search-main{width:100%!important;background:#e7f7f4!important;border-color:#93d5cc!important;color:#0a5d57!important;font-size:18px!important}
#documentPageDial{position:relative;display:flex;flex:1 1 auto;min-height:260px;max-height:520px;flex-direction:column;align-items:stretch;gap:7px;padding:9px 7px 8px;border-radius:18px;border:1px solid #d8e8e5;background:linear-gradient(180deg,#fbfefd,#edf7f5);box-shadow:inset 0 1px 0 #fff,inset 0 -10px 20px rgba(15,118,110,.035)}
#documentPageDial .dial-head{display:flex;align-items:baseline;justify-content:center;gap:4px;min-height:35px}
#documentPageDial .dial-head strong{font-size:23px;line-height:1;font-weight:1000;color:#0f766e;letter-spacing:-.05em}
#documentPageDial .dial-head span{font-size:10px;font-weight:900;color:#70808b}
#documentPageDial .dial-stage{position:relative;flex:1;min-height:185px;border-radius:16px;touch-action:none;user-select:none;cursor:ns-resize;background:linear-gradient(90deg,#e9f2f1 0,#f8fcfb 42%,#fff 50%,#f8fcfb 58%,#e9f2f1 100%);box-shadow:inset 0 2px 7px rgba(23,50,77,.11),inset 0 -2px 7px rgba(23,50,77,.05)}
#documentPageDial .dial-stage::before{content:'';position:absolute;left:50%;top:10px;bottom:10px;width:4px;transform:translateX(-50%);border-radius:99px;background:#d5e2e0;box-shadow:inset 0 1px 2px rgba(23,50,77,.16)}
#documentPageDial .dial-progress{position:absolute;left:50%;top:10px;width:4px;height:0;transform:translateX(-50%);border-radius:99px;background:linear-gradient(180deg,#49b8aa,#0f766e);box-shadow:0 0 0 1px rgba(15,118,110,.08),0 0 10px rgba(15,118,110,.18)}
#documentPageDial .dial-marks{position:absolute;inset:10px 4px;pointer-events:none}
#documentPageDial .dial-mark{position:absolute;left:50%;width:30px;height:1px;transform:translate(-50%,-50%);background:#aebfbd}
#documentPageDial .dial-mark.major{width:44px;height:2px;background:#789b96}
#documentPageDial .dial-mark span{position:absolute;right:31px;top:50%;transform:translateY(-50%);font-size:8px;font-weight:950;color:#72817f;white-space:nowrap}
#documentPageDial .dial-mark.major span{right:38px;color:#3f5c58}
#documentPageDial .dial-thumb{position:absolute;left:50%;top:10px;width:42px;height:42px;transform:translate(-50%,-50%);border-radius:15px;border:1px solid #0f766e;background:linear-gradient(145deg,#20a392,#0f766e);box-shadow:0 7px 14px rgba(15,118,110,.28),inset 0 1px 0 rgba(255,255,255,.38);display:grid;place-items:center;z-index:3;transition:top .12s ease-out,transform .12s ease-out;pointer-events:none}
#documentPageDial.dragging .dial-thumb{transition:none;transform:translate(-50%,-50%) scale(1.08);box-shadow:0 9px 18px rgba(15,118,110,.34),0 0 0 4px rgba(15,118,110,.12),inset 0 1px 0 rgba(255,255,255,.4)}
#documentPageDial .dial-grip{width:18px;height:14px;border-top:2px solid rgba(255,255,255,.9);border-bottom:2px solid rgba(255,255,255,.9);position:relative}
#documentPageDial .dial-grip::after{content:'';position:absolute;left:0;right:0;top:5px;border-top:2px solid rgba(255,255,255,.9)}
#documentPageDial .dial-bubble{position:absolute;right:calc(100% + 8px);top:10px;transform:translateY(-50%);min-width:54px;padding:8px 9px;border-radius:14px;background:#17324d;color:white;font-size:12px;font-weight:1000;text-align:center;box-shadow:0 8px 18px rgba(23,50,77,.22);opacity:0;pointer-events:none;transition:opacity .12s,top .12s ease-out}
#documentPageDial.dragging .dial-bubble{opacity:1;transition:opacity .12s}
#documentPageDial .dial-bubble::after{content:'';position:absolute;left:100%;top:50%;transform:translateY(-50%);border:6px solid transparent;border-left-color:#17324d}
#documentPageDial .dial-foot{display:flex;align-items:center;justify-content:center;gap:4px;font-size:9px;font-weight:900;color:#718096}
#documentPageDial .dial-foot b{color:#0f766e;font-size:11px}
#documentRailModes{display:grid;grid-template-columns:1fr 1fr;gap:5px}
#documentRailModes button{padding:5px!important;font-size:16px!important}
#documentRailActions{display:grid;grid-template-columns:1fr 1fr;gap:5px;padding-top:2px;border-top:1px solid #e4ecea}
#documentRailActions button{padding:5px!important;font-size:15px!important}
#documentSearchPanel{right:132px!important;left:auto!important;top:var(--document-dock-top,72px)!important;bottom:auto!important;transform:none!important;z-index:330!important;border-radius:16px!important;box-shadow:0 14px 34px rgba(23,50,77,.18)!important}
@media(max-width:800px){
 #documentQuickBar.document-right-rail{right:7px!important;top:var(--document-dock-top,64px)!important;bottom:7px!important;width:96px!important;padding:8px 7px!important;border-radius:18px!important;gap:6px!important}
 #documentPageDial{min-height:220px;padding:7px 5px}
 #documentPageDial .dial-thumb{width:40px;height:40px}
 #documentSearchPanel{right:110px!important;max-width:calc(100vw - 120px)!important}
}
`;
 document.head.appendChild(s);
}
function titleHas(b,s){return (b?.title||'').toLowerCase().includes(s)}
function findControls(){
 bar=document.getElementById('documentQuickBar');if(!bar)return false;
 pageBox=bar.querySelector('input[type=number]');if(!pageBox)return false;
 const buttons=[...bar.querySelectorAll('button')],spans=[...bar.querySelectorAll('span')];
 minusBtn=buttons.find(b=>b.textContent.trim()==='−');plusBtn=buttons.find(b=>b.textContent.trim()==='+');
 searchBtn=buttons.find(b=>titleHas(b,'search document')||(b.textContent||'').includes('🔎'));
 interactBtn=buttons.find(b=>titleHas(b,'interact with displayed content')||titleHas(b,'return to annotation mode'));
 reopenBtn=buttons.find(b=>titleHas(b,'replace file')||titleHas(b,'open another file'));
 closeBtn=buttons.find(b=>titleHas(b,'close document'));
 penBtn=document.getElementById('documentPenModeBtn');handBtn=document.getElementById('documentTouchNavBtn');
 zoomLabel=spans.find(s=>/%$/.test((s.textContent||'').trim()));
 pageTotal=spans.find(s=>/^\/\s*\d+/.test((s.textContent||'').trim()));
 const prev=buttons.find(b=>titleHas(b,'previous page'));const next=buttons.find(b=>titleHas(b,'next page'));
 if(prev)prev.classList.add('document-page-nav-hidden');if(next)next.classList.add('document-page-nav-hidden');
 if(pageBox)pageBox.classList.add('document-page-nav-hidden');if(pageTotal)pageTotal.classList.add('document-page-total');
 return true;
}
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n}
function ensureRail(){
 if(!findControls())return false;ensureStyle();bar.classList.add('document-right-rail');
 if(!railTop){
  railTop=el('div','doc-rail-section');railTop.id='documentRailTop';railTop.appendChild(el('div','doc-rail-kicker','Zoom'));
  zoomRow=el('div');zoomRow.id='documentRailZoomRow';railTop.appendChild(zoomRow);
  bar.prepend(railTop);
 }
 if(minusBtn&&minusBtn.parentElement!==zoomRow)zoomRow.appendChild(minusBtn);
 if(zoomLabel){zoomLabel.classList.add('doc-zoom-value');if(zoomLabel.parentElement!==zoomRow)zoomRow.appendChild(zoomLabel)}
 if(plusBtn&&plusBtn.parentElement!==zoomRow)zoomRow.appendChild(plusBtn);
 if(searchBtn){searchBtn.classList.add('doc-search-main');searchBtn.textContent='🔎';searchBtn.setAttribute('aria-label','Search document');if(searchBtn.parentElement!==railTop)railTop.appendChild(searchBtn)}
 if(!dial){
  dial=el('div');dial.id='documentPageDial';
  const kicker=el('div','doc-rail-kicker','Pages');
  const head=el('div','dial-head');dialReadout=el('strong',null,'1');dialTotal=el('span',null,'/ 1');head.append(dialReadout,dialTotal);
  dialStage=el('div','dial-stage');dialStage.setAttribute('role','slider');dialStage.setAttribute('aria-label','Page dial');dialStage.tabIndex=0;
  dialProgress=el('div','dial-progress');dialMarks=el('div','dial-marks');dialThumb=el('div','dial-thumb');dialThumb.appendChild(el('div','dial-grip'));
  dialBubble=el('div','dial-bubble','Page 1');dialStage.append(dialProgress,dialMarks,dialThumb,dialBubble);
  const foot=el('div','dial-foot');foot.innerHTML='<b>↕</b><span>drag to page</span>';
  dial.append(kicker,head,dialStage,foot);bar.appendChild(dial);wireDial();
 }
 if(!railModes){railModes=el('div');railModes.id='documentRailModes';bar.appendChild(railModes)}
 [penBtn,handBtn,interactBtn].forEach(b=>{if(b&&b.parentElement!==railModes)railModes.appendChild(b)});
 if(!railActions){railActions=el('div');railActions.id='documentRailActions';bar.appendChild(railActions)}
 [reopenBtn,closeBtn].forEach(b=>{if(b&&b.parentElement!==railActions)railActions.appendChild(b)});
 return true;
}
function maxPage(){return Math.max(1,+pageBox?.max||parseInt((pageTotal?.textContent||'1').replace(/\D/g,''),10)||1)}
function currentPage(){return Math.max(1,Math.min(maxPage(),+pageBox?.value||1))}
function pctFor(p,m){return m<=1?0:(p-1)/(m-1)}
function setVisual(p,preview){
 const m=maxPage(),pct=pctFor(p,m),top=10+pct*Math.max(0,(dialStage?.clientHeight||205)-20);
 dialReadout.textContent=String(p);dialTotal.textContent=`/ ${m}`;dialBubble.textContent=`Page ${p}`;
 dialThumb.style.top=`${top}px`;dialBubble.style.top=`${top}px`;dialProgress.style.height=`${Math.max(0,top-10)}px`;
 dialStage?.setAttribute('aria-valuemin','1');dialStage?.setAttribute('aria-valuemax',String(m));dialStage?.setAttribute('aria-valuenow',String(p));dialStage?.setAttribute('aria-valuetext',`Page ${p} of ${m}`);
 if(!preview)previewPage=p;
}
function renderMarks(m){
 if(!dialMarks)return;dialMarks.innerHTML='';
 let pages=[];
 if(m<=12){pages=Array.from({length:m},(_,i)=>i+1)}
 else{
  const count=Math.min(13,Math.max(7,Math.round(Math.sqrt(m)*1.7)));
  for(let i=0;i<count;i++)pages.push(Math.round(1+(m-1)*i/(count-1)));
  pages=[...new Set(pages)];
 }
 const majors=new Set([1,m,Math.max(1,Math.round((m+1)/2)),Math.max(1,Math.round(1+(m-1)/4)),Math.max(1,Math.round(1+3*(m-1)/4))]);
 pages.forEach(p=>{
  const mark=el('div','dial-mark'+(majors.has(p)?' major':''));mark.style.top=`${pctFor(p,m)*100}%`;
  if(m<=12||majors.has(p)){const lab=el('span',null,String(p));mark.appendChild(lab)}dialMarks.appendChild(mark);
 });
}
function commit(p){
 const m=maxPage();p=Math.max(1,Math.min(m,Math.round(p)));setVisual(p,false);
 if(currentPage()===p)return;
 pageBox.value=String(p);pageBox.dispatchEvent(new Event('change',{bubbles:true}));
}
function pageFromClientY(y){
 const r=dialStage.getBoundingClientRect(),usable=Math.max(1,r.height-20),ratio=Math.max(0,Math.min(1,(y-r.top-10)/usable));
 return Math.max(1,Math.min(maxPage(),Math.round(1+ratio*(maxPage()-1))));
}
function beginDrag(e){
 if(!document.body.classList.contains('document-open-mode'))return;e.preventDefault();e.stopPropagation();dragging=true;dial.classList.add('dragging');try{dialStage.setPointerCapture(e.pointerId)}catch{}previewPage=pageFromClientY(e.clientY);setVisual(previewPage,true);
}
function moveDrag(e){if(!dragging)return;e.preventDefault();previewPage=pageFromClientY(e.clientY);setVisual(previewPage,true)}
function endDrag(e){if(!dragging)return;e.preventDefault();dragging=false;dial.classList.remove('dragging');try{dialStage.releasePointerCapture(e.pointerId)}catch{}commit(previewPage)}
function wireDial(){
 dialStage.addEventListener('pointerdown',beginDrag);dialStage.addEventListener('pointermove',moveDrag);dialStage.addEventListener('pointerup',endDrag);dialStage.addEventListener('pointercancel',endDrag);
 dialStage.addEventListener('keydown',e=>{let p=currentPage();if(e.key==='ArrowUp'||e.key==='PageUp')p--;else if(e.key==='ArrowDown'||e.key==='PageDown')p++;else if(e.key==='Home')p=1;else if(e.key==='End')p=maxPage();else return;e.preventDefault();commit(p)});
 dialStage.addEventListener('wheel',e=>{e.preventDefault();commit(currentPage()+(e.deltaY>0?1:-1))},{passive:false});
}
function sync(force=false){
 if(!pageBox||!dial)return;
 const p=currentPage(),m=maxPage(),z=(zoomLabel?.textContent||'').trim(),maxChanged=m!==lastMax;
 if(force||maxChanged){lastMax=m;renderMarks(m)}
 if(!dragging&&(force||p!==lastPage||maxChanged)){lastPage=p;setVisual(p,false)}
 if(force||z!==lastZoom){lastZoom=z;if(zoomLabel)zoomLabel.title=`Zoom ${z}`}
}
function maintain(){
 if(ensureRail())sync(false);requestAnimationFrame(maintain)
}
ensureStyle();if(ensureRail())sync(true);
new MutationObserver(()=>{if(ensureRail())sync(false)}).observe(document.body,{childList:true,subtree:true});
requestAnimationFrame(maintain);
})();
