(function(){
'use strict';
// Alpha presentation finger is transient and never modifies whiteboard strokes.
const selectButton=document.getElementById('selectBtn');
const board=document.getElementById('board');
const wrap=document.getElementById('boardWrap');
if(!selectButton||!board||!wrap||document.getElementById('ccFingerPointerBtn'))return;
const btn=document.createElement('button');btn.type='button';btn.id='ccFingerPointerBtn';btn.className='btn';
btn.textContent='👆 Point';btn.title='Point to objects without drawing';btn.setAttribute('aria-label','Pointing finger presentation tool');btn.setAttribute('aria-pressed','false');
selectButton.insertAdjacentElement('afterend',btn);
const style=document.createElement('style');
style.textContent=[
 '#ccFingerPointerBtn.active{background:#fff0dc!important;border-color:#f4ad60!important;color:#8b4319!important}',
 '#ccFingerPointerBtn:focus-visible{outline:3px solid #0f766e;outline-offset:2px}',
 '#ccFingerPointerCursor{position:absolute;top:0;left:0;z-index:1450;pointer-events:none;user-select:none;display:none;transform:translate(-50%,-12px);filter:drop-shadow(1px 4px 2px rgba(23,50,77,.25))}',
 '#ccFingerPointerCursor .cc-finger{display:block;font-size:48px;line-height:1;text-align:center;transform-origin:50% 20%;animation:ccFingerWiggle 2s ease-in-out infinite}',
 '#ccFingerPointerCursor .cc-spark{position:absolute;left:34px;top:2px;font-size:15px;animation:ccSparkle 1.5s ease-in-out infinite}',
 '#ccFingerPointerRipple{position:absolute;z-index:1448;width:15px;height:15px;border:3px solid #f59e0b;border-radius:50%;pointer-events:none;display:none;transform:translate(-50%,-50%) scale(.4);opacity:0}',
 '#ccFingerPointerRipple.cc-pop{display:block;animation:ccFingerPop .55s ease-out forwards}',
 '@keyframes ccFingerWiggle{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(5deg)}}',
 '@keyframes ccSparkle{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.15)}}',
 '@keyframes ccFingerPop{0%{opacity:1;transform:translate(-50%,-50%) scale(.4)}100%{opacity:0;transform:translate(-50%,-50%) scale(4.5)}}',
 '@media(prefers-reduced-motion:reduce){#ccFingerPointerCursor .cc-finger,#ccFingerPointerCursor .cc-spark,#ccFingerPointerRipple{animation:none!important}}'
 ].join('\n');
document.head.appendChild(style);
const cursor=document.createElement('div');cursor.id='ccFingerPointerCursor';cursor.setAttribute('aria-hidden','true');
cursor.innerHTML='<span class="cc-finger">👆</span><span class="cc-spark">✨</span>';
const ripple=document.createElement('div');ripple.id='ccFingerPointerRipple';ripple.setAttribute('aria-hidden','true');
wrap.append(cursor,ripple);
let last={x:0,y:0},hasPoint=false;
function enabled(){return typeof tool!=='undefined'&&tool==='finger'}
function show(x,y,tap=false){
 const r=wrap.getBoundingClientRect();
 last={x:Math.max(0,Math.min(r.width,x)),y:Math.max(0,Math.min(r.height,y))};hasPoint=true;
 cursor.style.left=last.x+'px';cursor.style.top=last.y+'px';cursor.style.display='block';
 if(tap){ripple.style.left=last.x+'px';ripple.style.top=last.y+'px';ripple.classList.remove('cc-pop');void ripple.offsetWidth;ripple.classList.add('cc-pop')}
}
function coords(e){const r=wrap.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
function hide(){cursor.style.display='none';ripple.classList.remove('cc-pop')}
function sync(){
 const active=enabled();btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active));
 if(active){
  if(typeof modeBadge!=='undefined'&&modeBadge)modeBadge.textContent='👆 Point · presentation only';
  board.style.cursor='none';if(hasPoint)cursor.style.display='block';
 }else hide();
}
const originalSync=syncUi;
syncUi=function(){originalSync.apply(this,arguments);sync()};
btn.addEventListener('click',e=>{
 e.preventDefault();e.stopPropagation();
 if(enabled()){selectButton.click();return}
 try{document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))}catch(_){}
 tool='finger';syncUi();
 try{board.focus({preventScroll:true})}catch(_){}
});
function consume(e,tap){
 if(!enabled())return;
 if(e.button!==undefined&&e.button!==0&&e.type==='pointerdown')return;
 const p=coords(e);show(p.x,p.y,tap);
 if(e.type==='pointerdown')try{board.setPointerCapture?.(e.pointerId)}catch(_){}
 if(e.type==='pointerup'||e.type==='pointercancel')try{if(board.hasPointerCapture?.(e.pointerId))board.releasePointerCapture?.(e.pointerId)}catch(_){}
 e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
}
board.addEventListener('pointerdown',e=>consume(e,true),true);
board.addEventListener('pointermove',e=>consume(e,false),true);
board.addEventListener('pointerup',e=>consume(e,false),true);
board.addEventListener('pointercancel',e=>consume(e,false),true);
board.addEventListener('pointerenter',e=>{if(enabled()){const p=coords(e);show(p.x,p.y)}},true);
board.addEventListener('pointerleave',e=>{if(enabled()&&e.pointerType==='mouse')hide()},true);
document.addEventListener('keydown',e=>{
 if(!enabled()||e.key!=='Escape'||/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||''))return;
 e.preventDefault();selectButton.click();
},true);
document.addEventListener('whiteboard-annotation-context',()=>{if(enabled())selectButton.click()},true);
window.ClassroomFingerPointer={
 isActive:enabled,
 setActive(value){if(value&&!enabled())btn.click();else if(!value&&enabled())selectButton.click()},
 getPoint(){return hasPoint?{...last}:null}
};
sync();
})();