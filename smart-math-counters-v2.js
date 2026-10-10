(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function'||typeof syncUi!=='function')return;

const edition=(new URLSearchParams(location.search).get('edition')||'en').toLowerCase();
const TXT={
 en:{counters:'Counters',title:'Counter colour',hint:'Detected counters. Choose their colour:',cancel:'Cancel',none:'No clear counter group yet',made:'circular counters created'},
 zh:{counters:'计数片',title:'计数片颜色',hint:'已识别计数片。请选择颜色：',cancel:'取消',none:'暂未识别到清晰的计数片组',made:'已创建圆形计数片'},
 ms:{counters:'Pembilang',title:'Warna pembilang',hint:'Pembilang dikesan. Pilih warnanya:',cancel:'Batal',none:'Belum ada kumpulan pembilang yang jelas',made:'pembilang bulat dicipta'},
 ta:{counters:'எண்ணிகள்',title:'எண்ணி நிறம்',hint:'எண்ணிகள் கண்டறியப்பட்டன. நிறத்தைத் தேர்ந்தெடுக்கவும்:',cancel:'ரத்து',none:'தெளிவான எண்ணி குழு இன்னும் இல்லை',made:'வட்ட எண்ணிகள் உருவாக்கப்பட்டன'}
};
const L=TXT[edition]||TXT.en;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const clone=v=>JSON.parse(JSON.stringify(v));
const uid=()=>`smc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
let active=false,startIndex=0,timer=null,panel=null,lastHistory=null;

function notify(msg){if(typeof say==='function')say(msg);else{const t=document.getElementById('toast');if(t){t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1400)}}}
function box(s){let minX=1,minY=1,maxX=0,maxY=0;for(const p of s.points||[]){minX=Math.min(minX,p.x);minY=Math.min(minY,p.y);maxX=Math.max(maxX,p.x);maxY=Math.max(maxY,p.y)}return{x:minX,y:minY,w:Math.max(.001,maxX-minX),h:Math.max(.001,maxY-minY),cx:(minX+maxX)/2,cy:(minY+maxY)/2}}
function length(s){let n=0,p=s.points||[];for(let i=1;i<p.length;i++)n+=Math.hypot((p[i].x-p[i-1].x)*cssW,(p[i].y-p[i-1].y)*cssH);return n}
function closure(s){const p=s.points||[];if(p.length<2)return Infinity;return Math.hypot((p[0].x-p[p.length-1].x)*cssW,(p[0].y-p[p.length-1].y)*cssH)}
function rawInk(s){return !!(s&&Array.isArray(s.points)&&s.points.length&&!s.erase&&!s.smartGenerated&&!s.background)}
function looksLikeCounter(s){if(!rawInk(s))return false;const b=box(s),pw=b.w*cssW,ph=b.h*cssH;if(pw<8||ph<8||pw>145||ph>145)return false;const aspect=Math.min(pw,ph)/Math.max(pw,ph);if(aspect<.34)return false;const diag=Math.hypot(pw,ph),close=closure(s);if(close>Math.max(22,diag*.58))return false;if(length(s)<diag*1.45)return false;return true}
function candidates(){return strokes.slice(startIndex).filter(looksLikeCounter).slice(0,20)}
function median(a){const x=[...a].sort((p,q)=>p-q),m=Math.floor(x.length/2);return x.length%2?x[m]:(x[m-1]+x[m])/2}
function dataSvg(fill){const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" fill="${fill}" stroke="#17324d" stroke-width="7"/></svg>`;return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)}
function closePanel(){panel?.remove();panel=null}
function createCounters(group,fill){closePanel();const before=clone(strokes),set=new Set(group),bs=group.map(box),diamPx=median(bs.map(b=>(b.w*cssW+b.h*cssH)/2)),w=clamp(diamPx/cssW,.028,.13),h=clamp(diamPx/cssH,.035,.16);strokes=strokes.filter(s=>!set.has(s));for(const b of bs){strokes.push({type:'image',src:dataSvg(fill),x:clamp(b.cx-w/2,0,1-w),y:clamp(b.cy-h/2,0,1-h),w,h,smartGenerated:true,smartType:'counter',smartId:uid(),smartOriginal:clone(group)})}lastHistory={before,afterIds:strokes.filter(s=>s.smartId?.startsWith('smc-')).map(s=>s.smartId)};active=false;redraw();syncUi();try{tool='select';syncUi()}catch{};notify(`${group.length} ${L.made}`)}
function showColours(group){closePanel();panel=document.createElement('div');Object.assign(panel.style,{position:'fixed',zIndex:'10050',left:'50%',top:'18%',transform:'translateX(-50%)',background:'#fff',border:'1px solid #cfd9de',borderRadius:'14px',padding:'12px',boxShadow:'0 12px 32px rgba(18,32,46,.2)',minWidth:'250px'});const h=document.createElement('div');h.textContent=L.title;h.style.cssText='font-weight:950;font-size:14px;margin-bottom:4px;color:#17324d';const hint=document.createElement('div');hint.textContent=`${group.length} · ${L.hint}`;hint.style.cssText='font-size:11px;color:#667085;margin-bottom:10px';panel.append(h,hint);const colours=[['#dc2626','Red'],['#2563eb','Blue'],['#facc15','Yellow'],['#15803d','Green'],['#7c3aed','Purple'],['#f97316','Orange'],['#17324d','Navy']];const row=document.createElement('div');row.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px';for(const [hex,name] of colours){const b=document.createElement('button');b.type='button';b.title=name;b.setAttribute('aria-label',name);Object.assign(b.style,{width:'36px',height:'36px',borderRadius:'50%',background:hex,border:'3px solid #fff',boxShadow:'0 0 0 1px #aab6bf',cursor:'pointer'});b.onclick=()=>createCounters(group,hex);row.appendChild(b)}panel.appendChild(row);const cancel=document.createElement('button');cancel.className='btn';cancel.textContent=L.cancel;cancel.onclick=()=>{closePanel();active=false};panel.appendChild(cancel);document.body.appendChild(panel)}
function analyse(){if(!active)return;const group=candidates();if(group.length<2){notify(L.none);return}showColours(group)}

// Override only the beta Counters menu item. Other Smart Math modes remain untouched.
document.addEventListener('click',e=>{const b=e.target?.closest?.('button');if(!b||b.textContent.trim()!==L.counters)return;const sm=document.getElementById('smartMathBtn');if(!sm)return;e.preventDefault();e.stopImmediatePropagation();active=true;startIndex=strokes.length;closePanel();sm.classList.add('active');sm.classList.remove('soft');notify(`✨ ${L.counters}`)},true);
canvas.addEventListener('pointerup',()=>{if(!active)return;clearTimeout(timer);timer=setTimeout(analyse,850)},true);

document.addEventListener('keydown',e=>{if(e.key==='Escape'&&active){active=false;closePanel()}},true);

// Undo the most recent V2 counter conversion exactly back to the rough ink.
undoBtn.addEventListener('click',e=>{if(!lastHistory)return;const ids=new Set(lastHistory.afterIds),present=strokes.some(s=>ids.has(s.smartId));if(!present)return;e.preventDefault();e.stopImmediatePropagation();strokes=clone(lastHistory.before);lastHistory=null;redraw();syncUi();notify('Smart Math counters undone')},true);
})();
