(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function'||typeof syncUi!=='function')return;

const edition=(new URLSearchParams(location.search).get('edition')||'en').toLowerCase();
const TXT={
 en:{counters:'Counters',active:'✨ Smart Math · Counters · Pen',title:'Counter colour',hint:'Choose this counter colour:',cancel:'Cancel',none:'No counter-shaped sketch found. Draw a rough circle anytime, then press Finished counters?',made:'counter created',finish:'✓ Finished counters?',pen:'Draw circles anytime—even before choosing Counters—then click “Finished counters?”. Small gaps are fine.'},
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
let active=false,panel=null,lastHistory=null,baseLabel='',paletteTarget=null,hitCounterOnDown=false,finishBtn=null;

function notify(msg){if(typeof say==='function')say(msg);else{const t=document.getElementById('toast');if(t){t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1400)}}}
function box(s){let minX=1,minY=1,maxX=0,maxY=0;for(const p of s.points||[]){minX=Math.min(minX,p.x);minY=Math.min(minY,p.y);maxX=Math.max(maxX,p.x);maxY=Math.max(maxY,p.y)}return{x:minX,y:minY,w:Math.max(.001,maxX-minX),h:Math.max(.001,maxY-minY),cx:(minX+maxX)/2,cy:(minY+maxY)/2}}
function length(s){let n=0,p=s.points||[];for(let i=1;i<p.length;i++)n+=Math.hypot((p[i].x-p[i-1].x)*cssW,(p[i].y-p[i-1].y)*cssH);return n}
function closure(s){const p=s.points||[];if(p.length<2)return Infinity;return Math.hypot((p[0].x-p[p.length-1].x)*cssW,(p[0].y-p[p.length-1].y)*cssH)}
function rawInk(s){return !!(s&&Array.isArray(s.points)&&s.points.length&&!s.erase&&!s.smartGenerated&&!s.background)}
// A Counter is an explicitly requested manipulative, not a handwriting exam.
// Accept hand-drawn ovals, slightly open loops, and joined partial arcs.
// Strict enough to ignore dots, straight lines and unrelated marks.
function groupBox(group){
 let minX=1,minY=1,maxX=0,maxY=0;
 for(const s of group)for(const p of s.points||[]){
  minX=Math.min(minX,p.x);minY=Math.min(minY,p.y);
  maxX=Math.max(maxX,p.x);maxY=Math.max(maxY,p.y);
 }
 return{x:minX,y:minY,w:Math.max(.001,maxX-minX),h:Math.max(.001,maxY-minY),
  cx:(minX+maxX)/2,cy:(minY+maxY)/2};
}
function looksLikeLoop(group){
 if(!group.length||group.some(s=>!rawInk(s)))return false;
 const b=groupBox(group),w=b.w*cssW,h=b.h*cssH,diag=Math.hypot(w,h);
 // Accept pupil-sized loops up to a generous teaching demonstration size.
 if(w<13||h<13||w>Math.min(740,cssW*.78)||h>Math.min(740,cssH*.78))return false;
 if(Math.min(w,h)/Math.max(w,h)<.23)return false;
 let lengthPx=0,sectors=new Set();
 for(const stroke of group){
  const pts=stroke.points||[];
  lengthPx+=length(stroke);
  for(const p of pts){
   const dx=(p.x-b.cx)/Math.max(.0005,b.w/2),dy=(p.y-b.cy)/Math.max(.0005,b.h/2);
   if(Math.hypot(dx,dy)<.42)continue; // ignore small internal pen marks
   let angle=Math.atan2(dy,dx);
   if(angle<0)angle+=2*Math.PI;
   sectors.add(Math.min(7,Math.floor(angle/(2*Math.PI)*8)));
  }
 }
 // Circumferential coverage tolerates gaps without treating a plain line as a loop.
 return sectors.size>=5&&lengthPx>=diag*1.10;
}
function looksLikeCounter(s){
 if(!looksLikeLoop([s]))return false;
 const b=box(s),diag=Math.hypot(b.w*cssW,b.h*cssH);
 // A lone semicircle is an incomplete counter. Keep it available for
 // joining with the other arc instead of prematurely making two counters.
 return closure(s)<=diag*.86;
}
// A teacher may draw circles BEFORE choosing Smart Math → Counters, after
// choosing it, or in multiple separate drawing sessions. Recognition must
// examine all currently visible raw ink, rather than only new session strokes.
// Existing Smart Math objects are excluded by rawInk() and stay untouched.
function candidateInk(){return strokes.filter(rawInk)}
function connectedArcs(a,b){
 const x=box(a),y=box(b),padX=12/Math.max(1,cssW),padY=12/Math.max(1,cssH);
 if(x.x>y.x+y.w+padX||y.x>x.x+x.w+padX||
    x.y>y.y+y.h+padY||y.y>x.y+x.h+padY)return false;
 const ea=[a.points[0],a.points[a.points.length-1]];
 const eb=[b.points[0],b.points[b.points.length-1]];
 return ea.some(p=>eb.some(q=>Math.hypot((p.x-q.x)*cssW,(p.y-q.y)*cssH)<=29));
}
function counterGroups(ink){
 const groups=[],remaining=[];
 for(const s of ink){
  if(looksLikeCounter(s))groups.push([s]);
  else remaining.push(s);
 }
 // Allow a circle sketched in two or three arcs. Join only nearby endpoints,
 // never unrelated circles separated on the whiteboard.
 const visited=new Set();
 for(const item of remaining){
  if(visited.has(item))continue;
  const cluster=[item];visited.add(item);
  for(let j=0;j<cluster.length&&cluster.length<5;j++){
   for(const other of remaining){
    if(visited.has(other)||cluster.length>=5)continue;
    if(connectedArcs(cluster[j],other)){cluster.push(other);visited.add(other)}
   }
  }
  if(cluster.length>1&&looksLikeLoop(cluster))groups.push(cluster);
 }
 return groups;
}
function dataSvg(fill){const stroke=fill==='#17324d'?'#0b1f33':'#17324d';const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" fill="${fill}" stroke="${stroke}" stroke-width="7"/></svg>`;return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)}
function closePanel(){panel?.remove();panel=null;paletteTarget=null}
function smartButton(){return document.getElementById('smartMathBtn')}
function showActiveLabel(){const sm=smartButton();if(!sm)return;if(!baseLabel)baseLabel=sm.textContent;sm.textContent=L.active;sm.title=L.active;sm.classList.add('active');sm.classList.remove('soft');if(finishBtn)finishBtn.style.display='inline-flex'}
function restoreLabel(){const sm=smartButton();if(!sm)return;sm.textContent=baseLabel||'✨ Smart Math';sm.title=sm.textContent;sm.classList.remove('active');sm.classList.add('soft');if(finishBtn)finishBtn.style.display='none'}
function forcePen(){try{tool='pen';syncUi();canvas.style.cursor='crosshair'}catch{}}
function deactivate(){active=false;closePanel();restoreLabel()}
function counterDims(){return{w:clamp(COUNTER_PX/Math.max(cssW,1),.025,.14),h:clamp(COUNTER_PX/Math.max(cssH,1),.03,.18)}}
function isCounter(s){return !!(s&&s.smartGenerated&&s.smartType==='counter'&&s.type==='image')}
function pointFromEvent(e){const r=canvas.getBoundingClientRect();return{x:clamp((e.clientX-r.left)/r.width,0,1),y:clamp((e.clientY-r.top)/r.height,0,1)}}
function hitCounterAt(e){const p=pointFromEvent(e);for(let i=strokes.length-1;i>=0;i--){const s=strokes[i];if(!isCounter(s))continue;if(p.x>=s.x&&p.x<=s.x+s.w&&p.y>=s.y&&p.y<=s.y+s.h)return s}return null}
function snapshot(){return clone(strokes)}
function record(before,ids){lastHistory={before,afterIds:[...ids]}}
// Preserve the original counter geometry, SVG, colours and transform contract.
// Only the commit point changes: all rough circles are processed together.
function counterFromGroup(group){
 const b=groupBox(group),d=counterDims();
 return{type:'image',src:dataSvg(DEFAULT_FILL),x:clamp(b.cx-d.w/2,0,1-d.w),y:clamp(b.cy-d.h/2,0,1-d.h),w:d.w,h:d.h,smartGenerated:true,smartType:'counter',smartId:uid(),counterFill:DEFAULT_FILL,smartOriginal:clone(group)};
}
function finishCounters(){
 if(!active)return false;
 const sketched=candidateInk(),groups=counterGroups(sketched);
 if(!groups.length){notify(L.none);showActiveLabel();forcePen();return false}
 const before=snapshot(),converted=new Map(),created=[];
 for(const group of groups){
  const obj=counterFromGroup(group);created.push(obj);
  group.forEach((s,i)=>converted.set(s,i===0?obj:null));
 }
 // Commit all counters at once. Ignore isolated dots and preserve every
 // unrecognised mark exactly as drawn; never delete pre-existing objects.
 strokes=strokes.flatMap(s=>converted.has(s)?(converted.get(s)?[converted.get(s)]:[]):[s]);
 record(before,created.map(o=>o.smartId));
 redraw();deactivate();
 try{tool='select';syncUi()}catch{}
 notify(created.length===1?L.made:(edition==='en'?`${created.length} counters created`:`${created.length} ${L.made}`));
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
 if(!target||!/^#[0-9a-f]{6}$/i.test(fill))return false;
 const obj=strokes.find(s=>isCounter(s)&&s.smartId===target.smartId);
 if(!obj)return false;
 if(obj.counterFill?.toLowerCase()===fill.toLowerCase()){closePanel();return true}
 const before=snapshot();
 obj.src=dataSvg(fill);obj.counterFill=fill.toLowerCase();
 record(before,[obj.smartId]);closePanel();redraw();syncUi();
 // Outside Counters drawing mode, stay in Select so teachers can
 // recolour several finished counters without re-entering Pen mode.
 if(active){showActiveLabel();forcePen()}
 notify('Counter colour updated');
 return true;
}
function showColours(target){
 closePanel();paletteTarget=target;panel=document.createElement('div');panel.id='ccCounterColourPalette';panel.setAttribute('role','dialog');panel.setAttribute('aria-label',L.title);Object.assign(panel.style,{position:'fixed',zIndex:'10050',left:'50%',top:'16%',transform:'translateX(-50%)',background:'#fff',border:'1px solid #cfd9de',borderRadius:'14px',padding:'12px',boxShadow:'0 12px 32px rgba(18,32,46,.2)',minWidth:'250px'});
 const h=document.createElement('div');h.textContent=L.title;h.style.cssText='font-weight:950;font-size:14px;margin-bottom:4px;color:#17324d';
 const hint=document.createElement('div');hint.textContent=L.hint;hint.style.cssText='font-size:11px;color:#667085;margin-bottom:10px';panel.append(h,hint);
 const row=document.createElement('div');row.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px';
 for(const [hex,name] of COLOURS){const b=document.createElement('button');b.type='button';b.title=name;b.setAttribute('aria-label',name);Object.assign(b.style,{width:'36px',height:'36px',borderRadius:'50%',background:hex,border:'3px solid #fff',boxShadow:'0 0 0 1px #aab6bf',cursor:'pointer'});b.onclick=()=>recolourCounter(target,hex);row.appendChild(b)}
 panel.appendChild(row);
 const label=document.createElement('label');
 label.style.cssText='display:flex;align-items:center;gap:9px;margin:4px 0 12px;font:750 12px system-ui;color:#17324d';
 label.textContent='🎨 Custom colour';
 const picker=document.createElement('input');picker.type='color';
 picker.value=/^#[0-9a-f]{6}$/i.test(target.counterFill||'')?target.counterFill:DEFAULT_FILL;
 picker.setAttribute('aria-label','Choose any counter colour');
 picker.style.cssText='width:54px;height:38px;padding:2px;border:1px solid #a6b6bf;border-radius:9px;background:white;cursor:pointer';
 picker.addEventListener('change',()=>recolourCounter(target,picker.value));
 label.appendChild(picker);panel.appendChild(label);
 const cancel=document.createElement('button');cancel.className='btn';cancel.textContent=L.cancel;
 cancel.onclick=()=>{closePanel();if(active){showActiveLabel();forcePen()}};
 panel.appendChild(cancel);document.body.appendChild(panel)
}
// Counters now use the same draw → Finished workflow as bars and fractions.
// In particular there is no conversion timer on pointerup.

// Selecting Counters immediately returns the whiteboard to Pen.
document.addEventListener('click',e=>{
 const b=e.target?.closest?.('button');if(!b)return;const label=b.textContent.trim();
 if(label===L.counters){
  const sm=smartButton();if(!sm)return;
  e.preventDefault();e.stopImmediatePropagation();
  // The menu's native onclick was intentionally intercepted, so dismiss it.
  if(b.parentElement?.style)b.parentElement.style.display='none';
  // Bar Models may leave their finish button armed across mode switches.
  // Release that previous *workflow*, without modifying its recognition code.
  if(window.__smartBarType){
   try{document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))}catch(_){}
   window.__smartBarType='';
  }
  if(!baseLabel)baseLabel=sm.textContent;
  window.ClassroomSmartMath?.setMode('off');
  active=true;closePanel();showActiveLabel();forcePen();notify(L.pen);return
 }
 if(active&&['Auto Detect','Fraction Bar','Bar Model','Number Line','Equation','3D Solid','Smart Math Off','自动识别','分数条','条形图','数轴','算式','3D 立体图形','关闭智能数学','Kesan Auto','Bar Pecahan','Model Bar','Garis Nombor','Persamaan','Pepejal 3D','Matematik Pintar Mati','தானாக கண்டறி','பின்னப் பட்டை','பார் மாதிரி','எண் கோடு','சமன்பாடு','3D திண்மம்','நுண்ணறிவு கணிதம் நிறுத்து'].includes(label)){deactivate()}
},true);

// While Counters mode is active, tapping an existing counter opens its colour chooser;
// tapping blank canvas still goes straight to Pen drawing.
canvas.addEventListener('pointerdown',e=>{if(!active||panel)return;const c=hitCounterAt(e);if(!c){hitCounterOnDown=false;return}hitCounterOnDown=true;e.preventDefault();e.stopImmediatePropagation();showColours(c)},true);
canvas.addEventListener('pointerup',()=>{hitCounterOnDown=false},true);

makeFinishButton();
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&active){deactivate()}},true);

undoBtn.addEventListener('click',e=>{if(!lastHistory)return;const ids=new Set(lastHistory.afterIds),present=strokes.some(s=>ids.has(s.smartId));if(!present)return;e.preventDefault();e.stopImmediatePropagation();strokes=clone(lastHistory.before);lastHistory=null;redraw();syncUi();if(active){showActiveLabel();forcePen()}notify('Smart Math counters undone')},true);
window.ClassroomCountersWorkflow={
 isActive:()=>active,
 pending:()=>active?candidateInk().length:0,
 finish:()=>finishCounters(),
 getFinishButton:()=>finishBtn,
 openColours:(id)=>{
  const target=strokes.find(s=>isCounter(s)&&s.smartId===id);
  if(!target)return false;
  showColours(target);return true
 },
 recolour:(id,fill)=>{
  const target=strokes.find(s=>isCounter(s)&&s.smartId===id);
  return recolourCounter(target,fill)
 }
};
})();
