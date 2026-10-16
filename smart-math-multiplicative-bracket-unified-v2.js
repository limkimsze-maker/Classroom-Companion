(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function')return;
const wrap=document.getElementById('boardWrap'),tools=document.querySelector('.tools');
if(!wrap||!tools)return;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const clone=v=>JSON.parse(JSON.stringify(v));
const X0=180,MAX_W=650,START_Y=60,ROW_GAP=145,BAR_H=58,VB_H=440,GAP=13;
let currentId='',panel=null,totalPanel=null;

function isMC(o){return !!(o&&o.smartType==='barModel'&&o.smartBarType==='multiplicative'&&Number.isFinite(o.x)&&Number.isFinite(o.y)&&Number.isFinite(o.w)&&Number.isFinite(o.h))}
function models(){return strokes.filter(isMC)}
function active(){const list=models();if(!list.length)return null;return list.find(o=>o.smartId===currentId)||list[list.length-1]}
function brackets(o){if(!Array.isArray(o.multiBrackets))o.multiBrackets=[];return o.multiBrackets}
function history(o,before){window.__smartBarLastHistory={before,afterId:o.smartId}}
function notify(msg){if(typeof say==='function'){try{say(msg);return}catch{}}const t=document.getElementById('toast');if(t){t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1300)}}
function rowGeom(o,row,W,H){const y=START_Y+row*ROW_GAP;return{y1:(o.y+o.h*(y/VB_H))*H,y2:(o.y+o.h*((y+BAR_H)/VB_H))*H}}
function bracketGeom(o,b,W,H){const row=clamp(Number(b.row)||0,0,1),rg=rowGeom(o,row,W,H),x1=(o.x+o.w*Number(b.x1||0))*W,x2=(o.x+o.w*Number(b.x2||0))*W,top=b.side!=='bottom',y=top?rg.y1-GAP:rg.y2+GAP;return{x1,x2,y,top}}
function button(text,cls){const b=document.createElement('button');b.type='button';b.className='btn '+(cls||'');b.textContent=text;b.style.cssText='min-height:32px;padding:5px 8px;font-size:11px;flex:1';return b}
function closePanel(){if(panel){panel.remove();panel=null}}
function closeTotalPanel(){if(totalPanel){totalPanel.remove();totalPanel=null}}

// Deliberately mirrors the working Comparison bracket editor.
function showBracketPanel(o,b,clientX,clientY){
 closePanel();
 panel=document.createElement('div');panel.style.cssText='position:fixed;z-index:13350;width:260px;padding:10px;background:#fff;border:1px solid #cfd9de;border-radius:13px;box-shadow:0 10px 28px rgba(23,50,77,.22)';panel.style.left=Math.min(innerWidth-270,Math.max(8,clientX-125))+'px';panel.style.top=Math.min(innerHeight-178,Math.max(8,clientY+10))+'px';
 const title=document.createElement('div');title.textContent=(Number(b.unitCount)||1)>1?`${b.unitCount} units bracket`:'Unit bracket';title.style.cssText='font:900 12px Inter,system-ui,sans-serif;color:#17324d;margin-bottom:7px';
 const input=document.createElement('input');input.type='text';input.maxLength=30;input.placeholder='Type bracket label';input.value=b.label||'';input.style.cssText='width:100%;border:1px solid #cfd9de;border-radius:9px;padding:7px 8px;font-size:12px;font-weight:700;color:#17324d;margin-bottom:7px';
 const sideRow=document.createElement('div');sideRow.style.cssText='display:flex;gap:6px;margin-bottom:7px';const topBtn=button('↑ Above','soft'),bottomBtn=button('↓ Below','soft');const markSide=()=>{topBtn.classList.toggle('active',b.side!=='bottom');bottomBtn.classList.toggle('active',b.side==='bottom')};markSide();
 topBtn.onclick=e=>{e.preventDefault();e.stopPropagation();b.side='top';markSide();redraw()};bottomBtn.onclick=e=>{e.preventDefault();e.stopPropagation();b.side='bottom';markSide();redraw()};sideRow.append(topBtn,bottomBtn);
 const actions=document.createElement('div');actions.style.cssText='display:flex;gap:6px';const apply=button('Apply','soft'),del=button('Delete bracket','danger');
 apply.onclick=e=>{e.preventDefault();e.stopPropagation();const before=clone(strokes),x=brackets(o).find(q=>q.id===b.id);if(x){x.label=input.value.trim();x.side=b.side||'top';x.visible=true}history(o,before);closePanel();redraw();if(typeof syncUi==='function')syncUi()};
 del.onclick=e=>{e.preventDefault();e.stopPropagation();const before=clone(strokes),list=brackets(o),i=list.findIndex(q=>q.id===b.id);if(i>=0)list.splice(i,1);history(o,before);closePanel();redraw();if(typeof syncUi==='function')syncUi();notify('Bracket deleted')};
 input.onkeydown=e=>{if(e.key==='Enter')apply.click();else if(e.key==='Escape')closePanel()};actions.append(apply,del);panel.append(title,input,sideRow,actions);document.body.appendChild(panel);setTimeout(()=>input.focus(),0)
}

let totalBtn=document.getElementById('manualMultiplicativeTotalBtn');
if(!totalBtn){totalBtn=document.createElement('button');totalBtn.type='button';totalBtn.id='manualMultiplicativeTotalBtn';totalBtn.className='btn soft';totalBtn.textContent='∑ Total';totalBtn.title='Add a total bracket on the right of the two bars';tools.appendChild(totalBtn)}
function totalState(o){return o?.manualMultiplicativeTotalBracket&&o.manualMultiplicativeTotalBracket.visible!==false?o.manualMultiplicativeTotalBracket:null}
function refreshTotalButton(){const list=models(),o=active(),show=list.length>0;totalBtn.style.setProperty('display',show?'inline-flex':'none','important');totalBtn.textContent=o&&totalState(o)?'✓ Total':'∑ Total';totalBtn.disabled=!show}
function addTotal(){const o=active();if(!o){notify('Select a multiplicative comparison model first');return}if(totalState(o)){notify('Total bracket already added');return}const before=clone(strokes);o.manualMultiplicativeTotalBracket={visible:true,label:'',gapPx:30};history(o,before);notify('Total bracket added');redraw();if(typeof syncUi==='function')syncUi()}
totalBtn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();addTotal()},true);

let ov=document.getElementById('multiplicativeUnifiedTotalOverlay');
if(!ov){ov=document.createElement('canvas');ov.id='multiplicativeUnifiedTotalOverlay';ov.setAttribute('aria-hidden','true');ov.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:940;pointer-events:none;';wrap.appendChild(ov)}
const g=ov.getContext('2d');
function sizeOv(){const r=wrap.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2),w=Math.max(1,Math.round(r.width*d)),h=Math.max(1,Math.round(r.height*d));if(ov.width!==w)ov.width=w;if(ov.height!==h)ov.height=h;ov.style.width=r.width+'px';ov.style.height=r.height+'px';g.setTransform(d,0,0,d,0,0);return{W:r.width,H:r.height}}
function totalGeom(o,W,H){const right=(o.x+o.w*((X0+MAX_W)/900))*W,y1=(o.y+o.h*(START_Y/VB_H))*H,y2=(o.y+o.h*((START_Y+ROW_GAP+BAR_H)/VB_H))*H,gap=clamp(Number(o.manualMultiplicativeTotalBracket?.gapPx)||30,18,60);return{x:right+gap,y1,y2}}
function vBrace(x,y1,y2,label){if(y2<y1)[y1,y2]=[y2,y1];const h=Math.max(28,y2-y1),mid=(y1+y2)/2,hook=clamp(h*.055,7,13),neck=clamp(h*.06,8,15),depth=11;g.save();g.strokeStyle='#111827';g.fillStyle='#111827';g.lineWidth=2.3;g.lineCap='round';g.lineJoin='round';g.beginPath();g.moveTo(x-depth,y1);g.bezierCurveTo(x-3,y1,x,y1+3,x,y1+hook);g.lineTo(x,mid-neck);g.bezierCurveTo(x,mid-6,x+3,mid-3,x+depth,mid);g.bezierCurveTo(x+3,mid+3,x,mid+6,x,mid+neck);g.lineTo(x,y2-hook);g.bezierCurveTo(x,y2-3,x-3,y2,x-depth,y2);g.stroke();if(label){g.font='700 20px Arial,sans-serif';g.textAlign='left';g.textBaseline='middle';g.fillText(label,x+17,mid)}g.restore()}
function drawTotals(){const{W,H}=sizeOv();g.clearRect(0,0,W,H);for(const o of models()){const s=totalState(o);if(!s)continue;const q=totalGeom(o,W,H);vBrace(q.x,q.y1,q.y2,s.label||'')}}
function showTotalPanel(o,clientX,clientY){const s=totalState(o);if(!s)return;closeTotalPanel();totalPanel=document.createElement('div');totalPanel.style.cssText='position:fixed;z-index:13360;width:260px;padding:10px;background:#fff;border:1px solid #cfd9de;border-radius:13px;box-shadow:0 10px 28px rgba(23,50,77,.22)';totalPanel.style.left=Math.min(innerWidth-270,Math.max(8,clientX-125))+'px';totalPanel.style.top=Math.min(innerHeight-132,Math.max(8,clientY+10))+'px';const title=document.createElement('div');title.textContent='Total bracket';title.style.cssText='font:900 12px Inter,system-ui,sans-serif;color:#17324d;margin-bottom:7px';const input=document.createElement('input');input.type='text';input.maxLength=30;input.placeholder='Type total / ?';input.value=s.label||'';input.style.cssText='width:100%;border:1px solid #cfd9de;border-radius:9px;padding:7px 8px;font-size:12px;font-weight:700;color:#17324d;margin-bottom:7px';const row=document.createElement('div');row.style.cssText='display:flex;gap:6px';const apply=button('Apply','soft'),del=button('Delete bracket','danger');apply.onclick=e=>{e.preventDefault();e.stopPropagation();const before=clone(strokes),t=totalState(o);if(t)t.label=input.value.trim();history(o,before);closeTotalPanel();redraw();if(typeof syncUi==='function')syncUi()};del.onclick=e=>{e.preventDefault();e.stopPropagation();const before=clone(strokes);delete o.manualMultiplicativeTotalBracket;history(o,before);closeTotalPanel();notify('Total bracket deleted');redraw();if(typeof syncUi==='function')syncUi();refreshTotalButton()};input.onkeydown=e=>{if(e.key==='Enter')apply.click();else if(e.key==='Escape')closeTotalPanel()};row.append(apply,del);totalPanel.append(title,input,row);document.body.appendChild(totalPanel);setTimeout(()=>input.focus(),0)}

// Direct geometry hit-testing at the board capture layer. This is the same bracket geometry as Comparison,
// and it runs before the unit-selection zones so the bracket can always be clicked.
function boardPoint(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top,W:r.width,H:r.height}}
function hitUnitBracket(p){const list=models();for(let i=list.length-1;i>=0;i--){const o=list[i],bs=brackets(o);for(let j=bs.length-1;j>=0;j--){const b=bs[j];if(!b||b.visible===false)continue;const q=bracketGeom(o,b,p.W,p.H),left=Math.min(q.x1,q.x2)-10,right=Math.max(q.x1,q.x2)+10;if(p.x>=left&&p.x<=right&&Math.abs(p.y-q.y)<=15)return{o,b}}}return null}
function hitTotal(p){const list=models();for(let i=list.length-1;i>=0;i--){const o=list[i];if(!totalState(o))continue;const q=totalGeom(o,p.W,p.H);if(Math.abs(p.x-q.x)<=30&&p.y>=q.y1-12&&p.y<=q.y2+12)return{o}}return null}
wrap.addEventListener('pointerdown',e=>{if(panel?.contains(e.target)||totalPanel?.contains(e.target))return;const p=boardPoint(e),u=hitUnitBracket(p);if(u){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();currentId=u.o.smartId;showBracketPanel(u.o,u.b,e.clientX,e.clientY);return}const t=hitTotal(p);if(t){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();currentId=t.o.smartId;showTotalPanel(t.o,e.clientX,e.clientY)}},true);
function modelAt(clientX,clientY){const r=canvas.getBoundingClientRect(),x=(clientX-r.left)/Math.max(1,r.width),y=(clientY-r.top)/Math.max(1,r.height);for(let i=strokes.length-1;i>=0;i--){const o=strokes[i];if(isMC(o)&&x>=o.x&&x<=o.x+o.w&&y>=o.y&&y<=o.y+o.h)return o}return null}
canvas.addEventListener('pointerdown',e=>{const o=modelAt(e.clientX,e.clientY);if(o){currentId=o.smartId;refreshTotalButton()}},true);
document.addEventListener('pointerdown',e=>{if(panel&&!panel.contains(e.target))closePanel();if(totalPanel&&!totalPanel.contains(e.target))closeTotalPanel()},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closePanel();closeTotalPanel()}},true);
const previous=redraw;redraw=function(){previous();refreshTotalButton();requestAnimationFrame(drawTotals)};
window.addEventListener('resize',()=>{refreshTotalButton();requestAnimationFrame(drawTotals)});new ResizeObserver(()=>{refreshTotalButton();requestAnimationFrame(drawTotals)}).observe(wrap);setInterval(()=>{refreshTotalButton();if(models().length)requestAnimationFrame(drawTotals)},500);setTimeout(()=>{refreshTotalButton();drawTotals()},0);
})();
