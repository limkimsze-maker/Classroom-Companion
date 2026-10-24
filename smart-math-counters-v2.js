(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function'||typeof syncUi!=='function')return;

const edition=(new URLSearchParams(location.search).get('edition')||'en').toLowerCase();
const TXT={
 en:{counters:'Counters',active:'✨ Smart Math · Counters · Pen',title:'Counter colour',hint:'Choose this counter colour:',cancel:'Cancel',none:'That stroke was not recognised as a counter',made:'counter created',finish:'✓ Finished counters?',pen:'Draw one or more closed circles, then click “Finished counters?”.'},
 zh:{counters:'计数片',active:'✨ 智能数学 · 计数片 · 画笔',title:'计数片颜色',hint:'选择这个计数片的颜色：',cancel:'取消',none:'该笔画未识别为计数片',made:'已创建计数片',finish:'✓ 计数片画完了吗？',pen:'画好一个或多个封闭圆形后，点击“计数片画完了吗？”。'},
 ms:{counters:'Pembilang',active:'✨ Matematik Pintar · Pembilang · Pen',title:'Warna pembilang',hint:'Pilih warna pembilang ini:',cancel:'Batal',none:'Lakaran itu tidak dikenali sebagai pembilang',made:'pembilang dicipta',finish:'✓ Siap pembilang?',pen:'Lukis satu atau lebih bulatan, kemudian klik “Siap pembilang?”.'},
 ta:{counters:'எண்ணிகள்',active:'✨ நுண்ணறிவு கணிதம் · எண்ணிகள் · பேனா',title:'எண்ணி நிறம்',hint:'இந்த எண்ணியின் நிறத்தைத் தேர்ந்தெடுக்கவும்:',cancel:'ரத்து',none:'அந்த வரைகோடு எண்ணியாக அடையாளம் காணப்படவில்லை',made:'எண்ணி உருவாக்கப்பட்டது',finish:'✓ எண்ணிகள் முடிந்ததா?',pen:'ஒன்று அல்லது பல மூடிய வட்டங்களை வரைந்து, பின்னர் “எண்ணிகள் முடிந்ததா?” என்பதை அழுத்துங்கள்.'}
};
const L=TXT[edition]||TXT.en;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const clone=v=>JSON.parse(JSON.stringify(v));
const uid=()=>`smc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
const COUNTER_PX=62;
const DEFAULT_FILL='#ffffff';
const COLOURS=[['#dc2626','Red'],['#2563eb','Blue'],['#facc15','Yellow'],['#15803d','Green'],['#7c3aed','Purple'],['#f97316','Orange'],['#17324d','Navy'],['#ffffff','White']];
let active=false,startIndex=0,panel=null,lastHistory=null,baseLabel='',paletteTarget=null,hitCounterOnDown=false,finishBtn=null;

function notify(msg){if(typeof say==='function')say(msg);else{const t=document.getElementById('toast');if(t){t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1400)}}}
function box(s){let minX=1,minY=1,maxX=0,maxY=0;for(const p of s.points||[]){minX=Math.min(minX,p.x);minY=Math.min(minY,p.y);maxX=Math.max(maxX,p.x);maxY=Math.max(maxY,p.y)}return{x:minX,y:minY,w:Math.max(.001,maxX-minX),h:Math.max(.001,maxY-minY),cx:(minX+maxX)/2,cy:(minY+maxY)/2}}
function length(s){let n=0,p=s.points||[];for(let i=1;i<p.length;i++)n+=Math.hypot((p[i].x-p[i-1].x)*cssW,(p[i].y-p[i-1].y)*cssH);return n}
function closure(s){const p=s.points||[];if(p.length<2)return Infinity;return Math.hypot((p[0].x-p[p.length-1].x)*cssW,(p[0].y-p[p.length-1].y)*cssH)}
function rawInk(s){return !!(s&&Array.isArray(s.points)&&s.points.length&&!s.erase&&!s.smartGenerated&&!s.background)}
function looksLikeCounter(s){
 if(!rawInk(s))return false;
 const b=box(s),pw=b.w*cssW,ph=b.h*cssH;
 // In explicit Counters mode, drawn size should not determine counter size.
 // Accept a much larger rough circle, then normalise it to the fixed counter size.
 if(pw<9||ph<9||pw>420||ph>420)return false;
 const aspect=Math.min(pw,ph)/Math.max(pw,ph);
 if(aspect<.30)return false;
 const diag=Math.hypot(pw,ph),close=closure(s),len=length(s);
 if(close>Math.max(32,diag*.68))return false;
 if(len<diag*1.18)return false;
 return true;
}
function dataSvg(fill){const stroke=fill==='#17324d'?'#0b1f33':'#17324d';const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" fill="${fill}" stroke="${stroke}" stroke-width="7"/></svg>`;return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)}
function closePanel(){panel?.remove();panel=null;paletteTarget=null}
function smartButton(){return document.getElementById('smartMathBtn')}
function showActiveLabel(){const sm=smartButton();if(!sm)return;if(!baseLabel)baseLabel=sm.textContent;sm.textContent=L.active;sm.title=L.active;sm.classList.add('active');sm.classList.remove('soft');if(finishBtn)finishBtn.style.display='inline-flex'}
function restoreLabel(){const sm=smartButton();if(!sm)return;sm.textContent=baseLabel||'✨ Smart Math';sm.title=sm.textContent;sm.classList.remove('active');sm.classList.add('soft');if(finishBtn)finishBtn.style.display='none'}
function forcePen(){try{tool='pen';syncUi();canvas.style.cursor='crosshair'}catch{}}
function deactivate(){active=false;closePanel();restoreLabel();startIndex=strokes.length}
function counterDims(){return{w:clamp(COUNTER_PX/Math.max(cssW,1),.025,.14),h:clamp(COUNTER_PX/Math.max(cssH,1),.03,.18)}}
function isCounter(s){return !!(s&&s.smartGenerated&&s.smartType==='counter'&&s.type==='image')}
function pointFromEvent(e){const r=canvas.getBoundingClientRect();return{x:clamp((e.clientX-r.left)/r.width,0,1),y:clamp((e.clientY-r.top)/r.height,0,1)}}
function hitCounterAt(e){const p=pointFromEvent(e);for(let i=strokes.length-1;i>=0;i--){const s=strokes[i];if(!isCounter(s))continue;if(p.x>=s.x&&p.x<=s.x+s.w&&p.y>=s.y&&p.y<=s.y+s.h)return s}return null}
function snapshot(){return clone(strokes)}
function record(before,ids){lastHistory={before,afterIds:[...ids]}}
// Preserve the original counter geometry, SVG, colours and transform contract.
// Only the commit point changes: all rough circles are processed together.
function counterFromStroke(s){
 const b=box(s),d=counterDims();
 return{type:'image',src:dataSvg(DEFAULT_FILL),x:clamp(b.cx-d.w/2,0,1-d.w),y:clamp(b.cy-d.h/2,0,1-d.h),w:d.w,h:d.h,smartGenerated:true,smartType:'counter',smartId:uid(),counterFill:DEFAULT_FILL,smartOriginal:clone([s])};
}
function finishCounters(){
 if(!active)return false;
 const sketched=strokes.slice(startIndex).filter(rawInk);
 const valid=sketched.filter(looksLikeCounter);
 if(!valid.length){notify(L.none);showActiveLabel();forcePen();return false}
 const before=snapshot(),converted=new Map(valid.map(s=>[s,counterFromStroke(s)]));
 // Keep everything that isn't a recognisable counter, including pupils'
 // annotations and any rough/unfinished strokes. Never erase failed ink.
 strokes=strokes.map(s=>converted.get(s)||s);
 record(before,[...converted.values()].map(o=>o.smartId));
 redraw();deactivate();
 try{tool='select';syncUi()}catch{}
 notify(valid.length===1?L.made:(edition==='en'?`${valid.length} counters created`:`${valid.length} ${L.made}`));
 return true;
}
function makeFinishButton(){
 if(finishBtn)return;
 const sm=smartButton();if(!sm)return;
 finishBtn=document.createElement('button');
 finishBtn.id='smartCounterFinishBtn';finishBtn.type='button';finishBtn.className='btn soft';
 finishBtn.textContent=L.finish;finishBtn.setAttribute('aria-label',L.finish);finishBtn.title=L.finish;
 finishBtn.style.cssText='display:none;min-height:32px;padding:5px 9px;font-size:11px;border-style:dashed';
 sm.insertAdjacentElement('afterend',finishBtn);
 finishBtn.addEventListener('click',e=>{
  e.preventDefault();e.stopImmediatePropagation();finishCounters();
 },true);
}
function recolourCounter(target,fill){
 if(!target)return;const before=snapshot();target.src=dataSvg(fill);target.counterFill=fill;record(before,[target.smartId]);closePanel();redraw();syncUi();showActiveLabel();forcePen()
}
function showColours(target){
 closePanel();paletteTarget=target;panel=document.createElement('div');Object.assign(panel.style,{position:'fixed',zIndex:'10050',left:'50%',top:'16%',transform:'translateX(-50%)',background:'#fff',border:'1px solid #cfd9de',borderRadius:'14px',padding:'12px',boxShadow:'0 12px 32px rgba(18,32,46,.2)',minWidth:'250px'});
 const h=document.createElement('div');h.textContent=L.title;h.style.cssText='font-weight:950;font-size:14px;margin-bottom:4px;color:#17324d';
 const hint=document.createElement('div');hint.textContent=L.hint;hint.style.cssText='font-size:11px;color:#667085;margin-bottom:10px';panel.append(h,hint);
 const row=document.createElement('div');row.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px';
 for(const [hex,name] of COLOURS){const b=document.createElement('button');b.type='button';b.title=name;b.setAttribute('aria-label',name);Object.assign(b.style,{width:'36px',height:'36px',borderRadius:'50%',background:hex,border:'3px solid #fff',boxShadow:'0 0 0 1px #aab6bf',cursor:'pointer'});b.onclick=()=>recolourCounter(target,hex);row.appendChild(b)}
 panel.appendChild(row);const cancel=document.createElement('button');cancel.className='btn';cancel.textContent=L.cancel;cancel.onclick=()=>{closePanel();showActiveLabel();forcePen()};panel.appendChild(cancel);document.body.appendChild(panel)
}
// Counters now use the same draw → Finished workflow as bars and fractions.
// In particular there is no conversion timer on pointerup.

// Selecting Counters immediately returns the whiteboard to Pen.
document.addEventListener('click',e=>{
 const b=e.target?.closest?.('button');if(!b)return;const label=b.textContent.trim();
 if(label===L.counters){const sm=smartButton();if(!sm)return;e.preventDefault();e.stopImmediatePropagation();if(!baseLabel)baseLabel=sm.textContent;window.ClassroomSmartMath?.setMode('off');active=true;startIndex=strokes.length;closePanel();showActiveLabel();forcePen();notify(L.pen);return}
 if(active&&['Auto Detect','Fraction Bar','Bar Model','Number Line','Equation','3D Solid','Smart Math Off','自动识别','分数条','条形图','数轴','算式','3D 立体图形','关闭智能数学','Kesan Auto','Bar Pecahan','Model Bar','Garis Nombor','Persamaan','Pepejal 3D','Matematik Pintar Mati','தானாக கண்டறி','பின்னப் பட்டை','பார் மாதிரி','எண் கோடு','சமன்பாடு','3D திண்மம்','நுண்ணறிவு கணிதம் நிறுத்து'].includes(label)){deactivate()}
},true);

// While Counters mode is active, tapping an existing counter opens its colour chooser;
// tapping blank canvas still goes straight to Pen drawing.
canvas.addEventListener('pointerdown',e=>{if(!active||panel)return;const c=hitCounterAt(e);if(!c){hitCounterOnDown=false;return}hitCounterOnDown=true;e.preventDefault();e.stopImmediatePropagation();showColours(c)},true);
canvas.addEventListener('pointerup',()=>{hitCounterOnDown=false},true);

makeFinishButton();
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&active){deactivate()}},true);

undoBtn.addEventListener('click',e=>{if(!lastHistory)return;const ids=new Set(lastHistory.afterIds),present=strokes.some(s=>ids.has(s.smartId));if(!present)return;e.preventDefault();e.stopImmediatePropagation();strokes=clone(lastHistory.before);lastHistory=null;redraw();syncUi();if(active){startIndex=strokes.length;showActiveLabel();forcePen()}notify('Smart Math counters undone')},true);
window.ClassroomCountersWorkflow={isActive:()=>active,pending:()=>active?strokes.slice(startIndex).filter(rawInk).length:0,finish:()=>finishCounters(),getFinishButton:()=>finishBtn};
})();
