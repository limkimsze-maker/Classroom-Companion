(function(){'use strict';
let board,canvas,bar,pageBox,minusBtn,plusBtn,zoomLabel,pdf,handBtn,penBtn;
let hand=true,px=0,py=0,scale=1,drag=null,pair=null,raf=0,spring=0,lastPage='';
let wheel={x:0,y:0,t:0,pinch:null,timer:0,cooldown:0,edges:null},lastTap={t:0,x:0,y:0};
const touches=new Map();
// Page turns require a NEW gesture that starts at the document edge; the
// first gesture can freely reveal the top or bottom without changing pages.
const PAGE_DRAG_MIN=175,TOUCH_DRAG_MIN=155,TRACKPAD_TURN_MIN=320,TRACKPAD_WINDOW=300;
const PAGE_DRAG_RATIO=1.35,EDGE_TOLERANCE=10;
const active=()=>document.body.classList.contains('document-open-mode'),time=()=>performance.now();
function toast(s){const t=document.getElementById('toast');if(!t)return;t.textContent=s;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),700)}
function find(){board=document.getElementById('boardWrap');canvas=document.getElementById('board');bar=document.getElementById('documentQuickBar');pdf=document.getElementById('documentPdfCanvas');if(!board||!canvas||!bar)return false;pageBox=bar.querySelector('input[type=number]');const bs=[...bar.querySelectorAll('button')];minusBtn=bs.find(b=>b.textContent.trim()==='−');plusBtn=bs.find(b=>b.textContent.trim()==='+');zoomLabel=[...bar.querySelectorAll('span')].find(s=>/%$/.test((s.textContent||'').trim()));modes();return !!pageBox}
function modes(){const search=[...bar.querySelectorAll('button')].find(b=>(b.textContent||'').includes('🔎'));handBtn=document.getElementById('documentTouchNavBtn');if(!handBtn){handBtn=document.createElement('button');handBtn.id='documentTouchNavBtn';handBtn.textContent='✋';handBtn.title='Hand: drag to see the page edge, then swipe again to turn · pinch zoom · double-tap reset';search?bar.insertBefore(handBtn,search):bar.appendChild(handBtn)}penBtn=document.getElementById('documentPenModeBtn');if(!penBtn){penBtn=document.createElement('button');penBtn.id='documentPenModeBtn';penBtn.textContent='✏️';penBtn.title='Pen: annotate';bar.insertBefore(penBtn,handBtn)}if(!handBtn.dataset.g4){handBtn.dataset.g4='1';handBtn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();setHand(true)},true)}if(!penBtn.dataset.g4){penBtn.dataset.g4='1';penBtn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();setHand(false);const p=document.getElementById('penBtn');if(p&&!p.classList.contains('active'))p.click()},true)}paint()}
function paint(){[[handBtn,hand],[penBtn,!hand]].forEach(([b,on])=>{if(!b)return;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));b.style.background=on?'#0f766e':'#fff';b.style.color=on?'#fff':'#17324d';b.style.borderColor=on?'#0f766e':'#d8e1e8'});if(canvas)canvas.style.cursor=hand?'grab':'crosshair'}
function stop(){cancelAnimationFrame(raf);cancelAnimationFrame(spring);raf=spring=0}
function setHand(v){hand=!!v;touches.clear();drag=pair=null;stop();paint();if(!hand)settle()}
function inside(e){const r=board?.getBoundingClientRect();return !!r&&e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom}
const panTarget=()=>window.WhiteboardDocumentView?.panElement?.()||pdf;
const visible=()=>{const el=panTarget();return !!el&&el.getBoundingClientRect().width>0&&getComputedStyle(el).display!=='none'};
const zoom=()=>parseInt((zoomLabel?.textContent||'100').replace(/\D/g,''),10)||100;
const pnow=()=>Math.max(1,+pageBox?.value||1),pmax=()=>Math.max(1,+pageBox?.max||1);
function animPage(d,edge=false){const c=edge?(d>0?'doc-edge-next':'doc-edge-prev'):(d>0?'doc-turn-next':'doc-turn-prev');board.classList.remove('doc-turn-next','doc-turn-prev','doc-edge-next','doc-edge-prev');void board.offsetWidth;board.classList.add(c);clearTimeout(animPage.t);animPage.t=setTimeout(()=>board?.classList.remove(c),190)}
function page(d){if(!active()||!pageBox)return false;const n=pnow(),to=Math.max(1,Math.min(pmax(),n+d));if(to===n){animPage(d,true);toast(d>0?'Last page':'First page');return false}stop();animPage(d);pageBox.value=String(to);pageBox.dispatchEvent(new Event('change',{bubbles:true}));px=py=0;scale=1;toast(`Page ${to}`);return true}
function zstep(d){const b=d>0?plusBtn:minusBtn;if(!b||b.disabled)return false;b.click();return true}
function setZoom(target){target=Math.max(55,Math.min(220,target));let z=zoom(),g=0;while(target>z+7&&g++<14){if(!zstep(1))break;z=zoom()}g=0;while(target<z-7&&g++<14){if(!zstep(-1))break;z=zoom()}}
function reset(){stop();px=py=0;scale=1;draw(false);setZoom(100);setTimeout(()=>{px=py=0;scale=1;draw(false)},80);toast('Fit view')}
function cancelDraw(){try{if(typeof drawing!=='undefined')drawing=false;if(typeof current!=='undefined')current=null;if(typeof redraw==='function')redraw()}catch{}}
function bounds(){const el=panTarget();if(!board||!el)return{x:36,y:36};const b=board.getBoundingClientRect(),r=el.getBoundingClientRect();return{x:Math.max(36,(r.width-b.width)/2+36),y:Math.max(36,(r.height-b.height)/2+36)}}
// If the full page fits, a deliberate long swipe may turn it immediately.
// Otherwise a turn is eligible ONLY when the swipe starts after panning to
// the matching top/bottom boundary; no mid-page drag or wheel scroll can jump.
function canTurnAtStart(direction){
 if(!active()||!visible())return false;
 const r=panTarget().getBoundingClientRect(),b=board.getBoundingClientRect();
 if(r.height<=b.height-16)return true;
 const limit=bounds().y;
 return direction>0?py<=-limit+EDGE_TOLERANCE:py>=limit-EDGE_TOLERANCE;
}
function edgeSnapshot(){return{next:canTurnAtStart(1),prev:canTurnAtStart(-1)}}
function deliberateTurn(edges,dx,dy,minDistance){
 return !!edges&&pmax()>1&&Math.abs(dy)>=minDistance&&
  Math.abs(dy)>Math.abs(dx)*PAGE_DRAG_RATIO&&(dy<0?edges.next:edges.prev);
}
function resist(v,m){const a=Math.abs(v);return a<=m?v:Math.sign(v)*(m+(a-m)*.28)}
function draw(over=true){if(!visible())return;const b=bounds(),el=panTarget();if(!over){px=Math.max(-b.x,Math.min(b.x,px));py=Math.max(-b.y,Math.min(b.y,py))}el.style.translate=`${px}px ${py}px`;el.style.scale=String(scale);window.WhiteboardDocumentView?.sync?.()}
function pan(dx,dy){if(!visible())return;const b=bounds();px=resist(px+dx,b.x);py=resist(py+dy,b.y);draw(true)}
function settle(){if(!visible())return;cancelAnimationFrame(spring);const b=bounds(),tx=Math.max(-b.x,Math.min(b.x,px)),ty=Math.max(-b.y,Math.min(b.y,py));const f=()=>{px+=(tx-px)*.25;py+=(ty-py)*.25;draw(true);if(Math.abs(tx-px)+Math.abs(ty-py)<.8){px=tx;py=ty;draw(false);spring=0}else spring=requestAnimationFrame(f)};spring=requestAnimationFrame(f)}
function inertia(vx,vy){if(!visible()||Math.hypot(vx,vy)<.7){settle();return}stop();vx=Math.max(-28,Math.min(28,vx));vy=Math.max(-28,Math.min(28,vy));const f=()=>{vx*=.90;vy*=.90;pan(vx,vy);if(Math.hypot(vx,vy)<.35){raf=0;settle()}else raf=requestAnimationFrame(f)};raf=requestAnimationFrame(f)}
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),mid=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
function startPair(){const a=[...touches.values()].slice(0,2);if(a.length<2)return;a.forEach(t=>{t.paired=true});const m=mid(a[0],a[1]),d=Math.max(1,dist(a[0],a[1])),t=time();pair={d0:d,d,last:m,start:m,t0:t,t,pinch:false,edges:edgeSnapshot(),z0:zoom()}}
function down(e){if(!e.target?.closest?.('#boardWrap'))return;if(e.target?.closest?.('#documentQuickBar,#documentSearchPanel'))return;if(!active()||!hand||canvas?.style.pointerEvents==='none'||!inside(e))return;if(e.pointerType==='mouse'&&e.button!==0)return;if(!['mouse','pen','touch'].includes(e.pointerType))return;stop();e.preventDefault();e.stopImmediatePropagation();cancelDraw();const t=time();if(e.pointerType==='touch'){touches.set(e.pointerId,{x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,t0:t,t,vx:0,vy:0,moved:false,edges:edgeSnapshot()});if(touches.size===2)startPair();return}drag={id:e.pointerId,x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,t0:t,t,vx:0,vy:0,moved:false,edges:edgeSnapshot()};try{canvas.setPointerCapture(e.pointerId)}catch{}canvas.style.cursor='grabbing'}
function move(e){if(!active()||!hand)return;if(drag&&drag.id===e.pointerId){if(e.pointerType==='mouse'&&e.buttons===0){const d=drag;drag=null;paint();inertia(d.vx,d.vy);return}e.preventDefault();e.stopImmediatePropagation();const t=time(),dt=Math.max(8,t-drag.t),dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.vx=drag.vx*.55+dx*16/dt*.45;drag.vy=drag.vy*.55+dy*16/dt*.45;drag.x=e.clientX;drag.y=e.clientY;drag.t=t;drag.moved||=(Math.hypot(e.clientX-drag.sx,e.clientY-drag.sy)>8);pan(dx,dy);return}if(e.pointerType!=='touch'||!touches.has(e.pointerId))return;e.preventDefault();e.stopImmediatePropagation();const o=touches.get(e.pointerId),t=time(),dt=Math.max(8,t-o.t),dx=e.clientX-o.x,dy=e.clientY-o.y;o.vx=o.vx*.55+dx*16/dt*.45;o.vy=o.vy*.55+dy*16/dt*.45;o.x=e.clientX;o.y=e.clientY;o.t=t;o.moved||=(Math.hypot(o.x-o.sx,o.y-o.sy)>8);touches.set(e.pointerId,o);if(touches.size>=2){if(!pair)startPair();const a=[...touches.values()].slice(0,2),m=mid(a[0],a[1]),d=Math.max(1,dist(a[0],a[1])),s=d/pair.d0,mx=m.x-pair.last.x,my=m.y-pair.last.y,totalX=m.x-pair.start.x,totalY=m.y-pair.start.y,elapsed=t-pair.t0;if(Math.abs(s-1)>.09)pair.pinch=true;
 // Two-finger drags pan normally. Consider a page turn only on release,
 // and only when the gesture began at the matching document edge.
 if(pair.pinch){scale=Math.max(55/pair.z0,Math.min(220/pair.z0,s));px+=mx;py+=my;draw(true)}else pan(mx,my);pair.d=d;pair.last=m;pair.t=t;return}
 const totalX=o.x-o.sx,totalY=o.y-o.sy,elapsed=t-o.t0,vertical=Math.abs(totalY)>Math.abs(totalX)*1.18;
 // Allow the entire gesture to pan freely; test page-turn intent on release.
 pan(dx,dy)}
function dbl(x,y,t0){if(time()-t0>280)return;const t=time(),ok=t-lastTap.t<=330&&Math.hypot(x-lastTap.x,y-lastTap.y)<=34;if(ok){lastTap.t=0;reset()}else lastTap={t,x,y}}
function end(e){if(drag&&drag.id===e.pointerId){
 const d=drag;drag=null;
 try{canvas.releasePointerCapture(e.pointerId)}catch{}
 paint();
 if(e.type==='pointercancel'){settle();return}
 const dx=e.clientX-d.sx,dy=e.clientY-d.sy;
 if(deliberateTurn(d.edges,dx,dy,PAGE_DRAG_MIN)){
  if(!page(dy<0?1:-1))settle();
  return;
 }
 d.moved?inertia(d.vx,d.vy):dbl(e.clientX,e.clientY,d.t0);return
}if(e.pointerType!=='touch'||!touches.has(e.pointerId))return;e.preventDefault();e.stopImmediatePropagation();const o=touches.get(e.pointerId),hadPair=!!pair;touches.delete(e.pointerId);if(hadPair&&touches.size<2){
  const dx=pair.last.x-pair.start.x,dy=pair.last.y-pair.start.y;
  if(!pair.pinch&&deliberateTurn(pair.edges,dx,dy,TOUCH_DRAG_MIN)){
   if(!page(dy<0?1:-1))settle();
  }else if(pair.pinch){const target=pair.z0*scale;scale=1;draw(true);setZoom(target);setTimeout(settle,80)}
  else settle();
  pair=null;
 }
 if(!hadPair&&touches.size===0){
  // The remaining finger from a pinch is not a new page-turn gesture.
  if(o.paired||e.type==='pointercancel'){settle();return}
  const dx=o.x-o.sx,dy=o.y-o.sy;
  if(deliberateTurn(o.edges,dx,dy,TOUCH_DRAG_MIN)){
   if(!page(dy<0?1:-1))settle();
   return;
  }
  o.moved?inertia(o.vx,o.vy):dbl(o.x,o.y,o.t0)
 }}
function wheelEvt(e){if(!e.target?.closest?.('#boardWrap'))return;if(e.target?.closest?.('#documentQuickBar'))return;if(!active()||!hand||canvas?.style.pointerEvents==='none'||!inside(e))return;e.preventDefault();e.stopImmediatePropagation();cancelDraw();stop();let dy=e.deltaY;if(e.deltaMode===1)dy*=18;else if(e.deltaMode===2)dy*=innerHeight;const dx=e.deltaX||0,t=time();if(e.ctrlKey||e.metaKey){if(!wheel.pinch)wheel.pinch={z:zoom(),s:1};wheel.pinch.s=Math.max(.5,Math.min(2.2,wheel.pinch.s*Math.exp(-dy*.0025)));scale=wheel.pinch.s;draw(true);clearTimeout(wheel.timer);wheel.timer=setTimeout(()=>{const z=wheel.pinch.z*wheel.pinch.s;scale=1;draw(true);setZoom(z);wheel.pinch=null;setTimeout(settle,80)},120);return}// Trackpad/wheel events must scroll the current page first. Only an
// additional gesture that begins at an edge may turn a page.
if(t-wheel.t>TRACKPAD_WINDOW){wheel.x=0;wheel.y=0;wheel.edges=edgeSnapshot()}
wheel.t=t;wheel.x+=dx;wheel.y+=dy;
const canTurn=t-wheel.cooldown>=650&&deliberateTurn(wheel.edges,-wheel.x,-wheel.y,TRACKPAD_TURN_MIN);
if(canTurn){
 const direction=wheel.y>0?1:-1;
 wheel.x=wheel.y=0;wheel.edges=null;wheel.cooldown=t;
 clearTimeout(wheel.timer);if(!page(direction))settle();return;
}
pan(-dx,-dy);
clearTimeout(wheel.timer);wheel.timer=setTimeout(()=>{wheel.x=0;wheel.y=0;wheel.edges=null;settle()},TRACKPAD_WINDOW)}
function styles(){if(document.getElementById('documentGestureStylesV4'))return;const s=document.createElement('style');s.id='documentGestureStylesV4';s.textContent=`#documentUnderlay,#board{will-change:transform,opacity}.doc-turn-next #documentUnderlay,.doc-turn-next #board{animation:dn .17s ease-out}.doc-turn-prev #documentUnderlay,.doc-turn-prev #board{animation:dp .17s ease-out}.doc-edge-next #documentUnderlay,.doc-edge-next #board{animation:en .17s ease-out}.doc-edge-prev #documentUnderlay,.doc-edge-prev #board{animation:ep .17s ease-out}@keyframes dn{from{transform:translateY(12px);opacity:.76}to{transform:none;opacity:1}}@keyframes dp{from{transform:translateY(-12px);opacity:.76}to{transform:none;opacity:1}}@keyframes en{50%{transform:translateY(-5px)}}@keyframes ep{50%{transform:translateY(5px)}}`;document.head.appendChild(s)}
function toolSwitch(){['penBtn','textBtn','eraserBtn','selectBtn','highlighterBtn'].forEach(id=>{const b=document.getElementById(id);if(!b||b.dataset.docg4)return;b.dataset.docg4='1';b.addEventListener('click',e=>{
 // Page rendering dispatches synthetic Escape, which clicks Select to clear
 // stale selections. Do not let that internal click disable Hand navigation.
 if(active()&&e.isTrusted)setHand(false)
})})}
function wire(){if(!find())return false;styles();toolSwitch();if(document.documentElement.dataset.docGesturesV8)return true;document.documentElement.dataset.docGesturesV8='1';window.addEventListener('pointerdown',down,true);window.addEventListener('pointermove',move,true);window.addEventListener('pointerup',end,true);window.addEventListener('pointercancel',end,true);window.addEventListener('wheel',wheelEvt,{passive:false,capture:true});return true}
function watch(){if(active()&&pageBox){const p=pageBox.value;if(lastPage&&p!==lastPage){px=py=0;scale=1}lastPage=p}else if(!active()){lastPage='';px=py=0;scale=1;stop()}requestAnimationFrame(watch)}
// A Highlighter swatch activates the tool through a programmatic button click
// (isTrusted=false). The same intent must leave Hand navigation, otherwise
// its capture-phase pointer handler swallows every attempted highlight stroke.
function highlightAnnotationMode(){
 if(!active())return;
 if(!window.CCHighlighter?.isActive?.())return;
 setHand(false);
}
window.addEventListener('cc-highlighter-tool',highlightAnnotationMode);
window.addEventListener('cc-highlighter-colour',highlightAnnotationMode);
document.addEventListener('whiteboard-document-view-reset',()=>{stop();px=py=0;scale=1;touches.clear();drag=pair=null;draw(false)});
wire();setTimeout(wire,0);setTimeout(wire,500);watch();
})();