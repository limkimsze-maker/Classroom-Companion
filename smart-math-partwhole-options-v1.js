(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function')return;
const wrap=document.getElementById('boardWrap');if(!wrap)return;
window.__smartPartWholeCompactOptions=true;
const clone=v=>JSON.parse(JSON.stringify(v));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const X=60,Y=90,BAR_W=780,BAR_H=120,VB_W=900,VB_H=300;
const PALETTE=[
 {name:'White',value:'#ffffff'},
 {name:'Yellow',value:'#fde68a'},
 {name:'Orange',value:'#fdba74'},
 {name:'Blue',value:'#93c5fd'},
 {name:'Green',value:'#86efac'},
 {name:'Purple',value:'#c4b5fd'}
];
let placementPanel=null,drag=null,preview=null,rebuilding=false;
function isPW(o){return !!(o&&o.smartType==='barModel'&&o.smartBarType==='partwhole'&&Number.isFinite(o.x)&&Number.isFinite(o.y)&&Number.isFinite(o.w)&&Number.isFinite(o.h));}
function count(o){return clamp(Math.round(Number(o?.barCount)||2),2,8)}
function cuts(o){const n=count(o);if(Array.isArray(o.barCuts)&&o.barCuts.length===n-1)return o.barCuts.slice().sort((a,b)=>a-b);return Array.from({length:n-1},(_,i)=>(i+1)/n)}
function bounds(o){return[0,...cuts(o),1]}
function parts(o){const bs=bounds(o),out=[];for(let i=0;i<bs.length-1;i++)out.push({index:i,a:bs[i],b:bs[i+1],x1:(X+BAR_W*bs[i])/VB_W,x2:(X+BAR_W*bs[i+1])/VB_W});return out}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]))}
function svgData(svg){return'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)}
function rebuildBase(o){
 const n=count(o),cs=cuts(o),bs=[0,...cs,1],fills=Array.from({length:n},(_,i)=>o.barFills?.[i]||'#ffffff'),labels=Array.from({length:n},(_,i)=>o.barLabels?.[i]||''),stroke='#17324d',els=[];
 for(let i=0;i<n;i++){
  const left=X+BAR_W*bs[i],right=X+BAR_W*bs[i+1],pw=right-left;
  els.push(`<rect x="${left}" y="${Y}" width="${pw}" height="${BAR_H}" fill="${fills[i]}"/>`);
  if(labels[i]){const fs=labels[i].length>12?24:labels[i].length>7?30:38;els.push(`<text x="${left+pw/2}" y="${Y+BAR_H/2+fs*.34}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${fs}" font-weight="700" fill="${stroke}">${esc(labels[i])}</text>`)}
 }
 els.push(`<rect x="${X}" y="${Y}" width="${BAR_W}" height="${BAR_H}" rx="2" fill="none" stroke="${stroke}" stroke-width="8"/>`);
 for(const r of cs){const px=X+BAR_W*r;els.push(`<line x1="${px}" y1="${Y}" x2="${px}" y2="${Y+BAR_H}" stroke="${stroke}" stroke-width="7"/>`)}
 o.barCuts=cs;o.barFills=fills;o.barLabels=labels;o.src=svgData(`<svg xmlns="http://www.w3.org/2000/svg" width="${VB_W}" height="${VB_H}" viewBox="0 0 ${VB_W} ${VB_H}">${els.join('')}</svg>`);
}
function ensureSpanLabels(o){if(!Array.isArray(o.partWholeSpanLabels))o.partWholeSpanLabels=[];return o.partWholeSpanLabels}
function spanLabel(o,start,end){return ensureSpanLabels(o).find(l=>Number(l.start)===start&&Number(l.end)===end)?.text||''}
function setSpanLabel(o,start,end,text){const list=ensureSpanLabels(o),i=list.findIndex(l=>Number(l.start)===start&&Number(l.end)===end),t=String(text||'').trim();if(!t){if(i>=0)list.splice(i,1);return}if(i>=0)list[i].text=t;else list.push({start,end,text:t})}
function hideAuto(o){
 if(!o.barBracketState||typeof o.barBracketState!=='object')o.barBracketState={};
 const st=o.barBracketState,n=count(o);if(!st.whole)st.whole={visible:false,label:''};st.whole.visible=false;
 for(let i=0;i<n;i++){if(!st['p'+i])st['p'+i]={visible:false,label:''};st['p'+i].visible=false}
 o.userDrawnBracketScan=true;
}
function bracketY(side){return side==='top'?(Y-14)/VB_H:(Y+BAR_H+14)/VB_H}
function ensureManualBrackets(o){if(!Array.isArray(o.userDrawnBrackets))o.userDrawnBrackets=[];return o.userDrawnBrackets}
function addBracket(o,start,end,side){
 const list=ensureManualBrackets(o),x1=(X+BAR_W*bounds(o)[start])/VB_W,x2=(X+BAR_W*bounds(o)[end+1])/VB_W;
 let b=list.find(q=>q&&q.__partWholeCompact&&Number(q.partAnchorLeft)===start&&Number(q.partAnchorRight)===end+1);
 if(!b){b={id:'pwcompact-'+Date.now()+'-'+start+'-'+end,__partWholeCompact:true,visible:true,label:'',position:side,x1,x2,y:bracketY(side),partAnchorLeft:start,partAnchorRight:end+1};list.push(b)}
 else{b.visible=true;b.position=side;b.x1=x1;b.x2=x2;b.y=bracketY(side)}
}
function notify(msg){if(typeof say==='function'){try{say(msg);return}catch{}}const t=document.getElementById('toast');if(t){t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1200)}}
function history(o,before){window.__smartBarLastHistory={before,afterId:o.smartId}}
function applyOptions(o,picked,side,colour,target,label){
 if(!picked.length)return;const start=picked[0].index,end=picked[picked.length-1].index,before=clone(strokes),n=count(o);
 o.barFills=Array.from({length:n},(_,i)=>o.barFills?.[i]||'#ffffff');
 o.barLabels=Array.from({length:n},(_,i)=>o.barLabels?.[i]||'');
 if(colour){if(target==='bar'){for(let i=0;i<n;i++)o.barFills[i]=colour}else for(const p of picked)o.barFills[p.index]=colour}
 // New compact labels live as span labels. Clear legacy per-part labels only
 // in the selected range so there can never be duplicate overlapping text.
 for(const p of picked)o.barLabels[p.index]='';
 setSpanLabel(o,start,end,label);rebuildBase(o);hideAuto(o);
 if(side==='top'||side==='bottom'){addBracket(o,start,end,side);notify('Part options applied with bracket '+(side==='top'?'above':'below'))}
 else notify('Colour / label applied');
 history(o,before);try{redraw();if(typeof syncUi==='function')syncUi()}catch{}
}
function closePlacement(clearPreview=true){if(placementPanel){placementPanel.remove();placementPanel=null}if(clearPreview){preview=null;requestAnimationFrame(drawOverlay)}}
function makeSelect(){const s=document.createElement('select');s.style.cssText='height:34px;border:1px solid #cfd9de;border-radius:9px;background:#fff;color:#17324d;padding:0 8px;font-size:11px;font-weight:800;min-width:0';return s}
function requestOptions(o,picked,clientX,clientY){
 closePlacement(false);if(!picked.length)return;const start=picked[0].index,end=picked[picked.length-1].index;preview={o,start,end};requestAnimationFrame(drawOverlay);
 placementPanel=document.createElement('div');
 placementPanel.id='partWholeKeyboardSafeEditor';
 placementPanel.setAttribute('role','dialog');
 placementPanel.setAttribute('aria-label','Part–Whole segment options');
 placementPanel.style.cssText='position:fixed;z-index:13120;width:286px;padding:11px;background:#fff;border:1px solid #cfd9de;border-radius:14px;box-shadow:0 10px 28px rgba(23,50,77,.24);overflow-y:auto;overscroll-behavior:contain';
 const coarsePointer=window.matchMedia?.('(pointer: coarse)')?.matches||/Android|iPhone|iPad/i.test(navigator.userAgent||'');
 const keyboardSafe=!!coarsePointer&&window.innerWidth<=1100;
 placementPanel.dataset.keyboardSafe=keyboardSafe?'true':'false';
 if(keyboardSafe){
  // Fixed near the visible viewport TOP, instead of below the tapped part.
  // The Android keyboard may halve the viewport height, but cannot move
  // this editor or force an input to lose focus.
  placementPanel.style.left='10px';
  placementPanel.style.width='min(380px, calc(100vw - 20px))';
  placementPanel.style.top=((window.visualViewport?.offsetTop||0)+8)+'px';
 }else{
  placementPanel.style.left=Math.min(innerWidth-296,Math.max(8,clientX-135))+'px';
  placementPanel.style.top=Math.min(innerHeight-286,Math.max(8,clientY+12))+'px';
 }
 const title=document.createElement('div');title.textContent='Part options';title.style.cssText='font:900 13px Inter,system-ui,sans-serif;color:#17324d;margin-bottom:2px';
 const desc=document.createElement('div');desc.textContent=picked.length>1?`${picked.length} selected parts`:'1 selected part';desc.style.cssText='font:700 10px Inter,system-ui,sans-serif;color:#667085;margin-bottom:8px';
 const labelRow=document.createElement('div');labelRow.style.cssText='display:grid;grid-template-columns:82px 1fr;gap:7px;align-items:center;margin-bottom:8px';
 const labelTitle=document.createElement('div');labelTitle.textContent='Label';labelTitle.style.cssText='font:900 11px Inter,system-ui,sans-serif;color:#17324d';
 const labelInput=document.createElement('input');labelInput.type='text';labelInput.maxLength=30;labelInput.placeholder='optional';labelInput.value=spanLabel(o,start,end);labelInput.style.cssText='width:100%;height:42px;border:1px solid #cfd9de;border-radius:9px;padding:0 8px;font-size:16px;font-weight:700;color:#17324d';labelInput.setAttribute('autocomplete','off');labelInput.setAttribute('autocapitalize','off');labelRow.append(labelTitle,labelInput);
 const colourRow=document.createElement('div');colourRow.style.cssText='display:grid;grid-template-columns:82px 1fr 1fr;gap:7px;align-items:center;margin-bottom:9px';
 const colourTitle=document.createElement('div');colourTitle.textContent='Colour';colourTitle.style.cssText='font:900 11px Inter,system-ui,sans-serif;color:#17324d';
 const colourSelect=makeSelect();{const op=document.createElement('option');op.value='';op.textContent='Keep';colourSelect.appendChild(op)}for(const c of PALETTE){const op=document.createElement('option');op.value=c.value;op.textContent=c.name;colourSelect.appendChild(op)}
 const targetSelect=makeSelect();[['parts','Part(s)'],['bar','Whole bar']].forEach(([v,t])=>{const op=document.createElement('option');op.value=v;op.textContent=t;targetSelect.appendChild(op)});colourRow.append(colourTitle,colourSelect,targetSelect);
 const plain=document.createElement('button');plain.type='button';plain.className='btn';plain.textContent='Apply colour / label';plain.style.cssText+='width:100%;margin-bottom:9px;min-height:34px';
 const bracketTitle=document.createElement('div');bracketTitle.textContent='Add bracket only if wanted';bracketTitle.style.cssText='font:900 10px Inter,system-ui,sans-serif;color:#667085;margin-bottom:6px';
 const sideRow=document.createElement('div');sideRow.style.cssText='display:flex;gap:8px';const above=document.createElement('button');above.type='button';above.className='btn soft';above.textContent='↑ Above';above.style.flex='1';const below=document.createElement('button');below.type='button';below.className='btn soft';below.textContent='↓ Below';below.style.flex='1';
 const run=side=>{const colour=colourSelect.value||null,target=targetSelect.value||'parts',label=labelInput.value;closePlacement();applyOptions(o,picked,side,colour,target,label)};
 plain.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();run(null)},true);above.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();run('top')},true);below.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();run('bottom')},true);
 sideRow.append(above,below);placementPanel.append(title,desc,labelRow,colourRow,plain,bracketTitle,sideRow);document.body.appendChild(placementPanel);handleEditorViewportResize()
}
let ov=document.getElementById('partWholeCompactOverlay');if(!ov){ov=document.createElement('canvas');ov.id='partWholeCompactOverlay';ov.setAttribute('aria-hidden','true');ov.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:917;pointer-events:none;';wrap.appendChild(ov)}const g=ov.getContext('2d');
function sizeOverlay(){const r=wrap.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2),w=Math.max(1,Math.round(r.width*d)),h=Math.max(1,Math.round(r.height*d));if(ov.width!==w)ov.width=w;if(ov.height!==h)ov.height=h;ov.style.width=r.width+'px';ov.style.height=r.height+'px';g.setTransform(d,0,0,d,0,0);return{W:r.width,H:r.height}}
function barGeom(o,W,H){return{x1:(o.x+o.w*(X/VB_W))*W,x2:(o.x+o.w*((X+BAR_W)/VB_W))*W,y1:(o.y+o.h*(Y/VB_H))*H,y2:(o.y+o.h*((Y+BAR_H)/VB_H))*H}}
function spanX(o,start,end,W){const bs=bounds(o);return{x1:(o.x+o.w*((X+BAR_W*bs[start])/VB_W))*W,x2:(o.x+o.w*((X+BAR_W*bs[end+1])/VB_W))*W}}
function drawOverlay(){
 const{W,H}=sizeOverlay();g.clearRect(0,0,W,H);
 for(const o of strokes){if(!isPW(o))continue;const bg=barGeom(o,W,H);for(const lab of ensureSpanLabels(o)){if(!lab?.text)continue;const start=clamp(Number(lab.start)||0,0,count(o)-1),end=clamp(Number(lab.end)||start,start,count(o)-1),sx=spanX(o,start,end,W),cx=(sx.x1+sx.x2)/2,cy=(bg.y1+bg.y2)/2,maxW=Math.max(18,sx.x2-sx.x1-14);let size=17;g.save();g.font=`800 ${size}px Inter,Arial,sans-serif`;while(size>10&&g.measureText(lab.text).width>maxW){size--;g.font=`800 ${size}px Inter,Arial,sans-serif`}g.textAlign='center';g.textBaseline='middle';g.lineJoin='round';g.lineWidth=4;g.strokeStyle='rgba(255,255,255,.94)';g.fillStyle='#17324d';g.strokeText(lab.text,cx,cy,maxW);g.fillText(lab.text,cx,cy,maxW);g.restore()}}
 if(preview){const o=preview.o,bg=barGeom(o,W,H),sx=spanX(o,preview.start,preview.end,W);g.save();g.fillStyle='rgba(37,99,235,.14)';g.strokeStyle='rgba(37,99,235,.85)';g.lineWidth=3;g.fillRect(sx.x1,bg.y1,Math.max(2,sx.x2-sx.x1),Math.max(2,bg.y2-bg.y1));g.strokeRect(sx.x1+1.5,bg.y1+1.5,Math.max(1,sx.x2-sx.x1-3),Math.max(1,bg.y2-bg.y1-3));g.restore()}
}
function selectionMode(){try{return typeof tool==='undefined'||tool==='select'}catch{return true}}
function partAtX(o,clientX){const r=canvas.getBoundingClientRect(),x=(clientX-r.left)/Math.max(1,r.width);for(const p of parts(o)){const a=o.x+o.w*p.x1,b=o.x+o.w*p.x2;if(x>=a-.004&&x<=b+.004)return p}return null}
function updatePreview(){if(!drag)return;preview={o:drag.o,start:Math.min(drag.start.index,drag.end.index),end:Math.max(drag.start.index,drag.end.index)};requestAnimationFrame(drawOverlay)}
function beginDrag(o,p,e,z){if(drag||placementPanel)return;drag={o,start:p,end:p,pointerId:e.pointerId,zone:z,startX:e.clientX};preview={o,start:p.index,end:p.index};try{z.setPointerCapture(e.pointerId)}catch{}z.addEventListener('pointermove',moveDrag,true);z.addEventListener('pointerup',endDrag,true);z.addEventListener('pointercancel',cancelDrag,true);requestAnimationFrame(drawOverlay)}
function moveDrag(e){if(!drag)return;const p=partAtX(drag.o,e.clientX);if(p)drag.end=p;updatePreview();e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()}
function finishDrag(cancelled,e){const d=drag;if(!d)return;const z=d.zone;try{z.releasePointerCapture?.(d.pointerId)}catch{}z.removeEventListener('pointermove',moveDrag,true);z.removeEventListener('pointerup',endDrag,true);z.removeEventListener('pointercancel',cancelDrag,true);drag=null;if(cancelled){preview=null;requestAnimationFrame(drawOverlay);rebuildZones();return}const first=Math.min(d.start.index,d.end.index),last=Math.max(d.start.index,d.end.index),picked=parts(d.o).filter(p=>p.index>=first&&p.index<=last);if(!picked.length){preview=null;requestAnimationFrame(drawOverlay);rebuildZones();return}preview={o:d.o,start:first,end:last};requestAnimationFrame(drawOverlay);requestOptions(d.o,picked,e?.clientX||d.startX,e?.clientY||0);rebuildZones()}
function endDrag(e){if(!drag)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();finishDrag(false,e)}
function cancelDrag(e){if(!drag)return;e?.preventDefault?.();e?.stopPropagation?.();finishDrag(true,e)}
function clearZones(){for(const z of wrap.querySelectorAll('.partwhole-compact-hit-zone'))z.remove()}
function rebuildZones(){if(rebuilding||drag)return;rebuilding=true;requestAnimationFrame(()=>{rebuilding=false;if(drag)return;clearZones();if(!selectionMode()||placementPanel)return;const cr=canvas.getBoundingClientRect(),wr=wrap.getBoundingClientRect(),ox=cr.left-wr.left,oy=cr.top-wr.top,W=cr.width,H=cr.height;for(const o of strokes){if(!isPW(o))continue;hideAuto(o);const bg=barGeom(o,W,H);for(const p of parts(o)){const x1=(o.x+o.w*p.x1)*W,x2=(o.x+o.w*p.x2)*W;if(x2-x1<10)continue;const z=document.createElement('button');z.type='button';z.className='partwhole-compact-hit-zone';z.setAttribute('aria-label','Select Part-Whole part');z.title='Click one part, or drag across adjacent parts';z.style.cssText=`position:absolute;left:${ox+x1}px;top:${oy+bg.y1}px;width:${Math.max(12,x2-x1)}px;height:${Math.max(24,bg.y2-bg.y1)}px;border:0;background:rgba(37,99,235,.002);padding:0;margin:0;cursor:pointer;z-index:1200;border-radius:3px;pointer-events:auto;touch-action:none;`;z.onpointerenter=()=>{if(!drag){z.style.background='rgba(37,99,235,.10)';z.style.boxShadow='inset 0 0 0 2px rgba(37,99,235,.70)'}};z.onpointerleave=()=>{if(!drag){z.style.background='rgba(37,99,235,.002)';z.style.boxShadow='none'}};z.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();beginDrag(o,p,e,z)},true);z.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()},true);wrap.appendChild(z)}}},0)}
function prep(){for(const o of strokes)if(isPW(o))hideAuto(o)}
const prev=redraw;redraw=function(){prep();const r=prev.apply(this,arguments);requestAnimationFrame(drawOverlay);rebuildZones();return r};
// Backup guard: the old Part-Whole palette lived on canvas clicks. In Select
// mode the compact DOM hit-zones handle the click, but block the legacy palette
// if a browser delivers the click to canvas at an edge.
window.addEventListener('click',e=>{if(e.target!==canvas||!selectionMode())return;const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/Math.max(1,r.width),y=(e.clientY-r.top)/Math.max(1,r.height);for(const o of strokes){if(!isPW(o))continue;const y1=o.y+o.h*(Y/VB_H),y2=o.y+o.h*((Y+BAR_H)/VB_H),x1=o.x+o.w*(X/VB_W),x2=o.x+o.w*((X+BAR_W)/VB_W);if(x>=x1&&x<=x2&&y>=y1&&y<=y2){e.preventDefault();e.stopImmediatePropagation();return}}},true);
document.addEventListener('pointerdown',e=>{if(placementPanel&&!placementPanel.contains(e.target)){closePlacement();rebuildZones()}},true);document.addEventListener('keydown',e=>{if(e.key==='Escape'){closePlacement();cancelDrag();rebuildZones()}},true);// Android soft keyboards frequently fire a sequence of window/visualViewport
 // resize events while IME composition is in progress. A floating editor
 // repositioned on every event visibly jumps and can dismiss the keyboard.
 function handleEditorViewportResize(){
  const p=placementPanel;
  if(p){
   const viewport=window.visualViewport;
   const visibleHeight=Math.max(120,viewport?.height||window.innerHeight);
   p.style.maxHeight=Math.max(100,visibleHeight-20)+'px';
   if(p.dataset.keyboardSafe==='true'){
    // The top of the visual viewport remains a stable anchor while its
    // height changes; never clamp against the changing bottom edge.
    p.style.top=Math.round((viewport?.offsetTop||0)+8)+'px';
   }else{
    const box=p.getBoundingClientRect();
    const top=viewport?.offsetTop||0;
    if(box.bottom>top+visibleHeight-8&&!p.contains(document.activeElement)){
     p.style.top=Math.max(top+8,top+visibleHeight-box.height-8)+'px';
    }
   }
  }
  requestAnimationFrame(drawOverlay);
  // An active input has priority over rebuilding the per-segment hit zones.
  if(!p||!p.contains(document.activeElement))rebuildZones();
 }
 window.addEventListener('resize',handleEditorViewportResize);
 window.visualViewport?.addEventListener('resize',handleEditorViewportResize);new ResizeObserver(()=>{requestAnimationFrame(drawOverlay);rebuildZones()}).observe(wrap);setInterval(()=>{if(!drag){prep();rebuildZones()}},700);setTimeout(()=>{prep();try{redraw()}catch{drawOverlay();rebuildZones()}},0);
})();