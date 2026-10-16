(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function')return;
const tools=document.querySelector('.tools'),wrap=document.getElementById('boardWrap');
if(!tools||!wrap)return;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const clone=v=>JSON.parse(JSON.stringify(v));
const START_Y=60,ROW_GAP=145,BAR_H=76,X0=180,MAX_W=650,MODEL_H=585;
let currentId='',mode='',picked=[],splitParts=2,popup=null;
function isThree(o){return !!(o&&o.smartType==='barModel'&&o.smartBarType==='comparison'&&Math.round(Number(o.barCount)||0)===3)}
function models(){return strokes.filter(isThree)}
function active(){const list=models();if(!list.length)return null;return list.find(o=>o.smartId===currentId)||list[list.length-1]}
function widths(o){const a=Array.isArray(o?.barCompareWidths)?o.barCompareWidths:[];return [0,1,2].map(i=>clamp(Number(a[i]??(1-i*.11))||.5,.16,1))}
function relations(o){if(!Array.isArray(o.intuitiveRelations))o.intuitiveRelations=[];return o.intuitiveRelations}
function setManual(o){o.threeBarPattern='none';o.threeBarPatternVersion=4;relations(o)}
function history(o,before){window.__smartBarLastHistory={before,afterId:o.smartId}}
function sync(){try{redraw();if(typeof syncUi==='function')syncUi()}catch{}requestAnimationFrame(drawOverlay)}
function notify(msg){if(typeof say==='function'){try{say(msg);return}catch{}}const t=document.getElementById('toast');if(t){t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1400)}}
function removeAutomaticBracketState(o){
 if(!o)return false;let changed=false;
 setManual(o);
 if(Array.isArray(o.intuitiveRelations)){
  const kept=o.intuitiveRelations.filter(r=>r?.type==='equalParts');
  if(kept.length!==o.intuitiveRelations.length){o.intuitiveRelations=kept;changed=true}
 }
 if(o.barBracketState&&typeof o.barBracketState==='object'){
  for(const [k,v] of Object.entries(o.barBracketState))if(/^c\d+$/.test(k)&&v&&v.visible!==false){v.visible=false;changed=true}
 }
 if(Array.isArray(o.userDrawnBrackets)){
  const kept=o.userDrawnBrackets.filter(b=>!(b?.autoThreeDifference||b?.autoThreeSegment||b?.autoMultiDifference||b?.isDifference||/^auto-(?:3|difference)/.test(String(b?.id||''))));
  if(kept.length!==o.userDrawnBrackets.length){o.userDrawnBrackets=kept;changed=true}
 }
 if(Array.isArray(o.comparisonTotalBrackets)&&o.comparisonTotalBrackets.length){o.comparisonTotalBrackets=[];changed=true}
 return changed;
}
function cleanAll(){let changed=false;for(const o of strokes){if(o?.smartType==='barModel'&&o.smartBarType==='comparison')if(removeAutomaticBracketState(o))changed=true}return changed}
function modelAt(clientX,clientY){const r=canvas.getBoundingClientRect(),x=(clientX-r.left)/Math.max(1,r.width),y=(clientY-r.top)/Math.max(1,r.height);for(let i=strokes.length-1;i>=0;i--){const o=strokes[i];if(isThree(o)&&x>=o.x&&x<=o.x+o.w&&y>=o.y&&y<=o.y+o.h)return o}return null}
function rowGeom(o,row,W,H){const ws=widths(o),x0=(o.x+o.w*(X0/900))*W,x1=(o.x+o.w*((X0+MAX_W*ws[row])/900))*W,y1=(o.y+o.h*((START_Y+row*ROW_GAP)/MODEL_H))*H,y2=(o.y+o.h*((START_Y+row*ROW_GAP+BAR_H)/MODEL_H))*H;return{x0,x1,y1,y2}}
function hitRow(o,clientX,clientY){const r=canvas.getBoundingClientRect(),x=clientX-r.left,y=clientY-r.top;for(let i=0;i<3;i++){const q=rowGeom(o,i,r.width,r.height);if(x>=q.x0-14&&x<=q.x1+14&&y>=q.y1-14&&y<=q.y2+14)return i}return -1}
let ov=document.getElementById('comparisonQuickPickOverlay');if(!ov){ov=document.createElement('canvas');ov.id='comparisonQuickPickOverlay';ov.setAttribute('aria-hidden','true');ov.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:940;pointer-events:none;';wrap.appendChild(ov)}
const g=ov.getContext('2d');
function sizeOv(){const r=wrap.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2),w=Math.max(1,Math.round(r.width*d)),h=Math.max(1,Math.round(r.height*d));if(ov.width!==w)ov.width=w;if(ov.height!==h)ov.height=h;ov.style.width=r.width+'px';ov.style.height=r.height+'px';g.setTransform(d,0,0,d,0,0);return{W:r.width,H:r.height}}
function drawOverlay(){
 const {W,H}=sizeOv();g.clearRect(0,0,W,H);
 for(const o of models()){
  for(const r of relations(o)){
   if(r?.type!=='equalParts'||!Number.isInteger(r.row)||Number(r.parts)<2)continue;
   const q=rowGeom(o,clamp(r.row,0,2),W,H),parts=clamp(Math.round(Number(r.parts)||2),2,12);
   g.save();g.strokeStyle='#111827';g.lineWidth=2;
   for(let i=1;i<parts;i++){const x=q.x0+(q.x1-q.x0)*i/parts;g.beginPath();g.moveTo(x,q.y1+3);g.lineTo(x,q.y2-3);g.stroke()}
   g.restore();
  }
 }
 const o=active();if(!o||mode!=='split')return;
 for(const row of picked){const q=rowGeom(o,row,W,H);g.save();g.strokeStyle='#0f766e';g.lineWidth=5;g.setLineDash([9,6]);g.strokeRect(q.x0-8,q.y1-8,(q.x1-q.x0)+16,(q.y2-q.y1)+16);g.restore()}
}
function mk(text,title){const b=document.createElement('button');b.type='button';b.className='btn soft';b.style.display='none';b.textContent=text;b.title=title;tools.appendChild(b);return b}
const splitBtn=mk('▦ Split','Choose 2, 3 or 4 equal parts, then tap one bar');
for(const id of ['threeBarPatternBtn','threeBarRelationshipBtn']){const b=document.getElementById(id);if(b)b.remove()}
function hideLegacy(){for(const id of ['threeBarPatternBtn','threeBarRelationshipBtn']){const b=document.getElementById(id);if(b)b.remove()}}
function refresh(){hideLegacy();cleanAll();const o=active(),show=!!o;splitBtn.style.display=show?'inline-flex':'none';if(!show){mode='';picked=[];closePopup();drawOverlay();return}splitBtn.classList.toggle('active',mode==='split')}
function finishMode(){mode='';picked=[];closePopup();refresh();drawOverlay()}
function closePopup(){if(popup){popup.remove();popup=null}}
function openSplitPopup(){closePopup();mode='split';picked=[];popup=document.createElement('div');popup.style.cssText='position:fixed;z-index:10450;display:flex;align-items:center;gap:6px;padding:8px;background:#fff;border:1px solid #cfd9de;border-radius:12px;box-shadow:0 10px 26px rgba(23,50,77,.22)';const r=splitBtn.getBoundingClientRect();popup.style.left=Math.max(8,Math.min(innerWidth-235,r.left))+'px';popup.style.top=Math.min(innerHeight-70,r.bottom+6)+'px';const lab=document.createElement('span');lab.textContent='Split into';lab.style.cssText='font:900 12px Inter,system-ui,sans-serif;color:#17324d';popup.appendChild(lab);for(const n of [2,3,4]){const b=document.createElement('button');b.type='button';b.className='btn soft';b.textContent=String(n);b.style.cssText='min-width:42px';b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();splitParts=n;closePopup();refresh();notify(`Tap the bar to split into ${n}`)},true);popup.appendChild(b)}document.body.appendChild(popup);refresh();drawOverlay()}
function splitRow(o,row){const before=clone(strokes);setManual(o);o.intuitiveRelations=relations(o).filter(r=>r?.type==='equalParts'&&r.row!==row);o.intuitiveRelations.push({type:'equalParts',row,parts:splitParts});history(o,before);finishMode();sync();notify(`Bar split into ${splitParts} equal parts`)}
splitBtn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openSplitPopup()},true);
document.addEventListener('pointerdown',e=>{if(popup&&!popup.contains(e.target)&&e.target!==splitBtn)closePopup()},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape')finishMode()},true);
canvas.addEventListener('pointerdown',e=>{const o=modelAt(e.clientX,e.clientY);if(o){currentId=o.smartId;removeAutomaticBracketState(o);refresh()}if(mode!=='split'||!o)return;const row=hitRow(o,e.clientX,e.clientY);if(row<0)return;e.preventDefault();e.stopImmediatePropagation();splitRow(o,row)},true);
const previous=redraw;redraw=function(){cleanAll();previous();cleanAll();refresh();requestAnimationFrame(drawOverlay)};
window.addEventListener('resize',()=>{closePopup();requestAnimationFrame(drawOverlay)});
setTimeout(()=>{cleanAll();refresh();drawOverlay();try{redraw()}catch{}},0);
})();
