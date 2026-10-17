(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function'||typeof syncUi!=='function')return;
const visibilityStyle=document.createElement('style');
visibilityStyle.textContent='#textBtn,#eraserBtn,#selectBtn,#highlighterBtn,#redoBtn{display:inline-flex!important}.colors,.sizeControl{display:flex!important}';
document.head.appendChild(visibilityStyle);
for(const el of [document.getElementById('textBtn'),document.getElementById('eraserBtn'),document.querySelector('.colors'),document.querySelector('.sizeControl')])if(el)el.hidden=false;
const edition=(new URLSearchParams(location.search).get('edition')||'en').toLowerCase();
const labels={
 en:{high:'🖍 Highlighter',redo:'Redo',thickness:'Thickness'},
 zh:{high:'🖍 荧光笔',redo:'重做',thickness:'粗细'},
 ms:{high:'🖍 Penyerlah',redo:'Buat semula',thickness:'Ketebalan'},
 ta:{high:'🖍 சிறப்புக்குறி',redo:'மீண்டும் செய்',thickness:'தடிமன்'}
};
const X=labels[edition]||labels.en;
const tools=document.querySelector('.tools');if(!tools)return;
const snap=()=>JSON.stringify(strokes);
let highlightDrawing=false,highlightCurrent=null,redoStack=[],restoring=false,mutationBefore=null;
function rgba(hex,a){
 const m=String(hex||'').match(/^#([0-9a-f]{6})$/i);if(!m)return `rgba(255,235,59,${a})`;
 const n=parseInt(m[1],16);return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;
}
function point(e){const r=canvas.getBoundingClientRect();return{x:Math.min(1,Math.max(0,(e.clientX-r.left)/r.width)),y:Math.min(1,Math.max(0,(e.clientY-r.top)/r.height))}}
const highBtn=document.createElement('button');highBtn.className='btn';highBtn.id='highlighterBtn';highBtn.type='button';highBtn.textContent=X.high;highBtn.title=X.high.replace(/^🖍\s*/, '');penBtn.insertAdjacentElement('afterend',highBtn);
const redoBtn=document.createElement('button');redoBtn.className='btn';redoBtn.id='redoBtn';redoBtn.type='button';redoBtn.textContent='↷';redoBtn.title=X.redo;redoBtn.setAttribute('aria-label',X.redo);redoBtn.disabled=true;undoBtn.insertAdjacentElement('afterend',redoBtn);
const baseSync=syncUi;
syncUi=function(){
 baseSync();
 highBtn.classList.toggle('active',tool==='highlight');
 redoBtn.disabled=redoStack.length===0;
 if(tool==='highlight'){
  penBtn.classList.remove('active');textBtn.classList.remove('active');eraserBtn.classList.remove('active');
  sizeLabel.textContent=X.thickness;sizeValue.textContent=Math.max(14,Number(size.value)*3);
  modeBadge.textContent=`${highBtn.title} · ${Math.max(14,Number(size.value)*3)} px`;
  canvas.style.cursor='crosshair';
 }
};
highBtn.onclick=()=>{tool='highlight';syncUi()};
function beginHighlight(e){
 if(tool!=='highlight'||(e.button!==undefined&&e.button!==0))return;
 redoStack=[];highlightDrawing=true;highlightCurrent={erase:false,highlight:true,colour:rgba(colour,.32),size:Math.max(14,Number(size.value)*3),points:[point(e)]};current=highlightCurrent;
 try{canvas.setPointerCapture?.(e.pointerId)}catch{}
 redraw();syncUi();e.preventDefault();e.stopImmediatePropagation();
}
function moveHighlight(e){
 if(!highlightDrawing||tool!=='highlight'||!highlightCurrent)return;
 const p=point(e),last=highlightCurrent.points.at(-1);if(!last||Math.hypot((p.x-last.x)*cssW,(p.y-last.y)*cssH)>=1.5){highlightCurrent.points.push(p);redraw()}
 e.preventDefault();e.stopImmediatePropagation();
}
function endHighlight(e){
 if(!highlightDrawing||tool!=='highlight'||!highlightCurrent)return;
 highlightDrawing=false;strokes.push(highlightCurrent);highlightCurrent=null;current=null;
 try{canvas.releasePointerCapture?.(e.pointerId)}catch{}
 redraw();syncUi();e.preventDefault();e.stopImmediatePropagation();
}
canvas.addEventListener('pointerdown',beginHighlight,true);canvas.addEventListener('pointermove',moveHighlight,true);canvas.addEventListener('pointerup',endHighlight,true);canvas.addEventListener('pointercancel',endHighlight,true);
undoBtn.addEventListener('click',()=>{if(restoring)return;redoStack.push(snap());if(redoStack.length>50)redoStack.shift();requestAnimationFrame(()=>{redoBtn.disabled=redoStack.length===0})},true);
redoBtn.onclick=()=>{
 if(!redoStack.length)return;restoring=true;
 try{penBtn.click()}catch{}
 const s=redoStack.pop();strokes=JSON.parse(s);current=null;drawing=false;highlightDrawing=false;highlightCurrent=null;redraw();syncUi();restoring=false;
};
function rememberBefore(){if(restoring)return;mutationBefore=snap()}
function checkAfter(){if(restoring||mutationBefore===null)return;const before=mutationBefore;mutationBefore=null;requestAnimationFrame(()=>{if(!restoring&&snap()!==before){redoStack=[];redoBtn.disabled=true}})}
document.addEventListener('pointerdown',e=>{if(e.target===undoBtn||e.target===redoBtn)return;rememberBefore()},true);
document.addEventListener('pointerup',e=>{if(e.target===undoBtn||e.target===redoBtn)return;checkAfter()},true);
document.addEventListener('click',e=>{if(e.target===undoBtn||e.target===redoBtn)return;if(mutationBefore===null)rememberBefore();checkAfter()},true);
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();redoBtn.click()}},true);
syncUi();
})();
