(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function'||typeof syncUi!=='function')return;
const edition=(new URLSearchParams(location.search).get('edition')||'en').toLowerCase();
const TXT={
 en:{title:'Bracket label',whole:'Whole label',part:'Part label',bar:'Bar bracket',name:'Bar name',placeholder:'Type label',apply:'Apply',del:'Delete bracket',clear:'Clear name',top:'Above',bottom:'Below',addName:'+ name'},
 zh:{title:'括号标签',whole:'整体标签',part:'部分标签',bar:'条形括号',name:'条形名称',placeholder:'输入标签',apply:'应用',del:'删除括号',clear:'清除名称',top:'上方',bottom:'下方',addName:'+ 名称'},
 ms:{title:'Label kurungan',whole:'Label keseluruhan',part:'Label bahagian',bar:'Kurungan bar',name:'Nama bar',placeholder:'Taip label',apply:'Guna',del:'Padam kurungan',clear:'Kosongkan nama',top:'Atas',bottom:'Bawah',addName:'+ nama'},
 ta:{title:'அடைப்புக்குறி பெயர்',whole:'முழு பெயர்',part:'பகுதி பெயர்',bar:'பார் அடைப்பு',name:'பார் பெயர்',placeholder:'பெயரை உள்ளிடவும்',apply:'பயன்படுத்து',del:'அடைப்புக்குறியை நீக்கு',clear:'பெயரை அழி',top:'மேல்',bottom:'கீழ்',addName:'+ பெயர்'}
};
const L=TXT[edition]||TXT.en;
const clone=v=>JSON.parse(JSON.stringify(v));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let panel=null,hot=[];
function closePanel(){if(panel){panel.remove();panel=null}}
function ensureState(obj){
 if(!obj.barBracketState||typeof obj.barBracketState!=='object')obj.barBracketState={};
 const st=obj.barBracketState,n=Math.max(2,obj.barCount||2);
 if(obj.smartBarType==='partwhole'||obj.smartBarType==='equal'){
  if(!st.whole)st.whole={visible:true,label:''};
  for(let i=0;i<n;i++)if(!st['p'+i])st['p'+i]={visible:true,label:''};
 }else if(obj.smartBarType==='comparison'){
  for(let i=0;i<n;i++){
   if(!st['c'+i])st['c'+i]={visible:true,label:'',position:i%2===0?'top':'bottom'};
   if(!st['c'+i].position)st['c'+i].position=i%2===0?'top':'bottom';
  }
  if(!Array.isArray(obj.barNames))obj.barNames=[];
  obj.barNames=obj.barNames.slice(0,n);while(obj.barNames.length<n)obj.barNames.push('');
 }
 return st;
}
function cutsFor(obj){const n=Math.max(2,obj.barCount||2);if(obj.smartBarType==='equal')return Array.from({length:n-1},(_,i)=>(i+1)/n);if(Array.isArray(obj.barCuts)&&obj.barCuts.length===n-1)return obj.barCuts.slice().sort((a,b)=>a-b);return Array.from({length:n-1},(_,i)=>(i+1)/n)}
function compWidths(obj){const n=Math.max(2,obj.barCount||2);if(Array.isArray(obj.barCompareWidths)&&obj.barCompareWidths.length>=n)return obj.barCompareWidths.slice(0,n).map(v=>clamp(Number(v)||.5,.16,1));return Array.from({length:n},(_,i)=>clamp(1-i*.11,.16,1))}
function curlyBrace(x1,x2,y,position,label,id,obj){
 if(x2<x1)[x1,x2]=[x2,x1];const w=x2-x1,mid=(x1+x2)/2,end=clamp(w*.045,5,10),neck=clamp(w*.035,5,9),depth=9;const top=position==='top';const endDir=top?1:-1,notchDir=top?-1:1,labelDir=top?-1:1;
 ctx.save();ctx.strokeStyle='#111827';ctx.fillStyle='#111827';ctx.lineWidth=2;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(x1,y+endDir*depth);ctx.bezierCurveTo(x1,y+endDir*3,x1+2,y,x1+end,y);ctx.lineTo(mid-neck,y);ctx.bezierCurveTo(mid-neck*.35,y,mid-4,y+notchDir*2,mid,y+notchDir*depth);ctx.bezierCurveTo(mid+4,y+notchDir*2,mid+neck*.35,y,mid+neck,y);ctx.lineTo(x2-end,y);ctx.bezierCurveTo(x2-2,y,x2,y+endDir*3,x2,y+endDir*depth);ctx.stroke();if(label){ctx.font='700 20px Arial,sans-serif';ctx.textAlign='center';ctx.textBaseline=labelDir<0?'bottom':'top';ctx.fillText(label,mid,y+labelDir*18)}ctx.restore();hot.push({obj,id,kind:'bracket',x1:x1-10,x2:x2+10,y1:y-32,y2:y+32});
}
function segmentInset(x1,x2){const w=Math.max(0,x2-x1),gap=Math.min(8,Math.max(3,w*.03));return[x1+gap,x2-gap]}
function geom(obj){return{left:(obj.x+obj.w*(60/900))*cssW,right:(obj.x+obj.w*(840/900))*cssW,top:(obj.y+obj.h*(90/300))*cssH,bottom:(obj.y+obj.h*(210/300))*cssH}}
function drawPartWhole(obj){const st=ensureState(obj),n=Math.max(2,obj.barCount||2),cuts=cutsFor(obj),bounds=[0,...cuts,1],g=geom(obj);if(st.whole?.visible)curlyBrace(g.left+2,g.right-2,g.top-30,'top',st.whole.label||'','whole',obj);for(let i=0;i<n;i++){const raw1=g.left+(g.right-g.left)*bounds[i],raw2=g.left+(g.right-g.left)*bounds[i+1],[x1,x2]=segmentInset(raw1,raw2),b=st['p'+i];if(b?.visible)curlyBrace(x1,x2,g.bottom+30,'bottom',b.label||'','p'+i,obj)}}
function drawEqual(obj){const st=ensureState(obj),n=Math.max(2,obj.barCount||2),cuts=cutsFor(obj),bounds=[0,...cuts,1],g=geom(obj);if(st.whole?.visible)curlyBrace(g.left+2,g.right-2,g.top-26,'top',st.whole.label||'','whole',obj);for(let i=0;i<n;i++){const raw1=g.left+(g.right-g.left)*bounds[i],raw2=g.left+(g.right-g.left)*bounds[i+1],[x1,x2]=segmentInset(raw1,raw2),b=st['p'+i];if(b?.visible)curlyBrace(x1,x2,g.bottom+28,'bottom',b.label||'','p'+i,obj)}}
function drawComparison(obj){
 const st=ensureState(obj),n=Math.max(2,obj.barCount||2),widths=compWidths(obj),H=Math.max(340,150+n*145),left=(obj.x+obj.w*(180/900))*cssW,maxSpan=obj.w*(650/900)*cssW,startY=60,rowGap=145,barH=76;
 for(let i=0;i<n;i++){
  const rowTop=(obj.y+obj.h*((startY+i*rowGap)/H))*cssH,rowBottom=(obj.y+obj.h*((startY+i*rowGap+barH)/H))*cssH,end=left+maxSpan*widths[i],b=st['c'+i];
  const name=obj.barNames?.[i]||'',nameX=left-18,nameY=(rowTop+rowBottom)/2;
  ctx.save();ctx.textAlign='right';ctx.textBaseline='middle';ctx.font=(name?'700':'700')+' 20px Arial,sans-serif';ctx.fillStyle=name?'#17324d':'#7c8ea3';ctx.fillText(name||L.addName,nameX,nameY);ctx.restore();
  hot.push({obj,id:'n'+i,kind:'name',x1:Math.max(0,nameX-180),x2:nameX+8,y1:nameY-25,y2:nameY+25});
  if(!b?.visible)continue;const [x1,x2]=segmentInset(left,end),pos=b.position==='bottom'?'bottom':'top',y=pos==='top'?rowTop-28:rowBottom+28;curlyBrace(x1,x2,y,pos,b.label||'','c'+i,obj);
 }
}
function drawAll(){hot=[];for(const obj of strokes){if(!obj||obj.smartType!=='barModel'||!obj.w||!obj.h)continue;if(obj.smartBarType==='partwhole')drawPartWhole(obj);else if(obj.smartBarType==='equal')drawEqual(obj);else if(obj.smartBarType==='comparison')drawComparison(obj)}}
const priorRedraw=redraw;redraw=function(){priorRedraw();drawAll()};
function hitItem(clientX,clientY){const r=canvas.getBoundingClientRect(),x=(clientX-r.left)*(cssW/Math.max(1,r.width)),y=(clientY-r.top)*(cssH/Math.max(1,r.height));for(let i=hot.length-1;i>=0;i--){const h=hot[i];if(x>=h.x1&&x<=h.x2&&y>=h.y1&&y<=h.y2)return h}return null}
function panelTitle(h){if(h.kind==='name')return `${L.name} ${Number(h.id.slice(1))+1}`;if(h.id==='whole')return L.whole;if(/^p\d+$/.test(h.id))return `${L.part} ${Number(h.id.slice(1))+1}`;if(/^c\d+$/.test(h.id))return `${L.bar} ${Number(h.id.slice(1))+1}`;return L.title}
function button(text,cls){const b=document.createElement('button');b.type='button';b.className='btn '+(cls||'');b.textContent=text;b.style.cssText='min-height:32px;padding:5px 8px;font-size:11px;flex:1';return b}
function showPanel(h,clientX,clientY){
 closePanel();const obj=strokes.find(s=>s&&s.smartId===h.obj.smartId);if(!obj)return;const st=ensureState(obj),isName=h.kind==='name',idx=isName?Number(h.id.slice(1)):-1,entry=isName?null:st[h.id];if(!isName&&!entry)return;
 panel=document.createElement('div');panel.style.cssText='position:fixed;z-index:10080;width:270px;padding:10px;background:#fff;border:1px solid #cfd9de;border-radius:13px;box-shadow:0 10px 28px rgba(23,50,77,.22);left:'+Math.min(innerWidth-278,Math.max(8,clientX-125))+'px;top:'+Math.min(innerHeight-170,Math.max(8,clientY+12))+'px';
 const title=document.createElement('div');title.textContent=panelTitle(h);title.style.cssText='font:900 12px Inter,system-ui,sans-serif;color:#17324d;margin-bottom:7px';
 const input=document.createElement('input');input.type='text';input.maxLength=30;input.placeholder=L.placeholder;input.value=isName?(obj.barNames?.[idx]||''):(entry.label||'');input.style.cssText='width:100%;border:1px solid #cfd9de;border-radius:9px;padding:7px 8px;font-size:12px;font-weight:700;color:#17324d;margin-bottom:7px';panel.append(title,input);
 if(!isName&&obj.smartBarType==='comparison'&&/^c\d+$/.test(h.id)){
  const posRow=document.createElement('div');posRow.style.cssText='display:flex;gap:6px;margin-bottom:7px';const top=button('↑ '+L.top,'soft'),bottom=button('↓ '+L.bottom,'soft');
  const mark=()=>{top.classList.toggle('active',entry.position!=='bottom');bottom.classList.toggle('active',entry.position==='bottom')};mark();
  top.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();entry.position='top';mark();redraw()},true);bottom.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();entry.position='bottom';mark();redraw()},true);posRow.append(top,bottom);panel.appendChild(posRow);
 }
 const row=document.createElement('div');row.style.cssText='display:flex;gap:6px';const apply=button(L.apply,'soft'),del=button(isName?L.clear:L.del,'danger');
 const commit=()=>{const o=strokes.find(s=>s&&s.smartId===h.obj.smartId);if(!o)return;window.__smartBarLastHistory={before:clone(strokes),afterId:o.smartId};ensureState(o);if(isName)o.barNames[idx]=input.value.trim();else o.barBracketState[h.id].label=input.value.trim();redraw();syncUi();closePanel()};
 apply.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();commit()},true);input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();commit()}else if(e.key==='Escape'){e.preventDefault();closePanel()}},true);
 del.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const o=strokes.find(s=>s&&s.smartId===h.obj.smartId);if(!o)return;window.__smartBarLastHistory={before:clone(strokes),afterId:o.smartId};ensureState(o);if(isName)o.barNames[idx]='';else o.barBracketState[h.id].visible=false;redraw();syncUi();closePanel()},true);row.append(apply,del);panel.appendChild(row);document.body.appendChild(panel);setTimeout(()=>input.focus(),0)
}
let itemDown=null;canvas.addEventListener('pointerdown',e=>{const h=hitItem(e.clientX,e.clientY);if(!h)return;e.preventDefault();e.stopImmediatePropagation();itemDown={h,x:e.clientX,y:e.clientY};canvas.style.cursor='pointer'},true);canvas.addEventListener('pointerup',e=>{if(!itemDown)return;const b=itemDown;itemDown=null;e.preventDefault();e.stopImmediatePropagation();canvas.style.cursor='default';if(Math.hypot(e.clientX-b.x,e.clientY-b.y)<=8)showPanel(b.h,e.clientX,e.clientY)},true);canvas.addEventListener('click',e=>{const h=hitItem(e.clientX,e.clientY);if(!h)return;e.preventDefault();e.stopImmediatePropagation()},true);document.addEventListener('pointerdown',e=>{if(panel&&!panel.contains(e.target))closePanel()},true);document.addEventListener('keydown',e=>{if(e.key==='Escape'){itemDown=null;closePanel()}},true);setTimeout(()=>{try{redraw()}catch{}},0);
})();
