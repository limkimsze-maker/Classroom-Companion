(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function')return;
const wrap=document.getElementById('boardWrap'),tools=document.querySelector('.tools');
if(!wrap||!tools)return;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const clone=v=>JSON.parse(JSON.stringify(v));
const X0=180,MAX_W=650,START_Y=60,ROW_GAP=145,BAR_H=58;
let currentId='',panel=null,rebuilding=false;

function isComparison(o){return !!(o&&o.smartType==='barModel'&&o.smartBarType==='comparison'&&Number.isFinite(o.x)&&Number.isFinite(o.y)&&Number.isFinite(o.w)&&Number.isFinite(o.h));}
function models(){return strokes.filter(isComparison)}
function active(){const list=models();if(!list.length)return null;return list.find(o=>o.smartId===currentId)||list[list.length-1]}
function count(o){return clamp(Math.round(Number(o?.barCount)||2),2,5)}
function modelH(o){return Math.max(340,150+count(o)*145)}
function widths(o){const n=count(o),a=Array.isArray(o?.barCompareWidths)?o.barCompareWidths:[];return Array.from({length:n},(_,i)=>clamp(Number(a[i]??(1-i*.11))||.5,.16,1))}
function history(o,before){window.__smartBarLastHistory={before,afterId:o.smartId}}
function notify(msg){if(typeof say==='function'){try{say(msg);return}catch{}}const t=document.getElementById('toast');if(t){t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1300)}}
function state(o){return o?.manualTotalBracket&&o.manualTotalBracket.visible!==false?o.manualTotalBracket:null}

let btn=document.getElementById('manualComparisonTotalBtn');
if(!btn){btn=document.createElement('button');btn.type='button';btn.id='manualComparisonTotalBtn';btn.className='btn soft';btn.textContent='∑ Total';btn.title='Add a total bracket on the right of the comparison bars';tools.appendChild(btn)}
function refreshButton(){
 const list=models(),o=active(),show=list.length>0;
 btn.style.setProperty('display',show?'inline-flex':'none','important');
 btn.textContent=o&&state(o)?'✓ Total':'∑ Total';
 btn.disabled=!show;
}

function addTotal(){const o=active();if(!o){notify('Select a comparison model first');return}if(state(o)){notify('Total bracket already added');return}const before=clone(strokes);o.manualTotalBracket={visible:true,label:'',gapPx:30};history(o,before);notify('Total bracket added');try{redraw();if(typeof syncUi==='function')syncUi()}catch{}requestAnimationFrame(()=>{drawAll();rebuildHits();refreshButton()})}
btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();addTotal()},true);

let ov=document.getElementById('comparisonManualTotalOverlay');
if(!ov){ov=document.createElement('canvas');ov.id='comparisonManualTotalOverlay';ov.setAttribute('aria-hidden','true');ov.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:939;pointer-events:none;';wrap.appendChild(ov)}
const g=ov.getContext('2d');
function sizeOv(){const r=wrap.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2),w=Math.max(1,Math.round(r.width*d)),h=Math.max(1,Math.round(r.height*d));if(ov.width!==w)ov.width=w;if(ov.height!==h)ov.height=h;ov.style.width=r.width+'px';ov.style.height=r.height+'px';g.setTransform(d,0,0,d,0,0);return{W:r.width,H:r.height}}
function totalGeom(o,W,H){const n=count(o),Hm=modelH(o),ws=widths(o),maxW=Math.max(...ws),right=(o.x+o.w*((X0+MAX_W*maxW)/900))*W,y1=(o.y+o.h*(START_Y/Hm))*H,y2=(o.y+o.h*((START_Y+(n-1)*ROW_GAP+BAR_H)/Hm))*H,gap=clamp(Number(o.manualTotalBracket?.gapPx)||30,18,60);return{x:right+gap,y1,y2}}
function vBrace(x,y1,y2,label){if(y2<y1)[y1,y2]=[y2,y1];const h=Math.max(28,y2-y1),mid=(y1+y2)/2,hook=clamp(h*.055,7,13),neck=clamp(h*.06,8,15),depth=11;g.save();g.strokeStyle='#111827';g.fillStyle='#111827';g.lineWidth=2.3;g.lineCap='round';g.lineJoin='round';g.beginPath();g.moveTo(x-depth,y1);g.bezierCurveTo(x-3,y1,x,y1+3,x,y1+hook);g.lineTo(x,mid-neck);g.bezierCurveTo(x,mid-6,x+3,mid-3,x+depth,mid);g.bezierCurveTo(x+3,mid+3,x,mid+6,x,mid+neck);g.lineTo(x,y2-hook);g.bezierCurveTo(x,y2-3,x-3,y2,x-depth,y2);g.stroke();if(label){g.font='700 20px Arial,sans-serif';g.textAlign='left';g.textBaseline='middle';g.fillText(label,x+17,mid)}g.restore()}
function drawAll(){const {W,H}=sizeOv();g.clearRect(0,0,W,H);for(const o of models()){const s=state(o);if(!s)continue;const q=totalGeom(o,W,H);vBrace(q.x,q.y1,q.y2,s.label||'')}}

function closePanel(){if(panel){panel.remove();panel=null}}
function showPanel(o,clientX,clientY){const s=state(o);if(!s)return;closePanel();panel=document.createElement('div');panel.style.cssText='position:fixed;z-index:13060;width:260px;padding:10px;background:#fff;border:1px solid #cfd9de;border-radius:13px;box-shadow:0 10px 28px rgba(23,50,77,.22)';panel.style.left=Math.min(innerWidth-270,Math.max(8,clientX-125))+'px';panel.style.top=Math.min(innerHeight-132,Math.max(8,clientY+10))+'px';const title=document.createElement('div');title.textContent='Total bracket';title.style.cssText='font:900 12px Inter,system-ui,sans-serif;color:#17324d;margin-bottom:7px';const input=document.createElement('input');input.type='text';input.maxLength=30;input.placeholder='Type total / ?';input.value=s.label||'';input.style.cssText='width:100%;border:1px solid #cfd9de;border-radius:9px;padding:7px 8px;font-size:12px;font-weight:700;color:#17324d;margin-bottom:7px';const row=document.createElement('div');row.style.cssText='display:flex;gap:6px';const apply=document.createElement('button');apply.type='button';apply.className='btn soft';apply.textContent='Apply';apply.style.flex='1';const del=document.createElement('button');del.type='button';del.className='btn danger';del.textContent='Delete bracket';del.style.flex='1';apply.onclick=e=>{e.preventDefault();e.stopPropagation();const before=clone(strokes);const t=state(o);if(t)t.label=input.value.trim();history(o,before);closePanel();redraw();if(typeof syncUi==='function')syncUi()};del.onclick=e=>{e.preventDefault();e.stopPropagation();const before=clone(strokes);delete o.manualTotalBracket;history(o,before);closePanel();notify('Total bracket deleted');redraw();if(typeof syncUi==='function')syncUi();refreshButton()};input.onkeydown=e=>{if(e.key==='Enter')apply.click();else if(e.key==='Escape')closePanel()};row.append(apply,del);panel.append(title,input,row);document.body.appendChild(panel);setTimeout(()=>input.focus(),0)}

function clearHits(){for(const z of wrap.querySelectorAll('.comparison-manual-total-hit'))z.remove()}
function rebuildHits(){if(rebuilding)return;rebuilding=true;requestAnimationFrame(()=>{rebuilding=false;clearHits();const cr=canvas.getBoundingClientRect(),wr=wrap.getBoundingClientRect(),ox=cr.left-wr.left,oy=cr.top-wr.top,W=cr.width,H=cr.height;for(const o of models()){if(!state(o))continue;const q=totalGeom(o,W,H),z=document.createElement('button');z.type='button';z.className='comparison-manual-total-hit';z.setAttribute('aria-label','Edit total bracket');z.title='Click total bracket to label or delete';z.style.cssText=`position:absolute;left:${ox+q.x-22}px;top:${oy+q.y1-12}px;width:120px;height:${Math.max(36,q.y2-q.y1+24)}px;border:0;background:transparent;padding:0;margin:0;cursor:pointer;z-index:1215;pointer-events:auto;`;z.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();currentId=o.smartId;showPanel(o,e.clientX,e.clientY)},true);wrap.appendChild(z)}},0)}

function modelAt(clientX,clientY){const r=canvas.getBoundingClientRect(),x=(clientX-r.left)/Math.max(1,r.width),y=(clientY-r.top)/Math.max(1,r.height);for(let i=strokes.length-1;i>=0;i--){const o=strokes[i];if(isComparison(o)&&x>=o.x&&x<=o.x+o.w&&y>=o.y&&y<=o.y+o.h)return o}return null}
canvas.addEventListener('pointerdown',e=>{const o=modelAt(e.clientX,e.clientY);if(o){currentId=o.smartId;refreshButton()}},true);
document.addEventListener('pointerdown',e=>{if(panel&&!panel.contains(e.target))closePanel()},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape')closePanel()},true);
const previous=redraw;redraw=function(){previous();refreshButton();requestAnimationFrame(drawAll);rebuildHits()};
window.addEventListener('resize',()=>{refreshButton();requestAnimationFrame(drawAll);rebuildHits()});
new ResizeObserver(()=>{refreshButton();requestAnimationFrame(drawAll);rebuildHits()}).observe(wrap);
setInterval(()=>{refreshButton();if(models().length){requestAnimationFrame(drawAll);rebuildHits()}},500);
setTimeout(()=>{refreshButton();drawAll();rebuildHits()},0);
})();