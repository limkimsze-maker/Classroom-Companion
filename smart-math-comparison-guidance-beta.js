(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function'||typeof syncUi!=='function')return;
const smartBtn=document.getElementById('smartMathBtn');
if(!smartBtn)return;
const clone=v=>JSON.parse(JSON.stringify(v));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let startIndex=0,lastType='',pending=null,refreshing=false;

function rawInk(s){return !!(s&&Array.isArray(s.points)&&s.points.length&&!s.erase&&!s.background&&!s.smartGenerated)}
function box(s){let minX=1,minY=1,maxX=0,maxY=0;for(const p of s?.points||[]){minX=Math.min(minX,p.x);minY=Math.min(minY,p.y);maxX=Math.max(maxX,p.x);maxY=Math.max(maxY,p.y)}return{x:minX,y:minY,w:Math.max(.001,maxX-minX),h:Math.max(.001,maxY-minY),cx:(minX+maxX)/2,cy:(minY+maxY)/2}}
function pxBox(s){const b=box(s);return{...b,pw:b.w*cssW,ph:b.h*cssH}}
function closedish(s,b){const pts=s.points||[];if(pts.length<3)return false;const a=pts[0],z=pts[pts.length-1],d=Math.hypot((a.x-z.x)*cssW,(a.y-z.y)*cssH),tol=Math.max(28,Math.min(72,(b.pw+b.ph)*.105));return d<=tol}
function pathLength(s){const pts=s?.points||[];let d=0;for(let i=1;i<pts.length;i++)d+=Math.hypot((pts[i].x-pts[i-1].x)*cssW,(pts[i].y-pts[i-1].y)*cssH);return d}
function span(vals){if(!vals.length)return 0;return Math.max(...vals)-Math.min(...vals)}
function rectangularish(s,b){
 if(b.pw<120||b.ph<30||b.pw<b.ph*1.55||!closedish(s,b))return false;
 const pts=s.points||[],tolY=Math.max(7,Math.min(18,b.ph*.24)),tolX=Math.max(7,Math.min(18,b.ph*.28));
 const minX=b.x*cssW,maxX=(b.x+b.w)*cssW,minY=b.y*cssH,maxY=(b.y+b.h)*cssH;
 const top=[],bottom=[],left=[],right=[];
 for(const p of pts){const x=p.x*cssW,y=p.y*cssH;if(Math.abs(y-minY)<=tolY)top.push(x);if(Math.abs(y-maxY)<=tolY)bottom.push(x);if(Math.abs(x-minX)<=tolX)left.push(y);if(Math.abs(x-maxX)<=tolX)right.push(y)}
 const perimeter=2*(b.pw+b.ph),travel=pathLength(s);
 return travel>=perimeter*.68&&span(top)>=b.pw*.52&&span(bottom)>=b.pw*.52&&span(left)>=b.ph*.38&&span(right)>=b.ph*.38;
}
function dedupeRows(list){list.sort((a,b)=>a.b.cy-b.b.cy);const out=[];for(const q of list){const last=out[out.length-1];if(last&&Math.abs((q.b.cy-last.b.cy)*cssH)<34){if(q.b.pw*q.b.ph>last.b.pw*last.b.ph)out[out.length-1]=q}else out.push(q)}return out}
function findBars(group){
 // A comparison bar must look like an actual rough rectangle. Curly brackets can be
 // wide and almost closed, so endpoint distance alone is not enough.
 let c=group.map(s=>({s,b:pxBox(s)})).filter(q=>rectangularish(q.s,q.b));
 c=dedupeRows(c);
 // Tolerant fallback for rough rectangles: still require enough travel to go around
 // most of a rectangle. This rejects top/bottom curly brackets that caused 2 bars
 // to be interpreted as 4 bars.
 if(c.length<2){c=group.map(s=>({s,b:pxBox(s)})).filter(q=>q.b.pw>=120&&q.b.ph>=32&&q.b.pw>=q.b.ph*1.55&&closedish(q.s,q.b)&&pathLength(q.s)>=2*(q.b.pw+q.b.ph)*.72);c=dedupeRows(c)}
 if(c.length>5)c=c.sort((a,b)=>b.b.pw*b.b.ph-a.b.pw*a.b.ph).slice(0,5).sort((a,b)=>a.b.cy-b.b.cy);
 return c;
}
function findBrackets(group,bars){
 const barSet=new Set(bars.map(q=>q.s));
 return group.filter(s=>{if(barSet.has(s))return false;const b=pxBox(s);return b.pw>=45&&b.pw>=b.ph*1.45&&b.ph<=110});
}
function modelH(n){return Math.max(340,150+n*145)}
function modelWidths(bars){const max=Math.max(...bars.map(q=>q.b.w),.001);return bars.map(q=>clamp(q.b.w/max,.16,1))}
function svgData(svg){return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)}
function rebuild(obj){const n=Math.max(2,Math.min(5,obj.barCount||2)),H=modelH(n),x=180,maxW=650,rowGap=145,barH=76,startY=60,stroke='#17324d',widths=obj.barCompareWidths||Array.from({length:n},(_,i)=>1-i*.11),els=[];for(let i=0;i<n;i++){const w=maxW*clamp(widths[i]??1,.16,1),fill=obj.barFills?.[i]||'#ffffff';els.push(`<rect x="${x}" y="${startY+i*rowGap}" width="${w}" height="${barH}" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="8"/>`)}obj.barCompareLayoutVersion=2;obj.src=svgData(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="${H}" viewBox="0 0 900 ${H}">${els.join('')}</svg>`)}
function hideAuto(obj){return; // Beta: preserve original comparison brackets while adding difference bracket\nif(!obj.barBracketState||typeof obj.barBracketState!=='object')obj.barBracketState={};const n=Math.max(2,obj.barCount||2);for(let i=0;i<n;i++){if(!obj.barBracketState['c'+i])obj.barBracketState['c'+i]={visible:false,label:'',position:i%2?'bottom':'top'};else obj.barBracketState['c'+i].visible=false}}
function roughAnchor(x,bars){let best={d:Infinity,a:{kind:'start'}};const left=Math.min(...bars.map(q=>q.b.x));const ds=Math.abs(x-left);best={d:ds,a:{kind:'start'}};for(let i=0;i<bars.length;i++){const d=Math.abs(x-(bars[i].b.x+bars[i].b.w));if(d<best.d)best={d,a:{kind:'end',row:i}}}return best.a}
function nearestBarEdge(b,bars){let best={d:Infinity,row:0,position:'top'};for(let i=0;i<bars.length;i++){const q=bars[i].b,top=q.y,bottom=q.y+q.h,dt=Math.abs(b.cy-top),db=Math.abs(b.cy-bottom);if(dt<best.d)best={d:dt,row:i,position:b.cy<=q.cy?'top':'bottom'};if(db<best.d)best={d:db,row:i,position:b.cy>=q.cy?'bottom':'top'}}return best}
function bracketY(obj,row,position){const n=Math.max(2,Math.min(5,obj.barCount||2)),H=modelH(n),startY=60,rowGap=145,barH=76,r=clamp(row,0,n-1),edge=(position==='top'?startY+r*rowGap:startY+r*rowGap+barH)/H,gap=16/Math.max(1,obj.h*cssH);return clamp(edge+(position==='top'?-gap:gap),.01,.99)}
function makeBrackets(originals,obj,bars){return originals.map((s,i)=>{const b=box(s),edge=nearestBarEdge(b,bars);return{id:'uc'+i,x1:0,x2:1,y:bracketY(obj,edge.row,edge.position),position:edge.position,label:'',visible:true,compareRow:edge.row,compareAnchorLeft:roughAnchor(b.x,bars),compareAnchorRight:roughAnchor(b.x+b.w,bars)}})}
function restoreTemp(){if(!pending)return;for(const s of pending.brackets){s.smartGenerated=!!s.__cmpWasSmart;delete s.__cmpWasSmart;delete s.__cmpBracketTemp}pending=null}
function prepareFinish(){
 const type=window.__smartBarType||'';if(type!=='comparison')return;
 const group=strokes.slice(startIndex).filter(rawInk);if(group.length<2)return;
 const bars=findBars(group);if(bars.length<2)return;
 const brackets=findBrackets(group,bars);
 const beforeIds=new Set(strokes.filter(s=>s?.smartType==='barModel').map(s=>s.smartId));
 // Hide only recognised horizontal brackets from the base row counter. The bars stay
 // visible to the base recogniser, so two drawn bars produce exactly two rows.
 for(const s of brackets){s.__cmpWasSmart=!!s.smartGenerated;s.__cmpBracketTemp=true;s.smartGenerated=true}
 pending={bars,brackets:brackets.slice(),original:clone(brackets),beforeIds};
 setTimeout(()=>{
  if(!pending)return;const p=pending;
  const obj=[...strokes].reverse().find(s=>s&&s.smartType==='barModel'&&s.smartBarType==='comparison'&&!p.beforeIds.has(s.smartId));
  if(!obj){restoreTemp();try{redraw()}catch{};return}
  const tempSet=new Set(p.brackets);strokes=strokes.filter(s=>!tempSet.has(s));
  const originals=p.original.map(s=>{const c=clone(s);delete c.__cmpWasSmart;delete c.__cmpBracketTemp;c.smartGenerated=false;return c});
  obj.smartOriginal=[...(Array.isArray(obj.smartOriginal)?obj.smartOriginal:[]),...originals];
  obj.barCount=Math.max(2,Math.min(5,p.bars.length));obj.barCompareWidths=modelWidths(p.bars);if(!Array.isArray(obj.barFills))obj.barFills=Array(obj.barCount).fill('#ffffff');
  rebuild(obj);obj.rotation=0;obj.angle=0;obj.userDrawnBrackets=makeBrackets(originals,obj,p.bars);obj.userDrawnBracketScan=true;hideAuto(obj);pending=null;redraw();syncUi();
 },0)
}

document.addEventListener('click',e=>{const el=e.target;if(!(el instanceof Element))return;if(el.closest('#smartBarTypeMenu'))setTimeout(()=>{const t=window.__smartBarType||'';if(t&&t!==lastType){lastType=t;startIndex=strokes.length}},0);const finish=smartBtn.nextElementSibling;if(finish&&el===finish)prepareFinish()},true);
function anchorX(obj,a){if(!a||a.kind==='start')return 180/900;const widths=Array.isArray(obj.barCompareWidths)?obj.barCompareWidths:[];const row=clamp(Number(a.row)||0,0,Math.max(0,(obj.barCount||2)-1));return(180+650*clamp(widths[row]??1,.16,1))/900}
function follow(){let changed=false;for(const obj of strokes){if(!obj||obj.smartType!=='barModel'||obj.smartBarType!=='comparison'||!Array.isArray(obj.userDrawnBrackets))continue;hideAuto(obj);for(const b of obj.userDrawnBrackets){if(!b.compareAnchorLeft||!b.compareAnchorRight)continue;let x1=anchorX(obj,b.compareAnchorLeft),x2=anchorX(obj,b.compareAnchorRight);if(x2<x1)[x1,x2]=[x2,x1];const row=clamp(Number.isInteger(b.compareRow)?b.compareRow:0,0,Math.max(0,(obj.barCount||2)-1)),y=b.isDifference?clamp((60+Math.min(Number(b.compareAnchorLeft?.row??0),Number(b.compareAnchorRight?.row??1))*145+76+(Math.abs(Number(b.compareAnchorLeft?.row??0)-Number(b.compareAnchorRight?.row??1))*145-76)/2+10/Math.max(1,obj.h*cssH)*modelH(Math.max(2,Math.min(5,obj.barCount||2))))/modelH(Math.max(2,Math.min(5,obj.barCount||2))),.01,.99):bracketY(obj,row,b.position==='bottom'?'bottom':'top');if(Math.abs((b.x1??0)-x1)>.0005||Math.abs((b.x2??0)-x2)>.0005||Math.abs((b.y??0)-y)>.0005){b.x1=x1;b.x2=x2;b.y=y;changed=true}}}return changed}
const priorRedraw=redraw;redraw=function(){follow();priorRedraw();if(!refreshing&&follow()){refreshing=true;requestAnimationFrame(()=>{refreshing=false;priorRedraw()})}};
setTimeout(()=>{try{redraw()}catch{}},0);
})();
(function(){if(document.querySelector('script[data-compare-total-bracket]'))return;const s=document.createElement('script');s.dataset.compareTotalBracket='1';s.src='smart-math-comparison-total-bracket.js?v=20261011-1245-totalright2';document.head.appendChild(s)})();
