(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function'||typeof syncUi!=='function'||typeof drawStroke!=='function')return;

const labels={
 en:{select:'↖ Select',selectWord:'Select',editBtn:'✎ Edit',edit:'Edit text:',imageBtn:'🖼 Image',imageWord:'Image',imageAdded:'Image added',imageFail:'Could not add that image',deleted:'Object deleted',duplicated:'Object duplicated'},
 zh:{select:'↖ 选择',selectWord:'选择',editBtn:'✎ 编辑',edit:'编辑文字：',imageBtn:'🖼 图片',imageWord:'图片',imageAdded:'图片已添加',imageFail:'无法添加该图片',deleted:'对象已删除',duplicated:'对象已复制'},
 ms:{select:'↖ Pilih',selectWord:'Pilih',editBtn:'✎ Edit',edit:'Edit teks:',imageBtn:'🖼 Imej',imageWord:'Imej',imageAdded:'Imej ditambah',imageFail:'Imej itu tidak dapat ditambah',deleted:'Objek dipadam',duplicated:'Objek diduplikasi'},
 ta:{select:'↖ தேர்வு',selectWord:'தேர்வு',editBtn:'✎ திருத்து',edit:'உரையைத் திருத்தவும்:',imageBtn:'🖼 படம்',imageWord:'படம்',imageAdded:'படம் சேர்க்கப்பட்டது',imageFail:'அந்தப் படத்தைச் சேர்க்க முடியவில்லை',deleted:'பொருள் நீக்கப்பட்டது',duplicated:'பொருள் நகலெடுக்கப்பட்டது'}
};
const lang=(typeof edition==='string'&&labels[edition])?edition:'en',X=labels[lang];
const baseSync=syncUi,baseStart=typeof start==='function'?start:null,baseMove=typeof move==='function'?move:null,baseEnd=typeof end==='function'?end:null,baseDrawStroke=drawStroke;
const clone=v=>JSON.parse(JSON.stringify(v));
const imageCache=new Map();
let selected=null,dragMode='',startPoint=null,startObject=null,pendingHistory=null,history=[];
let lastTapObject=null,lastTapTime=0,movedDuringGesture=false;

const selectBtn=document.createElement('button');
selectBtn.className='btn';selectBtn.id='selectBtn';selectBtn.type='button';selectBtn.textContent=X.select;
penBtn.parentElement.insertBefore(selectBtn,penBtn);
const editBtn=document.createElement('button');
editBtn.className='btn';editBtn.id='editTextBtn';editBtn.type='button';editBtn.textContent=X.editBtn;editBtn.disabled=true;
penBtn.parentElement.insertBefore(editBtn,textBtn.nextSibling);
const imageBtn=document.createElement('button');
imageBtn.className='btn';imageBtn.id='imageBtn';imageBtn.type='button';imageBtn.textContent=X.imageBtn;
penBtn.parentElement.insertBefore(imageBtn,eraserBtn);
const imageInput=document.createElement('input');
imageInput.type='file';imageInput.accept='image/*';imageInput.multiple=true;imageInput.hidden=true;document.body.appendChild(imageInput);

function remember(){history.push(clone(strokes));if(history.length>100)history.shift()}
function restore(snapshot){strokes=clone(snapshot);selected=null;current=null;drawing=false;dragMode='';redraw();syncUi()}
function textMetrics(s){ctx.save();ctx.font=`700 ${s.size}px Inter,system-ui,sans-serif`;const w=Math.max(8,ctx.measureText(s.text||'').width);ctx.restore();return{w,h:Math.max(12,s.size*1.2)}}
function point(e){const r=canvas.getBoundingClientRect();return{x:Math.min(1,Math.max(0,(e.clientX-r.left)/r.width)),y:Math.min(1,Math.max(0,(e.clientY-r.top)/r.height))}}
function bounds(s){
 if(!s)return null;
 if(s.type==='text'){const m=textMetrics(s);return{x:s.x*cssW,y:s.y*cssH,w:m.w,h:m.h}}
 if(s.type==='image')return{x:s.x*cssW,y:s.y*cssH,w:s.w*cssW,h:s.h*cssH};
 return null;
}
function hitObject(p){const px=p.x*cssW,py=p.y*cssH;for(let i=strokes.length-1;i>=0;i--){const s=strokes[i];if(s?.type!=='text'&&s?.type!=='image')continue;const b=bounds(s),pad=s.type==='image'?5:10;if(px>=b.x-pad&&px<=b.x+b.w+pad&&py>=b.y-pad&&py<=b.y+b.h+pad)return s}return null}
function handleBox(s){const b=bounds(s);if(!b)return null;return{x:b.x+b.w+8,y:b.y+b.h+8,r:12,b}}
function hitHandle(p,s){const h=handleBox(s);if(!h)return false;const px=p.x*cssW,py=p.y*cssH;return Math.abs(px-h.x)<=22&&Math.abs(py-h.y)<=22}
function getImage(src){
 let img=imageCache.get(src);if(img)return img;
 img=new Image();imageCache.set(src,img);img.onload=()=>redraw();img.src=src;return img;
}
function drawImageObject(s){const img=getImage(s.src);if(!img.complete||!img.naturalWidth)return;const b=bounds(s);ctx.save();ctx.globalCompositeOperation='source-over';ctx.drawImage(img,b.x,b.y,b.w,b.h);ctx.restore()}
function drawSelection(){
 if(!selected||!strokes.includes(selected))return;const b=bounds(selected);if(!b)return;
 ctx.save();ctx.strokeStyle='rgba(15,118,110,.98)';ctx.lineWidth=2;ctx.setLineDash([6,4]);ctx.strokeRect(b.x-7,b.y-6,b.w+14,b.h+12);ctx.setLineDash([]);
 const h=handleBox(selected);ctx.fillStyle='#0f766e';ctx.strokeStyle='#ffffff';ctx.lineWidth=2;ctx.fillRect(h.x-h.r,h.y-h.r,h.r*2,h.r*2);ctx.strokeRect(h.x-h.r,h.y-h.r,h.r*2,h.r*2);
 ctx.strokeStyle='#ffffff';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(h.x-6,h.y+6);ctx.lineTo(h.x+6,h.y-6);ctx.moveTo(h.x+1,h.y-6);ctx.lineTo(h.x+6,h.y-6);ctx.lineTo(h.x+6,h.y-1);ctx.stroke();ctx.restore();
}

redraw=function(){ctx.clearRect(0,0,cssW,cssH);for(const s of strokes){if(s?.type==='image')drawImageObject(s);else baseDrawStroke(s)}if(current)baseDrawStroke(current);drawSelection()};
syncUi=function(){
 baseSync();undoBtn.disabled=history.length===0;selectBtn.classList.toggle('active',tool==='select');editBtn.disabled=!(tool==='select'&&selected?.type==='text');
 if(tool==='select'){
  penBtn.classList.remove('active');textBtn.classList.remove('active');eraserBtn.classList.remove('active');
  if(selected?.type==='text'){sizeLabel.textContent=L?.textSize||'Text size';sizeValue.textContent=Math.round(selected.size);modeBadge.textContent=`${X.selectWord} · ${selected.text}`}
  else if(selected?.type==='image'){sizeLabel.textContent=X.imageWord;sizeValue.textContent='';modeBadge.textContent=`${X.selectWord} · ${X.imageWord}`}
  else{sizeLabel.textContent=L?.thickness||'Thickness';sizeValue.textContent=size.value;modeBadge.textContent=X.selectWord}
 }
 updateCursor();
};
function updateCursor(p){
 if(dragMode){canvas.style.cursor=dragMode==='resize'?'nwse-resize':'grabbing';return}
 if(tool==='select'){
  if(p&&selected&&hitHandle(p,selected)){canvas.style.cursor='nwse-resize';return}
  if(p&&hitObject(p)){canvas.style.cursor='grab';return}
  canvas.style.cursor='default';return
 }
 if(tool==='text')canvas.style.cursor='text';
}
function choose(obj){selected=obj||null;redraw();syncUi()}
function switchTool(next){tool=next;if(next!=='select')selected=null;redraw();syncUi()}

function down(e){
 if(e.button!==undefined&&e.button!==0)return;const p=point(e);movedDuringGesture=false;
 if(tool==='select'){
  if(selected&&hitHandle(p,selected)){
   const b=bounds(selected);dragMode='resize';startPoint=p;startObject={x:selected.x,y:selected.y,size:selected.size,w:selected.w,h:selected.h,pxW:b.w,pxH:b.h};pendingHistory=clone(strokes);try{canvas.setPointerCapture?.(e.pointerId)}catch{};updateCursor(p);e.preventDefault();return;
  }
  const hit=hitObject(p);choose(hit);
  if(hit){dragMode='move';startPoint=p;startObject={x:hit.x,y:hit.y,size:hit.size,w:hit.w,h:hit.h};pendingHistory=clone(strokes);try{canvas.setPointerCapture?.(e.pointerId)}catch{};updateCursor(p);e.preventDefault();return}
  e.preventDefault();return;
 }
 if(tool==='text'){
  const text=prompt(L.prompt,'');if(text&&text.trim()){remember();const obj={type:'text',x:p.x,y:p.y,text:text.trim(),colour,size:fontSize()};strokes.push(obj);selected=obj;tool='select';redraw();syncUi()}e.preventDefault();return;
 }
 if(baseStart){remember();baseStart(e);syncUi()}
}
function drag(e){
 const p=point(e);
 if(dragMode&&selected){
  if(startPoint&&Math.hypot((p.x-startPoint.x)*cssW,(p.y-startPoint.y)*cssH)>3)movedDuringGesture=true;
  if(dragMode==='move'){
   const dx=p.x-startPoint.x,dy=p.y-startPoint.y;const maxX=selected.type==='image'?Math.max(0,1-selected.w):1,maxY=selected.type==='image'?Math.max(0,1-selected.h):1;selected.x=Math.min(maxX,Math.max(0,startObject.x+dx));selected.y=Math.min(maxY,Math.max(0,startObject.y+dy));
  }else if(selected.type==='text'){
   const px=p.x*cssW,x=selected.x*cssW,startW=Math.max(20,startObject.pxW);const ratio=Math.max(.35,Math.min(4,(px-x)/startW));selected.size=Math.max(12,Math.min(120,Math.round(startObject.size*ratio)));
  }else if(selected.type==='image'){
   const px=p.x*cssW,py=p.y*cssH,x=selected.x*cssW,y=selected.y*cssH;const ratioX=Math.max(.08,(px-x)/Math.max(20,startObject.pxW)),ratioY=Math.max(.08,(py-y)/Math.max(20,startObject.pxH));const ratio=Math.max(.08,Math.min(5,Math.max(ratioX,ratioY)));let newW=(startObject.pxW*ratio)/cssW,newH=(startObject.pxH*ratio)/cssH;const cap=Math.min(1/Math.max(newW,.0001),1/Math.max(newH,.0001),1);newW*=cap;newH*=cap;selected.w=Math.max(.04,newW);selected.h=Math.max(.04,newH);selected.x=Math.min(Math.max(0,1-selected.w),selected.x);selected.y=Math.min(Math.max(0,1-selected.h),selected.y);
  }
  redraw();updateCursor(p);e.preventDefault();return;
 }
 if(tool==='select'){updateCursor(p);return}
 if(baseMove)baseMove(e)
}
function up(e){
 if(dragMode){
  const obj=selected,wasMode=dragMode;const changed=obj&&(Math.abs(obj.x-startObject.x)>0.0005||Math.abs(obj.y-startObject.y)>0.0005||obj.size!==startObject.size||obj.w!==startObject.w||obj.h!==startObject.h);
  if(changed&&pendingHistory){history.push(pendingHistory);if(history.length>100)history.shift()}
  dragMode='';startPoint=null;startObject=null;pendingHistory=null;try{canvas.releasePointerCapture?.(e.pointerId)}catch{};redraw();syncUi();
  if(wasMode==='move'&&!movedDuringGesture&&obj?.type==='text'){const now=Date.now();if(lastTapObject===obj&&now-lastTapTime<500){lastTapObject=null;lastTapTime=0;setTimeout(()=>editSelected(),0)}else{lastTapObject=obj;lastTapTime=now}}
  e.preventDefault();return;
 }
 if(baseEnd){baseEnd(e);syncUi()}
}
function editSelected(){if(!selected||selected.type!=='text')return;const next=prompt(X.edit,selected.text||'');if(next===null)return;const clean=next.trim();if(clean===selected.text)return;remember();if(!clean){strokes=strokes.filter(s=>s!==selected);selected=null}else selected.text=clean;redraw();syncUi()}
function removeSelected(){if(!selected)return;remember();strokes=strokes.filter(s=>s!==selected);selected=null;redraw();syncUi();say(X.deleted)}
function duplicateSelected(){if(!selected||(selected.type!=='text'&&selected.type!=='image'))return;remember();const copy=clone(selected);copy.x=Math.min(selected.type==='image'?Math.max(0,1-copy.w):.96,copy.x+.025);copy.y=Math.min(selected.type==='image'?Math.max(0,1-copy.h):.96,copy.y+.035);strokes.push(copy);selected=copy;tool='select';redraw();syncUi();say(X.duplicated)}

function addImageFile(file,at){
 if(!file||!file.type?.startsWith('image/'))return;const reader=new FileReader();reader.onerror=()=>say(X.imageFail);reader.onload=()=>{const src=String(reader.result||'');const img=new Image();img.onerror=()=>say(X.imageFail);img.onload=()=>{const maxW=cssW*.55,maxH=cssH*.55,scale=Math.min(1,maxW/img.naturalWidth,maxH/img.naturalHeight);const pxW=Math.max(40,img.naturalWidth*scale),pxH=Math.max(40,img.naturalHeight*scale),w=Math.min(.9,pxW/cssW),h=Math.min(.9,pxH/cssH),anchor=at||{x:.5,y:.5};remember();const obj={type:'image',src,x:Math.min(Math.max(0,1-w),Math.max(0,anchor.x-w/2)),y:Math.min(Math.max(0,1-h),Math.max(0,anchor.y-h/2)),w,h};imageCache.set(src,img);strokes.push(obj);selected=obj;tool='select';redraw();syncUi();say(X.imageAdded)};img.src=src};reader.readAsDataURL(file);
}
function addImageFiles(files,at){Array.from(files||[]).filter(f=>f.type?.startsWith('image/')).forEach((f,i)=>addImageFile(f,at?{x:Math.min(.9,at.x+i*.03),y:Math.min(.9,at.y+i*.03)}:null))}

if(baseStart){canvas.removeEventListener('pointerdown',baseStart);canvas.removeEventListener('pointermove',baseMove);canvas.removeEventListener('pointerup',baseEnd);canvas.removeEventListener('pointercancel',baseEnd)}
canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',drag);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
canvas.addEventListener('dblclick',e=>{if(tool!=='select')return;const hit=hitObject(point(e));if(hit?.type==='text'){selected=hit;editSelected();e.preventDefault();e.stopPropagation()}});

selectBtn.onclick=()=>switchTool('select');editBtn.onclick=()=>editSelected();imageBtn.onclick=()=>imageInput.click();imageInput.onchange=()=>{addImageFiles(imageInput.files);imageInput.value=''};
penBtn.onclick=()=>switchTool('pen');textBtn.onclick=()=>switchTool('text');eraserBtn.onclick=()=>switchTool('eraser');
document.querySelectorAll('.colour').forEach(b=>{b.onclick=()=>{const next=b.dataset.colour;if(tool==='select'&&selected?.type==='text'){if(selected.colour!==next){remember();selected.colour=next;colour=next;redraw();syncUi()}return}colour=next;if(tool==='eraser')tool='pen';syncUi()}});
size.oninput=()=>{if(tool==='select'&&selected?.type==='text'){selected.size=fontSize();redraw();syncUi();return}syncUi()};
undoBtn.onclick=()=>{if(!history.length)return;const snap=history.pop();restore(snap);say(L.undoDone)};
clearBtn.onclick=()=>{if(!strokes.length)return;if(confirm(L.clearAsk)){remember();strokes=[];selected=null;current=null;redraw();syncUi();say(L.cleared)}};

document.addEventListener('paste',e=>{const items=Array.from(e.clipboardData?.items||[]);const files=items.filter(i=>i.type?.startsWith('image/')).map(i=>i.getAsFile()).filter(Boolean);if(files.length){e.preventDefault();addImageFiles(files)}});
wrap.addEventListener('dragover',e=>{if(Array.from(e.dataTransfer?.items||[]).some(i=>i.kind==='file'&&i.type?.startsWith('image/'))){e.preventDefault();e.dataTransfer.dropEffect='copy'}});
wrap.addEventListener('drop',e=>{const files=Array.from(e.dataTransfer?.files||[]).filter(f=>f.type?.startsWith('image/'));if(!files.length)return;e.preventDefault();addImageFiles(files,point(e))});

document.addEventListener('keydown',e=>{
 if(/INPUT|TEXTAREA/.test(document.activeElement?.tagName))return;const k=e.key.toLowerCase();
 if((e.ctrlKey||e.metaKey)&&k==='d'){if(selected){e.preventDefault();e.stopImmediatePropagation();duplicateSelected()}return}
 if((e.key==='Delete'||e.key==='Backspace')&&selected){e.preventDefault();e.stopImmediatePropagation();removeSelected();return}
 if(e.key==='Enter'&&selected?.type==='text'){e.preventDefault();editSelected();return}
 if(e.key==='Escape'){if(selected){e.preventDefault();selected=null;redraw();syncUi()}return}
 if(k==='v'&&!e.ctrlKey&&!e.metaKey){tool='select';selected=null;redraw();syncUi();return}
},true);

tool='select';selected=null;redraw();syncUi();
})();
