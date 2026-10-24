(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function'||typeof syncUi!=='function')return;

const edition=(new URLSearchParams(location.search).get('edition')||'en').toLowerCase();
const TXT={
 en:{fraction:'Fraction Bar',active:'✨ Smart Math · Fraction Bar · Pen',finish:'✓ Finished fraction?',draw:'Draw the fraction bar, then click “Finished fraction?”.',no:'I could not identify a fraction bar yet.',made:'fraction bar created',colour:'Choose a colour for this part'},
 zh:{fraction:'分数条',active:'✨ 智能数学 · 分数条 · 画笔',finish:'✓ 分数条画完了吗？',draw:'画好分数条后，点击“分数条画完了吗？”。',no:'暂时无法识别分数条。',made:'已创建分数条',colour:'为这一格选择颜色'},
 ms:{fraction:'Bar Pecahan',active:'✨ Matematik Pintar · Bar Pecahan · Pen',finish:'✓ Siap bar pecahan?',draw:'Lukis bar pecahan, kemudian klik “Siap bar pecahan?”.',no:'Bar pecahan belum dapat dikenal pasti.',made:'bar pecahan dicipta',colour:'Pilih warna untuk bahagian ini'},
 ta:{fraction:'பின்னப் பட்டை',active:'✨ நுண்ணறிவு கணிதம் · பின்னப் பட்டை · பேனா',finish:'✓ பின்னப் பட்டை முடிந்ததா?',draw:'பின்னப் பட்டையை வரைந்து முடித்ததும் “முடிந்ததா?” என்பதைக் கிளிக் செய்யவும்.',no:'பின்னப் பட்டையை இன்னும் அடையாளம் காண முடியவில்லை.',made:'பின்னப் பட்டை உருவாக்கப்பட்டது',colour:'இந்தப் பகுதிக்கான நிறத்தைத் தேர்ந்தெடுக்கவும்'}
};
const L=TXT[edition]||TXT.en;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const clone=v=>JSON.parse(JSON.stringify(v));
const uid=()=>`smf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
const PART_COLOURS=[['#dc2626','Red'],['#2563eb','Blue'],['#facc15','Yellow'],['#15803d','Green'],['#7c3aed','Purple'],['#f97316','Orange'],['#17324d','Navy'],['#ffffff','White']];
let active=false,initialInk=new Set(),doneBtn=null,lastHistory=null,baseLabel='',colourPanel=null;
let annotationContext='whiteboard',pointerOrigin=null,selectionGesture=null;

function notify(msg){if(typeof say==='function')say(msg);else{const t=document.getElementById('toast');if(t){t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1600)}}}
function rawInk(s){return !!(s&&Array.isArray(s.points)&&s.points.length&&!s.erase&&!s.smartGenerated&&!s.background)}
function box(s){let minX=1,minY=1,maxX=0,maxY=0;for(const p of s.points||[]){minX=Math.min(minX,p.x);minY=Math.min(minY,p.y);maxX=Math.max(maxX,p.x);maxY=Math.max(maxY,p.y)}return{x:minX,y:minY,w:Math.max(.001,maxX-minX),h:Math.max(.001,maxY-minY),cx:(minX+maxX)/2,cy:(minY+maxY)/2}}
function groupBox(arr){let minX=1,minY=1,maxX=0,maxY=0;for(const s of arr){const b=box(s);minX=Math.min(minX,b.x);minY=Math.min(minY,b.y);maxX=Math.max(maxX,b.x+b.w);maxY=Math.max(maxY,b.y+b.h)}return{x:minX,y:minY,w:Math.max(.001,maxX-minX),h:Math.max(.001,maxY-minY),cx:(minX+maxX)/2,cy:(minY+maxY)/2}}
function pathLen(s){let n=0,p=s.points||[];for(let i=1;i<p.length;i++)n+=Math.hypot((p[i].x-p[i-1].x)*cssW,(p[i].y-p[i-1].y)*cssH);return n}
function closure(s){const p=s.points||[];if(p.length<2)return Infinity;return Math.hypot((p[0].x-p[p.length-1].x)*cssW,(p[0].y-p[p.length-1].y)*cssH)}
function smartButton(){return document.getElementById('smartMathBtn')}
function forcePen(){try{tool='pen';syncUi();if(document.body.classList.contains('document-open-mode'))document.getElementById('documentPenModeBtn')?.click();canvas.style.cursor='crosshair'}catch{}}
function showActive(){const sm=smartButton();if(sm){if(!baseLabel)baseLabel=sm.textContent;sm.textContent=L.active;sm.title=L.active;sm.classList.add('active');sm.classList.remove('soft')}if(doneBtn)doneBtn.style.display='inline-flex'}
function deactivate(){active=false;initialInk.clear();if(doneBtn)doneBtn.style.display='none';const sm=smartButton();if(sm){sm.textContent=baseLabel||'✨ Smart Math';sm.title=sm.textContent;sm.classList.remove('active');sm.classList.add('soft')}}
function svgData(svg){return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)}
function makeFinishButton(){if(doneBtn)return;const sm=smartButton();if(!sm)return;doneBtn=document.createElement('button');doneBtn.id='smartFractionFinishBtn';doneBtn.type='button';doneBtn.className='btn soft';doneBtn.textContent=L.finish;doneBtn.style.cssText='display:none;min-height:32px;padding:5px 9px;font-size:11px;border-style:dashed';sm.insertAdjacentElement('afterend',doneBtn);doneBtn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();finishFraction()},true)}

// Recognise the geometry of the whole outline, independent of pen lifts.
function simplify(points,tol){
 if(points.length<3)return points;
 const a=points[0],b=points[points.length-1],dx=b.x-a.x,dy=b.y-a.y,d=dx*dx+dy*dy;
 let far=tol*tol,at=-1;
 for(let i=1;i<points.length-1;i++){const p=points[i],t=d?clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/d,0,1):0,dist=(p.x-a.x-t*dx)**2+(p.y-a.y-t*dy)**2;if(dist>far){far=dist;at=i}}
 if(at<0)return[a,b];
 return simplify(points.slice(0,at+1),tol).slice(0,-1).concat(simplify(points.slice(at),tol));
}
function lineInfo(line){
 line.points.sort((a,b)=>a.u-b.u);line.lo=line.points[0].u;line.hi=line.points[line.points.length-1].u;
 line.pos=line.points.reduce((sum,p)=>sum+p.v,0)/line.points.length;return line;
}
function lineAt(line,u){
 const ps=line.points;if(u<=ps[0].u)return ps[0].v;
 for(let i=1;i<ps.length;i++)if(u<=ps[i].u){const a=ps[i-1],b=ps[i];return a.v+(b.v-a.v)*(u-a.u)/Math.max(.001,b.u-a.u)}
 return ps[ps.length-1].v;
}
function sketchLines(group){
 const lines=[],tol=Math.max(1.5,Math.min(cssW,cssH)*.004);
 for(const s of group){
  let ps=s.points.filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));
  if(ps.length>1200){const step=Math.ceil(ps.length/1200);ps=ps.filter((p,i)=>i%step===0||i===ps.length-1)}
  ps=simplify(ps.map(p=>({x:p.x*cssW,y:p.y*cssH})),tol);let run=null,sign=0;
  for(let i=1;i<ps.length;i++){
   const a=ps[i-1],b=ps[i],dx=b.x-a.x,dy=b.y-a.y;
   const axis=Math.abs(dx)>=Math.abs(dy)*1.9?'h':Math.abs(dy)>=Math.abs(dx)*1.9?'v':null;
   if(!axis||Math.hypot(dx,dy)<2){run=null;continue}
   const nextSign=Math.sign(axis==='h'?dx:dy),pair=[a,b].map(p=>({u:axis==='h'?p.x:p.y,v:axis==='h'?p.y:p.x}));
   if(run&&run.axis===axis&&sign===nextSign)run.points.push(pair[1]);
   else{run={axis,points:pair,refs:new Set([s])};lines.push(run)}sign=nextSign;
  }
 }
 lines.forEach(lineInfo);
 // Join broken or retraced edges without joining opposite sides of a bar.
 const joinTol=Math.max(3,Math.min(7,Math.min(cssW,cssH)*.01));
 for(let i=0;i<lines.length;i++)for(let j=i+1;j<lines.length;){
  const a=lines[i],b=lines[j],gap=Math.max(0,Math.max(a.lo,b.lo)-Math.min(a.hi,b.hi)),u=(Math.max(a.lo,b.lo)+Math.min(a.hi,b.hi))/2;
  if(a.axis===b.axis&&gap<=Math.max(12,Math.min(a.hi-a.lo,b.hi-b.lo)*.04)&&Math.abs(lineAt(a,u)-lineAt(b,u))<=joinTol){a.points.push(...b.points);for(const s of b.refs)a.refs.add(s);lineInfo(a);lines.splice(j,1);j=i+1}
  else j++;
 }
 return lines;
}
function analyseFraction(group,required){
 group=group.filter(rawInk).slice(-256);if(!group.length)return null;
 const lines=sketchLines(group),candidates=[];
 for(const axis of ['h','v']){
  const major=lines.filter(l=>l.axis===axis&&l.hi-l.lo>=55).sort((a,b)=>(b.hi-b.lo)-(a.hi-a.lo)).slice(0,96),cross=lines.filter(l=>l.axis!==axis);
  for(let i=0;i<major.length;i++)for(let j=i+1;j<major.length;j++){
   let a=major[i],b=major[j];if(a.pos>b.pos)[a,b]=[b,a];
   const length=Math.max(a.hi-a.lo,b.hi-b.lo),overlap=Math.min(a.hi,b.hi)-Math.max(a.lo,b.lo);
   if(overlap<length*.72||Math.abs(a.lo-b.lo)>Math.max(24,length*.18)||Math.abs(a.hi-b.hi)>Math.max(24,length*.18))continue;
   const lo=(a.lo+b.lo)/2,hi=(a.hi+b.hi)/2,span=hi-lo,mid=(lo+hi)/2,short=lineAt(b,mid)-lineAt(a,mid);
   if(span<60||short<14||span<short*1.2)continue;
   const edgeTol=Math.max(8,span*.04),cuts=[],caps=[[],[]];
   for(const c of cross){
    const u=c.pos;if(u<lo-edgeTol||u>hi+edgeTol)continue;
    const top=lineAt(a,u),bottom=lineAt(b,u),height=bottom-top,margin=Math.max(10,height*.30),coverage=Math.min(c.hi,bottom)-Math.max(c.lo,top);
    if(height<10||coverage<height*.55||c.lo>top+margin||c.hi<bottom-margin||c.hi-c.lo>height*2.2+20)continue;
    if(Math.abs(u-lo)<=edgeTol)caps[0].push(c);
    else if(Math.abs(u-hi)<=edgeTol)caps[1].push(c);
    else if(u>lo+span*.025&&u<hi-span*.025)cuts.push(c);
   }
   if(!caps[0].length||!caps[1].length||!cuts.length)continue;
   const unique=[];for(const c of cuts.sort((a,b)=>a.pos-b.pos)){const prev=unique[unique.length-1];if(prev&&c.pos-prev[0].pos<=Math.max(3,Math.min(9,span*.025)))prev.push(c);else unique.push([c])}
   const parts=unique.length+1;if(parts>12)continue;
   const refs=new Set();for(const l of [a,b,...caps.flat(),...unique.flat()])for(const s of l.refs)refs.add(s);
   if(required?.size&&![...refs].some(s=>required.has(s)))continue;
   const v0=Math.min(...a.points.map(p=>p.v)),v1=Math.max(...b.points.map(p=>p.v));
   const bounds=axis==='h'?{x:lo/cssW,y:v0/cssH,w:span/cssW,h:(v1-v0)/cssH}:{x:v0/cssW,y:lo/cssH,w:(v1-v0)/cssW,h:span/cssH};
   // Include incidental ink inside this bar, while preserving marks elsewhere.
   for(const s of group){const r=box(s);if(r.x>=bounds.x-3/cssW&&r.y>=bounds.y-3/cssH&&r.x+r.w<=bounds.x+bounds.w+3/cssW&&r.y+r.h<=bounds.y+bounds.h+3/cssH)refs.add(s)}
   const source=group.filter(s=>refs.has(s));candidates.push({box:bounds,horizontal:axis==='h',parts,group:source,last:Math.max(...source.map(s=>group.indexOf(s))),area:bounds.w*bounds.h});
  }
 }
 return candidates.sort((a,b)=>b.last-a.last||b.area-a.area)[0]||null;
}

function buildFractionSrc(n,horizontal,fills){
 const svgW=horizontal?900:260,svgH=horizontal?220:900,els=[];
 const safe=Array.from({length:n},(_,i)=>fills?.[i]||'#ffffff');
 if(horizontal){
   const innerW=svgW-20,partW=innerW/n;
   for(let i=0;i<n;i++)els.push(`<rect x="${10+i*partW}" y="10" width="${partW}" height="${svgH-20}" fill="${safe[i]}"/>`);
 }else{
   const innerH=svgH-20,partH=innerH/n;
   for(let i=0;i<n;i++)els.push(`<rect x="10" y="${10+i*partH}" width="${svgW-20}" height="${partH}" fill="${safe[i]}"/>`);
 }
 els.push(`<rect x="10" y="10" width="${svgW-20}" height="${svgH-20}" rx="2" fill="none" stroke="#17324d" stroke-width="10"/>`);
 for(let i=1;i<n;i++){
   if(horizontal){const x=10+(svgW-20)*i/n;els.push(`<line x1="${x}" y1="10" x2="${x}" y2="${svgH-10}" stroke="#17324d" stroke-width="8"/>`)}
   else{const y=10+(svgH-20)*i/n;els.push(`<line x1="10" y1="${y}" x2="${svgW-10}" y2="${y}" stroke="#17324d" stroke-width="8"/>`)}
 }
 return svgData(`<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">${els.join('')}</svg>`);
}

function finishFraction(){
 if(!active)return;
 const fresh=strokes.filter(s=>rawInk(s)&&!initialInk.has(s));
 const f=analyseFraction(fresh)||analyseFraction(strokes,new Set(fresh));
 if(!f){notify(L.no);forcePen();showActive();return}
 const group=f.group,before=clone(strokes),set=new Set(group),b=f.box,n=f.parts;
 strokes=strokes.filter(s=>!set.has(s));
 const fills=Array(n).fill('#ffffff');
 const minW=f.horizontal?.10:.055,minH=f.horizontal?.055:.10;
 const obj={type:'image',src:buildFractionSrc(n,f.horizontal,fills),x:clamp(b.x,0,.96),y:clamp(b.y,0,.96),w:clamp(b.w,minW,1-b.x),h:clamp(b.h,minH,1-b.y),smartGenerated:true,smartType:'fractionBar',smartId:uid(),smartOriginal:clone(group),fractionParts:n,fractionHorizontal:f.horizontal,fractionFills:fills};
 strokes.push(obj);recordHistory(before,obj.smartId);redraw();syncUi();try{tool='select';syncUi()}catch{};deactivate();notify(`${n}-part ${L.made}`)
}

function hitFraction(clientX,clientY){
 const r=canvas.getBoundingClientRect(),x=(clientX-r.left)/Math.max(1,r.width),y=(clientY-r.top)/Math.max(1,r.height);
 for(let i=strokes.length-1;i>=0;i--){const s=strokes[i];if(!s||s.smartType!=='fractionBar'||!s.fractionParts||!s.w||!s.h)continue;if(x<s.x||x>s.x+s.w||y<s.y||y>s.y+s.h)continue;const rel=s.fractionHorizontal?(x-s.x)/s.w:(y-s.y)/s.h;return{obj:s,index:clamp(Math.floor(rel*s.fractionParts),0,s.fractionParts-1)}}
 return null;
}
function closeColourPanel(){if(colourPanel){colourPanel.remove();colourPanel=null}}
function showPartColours(hit,clientX,clientY){
 closeColourPanel();notify(L.colour);
 const panel=document.createElement('div');colourPanel=panel;
 panel.id='smartFractionColourPanel';panel.setAttribute('role','dialog');panel.setAttribute('aria-label',L.colour);
 panel.style.cssText='position:fixed;z-index:10000;display:flex;gap:6px;align-items:center;padding:7px;background:white;border:1px solid #cfd9de;border-radius:12px;box-shadow:0 8px 24px rgba(23,50,77,.20);left:'+Math.min(innerWidth-300,Math.max(8,clientX-110))+'px;top:'+Math.min(innerHeight-58,Math.max(8,clientY+12))+'px';
 for(const [hex,name] of PART_COLOURS){const b=document.createElement('button');b.type='button';b.title=name;b.setAttribute('aria-label',name);b.style.cssText=`width:28px;height:28px;border-radius:50%;border:2px solid white;box-shadow:0 0 0 1px #aab7c0;background:${hex};padding:0`;b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const before=clone(strokes);const obj=strokes.find(s=>s.smartId===hit.obj.smartId);if(!obj){closeColourPanel();return}obj.fractionFills=Array.from({length:obj.fractionParts},(_,i)=>obj.fractionFills?.[i]||'#ffffff');obj.fractionFills[hit.index]=hex;obj.src=buildFractionSrc(obj.fractionParts,obj.fractionHorizontal,obj.fractionFills);recordHistory(before,obj.smartId);closeColourPanel();redraw();syncUi()},true);panel.appendChild(b)}
 document.body.appendChild(panel);
}

makeFinishButton();

// Older menu controllers stop the click at document capture. Release this
// mode earlier, so choosing Counters or Bar Model cannot leave two modes armed.
window.addEventListener('click',e=>{
 const b=e.target?.closest?.('button');if(!b)return;
 const menu=b.parentElement;if(![...menu?.children||[]].some(el=>el.tagName==='BUTTON'&&el.textContent.trim()===L.fraction))return;
 if(b.textContent.trim()!==L.fraction){if(active)deactivate();queueMicrotask(()=>{menu.style.display='none'})}
},true);
document.addEventListener('click',e=>{
 const b=e.target?.closest?.('button');if(!b)return;const label=b.textContent.trim();
 if(label===L.fraction){
  const sm=smartButton();if(!sm)return;e.preventDefault();e.stopImmediatePropagation();
  // Finish the previous controller before arming this one. Pen's ordinary
  // click dispatches Escape, so activate the document pen before setting active.
  document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  window.ClassroomSmartMath?.setMode('off');
  if(b.parentElement?.style.position==='fixed')b.parentElement.style.display='none';
  baseLabel=sm.textContent;closeColourPanel();forcePen();initialInk=new Set(strokes.filter(rawInk));active=true;showActive();notify(L.draw);return;
 }
 if(active&&['Auto Detect','Counters','Bar Model','Number Line','Equation','3D Solid','Smart Math Off','自动识别','计数片','条形图','数轴','算式','3D 立体图形','关闭智能数学','Kesan Auto','Pembilang','Model Bar','Garis Nombor','Persamaan','Pepejal 3D','Matematik Pintar Mati','தானாக கண்டறி','எண்ணிகள்','பார் மாதிரி','எண் கோடு','சமன்பாடு','3D திண்மம்','நுண்ணறிவு கணிதம் நிறுத்து'].includes(label)){deactivate()}
},true);

// Capture the tapped part before the older image-selection toolbar reflows.
window.addEventListener('pointerdown',e=>{if(e.target===canvas)pointerOrigin={x:e.clientX,y:e.clientY,moved:false,hit:hitFraction(e.clientX,e.clientY)}},true);
window.addEventListener('pointermove',e=>{if(pointerOrigin&&Math.hypot(e.clientX-pointerOrigin.x,e.clientY-pointerOrigin.y)>4)pointerOrigin.moved=true},true);
canvas.addEventListener('click',e=>{const origin=pointerOrigin;pointerOrigin=null;if(origin?.moved){closeColourPanel();return}const hit=origin?origin.hit:hitFraction(e.clientX,e.clientY);if(!hit){closeColourPanel();return}e.preventDefault();e.stopImmediatePropagation();showPartColours(hit,e.clientX,e.clientY)},true);
document.addEventListener('pointerdown',e=>{if(colourPanel&&!colourPanel.contains(e.target)&&e.target!==canvas)closeColourPanel()},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeColourPanel();if(active)deactivate()}},true);
function recordHistory(before,id){
 const history=window.WhiteboardAnnotationHistory;
 if(history){const entries=history.get();entries.push(before);history.set(entries);lastHistory=null}
 else lastHistory={before,afterId:id,after:JSON.stringify(strokes),context:annotationContext};
}
// The older border/height resize controllers do not add an Undo entry.
// Record only fraction gestures they own; ordinary Select already records its own.
window.addEventListener('pointerdown',e=>{
 selectionGesture=null;
 if(e.target!==canvas||tool!=='select')return;
 const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
 const obj=[...strokes].reverse().find(s=>s.smartType==='fractionBar'&&x>=s.x*r.width-24&&x<=(s.x+s.w)*r.width+24&&y>=s.y*r.height-24&&y<=(s.y+s.h)*r.height+24);
 if(obj)selectionGesture={id:obj.smartId,before:clone(strokes),box:[obj.x,obj.y,obj.w,obj.h].join(','),depth:window.WhiteboardAnnotationHistory?.get().length};
},true);
function finishSelectionGesture(){
 const g=selectionGesture;selectionGesture=null;if(!g)return;
 queueMicrotask(()=>{const obj=strokes.find(s=>s.smartId===g.id);if(!obj||[obj.x,obj.y,obj.w,obj.h].join(',')===g.box)return;if(window.WhiteboardAnnotationHistory?.get().length===g.depth)recordHistory(g.before,g.id)});
}
window.addEventListener('pointerup',finishSelectionGesture,true);
window.addEventListener('pointercancel',finishSelectionGesture,true);
undoBtn.addEventListener('click',e=>{
 if(!lastHistory||lastHistory.context!==annotationContext||JSON.stringify(strokes)!==lastHistory.after)return;
 e.preventDefault();e.stopImmediatePropagation();strokes=clone(lastHistory.before);lastHistory=null;closeColourPanel();redraw();syncUi();notify('Smart Math fraction undone');
},true);
document.addEventListener('whiteboard-annotation-context',e=>{
 const key=e.detail?.key;if(!key||key===annotationContext)return;
 annotationContext=key;initialInk.clear();lastHistory=null;selectionGesture=null;pointerOrigin=null;closeColourPanel();if(active)deactivate();
});
window.ClassroomFractionBars={analyse:analyseFraction,isActive:()=>active};
})();
