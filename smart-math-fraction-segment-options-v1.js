(function(){
'use strict';
// Beta V2 only. Fraction decorations never mutate Comparison Bar Model objects.
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function'||typeof syncUi!=='function')return;
const wrap=document.getElementById('boardWrap');
if(!wrap)return;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const clone=x=>JSON.parse(JSON.stringify(x));
const palette=[['','Keep existing'],['#ffffff','White'],['#dc2626','Red'],['#2563eb','Blue'],['#facc15','Yellow'],['#15803d','Green'],['#7c3aed','Purple'],['#f97316','Orange'],['#fde68a','Light yellow'],['#93c5fd','Light blue'],['#86efac','Light green']];
let panel=null,drag=null,preview=null,raf=0,selectedId='';
const zones=new Map();
const ov=document.createElement('canvas');
ov.id='smartFractionDecorationOverlay';
ov.setAttribute('aria-hidden','true');
ov.style.cssText='position:absolute;pointer-events:none;z-index:940;';
wrap.appendChild(ov);
const g=ov.getContext('2d');
function notify(message){if(typeof say==='function'){try{say(message);return}catch(e){}}const t=document.getElementById('toast');if(t){t.textContent=message;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1500)}}
function models(){return strokes.filter(o=>o&&o.smartType==='fractionBar'&&Number.isFinite(o.x)&&Number.isFinite(o.y)&&o.w>0&&o.h>0&&Number(o.fractionParts)>=2)}
function find(id){return models().find(o=>o.smartId===id)}
function count(o){return clamp(Math.round(Number(o.fractionParts)||2),2,12)}
function labels(o){return Array.isArray(o.fractionSegmentLabels)?o.fractionSegmentLabels:[]}
function brackets(o){return Array.isArray(o.fractionBrackets)?o.fractionBrackets:[]}
function bounds(o,i,W,H){
 const n=count(o);
 if(o.fractionHorizontal!==false)return{x:o.x*W+i*o.w*W/n,y:o.y*H,w:o.w*W/n,h:o.h*H};
 return{x:o.x*W,y:o.y*H+i*o.h*H/n,w:o.w*W,h:o.h*H/n};
}
function span(o,from,to,W,H){
 const a=bounds(o,from,W,H),b=bounds(o,to,W,H);
 return {x:a.x,y:a.y,w:o.fractionHorizontal!==false?b.x+b.w-a.x:a.w,h:o.fractionHorizontal!==false?a.h:b.y+b.h-a.y};
}
function geometry(){const c=canvas.getBoundingClientRect(),w=wrap.getBoundingClientRect(),d=Math.min(2,window.devicePixelRatio||1);
 const width=Math.max(1,c.width),height=Math.max(1,c.height),left=c.left-w.left,top=c.top-w.top;
 const pw=Math.round(width*d),ph=Math.round(height*d);
 if(ov.width!==pw)ov.width=pw;if(ov.height!==ph)ov.height=ph;
 ov.style.left=left+'px';ov.style.top=top+'px';ov.style.width=width+'px';ov.style.height=height+'px';
 g.setTransform(d,0,0,d,0,0);
 return {W:width,H:height,ox:left,oy:top};
}
function fitText(text,x,y,maxW,baseSize=18){
 const t=String(text||'');if(!t)return;
 let size=Math.min(baseSize,Math.max(11,maxW*.38));
 g.save();g.font='700 '+size+'px Arial,system-ui,sans-serif';
 while(size>10&&g.measureText(t).width>Math.max(16,maxW-8)){size--;g.font='700 '+size+'px Arial,system-ui,sans-serif'}
 g.textAlign='center';g.textBaseline='middle';g.lineWidth=3;g.lineJoin='round';
 g.strokeStyle='rgba(255,255,255,.95)';g.fillStyle='#17324d';
 g.strokeText(t,x,y,Math.max(16,maxW-8));g.fillText(t,x,y,Math.max(16,maxW-8));g.restore();
}
function braceX(x1,x2,y,top,label){
 if(x2<x1){const t=x1;x1=x2;x2=t}
 const w=Math.max(16,x2-x1),m=(x1+x2)/2,hook=clamp(w*.07,4,10),neck=clamp(w*.04,4,9),dep=8,dir=top?1:-1;
 g.save();g.strokeStyle='#111827';g.fillStyle='#111827';g.lineWidth=2.1;g.lineCap='round';g.lineJoin='round';g.beginPath();
 g.moveTo(x1,y+dir*dep);g.bezierCurveTo(x1,y+dir*2,x1+2,y,x1+hook,y);
 g.lineTo(m-neck,y);g.bezierCurveTo(m-neck*.4,y,m-4,y-dir*2,m,y-dir*dep);
 g.bezierCurveTo(m+4,y-dir*2,m+neck*.4,y,m+neck,y);
 g.lineTo(x2-hook,y);g.bezierCurveTo(x2-2,y,x2,y+dir*2,x2,y+dir*dep);g.stroke();
 g.restore();if(label)fitText(label,m,y+(top?-23:24),Math.max(w,60),18);
}
function braceY(x,y1,y2,left,label){
 if(y2<y1){const t=y1;y1=y2;y2=t}
 const h=Math.max(16,y2-y1),m=(y1+y2)/2,hook=clamp(h*.07,4,10),neck=clamp(h*.04,4,9),dep=9,dir=left?1:-1;
 g.save();g.strokeStyle='#111827';g.fillStyle='#111827';g.lineWidth=2.1;g.lineCap='round';g.lineJoin='round';g.beginPath();
 g.moveTo(x+dir*dep,y1);g.bezierCurveTo(x+dir*3,y1,x,y1+2,x,y1+hook);
 g.lineTo(x,m-neck);g.bezierCurveTo(x,m-neck*.4,x-dir*3,m-3,x-dir*dep,m);
 g.bezierCurveTo(x-dir*3,m+3,x,m+neck*.4,x,m+neck);
 g.lineTo(x,y2-hook);g.bezierCurveTo(x,y2-2,x+dir*3,y2,x+dir*dep,y2);g.stroke();g.restore();
 if(label)fitText(label,x+(left?-35:35),m,Math.max(60,Math.min(135,h*.9)),17);
}
function bracketRect(o,b,W,H){
 const q=span(o,b.start,b.end,W,H),primary=b.side==='top';
 if(o.fractionHorizontal!==false)return {x:q.x,y:primary?q.y-15:q.y+q.h+15,w:q.w,h:0,primary};
 return {x:primary?q.x-15:q.x+q.w+15,y:q.y,w:0,h:q.h,primary};
}
function draw(){
 const {W,H}=geometry();g.clearRect(0,0,W,H);
 for(const o of models()){
   for(const item of labels(o)){
     if(!item||!item.text)continue;
     const a=clamp(Math.round(Number(item.start)||0),0,count(o)-1),b=clamp(Math.round(Number(item.end)||0),a,count(o)-1),q=span(o,a,b,W,H);
     fitText(item.text,q.x+q.w/2,q.y+q.h/2,q.w,Math.min(19,q.h*.55));
   }
   for(const b of brackets(o)){
     if(!b||b.visible===false||!Number.isInteger(b.start)||!Number.isInteger(b.end)||b.start<0||b.end>=count(o)||b.end<b.start)continue;
     const q=bracketRect(o,b,W,H);
     if(o.fractionHorizontal!==false)braceX(q.x+2,q.x+q.w-2,q.y,q.primary,b.label);
     else braceY(q.x,q.y+2,q.y+q.h-2,q.primary,b.label);
   }
 }
 if(preview){
   const o=find(preview.id);
   if(o){const q=span(o,preview.start,preview.end,W,H);g.save();g.fillStyle='rgba(37,99,235,.12)';g.strokeStyle='#2563eb';g.lineWidth=2;g.setLineDash([5,4]);g.fillRect(q.x+2,q.y+2,Math.max(1,q.w-4),Math.max(1,q.h-4));g.strokeRect(q.x+2,q.y+2,Math.max(1,q.w-4),Math.max(1,q.h-4));g.restore()}
 }
}
function schedule(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;draw();buildZones()})}
function close(){if(panel){panel.remove();panel=null}preview=null;schedule()}
function selectInput(options,value){
 const s=document.createElement('select');
 s.style.cssText='height:36px;border:1px solid #cbd5df;border-radius:9px;background:white;color:#17324d;padding:0 8px;font:700 12px system-ui;min-width:0;width:100%';
 for(const [key,text] of options){const option=document.createElement('option');option.value=String(key);option.textContent=text;s.appendChild(option)}
 s.value=String(value);return s;
}
function btn(text,variant=''){const b=document.createElement('button');b.type='button';b.className='btn '+variant;b.textContent=text;b.style.cssText='min-height:36px;flex:1;font-size:12px';return b}
function input(placeholder,value){const x=document.createElement('input');x.type='text';x.maxLength=40;x.placeholder=placeholder;x.value=value||'';x.style.cssText='min-height:36px;width:100%;border:1px solid #cbd5df;border-radius:9px;padding:6px 9px;color:#17324d;font:700 12px system-ui';return x}
function makePanel(title,x,y){
 close();
 const p=document.createElement('div');panel=p;p.id='smartFractionOptionsPanel';p.setAttribute('role','dialog');p.setAttribute('aria-label',title);
 p.style.cssText='position:fixed;z-index:14000;width:min(330px,calc(100vw - 16px));max-height:calc(100dvh - 20px);overflow:auto;padding:12px;background:#fff;color:#17324d;border:1px solid #cbd5df;border-radius:13px;box-shadow:0 12px 38px rgba(23,50,77,.27);';
 p.style.left=clamp(x-160,8,Math.max(8,window.innerWidth-344))+'px';p.style.top=clamp(y+12,8,Math.max(8,window.innerHeight-380))+'px';
 const heading=document.createElement('div');heading.textContent=title;heading.style.cssText='font:900 14px system-ui;margin-bottom:10px';
 const exit=btn('×');exit.setAttribute('aria-label','Close fraction options');exit.style.cssText='position:absolute;right:8px;top:7px;width:30px;min-height:30px;padding:0;flex:none';exit.addEventListener('click',e=>{e.stopPropagation();close()});
 p.append(heading,exit);document.body.appendChild(p);return p;
}
function row(p,label,control){
 const r=document.createElement('label');r.style.cssText='display:grid;grid-template-columns:92px minmax(0,1fr);gap:8px;align-items:center;margin:7px 0';
 const t=document.createElement('span');t.textContent=label;t.style.cssText='font:800 11px system-ui';r.append(t,control);p.append(r);return r;
}
function bottomActions(p,...buttons){const r=document.createElement('div');r.style.cssText='display:flex;gap:7px;margin-top:9px';r.append(...buttons);p.append(r)}
function remember(o,before){
 if(window.ClassroomFractionBars&&typeof window.ClassroomFractionBars.recordEdit==='function')window.ClassroomFractionBars.recordEdit(before,o.smartId);
 else window.__smartBarLastHistory={before,afterId:o.smartId};
}
function mutate(id,fn){
 const o=find(id);if(!o)return false;
 const before=clone(strokes);fn(o);
 remember(o,before);redraw();syncUi();schedule();return true;
}
function setLabel(o,start,end,label){
 const list=labels(o),idx=list.findIndex(a=>a.start===start&&a.end===end),value=String(label||'').trim();
 if(idx>=0){if(value)list[idx].text=value;else list.splice(idx,1)}
 else if(value)list.push({start,end,text:value});
 o.fractionSegmentLabels=list;
}
function setBracket(o,start,end,side,label){
 const list=brackets(o),idx=list.findIndex(b=>b.start===start&&b.end===end&&b.side===side);
 if(idx>=0){list[idx].label=String(label||'').trim();list[idx].visible=true}
 else list.push({id:'fb-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),start,end,side,label:String(label||'').trim(),visible:true});
 o.fractionBrackets=list;
}
function showPlacement(id,start,end,x,y){
 const o=find(id);if(!o)return;
 selectedId=id;
 start=clamp(Math.round(start),0,count(o)-1);end=clamp(Math.round(end),start,count(o)-1);
 const p=makePanel('Fraction bar · segment options',x,y);
 const selected=document.createElement('div');
 selected.textContent=start===end?'Part '+(start+1)+' selected':'Parts '+(start+1)+'–'+(end+1)+' selected';
 selected.style.cssText='font:800 12px system-ui;color:#0f766e;padding:7px 10px;background:#eef8f6;border-radius:8px;margin-bottom:9px';
 p.append(selected);preview={id,start,end};schedule();
 const group=labels(o).find(a=>a.start===start&&a.end===end);
 const lab=input('Optional text inside bar',group?.text||'');row(p,'Inside label',lab);
 const col=selectInput(palette,'');row(p,'Colour',col);
 const colourTarget=selectInput([['selected','Selected segments'],['all','Whole fraction bar']],'selected');
 row(p,'Apply colour to',colourTarget);
 const apply=side=>{
   const c=col.value;
   mutate(id,obj=>{
     if(c){
       obj.fractionFills=Array.from({length:count(obj)},(_,i)=>obj.fractionFills?.[i]||'#ffffff');
       for(let i=0;i<count(obj);i++)if(colourTarget.value==='all'||i>=start&&i<=end)obj.fractionFills[i]=c;
       window.ClassroomFractionBars?.refresh?.(obj);
     }
     setLabel(obj,start,end,lab.value);
     if(side)setBracket(obj,start,end,side,'');
   });
   close();notify(side?'Bracket added · tap the bracket to label it':'Fraction colour / label applied');
 };
 const only=btn('Apply colour / label','soft');p.append(only);
 only.style.cssText+='width:100%;margin-top:7px';only.addEventListener('click',()=>apply(null));
 const t=document.createElement('div');t.textContent='Optional bracket · tap it afterwards to add a label';
 t.style.cssText='font:800 11px system-ui;color:#667085;margin:11px 0 5px';p.append(t);
 const above=btn(o.fractionHorizontal!==false?'↑ Above':'← Left','soft'),
       below=btn(o.fractionHorizontal!==false?'↓ Below':'→ Right','soft');
 bottomActions(p,above,below);
 above.addEventListener('click',()=>apply('top'));below.addEventListener('click',()=>apply('bottom'));
}
function showBracket(id,bracketId,x,y){
 selectedId=id;
 const o=find(id),b=brackets(o||{}).find(t=>t.id===bracketId);if(!o||!b)return;
 const p=makePanel('Edit fraction bracket',x,y);
 const lab=input('Bracket label',b.label);row(p,'Bracket label',lab);
 const positions=o.fractionHorizontal!==false?[['top','Above'],['bottom','Below']]:[['top','Left'],['bottom','Right']];
 const side=selectInput(positions,b.side);row(p,'Position',side);
 const save=btn('Apply','soft'),del=btn('Delete bracket','danger');
 bottomActions(p,save,del);
 save.addEventListener('click',()=>{mutate(id,obj=>{const v=brackets(obj).find(t=>t.id===bracketId);if(v){v.label=lab.value.trim();v.side=side.value}});close()});
 del.addEventListener('click',()=>{mutate(id,obj=>{obj.fractionBrackets=brackets(obj).filter(t=>t.id!==bracketId)});close();notify('Fraction bracket deleted')});
 lab.addEventListener('keydown',e=>{if(e.key==='Enter')save.click();if(e.key==='Escape')close()});
}
function makeZone(key,aria){
 let z=zones.get(key);
 if(!z){z=document.createElement('button');z.type='button';z.setAttribute('aria-label',aria);
 z.style.cssText='position:absolute;border:0;padding:0;background:transparent;z-index:1220;touch-action:none;cursor:pointer;';
 wrap.appendChild(z);zones.set(key,z)}
 return z;
}
function buildZones(){
 if(drag)return;
 const a=canvas.getBoundingClientRect(),r=wrap.getBoundingClientRect();
 const W=Math.max(1,a.width),H=Math.max(1,a.height),seen=new Set(),enabled=typeof tool==='undefined'||tool==='select';
 if(enabled&&!panel){
  for(const o of models()){
   for(let i=0;i<count(o);i++){
     const rect=bounds(o,i,W,H),key='s'+o.smartId+':'+i,z=makeZone(key,'Select fraction segment '+(i+1));
     seen.add(key);
     const gap=clamp(Math.min(rect.w,rect.h)*.13,4,8);
     z.style.left=(a.left-r.left+rect.x+gap)+'px';z.style.top=(a.top-r.top+rect.y+gap)+'px';
     z.style.width=Math.max(8,rect.w-2*gap)+'px';z.style.height=Math.max(8,rect.h-2*gap)+'px';
     z.style.display='block';z.title='Tap for segment options, or drag over adjacent segments';z.style.cursor='pointer';
     z.onpointerdown=e=>{if(e.button!==undefined&&e.button!==0)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
       selectedId=o.smartId;drag={kind:'segments',id:o.smartId,first:i,last:i,pointerId:e.pointerId,zone:z};preview={id:o.smartId,start:i,end:i};
       try{z.setPointerCapture(e.pointerId)}catch(err){}
       schedule();
     };
     z.onpointermove=e=>{if(!drag||drag.kind!=='segments'||drag.zone!==z)return;
       const rr=canvas.getBoundingClientRect(),pos=o.fractionHorizontal!==false?(e.clientX-rr.left)/Math.max(1,rr.width):(e.clientY-rr.top)/Math.max(1,rr.height);
       const local=o.fractionHorizontal!==false?(pos-o.x)/o.w:(pos-o.y)/o.h;
       drag.last=clamp(Math.floor(local*count(o)),0,count(o)-1);
       preview={id:drag.id,start:Math.min(drag.first,drag.last),end:Math.max(drag.first,drag.last)};schedule();
       e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
     };
     z.onpointerup=e=>{if(!drag||drag.kind!=='segments'||drag.zone!==z)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
       const d=drag;drag=null;try{z.releasePointerCapture(e.pointerId)}catch(err){}
       showPlacement(d.id,Math.min(d.first,d.last),Math.max(d.first,d.last),e.clientX,e.clientY);
     };
     z.onpointercancel=()=>{drag=null;preview=null;schedule()};
     z.onclick=e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()};
   }
   for(const b of brackets(o)){
     if(!b||b.visible===false||b.start<0||b.end>=count(o))continue;
     const rect=bracketRect(o,b,W,H),key='b'+o.smartId+':'+b.id,z=makeZone(key,'Edit fraction bracket');
     const pad=10;seen.add(key);
     z.style.left=(a.left-r.left+rect.x-pad)+'px';z.style.top=(a.top-r.top+rect.y-pad)+'px';
     z.style.width=Math.max(20,rect.w+pad*2)+'px';z.style.height=Math.max(20,rect.h+pad*2)+'px';
     z.style.zIndex='1230';z.style.display='block';
     z.onpointerdown=e=>{if(e.button!==undefined&&e.button!==0)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();showBracket(o.smartId,b.id,e.clientX,e.clientY)};
     z.onclick=e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()};
   }
  }
 }
 for(const [key,z] of zones)if(!seen.has(key)){z.remove();zones.delete(key)}
}
const previousRedraw=redraw;
redraw=function(){previousRedraw();schedule()};
window.addEventListener('resize',schedule);
if(typeof ResizeObserver!=='undefined')new ResizeObserver(schedule).observe(wrap);
document.addEventListener('whiteboard-annotation-context',()=>{close();drag=null;selectedId='';schedule()},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'){close();drag=null;selectedId='';schedule()}},true);
document.addEventListener('pointerdown',e=>{if(panel&&!panel.contains(e.target)&&!e.target.closest?.('[id="smartFractionDecorationOverlay"]'))close()},true);
window.ClassroomFractionSegmentOptions={getState:id=>{const o=find(id);return o?{labels:clone(labels(o)),brackets:clone(brackets(o)),fills:clone(o.fractionFills||[])}:null},open:showPlacement,select:id=>{if(find(id)){selectedId=id;schedule()}},selected:()=>selectedId};
schedule();
})();