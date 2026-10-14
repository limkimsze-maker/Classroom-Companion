(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function'||typeof cssW==='undefined'||typeof cssH==='undefined')return;
const wrap=document.getElementById('boardWrap'),tools=document.querySelector('.tools');
if(!wrap||!tools)return;

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const clone=v=>JSON.parse(JSON.stringify(v));
const START_Y=60,ROW_GAP=145,BAR_H=76,X0=180,MAX_W=650,MODEL_H=585;
let activeId='',editing=false,selectedRows=[],panel=null,templatePanel=null;

function isThree(o){return !!(o&&o.smartType==='barModel'&&o.smartBarType==='comparison'&&Math.round(Number(o.barCount)||0)===3)}
function models(){return strokes.filter(isThree)}
function active(){const list=models();if(!list.length)return null;return list.find(o=>o.smartId===activeId)||list[list.length-1]}
function widthsFor(o){const a=Array.isArray(o?.barCompareWidths)?o.barCompareWidths:[];return [0,1,2].map(i=>clamp(Number(a[i]??(1-i*.11))||.5,.16,1))}
function rowName(o,row){const n=(o?.barNames?.[row]||'').trim();return n||['Top bar','Middle bar','Bottom bar'][row]}
function saveHistory(o,before){window.__smartBarLastHistory={before,afterId:o.smartId}}
function notify(msg){if(typeof say==='function'){try{say(msg);return}catch{}}const t=document.getElementById('toast');if(t){t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1400)}}
function ensureRelations(o){if(!Array.isArray(o.intuitiveRelations))o.intuitiveRelations=[];return o.intuitiveRelations}
function setCustom(o){o.threeBarPattern='none';o.threeBarPatternVersion=4;ensureRelations(o)}

function geom(o,row,W,H){
 const widths=widthsFor(o),x0=(Number(o.x||0)+Number(o.w||0)*(X0/900))*W,x1=(Number(o.x||0)+Number(o.w||0)*((X0+MAX_W*widths[row])/900))*W;
 const y1=(Number(o.y||0)+Number(o.h||0)*((START_Y+row*ROW_GAP)/MODEL_H))*H,y2=(Number(o.y||0)+Number(o.h||0)*((START_Y+row*ROW_GAP+BAR_H)/MODEL_H))*H;
 return{x0,x1,y1,y2,cx:(x0+x1)/2,cy:(y1+y2)/2};
}
function hitRow(o,clientX,clientY){
 const r=canvas.getBoundingClientRect(),x=clientX-r.left,y=clientY-r.top;
 for(let row=0;row<3;row++){const q=geom(o,row,r.width,r.height);if(x>=q.x0-12&&x<=q.x1+12&&y>=q.y1-12&&y<=q.y2+12)return row}
 return-1;
}
function modelAt(clientX,clientY){
 const r=canvas.getBoundingClientRect(),x=(clientX-r.left)/Math.max(1,r.width),y=(clientY-r.top)/Math.max(1,r.height);
 for(let i=strokes.length-1;i>=0;i--){const o=strokes[i];if(isThree(o)&&x>=o.x&&x<=o.x+o.w&&y>=o.y&&y<=o.y+o.h)return o}
 return null;
}

let overlay=document.getElementById('comparisonIntuitiveOverlay');
if(!overlay){overlay=document.createElement('canvas');overlay.id='comparisonIntuitiveOverlay';overlay.setAttribute('aria-hidden','true');overlay.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:936;pointer-events:none;';wrap.appendChild(overlay)}
const g=overlay.getContext('2d');
function resizeOverlay(){const r=wrap.getBoundingClientRect(),d=Math.min(window.devicePixelRatio||1,2),w=Math.max(1,Math.round(r.width*d)),h=Math.max(1,Math.round(r.height*d));if(overlay.width!==w)overlay.width=w;if(overlay.height!==h)overlay.height=h;overlay.style.width=r.width+'px';overlay.style.height=r.height+'px';g.setTransform(d,0,0,d,0,0);return{W:r.width,H:r.height}}
function dotted(x,y1,y2){g.save();g.lineCap='round';g.setLineDash([6,6]);g.strokeStyle='rgba(255,255,255,.9)';g.lineWidth=7;g.beginPath();g.moveTo(x,y1);g.lineTo(x,y2);g.stroke();g.strokeStyle='#111827';g.lineWidth=3;g.beginPath();g.moveTo(x,y1);g.lineTo(x,y2);g.stroke();g.restore()}
function hBrace(x1,x2,y,top,label){
 if(x2<x1)[x1,x2]=[x2,x1];const w=Math.max(18,x2-x1),mid=(x1+x2)/2,end=clamp(w*.05,5,11),neck=clamp(w*.035,5,9),depth=8,edgeDir=top?1:-1,notchDir=top?-1:1;
 g.save();g.strokeStyle='#111827';g.fillStyle='#111827';g.lineWidth=2.3;g.lineCap='round';g.lineJoin='round';g.beginPath();g.moveTo(x1,y+edgeDir*depth);g.bezierCurveTo(x1,y+edgeDir*3,x1+2,y,x1+end,y);g.lineTo(mid-neck,y);g.bezierCurveTo(mid-neck*.35,y,mid-4,y+notchDir*2,mid,y+notchDir*depth);g.bezierCurveTo(mid+4,y+notchDir*2,mid+neck*.35,y,mid+neck,y);g.lineTo(x2-end,y);g.bezierCurveTo(x2-2,y,x2,y+edgeDir*3,x2,y+edgeDir*depth);g.stroke();if(label){g.font='700 20px Arial,sans-serif';g.textAlign='center';g.textBaseline=top?'bottom':'top';g.fillText(label,mid,y+(top?-16:16))}g.restore();
}
function vBrace(x,y1,y2,label){
 if(y2<y1)[y1,y2]=[y2,y1];const h=Math.max(28,y2-y1),mid=(y1+y2)/2,end=clamp(h*.05,6,12),neck=clamp(h*.035,6,10),depth=11;
 g.save();g.strokeStyle='#111827';g.fillStyle='#111827';g.lineWidth=2.3;g.lineCap='round';g.lineJoin='round';g.beginPath();g.moveTo(x-depth,y1);g.bezierCurveTo(x-3,y1,x,y1+2,x,y1+end);g.lineTo(x,mid-neck);g.bezierCurveTo(x,mid-5,x+2,mid-4,x+depth,mid);g.bezierCurveTo(x+2,mid+4,x,mid+5,x,mid+neck);g.lineTo(x,y2-end);g.bezierCurveTo(x,y2-2,x-3,y2,x-depth,y2);g.stroke();if(label){g.font='700 20px Arial,sans-serif';g.textAlign='left';g.textBaseline='middle';g.fillText(label,x+16,mid)}g.restore();
}
function relationRowsKey(rows){return rows.slice().sort((a,b)=>a-b).join('-')}
function drawRelations(o,W,H){
 const rels=ensureRelations(o),diffs=rels.filter(r=>r?.type==='difference'&&Array.isArray(r.rows)&&r.rows.length===2),diffGeo=[];
 for(const r of diffs){const [a,b]=r.rows,widths=widthsFor(o);if(a===b||Math.abs(widths[a]-widths[b])<.025)continue;const long=widths[a]>=widths[b]?a:b,short=long===a?b:a,qL=geom(o,long,W,H),qS=geom(o,short,W,H),side=short>long?'bottom':'top',span=Math.abs(qL.x1-qS.x1);diffGeo.push({r,long,short,qL,qS,side,span,lane:0})}
 const groups=new Map();for(const d of diffGeo){const k=d.long+'|'+d.side;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(d)}
 for(const list of groups.values()){list.sort((a,b)=>a.span-b.span);list.forEach((d,i)=>d.lane=i)}
 for(const d of diffGeo){const y=d.side==='bottom'?d.qL.y2+12+d.lane*24:d.qL.y1-12-d.lane*24;dotted(d.qS.x1,d.qL.y1+5,d.qL.y2-5);hBrace(d.qS.x1,d.qL.x1,y,d.side==='top',d.r.label||'')}
 for(const r of rels){
  if(!r)continue;
  if(r.type==='total'&&Array.isArray(r.rows)&&r.rows.length>=2){const rows=r.rows.slice().sort((a,b)=>a-b),qs=rows.map(row=>geom(o,row,W,H)),right=Math.max(...qs.map(q=>q.x1))+28,y1=Math.min(...qs.map(q=>q.y1)),y2=Math.max(...qs.map(q=>q.y2));vBrace(right,y1,y2,r.label||'')}
  if(r.type==='equalParts'&&Number.isInteger(r.row)&&r.parts>=2){const q=geom(o,r.row,W,H);g.save();g.strokeStyle='#111827';g.lineWidth=2;for(let i=1;i<r.parts;i++){const x=q.x0+(q.x1-q.x0)*i/r.parts;g.beginPath();g.moveTo(x,q.y1+3);g.lineTo(x,q.y2-3);g.stroke()}g.restore()}
 }
}
function drawSelection(o,W,H){if(!editing||!o)return;for(const row of selectedRows){const q=geom(o,row,W,H);g.save();g.strokeStyle='#0f766e';g.lineWidth=4;g.setLineDash([8,5]);g.strokeRect(q.x0-8,q.y1-8,(q.x1-q.x0)+16,(q.y2-q.y1)+16);g.restore()}}
function drawOverlay(){const {W,H}=resizeOverlay();g.clearRect(0,0,W,H);for(const o of models())drawRelations(o,W,H);drawSelection(active(),W,H)}

const oldPattern=document.getElementById('threeBarPatternBtn');if(oldPattern)oldPattern.style.setProperty('display','none','important');
const relBtn=document.createElement('button');relBtn.type='button';relBtn.className='btn soft';relBtn.id='threeBarRelationshipBtn';relBtn.style.display='none';relBtn.textContent='🔗 Relationships';relBtn.title='Edit how the 3 bars are related';tools.appendChild(relBtn);
function hideOldPattern(){const b=document.getElementById('threeBarPatternBtn');if(b)b.style.setProperty('display','none','important')}
function refreshButton(){hideOldPattern();const o=active();if(!o){relBtn.style.display='none';editing=false;overlay.style.pointerEvents='none';closePanel();closeTemplates();return}activeId=o.smartId;relBtn.style.display='inline-flex';relBtn.textContent=editing?'✓ Done':'🔗 Relationships';relBtn.classList.toggle('active',editing)}
function button(text,action,cls){const b=document.createElement('button');b.type='button';b.className='btn '+(cls||'');b.textContent=text;b.style.cssText='min-height:36px;padding:6px 9px;font-size:12px;font-weight:900';b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();action()},true);return b}
function closePanel(){if(panel){panel.remove();panel=null}}
function closeTemplates(){if(templatePanel){templatePanel.remove();templatePanel=null}}
function selectedText(o){return selectedRows.length?selectedRows.map(r=>rowName(o,r)).join(' + '):'Tap bars to choose a relationship'}
function applyAndRedraw(o,before,msg){saveHistory(o,before);selectedRows=[];try{redraw();if(typeof syncUi==='function')syncUi()}catch{}drawOverlay();refreshPanel();if(msg)notify(msg)}
function relationIndex(rels,type,rows){const key=relationRowsKey(rows);return rels.findIndex(r=>r?.type===type&&Array.isArray(r.rows)&&relationRowsKey(r.rows)===key)}
function addDifference(){const o=active();if(!o||selectedRows.length!==2)return;const before=clone(strokes);setCustom(o);const rels=ensureRelations(o),rows=selectedRows.slice();if(relationIndex(rels,'difference',rows)<0)rels.push({type:'difference',rows,label:''});applyAndRedraw(o,before,'Difference added')}
function addTotal(rows){const o=active();if(!o||rows.length<2)return;const before=clone(strokes);setCustom(o);const rels=ensureRelations(o);if(relationIndex(rels,'total',rows)<0)rels.push({type:'total',rows:rows.slice(),label:''});applyAndRedraw(o,before,rows.length===3?'Total of 3 added':'Combined total added')}
function setParts(parts){const o=active();if(!o||selectedRows.length!==1)return;const row=selectedRows[0],before=clone(strokes);setCustom(o);const rels=ensureRelations(o);o.intuitiveRelations=rels.filter(r=>!(r?.type==='equalParts'&&r.row===row));o.intuitiveRelations.push({type:'equalParts',row,parts});applyAndRedraw(o,before,`${parts} equal parts added`)}
function removeSelectedRelations(){const o=active();if(!o||!selectedRows.length)return;const before=clone(strokes),key=relationRowsKey(selectedRows),rowsSet=new Set(selectedRows);o.intuitiveRelations=ensureRelations(o).filter(r=>{if(r?.type==='equalParts')return !rowsSet.has(r.row);if(Array.isArray(r?.rows))return relationRowsKey(r.rows)!==key;return true});applyAndRedraw(o,before,'Selected relationship removed')}
function clearCustom(){const o=active();if(!o)return;const before=clone(strokes);o.intuitiveRelations=[];o.threeBarPattern='none';o.threeBarPatternVersion=4;applyAndRedraw(o,before,'Custom relationships cleared')}
function setAuto(){const o=active();if(!o)return;const before=clone(strokes);o.intuitiveRelations=[];o.threeBarPattern='auto';o.threeBarPatternVersion=4;applyAndRedraw(o,before,'Auto relationship restored')}
function setTemplate(mode,label){const o=active();if(!o)return;const before=clone(strokes);o.intuitiveRelations=[];o.threeBarPattern=mode;o.threeBarPatternVersion=4;saveHistory(o,before);selectedRows=[];closeTemplates();try{redraw();if(typeof syncUi==='function')syncUi()}catch{}drawOverlay();refreshPanel();notify(label)}
function buildLongestCustom(){const o=active();if(!o)return;const before=clone(strokes),w=widthsFor(o),long=w.indexOf(Math.max(...w));setCustom(o);o.intuitiveRelations=[];for(const row of [0,1,2])if(row!==long)o.intuitiveRelations.push({type:'difference',rows:[long,row],label:''});applyAndRedraw(o,before,'Compared both bars with the longest')}
function buildChainCustom(){const o=active();if(!o)return;const before=clone(strokes);setCustom(o);o.intuitiveRelations=[{type:'difference',rows:[0,1],label:''},{type:'difference',rows:[1,2],label:''}];applyAndRedraw(o,before,'Chain comparison added')}

function refreshPanel(){
 if(!editing){closePanel();return}const o=active();if(!o){closePanel();return}
 closePanel();panel=document.createElement('div');panel.id='threeBarRelationshipPanel';
 const r=wrap.getBoundingClientRect(),w=Math.min(620,Math.max(320,innerWidth-16)),left=Math.max(8,Math.min(innerWidth-w-8,r.left+(r.width-w)/2));
 panel.style.cssText=`position:fixed;z-index:10320;width:${w}px;max-width:calc(100vw - 16px);padding:9px;background:rgba(255,255,255,.98);border:1px solid #cfd9de;border-radius:14px;box-shadow:0 12px 30px rgba(23,50,77,.22);left:${left}px;bottom:12px`;
 const head=document.createElement('div');head.style.cssText='display:flex;align-items:center;gap:8px;justify-content:space-between;margin-bottom:7px';
 const text=document.createElement('div');text.innerHTML=`<div style="font:900 13px Inter,system-ui,sans-serif;color:#17324d">${selectedText(o)}</div><div style="font:700 10px Inter,system-ui,sans-serif;color:#667085;margin-top:2px">Tap a selected bar again to deselect it.</div>`;head.appendChild(text);panel.appendChild(head);
 const row=document.createElement('div');row.style.cssText='display:flex;flex-wrap:wrap;gap:6px';
 if(selectedRows.length===1){row.append(button('Split into 2',()=>setParts(2),'soft'),button('Split into 3',()=>setParts(3),'soft'),button('Split into 4',()=>setParts(4),'soft'),button('Remove from this bar',removeSelectedRelations,'danger'))}
 else if(selectedRows.length===2){row.append(button('↔ Difference',addDifference,'soft'),button('} Combined total',()=>addTotal(selectedRows.slice()),'soft'),button('Remove this relationship',removeSelectedRelations,'danger'))}
 else if(selectedRows.length===3){row.append(button('} Total of 3',()=>addTotal([0,1,2]),'soft'),button('Compare to longest',buildLongestCustom,'soft'),button('Chain differences',buildChainCustom,'soft'),button('Shared difference',()=>setTemplate('segments','Shared-difference layout'),'soft'))}
 else{row.append(button('Auto',setAuto,'soft'),button('Visual templates',openTemplates,'soft'),button('Clear custom',clearCustom,'danger'))}
 row.append(button('Auto',setAuto,''),button('Templates',openTemplates,''),button('Done',()=>toggleEditing(false),'soft'));
 panel.appendChild(row);document.body.appendChild(panel)
}

function miniSvg(kind){
 const base='<rect x="8" y="10" width="84" height="9" rx="2" fill="none" stroke="#17324d" stroke-width="2"/><rect x="8" y="31" width="64" height="9" rx="2" fill="none" stroke="#17324d" stroke-width="2"/><rect x="8" y="52" width="48" height="9" rx="2" fill="none" stroke="#17324d" stroke-width="2"/>';
 let extra='';if(kind==='segments')extra='<path d="M56 12v5M72 12v5M56 24h16" stroke="#0f766e" stroke-width="2" stroke-dasharray="3 2"/>';if(kind==='reference')extra='<path d="M56 10v9M72 10v9" stroke="#0f766e" stroke-width="2" stroke-dasharray="3 2"/>';if(kind==='adjacent')extra='<path d="M72 31v9M56 52v9" stroke="#0f766e" stroke-width="2" stroke-dasharray="3 2"/>';if(kind==='none')extra='<path d="M101 10v51M96 10h5M96 61h5" stroke="#0f766e" stroke-width="2"/>';if(kind==='all')extra='<path d="M56 10v9M72 10v9M56 31v9" stroke="#0f766e" stroke-width="2" stroke-dasharray="3 2"/>';return `<svg viewBox="0 0 112 72" width="112" height="72" aria-hidden="true">${base}${extra}</svg>`
}
function templateCard(kind,title,desc,mode){const b=document.createElement('button');b.type='button';b.style.cssText='display:flex;align-items:center;gap:9px;text-align:left;border:1px solid #d8e1e8;background:#fff;border-radius:11px;padding:7px;cursor:pointer;width:100%';b.innerHTML=`${miniSvg(kind)}<span><strong style="display:block;font:900 12px Inter,system-ui,sans-serif;color:#17324d">${title}</strong><span style="display:block;font:700 10px/1.3 Inter,system-ui,sans-serif;color:#667085;margin-top:2px">${desc}</span></span>`;b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();setTemplate(mode,title)},true);return b}
function openTemplates(){const o=active();if(!o)return;closeTemplates();templatePanel=document.createElement('div');templatePanel.style.cssText='position:fixed;z-index:10340;width:min(460px,calc(100vw - 16px));max-height:75vh;overflow:auto;padding:9px;background:#fff;border:1px solid #cfd9de;border-radius:14px;box-shadow:0 14px 34px rgba(23,50,77,.24);left:50%;top:50%;transform:translate(-50%,-50%)';const h=document.createElement('div');h.innerHTML='<div style="font:900 14px Inter,system-ui,sans-serif;color:#17324d">Choose by picture</div><div style="font:700 10px/1.4 Inter,system-ui,sans-serif;color:#667085;margin:2px 0 8px">Use this only when Auto is not what you want.</div>';templatePanel.appendChild(h);const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:7px';grid.append(templateCard('segments','Shared difference','Marks the same interval clearly on two bars.','segments'),templateCard('reference','Compare to longest','Both shorter bars compare with the longest.','reference'),templateCard('adjacent','Chain comparison','Top↔middle and middle↔bottom.','adjacent'),templateCard('none','Totals / build your own','Start clean, then tap bars to add totals, differences or equal parts.','none'),templateCard('all','All differences','Shows all three pairwise differences.','all'));templatePanel.appendChild(grid);const close=button('Close',closeTemplates,'soft');close.style.width='100%';close.style.marginTop='8px';templatePanel.appendChild(close);document.body.appendChild(templatePanel)}

function toggleEditing(force){const o=active();if(!o)return;editing=typeof force==='boolean'?force:!editing;selectedRows=[];closeTemplates();overlay.style.pointerEvents=editing?'auto':'none';overlay.style.cursor=editing?'pointer':'default';refreshButton();refreshPanel();drawOverlay();if(editing)notify('Tap one, two or three bars')}
relBtn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();toggleEditing()},true);

overlay.addEventListener('pointerdown',e=>{
 if(!editing)return;const o=modelAt(e.clientX,e.clientY);if(!o)return;const row=hitRow(o,e.clientX,e.clientY);if(row<0)return;
 e.preventDefault();e.stopPropagation();activeId=o.smartId;const i=selectedRows.indexOf(row);if(i>=0)selectedRows.splice(i,1);else if(selectedRows.length<3)selectedRows.push(row);selectedRows.sort((a,b)=>a-b);drawOverlay();refreshPanel()
},true);
canvas.addEventListener('pointerdown',e=>{if(editing)return;const o=modelAt(e.clientX,e.clientY);if(o){activeId=o.smartId;refreshButton()}},true);
document.addEventListener('pointerdown',e=>{if(templatePanel&&!templatePanel.contains(e.target))closeTemplates()},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(templatePanel){closeTemplates();return}if(editing)toggleEditing(false)}},true);

const priorRedraw=redraw;redraw=function(){priorRedraw();refreshButton();requestAnimationFrame(drawOverlay)};
new ResizeObserver(()=>requestAnimationFrame(drawOverlay)).observe(wrap);window.addEventListener('resize',()=>{closeTemplates();refreshPanel();requestAnimationFrame(drawOverlay)});
setTimeout(()=>{try{const list=models();if(list.length)activeId=list[list.length-1].smartId;refreshButton();drawOverlay()}catch{}},0);
})();