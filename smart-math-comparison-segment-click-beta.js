(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function')return;
const wrap=document.getElementById('boardWrap');if(!wrap)return;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const clone=v=>JSON.parse(JSON.stringify(v));
const X0=180,MAX_W=650,START_Y=60,ROW_GAP=145,BAR_H=76;
const PALETTE=[
 {name:'White',value:'#ffffff'},
 {name:'Yellow',value:'#fde68a'},
 {name:'Orange',value:'#fdba74'},
 {name:'Blue',value:'#93c5fd'},
 {name:'Green',value:'#86efac'},
 {name:'Purple',value:'#c4b5fd'}
];
let rebuilding=false,panel=null,placementPanel=null,drag=null,preview=null;

function isComparison(o){return !!(o&&o.smartType==='barModel'&&o.smartBarType==='comparison'&&Number.isFinite(o.x)&&Number.isFinite(o.y)&&Number.isFinite(o.w)&&Number.isFinite(o.h));}
function count(o){return clamp(Math.round(Number(o?.barCount)||2),2,5)}
function modelH(o){return Math.max(340,150+count(o)*145)}
function widths(o){const n=count(o),a=Array.isArray(o?.barCompareWidths)?o.barCompareWidths:[];return Array.from({length:n},(_,i)=>clamp(Number(a[i]??(1-i*.11))||.5,.16,1))}
function uniqueSorted(values){const out=[];for(const v of values.slice().sort((a,b)=>a-b)){if(!out.length||Math.abs(v-out[out.length-1])>.012)out.push(v)}return out}
function smallSegments(o,row){
 const ws=widths(o),own=ws[row],ends=uniqueSorted(ws).filter(v=>v<=own+.012),bounds=[0,...ends],out=[];
 for(let i=0;i<bounds.length-1;i++){
  const a=bounds[i],b=bounds[i+1];if(b-a<.025)continue;
  out.push({row,index:out.length,a,b,x1:(X0+MAX_W*a)/900,x2:(X0+MAX_W*b)/900});
 }
 return out;
}
function sameSpan(b,row,x1,x2){return !!(b&&b.visible!==false&&Number(b.row)===row&&Math.abs(Number(b.x1)-x1)<.003&&Math.abs(Number(b.x2)-x2)<.003)}
function ensureStore(o){if(!Array.isArray(o.segmentBrackets))o.segmentBrackets=[];return o.segmentBrackets}
function ensureColours(o){if(!Array.isArray(o.segmentColours))o.segmentColours=[];return o.segmentColours}
function colourFor(o,row,index){return ensureColours(o).find(c=>c&&Number(c.row)===row&&Number(c.index)===index)?.colour||null}
function setColour(o,row,index,colour){
 const list=ensureColours(o),i=list.findIndex(c=>c&&Number(c.row)===row&&Number(c.index)===index);
 if(i>=0)list[i].colour=colour;else list.push({row,index,colour});
}
function notify(msg){if(typeof say==='function'){try{say(msg);return}catch{}}const t=document.getElementById('toast');if(t){t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1300)}}
function history(o,before){window.__smartBarLastHistory={before,afterId:o.smartId}}

function commitSelection(o,picked,side,colour){
 if(!picked.length)return;
 const row=picked[0].row,x1=picked[0].x1,x2=picked[picked.length-1].x2,before=clone(strokes),list=ensureStore(o);
 if(colour)for(const seg of picked)setColour(o,row,seg.index,colour);
 let b=list.find(q=>sameSpan(q,row,x1,x2));
 if(b){
  b.side=side==='bottom'?'bottom':'top';
  b.segmentCount=picked.length;
  notify(colour?'Bracket and segment colour updated':'Bracket position updated');
 }else{
  b={id:'segment-'+Date.now()+'-'+row,row,x1,x2,side:side==='bottom'?'bottom':'top',label:'',visible:true,segmentCount:picked.length};
  list.push(b);
  notify(picked.length>1?`Bracket added across ${picked.length} segments`:'Bracket added to segment');
 }
 history(o,before);
 try{redraw();if(typeof syncUi==='function')syncUi()}catch{}
}

function closePanel(){if(panel){panel.remove();panel=null}}
function closePlacement(clearPreview=true){if(placementPanel){placementPanel.remove();placementPanel=null}if(clearPreview){preview=null;requestAnimationFrame(drawAll)}}
function requestPlacement(o,picked,clientX,clientY){
 closePlacement(false);if(!picked.length)return;
 const row=picked[0].row,x1=picked[0].x1,x2=picked[picked.length-1].x2;
 preview={o,row,x1,x2};requestAnimationFrame(drawAll);
 let selectedColour=null;
 placementPanel=document.createElement('div');
 placementPanel.style.cssText='position:fixed;z-index:13100;width:270px;padding:10px;background:#fff;border:1px solid #cfd9de;border-radius:13px;box-shadow:0 10px 28px rgba(23,50,77,.24)';
 placementPanel.style.left=Math.min(innerWidth-280,Math.max(8,clientX-125))+'px';
 placementPanel.style.top=Math.min(innerHeight-188,Math.max(8,clientY+12))+'px';
 const title=document.createElement('div');title.textContent='Segment options';title.style.cssText='font:900 12px Inter,system-ui,sans-serif;color:#17324d;margin-bottom:3px';
 const desc=document.createElement('div');desc.textContent=picked.length>1?`${picked.length} selected segments`:'1 selected segment';desc.style.cssText='font:700 10px Inter,system-ui,sans-serif;color:#667085;margin-bottom:8px';
 const colourLabel=document.createElement('div');colourLabel.textContent='Colour';colourLabel.style.cssText='font:900 10px Inter,system-ui,sans-serif;color:#17324d;margin-bottom:5px';
 const colours=document.createElement('div');colours.style.cssText='display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:10px';
 const keep=document.createElement('button');keep.type='button';keep.title='Keep current colour';keep.setAttribute('aria-label','Keep current colour');keep.textContent='Keep';keep.style.cssText='height:28px;border:2px solid #0f766e;border-radius:9px;background:#fff;padding:0 8px;font-size:10px;font-weight:900;color:#17324d';
 const swatches=[];
 const markColours=()=>{
  keep.style.borderColor=selectedColour===null?'#0f766e':'#cbd5e1';
  keep.style.boxShadow=selectedColour===null?'0 0 0 2px rgba(15,118,110,.16)':'none';
  for(const s of swatches){const on=s.dataset.colour===selectedColour;s.style.borderColor=on?'#0f766e':'#fff';s.style.boxShadow=on?'0 0 0 2px #0f766e':'0 0 0 1px #cbd5e1'}
 };
 keep.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();selectedColour=null;markColours()},true);
 colours.appendChild(keep);
 for(const c of PALETTE){
  const s=document.createElement('button');s.type='button';s.dataset.colour=c.value;s.title=c.name;s.setAttribute('aria-label',c.name+' segment colour');s.style.cssText=`width:28px;height:28px;border:2px solid #fff;border-radius:50%;background:${c.value};padding:0;box-shadow:0 0 0 1px #cbd5e1`;
  s.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();selectedColour=c.value;markColours()},true);swatches.push(s);colours.appendChild(s);
 }
 markColours();
 const sideLabel=document.createElement('div');sideLabel.textContent='Bracket position';sideLabel.style.cssText='font:900 10px Inter,system-ui,sans-serif;color:#17324d;margin-bottom:5px';
 const sideRow=document.createElement('div');sideRow.style.cssText='display:flex;gap:6px';
 const above=document.createElement('button');above.type='button';above.className='btn soft';above.textContent='↑ Above';above.style.flex='1';
 const below=document.createElement('button');below.type='button';below.className='btn soft';below.textContent='↓ Below';below.style.flex='1';
 const choose=side=>{closePlacement();commitSelection(o,picked,side,selectedColour)};
 above.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();choose('top')},true);
 below.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();choose('bottom')},true);
 sideRow.append(above,below);placementPanel.append(title,desc,colourLabel,colours,sideLabel,sideRow);document.body.appendChild(placementPanel);
}
function showPanel(o,b,clientX,clientY){
 closePanel();panel=document.createElement('div');panel.style.cssText='position:fixed;z-index:13050;width:260px;padding:10px;background:#fff;border:1px solid #cfd9de;border-radius:13px;box-shadow:0 10px 28px rgba(23,50,77,.22)';panel.style.left=Math.min(innerWidth-270,Math.max(8,clientX-125))+'px';panel.style.top=Math.min(innerHeight-178,Math.max(8,clientY+10))+'px';
 const title=document.createElement('div');title.textContent=(Number(b.segmentCount)||1)>1?`${b.segmentCount} segments bracket`:'Segment bracket';title.style.cssText='font:900 12px Inter,system-ui,sans-serif;color:#17324d;margin-bottom:7px';
 const input=document.createElement('input');input.type='text';input.maxLength=30;input.placeholder='Type label';input.value=b.label||'';input.style.cssText='width:100%;border:1px solid #cfd9de;border-radius:9px;padding:7px 8px;font-size:12px;font-weight:700;color:#17324d;margin-bottom:7px';
 const sideRow=document.createElement('div');sideRow.style.cssText='display:flex;gap:6px;margin-bottom:7px';
 const topBtn=document.createElement('button');topBtn.type='button';topBtn.className='btn soft';topBtn.textContent='↑ Above';topBtn.style.flex='1';
 const bottomBtn=document.createElement('button');bottomBtn.type='button';bottomBtn.className='btn soft';bottomBtn.textContent='↓ Below';bottomBtn.style.flex='1';
 const markSide=()=>{topBtn.classList.toggle('active',b.side!=='bottom');bottomBtn.classList.toggle('active',b.side==='bottom')};markSide();
 topBtn.onclick=e=>{e.preventDefault();e.stopPropagation();b.side='top';markSide();redraw()};
 bottomBtn.onclick=e=>{e.preventDefault();e.stopPropagation();b.side='bottom';markSide();redraw()};
 sideRow.append(topBtn,bottomBtn);
 const actions=document.createElement('div');actions.style.cssText='display:flex;gap:6px';
 const apply=document.createElement('button');apply.type='button';apply.className='btn soft';apply.textContent='Apply';apply.style.flex='1';
 const del=document.createElement('button');del.type='button';del.className='btn danger';del.textContent='Delete bracket';del.style.flex='1';
 apply.onclick=e=>{e.preventDefault();e.stopPropagation();const x=ensureStore(o).find(q=>q.id===b.id);if(x)x.label=input.value.trim();closePanel();redraw();if(typeof syncUi==='function')syncUi()};
 del.onclick=e=>{e.preventDefault();e.stopPropagation();const before=clone(strokes),list=ensureStore(o),i=list.findIndex(q=>q.id===b.id);if(i>=0)list.splice(i,1);history(o,before);closePanel();redraw();if(typeof syncUi==='function')syncUi();notify('Bracket deleted')};
 input.onkeydown=e=>{if(e.key==='Enter')apply.click();else if(e.key==='Escape')closePanel()};
 actions.append(apply,del);panel.append(title,input,sideRow,actions);document.body.appendChild(panel);setTimeout(()=>input.focus(),0);
}

let colourOv=document.getElementById('comparisonSegmentColourOverlay');
if(!colourOv){colourOv=document.createElement('canvas');colourOv.id='comparisonSegmentColourOverlay';colourOv.setAttribute('aria-hidden','true');colourOv.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:914;pointer-events:none;';wrap.appendChild(colourOv)}
const cg=colourOv.getContext('2d');
let ov=document.getElementById('comparisonSegmentBracketOverlay');
if(!ov){ov=document.createElement('canvas');ov.id='comparisonSegmentBracketOverlay';ov.setAttribute('aria-hidden','true');ov.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:938;pointer-events:none;';wrap.appendChild(ov)}
const g=ov.getContext('2d');
function sizeCanvas(c,ctx){const r=wrap.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2),w=Math.max(1,Math.round(r.width*d)),h=Math.max(1,Math.round(r.height*d));if(c.width!==w)c.width=w;if(c.height!==h)c.height=h;c.style.width=r.width+'px';c.style.height=r.height+'px';ctx.setTransform(d,0,0,d,0,0);return{W:r.width,H:r.height}}
function rowGeom(o,row,W,H){const Hm=modelH(o),y=START_Y+row*ROW_GAP;return{y1:(o.y+o.h*(y/Hm))*H,y2:(o.y+o.h*((y+BAR_H)/Hm))*H}}
function drawColours(){
 const {W,H}=sizeCanvas(colourOv,cg);cg.clearRect(0,0,W,H);
 for(const o of strokes){if(!isComparison(o))continue;for(let row=0;row<count(o);row++){const segs=smallSegments(o,row),rg=rowGeom(o,row,W,H);for(const seg of segs){const colour=colourFor(o,row,seg.index);if(!colour)continue;const rawX1=(o.x+o.w*seg.x1)*W,rawX2=(o.x+o.w*seg.x2)*W,x1=rawX1+(seg.index===0?4:0),x2=rawX2-(seg.index===segs.length-1?4:0),y1=rg.y1+4,y2=rg.y2-4;if(x2<=x1||y2<=y1)continue;cg.fillStyle=colour;cg.fillRect(x1,y1,x2-x1,y2-y1)}}}
}
function brace(x1,x2,y,top,label){if(x2<x1)[x1,x2]=[x2,x1];const w=Math.max(18,x2-x1),mid=(x1+x2)/2,end=clamp(w*.05,5,11),neck=clamp(w*.035,5,9),depth=8,edgeDir=top?1:-1,notchDir=top?-1:1;g.save();g.strokeStyle='#111827';g.fillStyle='#111827';g.lineWidth=2.3;g.lineCap='round';g.lineJoin='round';g.beginPath();g.moveTo(x1,y+edgeDir*depth);g.bezierCurveTo(x1,y+edgeDir*3,x1+2,y,x1+end,y);g.lineTo(mid-neck,y);g.bezierCurveTo(mid-neck*.35,y,mid-4,y+notchDir*2,mid,y+notchDir*depth);g.bezierCurveTo(mid+4,y+notchDir*2,mid+neck*.35,y,mid+neck,y);g.lineTo(x2-end,y);g.bezierCurveTo(x2-2,y,x2,y+edgeDir*3,x2,y+edgeDir*depth);g.stroke();if(label){g.font='700 20px Arial,sans-serif';g.textAlign='center';g.textBaseline=top?'bottom':'top';g.fillText(label,mid,y+(top?-16:16))}g.restore()}
function drawBrackets(){
 const {W,H}=sizeCanvas(ov,g);g.clearRect(0,0,W,H);
 for(const o of strokes){if(!isComparison(o)||!Array.isArray(o.segmentBrackets))continue;for(const b of o.segmentBrackets){if(!b||b.visible===false)continue;const rg=rowGeom(o,clamp(Number(b.row)||0,0,count(o)-1),W,H),x1=(o.x+o.w*Number(b.x1||0))*W,x2=(o.x+o.w*Number(b.x2||0))*W,top=b.side!=='bottom',y=top?rg.y1-13:rg.y2+13;brace(x1,x2,y,top,b.label||'')}}
 if(preview){const o=preview.o,rg=rowGeom(o,preview.row,W,H),x1=(o.x+o.w*preview.x1)*W,x2=(o.x+o.w*preview.x2)*W;g.save();g.fillStyle='rgba(37,99,235,.14)';g.strokeStyle='rgba(37,99,235,.85)';g.lineWidth=3;g.fillRect(x1,rg.y1,Math.max(2,x2-x1),Math.max(2,rg.y2-rg.y1));g.strokeRect(x1+1.5,rg.y1+1.5,Math.max(1,x2-x1-3),Math.max(1,rg.y2-rg.y1-3));g.restore()}
}
function drawAll(){drawColours();drawBrackets()}
function clearUiZones(){for(const z of wrap.querySelectorAll('.comparison-segment-hit-zone,.comparison-segment-bracket-hit'))z.remove()}
function selectionMode(){try{return typeof tool==='undefined'||tool==='select'}catch{return true}}
function segmentAtX(o,row,clientX){const r=canvas.getBoundingClientRect(),x=(clientX-r.left)/Math.max(1,r.width);for(const s of smallSegments(o,row)){const a=o.x+o.w*s.x1,b=o.x+o.w*s.x2;if(x>=a-.006&&x<=b+.006)return s}return null}
function updatePreview(){if(!drag)return;preview={o:drag.o,row:drag.row,x1:Math.min(drag.startSeg.x1,drag.endSeg.x1),x2:Math.max(drag.startSeg.x2,drag.endSeg.x2)};requestAnimationFrame(drawAll)}
function beginDrag(o,seg,e,zone){
 if(drag||placementPanel)return;
 drag={o,row:seg.row,startSeg:seg,endSeg:seg,startX:e.clientX,pointerId:e.pointerId,zone};preview={o,row:seg.row,x1:seg.x1,x2:seg.x2};
 try{zone.setPointerCapture(e.pointerId)}catch{}
 zone.addEventListener('pointermove',moveDrag,true);zone.addEventListener('pointerup',endDrag,true);zone.addEventListener('pointercancel',cancelDrag,true);requestAnimationFrame(drawAll);
}
function moveDrag(e){if(!drag)return;const s=segmentAtX(drag.o,drag.row,e.clientX);if(s)drag.endSeg=s;updatePreview();e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()}
function finishDrag(cancelled,e){
 const d=drag;if(!d)return;const z=d.zone;try{z.releasePointerCapture?.(d.pointerId)}catch{}z.removeEventListener('pointermove',moveDrag,true);z.removeEventListener('pointerup',endDrag,true);z.removeEventListener('pointercancel',cancelDrag,true);drag=null;
 if(cancelled){preview=null;requestAnimationFrame(drawAll);rebuildZones();return}
 const first=Math.min(d.startSeg.index,d.endSeg.index),last=Math.max(d.startSeg.index,d.endSeg.index),segs=smallSegments(d.o,d.row),picked=segs.filter(s=>s.index>=first&&s.index<=last);
 if(!picked.length){preview=null;requestAnimationFrame(drawAll);rebuildZones();return}
 preview={o:d.o,row:d.row,x1:picked[0].x1,x2:picked[picked.length-1].x2};requestAnimationFrame(drawAll);requestPlacement(d.o,picked,e?.clientX||d.startX,e?.clientY||0);rebuildZones();
}
function endDrag(e){if(!drag)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();finishDrag(false,e)}
function cancelDrag(e){if(!drag)return;e?.preventDefault?.();e?.stopPropagation?.();finishDrag(true,e)}

function rebuildZones(){
 if(rebuilding||drag)return;rebuilding=true;requestAnimationFrame(()=>{
  rebuilding=false;if(drag)return;clearUiZones();const cr=canvas.getBoundingClientRect(),wr=wrap.getBoundingClientRect(),ox=cr.left-wr.left,oy=cr.top-wr.top,W=cr.width,H=cr.height;
  if(selectionMode()&&!placementPanel){
   for(const o of strokes){if(!isComparison(o))continue;const Hm=modelH(o),n=count(o);for(let row=0;row<n;row++){const y1=(o.y+o.h*((START_Y+row*ROW_GAP)/Hm))*H,y2=(o.y+o.h*((START_Y+row*ROW_GAP+BAR_H)/Hm))*H;for(const seg of smallSegments(o,row)){
    const px1=(o.x+o.w*seg.x1)*W,px2=(o.x+o.w*seg.x2)*W;if(px2-px1<12)continue;
    const z=document.createElement('button');z.type='button';z.className='comparison-segment-hit-zone';z.setAttribute('aria-label','Select comparison segment');z.title='Click one segment, or press and drag across adjacent segments';z.style.cssText=`position:absolute;left:${ox+px1}px;top:${oy+y1}px;width:${Math.max(14,px2-px1)}px;height:${Math.max(26,y2-y1)}px;border:0;background:rgba(37,99,235,.002);padding:0;margin:0;cursor:pointer;z-index:1200;border-radius:4px;pointer-events:auto;touch-action:none;`;
    z.onpointerenter=()=>{if(!drag){z.style.background='rgba(37,99,235,.11)';z.style.boxShadow='inset 0 0 0 2px rgba(37,99,235,.7)'}};z.onpointerleave=()=>{if(!drag){z.style.background='rgba(37,99,235,.002)';z.style.boxShadow='none'}};
    z.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();beginDrag(o,seg,e,z)},true);z.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()},true);wrap.appendChild(z)
   }}}
  }
  for(const o of strokes){if(!isComparison(o)||!Array.isArray(o.segmentBrackets))continue;for(const b of o.segmentBrackets){if(!b||b.visible===false)continue;const rg=rowGeom(o,clamp(Number(b.row)||0,0,count(o)-1),W,H),x1=(o.x+o.w*Number(b.x1||0))*W,x2=(o.x+o.w*Number(b.x2||0))*W,top=b.side!=='bottom',y=top?rg.y1-13:rg.y2+13;const z=document.createElement('button');z.type='button';z.className='comparison-segment-bracket-hit';z.setAttribute('aria-label','Edit segment bracket');z.title='Click bracket to edit or delete';z.style.cssText=`position:absolute;left:${ox+Math.min(x1,x2)-8}px;top:${oy+y-22}px;width:${Math.max(28,Math.abs(x2-x1)+16)}px;height:44px;border:0;background:transparent;padding:0;margin:0;cursor:pointer;z-index:1210;pointer-events:auto;`;z.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();showPanel(o,b,e.clientX,e.clientY)},true);wrap.appendChild(z)}}
 },0)
}
function cleanLegacy(){for(const o of strokes){if(!isComparison(o)||!Array.isArray(o.userDrawnBrackets))continue;o.userDrawnBrackets=o.userDrawnBrackets.filter(b=>!b?.isSegmentBracket)}}
cleanLegacy();
const prev=redraw;redraw=function(){prev();requestAnimationFrame(drawAll);rebuildZones()};
window.addEventListener('resize',()=>{closePlacement();requestAnimationFrame(drawAll);rebuildZones()});
new ResizeObserver(()=>{requestAnimationFrame(drawAll);rebuildZones()}).observe(wrap);
document.addEventListener('pointerdown',e=>{if(panel&&!panel.contains(e.target))closePanel();if(placementPanel&&!placementPanel.contains(e.target)){closePlacement();rebuildZones()}},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closePanel();closePlacement();cancelDrag();rebuildZones()}},true);
setInterval(()=>{if(!drag)rebuildZones()},700);
setTimeout(()=>{drawAll();rebuildZones()},0);
})();
