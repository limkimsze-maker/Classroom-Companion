(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function'||typeof syncUi!=='function')return;
const edition=(new URLSearchParams(location.search).get('edition')||'en').toLowerCase();
const TXT={
 en:{title:'Drawn bracket label',placeholder:'Type label',apply:'Apply',del:'Delete bracket'},
 zh:{title:'手绘括号标签',placeholder:'输入标签',apply:'应用',del:'删除括号'},
 ms:{title:'Label kurungan dilukis',placeholder:'Taip label',apply:'Guna',del:'Padam kurungan'},
 ta:{title:'வரைந்த அடைப்புக்குறி பெயர்',placeholder:'பெயரை உள்ளிடவும்',apply:'பயன்படுத்து',del:'அடைப்புக்குறியை நீக்கு'}
};
const L=TXT[edition]||TXT.en;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const clone=v=>JSON.parse(JSON.stringify(v));
let panel=null,hot=[];
function closePanel(){if(panel){panel.remove();panel=null}}
function box(s){let minX=1,minY=1,maxX=0,maxY=0;for(const p of s?.points||[]){minX=Math.min(minX,p.x);minY=Math.min(minY,p.y);maxX=Math.max(maxX,p.x);maxY=Math.max(maxY,p.y)}return{x:minX,y:minY,w:Math.max(.001,maxX-minX),h:Math.max(.001,maxY-minY),cx:(minX+maxX)/2,cy:(minY+maxY)/2}}
function mergeRows(rows){rows.sort((a,b)=>a.y-b.y);const out=[];for(const r of rows){const last=out[out.length-1];if(last&&r.y<=last.y2+.018){last.y=Math.min(last.y,r.y);last.y2=Math.max(last.y2,r.y2)}else out.push({y:r.y,y2:r.y2})}return out}
function nearestPosition(cy,rows){let best={d:Infinity,pos:cy<.5?'top':'bottom'};for(const r of rows){const dt=Math.abs(cy-r.y),db=Math.abs(cy-r.y2);if(dt<best.d){best={d:dt,pos:cy<=r.y?'top':'bottom'}}if(db<best.d){best={d:db,pos:cy>=r.y2?'bottom':'top'}}}return best.pos}
function hideAuto(obj){
 if(!obj.barBracketState||typeof obj.barBracketState!=='object')obj.barBracketState={};
 const st=obj.barBracketState,n=Math.max(2,obj.barCount||2);
 if(obj.smartBarType==='partwhole'){
  if(!st.whole)st.whole={visible:false,label:''};else st.whole.visible=false;
  for(let i=0;i<n;i++){if(!st['p'+i])st['p'+i]={visible:false,label:''};else st['p'+i].visible=false}
 }else if(obj.smartBarType==='comparison'){
  for(let i=0;i<n;i++){if(!st['c'+i])st['c'+i]={visible:false,label:'',position:i%2?'bottom':'top'};else st['c'+i].visible=false}
 }
}
function detect(obj){
 if(obj.userDrawnBracketScan)return;
 obj.userDrawnBracketScan=true;
 if(obj.smartType!=='barModel'||!['partwhole','comparison'].includes(obj.smartBarType)||!Array.isArray(obj.smartOriginal)||!obj.smartOriginal.length)return;
 const ink=obj.smartOriginal.filter(s=>Array.isArray(s?.points)&&s.points.length&&!s.erase),bb=ink.map(s=>({s,b:box(s)}));
 const verts=[];
 for(const q of bb){const pw=q.b.w*cssW,ph=q.b.h*cssH;if(ph>=Math.max(14,pw*1.8))verts.push({y:q.b.y,y2:q.b.y+q.b.h})}
 const rows=mergeRows(verts);if(!rows.length)return;
 const found=[];
 for(const q of bb){const b=q.b,pw=b.w*cssW,ph=b.h*cssH;if(pw<55||pw<ph*3.2||ph>38)continue;
  let nearEdge=false;for(const r of rows){const d=Math.min(Math.abs(b.cy-r.y),Math.abs(b.cy-r.y2))*cssH;if(d<=12){nearEdge=true;break}if(b.cy>r.y&&b.cy<r.y2){nearEdge=true;break}}if(nearEdge)continue;
  const rx1=clamp((b.x-obj.x)/Math.max(.001,obj.w),0,1),rx2=clamp((b.x+b.w-obj.x)/Math.max(.001,obj.w),0,1),ry=clamp((b.cy-obj.y)/Math.max(.001,obj.h),0,1);
  if(rx2-rx1<.09)continue;
  found.push({id:'ub'+found.length,x1:rx1,x2:rx2,y:ry,position:nearestPosition(b.cy,rows),label:'',visible:true});
 }
 if(found.length){obj.userDrawnBrackets=found;hideAuto(obj)}
}
function curly(x1,x2,y,position,label,obj,entry){
 if(x2<x1)[x1,x2]=[x2,x1];const w=x2-x1,mid=(x1+x2)/2,end=clamp(w*.045,5,10),neck=clamp(w*.035,5,9),depth=entry?.isDifference?5:9,top=position==='top',endDir=entry?.isDifference?-1:(top?1:-1),notchDir=entry?.isDifference?1:(top?-1:1),labelDir=top?-1:1;
 ctx.save();ctx.strokeStyle='#111827';ctx.fillStyle='#111827';ctx.lineWidth=2;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(x1,y+endDir*depth);ctx.bezierCurveTo(x1,y+endDir*3,x1+2,y,x1+end,y);ctx.lineTo(mid-neck,y);ctx.bezierCurveTo(mid-neck*.35,y,mid-4,y+notchDir*2,mid,y+notchDir*depth);ctx.bezierCurveTo(mid+4,y+notchDir*2,mid+neck*.35,y,mid+neck,y);ctx.lineTo(x2-end,y);ctx.bezierCurveTo(x2-2,y,x2,y+endDir*3,x2,y+endDir*depth);ctx.stroke();if(label){ctx.font='700 14px Arial,sans-serif';ctx.textAlign='center';ctx.textBaseline=labelDir<0?'bottom':'top';ctx.fillText(label,mid,y+labelDir*14)}ctx.restore();
 hot.push({obj,entry,x1:x1-10,x2:x2+10,y1:y-27,y2:y+27});
}
function drawAll(){hot=[];for(const obj of strokes){if(!obj||obj.smartType!=='barModel')continue;detect(obj);if(!Array.isArray(obj.userDrawnBrackets)||!obj.userDrawnBrackets.length)continue;if(obj.smartBarType!=='comparison')hideAuto(obj);for(const b of obj.userDrawnBrackets){if(!b.visible)continue;const x1=(obj.x+obj.w*b.x1)*cssW,x2=(obj.x+obj.w*b.x2)*cssW,y=(obj.y+obj.h*b.y)*cssH;curly(x1,x2,y,b.position,b.label||'',obj,b)}}}
const priorRedraw=redraw;redraw=function(){priorRedraw();drawAll()};
function hit(clientX,clientY){const r=canvas.getBoundingClientRect(),x=(clientX-r.left)*(cssW/Math.max(1,r.width)),y=(clientY-r.top)*(cssH/Math.max(1,r.height));for(let i=hot.length-1;i>=0;i--){const h=hot[i];if(x>=h.x1&&x<=h.x2&&y>=h.y1&&y<=h.y2)return h}return null}
function button(text,cls){const b=document.createElement('button');b.type='button';b.className='btn '+(cls||'');b.textContent=text;b.style.cssText='min-height:32px;padding:5px 8px;font-size:11px;flex:1';return b}
function showPanel(h,clientX,clientY){closePanel();const obj=strokes.find(s=>s&&s.smartId===h.obj.smartId);if(!obj)return;const entry=obj.userDrawnBrackets?.find(b=>b.id===h.entry.id);if(!entry)return;panel=document.createElement('div');panel.style.cssText='position:fixed;z-index:10100;width:270px;padding:10px;background:#fff;border:1px solid #cfd9de;border-radius:13px;box-shadow:0 10px 28px rgba(23,50,77,.22);left:'+Math.min(innerWidth-278,Math.max(8,clientX-125))+'px;top:'+Math.min(innerHeight-135,Math.max(8,clientY+12))+'px';const title=document.createElement('div');title.textContent=L.title;title.style.cssText='font:900 12px Inter,system-ui,sans-serif;color:#17324d;margin-bottom:7px';const input=document.createElement('input');input.type='text';input.maxLength=30;input.placeholder=L.placeholder;input.value=entry.label||'';input.style.cssText='width:100%;border:1px solid #cfd9de;border-radius:9px;padding:7px 8px;font-size:12px;font-weight:700;color:#17324d;margin-bottom:7px';const row=document.createElement('div');row.style.cssText='display:flex;gap:6px';const apply=button(L.apply,'soft'),del=button(L.del,'danger');const commit=()=>{const o=strokes.find(s=>s&&s.smartId===obj.smartId);if(!o)return;window.__smartBarLastHistory={before:clone(strokes),afterId:o.smartId};const e=o.userDrawnBrackets?.find(b=>b.id===entry.id);if(e)e.label=input.value.trim();redraw();syncUi();closePanel()};apply.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();commit()},true);input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();commit()}else if(e.key==='Escape'){e.preventDefault();closePanel()}},true);del.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const o=strokes.find(s=>s&&s.smartId===obj.smartId);if(!o)return;window.__smartBarLastHistory={before:clone(strokes),afterId:o.smartId};const x=o.userDrawnBrackets?.find(b=>b.id===entry.id);if(x)x.visible=false;redraw();syncUi();closePanel()},true);row.append(apply,del);panel.append(title,input,row);document.body.appendChild(panel);setTimeout(()=>input.focus(),0)}
let down=null;canvas.addEventListener('pointerdown',e=>{const h=hit(e.clientX,e.clientY);if(!h)return;e.preventDefault();e.stopImmediatePropagation();down={h,x:e.clientX,y:e.clientY};canvas.style.cursor='pointer'},true);canvas.addEventListener('pointerup',e=>{if(!down)return;const d=down;down=null;e.preventDefault();e.stopImmediatePropagation();canvas.style.cursor='default';if(Math.hypot(e.clientX-d.x,e.clientY-d.y)<=8)showPanel(d.h,e.clientX,e.clientY)},true);canvas.addEventListener('click',e=>{const h=hit(e.clientX,e.clientY);if(!h)return;e.preventDefault();e.stopImmediatePropagation()},true);document.addEventListener('pointerdown',e=>{if(panel&&!panel.contains(e.target)&&e.target!==canvas)closePanel()},true);document.addEventListener('keydown',e=>{if(e.key==='Escape'){down=null;closePanel()}},true);setTimeout(()=>{try{redraw()}catch{}},0);
})();
