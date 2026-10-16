(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function'||typeof syncUi!=='function')return;
const smartBtn=document.getElementById('smartMathBtn');if(!smartBtn)return;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const clone=v=>JSON.parse(JSON.stringify(v));
const uid=()=>`smb-pw-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
const edition=(new URLSearchParams(location.search).get('edition')||'en').toLowerCase();
const SMART={en:'✨ Smart Math',zh:'✨ 智能数学',ms:'✨ Matematik Pintar',ta:'✨ நுண்ணறிவு கணிதம்'};
let sessionStart=strokes.length;
function ink(s){return !!(s&&Array.isArray(s.points)&&s.points.length&&!s.erase&&!s.background)}
function box(s){let minX=1,minY=1,maxX=0,maxY=0;for(const p of s.points||[]){minX=Math.min(minX,p.x);minY=Math.min(minY,p.y);maxX=Math.max(maxX,p.x);maxY=Math.max(maxY,p.y)}return{x:minX,y:minY,w:Math.max(.001,maxX-minX),h:Math.max(.001,maxY-minY),cx:(minX+maxX)/2,cy:(minY+maxY)/2}}
function groupBox(arr){let minX=1,minY=1,maxX=0,maxY=0;for(const s of arr){const b=box(s);minX=Math.min(minX,b.x);minY=Math.min(minY,b.y);maxX=Math.max(maxX,b.x+b.w);maxY=Math.max(maxY,b.y+b.h)}return{x:minX,y:minY,w:Math.max(.001,maxX-minX),h:Math.max(.001,maxY-minY),cx:(minX+maxX)/2,cy:(minY+maxY)/2}}
function dedupe(vals,tol){vals.sort((a,b)=>a-b);const out=[];for(const v of vals)if(!out.length||Math.abs(v-out[out.length-1])>tol)out.push(v);return out}
function modelBox(group){
 const raw=groupBox(group),items=group.map(s=>({s,b:box(s)}));
 const wide=items.filter(o=>o.b.w*cssW>=Math.max(70,raw.w*cssW*.42)).sort((a,b)=>b.b.w-a.b.w);
 // A teacher often draws the whole outer bar as one rough continuous stroke.
 // If so, trust that stroke's box and ignore divider overshoot.
 if(wide.length){const b=wide[0].b,ph=b.h*cssH,pw=b.w*cssW;if(pw>=80&&ph>=14&&pw>=ph*1.7)return b}
 // Otherwise use two long, roughly horizontal strokes as the top/bottom band.
 let best=null;
 for(let i=0;i<wide.length;i++)for(let j=i+1;j<wide.length;j++){
  const a=wide[i].b,b=wide[j].b,sep=Math.abs(a.cy-b.cy)*cssH;if(sep<10||sep>230)continue;
  const overlap=Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*cssW;if(overlap<45)continue;
  const score=overlap-sep*.05;if(!best||score>best.score)best={score,a,b};
 }
 if(best){const left=Math.min(best.a.x,best.b.x),right=Math.max(best.a.x+best.a.w,best.b.x+best.b.w),top=Math.min(best.a.cy,best.b.cy),bottom=Math.max(best.a.cy,best.b.cy);return{x:left,y:top,w:Math.max(.001,right-left),h:Math.max(.025,bottom-top),cx:(left+right)/2,cy:(top+bottom)/2}}
 return raw;
}
function inferCuts(group,b){
 const gw=Math.max(1,b.w*cssW),gh=Math.max(1,b.h*cssH),xs=[];
 for(const s of group){const q=box(s),pw=q.w*cssW,ph=q.h*cssH,rx=(q.cx-b.x)/Math.max(.001,b.w);if(rx<=.045||rx>=.955)continue;
  // Very forgiving divider test: short, slanted and overshooting dividers all count.
  const narrow=pw<=Math.max(52,gw*.17),tallEnough=ph>=Math.max(7,Math.min(18,gh*.12)),verticalish=ph>=pw*.32;
  if(tallEnough&&(narrow||verticalish))xs.push(q.cx)
 }
 return dedupe(xs,Math.max(.012,b.w*.035)).slice(0,7).map(x=>clamp((x-b.x)/Math.max(.001,b.w),.04,.96)).sort((a,b)=>a-b)
}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]))}
function makeSrc(count,cuts){const W=900,H=300,x=60,y=90,w=780,h=120,stroke='#17324d',bounds=[0,...cuts,1],els=[];for(let i=0;i<count;i++){const left=x+w*bounds[i],right=x+w*bounds[i+1];els.push(`<rect x="${left}" y="${y}" width="${right-left}" height="${h}" fill="#ffffff"/>`)}els.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="none" stroke="${stroke}" stroke-width="8"/>`);for(const r of cuts){const px=x+w*r;els.push(`<line x1="${px}" y1="${y}" x2="${px}" y2="${y+h}" stroke="${stroke}" stroke-width="7"/>`)}return'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${els.join('')}</svg>`)}
function finishPartWhole(){
 let group=strokes.slice(sessionStart).filter(ink);
 // If another smart-math helper flagged a recent pen stroke, still trust the latest rough drawing.
 if(!group.length){const tail=strokes.filter(ink).slice(-16),tb=tail.length?groupBox(tail):null;if(tb&&tb.w*cssW>=55&&tb.w*cssW>=tb.h*cssH*1.25)group=tail}
 if(!group.length)return false;
 const raw=groupBox(group);if(raw.w*cssW<45)return false;
 const b=modelBox(group),cuts=inferCuts(group,b),count=clamp(cuts.length+1,2,8),before=clone(strokes),set=new Set(group);
 strokes=strokes.filter(s=>!set.has(s));
 const obj={type:'image',src:makeSrc(count,cuts),x:clamp(b.x,0,.94),y:clamp(b.y,0,.94),w:clamp(b.w,.12,1-b.x),h:clamp(Math.max(b.h,.08),.08,1-b.y),smartGenerated:true,smartType:'barModel',smartBarType:'partwhole',smartId:uid(),barCount:count,barCuts:cuts,barFills:Array(count).fill('#ffffff'),barLabels:Array(count).fill(''),smartOriginal:clone(group)};
 strokes.push(obj);window.__smartBarLastHistory={before,afterId:obj.smartId};redraw();try{tool='select'}catch{}syncUi();
 return true
}
document.addEventListener('click',e=>{
 const el=e.target instanceof Element?e.target:null;if(!el)return;
 const menu=el.closest('#smartBarTypeMenu');if(menu){setTimeout(()=>{if(window.__smartBarType==='partwhole')sessionStart=strokes.length},0);return}
 const finish=smartBtn.nextElementSibling;if(el!==finish||window.__smartBarType!=='partwhole')return;
 if(!finishPartWhole())return;
 e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
 finish.style.display='none';smartBtn.textContent=SMART[edition]||SMART.en;smartBtn.title=smartBtn.textContent;smartBtn.classList.remove('active');smartBtn.classList.add('soft');window.__smartBarType='';
 if(typeof say==='function')say('Part–Whole bar model created');
},true);
})();