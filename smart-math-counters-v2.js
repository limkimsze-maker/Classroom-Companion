(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function'||typeof syncUi!=='function')return;

const edition=(new URLSearchParams(location.search).get('edition')||'en').toLowerCase();
const TXT={
 en:{counters:'Counters',active:'✨ Smart Math · Counters · Pen',title:'Counter colour',hint:'Choose this counter colour:',cancel:'Cancel',none:'That stroke was not recognised as a counter',made:'counter created',pen:'Draw a closed circle. It will become a counter automatically.'},
 zh:{counters:'计数片',active:'✨ 智能数学 · 计数片 · 画笔',title:'计数片颜色',hint:'选择这个计数片的颜色：',cancel:'取消',none:'该笔画未识别为计数片',made:'已创建计数片',pen:'画一个封闭圆形，它会自动变成计数片。'},
 ms:{counters:'Pembilang',active:'✨ Matematik Pintar · Pembilang · Pen',title:'Warna pembilang',hint:'Pilih warna pembilang ini:',cancel:'Batal',none:'Lakaran itu tidak dikenali sebagai pembilang',made:'pembilang dicipta',pen:'Lukis bulatan tertutup. Ia akan menjadi pembilang secara automatik.'},
 ta:{counters:'எண்ணிகள்',active:'✨ நுண்ணறிவு கணிதம் · எண்ணிகள் · பேனா',title:'எண்ணி நிறம்',hint:'இந்த எண்ணியின் நிறத்தைத் தேர்ந்தெடுக்கவும்:',cancel:'ரத்து',none:'அந்த வரைகோடு எண்ணியாக அடையாளம் காணப்படவில்லை',made:'எண்ணி உருவாக்கப்பட்டது',pen:'மூடிய வட்டம் வரையுங்கள். அது தானாக எண்ணியாக மாறும்.'}
};
const L=TXT[edition]||TXT.en;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const clone=v=>JSON.parse(JSON.stringify(v));
const uid=()=>`smc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
const COUNTER_PX=62;
const DEFAULT_FILL='#ffffff';
const COLOURS=[['#dc2626','Red'],['#2563eb','Blue'],['#facc15','Yellow'],['#15803d','Green'],['#7c3aed','Purple'],['#f97316','Orange'],['#17324d','Navy'],['#ffffff','White']];
let active=false,startIndex=0,timer=null,panel=null,lastHistory=null,baseLabel='',paletteTarget=null,hitCounterOnDown=false;

function notify(msg){if(typeof say==='function')say(msg);else{const t=document.getElementById('toast');if(t){t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1400)}}}
function box(s){let minX=1,minY=1,maxX=0,maxY=0;for(const p of s.points||[]){minX=Math.min(minX,p.x);minY=Math.min(minY,p.y);maxX=Math.max(maxX,p.x);maxY=Math.max(maxY,p.y)}return{x:minX,y:minY,w:Math.max(.001,maxX-minX),h:Math.max(.001,maxY-minY),cx:(minX+maxX)/2,cy:(minY+maxY)/2}}
function length(s){let n=0,p=s.points||[];for(let i=1;i<p.length;i++)n+=Math.hypot((p[i].x-p[i-1].x)*cssW,(p[i].y-p[i-1].y)*cssH);return n}
function closure(s){const p=s.points||[];if(p.length<2)return Infinity;return Math.hypot((p[0].x-p[p.length-1].x)*cssW,(p[0].y-p[p.length-1].y)*cssH)}
function rawInk(s){return !!(s&&Array.isArray(s.points)&&s.points.length&&!s.erase&&!s.smartGenerated&&!s.background)}
function looksLikeCounter(s){
 if(!rawInk(s))return false;
 const b=box(s),pw=b.w*cssW,ph=b.h*cssH;
 if(pw<9||ph<9||pw>190||ph>190)return false;
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
function showActiveLabel(){const sm=smartButton();if(!sm)return;if(!baseLabel)baseLabel=sm.textContent;sm.textContent=L.active;sm.title=L.active;sm.classList.add('active');sm.classList.remove('soft')}
function restoreLabel(){const sm=smartButton();if(!sm)return;sm.textContent=baseLabel||'✨ Smart Math';sm.title=sm.textContent;sm.classList.remove('active');sm.classList.add('soft')}
function forcePen(){try{tool='pen';syncUi();canvas.style.cursor='crosshair'}catch{}}
function deactivate(){active=false;clearTimeout(timer);closePanel();restoreLabel()}
function counterDims(){return{w:clamp(COUNTER_PX/Math.max(cssW,1),.025,.14),h:clamp(COUNTER_PX/Math.max(cssH,1),.03,.18)}}
function isCounter(s){return !!(s&&s.smartGenerated&&s.smartType==='counter'&&s.type==='image')}
function pointFromEvent(e){const r=canvas.getBoundingClientRect();return{x:clamp((e.clientX-r.left)/r.width,0,1),y:clamp((e.clientY-r.top)/r.height,0,1)}}
function hitCounterAt(e){const p=pointFromEvent(e);for(let i=strokes.length-1;i>=0;i--){const s=strokes[i];if(!isCounter(s))continue;if(p.x>=s.x&&p.x<=s.x+s.w&&p.y>=s.y&&p.y<=s.y+s.h)return s}return null}
function snapshot(){return clone(strokes)}
function record(before,ids){lastHistory={before,afterIds:[...ids]}}
function replaceStrokeWithCounter(s){
 const idx=strokes.indexOf(s);if(idx<0)return false;
 const b=box(s),before=snapshot(),d=counterDims();
 const obj={type:'image',src:dataSvg(DEFAULT_FILL),x:clamp(b.cx-d.w/2,0,1-d.w),y:clamp(b.cy-d.h/2,0,1-d.h),w:d.w,h:d.h,smartGenerated:true,smartType:'counter',smartId:uid(),counterFill:DEFAULT_FILL,smartOriginal:clone([s])};
 strokes.splice(idx,1,obj);record(before,[obj.smartId]);redraw();syncUi();startIndex=strokes.length;showActiveLabel();forcePen();notify(L.made);return true
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
function analyseNewest(){
 if(!active||panel)return;
 const recent=strokes.slice(startIndex).filter(rawInk);if(!recent.length)return;
 const s=recent[recent.length-1];
 if(!looksLikeCounter(s)){startIndex=strokes.length;notify(L.none);return}
 replaceStrokeWithCounter(s)
}

// Beta-only Counters mode: selecting it immediately returns the whiteboard to Pen.
document.addEventListener('click',e=>{
 const b=e.target?.closest?.('button');if(!b)return;const label=b.textContent.trim();
 if(label===L.counters){const sm=smartButton();if(!sm)return;e.preventDefault();e.stopImmediatePropagation();if(!baseLabel)baseLabel=sm.textContent;active=true;startIndex=strokes.length;closePanel();showActiveLabel();forcePen();notify(L.pen);return}
 if(active&&['Auto Detect','Fraction Bar','Bar Model','Number Line','Equation','3D Solid','Smart Math Off','自动识别','分数条','条形图','数轴','算式','3D 立体图形','关闭智能数学','Kesan Auto','Bar Pecahan','Model Bar','Garis Nombor','Persamaan','Pepejal 3D','Matematik Pintar Mati','தானாக கண்டறி','பின்னப் பட்டை','பார் மாதிரி','எண் கோடு','சமன்பாடு','3D திண்மம்','நுண்ணறிவு கணிதம் நிறுத்து'].includes(label)){deactivate()}
},true);

// While Counters mode is active, tapping an existing counter opens its colour chooser;
// tapping blank canvas still goes straight to Pen drawing.
canvas.addEventListener('pointerdown',e=>{if(!active||panel)return;const c=hitCounterAt(e);if(!c){hitCounterOnDown=false;return}hitCounterOnDown=true;e.preventDefault();e.stopImmediatePropagation();showColours(c)},true);
canvas.addEventListener('pointerup',e=>{if(!active||panel||hitCounterOnDown){hitCounterOnDown=false;return}clearTimeout(timer);timer=setTimeout(analyseNewest,180)},true);

document.addEventListener('keydown',e=>{if(e.key==='Escape'&&active){deactivate()}},true);

undoBtn.addEventListener('click',e=>{if(!lastHistory)return;const ids=new Set(lastHistory.afterIds),present=strokes.some(s=>ids.has(s.smartId));if(!present)return;e.preventDefault();e.stopImmediatePropagation();strokes=clone(lastHistory.before);lastHistory=null;redraw();syncUi();if(active){startIndex=strokes.length;showActiveLabel();forcePen()}notify('Smart Math counters undone')},true);
})();
