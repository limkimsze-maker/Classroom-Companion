(function(){
'use strict';
const STYLE_ID='documentRightRailStylesV2';
let bar,pageBox,pageTotal,zoomLabel,minusBtn,plusBtn,searchBtn,interactBtn,reopenBtn,closeBtn,penBtn,handBtn;
let dial,dialStage,dialProgress,dialThumb,dialReadout,dialTotal,dialBubble,dialMarks;
let dragging=false,previewPage=1,lastPage=-1,lastMax=-1,lastZoom='';
let dialWheelY=null,dialWheelTimer=0,dialWheelLast=0;

function style(){
 if(document.getElementById(STYLE_ID))return;
 const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
#documentQuickBar.document-right-rail{position:fixed!important;left:auto!important;right:12px!important;top:var(--document-dock-top,72px)!important;bottom:12px!important;width:108px!important;max-height:none!important;height:auto!important;transform:none!important;z-index:320!important;display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:8px!important;padding:10px 9px!important;border:1px solid rgba(15,118,110,.24)!important;border-radius:22px!important;background:linear-gradient(180deg,rgba(255,255,255,.98),rgba(241,249,247,.97))!important;box-shadow:0 16px 42px rgba(23,50,77,.18),inset 0 1px 0 #fff!important;backdrop-filter:blur(14px);overflow:visible!important}
body:not(.document-open-mode) #documentQuickBar.document-right-rail{display:none!important}
#documentQuickBar.document-right-rail>.document-page-nav-hidden,#documentQuickBar.document-right-rail>.document-page-total{display:none!important}
#documentQuickBar.document-right-rail button{min-width:0!important;min-height:38px!important;border-radius:12px!important;font-weight:950!important}
.doc-rail-section{display:flex;flex-direction:column;gap:6px}.doc-rail-kicker{font-size:9px;line-height:1;text-align:center;font-weight:1000;letter-spacing:.12em;color:#718096;text-transform:uppercase}
#documentRailZoomRow{display:grid;grid-template-columns:30px 1fr 30px;align-items:center;gap:4px;padding:4px;border:1px solid #dce8e6;border-radius:14px;background:#f7fbfa}
#documentRailZoomRow button{width:30px!important;height:32px!important;min-height:32px!important;padding:0!important;font-size:18px!important;background:#fff!important}
#documentRailZoomRow .doc-zoom-value{font-size:11px;font-weight:1000;text-align:center;color:#17324d;white-space:nowrap}
#documentQuickBar.document-right-rail .doc-search-main{width:100%!important;background:#e7f7f4!important;border-color:#93d5cc!important;color:#0a5d57!important;font-size:18px!important}
#documentPageDial{position:relative;display:flex;flex:1 1 auto;min-height:250px;max-height:520px;flex-direction:column;gap:7px;padding:9px 7px 8px;border-radius:18px;border:1px solid #d8e8e5;background:linear-gradient(180deg,#fbfefd,#edf7f5);box-shadow:inset 0 1px 0 #fff,inset 0 -10px 20px rgba(15,118,110,.035)}
#documentPageDial .dial-head{display:flex;align-items:baseline;justify-content:center;gap:4px;min-height:35px}#documentPageDial .dial-head strong{font-size:23px;line-height:1;font-weight:1000;color:#0f766e;letter-spacing:-.05em}#documentPageDial .dial-head span{font-size:10px;font-weight:900;color:#70808b}
#documentPageDial .dial-stage{position:relative;flex:1;min-height:180px;border-radius:16px;touch-action:none;user-select:none;cursor:ns-resize;background:linear-gradient(90deg,#e9f2f1 0,#f8fcfb 42%,#fff 50%,#f8fcfb 58%,#e9f2f1 100%);box-shadow:inset 0 2px 7px rgba(23,50,77,.11),inset 0 -2px 7px rgba(23,50,77,.05)}
#documentPageDial .dial-stage::before{content:'';position:absolute;left:50%;top:10px;bottom:10px;width:4px;transform:translateX(-50%);border-radius:99px;background:#d5e2e0;box-shadow:inset 0 1px 2px rgba(23,50,77,.16)}
#documentPageDial .dial-progress{position:absolute;left:50%;top:10px;width:4px;height:0;transform:translateX(-50%);border-radius:99px;background:linear-gradient(180deg,#49b8aa,#0f766e);box-shadow:0 0 10px rgba(15,118,110,.2)}
#documentPageDial .dial-marks{position:absolute;inset:10px 4px;pointer-events:none}#documentPageDial .dial-mark{position:absolute;left:50%;width:30px;height:1px;transform:translate(-50%,-50%);background:#aebfbd}#documentPageDial .dial-mark.major{width:44px;height:2px;background:#789b96}#documentPageDial .dial-mark span{position:absolute;right:31px;top:50%;transform:translateY(-50%);font-size:8px;font-weight:950;color:#72817f;white-space:nowrap}#documentPageDial .dial-mark.major span{right:38px;color:#3f5c58}
#documentPageDial .dial-thumb{position:absolute;left:50%;top:10px;width:42px;height:42px;transform:translate(-50%,-50%);border-radius:15px;border:1px solid #0f766e;background:linear-gradient(145deg,#20a392,#0f766e);box-shadow:0 7px 14px rgba(15,118,110,.28),inset 0 1px 0 rgba(255,255,255,.38);display:grid;place-items:center;z-index:3;transition:top .12s ease-out,transform .12s ease-out;pointer-events:none}#documentPageDial.dragging .dial-thumb{transition:none;transform:translate(-50%,-50%) scale(1.08);box-shadow:0 9px 18px rgba(15,118,110,.34),0 0 0 4px rgba(15,118,110,.12),inset 0 1px 0 rgba(255,255,255,.4)}
#documentPageDial .dial-grip{width:18px;height:14px;border-top:2px solid rgba(255,255,255,.9);border-bottom:2px solid rgba(255,255,255,.9);position:relative}#documentPageDial .dial-grip::after{content:'';position:absolute;left:0;right:0;top:5px;border-top:2px solid rgba(255,255,255,.9)}
#documentPageDial .dial-bubble{position:absolute;right:calc(100% + 8px);top:10px;transform:translateY(-50%);min-width:58px;padding:8px 9px;border-radius:14px;background:#17324d;color:#fff;font-size:12px;font-weight:1000;text-align:center;box-shadow:0 8px 18px rgba(23,50,77,.22);opacity:0;pointer-events:none;transition:opacity .12s,top .12s ease-out}#documentPageDial.dragging .dial-bubble{opacity:1;transition:opacity .12s}#documentPageDial .dial-bubble::after{content:'';position:absolute;left:100%;top:50%;transform:translateY(-50%);border:6px solid transparent;border-left-color:#17324d}
#documentPageDial .dial-foot{display:flex;align-items:center;justify-content:center;gap:4px;font-size:9px;font-weight:900;color:#718096}#documentPageDial .dial-foot b{color:#0f766e;font-size:11px}
#documentRailModes,#documentRailActions{display:grid;grid-template-columns:1fr 1fr;gap:5px}#documentRailModes button,#documentRailActions button{padding:5px!important;font-size:15px!important}#documentRailActions{padding-top:2px;border-top:1px solid #e4ecea}
#documentSearchPanel{right:132px!important;left:auto!important;top:var(--document-dock-top,72px)!important;bottom:auto!important;transform:none!important;z-index:330!important;border-radius:16px!important;box-shadow:0 14px 34px rgba(23,50,77,.18)!important}
@media(max-width:800px){#documentQuickBar.document-right-rail{right:7px!important;top:var(--document-dock-top,64px)!important;bottom:7px!important;width:96px!important;padding:8px 7px!important;border-radius:18px!important;gap:6px!important}#documentPageDial{min-height:215px;padding:7px 5px}#documentSearchPanel{right:110px!important;max-width:calc(100vw - 120px)!important}}
`;
 document.head.appendChild(s);
}
const hasTitle=(b,s)=>(b?.title||'').toLowerCase().includes(s);
function findOnce(){
 bar=document.getElementById('documentQuickBar');if(!bar)return false;
 pageBox=bar.querySelector('input[type=number]');if(!pageBox)return false;
 const buttons=[...bar.querySelectorAll('button')],spans=[...bar.querySelectorAll('span')];
 minusBtn=buttons.find(b=>b.textContent.trim()==='−');plusBtn=buttons.find(b=>b.textContent.trim()==='+');
 searchBtn=buttons.find(b=>hasTitle(b,'search document')||(b.textContent||'').includes('🔎'));
 interactBtn=buttons.find(b=>hasTitle(b,'interact with displayed content')||hasTitle(b,'return to annotation mode'));
 reopenBtn=buttons.find(b=>hasTitle(b,'replace file')||hasTitle(b,'open another file'));closeBtn=buttons.find(b=>hasTitle(b,'close document'));
 penBtn=document.getElementById('documentPenModeBtn');handBtn=document.getElementById('documentTouchNavBtn');
 zoomLabel=spans.find(s=>/%$/.test((s.textContent||'').trim()));pageTotal=spans.find(s=>/^\/\s*\d+/.test((s.textContent||'').trim()));
 const prev=buttons.find(b=>hasTitle(b,'previous page')),next=buttons.find(b=>hasTitle(b,'next page'));
 [prev,next,pageBox].forEach(x=>x?.classList.add('document-page-nav-hidden'));pageTotal?.classList.add('document-page-total');
 return !!(minusBtn&&plusBtn&&zoomLabel&&searchBtn);
}
function make(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n}
function build(){
 if(bar?.dataset.rightRailReady==='1')return true;if(!findOnce())return false;style();bar.classList.add('document-right-rail');
 const top=make('div','doc-rail-section');top.id='documentRailTop';top.appendChild(make('div','doc-rail-kicker','Zoom'));
 const zoomRow=make('div');zoomRow.id='documentRailZoomRow';zoomLabel.classList.add('doc-zoom-value');zoomRow.append(minusBtn,zoomLabel,plusBtn);top.appendChild(zoomRow);searchBtn.classList.add('doc-search-main');searchBtn.textContent='🔎';searchBtn.setAttribute('aria-label','Search document');top.appendChild(searchBtn);bar.prepend(top);
 dial=make('div');dial.id='documentPageDial';dial.appendChild(make('div','doc-rail-kicker','Pages'));
 const head=make('div','dial-head');dialReadout=make('strong',null,'1');dialTotal=make('span',null,'/ 1');head.append(dialReadout,dialTotal);dial.appendChild(head);
 dialStage=make('div','dial-stage');dialStage.tabIndex=0;dialStage.setAttribute('role','slider');dialStage.setAttribute('aria-label','Page dial');dialProgress=make('div','dial-progress');dialMarks=make('div','dial-marks');dialThumb=make('div','dial-thumb');dialThumb.appendChild(make('div','dial-grip'));dialBubble=make('div','dial-bubble','Page 1');dialStage.append(dialProgress,dialMarks,dialThumb,dialBubble);dial.appendChild(dialStage);
 const foot=make('div','dial-foot');foot.innerHTML='<b>↕</b><span>drag / scroll</span>';dial.appendChild(foot);bar.appendChild(dial);
 const modes=make('div');modes.id='documentRailModes';[penBtn,handBtn,interactBtn].forEach(b=>{if(b)modes.appendChild(b)});if(modes.childNodes.length)bar.appendChild(modes);
 const acts=make('div');acts.id='documentRailActions';[reopenBtn,closeBtn].forEach(b=>{if(b)acts.appendChild(b)});if(acts.childNodes.length)bar.appendChild(acts);
 wireDial();bar.dataset.rightRailReady='1';sync(true);return true;
}
function maxPage(){return Math.max(1,+pageBox?.max||parseInt((pageTotal?.textContent||'1').replace(/\D/g,''),10)||1)}
function currentPage(){return Math.max(1,Math.min(maxPage(),+pageBox?.value||1))}
const pct=(p,m)=>m<=1?0:(p-1)/(m-1);
function visual(p){
 if(!dialStage)return;const m=maxPage(),y=10+pct(p,m)*Math.max(0,dialStage.clientHeight-20);dialReadout.textContent=String(p);dialTotal.textContent=`/ ${m}`;dialBubble.textContent=`Page ${p}`;dialThumb.style.top=`${y}px`;dialBubble.style.top=`${y}px`;dialProgress.style.height=`${Math.max(0,y-10)}px`;dialStage.setAttribute('aria-valuemin','1');dialStage.setAttribute('aria-valuemax',String(m));dialStage.setAttribute('aria-valuenow',String(p));dialStage.setAttribute('aria-valuetext',`Page ${p} of ${m}`);
}
function marks(m){
 dialMarks.innerHTML='';let pages=[];if(m<=12)pages=Array.from({length:m},(_,i)=>i+1);else{const c=Math.min(13,Math.max(7,Math.round(Math.sqrt(m)*1.7)));for(let i=0;i<c;i++)pages.push(Math.round(1+(m-1)*i/(c-1)));pages=[...new Set(pages)]}
 const majors=new Set([1,m,Math.round((m+1)/2),Math.round(1+(m-1)/4),Math.round(1+3*(m-1)/4)]);pages.forEach(p=>{const x=make('div','dial-mark'+(majors.has(p)?' major':''));x.style.top=`${pct(p,m)*100}%`;if(m<=12||majors.has(p))x.appendChild(make('span',null,String(p)));dialMarks.appendChild(x)});
}
function commit(p){p=Math.max(1,Math.min(maxPage(),Math.round(p)));visual(p);if(currentPage()===p)return;pageBox.value=String(p);pageBox.dispatchEvent(new Event('change',{bubbles:true}))}
function pageAt(y){const r=dialStage.getBoundingClientRect(),u=Math.max(1,r.height-20),q=Math.max(0,Math.min(1,(y-r.top-10)/u));return Math.max(1,Math.min(maxPage(),Math.round(1+q*(maxPage()-1))))}
function dialYForPage(p){const h=dialStage?.clientHeight||200;return 10+pct(p,maxPage())*Math.max(1,h-20)}
function wireDial(){
 dialStage.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();dragging=true;dial.classList.add('dragging');try{dialStage.setPointerCapture(e.pointerId)}catch{}previewPage=pageAt(e.clientY);visual(previewPage)});
 dialStage.addEventListener('pointermove',e=>{if(!dragging)return;e.preventDefault();previewPage=pageAt(e.clientY);visual(previewPage)});
 const end=e=>{if(!dragging)return;e.preventDefault();dragging=false;dial.classList.remove('dragging');try{dialStage.releasePointerCapture(e.pointerId)}catch{}commit(previewPage)};dialStage.addEventListener('pointerup',end);dialStage.addEventListener('pointercancel',end);
 dialStage.addEventListener('keydown',e=>{let p=currentPage();if(e.key==='ArrowUp'||e.key==='PageUp')p--;else if(e.key==='ArrowDown'||e.key==='PageDown')p++;else if(e.key==='Home')p=1;else if(e.key==='End')p=maxPage();else return;e.preventDefault();commit(p)});
 dialStage.addEventListener('wheel',e=>{
  e.preventDefault();e.stopPropagation();
  let dy=e.deltaY||0;if(e.deltaMode===1)dy*=18;else if(e.deltaMode===2)dy*=dialStage.clientHeight;
  dy=Math.max(-55,Math.min(55,dy));
  const now=performance.now(),r=dialStage.getBoundingClientRect(),lo=10,hi=Math.max(10,r.height-10);
  if(dialWheelY==null||now-dialWheelLast>180)dialWheelY=dialYForPage(currentPage());
  dialWheelLast=now;dialWheelY=Math.max(lo,Math.min(hi,dialWheelY+dy*.9));
  previewPage=pageAt(r.top+dialWheelY);dragging=true;dial.classList.add('dragging');visual(previewPage);
  clearTimeout(dialWheelTimer);dialWheelTimer=setTimeout(()=>{dragging=false;dial.classList.remove('dragging');commit(previewPage);dialWheelY=null},140);
 },{passive:false});
}
function sync(force=false){
 if(!bar||bar.dataset.rightRailReady!=='1'||!dial)return;const p=currentPage(),m=maxPage(),z=(zoomLabel?.textContent||'').trim();if(force||m!==lastMax){lastMax=m;marks(m)}if(!dragging&&(force||p!==lastPage)){lastPage=p;visual(p)}if(force||z!==lastZoom){lastZoom=z;zoomLabel.title=`Zoom ${z}`}
}
style();
let tries=0;const boot=setInterval(()=>{tries++;if(build()||tries>80)clearInterval(boot)},150);
setInterval(()=>{if(document.body.classList.contains('document-open-mode')){if(!bar||!document.body.contains(bar))build();sync(false)}},250);
})();
