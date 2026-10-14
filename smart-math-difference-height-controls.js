(function(){
'use strict';
if(typeof strokes==='undefined'||typeof redraw!=='function'||typeof syncUi!=='function'||typeof canvas==='undefined')return;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const STEP=6,MAX=60;
let selectedId=null,panel=null;
function comparisons(){return strokes.filter(s=>s&&s.smartType==='barModel'&&s.smartBarType==='comparison'&&Number(s.barCount)===2&&Array.isArray(s.userDrawnBrackets)&&s.userDrawnBrackets.some(b=>b&&b.isDifference&&b.visible!==false))}
function current(){const all=comparisons();if(!all.length)return null;let obj=all.find(s=>s.smartId===selectedId);if(!obj){obj=all[all.length-1];selectedId=obj.smartId}return obj}
function diffFor(obj){return obj?.userDrawnBrackets?.find(b=>b&&b.isDifference&&b.visible!==false)||null}
function notify(msg){if(typeof say==='function')say(msg)}
function makeBtn(text){const b=document.createElement('button');b.type='button';b.className='btn';b.textContent=text;b.style.cssText='min-height:32px;padding:5px 9px;font-size:11px;font-weight:900';return b}
function ensurePanel(){
 if(panel)return panel;
 panel=document.createElement('div');panel.id='differenceHeightControls';panel.style.cssText='position:fixed;right:14px;bottom:14px;z-index:10080;display:none;align-items:center;gap:6px;padding:8px 9px;background:rgba(255,255,255,.96);border:1px solid #cfd9de;border-radius:12px;box-shadow:0 8px 24px rgba(23,50,77,.18);backdrop-filter:blur(5px)';
 const label=document.createElement('span');label.textContent='Difference bracket height';label.style.cssText='font:900 11px Inter,system-ui,sans-serif;color:#17324d;margin-right:2px';
 const up=makeBtn('↑ Up'),down=makeBtn('↓ Down'),reset=makeBtn('Reset');reset.classList.add('soft');
 function change(delta){const obj=current(),d=diffFor(obj);if(!obj||!d)return;window.__smartBarLastHistory={before:JSON.parse(JSON.stringify(strokes)),afterId:obj.smartId};d.manualVerticalOffsetPx=clamp(Number(d.manualVerticalOffsetPx||0)+delta,-MAX,MAX);redraw();syncUi();notify(delta<0?'Difference bracket moved up':'Difference bracket moved down')}
 up.onclick=e=>{e.preventDefault();e.stopPropagation();change(-STEP)};
 down.onclick=e=>{e.preventDefault();e.stopPropagation();change(STEP)};
 reset.onclick=e=>{e.preventDefault();e.stopPropagation();const obj=current(),d=diffFor(obj);if(!obj||!d)return;window.__smartBarLastHistory={before:JSON.parse(JSON.stringify(strokes)),afterId:obj.smartId};d.manualVerticalOffsetPx=0;redraw();syncUi();notify('Difference bracket height reset')};
 panel.append(label,up,down,reset);document.body.appendChild(panel);return panel
}
function refresh(){const p=ensurePanel(),obj=current();p.style.display=obj?'flex':'none'}
function hitComparison(clientX,clientY){const r=canvas.getBoundingClientRect(),x=(clientX-r.left)/Math.max(1,r.width),y=(clientY-r.top)/Math.max(1,r.height);for(let i=strokes.length-1;i>=0;i--){const s=strokes[i];if(!s||s.smartType!=='barModel'||s.smartBarType!=='comparison')continue;if(x>=s.x&&x<=s.x+s.w&&y>=s.y&&y<=s.y+s.h)return s}return null}
canvas.addEventListener('pointerdown',e=>{const obj=hitComparison(e.clientX,e.clientY);if(obj){selectedId=obj.smartId;refresh()}},true);
const priorRedraw=redraw;redraw=function(){priorRedraw();refresh()};
setTimeout(()=>{try{refresh();redraw()}catch{}},0);
})();
