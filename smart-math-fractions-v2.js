(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function'||typeof syncUi!=='function')return;

const edition=(new URLSearchParams(location.search).get('edition')||'en').toLowerCase();
const TXT={
 en:{fraction:'Fraction Bar',active:'✨ Smart Math · Fraction Bar · Pen',finish:'✓ Finished fraction?',draw:'Draw the fraction bar, then click “Finished fraction?”.',no:'I could not identify a fraction bar yet.',made:'fraction bar created'},
 zh:{fraction:'分数条',active:'✨ 智能数学 · 分数条 · 画笔',finish:'✓ 分数条画完了吗？',draw:'画好分数条后，点击“分数条画完了吗？”。',no:'暂时无法识别分数条。',made:'已创建分数条'},
 ms:{fraction:'Bar Pecahan',active:'✨ Matematik Pintar · Bar Pecahan · Pen',finish:'✓ Siap bar pecahan?',draw:'Lukis bar pecahan, kemudian klik “Siap bar pecahan?”.',no:'Bar pecahan belum dapat dikenal pasti.',made:'bar pecahan dicipta'},
 ta:{fraction:'பின்னப் பட்டை',active:'✨ நுண்ணறிவு கணிதம் · பின்னப் பட்டை · பேனா',finish:'✓ பின்னப் பட்டை முடிந்ததா?',draw:'பின்னப் பட்டையை வரைந்து முடித்ததும் “முடிந்ததா?” என்பதைக் கிளிக் செய்யவும்.',no:'பின்னப் பட்டையை இன்னும் அடையாளம் காண முடியவில்லை.',made:'பின்னப் பட்டை உருவாக்கப்பட்டது'}
};
const L=TXT[edition]||TXT.en;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const clone=v=>JSON.parse(JSON.stringify(v));
const uid=()=>`smf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
let active=false,startIndex=0,doneBtn=null,lastHistory=null,baseLabel='';

function notify(msg){if(typeof say==='function')say(msg);else{const t=document.getElementById('toast');if(t){t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1600)}}}
function rawInk(s){return !!(s&&Array.isArray(s.points)&&s.points.length&&!s.erase&&!s.smartGenerated&&!s.background)}
function box(s){let minX=1,minY=1,maxX=0,maxY=0;for(const p of s.points||[]){minX=Math.min(minX,p.x);minY=Math.min(minY,p.y);maxX=Math.max(maxX,p.x);maxY=Math.max(maxY,p.y)}return{x:minX,y:minY,w:Math.max(.001,maxX-minX),h:Math.max(.001,maxY-minY),cx:(minX+maxX)/2,cy:(minY+maxY)/2}}
function groupBox(arr){let minX=1,minY=1,maxX=0,maxY=0;for(const s of arr){const b=box(s);minX=Math.min(minX,b.x);minY=Math.min(minY,b.y);maxX=Math.max(maxX,b.x+b.w);maxY=Math.max(maxY,b.y+b.h)}return{x:minX,y:minY,w:Math.max(.001,maxX-minX),h:Math.max(.001,maxY-minY),cx:(minX+maxX)/2,cy:(minY+maxY)/2}}
function pathLen(s){let n=0,p=s.points||[];for(let i=1;i<p.length;i++)n+=Math.hypot((p[i].x-p[i-1].x)*cssW,(p[i].y-p[i-1].y)*cssH);return n}
function closure(s){const p=s.points||[];if(p.length<2)return Infinity;return Math.hypot((p[0].x-p[p.length-1].x)*cssW,(p[0].y-p[p.length-1].y)*cssH)}
function straightness(s){const p=s.points||[];if(p.length<2)return 0;const direct=Math.hypot((p[0].x-p[p.length-1].x)*cssW,(p[0].y-p[p.length-1].y)*cssH);return direct/Math.max(1,pathLen(s))}
function smartButton(){return document.getElementById('smartMathBtn')}
function forcePen(){try{tool='pen';syncUi();canvas.style.cursor='crosshair'}catch{}}
function showActive(){const sm=smartButton();if(sm){if(!baseLabel)baseLabel=sm.textContent;sm.textContent=L.active;sm.title=L.active;sm.classList.add('active');sm.classList.remove('soft')}if(doneBtn)doneBtn.style.display='inline-flex'}
function deactivate(){active=false;if(doneBtn)doneBtn.style.display='none';const sm=smartButton();if(sm){sm.textContent=baseLabel||'✨ Smart Math';sm.title=sm.textContent;sm.classList.remove('active');sm.classList.add('soft')}}
function svgData(svg){return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)}
function makeFinishButton(){if(doneBtn)return;const sm=smartButton();if(!sm)return;doneBtn=document.createElement('button');doneBtn.type='button';doneBtn.className='btn soft';doneBtn.textContent=L.finish;doneBtn.style.cssText='display:none;min-height:32px;padding:5px 9px;font-size:11px;border-style:dashed';sm.insertAdjacentElement('afterend',doneBtn);doneBtn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();finishFraction()},true)}

function analyseFraction(group){
 if(!group.length)return null;
 const gb=groupBox(group),gw=gb.w*cssW,gh=gb.h*cssH;
 if(gw<70||gh<20)return null;
 const horizontal=gw>=gh;
 // Find a likely continuous outer rectangle if the teacher drew one in a single stroke.
 let outer=null,best=-1;
 for(const s of group){const b=box(s),pw=b.w*cssW,ph=b.h*cssH,diag=Math.hypot(pw,ph),closed=1-clamp(closure(s)/Math.max(12,diag),0,1),aspect=Math.max(pw/ph,ph/pw);const score=closed+(aspect>1.5?.35:0)+(pw*ph)/(Math.max(1,gw*gh))*.25;if(closed>.45&&score>best){best=score;outer=s}}
 const ob=outer?box(outer):gb;
 const bw=ob.w*cssW,bh=ob.h*cssH;
 if(horizontal&&bw<80)return null;if(!horizontal&&bh<80)return null;
 const divs=[];
 for(const s of group){if(s===outer||straightness(s)<.55)continue;const b=box(s),pw=b.w*cssW,ph=b.h*cssH;
   if(horizontal){
     if(ph<Math.max(10,bh*.35)||ph<pw*1.15)continue;
     const rel=(b.cx-ob.x)/Math.max(.001,ob.w);if(rel>.10&&rel<.90&&b.cy>ob.y-.05&&b.cy<ob.y+ob.h+.05)divs.push({s,pos:b.cx});
   }else{
     if(pw<Math.max(10,bw*.35)||pw<ph*1.15)continue;
     const rel=(b.cy-ob.y)/Math.max(.001,ob.h);if(rel>.10&&rel<.90&&b.cx>ob.x-.05&&b.cx<ob.x+ob.w+.05)divs.push({s,pos:b.cy});
   }
 }
 // Deduplicate divider strokes that are very close together.
 divs.sort((a,b)=>a.pos-b.pos);const unique=[];const tol=(horizontal?ob.w:ob.h)*.06;for(const d of divs){if(!unique.length||Math.abs(d.pos-unique[unique.length-1].pos)>tol)unique.push(d)}
 const parts=unique.length+1;
 if(parts<2||parts>12)return null;
 return{box:ob,horizontal,parts,group};
}

function finishFraction(){
 if(!active)return;
 const group=strokes.slice(startIndex).filter(rawInk);const f=analyseFraction(group);if(!f){notify(L.no);forcePen();showActive();return}
 const before=clone(strokes),set=new Set(group),b=f.box,n=f.parts;strokes=strokes.filter(s=>!set.has(s));
 const svgW=f.horizontal?900:260,svgH=f.horizontal?220:900,els=[];
 els.push(`<rect x="10" y="10" width="${svgW-20}" height="${svgH-20}" rx="2" fill="white" stroke="#17324d" stroke-width="10"/>`);
 for(let i=1;i<n;i++){
   if(f.horizontal){const x=10+(svgW-20)*i/n;els.push(`<line x1="${x}" y1="10" x2="${x}" y2="${svgH-10}" stroke="#17324d" stroke-width="8"/>`)}
   else{const y=10+(svgH-20)*i/n;els.push(`<line x1="10" y1="${y}" x2="${svgW-10}" y2="${y}" stroke="#17324d" stroke-width="8"/>`)}
 }
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">${els.join('')}</svg>`;
 const obj={type:'image',src:svgData(svg),x:clamp(b.x,0,.96),y:clamp(b.y,0,.96),w:clamp(b.w,.06,1-b.x),h:clamp(b.h,.06,1-b.y),smartGenerated:true,smartType:'fractionBar',smartId:uid(),smartOriginal:clone(group)};
 strokes.push(obj);lastHistory={before,afterId:obj.smartId};redraw();syncUi();try{tool='select';syncUi()}catch{};deactivate();notify(`${n}-part ${L.made}`)
}

makeFinishButton();

document.addEventListener('click',e=>{
 const b=e.target?.closest?.('button');if(!b)return;const label=b.textContent.trim();
 if(label===L.fraction){const sm=smartButton();if(!sm)return;e.preventDefault();e.stopImmediatePropagation();if(!baseLabel)baseLabel=sm.textContent;active=true;startIndex=strokes.length;showActive();forcePen();notify(L.draw);return}
 if(active&&['Auto Detect','Counters','Bar Model','Number Line','Equation','3D Solid','Smart Math Off','自动识别','计数片','条形图','数轴','算式','3D 立体图形','关闭智能数学','Kesan Auto','Pembilang','Model Bar','Garis Nombor','Persamaan','Pepejal 3D','Matematik Pintar Mati','தானாக கண்டறி','எண்ணிகள்','பார் மாதிரி','எண் கோடு','சமன்பாடு','3D திண்மம்','நுண்ணறிவு கணிதம் நிறுத்து'].includes(label)){deactivate()}
},true);

document.addEventListener('keydown',e=>{if(e.key==='Escape'&&active)deactivate()},true);
undoBtn.addEventListener('click',e=>{if(!lastHistory)return;const present=strokes.some(s=>s.smartId===lastHistory.afterId);if(!present)return;e.preventDefault();e.stopImmediatePropagation();strokes=clone(lastHistory.before);lastHistory=null;redraw();syncUi();notify('Smart Math fraction undone')},true);
})();
