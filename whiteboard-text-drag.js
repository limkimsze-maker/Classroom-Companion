(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function'||typeof syncUi!=='function')return;

const labels={
 en:{select:'↖ Select',selectWord:'Select',edit:'Edit text:',deleted:'Text deleted',duplicated:'Text duplicated'},
 zh:{select:'↖ 选择',selectWord:'选择',edit:'编辑文字：',deleted:'文字已删除',duplicated:'文字已复制'},
 ms:{select:'↖ Pilih',selectWord:'Pilih',edit:'Edit teks:',deleted:'Teks dipadam',duplicated:'Teks diduplikasi'},
 ta:{select:'↖ தேர்வு',selectWord:'தேர்வு',edit:'உரையைத் திருத்தவும்:',deleted:'உரை நீக்கப்பட்டது',duplicated:'உரை நகலெடுக்கப்பட்டது'}
};
const lang=(typeof edition==='string'&&labels[edition])?edition:'en',X=labels[lang];
const baseRedraw=redraw,baseSync=syncUi,baseStart=typeof start==='function'?start:null,baseMove=typeof move==='function'?move:null,baseEnd=typeof end==='function'?end:null;
const clone=v=>JSON.parse(JSON.stringify(v));
let selected=null,dragMode='',pointerId=null,startPoint=null,startObject=null,pendingHistory=null,history=[];

const selectBtn=document.createElement('button');
selectBtn.className='btn';selectBtn.id='selectBtn';selectBtn.type='button';selectBtn.textContent=X.select;
penBtn.parentElement.insertBefore(selectBtn,penBtn);

function remember(){history.push(clone(strokes));if(history.length>100)history.shift()}
function restore(snapshot){strokes=clone(snapshot);selected=null;current=null;drawing=false;dragMode='';baseRedraw();syncUi()}
function textMetrics(s){ctx.save();ctx.font=`700 ${s.size}px Inter,system-ui,sans-serif`;const w=Math.max(8,ctx.measureText(s.text||'').width);ctx.restore();return{w,h:Math.max(12,s.size*1.2)}}
function point(e){const r=canvas.getBoundingClientRect();return{x:Math.min(1,Math.max(0,(e.clientX-r.left)/r.width)),y:Math.min(1,Math.max(0,(e.clientY-r.top)/r.height))}}
function hitText(p){const px=p.x*cssW,py=p.y*cssH;for(let i=strokes.length-1;i>=0;i--){const s=strokes[i];if(s?.type!=='text')continue;const m=textMetrics(s),x=s.x*cssW,y=s.y*cssH,pad=8;if(px>=x-pad&&px<=x+m.w+pad&&py>=y-pad&&py<=y+m.h+pad)return s}return null}
function handleBox(s){if(!s)return null;const m=textMetrics(s),x=s.x*cssW,y=s.y*cssH;return{x:x+m.w+6,y:y+m.h+5,r:9,m}}
function hitHandle(p,s){const h=handleBox(s);if(!h)return false;const px=p.x*cssW,py=p.y*cssH;return Math.abs(px-h.x)<=12&&Math.abs(py-h.y)<=12}
function drawSelection(){if(!selected||selected.type!=='text'||!strokes.includes(selected))return;const m=textMetrics(selected),x=selected.x*cssW,y=selected.y*cssH;ctx.save();ctx.strokeStyle='rgba(15,118,110,.95)';ctx.fillStyle='#fff';ctx.lineWidth=1.5;ctx.setLineDash([5,4]);ctx.strokeRect(x-6,y-5,m.w+12,m.h+10);ctx.setLineDash([]);const h=handleBox(selected);ctx.fillRect(h.x-h.r,h.y-h.r,h.r*2,h.r*2);ctx.strokeRect(h.x-h.r,h.y-h.r,h.r*2,h.r*2);ctx.beginPath();ctx.moveTo(h.x-4,h.y+4);ctx.lineTo(h.x+4,h.y-4);ctx.stroke();ctx.restore()}

redraw=function(){baseRedraw();drawSelection()};
syncUi=function(){
 baseSync();
 selectBtn.classList.toggle('active',tool==='select');
 if(tool==='select'){
  penBtn.classList.remove('active');textBtn.classList.remove('active');eraserBtn.classList.remove('active');
  sizeLabel.textContent=selected?.type==='text'?(L?.textSize||'Text size'):(L?.thickness||'Thickness');
  sizeValue.textContent=selected?.type==='text'?Math.round(selected.size):size.value;
  modeBadge.textContent=selected?.type==='text'?`${X.selectWord} · ${selected.text}`:X.selectWord;
 }
 updateCursor();
};
function updateCursor(p){
 if(dragMode){canvas.style.cursor=dragMode==='resize'?'nwse-resize':'grabbing';return}
 if(tool==='select'){
  if(p&&selected&&hitHandle(p,selected)){canvas.style.cursor='nwse-resize';return}
  if(p&&hitText(p)){canvas.style.cursor='grab';return}
  canvas.style.cursor='default';return
 }
 if(tool==='text')canvas.style.cursor='text';
}
function choose(obj){selected=obj||null;redraw();syncUi()}
function switchTool(next){tool=next;if(next!=='select')selected=null;redraw();syncUi()}

function down(e){
 if(e.button!==undefined&&e.button!==0)return;
 const p=point(e);
 if(tool==='select'){
  if(selected&&hitHandle(p,selected)){
   dragMode='resize';pointerId=e.pointerId;startPoint=p;startObject={x:selected.x,y:selected.y,size:selected.size};pendingHistory=clone(strokes);try{canvas.setPointerCapture?.(e.pointerId)}catch{};updateCursor(p);e.preventDefault();return;
  }
  const hit=hitText(p);choose(hit);
  if(hit){dragMode='move';pointerId=e.pointerId;startPoint=p;startObject={x:hit.x,y:hit.y,size:hit.size};pendingHistory=clone(strokes);try{canvas.setPointerCapture?.(e.pointerId)}catch{};updateCursor(p);e.preventDefault();return}
  e.preventDefault();return;
 }
 if(tool==='text'){
  const text=prompt(L.prompt,'');
  if(text&&text.trim()){
   remember();const obj={type:'text',x:p.x,y:p.y,text:text.trim(),colour,size:fontSize()};strokes.push(obj);selected=obj;tool='select';redraw();syncUi();
  }
  e.preventDefault();return;
 }
 if(baseStart){remember();baseStart(e)}
}
function drag(e){
 const p=point(e);
 if(dragMode&&selected){
  if(dragMode==='move'){
   const dx=p.x-startPoint.x,dy=p.y-startPoint.y;selected.x=Math.min(1,Math.max(0,startObject.x+dx));selected.y=Math.min(1,Math.max(0,startObject.y+dy));
  }else{
   const m=textMetrics({...selected,size:startObject.size});const startW=Math.max(20,m.w),px=p.x*cssW,x=selected.x*cssW;const ratio=Math.max(.35,Math.min(4,(px-x)/startW));selected.size=Math.max(12,Math.min(120,Math.round(startObject.size*ratio)));
  }
  redraw();updateCursor(p);e.preventDefault();return;
 }
 if(tool==='select'){updateCursor(p);return}
 if(baseMove)baseMove(e)
}
function up(e){
 if(dragMode){
  const changed=selected&&(Math.abs(selected.x-startObject.x)>0.0005||Math.abs(selected.y-startObject.y)>0.0005||selected.size!==startObject.size);
  if(changed&&pendingHistory){history.push(pendingHistory);if(history.length>100)history.shift()}
  dragMode='';pointerId=null;startPoint=null;startObject=null;pendingHistory=null;try{canvas.releasePointerCapture?.(e.pointerId)}catch{};redraw();syncUi();e.preventDefault();return;
 }
 if(baseEnd)baseEnd(e)
}
function editSelected(){
 if(!selected||selected.type!=='text')return;
 const next=prompt(X.edit,selected.text||'');if(next===null)return;
 const clean=next.trim();if(clean===selected.text)return;
 remember();if(!clean){strokes=strokes.filter(s=>s!==selected);selected=null}else selected.text=clean;redraw();syncUi();
}
function removeSelected(){if(!selected)return;remember();strokes=strokes.filter(s=>s!==selected);selected=null;redraw();syncUi();say(X.deleted)}
function duplicateSelected(){if(!selected||selected.type!=='text')return;remember();const copy=clone(selected);copy.x=Math.min(.96,copy.x+.025);copy.y=Math.min(.96,copy.y+.035);strokes.push(copy);selected=copy;redraw();syncUi();say(X.duplicated)}

if(baseStart){canvas.removeEventListener('pointerdown',baseStart);canvas.removeEventListener('pointermove',baseMove);canvas.removeEventListener('pointerup',baseEnd);canvas.removeEventListener('pointercancel',baseEnd)}
canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',drag);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
canvas.addEventListener('dblclick',e=>{if(tool!=='select')return;const hit=hitText(point(e));if(hit){selected=hit;editSelected();e.preventDefault()}});

selectBtn.onclick=()=>switchTool('select');
penBtn.onclick=()=>switchTool('pen');textBtn.onclick=()=>switchTool('text');eraserBtn.onclick=()=>switchTool('eraser');

document.querySelectorAll('.colour').forEach(b=>{b.onclick=()=>{const next=b.dataset.colour;if(tool==='select'&&selected?.type==='text'){if(selected.colour!==next){remember();selected.colour=next;colour=next;redraw();syncUi()}return}colour=next;if(tool==='eraser')tool='pen';syncUi()}});

size.oninput=()=>{if(tool==='select'&&selected?.type==='text'){const n=fontSize();if(selected.size!==n){selected.size=n;redraw()}syncUi();return}syncUi()};

undoBtn.onclick=()=>{if(!history.length)return;const snap=history.pop();restore(snap);say(L.undoDone)};
clearBtn.onclick=()=>{if(!strokes.length)return;if(confirm(L.clearAsk)){remember();strokes=[];selected=null;current=null;redraw();syncUi();say(L.cleared)}};

document.addEventListener('keydown',e=>{
 if(/INPUT|TEXTAREA/.test(document.activeElement?.tagName))return;
 const k=e.key.toLowerCase();
 if((e.ctrlKey||e.metaKey)&&k==='d'){if(selected){e.preventDefault();e.stopImmediatePropagation();duplicateSelected()}return}
 if((e.key==='Delete'||e.key==='Backspace')&&selected){e.preventDefault();e.stopImmediatePropagation();removeSelected();return}
 if(e.key==='Escape'){if(selected){e.preventDefault();selected=null;redraw();syncUi()}return}
 if(k==='v'&&!e.ctrlKey&&!e.metaKey){tool='select';selected=null;redraw();syncUi();return}
},true);

tool='select';selected=null;redraw();syncUi();
})();
