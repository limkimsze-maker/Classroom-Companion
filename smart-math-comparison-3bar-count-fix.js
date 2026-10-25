(function(){
'use strict';
if(typeof strokes==='undefined'||typeof redraw!=='function')return;

let pending=null;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function rawInk(s){return !!(s&&Array.isArray(s.points)&&s.points.length&&!s.erase&&!s.highlighter&&!s.background&&!s.smartGenerated)}
function dims(){const c=document.getElementById('board');const r=c?.getBoundingClientRect();return{w:Math.max(1,r?.width||innerWidth||1000),h:Math.max(1,r?.height||innerHeight||700)}}
function box(s){let minX=1,minY=1,maxX=0,maxY=0;for(const p of s.points||[]){minX=Math.min(minX,p.x);minY=Math.min(minY,p.y);maxX=Math.max(maxX,p.x);maxY=Math.max(maxY,p.y)}const d=dims();return{x:minX,y:minY,w:Math.max(.001,maxX-minX),h:Math.max(.001,maxY-minY),l:minX*d.w,t:minY*d.h,r:maxX*d.w,b:maxY*d.h,pw:Math.max(.001,maxX-minX)*d.w,ph:Math.max(.001,maxY-minY)*d.h,cx:(minX+maxX)/2,cy:(minY+maxY)/2}}
function overlapX(a,b){return Math.max(0,Math.min(a.r,b.r)-Math.max(a.l,b.l))/Math.max(1,Math.min(a.pw,b.pw))}
function barLike(q){return q.b.pw>=90&&q.b.ph>=18&&q.b.pw>=q.b.ph*1.45}
function recentClosedBars(group){
 const arr=group.map((s,i)=>({s,i,b:box(s)})).filter(barLike);
 // Closed/freehand rectangles usually arrive as one stroke each. Keep distinct rows.
 arr.sort((a,b)=>b.i-a.i);
 const out=[];
 for(const q of arr){if(out.some(z=>Math.abs((z.b.cy-q.b.cy)*dims().h)<26))continue;out.push(q);if(out.length>=5)break}
 return out.sort((a,b)=>a.b.cy-b.b.cy);
}
function horizontalEdgeBars(group){
 const d=dims();
 let edges=group.map((s,i)=>({s,i,b:box(s)})).filter(q=>q.b.pw>=90&&q.b.ph<=Math.max(26,q.b.pw*.11)&&q.b.pw>=q.b.ph*3.0);
 edges.sort((a,b)=>a.b.cy-b.b.cy);
 // Collapse duplicate passes over the same horizontal edge.
 const unique=[];
 for(const e of edges){const last=unique[unique.length-1];if(last&&Math.abs((last.b.cy-e.b.cy)*d.h)<10&&overlapX(last.b,e.b)>.65){if(e.i>last.i)unique[unique.length-1]=e}else unique.push(e)}
 const pairs=[],used=new Set();
 for(let i=0;i<unique.length;i++){
   let best=-1,bestScore=Infinity;
   for(let j=i+1;j<unique.length;j++){
     if(used.has(j))continue;
     const gap=(unique[j].b.cy-unique[i].b.cy)*d.h;
     if(gap<16)continue;if(gap>115)break;
     const ov=overlapX(unique[i].b,unique[j].b);if(ov<.52)continue;
     const score=Math.abs(gap-52)+(1-ov)*45;
     if(score<bestScore){bestScore=score;best=j}
   }
   if(best>=0&&!used.has(i)){used.add(i);used.add(best);const a=unique[i].b,b=unique[best].b;pairs.push({l:Math.min(a.l,b.l),r:Math.max(a.r,b.r),t:Math.min(a.t,b.t),b:Math.max(a.b,b.b),pw:Math.max(a.r,b.r)-Math.min(a.l,b.l),ph:Math.max(a.b,b.b)-Math.min(a.t,b.t),cy:((a.cy+b.cy)/2),last:Math.max(unique[i].i,unique[best].i)})}
 }
 pairs.sort((a,b)=>b.last-a.last);
 const out=[];
 for(const q of pairs){if(out.some(z=>Math.abs((z.cy-q.cy)*d.h)<30))continue;out.push(q);if(out.length>=5)break}
 return out.sort((a,b)=>a.cy-b.cy);
}
function chooseEvidence(group){
 const closed=recentClosedBars(group),edges=horizontalEdgeBars(group);
 // Only intervene when there is strong evidence of 3+ rows. This avoids changing valid 2-bar models.
 let rows=closed.length>=3?closed:(edges.length>=3?edges:[]);
 if(rows.length<3)return null;
 rows=rows.slice(-5);
 // Prefer the latest three vertically coherent bars if more than three unrelated bars exist.
 if(rows.length>3){
   let best=null;
   for(let i=0;i<=rows.length-3;i++){const r=rows.slice(i,i+3),span=(r[2].cy-r[0].cy)*dims().h,align=Math.max(...r.map(q=>q.l??q.b?.l??0))-Math.min(...r.map(q=>q.l??q.b?.l??0)),score=span+align*.6;if(!best||score<best.score)best={r,score}}
   rows=best.r;
 }
 return rows;
}
function widthsFrom(rows){
 const get=q=>q.b||q, lefts=rows.map(q=>get(q).l),rights=rows.map(q=>get(q).r),commonLeft=lefts.reduce((a,b)=>a+b,0)/lefts.length,spans=rights.map(r=>Math.max(20,r-commonLeft)),m=Math.max(...spans,20);return spans.map(v=>clamp(v/m,.16,1));
}
function svgData(svg){return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)}
function rebuild(obj,n,widths){
 const H=Math.max(340,150+n*145),x=180,maxW=650,rowGap=145,barH=76,startY=60,stroke='#17324d',els=[];
 for(let i=0;i<n;i++){const w=maxW*clamp(widths[i]??(1-i*.11),.16,1),fill=obj.barFills?.[i]||'#ffffff';els.push(`<rect x="${x}" y="${startY+i*rowGap}" width="${w}" height="${barH}" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="8"/>`)}
 obj.src=svgData(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="${H}" viewBox="0 0 900 ${H}">${els.join('')}</svg>`);
 obj.barCompareLayoutVersion=2;
}
function isFinishButton(el){const b=el?.closest?.('button'),smart=document.getElementById('smartMathBtn');return !!(b&&(b.id==='smartBarFinishBtn'||(smart&&smart.nextElementSibling===b)))}

document.addEventListener('pointerdown',e=>{
 if(window.__smartBarType!=='comparison'||!isFinishButton(e.target))return;
 const raw=strokes.filter(rawInk),rows=chooseEvidence(raw);if(!rows)return;
 pending={rows,ids:new Set(strokes.filter(s=>s?.smartType==='barModel'&&s.smartBarType==='comparison').map(s=>s.smartId))};
},true);

document.addEventListener('click',e=>{
 if(window.__smartBarType!=='comparison'||!isFinishButton(e.target)||!pending)return;
 const job=pending;pending=null;
 setTimeout(()=>{
   const obj=[...strokes].reverse().find(s=>s?.smartType==='barModel'&&s.smartBarType==='comparison'&&!job.ids.has(s.smartId));
   if(!obj)return;
   const count=Math.min(5,job.rows.length);if(count<3)return;
   const widths=widthsFrom(job.rows.slice(0,count));
   obj.barCount=count;obj.barCompareWidths=widths;obj.barFills=Array.from({length:count},(_,i)=>obj.barFills?.[i]||'#ffffff');
   rebuild(obj,count,widths);
   try{redraw();if(typeof syncUi==='function')syncUi()}catch{}
 },260);
},true);
})();
