(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function')return;
const wrap=document.getElementById('boardWrap');if(!wrap)return;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const clone=v=>JSON.parse(JSON.stringify(v));
const X0=180,MAX_W=650,START_Y=60,ROW_GAP=145,BAR_H=76;
let rebuilding=false;
function isComparison(o){return !!(o&&o.smartType==='barModel'&&o.smartBarType==='comparison'&&Number.isFinite(o.x)&&Number.isFinite(o.y)&&Number.isFinite(o.w)&&Number.isFinite(o.h));}
function count(o){return clamp(Math.round(Number(o?.barCount)||2),2,5)}
function modelH(o){return Math.max(340,150+count(o)*145)}
function widths(o){const n=count(o),a=Array.isArray(o?.barCompareWidths)?o.barCompareWidths:[];return Array.from({length:n},(_,i)=>clamp(Number(a[i]??(1-i*.11))||.5,.16,1))}
function uniqueSorted(values){const out=[];for(const v of values.slice().sort((a,b)=>a-b)){if(!out.length||Math.abs(v-out[out.length-1])>.012)out.push(v)}return out}
function smallSegments(o,row){
 const ws=widths(o),own=ws[row],u=uniqueSorted(ws).filter(v=>v<=own+.012);
 if(u.length<2)return[];
 const out=[];
 for(let i=0;i<u.length-1;i++){
  const a=u[i],b=u[i+1];if(b-a<.025)continue;
  out.push({row,a,b,x1:(X0+MAX_W*a)/900,x2:(X0+MAX_W*b)/900});
 }
 return out;
}
function bracketY(o,row,side){const Hm=modelH(o),y=START_Y+row*ROW_GAP;return side==='bottom'?(y+BAR_H+13)/Hm:(y-13)/Hm}
function sameSegment(b,seg){return !!(b&&b.isSegmentBracket&&b.visible!==false&&Number(b.compareRow)===seg.row&&Math.abs(Number(b.x1)-seg.x1)<.003&&Math.abs(Number(b.x2)-seg.x2)<.003)}
function addBracket(o,seg){
 if(!Array.isArray(o.userDrawnBrackets))o.userDrawnBrackets=[];
 const existing=o.userDrawnBrackets.find(b=>sameSegment(b,seg));
 if(existing){if(typeof say==='function')try{say('Bracket already added to this segment')}catch{};return}
 const before=clone(strokes),side=seg.row===count(o)-1?'bottom':'top';
 o.userDrawnBracketScan=true;
 o.userDrawnBrackets.push({id:'segment-'+Date.now()+'-'+seg.row,isSegmentBracket:true,visible:true,label:'',compareRow:seg.row,x1:seg.x1,x2:seg.x2,y:bracketY(o,seg.row,side),position:side});
 window.__smartBarLastHistory={before,afterId:o.smartId};
 try{redraw();if(typeof syncUi==='function')syncUi()}catch{}
 if(typeof say==='function')try{say('Bracket added to segment')}catch{}
}
function clearZones(){for(const z of wrap.querySelectorAll('.comparison-segment-hit-zone'))z.remove()}
function selectionMode(){try{return typeof tool==='undefined'||tool==='select'}catch{return true}}
function rebuildZones(){
 if(rebuilding)return;rebuilding=true;
 requestAnimationFrame(()=>{
  rebuilding=false;clearZones();
  if(!selectionMode()){wrap.dataset.segmentZones='0';return}
  const cr=canvas.getBoundingClientRect(),wr=wrap.getBoundingClientRect(),ox=cr.left-wr.left,oy=cr.top-wr.top,W=cr.width,H=cr.height;
  let made=0;
  for(const o of strokes){
   if(!isComparison(o))continue;
   const Hm=modelH(o),n=count(o);
   for(let row=0;row<n;row++){
    const y1=(o.y+o.h*((START_Y+row*ROW_GAP)/Hm))*H;
    const y2=(o.y+o.h*((START_Y+row*ROW_GAP+BAR_H)/Hm))*H;
    for(const seg of smallSegments(o,row)){
     const px1=(o.x+o.w*seg.x1)*W,px2=(o.x+o.w*seg.x2)*W;
     if(px2-px1<12)continue;
     const zone=document.createElement('button');zone.type='button';zone.className='comparison-segment-hit-zone';zone.setAttribute('aria-label','Add bracket to this comparison segment');zone.title='Click this small segment to add a bracket';
     zone.style.cssText=`position:absolute;left:${ox+px1}px;top:${oy+y1}px;width:${Math.max(14,px2-px1)}px;height:${Math.max(26,y2-y1)}px;border:0;background:rgba(37,99,235,.002);padding:0;margin:0;cursor:pointer;z-index:1200;border-radius:4px;pointer-events:auto;`;
     zone.addEventListener('pointerenter',()=>{zone.style.background='rgba(37,99,235,.11)';zone.style.boxShadow='inset 0 0 0 2px rgba(37,99,235,.7)'});
     zone.addEventListener('pointerleave',()=>{zone.style.background='rgba(37,99,235,.002)';zone.style.boxShadow='none'});
     zone.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();addBracket(o,seg)},true);
     zone.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()},true);
     wrap.appendChild(zone);made++;
    }
   }
  }
  wrap.dataset.segmentZones=String(made);
 });
}
const prev=redraw;redraw=function(){prev();rebuildZones()};
window.addEventListener('resize',rebuildZones);
new ResizeObserver(rebuildZones).observe(wrap);
document.addEventListener('click',()=>setTimeout(rebuildZones,0),true);
setInterval(rebuildZones,700);
setTimeout(rebuildZones,0);
})();
