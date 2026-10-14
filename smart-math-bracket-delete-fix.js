(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function')return;
let lastBracket=null;
function isThree(o){return !!(o&&o.smartType==='barModel'&&o.smartBarType==='comparison'&&Math.round(Number(o.barCount)||0)===3)}
function lockEntry(e){
 if(!e||!e.__userDeleted)return;
 const d=Object.getOwnPropertyDescriptor(e,'visible');
 if(d&&typeof d.get==='function'&&d.get.__deleteLock)return;
 try{
  Object.defineProperty(e,'visible',{configurable:true,enumerable:true,get:Object.assign(function(){return false},{__deleteLock:true}),set:function(v){if(v===false)this.__userDeleted=true}});
 }catch{e.visible=false}
}
function lockAll(){for(const o of strokes){if(!isThree(o)||!Array.isArray(o.userDrawnBrackets))continue;for(const e of o.userDrawnBrackets)if(e?.__userDeleted)lockEntry(e)}}
function hitBracket(clientX,clientY){
 const r=canvas.getBoundingClientRect(),x=clientX-r.left,y=clientY-r.top,W=r.width,H=r.height;
 let best=null,bestD=Infinity;
 for(let i=strokes.length-1;i>=0;i--){const o=strokes[i];if(!isThree(o)||!Array.isArray(o.userDrawnBrackets))continue;for(const e of o.userDrawnBrackets){if(!e||e.visible===false||e.__userDeleted)continue;let x1=(o.x+o.w*Number(e.x1||0))*W,x2=(o.x+o.w*Number(e.x2||0))*W,yy=(o.y+o.h*Number(e.y||0))*H;if(x2<x1)[x1,x2]=[x2,x1];if(x>=x1-14&&x<=x2+14&&y>=yy-38&&y<=yy+38){const d=Math.abs(y-yy)+Math.max(0,Math.min(Math.abs(x-x1),Math.abs(x-x2),Math.abs(x-(x1+x2)/2)));if(d<bestD){bestD=d;best={modelId:o.smartId,entryId:e.id}}}}}
 return best;
}
function deletedButton(target){const b=target instanceof Element?target.closest('button'):null;if(!b)return null;return (b.textContent||'').trim().toLowerCase()==='delete bracket'?b:null}
function autoButton(target){const b=target instanceof Element?target.closest('button'):null;if(!b)return null;return (b.textContent||'').trim()==='✨ Auto'?b:null}

document.addEventListener('pointerup',e=>{if(e.target===canvas){const h=hitBracket(e.clientX,e.clientY);if(h)lastBracket=h}},true);
document.addEventListener('click',e=>{
 if(autoButton(e.target)){
  for(const o of strokes){if(!isThree(o)||!Array.isArray(o.userDrawnBrackets))continue;o.userDrawnBrackets=o.userDrawnBrackets.filter(en=>!en?.__userDeleted)}
  lastBracket=null;return;
 }
 if(!deletedButton(e.target)||!lastBracket)return;
 const o=strokes.find(s=>s&&s.smartId===lastBracket.modelId),en=o?.userDrawnBrackets?.find(x=>x&&x.id===lastBracket.entryId);if(!en)return;
 en.__userDeleted=true;try{delete en.visible}catch{};lockEntry(en);lastBracket=null;
},true);
const previous=redraw;redraw=function(){lockAll();previous()};
setTimeout(lockAll,0);
})();
