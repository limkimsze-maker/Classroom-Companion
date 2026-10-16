(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function')return;
const wrap=document.getElementById('boardWrap');if(!wrap)return;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const clone=v=>JSON.parse(JSON.stringify(v));
const X0=180,MAX_W=650,START_Y=60,ROW_GAP=145,BAR_H=76;
let rebuilding=false,panel=null;
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
function sameSegment(b,seg){return !!(b&&b.visible!==false&&Number(b.row)===seg.row&&Math.abs(Number(b.x1)-seg.x1)<.003&&Math.abs(Number(b.x2)-seg.x2)<.003)}
function sideFor(o,row){return row===count(o)-1?'bottom':'top'}
function ensureStore(o){if(!Array.isArray(o.segmentBrackets))o.segmentBrackets=[];return o.segmentBrackets}
function addBracket(o,seg){
 const list=ensureStore(o),existing=list.find(b=>sameSegment(b,seg));
 if(existing){notify('Bracket already added to this segment');return}
 const before=clone(strokes),side=sideFor(o,seg.row);
 list.push({id:'segment-'+Date.now()+'-'+seg.row,row:seg.row,x1:seg.x1,x2:seg.x2,side,label:'',visible:true});
 window.__smartBarLastHistory={before,afterId:o.smartId};
 notify('Bracket added to segment');
 try{redraw();if(typeof syncUi==='function')syncUi()}catch{}
}
function notify(msg){if(typeof say==='function'){try{say(msg);return}catch{}}const t=document.getElementById('toast');if(t){t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1300)}}
function closePanel(){if(panel){panel.remove();panel=null}}
function showPanel(o,b,clientX,clientY){
 closePanel();panel=document.createElement('div');panel.style.cssText='position:fixed;z-index:13050;width:260px;padding:10px;background:#fff;border:1px solid #cfd9de;border-radius:13px;box-shadow:0 10px 28px rgba(23,50,77,.22)';panel.style.left=Math.min(innerWidth-270,Math.max(8,clientX-125))+'px';panel.style.top=Math.min(innerHeight-132,Math.max(8,clientY+10))+'px';
 const title=document.createElement('div');title.textContent='Segment bracket';title.style.cssText='font:900 12px Inter,system-ui,sans-serif;color:#17324d;margin-bottom:7px';
 const input=document.createElement('input');input.type='text';input.maxLength=30;input.placeholder='Type label';input.value=b.label||'';input.style.cssText='width:100%;border:1px solid #cfd9de;border-radius:9px;padding:7px 8px;font-size:12px;font-weight:700;color:#17324d;margin-bottom:7px';
 const row=document.createElement('div');row.style.cssText='display:flex;gap:6px';
 const apply=document.createElement('button');apply.type='button';apply.className='btn soft';apply.textContent='Apply';apply.style.flex='1';
 const del=document.createElement('button');del.type='button';del.className='btn danger';del.textContent='Delete bracket';del.style.flex='1';
 apply.onclick=e=>{e.preventDefault();e.stopPropagation();const x=ensureStore(o).find(q=>q.id===b.id);if(x)x.label=input.value.trim();closePanel();redraw();if(typeof syncUi==='function')syncUi()};
 del.onclick=e=>{e.preventDefault();e.stopPropagation();const before=clone(strokes),list=ensureStore(o),i=list.findIndex(q=>q.id===b.id);if(i>=0)list.splice(i,1);window.__smartBarLastHistory={before,afterId:o.smartId};closePanel();redraw();if(typeof syncUi==='function')syncUi();notify('Bracket deleted')};
 input.onkeydown=e=>{if(e.key==='Enter')apply.click();else if(e.key==='Escape')closePanel()};
 row.append(apply,del);panel.append(title,input,row);document.body.appendChild(panel);setTimeout(()=>input.focus(),0);
}
let ov=document.getElementById('comparisonSegmentBracketOverlay');
if(!ov){ov=document.createElement('canvas');ov.id='comparisonSegmentBracketOverlay';ov.setAttribute('aria-hidden','true');ov.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:938;pointer-events:none;';wrap.appendChild(ov)}
const g=ov.getContext('2d');
function sizeOv(){const r=wrap.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2),w=Math.max(1,Math.round(r.width*d)),h=Math.max(1,Math.round(r.height*d));if(ov.width!==w)ov.width=w;if(ov.height!==h)ov.height=h;ov.style.width=r.width+'px';ov.style.height=r.height+'px';g.setTransform(d,0,0,d,0,0);return{W:r.width,H:r.height}}
function rowGeom(o,row,W,H){const Hm=modelH(o),y=START_Y+row*ROW_GAP;return{y1:(o.y+o.h*(y/Hm))*H,y2:(o.y+o.h*((y+BAR_H)/Hm))*H}}
function brace(x1,x2,y,top,label){if(x2<x1)[x1,x2]=[x2,x1];const w=Math.max(18,x2-x1),mid=(x1+x2)/2,end=clamp(w*.05,5,11),neck=clamp(w*.035,5,9),depth=8,edgeDir=top?1:-1,notchDir=top?-1:1;g.save();g.strokeStyle='#111827';g.fillStyle='#111827';g.lineWidth=2.3;g.lineCap='round';g.lineJoin='round';g.beginPath();g.moveTo(x1,y+edgeDir*depth);g.bezierCurveTo(x1,y+edgeDir*3,x1+2,y,x1+end,y);g.lineTo(mid-neck,y);g.bezierCurveTo(mid-neck*.35,y,mid-4,y+notchDir*2,mid,y+notchDir*depth);g.bezierCurveTo(mid+4,y+notchDir*2,mid+neck*.35,y,mid+neck,y);g.lineTo(x2-end,y);g.bezierCurveTo(x2-2,y,x2,y+edgeDir*3,x2,y+edgeDir*depth);g.stroke();if(label){g.font='700 20px Arial,sans-serif';g.textAlign='center';g.textBaseline=top?'bottom':'top';g.fillText(label,mid,y+(top?-16:16))}g.restore()}
function clearUiZones(){for(const z of wrap.querySelectorAll('.comparison-segment-hit-zone,.comparison-segment-bracket-hit'))z.remove()}
function drawBrackets(){const {W,H}=sizeOv();g.clearRect(0,0,W,H);for(const o of strokes){if(!isComparison(o)||!Array.isArray(o.segmentBrackets))continue;for(const b of o.segmentBrackets){if(!b||b.visible===false)continue;const rg=rowGeom(o,clamp(Number(b.row)||0,0,count(o)-1),W,H),x1=(o.x+o.w*Number(b.x1||0))*W,x2=(o.x+o.w*Number(b.x2||0))*W,top=b.side!=='bottom',y=top?rg.y1-13:rg.y2+13;brace(x1,x2,y,top,b.label||'')}}}
function selectionMode(){try{return typeof tool==='undefined'||tool==='select'}catch{return true}}
function rebuildZones(){
 if(rebuilding)return;rebuilding=true;requestAnimationFrame(()=>{
  rebuilding=false;clearUiZones();
  const cr=canvas.getBoundingClientRect(),wr=wrap.getBoundingClientRect(),ox=cr.left-wr.left,oy=cr.top-wr.top,W=cr.width,H=cr.height;
  if(selectionMode()){
   for(const o of strokes){if(!isComparison(o))continue;const Hm=modelH(o),n=count(o);for(let row=0;row<n;row++){const y1=(o.y+o.h*((START_Y+row*ROW_GAP)/Hm))*H,y2=(o.y+o.h*((START_Y+row*ROW_GAP+BAR_H)/Hm))*H;for(const seg of smallSegments(o,row)){
    const px1=(o.x+o.w*seg.x1)*W,px2=(o.x+o.w*seg.x2)*W;if(px2-px1<12)continue;
    const z=document.createElement('button');z.type='button';z.className='comparison-segment-hit-zone';z.setAttribute('aria-label','Add bracket to this comparison segment');z.title='Click this segment to add a bracket';z.style.cssText=`position:absolute;left:${ox+px1}px;top:${oy+y1}px;width:${Math.max(14,px2-px1)}px;height:${Math.max(26,y2-y1)}px;border:0;background:rgba(37,99,235,.002);padding:0;margin:0;cursor:pointer;z-index:1200;border-radius:4px;pointer-events:auto;`;
    z.onpointerenter=()=>{z.style.background='rgba(37,99,235,.11)';z.style.boxShadow='inset 0 0 0 2px rgba(37,99,235,.7)'};z.onpointerleave=()=>{z.style.background='rgba(37,99,235,.002)';z.style.boxShadow='none'};z.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();addBracket(o,seg)},true);z.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()},true);wrap.appendChild(z)
   }}}
  }
  for(const o of strokes){if(!isComparison(o)||!Array.isArray(o.segmentBrackets))continue;for(const b of o.segmentBrackets){if(!b||b.visible===false)continue;const rg=rowGeom(o,clamp(Number(b.row)||0,0,count(o)-1),W,H),x1=(o.x+o.w*Number(b.x1||0))*W,x2=(o.x+o.w*Number(b.x2||0))*W,top=b.side!=='bottom',y=top?rg.y1-13:rg.y2+13;const z=document.createElement('button');z.type='button';z.className='comparison-segment-bracket-hit';z.setAttribute('aria-label','Edit segment bracket');z.title='Click bracket to edit or delete';z.style.cssText=`position:absolute;left:${ox+Math.min(x1,x2)-8}px;top:${oy+y-22}px;width:${Math.max(28,Math.abs(x2-x1)+16)}px;height:44px;border:0;background:transparent;padding:0;margin:0;cursor:pointer;z-index:1210;pointer-events:auto;`;z.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();showPanel(o,b,e.clientX,e.clientY)},true);wrap.appendChild(z)}}
 },0)
}
function cleanLegacy(){for(const o of strokes){if(!isComparison(o)||!Array.isArray(o.userDrawnBrackets))continue;o.userDrawnBrackets=o.userDrawnBrackets.filter(b=>!b?.isSegmentBracket)}}
cleanLegacy();
const prev=redraw;redraw=function(){prev();requestAnimationFrame(drawBrackets);rebuildZones()};
window.addEventListener('resize',()=>{requestAnimationFrame(drawBrackets);rebuildZones()});new ResizeObserver(()=>{requestAnimationFrame(drawBrackets);rebuildZones()}).observe(wrap);document.addEventListener('pointerdown',e=>{if(panel&&!panel.contains(e.target))closePanel()},true);document.addEventListener('keydown',e=>{if(e.key==='Escape')closePanel()},true);setInterval(rebuildZones,700);setTimeout(()=>{drawBrackets();rebuildZones()},0);
})();
