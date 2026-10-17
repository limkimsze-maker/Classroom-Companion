/* Explicit, local handwriting recognition. Original ink changes only on confirmation. */
(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function'||typeof syncUi!=='function')return;
const tools=document.querySelector('.tools'),board=document.getElementById('boardWrap');if(!tools||!board)return;
const clone=x=>JSON.parse(JSON.stringify(x)),clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
let selecting=false,area=null,selectionPointer=null,start=null,dialog=null,session=0;
const history=[];
const style=document.createElement('style');style.textContent=`
#handwritingBeautifyBtn{white-space:nowrap}
.handwriting-chooser{position:absolute;inset:0;z-index:16000;pointer-events:none}
.handwriting-chooser p{position:absolute;top:10px;left:50%;transform:translateX(-50%);margin:0;max-width:calc(100% - 24px);padding:9px 12px;border-radius:10px;background:#17324d;color:white;font:700 13px Arial,sans-serif;text-align:center}
.handwriting-selection-box{position:absolute;border:2px dashed #0f766e;background:rgba(15,118,110,.08)}
#boardWrap.handwriting-selecting,#boardWrap.handwriting-selecting *{cursor:crosshair!important}
.handwriting-review-backdrop{position:fixed;inset:0;background:rgba(23,50,77,.22);z-index:20000;display:grid;place-items:center;padding:12px}
.handwriting-review{box-sizing:border-box;width:min(520px,100%);max-height:90vh;overflow:auto;background:white;border:1px solid #cfd9de;border-radius:16px;padding:18px;box-shadow:0 15px 45px rgba(23,50,77,.25);color:#17324d}
.handwriting-review h2{font:900 18px Arial,sans-serif;margin:0 0 8px}
.handwriting-review p{font:13px/1.5 Arial,sans-serif;margin:7px 0}
.handwriting-review label{display:block;font:700 13px Arial,sans-serif;margin-top:12px}
.handwriting-review input{box-sizing:border-box;width:100%;font-size:24px;font-weight:700;padding:9px;border:1px solid #9dd9d0;border-radius:9px;margin:6px 0}
.handwriting-review img{display:block;max-width:100%;height:110px;object-fit:contain;object-position:left center;background:#fafcfc;border-radius:8px}
.handwriting-review .handwriting-clean-preview{height:150px;background:white}
.handwriting-review .handwriting-actions{display:flex;gap:8px;margin-top:14px}
.handwriting-review .handwriting-actions button:first-child{flex:1}
.handwriting-review [role=status]{min-height:20px;color:#667085}
.handwriting-review .handwriting-error{color:#b42318}
.handwriting-review [hidden]{display:none!important}
`;document.head.appendChild(style);
const btn=document.createElement('button');btn.id='handwritingBeautifyBtn';btn.type='button';btn.className='btn soft';btn.textContent='✨ Beautify';btn.title='Recognise selected handwritten numbers and equations';tools.insertBefore(btn,document.getElementById('undoBtn'));
const eligible=s=>s&&!s.erase&&!s.locked&&!s.background&&!s.smartGenerated&&!s.shape&&Array.isArray(s.points)&&s.points.length&&s.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));
function sayLocal(text){if(typeof say==='function')say(text)}
function groupBounds(group){const pts=group.flatMap(s=>s.points),xs=pts.map(p=>p.x),ys=pts.map(p=>p.y),x=Math.min(...xs),y=Math.min(...ys);return{x,y,w:Math.max(...xs)-x,h:Math.max(...ys)-y}}
function stop(e){e.preventDefault();e.stopImmediatePropagation()}
function endSelection(){const id=selectionPointer;selecting=false;selectionPointer=null;start=null;area?.remove();area=null;board.classList.remove('handwriting-selecting');btn.classList.remove('active');try{if(id!==null)canvas.releasePointerCapture(id)}catch{}}
function closeReview(){session++;dialog?.remove();dialog=null}
function svgInk(group){
 const b=groupBounds(group),W=Math.max(10,b.w*cssW),H=Math.max(10,b.h*cssH),els=[];
 for(const s of group){const color=/^#[0-9a-f]{3,8}$/i.test(s.colour||'')?s.colour:'#17324d',points=s.points.map(p=>[(p.x-b.x)*cssW+10,(p.y-b.y)*cssH+10]);
  if(points.length===1)els.push(`<circle cx="${points[0][0]}" cy="${points[0][1]}" r="${(s.size||4)/2}" fill="${color}"/>`);
  else els.push(`<polyline points="${points.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${color}" stroke-width="${s.size||4}" stroke-linecap="round" stroke-linejoin="round"/>`);
 }
 return'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W+20} ${H+20}">${els.join('')}</svg>`);
}
function availableUndo(){return history.length&&history[history.length-1].after===JSON.stringify(strokes)}
function undoBeautify(e){
 if(!availableUndo())return false;
 e?.preventDefault?.();e?.stopImmediatePropagation?.();const last=history.pop();strokes=clone(last.before);window.WhiteboardMarqueeSelection?.clear();redraw();syncUi();sayLocal('Original handwriting restored');return true;
}
async function review(group){
 group=group.filter(s=>strokes.includes(s)&&eligible(s));if(!group.length){beginSelection();return}
 if(group.length>180||group.reduce((n,s)=>n+s.points.length,0)>16000){beginSelection();sayLocal('Select a shorter number or equation and try again.');return}
 endSelection();closeReview();const id=session,original=JSON.stringify(group);
 const backdrop=document.createElement('div');backdrop.className='handwriting-review-backdrop';dialog=backdrop;
 const panel=document.createElement('section');panel.className='handwriting-review';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','handwritingReviewTitle');
 const title=document.createElement('h2');title.id='handwritingReviewTitle';title.textContent='Check your handwriting';
 const help=document.createElement('p');help.textContent='Digits, decimals, $, + − × ÷ =. Check or edit the reading before applying.';
 const ink=document.createElement('img');ink.src=svgInk(group);ink.alt='Your original selected handwriting';
 const label=document.createElement('label');label.htmlFor='handwritingReadText';label.textContent='Recognised text';
 const input=document.createElement('input');input.id='handwritingReadText';input.type='text';input.maxLength=180;input.autocomplete='off';input.setAttribute('aria-label','Check or correct recognised equation');input.style.fontFamily=window.WhiteboardEquationFormatter?.font()||'Arial';
 const status=document.createElement('p');status.setAttribute('role','status');status.textContent='Reading handwriting on this device…';
 const preview=document.createElement('img');preview.className='handwriting-clean-preview';preview.alt='Horizontal preview using the Equation font in your original writing area';preview.hidden=true;
 const actions=document.createElement('div');actions.className='handwriting-actions';
 const apply=document.createElement('button');apply.type='button';apply.className='btn soft';apply.textContent='✓ Apply beautify';apply.disabled=true;
 const cancel=document.createElement('button');cancel.type='button';cancel.className='btn';cancel.textContent='Cancel';cancel.onclick=closeReview;
 function updatePreview(){
  const obj=window.WhiteboardEquationFormatter?.createInline(input.value,groupBounds(group));apply.disabled=!obj;preview.hidden=!obj;if(obj)preview.src=obj.src;
  status.classList.toggle('handwriting-error',!obj&&!!input.value);
  status.textContent=obj?'Check the reading, then apply. Your handwriting stays until you confirm.':input.value?'Correct the numbers, operators or brackets to continue.':'Enter or correct the reading to continue.';
 }
 input.addEventListener('input',updatePreview);input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!apply.disabled){e.preventDefault();apply.click()}});
 apply.onclick=()=>{
  const obj=window.WhiteboardEquationFormatter?.createInline(input.value,groupBounds(group));if(!obj){updatePreview();return}
  if(!group.every(s=>strokes.includes(s))||JSON.stringify(group)!==original){status.textContent='This handwriting changed. Cancel and select it again.';apply.disabled=true;return}
  const before=clone(strokes),first=Math.min(...group.map(s=>strokes.indexOf(s))),set=new Set(group);
  obj.smartOriginal=clone(group);obj.handwritingBeautified=true;
  strokes=strokes.filter(s=>!set.has(s));strokes.splice(first,0,obj);window.WhiteboardMarqueeSelection?.clear();tool='select';closeReview();redraw();
  history.push({before,after:JSON.stringify(strokes)});if(history.length>30)history.shift();syncUi();sayLocal('Handwriting beautified · Undo restores the original writing');
 };
 actions.append(apply,cancel);panel.append(title,help,ink,label,input,status,preview,actions);backdrop.appendChild(panel);document.body.appendChild(backdrop);cancel.focus();
 await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 try{
  if(!window.WhiteboardHandwritingMath)throw Error('The handwriting reader is not ready. Refresh the page and try again.');
  const result=await window.WhiteboardHandwritingMath.recognize(group,cssW,cssH);
  if(session!==id||dialog!==backdrop)return;
  // Do not overwrite a correction entered while recognition was running.
  if(!input.value)input.value=result.text;updatePreview();input.focus();
  if(result.uncertain.length)status.textContent='Some characters were uncertain. Check and correct the reading before applying.';
 }catch(error){if(session!==id||dialog!==backdrop)return;status.textContent=error.message||'Could not read this writing. You can type the correct reading.';status.classList.add('handwriting-error');input.focus()}
}
function beginSelection(){
 closeReview();endSelection();window.WhiteboardMarqueeSelection?.clear();tool='select';syncUi();selecting=true;btn.classList.add('active');board.classList.add('handwriting-selecting');
 area=document.createElement('div');area.className='handwriting-chooser';const help=document.createElement('p');help.textContent='Drag a box around the handwriting to beautify · Esc to cancel';area.appendChild(help);board.appendChild(area);
}
btn.onclick=()=>{if(selecting){endSelection();return}const group=(window.WhiteboardMarqueeSelection?.get()||[]).filter(eligible);return group.length?review(group):beginSelection()};
function point(e){const r=canvas.getBoundingClientRect();return{x:clamp((e.clientX-r.left)/Math.max(1,r.width),0,1),y:clamp((e.clientY-r.top)/Math.max(1,r.height),0,1)}}
function paintSelection(e){const p=point(e),r=canvas.getBoundingClientRect(),b=board.getBoundingClientRect(),box=area.querySelector('.handwriting-selection-box');if(box)Object.assign(box.style,{left:(r.left-b.left+Math.min(p.x,start.x)*r.width)+'px',top:(r.top-b.top+Math.min(p.y,start.y)*r.height)+'px',width:(Math.abs(p.x-start.x)*r.width)+'px',height:(Math.abs(p.y-start.y)*r.height)+'px'})}
window.addEventListener('pointerdown',e=>{
 if(!selecting||e.target!==canvas||e.button!==0)return;stop(e);if(selectionPointer!==null)return;
 selectionPointer=e.pointerId;start=point(e);const box=document.createElement('div');box.className='handwriting-selection-box';area.appendChild(box);paintSelection(e);try{canvas.setPointerCapture(e.pointerId)}catch{}
},{capture:true,passive:false});
window.addEventListener('pointermove',e=>{if(!selecting||selectionPointer!==e.pointerId)return;stop(e);if(e.pointerType!=='touch'&&typeof e.buttons==='number'&&(e.buttons&1)===0){endSelection();return}paintSelection(e)},{capture:true,passive:false});
window.addEventListener('pointerup',e=>{
 if(!selecting||selectionPointer!==e.pointerId)return;stop(e);const p=point(e),r={x:Math.min(start.x,p.x),y:Math.min(start.y,p.y),w:Math.abs(start.x-p.x),h:Math.abs(start.y-p.y)};
 const group=strokes.filter(s=>{if(!eligible(s))return false;const b=groupBounds([s]);return b.x<=r.x+r.w&&b.x+b.w>=r.x&&b.y<=r.y+r.h&&b.y+b.h>=r.y});
 endSelection();try{canvas.releasePointerCapture(e.pointerId)}catch{}if(group.length)review(group);else sayLocal('No handwritten numbers found. Tap Beautify and select your writing.');
},{capture:true,passive:false});
window.addEventListener('pointercancel',e=>{if(selecting&&selectionPointer===e.pointerId){stop(e);endSelection()}},true);
window.addEventListener('lostpointercapture',e=>{if(selecting&&selectionPointer===e.pointerId)endSelection()},true);
window.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&(selecting||dialog)){stop(e);endSelection();closeReview();return}
 if(dialog&&(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&/INPUT|TEXTAREA/.test(document.activeElement?.tagName||'')){e.stopImmediatePropagation();return}
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&!/INPUT|TEXTAREA/.test(document.activeElement?.tagName||''))undoBeautify(e);
},true);
window.addEventListener('blur',()=>{if(selecting)endSelection()});
document.getElementById('undoBtn')?.addEventListener('click',undoBeautify,true);
const oldSync=syncUi;syncUi=function(){const result=oldSync.apply(this,arguments);if(availableUndo())document.getElementById('undoBtn').disabled=false;return result};
})();
