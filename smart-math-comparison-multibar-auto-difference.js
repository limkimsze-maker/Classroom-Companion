(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function'||typeof cssW==='undefined'||typeof cssH==='undefined')return;
const wrap=document.getElementById('boardWrap');
if(!wrap)return;

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const START_Y=60,ROW_GAP=145,BAR_H=76,X0=180,MAX_W=650;
const LANE_BASE_PX=8,LANE_STEP_PX=22;
const PATTERN_VERSION=3;
const MODES=['segments','reference','adjacent','outer','all','none'];
const MODE_LABELS={segments:'Segments',reference:'Reference',adjacent:'Adjacent',outer:'Top ↔ Bottom',all:'All pairs',none:'No auto brackets',manual:'Manual'};
let activeId='';

function countFor(o){return clamp(Math.round(Number(o?.barCount)||2),2,5)}
function modelH(n){return Math.max(340,150+n*145)}
function widthsFor(o){const n=countFor(o),a=Array.isArray(o.barCompareWidths)?o.barCompareWidths:[];return Array.from({length:n},(_,i)=>clamp(Number(a[i]??(1-i*.11))||.5,.16,1))}
function endpoint(w){return(X0+MAX_W*w)/900}
function isThree(o){return !!(o&&o.smartType==='barModel'&&o.smartBarType==='comparison'&&countFor(o)===3)}
function threeModels(){return strokes.filter(isThree)}
function autoEntry(e){return !!(e&&(e.autoThreeDifference||e.autoThreeSegment||e.autoMultiDifference))}
function auto3Entry(e){return !!(e&&(e.autoThreeDifference||e.autoThreeSegment))}
function manualEntries(o){return Array.isArray(o.userDrawnBrackets)?o.userDrawnBrackets.filter(e=>e&&!autoEntry(e)):[]}
function clearOldAdjacent(o){if(!Array.isArray(o.userDrawnBrackets))return false;const n=o.userDrawnBrackets.length;o.userDrawnBrackets=o.userDrawnBrackets.filter(e=>!e?.autoMultiDifference);return o.userDrawnBrackets.length!==n}
function longestRow(o){const w=widthsFor(o);let best=0;for(let i=1;i<3;i++)if(w[i]>w[best]+.0001)best=i;return best}
function lengthOrder(o){return widthsFor(o).map((width,row)=>({row,width})).sort((a,b)=>a.width-b.width||a.row-b.row)}

function screenOffsetModel(o,px,H){return px*H/Math.max(1,Number(o.h||0)*cssH)}
function rowSideGeometry(o,targetRow,towardRow,x1,x2,offsetPx=LANE_BASE_PX){
 const H=modelH(3),below=towardRow>targetRow,position=below?'bottom':'top',off=screenOffsetModel(o,offsetPx,H);
 const yModel=START_Y+targetRow*ROW_GAP+(below?BAR_H+off:-off);
 return{targetRow,towardRow,x1:Math.min(x1,x2),x2:Math.max(x1,x2),y:clamp(yModel/H,.01,.99),position,offsetPx};
}

// Standard pair geometry retained for the alternate 3-bar patterns.
function pairGeometry(o,a,b,offsetPx=LANE_BASE_PX){
 const widths=widthsFor(o),H=modelH(3),wa=widths[a],wb=widths[b];
 if(Math.abs(wa-wb)<.025)return null;
 const long=wa>=wb?a:b,short=long===a?b:a,below=short>long,position=below?'bottom':'top',off=screenOffsetModel(o,offsetPx,H);
 const yModel=START_Y+long*ROW_GAP+(below?BAR_H+off:-off);
 return{a,b,long,short,x1:endpoint(widths[short]),x2:endpoint(widths[long]),y:clamp(yModel/H,.01,.99),position,widths,H,offsetPx};
}

// DEFAULT "Segments" pattern. Sort by LENGTH, not row position:
// S = shortest endpoint, M = middle endpoint, L = longest bar.
// - Longest bar: guides at S and M, bracket only S→M.
// - Middle-length bar: guide at S, bracket S→M.
// - Shortest bar: no automatic difference bracket.
// This deliberately omits the unwanted M→L bracket.
function segmentSpecsFor(o){
 const [short,mid,long]=lengthOrder(o),xS=endpoint(short.width),xM=endpoint(mid.width);
 if(Math.abs(mid.width-short.width)<.025)return[];
 return[
  {
   kind:'segment',slot:`seg-long-${long.row}-${mid.row}-${short.row}`,
   targetRow:long.row,towardRow:mid.row,x1:xS,x2:xM,offsetPx:LANE_BASE_PX,
   guideEndpoints:[xS,xM]
  },
  {
   kind:'segment',slot:`seg-mid-${mid.row}-${long.row}-${short.row}`,
   targetRow:mid.row,towardRow:long.row,x1:xS,x2:xM,offsetPx:LANE_BASE_PX,
   guideEndpoints:[xS]
  }
 ];
}

function rawPairSpecsFor(o){
 const mode=o.threeBarPattern||'segments',specs=[];
 if(mode==='none'||mode==='manual'||mode==='segments')return specs;
 if(mode==='reference'){
  const ref=longestRow(o);[0,1,2].filter(i=>i!==ref).forEach(row=>specs.push({a:ref,b:row,slot:`ref-${ref}-${row}`}));
 }else if(mode==='adjacent'){
  specs.push({a:0,b:1,slot:'adj-01'},{a:1,b:2,slot:'adj-12'});
 }else if(mode==='outer'){
  specs.push({a:0,b:2,slot:'outer-02'});
 }else if(mode==='all'){
  specs.push({a:0,b:1,slot:'all-01'},{a:1,b:2,slot:'all-12'},{a:0,b:2,slot:'all-02'});
 }
 return specs;
}

// Alternate patterns still use non-overlapping lanes when two brackets share a side.
function pairSpecsFor(o){
 const enriched=rawPairSpecsFor(o).map(s=>{
  const geo=pairGeometry(o,s.a,s.b,LANE_BASE_PX);
  return{...s,kind:'pair',key:geo?`${geo.long}|${geo.position}`:null,span:geo?Math.abs(geo.x2-geo.x1):0,offsetPx:LANE_BASE_PX};
 });
 const groups=new Map();
 for(const s of enriched){if(!s.key)continue;if(!groups.has(s.key))groups.set(s.key,[]);groups.get(s.key).push(s)}
 for(const list of groups.values()){list.sort((a,b)=>a.span-b.span);list.forEach((s,i)=>{s.offsetPx=LANE_BASE_PX+i*LANE_STEP_PX})}
 return enriched;
}
function specsFor(o){return (o.threeBarPattern||'segments')==='segments'?segmentSpecsFor(o):pairSpecsFor(o)}

function migratePattern(o){
 if(Number(o.threeBarPatternVersion)>=PATTERN_VERSION)return false;
 const manual=manualEntries(o).length>0;
 // Old builds defaulted to Reference. Move that old default to the new Segments layout,
 // while preserving any other pattern the teacher explicitly chose.
 if(!o.threeBarPattern||o.threeBarPattern==='reference')o.threeBarPattern=manual?'manual':'segments';
 o.threeBarPatternVersion=PATTERN_VERSION;
 return true;
}

function ensurePattern(o){
 if(!isThree(o))return false;
 let changed=clearOldAdjacent(o);if(migratePattern(o))changed=true;
 if(!Array.isArray(o.userDrawnBrackets))o.userDrawnBrackets=[];
 if(!o.threeBarPattern){o.threeBarPattern=manualEntries(o).length?'manual':'segments';o.threeBarPatternVersion=PATTERN_VERSION;changed=true}
 if(o.threeBarPattern==='manual'){
  const before=o.userDrawnBrackets.length;o.userDrawnBrackets=o.userDrawnBrackets.filter(e=>!auto3Entry(e));return changed||before!==o.userDrawnBrackets.length;
 }
 const specs=specsFor(o),expected=new Set();
 for(const s of specs){
  if(s.kind==='segment'){
   const id=`auto-3seg-${o.smartId}-${s.slot}`;expected.add(id);
   const geo=rowSideGeometry(o,s.targetRow,s.towardRow,s.x1,s.x2,s.offsetPx);
   let e=o.userDrawnBrackets.find(x=>x&&x.id===id);
   if(!e){
    e={id,autoThreeSegment:true,visible:true,label:'',position:geo.position,x1:geo.x1,x2:geo.x2,y:geo.y,compareRow:s.targetRow,verticalOffset:0,laneOffsetPx:s.offsetPx,guideTargetRow:s.targetRow,guideEndpoints:s.guideEndpoints.slice()};
    o.userDrawnBrackets.push(e);changed=true;
   }else{
    const vals={position:geo.position,x1:geo.x1,x2:geo.x2,y:geo.y,compareRow:s.targetRow,laneOffsetPx:s.offsetPx,guideTargetRow:s.targetRow};
    for(const [k,v] of Object.entries(vals))if((typeof v==='string'&&e[k]!==v)||(typeof v!=='string'&&Math.abs(Number(e[k])-Number(v))>.0005)){e[k]=v;changed=true}
    const next=s.guideEndpoints.slice(),old=Array.isArray(e.guideEndpoints)?e.guideEndpoints:[];
    if(next.length!==old.length||next.some((v,i)=>Math.abs(v-Number(old[i]||0))>.0005)){e.guideEndpoints=next;changed=true}
    if(e.visible===false){e.visible=true;changed=true}e.autoThreeSegment=true;
   }
   if(e&&(e.compareAnchorLeft||e.compareAnchorRight)){delete e.compareAnchorLeft;delete e.compareAnchorRight;changed=true}
   continue;
  }

  const id=`auto-3diff-${o.smartId}-${o.threeBarPattern}-${s.slot}`;expected.add(id);
  const geo=pairGeometry(o,s.a,s.b,s.offsetPx);let e=o.userDrawnBrackets.find(x=>x&&x.id===id);
  if(!e){
   e={id,autoThreeDifference:true,diffRows:[s.a,s.b],visible:!!geo,label:'',position:geo?.position||'bottom',x1:geo?.x1||0,x2:geo?.x2||0,y:geo?.y||0,compareRow:geo?.long??s.a,verticalOffset:0,laneOffsetPx:s.offsetPx,__autoEqualHidden:!geo};
   o.userDrawnBrackets.push(e);changed=true;
  }else if(!geo){
   if(e.visible!==false||!e.__autoEqualHidden){e.visible=false;e.__autoEqualHidden=true;changed=true}
   if(e.laneOffsetPx!==s.offsetPx){e.laneOffsetPx=s.offsetPx;changed=true}
  }else{
   if(e.__autoEqualHidden){e.visible=true;e.__autoEqualHidden=false;changed=true}
   const vals={position:geo.position,x1:geo.x1,x2:geo.x2,y:geo.y,compareRow:geo.long,laneOffsetPx:s.offsetPx};
   for(const [k,v] of Object.entries(vals))if((typeof v==='string'&&e[k]!==v)||(typeof v!=='string'&&Math.abs(Number(e[k])-Number(v))>.0005)){e[k]=v;changed=true}
   if(!Array.isArray(e.diffRows)||e.diffRows[0]!==s.a||e.diffRows[1]!==s.b){e.diffRows=[s.a,s.b];changed=true}e.autoThreeDifference=true;
  }
  if(e&&(e.compareAnchorLeft||e.compareAnchorRight)){delete e.compareAnchorLeft;delete e.compareAnchorRight;changed=true}
 }
 const before=o.userDrawnBrackets.length;
 o.userDrawnBrackets=o.userDrawnBrackets.filter(e=>!auto3Entry(e)||expected.has(e.id));
 if(before!==o.userDrawnBrackets.length)changed=true;
 return changed;
}
function ensureAll(){let changed=false;for(const o of threeModels())if(ensurePattern(o))changed=true;return changed}

let overlay=document.getElementById('comparisonMultiGuideOverlay');
if(!overlay){overlay=document.createElement('canvas');overlay.id='comparisonMultiGuideOverlay';overlay.setAttribute('aria-hidden','true');overlay.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:925;pointer-events:none;';wrap.appendChild(overlay)}
const g=overlay.getContext('2d');
function parseColour(c){const s=String(c||'').trim();if(/^#[0-9a-f]{3}$/i.test(s))return[s[1]+s[1],s[2]+s[2],s[3]+s[3]].map(v=>parseInt(v,16));if(/^#[0-9a-f]{6}$/i.test(s))return[parseInt(s.slice(1,3),16),parseInt(s.slice(3,5),16),parseInt(s.slice(5,7),16)];const m=s.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);return m?[+m[1],+m[2],+m[3]]:[255,255,255]}
function contrastFor(c){const [r,gg,b]=parseColour(c),lum=(.2126*r+.7152*gg+.0722*b)/255;return lum<.6?'#ffffff':'#111827'}
function resizeOverlay(){const r=wrap.getBoundingClientRect(),d=Math.min(window.devicePixelRatio||1,2),w=Math.max(1,Math.round(r.width*d)),h=Math.max(1,Math.round(r.height*d));if(overlay.width!==w)overlay.width=w;if(overlay.height!==h)overlay.height=h;overlay.style.width=r.width+'px';overlay.style.height=r.height+'px';g.setTransform(d,0,0,d,0,0);return{W:r.width,H:r.height}}
function drawGuideLine(o,row,xRatio,W,H){
 const MH=modelH(3),rowY=START_Y+row*ROW_GAP,x=(Number(o.x||0)+Number(o.w||0)*xRatio)*W;
 const y1=(Number(o.y||0)+Number(o.h||0)*(rowY/MH))*H,y2=(Number(o.y||0)+Number(o.h||0)*((rowY+BAR_H)/MH))*H;
 const fill=Array.isArray(o.barFills)?o.barFills[row]:'#ffffff',main=contrastFor(fill),halo=main==='#ffffff'?'rgba(0,0,0,.55)':'rgba(255,255,255,.82)';
 const top=y1+5,bottom=y2-5;if(bottom<=top)return;
 g.save();g.lineCap='round';g.setLineDash([6,6]);g.strokeStyle=halo;g.lineWidth=8;g.beginPath();g.moveTo(x,top);g.lineTo(x,bottom);g.stroke();g.strokeStyle=main;g.lineWidth=4;g.beginPath();g.moveTo(x,top);g.lineTo(x,bottom);g.stroke();g.restore();
}
function drawDots(){
 const {W,H}=resizeOverlay();g.clearRect(0,0,W,H);
 for(const o of threeModels()){
  if(!Array.isArray(o.userDrawnBrackets))continue;
  for(const e of o.userDrawnBrackets){
   if(e?.visible===false)continue;
   if(e?.autoThreeSegment&&Array.isArray(e.guideEndpoints)){
    const row=clamp(Number(e.guideTargetRow)||0,0,2);
    for(const x of e.guideEndpoints)drawGuideLine(o,row,clamp(Number(x)||0,0,1),W,H);
    continue;
   }
   if(!e?.autoThreeDifference||!Array.isArray(e.diffRows))continue;
   const widths=widthsFor(o),a=clamp(Number(e.diffRows[0])||0,0,2),b=clamp(Number(e.diffRows[1])||0,0,2),geo=pairGeometry(o,a,b,Number(e.laneOffsetPx)||LANE_BASE_PX);if(!geo)continue;
   drawGuideLine(o,geo.long,endpoint(widths[geo.short]),W,H);
  }
 }
}

const tools=document.querySelector('.tools');
const patternBtn=document.createElement('button');patternBtn.type='button';patternBtn.className='btn soft';patternBtn.id='threeBarPatternBtn';patternBtn.style.display='none';
patternBtn.title='Cycle 3-bar comparison pattern: Segments → Reference → Adjacent → Top ↔ Bottom → All pairs → No auto brackets';
tools?.appendChild(patternBtn);
function activeModel(){const list=threeModels();if(!list.length)return null;return list.find(o=>o.smartId===activeId)||list[list.length-1]}
function refreshButton(){const o=activeModel();if(!o){patternBtn.style.display='none';return}activeId=o.smartId;patternBtn.style.display='inline-flex';const mode=o.threeBarPattern||'segments';patternBtn.textContent=`3 bars: ${MODE_LABELS[mode]||mode}`;patternBtn.classList.toggle('active',mode!=='none'&&mode!=='manual')}
patternBtn.addEventListener('click',e=>{
 e.preventDefault();e.stopPropagation();const o=activeModel();if(!o)return;
 const current=o.threeBarPattern||'segments';o.threeBarPattern=current==='manual'?'segments':MODES[(MODES.indexOf(current)+1+MODES.length)%MODES.length];o.threeBarPatternVersion=PATTERN_VERSION;
 o.userDrawnBrackets=(o.userDrawnBrackets||[]).filter(x=>!auto3Entry(x)&&!x?.autoMultiDifference);
 ensurePattern(o);try{redraw();if(typeof syncUi==='function')syncUi()}catch{}refreshButton();
},true);
canvas.addEventListener('pointerdown',e=>{
 const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/Math.max(1,r.width),y=(e.clientY-r.top)/Math.max(1,r.height);
 for(let i=strokes.length-1;i>=0;i--){const o=strokes[i];if(!isThree(o))continue;if(x>=o.x&&x<=o.x+o.w&&y>=o.y&&y<=o.y+o.h){activeId=o.smartId;setTimeout(refreshButton,0);break}}
},true);

const previousRedraw=redraw;
redraw=function(){ensureAll();previousRedraw();refreshButton();requestAnimationFrame(drawDots)};
new ResizeObserver(()=>requestAnimationFrame(drawDots)).observe(wrap);window.addEventListener('resize',()=>requestAnimationFrame(drawDots));
setTimeout(()=>{try{ensureAll();redraw()}catch{}},0);
})();
