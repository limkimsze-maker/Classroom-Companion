(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function'||typeof syncUi!=='function')return;
const edition=(new URLSearchParams(location.search).get('edition')||'en').toLowerCase();
const TXT={
 en:{title:'Total bracket label',placeholder:'Type total / ?',apply:'Apply',del:'Delete bracket'},
 zh:{title:'总量括号标签',placeholder:'输入总量 / ?',apply:'应用',del:'删除括号'},
 ms:{title:'Label kurungan jumlah',placeholder:'Taip jumlah / ?',apply:'Guna',del:'Padam kurungan'},
 ta:{title:'மொத்த அடைப்புக்குறி பெயர்',placeholder:'மொத்தம் / ? உள்ளிடவும்',apply:'பயன்படுத்து',del:'அடைப்புக்குறியை நீக்கு'}
};
const L=TXT[edition]||TXT.en;
const clone=v=>JSON.parse(JSON.stringify(v));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let panel=null,hot=[];
function closePanel(){if(panel){panel.remove();panel=null}}
function box(s){let minX=1,minY=1,maxX=0,maxY=0;for(const p of s?.points||[]){minX=Math.min(minX,p.x);minY=Math.min(minY,p.y);maxX=Math.max(maxX,p.x);maxY=Math.max(maxY,p.y)}return{x:minX,y:minY,w:Math.max(.001,maxX-minX),h:Math.max(.001,maxY-minY),cx:(minX+maxX)/2,cy:(minY+maxY)/2}}
function countFor(obj){return clamp(Math.round(Number(obj.barCount)||2),2,5)}
function layout(obj){const n=countFor(obj),H=Math.max(340,150+n*145);return{n,H,x:180,maxW:650,rowGap:145,barH:76,startY:60}}
function widths(obj){const n=countFor(obj),a=Array.isArray(obj.barCompareWidths)?obj.barCompareWidths:[];return Array.from({length:n},(_,i)=>clamp(Number(a[i]??(1-i*.11)),.16,1))}
function rowTop(obj,i){const g=layout(obj);return(g.startY+i*g.rowGap)/g.H}
function rowBottom(obj,i){const g=layout(obj);return(g.startY+i*g.rowGap+g.barH)/g.H}
function maxRight(obj){const g=layout(obj),ws=widths(obj);return(g.x+g.maxW*Math.max(...ws))/900}
function scan(obj){
 if(obj.smartBarType!=='comparison'||!Array.isArray(obj.smartOriginal)||!obj.smartOriginal.length||obj.compareTotalBracketScan)return;
 obj.compareTotalBracketScan=true;
 const ink=obj.smartOriginal.filter(s=>Array.isArray(s?.points)&&s.points.length&&!s.erase),bars=ink.map(s=>({s,b:box(s)})).filter(q=>q.b.w*cssW>=110&&q.b.w*cssW>=q.b.h*cssH*1.5);
 if(bars.length<2)return;
 const right=Math.max(...bars.map(q=>q.b.x+q.b.w)),top=Math.min(...bars.map(q=>q.b.y)),bottom=Math.max(...bars.map(q=>q.b.y+q.b.h));
 const candidates=[];
 for(const s of ink){const b=box(s),pw=b.w*cssW,ph=b.h*cssH;if(ph<55||ph<pw*1.7)continue;if(b.cx<right-.03)continue;if(b.y>bottom+.08||b.y+b.h<top-.08)continue;candidates.push({s,b,score:ph-pw*.35+Math.max(0,(b.cx-right)*cssW)*.08})}
 if(!candidates.length)return;
 candidates.sort((a,b)=>b.score-a.score);const b=candidates[0].b;
 const n=countFor(obj),entry={id:'ct0',visible:true,label:'',topRow:0,bottomRow:n-1,xOffset:clamp((b.cx-obj.x)/Math.max(.001,obj.w),0,1)};
 obj.comparisonTotalBrackets=[entry];
}
function brace(x,y1,y2,label,obj,entry){
 if(y2<y1)[y1,y2]=[y2,y1];const h=y2-y1,mid=(y1+y2)/2,end=clamp(h*.05,5,11),neck=clamp(h*.04,5,10),depth=9;
 ctx.save();ctx.strokeStyle='#111827';ctx.fillStyle='#111827';ctx.lineWidth=2;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(x-depth,y1);ctx.bezierCurveTo(x-3,y1,x,y1+2,x,y1+end);ctx.lineTo(x,mid-neck);ctx.bezierCurveTo(x,mid-neck*.35+mid*(1-.35),x+2,mid-4,x+depth,mid);ctx.bezierCurveTo(x+2,mid+4,x,mid+neck*.35+mid*(1-.35),x,mid+neck);ctx.lineTo(x,y2-end);ctx.bezierCurveTo(x,y2-2,x-3,y2,x-depth,y2);ctx.stroke();if(label){ctx.font='700 14px Arial,sans-serif';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(label,x+15,mid)}ctx.restore();
 hot.push({obj,entry,x1:x-24,x2:x+90,y1:y1-10,y2:y2+10});
}
function drawAll(){hot=[];for(const obj of strokes){if(!obj||obj.smartType!=='barModel'||obj.smartBarType!=='comparison'||!obj.w||!obj.h)continue;scan(obj);if(!Array.isArray(obj.comparisonTotalBrackets))continue;const g=layout(obj),mr=maxRight(obj);for(const e of obj.comparisonTotalBrackets){if(!e.visible)continue;const tr=clamp(e.topRow||0,0,g.n-1),br=clamp(e.bottomRow??g.n-1,tr,g.n-1);const y1=(obj.y+obj.h*rowTop(obj,tr))*cssH,y2=(obj.y+obj.h*rowBottom(obj,br))*cssH;const x=(obj.x+obj.w*mr)*cssW+26;brace(x,y1,y2,e.label||'',obj,e)}}}
const priorRedraw=redraw;redraw=function(){priorRedraw();drawAll()};
function hit(clientX,clientY){const r=canvas.getBoundingClientRect(),x=(clientX-r.left)*(cssW/Math.max(1,r.width)),y=(clientY-r.top)*(cssH/Math.max(1,r.height));for(let i=hot.length-1;i>=0;i--){const h=hot[i];if(x>=h.x1&&x<=h.x2&&y>=h.y1&&y<=h.y2)return h}return null}
function button(text,cls){const b=document.createElement('button');b.type='button';b.className='btn '+(cls||'');b.textContent=text;b.style.cssText='min-height:32px;padding:5px 8px;font-size:11px;flex:1';return b}
function showPanel(h,cx,cy){closePanel();const obj=strokes.find(s=>s&&s.smartId===h.obj.smartId);if(!obj)return;const e=obj.comparisonTotalBrackets?.find(x=>x.id===h.entry.id);if(!e)return;panel=document.createElement('div');panel.style.cssText='position:fixed;z-index:10120;width:270px;padding:10px;background:#fff;border:1px solid #cfd9de;border-radius:13px;box-shadow:0 10px 28px rgba(23,50,77,.22);left:'+Math.min(innerWidth-278,Math.max(8,cx-125))+'px;top:'+Math.min(innerHeight-135,Math.max(8,cy+12))+'px';const title=document.createElement('div');title.textContent=L.title;title.style.cssText='font:900 12px Inter,system-ui,sans-serif;color:#17324d;margin-bottom:7px';const input=document.createElement('input');input.type='text';input.maxLength=30;input.placeholder=L.placeholder;input.value=e.label||'';input.style.cssText='width:100%;border:1px solid #cfd9de;border-radius:9px;padding:7px 8px;font-size:12px;font-weight:700;color:#17324d;margin-bottom:7px';const row=document.createElement('div');row.style.cssText='display:flex;gap:6px';const apply=button(L.apply,'soft'),del=button(L.del,'danger');const commit=()=>{const o=strokes.find(s=>s&&s.smartId===obj.smartId);if(!o)return;window.__smartBarLastHistory={before:clone(strokes),afterId:o.smartId};const t=o.comparisonTotalBrackets?.find(x=>x.id===e.id);if(t)t.label=input.value.trim();redraw();syncUi();closePanel()};apply.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();commit()},true);input.addEventListener('keydown',ev=>{if(ev.key==='Enter'){ev.preventDefault();commit()}else if(ev.key==='Escape'){ev.preventDefault();closePanel()}},true);del.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();const o=strokes.find(s=>s&&s.smartId===obj.smartId);if(!o)return;window.__smartBarLastHistory={before:clone(strokes),afterId:o.smartId};const t=o.comparisonTotalBrackets?.find(x=>x.id===e.id);if(t)t.visible=false;redraw();syncUi();closePanel()},true);row.append(apply,del);panel.append(title,input,row);document.body.appendChild(panel);setTimeout(()=>input.focus(),0)}
let down=null;canvas.addEventListener('pointerdown',ev=>{const h=hit(ev.clientX,ev.clientY);if(!h)return;ev.preventDefault();ev.stopImmediatePropagation();down={h,x:ev.clientX,y:ev.clientY}},true);canvas.addEventListener('pointerup',ev=>{if(!down)return;const d=down;down=null;ev.preventDefault();ev.stopImmediatePropagation();if(Math.hypot(ev.clientX-d.x,ev.clientY-d.y)<=8)showPanel(d.h,ev.clientX,ev.clientY)},true);canvas.addEventListener('click',ev=>{const h=hit(ev.clientX,ev.clientY);if(!h)return;ev.preventDefault();ev.stopImmediatePropagation()},true);document.addEventListener('pointerdown',ev=>{if(panel&&!panel.contains(ev.target)&&ev.target!==canvas)closePanel()},true);setTimeout(()=>{try{redraw()}catch{}},0);
})();
