(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof start!=='function'||typeof move!=='function'||typeof end!=='function')return;
const baseStart=start,baseMove=move,baseEnd=end;
let movingText=null,offsetX=0,offsetY=0;
function pointerNorm(e){const r=canvas.getBoundingClientRect();return{x:Math.min(1,Math.max(0,(e.clientX-r.left)/r.width)),y:Math.min(1,Math.max(0,(e.clientY-r.top)/r.height))}}
function metrics(s){ctx.save();ctx.font=`700 ${s.size}px Inter,system-ui,sans-serif`;const w=ctx.measureText(s.text||'').width;ctx.restore();return{w,h:s.size*1.2}}
function hitText(p){const px=p.x*cssW,py=p.y*cssH;for(let i=strokes.length-1;i>=0;i--){const s=strokes[i];if(s?.type!=='text')continue;const m=metrics(s),x=s.x*cssW,y=s.y*cssH,pad=8;if(px>=x-pad&&px<=x+m.w+pad&&py>=y-pad&&py<=y+m.h+pad)return s}return null}
function outline(s){if(!s)return;const m=metrics(s),x=s.x*cssW,y=s.y*cssH;ctx.save();ctx.strokeStyle='rgba(15,118,110,.9)';ctx.lineWidth=1.5;ctx.setLineDash([5,4]);ctx.strokeRect(x-6,y-5,m.w+12,m.h+10);ctx.restore()}
function down(e){
 if(tool==='text'){
  const p=pointerNorm(e),s=hitText(p);
  if(s){movingText=s;offsetX=p.x-s.x;offsetY=p.y-s.y;try{canvas.setPointerCapture?.(e.pointerId)}catch{};redraw();outline(s);canvas.style.cursor='move';e.preventDefault();return}
 }
 baseStart(e);
}
function drag(e){
 if(movingText){const p=pointerNorm(e);movingText.x=Math.min(1,Math.max(0,p.x-offsetX));movingText.y=Math.min(1,Math.max(0,p.y-offsetY));redraw();outline(movingText);e.preventDefault();return}
 if(tool==='text'&&!drawing){const p=pointerNorm(e);canvas.style.cursor=hitText(p)?'move':'text'}
 baseMove(e);
}
function up(e){
 if(movingText){movingText=null;redraw();syncUi();try{canvas.releasePointerCapture?.(e.pointerId)}catch{};e.preventDefault();return}
 baseEnd(e);
}
canvas.removeEventListener('pointerdown',baseStart);canvas.removeEventListener('pointermove',baseMove);canvas.removeEventListener('pointerup',baseEnd);canvas.removeEventListener('pointercancel',baseEnd);
canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',drag);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
})();
