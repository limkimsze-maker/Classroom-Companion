(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function'||typeof syncUi!=='function')return;
const smartBtn=document.getElementById('smartMathBtn');
if(!smartBtn)return;
const edition=(new URLSearchParams(location.search).get('edition')||'en').toLowerCase();
const TXT={
 en:{bar:'Bar Model',choose:'Choose bar model',partwhole:'Part–Whole',comparison:'Comparison',equal:'Equal Groups',missing:'Missing Part',finish:'✓ Finished bar model?',draw:'Draw the bar model, then click “Finished bar model?”.',no:'I could not identify the bar model yet.',made:'bar model created',edit:'Colour or label this part',label:'Part label',apply:'Apply label'},
 zh:{bar:'条形图',choose:'选择条形图类型',partwhole:'部分–整体',comparison:'比较',equal:'等组',missing:'缺失部分',finish:'✓ 条形图画完了吗？',draw:'画好条形图后，点击“条形图画完了吗？”。',no:'暂时无法识别条形图。',made:'已创建条形图',edit:'为这一部分着色或添加标签',label:'部分标签',apply:'应用标签'},
 ms:{bar:'Model Bar',choose:'Pilih jenis model bar',partwhole:'Bahagian–Keseluruhan',comparison:'Perbandingan',equal:'Kumpulan Sama',missing:'Bahagian Hilang',finish:'✓ Siap model bar?',draw:'Lukis model bar, kemudian klik “Siap model bar?”.',no:'Model bar belum dapat dikenal pasti.',made:'bar model dicipta',edit:'Warnakan atau label bahagian ini',label:'Label bahagian',apply:'Guna label'},
 ta:{bar:'பார் மாதிரி',choose:'பார் மாதிரி வகையைத் தேர்வு செய்',partwhole:'பகுதி–முழு',comparison:'ஒப்பீடு',equal:'சமக் குழுக்கள்',missing:'காணாத பகுதி',finish:'✓ பார் மாதிரி முடிந்ததா?',draw:'பார் மாதிரியை வரைந்து முடித்ததும் “முடிந்ததா?” என்பதைக் கிளிக் செய்யவும்.',no:'பார் மாதிரியை இன்னும் அடையாளம் காண முடியவில்லை.',made:'பார் மாதிரி உருவாக்கப்பட்டது',edit:'இந்தப் பகுதியை வண்ணமிடவும் அல்லது பெயரிடவும்',label:'பகுதி பெயர்',apply:'பெயரைப் பயன்படுத்து'}
};
const L=TXT[edition]||TXT.en;
const LABEL={partwhole:L.partwhole,comparison:L.comparison,equal:L.equal,missing:L.missing};
const PART_COLOURS=[['#dc2626','Red'],['#2563eb','Blue'],['#facc15','Yellow'],['#15803d','Green'],['#7c3aed','Purple'],['#f97316','Orange'],['#dbeafe','Light Blue'],['#ffffff','White']];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const clone=v=>JSON.parse(JSON.stringify(v));
const uid=()=>`smb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
let submenu=null,barButton=null,active=false,startIndex=0,barType='',doneBtn=null,baseLabel='',partPanel=null;

function rawInk(s){return !!(s&&Array.isArray(s.points)&&s.points.length&&!s.erase&&!s.smartGenerated&&!s.background)}
function box(s){let minX=1,minY=1,maxX=0,maxY=0;for(const p of s.points||[]){minX=Math.min(minX,p.x);minY=Math.min(minY,p.y);maxX=Math.max(maxX,p.x);maxY=Math.max(maxY,p.y)}return{x:minX,y:minY,w:Math.max(.001,maxX-minX),h:Math.max(.001,maxY-minY),cx:(minX+maxX)/2,cy:(minY+maxY)/2}}
function groupBox(arr){let minX=1,minY=1,maxX=0,maxY=0;for(const s of arr){const b=box(s);minX=Math.min(minX,b.x);minY=Math.min(minY,b.y);maxX=Math.max(maxX,b.x+b.w);maxY=Math.max(maxY,b.y+b.h)}return{x:minX,y:minY,w:Math.max(.001,maxX-minX),h:Math.max(.001,maxY-minY),cx:(minX+maxX)/2,cy:(minY+maxY)/2}}
function notify(msg){if(typeof say==='function')say(msg);else{const t=document.getElementById('toast');if(t){t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1500)}}}
function forcePen(){try{tool='pen';syncUi();canvas.style.cursor='crosshair'}catch{}}
function svgData(svg){return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]))}
function findBarButton(){const candidates=[...document.querySelectorAll('body > div button,.btn')];return candidates.find(b=>b!==smartBtn&&(b.textContent||'').trim()===L.bar)||null}
function close(){if(submenu)submenu.style.display='none'}
function showActive(){if(!baseLabel)baseLabel=smartBtn.textContent;smartBtn.textContent=`✨ ${L.bar} · ${LABEL[barType]} · Pen`;smartBtn.title=smartBtn.textContent;smartBtn.classList.add('active');smartBtn.classList.remove('soft');if(doneBtn)doneBtn.style.display='inline-flex'}
function deactivate(){active=false;if(doneBtn)doneBtn.style.display='none';smartBtn.textContent=baseLabel||'✨ Smart Math';smartBtn.title=smartBtn.textContent;smartBtn.classList.remove('active');smartBtn.classList.add('soft')}
function makeFinishButton(){if(doneBtn)return;doneBtn=document.createElement('button');doneBtn.type='button';doneBtn.className='btn soft';doneBtn.textContent=L.finish;doneBtn.style.cssText='display:none;min-height:32px;padding:5px 9px;font-size:11px;border-style:dashed';smartBtn.insertAdjacentElement('afterend',doneBtn);doneBtn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();finishBar()},true)}

function dedupe(vals,tol){vals.sort((a,b)=>a-b);const out=[];for(const v of vals)if(!out.length||Math.abs(v-out[out.length-1])>tol)out.push(v);return out}
function roughPartWholeBox(group,gb){
 const items=group.map(s=>{const b=box(s);return{b,pw:b.w*cssW,ph:b.h*cssH}});
 const hs=items.filter(o=>o.pw>=Math.max(55,gb.w*cssW*.35)&&o.pw>=o.ph*1.55);
 if(hs.length<2)return gb;
 let best=null;
 for(let i=0;i<hs.length;i++)for(let j=i+1;j<hs.length;j++){
  const a=hs[i].b,b=hs[j].b,sep=Math.abs(a.cy-b.cy)*cssH;if(sep<14||sep>220)continue;
  const left=Math.max(a.x,b.x),right=Math.min(a.x+a.w,b.x+b.w),ov=Math.max(0,right-left)*cssW;
  const shorter=Math.min(a.w,b.w)*cssW;if(ov<Math.max(45,shorter*.48))continue;
  const score=ov-sep*.08;if(!best||score>best.score)best={score,a,b};
 }
 if(!best)return gb;
 const top=Math.min(best.a.cy,best.b.cy),bottom=Math.max(best.a.cy,best.b.cy);
 const left=Math.min(best.a.x,best.b.x),right=Math.max(best.a.x+best.a.w,best.b.x+best.b.w);
 return{x:left,y:top,w:Math.max(.001,right-left),h:Math.max(.03,bottom-top),cx:(left+right)/2,cy:(top+bottom)/2};
}
function inferPartLayout(group,gb,maxParts){
 const xs=[],gw=Math.max(1,gb.w*cssW),gh=Math.max(1,gb.h*cssH);
 for(const s of group){
  const b=box(s),pw=b.w*cssW,ph=b.h*cssH,rx=(b.cx-gb.x)/Math.max(.001,gb.w);
  if(rx<=.04||rx>=.96)continue;
  // Deliberately forgiving: a divider may be short, slanted, or overshoot the bar.
  const narrowEnough=pw<=Math.max(34,gw*.13),verticalish=ph>=pw*.42,longEnough=ph>=Math.max(8,Math.min(22,gh*.16));
  if(longEnough&&(verticalish||narrowEnough))xs.push(b.cx);
 }
 const unique=dedupe(xs,Math.max(.012,gb.w*.028)).slice(0,maxParts-1);
 const cuts=unique.map(x=>clamp((x-gb.x)/Math.max(.001,gb.w),.035,.965)).sort((a,b)=>a-b);
 return{count:clamp(cuts.length+1,2,maxParts),cuts};
}
function inferComparisonRows(group,gb){
 let ys=[];for(const s of group){const b=box(s),pw=b.w*cssW,ph=b.h*cssH;if(pw>=70&&pw>=ph*1.7)ys.push(b.cy)}
 ys=dedupe(ys,Math.max(.025,gb.h*.12));
 if(ys.length<2){const all=group.map(s=>box(s).cy);ys=dedupe(all,Math.max(.04,gb.h*.18))}
 return clamp(ys.length,2,5);
}
function buildModel(type,count,cuts,fills,labels){
 const W=900,H=type==='comparison'?Math.max(260,120+count*115):300,els=[];
 const stroke='#17324d',fill='#ffffff';
 if(type==='comparison'){
  const maxW=760;for(let i=0;i<count;i++){const w=maxW*(1-i*.11);els.push(`<rect x="70" y="${45+i*105}" width="${w}" height="72" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="8"/>`)}
 }else{
  const x=60,y=90,w=780,h=120;
  let positions;
  if(type==='equal') positions=Array.from({length:count-1},(_,i)=>(i+1)/count);
  else if(Array.isArray(cuts)&&cuts.length===count-1) positions=cuts;
  else positions=Array.from({length:count-1},(_,i)=>(i+1)/count);
  const bounds=[0,...positions,1];
  if(type==='partwhole'){
   const safeFills=Array.from({length:count},(_,i)=>fills?.[i]||'#ffffff');
   const safeLabels=Array.from({length:count},(_,i)=>labels?.[i]||'');
   for(let i=0;i<count;i++){
    const left=x+w*bounds[i],right=x+w*bounds[i+1],pw=right-left;
    els.push(`<rect x="${left}" y="${y}" width="${pw}" height="${h}" fill="${safeFills[i]}"/>`);
    if(safeLabels[i]){
     const fs=safeLabels[i].length>12?24:safeLabels[i].length>7?30:38;
     els.push(`<text x="${left+pw/2}" y="${y+h/2+fs*.34}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${fs}" font-weight="700" fill="${stroke}">${esc(safeLabels[i])}</text>`);
    }
   }
   els.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="none" stroke="${stroke}" stroke-width="8"/>`);
  }else{
   els.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="8"/>`);
  }
  for(const r of positions){const px=x+w*r;els.push(`<line x1="${px}" y1="${y}" x2="${px}" y2="${y+h}" stroke="${stroke}" stroke-width="7"/>`)}
  if(type==='missing'){
   const i=Math.max(0,bounds.length-2),mid=(bounds[i]+bounds[i+1])/2;
   els.push(`<text x="${x+w*mid}" y="${y+h/2+18}" text-anchor="middle" font-family="Arial,sans-serif" font-size="56" font-weight="700" fill="${stroke}">?</text>`);
  }
 }
 return svgData(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${els.join('')}</svg>`)
}
function analyse(group){
 if(!group.length)return null;
 const rawBox=groupBox(group),gw=rawBox.w*cssW,gh=rawBox.h*cssH;if(gw<38||gh<7)return null;
 if(barType==='comparison'){if(group.length<2)return null;const count=inferComparisonRows(group,rawBox);if(count<2)return null;return{box:rawBox,count,cuts:null}}
 const modelBox=barType==='partwhole'?roughPartWholeBox(group,rawBox):rawBox;
 const max=barType==='equal'?12:8,layout=inferPartLayout(group,modelBox,max);
 return{box:modelBox,count:layout.count,cuts:layout.cuts};
}
function comparisonCandidateGroup(){
 const recent=strokes.slice(startIndex).filter(rawInk);
 const eligible=strokes.filter(rawInk);
 // A comparison can be drawn before selecting its mode, or after it.
 // Recover only the most recent pair of independently wide, separated bars.
 const bar=s=>{const b=box(s);return b.w*cssW>=75&&b.h*cssH>=10&&b.w*cssW>=b.h*cssH*1.3};
 const candidates=(recent.filter(bar).length>=2?recent:eligible).filter(bar);
 for(let i=candidates.length-1;i>=1;i--){
  const a=candidates[i],b=candidates[i-1],A=box(a),B=box(b);
  const left=Math.abs(A.x-B.x)*cssW,overlap=Math.max(0,Math.min(A.x+A.w,B.x+B.w)-Math.max(A.x,B.x))*cssW;
  const vertical=Math.abs(A.cy-B.cy)*cssH;
  if(left<=Math.max(75,Math.min(A.w,B.w)*cssW*.4)&&overlap>=Math.min(A.w,B.w)*cssW*.4&&vertical>=Math.max(18,Math.min(A.h,B.h)*cssH*.5))return[b,a];
 }
 return candidates;
}
function finishBar(){
 if(!active||!barType)return;
 const group=barType==='comparison'?comparisonCandidateGroup():strokes.slice(startIndex).filter(rawInk),a=analyse(group);if(!a){notify(L.no);forcePen();showActive();return}
 const before=clone(strokes),set=new Set(group);strokes=strokes.filter(s=>!set.has(s));
 const b=a.box,fills=barType==='partwhole'?Array(a.count).fill('#ffffff'):null,labels=barType==='partwhole'?Array(a.count).fill(''):null;
 const obj={type:'image',src:buildModel(barType,a.count,a.cuts,fills,labels),x:clamp(b.x,0,.94),y:clamp(b.y,0,.94),w:clamp(b.w,.12,1-b.x),h:clamp(Math.max(b.h,barType==='comparison'?.12:.08),.08,1-b.y),smartGenerated:true,smartType:'barModel',smartBarType:barType,smartId:uid(),barCount:a.count,barCuts:a.cuts?clone(a.cuts):null,barFills:fills,barLabels:labels,smartOriginal:clone(group)};
 strokes.push(obj);window.__smartBarLastHistory={before,afterId:obj.smartId};redraw();syncUi();try{tool='select';syncUi()}catch{};const label=LABEL[barType];deactivate();notify(`${label} ${L.made}`)
}
function begin(type){barType=type;window.__smartBarType=type;active=true;startIndex=strokes.length;close();closePartPanel();showActive();forcePen();notify(L.draw)}
function ensureSubmenu(){
 if(submenu)return submenu;submenu=document.createElement('div');submenu.id='smartBarTypeMenu';Object.assign(submenu.style,{position:'fixed',zIndex:'10040',display:'none',minWidth:'190px',padding:'7px',background:'#fff',border:'1px solid #d8e1e8',borderRadius:'12px',boxShadow:'0 10px 30px rgba(18,32,46,.22)'});
 const title=document.createElement('div');title.textContent=L.choose;Object.assign(title.style,{font:'900 11px Inter,system-ui,sans-serif',color:'#667085',padding:'4px 7px 6px'});submenu.appendChild(title);
 [['partwhole',L.partwhole],['comparison',L.comparison],['equal',L.equal],['missing',L.missing]].forEach(([key,label])=>{const b=document.createElement('button');b.className='btn';b.type='button';b.textContent=label;b.style.cssText='display:block;width:100%;text-align:left;margin:3px 0';b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();begin(key)});submenu.appendChild(b)});
 document.body.appendChild(submenu);return submenu
}
function openNear(btn){const m=ensureSubmenu(),r=btn.getBoundingClientRect();m.style.left=Math.max(8,Math.min(innerWidth-205,r.right+6))+'px';m.style.top=Math.max(8,Math.min(innerHeight-230,r.top))+'px';m.style.display='block'}
function hook(){barButton=findBarButton();if(!barButton)return false;if(barButton.dataset.smartBarSplit==='4')return true;barButton.dataset.smartBarSplit='4';barButton.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();openNear(barButton)},true);return true}

function partBounds(obj){
 const cuts=Array.isArray(obj.barCuts)&&obj.barCuts.length===obj.barCount-1?obj.barCuts:Array.from({length:obj.barCount-1},(_,i)=>(i+1)/obj.barCount);
 return[0,...cuts,1];
}
function hitPartWhole(clientX,clientY){
 const r=canvas.getBoundingClientRect(),x=(clientX-r.left)/Math.max(1,r.width),y=(clientY-r.top)/Math.max(1,r.height);
 for(let i=strokes.length-1;i>=0;i--){
  const s=strokes[i];if(!s||s.smartType!=='barModel'||s.smartBarType!=='partwhole'||!s.w||!s.h)continue;
  if(x<s.x||x>s.x+s.w||y<s.y||y>s.y+s.h)continue;
  const rel=(x-s.x)/s.w,bounds=partBounds(s);
  for(let p=0;p<bounds.length-1;p++)if(rel>=bounds[p]&&rel<=bounds[p+1])return{obj:s,index:p};
 }
 return null;
}
function closePartPanel(){if(partPanel){partPanel.remove();partPanel=null}}
function refreshPartWhole(obj){
 obj.barFills=Array.from({length:obj.barCount},(_,i)=>obj.barFills?.[i]||'#ffffff');
 obj.barLabels=Array.from({length:obj.barCount},(_,i)=>obj.barLabels?.[i]||'');
 obj.src=buildModel('partwhole',obj.barCount,obj.barCuts,obj.barFills,obj.barLabels);
 redraw();syncUi();
}
function showPartPanel(hit,clientX,clientY){
 closePartPanel();notify(L.edit);
 const panel=document.createElement('div');partPanel=panel;
 panel.style.cssText='position:fixed;z-index:10050;width:300px;padding:10px;background:#fff;border:1px solid #cfd9de;border-radius:13px;box-shadow:0 10px 28px rgba(23,50,77,.22);left:'+Math.min(innerWidth-308,Math.max(8,clientX-140))+'px;top:'+Math.min(innerHeight-150,Math.max(8,clientY+12))+'px';
 const colours=document.createElement('div');colours.style.cssText='display:flex;gap:6px;flex-wrap:wrap;margin-bottom:9px';
 for(const [hex,name] of PART_COLOURS){
  const b=document.createElement('button');b.type='button';b.title=name;b.setAttribute('aria-label',name);b.style.cssText=`width:28px;height:28px;border-radius:50%;border:2px solid white;box-shadow:0 0 0 1px #aab7c0;background:${hex};padding:0`;
  b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const obj=strokes.find(s=>s.smartId===hit.obj.smartId);if(!obj)return;window.__smartBarLastHistory={before:clone(strokes),afterId:obj.smartId};obj.barFills=Array.from({length:obj.barCount},(_,i)=>obj.barFills?.[i]||'#ffffff');obj.barFills[hit.index]=hex;refreshPartWhole(obj)},true);colours.appendChild(b);
 }
 const row=document.createElement('div');row.style.cssText='display:flex;gap:6px;align-items:center';
 const input=document.createElement('input');input.type='text';input.maxLength=30;input.placeholder=L.label;input.value=hit.obj.barLabels?.[hit.index]||'';input.style.cssText='min-width:0;flex:1;border:1px solid #cfd9de;border-radius:9px;padding:7px 8px;font-size:12px;font-weight:700;color:#17324d';
 const apply=document.createElement('button');apply.type='button';apply.className='btn soft';apply.textContent=L.apply;apply.style.cssText='min-height:32px;padding:5px 8px;font-size:11px';
 const commit=()=>{const obj=strokes.find(s=>s.smartId===hit.obj.smartId);if(!obj)return;window.__smartBarLastHistory={before:clone(strokes),afterId:obj.smartId};obj.barLabels=Array.from({length:obj.barCount},(_,i)=>obj.barLabels?.[i]||'');obj.barLabels[hit.index]=input.value.trim();refreshPartWhole(obj)};
 apply.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();commit()},true);input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();commit();input.blur()}else if(e.key==='Escape'){e.preventDefault();closePartPanel()}},true);
 row.append(input,apply);panel.append(colours,row);document.body.appendChild(panel);setTimeout(()=>input.focus(),0);
}

makeFinishButton();if(!hook()){let tries=0;const id=setInterval(()=>{if(hook()||++tries>40)clearInterval(id)},100)}
document.addEventListener('pointerdown',e=>{if(submenu&&submenu.style.display==='block'&&!submenu.contains(e.target)&&e.target!==barButton)close();if(partPanel&&!partPanel.contains(e.target)&&e.target!==canvas)closePartPanel()},true);
canvas.addEventListener('click',e=>{if(window.__smartPartWholeCompactOptions)return;const hit=hitPartWhole(e.clientX,e.clientY);if(!hit){closePartPanel();return}e.preventDefault();e.stopImmediatePropagation();showPartPanel(hit,e.clientX,e.clientY)},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'){close();closePartPanel();if(active)deactivate()}},true);
})();
