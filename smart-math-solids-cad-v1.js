(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function'||typeof syncUi!=='function'||typeof wrap==='undefined')return;

const edition=(new URLSearchParams(location.search).get('edition')||'en').toLowerCase();
const TXT={
 en:{menu:'3D Solid',title:'Choose a 3D solid',cube:'Cube',cuboid:'Cuboid',sphere:'Sphere',cylinder:'Cylinder',cone:'Cone',pyramid:'Pyramid',prism:'Triangular Prism',cancel:'Cancel'},
 zh:{menu:'3D 立体图形',title:'选择3D立体图形',cube:'正方体',cuboid:'长方体',sphere:'球体',cylinder:'圆柱体',cone:'圆锥体',pyramid:'棱锥',prism:'三棱柱',cancel:'取消'},
 ms:{menu:'Pepejal 3D',title:'Pilih pepejal 3D',cube:'Kubus',cuboid:'Kuboid',sphere:'Sfera',cylinder:'Silinder',cone:'Kon',pyramid:'Piramid',prism:'Prisma Segi Tiga',cancel:'Batal'},
 ta:{menu:'3D திண்மம்',title:'3D திண்மத்தைத் தேர்ந்தெடுக்கவும்',cube:'கனசதுரம்',cuboid:'செவ்வகக் கனசதுரம்',sphere:'கோளம்',cylinder:'உருளை',cone:'கூம்பு',pyramid:'பிரமிடு',prism:'முக்கோணப் பட்டகம்',cancel:'ரத்து'}
};
const L=TXT[edition]||TXT.en;
const MENU_LABELS=new Set(Object.values(TXT).map(x=>x.menu));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const uid=()=>`solid3d-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
const svgData=svg=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
const TRANSPARENT='data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
let panel=null,target=null,gesture=null,raf=0,preview=null;

function notify(msg){if(typeof say==='function'){try{say(msg);return}catch{}}const t=document.getElementById('toast');if(t){t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1200)}}
function closePanel(){if(panel){panel.remove();panel=null}}
function vsub(a,b){return[a[0]-b[0],a[1]-b[1],a[2]-b[2]]}
function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
function norm(a){const d=Math.hypot(a[0],a[1],a[2])||1;return[a[0]/d,a[1]/d,a[2]/d]}
function rotatePoint(v,yaw,pitch){
 const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
 const x=v[0]*cy+v[2]*sy,z=-v[0]*sy+v[2]*cy;
 return[x,v[1]*cp-z*sp,v[1]*sp+z*cp];
}
function project(v){const cam=5.2,f=cam/(cam-v[2]),s=142;return[260+v[0]*s*f,260-v[1]*s*f]}
function ptsAttr(points){return points.map(p=>`${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')}
function baseSvg(inner){return `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="520" viewBox="0 0 520 520"><defs><filter id="ds" x="-35%" y="-35%" width="170%" height="170%"><feDropShadow dx="5" dy="8" stdDeviation="8" flood-color="#17324d" flood-opacity=".16"/></filter><radialGradient id="ball" cx="31%" cy="25%" r="76%"><stop offset="0" stop-color="#ffffff"/><stop offset=".28" stop-color="#e8f7ff"/><stop offset=".7" stop-color="#9fd0e9"/><stop offset="1" stop-color="#5f9fc4"/></radialGradient></defs>${inner}</svg>`}
function groupOpen(live){return live?'<g>':'<g filter="url(#ds)">' }

function boxMesh(x=1,y=1,z=1){
 const V=[[-x,-y,-z],[x,-y,-z],[x,y,-z],[-x,y,-z],[-x,-y,z],[x,-y,z],[x,y,z],[-x,y,z]];
 const F=[[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[0,1,5,4],[3,7,6,2]];
 return{V,F,smooth:false};
}
function pyramidMesh(){return{V:[[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1],[0,1.25,0]],F:[[0,3,2,1],[0,1,4],[1,2,4],[2,3,4],[3,0,4]],smooth:false}}
function prismMesh(){return{V:[[-1.1,-.82,-.9],[1.1,-.82,-.9],[0,1.02,-.9],[-1.1,-.82,.9],[1.1,-.82,.9],[0,1.02,.9]],F:[[0,2,1],[3,4,5],[0,1,4,3],[1,2,5,4],[2,0,3,5]],smooth:false}}
function cylinderMesh(n=24){
 const V=[],F=[];for(let i=0;i<n;i++){const a=i*Math.PI*2/n;V.push([Math.cos(a),-1.05,Math.sin(a)])}for(let i=0;i<n;i++){const a=i*Math.PI*2/n;V.push([Math.cos(a),1.05,Math.sin(a)])}
 for(let i=0;i<n;i++){const j=(i+1)%n;F.push([i,j,n+j,n+i])}
 F.push([...Array(n).keys()].reverse());F.push([...Array(n).keys()].map(i=>n+i));return{V,F,smooth:true,ringBottom:[...Array(n).keys()],ringTop:[...Array(n).keys()].map(i=>n+i)};
}
function coneMesh(n=28){
 const V=[],F=[];for(let i=0;i<n;i++){const a=i*Math.PI*2/n;V.push([Math.cos(a),-1.05,Math.sin(a)])}V.push([0,1.28,0]);const apex=n;
 for(let i=0;i<n;i++)F.push([i,(i+1)%n,apex]);F.push([...Array(n).keys()].reverse());return{V,F,smooth:true,ringBottom:[...Array(n).keys()],apex};
}
function meshFor(type){if(type==='cube')return boxMesh(1,1,1);if(type==='cuboid')return boxMesh(1.34,.78,.88);if(type==='pyramid')return pyramidMesh();if(type==='prism')return prismMesh();if(type==='cylinder')return cylinderMesh();return coneMesh()}
function normalOf(face,R){if(face.length<3)return[0,0,1];return norm(cross(vsub(R[face[1]],R[face[0]]),vsub(R[face[2]],R[face[0]])))}
function faceLight(n){const light=norm([-.45,.7,1]);const d=Math.max(0,n[0]*light[0]+n[1]*light[1]+n[2]*light[2]);return 55+d*28}
function edgeKey(a,b){return a<b?`${a}:${b}`:`${b}:${a}`}
function polyMeshSvg(type,yaw,pitch,live=false){
 const M=meshFor(type),R=M.V.map(v=>rotatePoint(v,yaw,pitch)),P=R.map(project);
 const faces=M.F.map((f,i)=>{const n=normalOf(f,R);return{f,n,z:f.reduce((s,k)=>s+R[k][2],0)/f.length,front:n[2]>0,i}}).sort((a,b)=>a.z-b.z);
 let body='';
 for(const q of faces){const l=faceLight(q.n);body+=`<polygon points="${ptsAttr(q.f.map(i=>P[i]))}" fill="hsl(199 63% ${l.toFixed(0)}%)" stroke="${M.smooth?'rgba(23,50,77,.10)':'rgba(23,50,77,.38)'}" stroke-width="${M.smooth?'.7':'1.2'}" stroke-linejoin="round"/>`}
 if(!M.smooth){
  const edges=new Map();for(const q of faces){for(let i=0;i<q.f.length;i++){const a=q.f[i],b=q.f[(i+1)%q.f.length],k=edgeKey(a,b);const e=edges.get(k)||{a,b,front:false};if(q.front)e.front=true;edges.set(k,e)}}
  for(const e of edges.values()){const a=P[e.a],b=P[e.b];body+=`<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="#17324d" stroke-width="${e.front?3.2:2.1}" ${e.front?'':`stroke-dasharray="7 7" opacity=".42"`} stroke-linecap="round"/>`}
 }else{
  const ring=(idxs,opacity=1)=>{const pp=idxs.map(i=>P[i]);body+=`<polyline points="${ptsAttr([...pp,pp[0]])}" fill="none" stroke="#17324d" stroke-width="3" opacity="${opacity}" stroke-linejoin="round"/>`};
  if(M.ringBottom)ring(M.ringBottom,.84);if(M.ringTop)ring(M.ringTop,.92);
  if(type==='cone'){
   const ringPts=M.ringBottom.map(i=>P[i]),ap=P[M.apex];let li=0,ri=0;for(let i=1;i<ringPts.length;i++){if(ringPts[i][0]<ringPts[li][0])li=i;if(ringPts[i][0]>ringPts[ri][0])ri=i}
   for(const p of [ringPts[li],ringPts[ri]])body+=`<line x1="${ap[0].toFixed(1)}" y1="${ap[1].toFixed(1)}" x2="${p[0].toFixed(1)}" y2="${p[1].toFixed(1)}" stroke="#17324d" stroke-width="3.2" stroke-linecap="round"/>`;
  }
 }
 return baseSvg(`${groupOpen(live)}${body}</g>`);
}
function sphereRing(axis,yaw,pitch,front){
 let path='',open=false;for(let i=0;i<=64;i++){const a=i/64*Math.PI*2;let v;if(axis==='xy')v=[Math.cos(a),Math.sin(a),0];else if(axis==='xz')v=[Math.cos(a),0,Math.sin(a)];else v=[0,Math.cos(a),Math.sin(a)];const r=rotatePoint(v,yaw,pitch),isFront=r[2]>=0;if(isFront===front){const x=260+r[0]*178,y=260-r[1]*178;if(!open){path+=`M${x.toFixed(1)} ${y.toFixed(1)}`;open=true}else path+=`L${x.toFixed(1)} ${y.toFixed(1)}`}else open=false}return path;
}
function sphereSvg(yaw,pitch,live=false){
 let rings='';for(const axis of ['xy','xz','yz']){const back=sphereRing(axis,yaw,pitch,false),front=sphereRing(axis,yaw,pitch,true);rings+=`<path d="${back}" fill="none" stroke="#17324d" stroke-width="2" stroke-dasharray="7 7" opacity=".22"/><path d="${front}" fill="none" stroke="#17324d" stroke-width="2.4" opacity=".38"/>`}
 return baseSvg(`${groupOpen(live)}<circle cx="260" cy="260" r="179" fill="url(#ball)" stroke="#17324d" stroke-width="4"/>${rings}<ellipse cx="207" cy="194" rx="43" ry="25" fill="#fff" opacity=".28" transform="rotate(-35 207 194)"/></g>`);
}
function renderSolid(type,yaw,pitch,live=false){return type==='sphere'?sphereSvg(yaw,pitch,live):polyMeshSvg(type,yaw,pitch,live)}
function refresh(o){o.src=svgData(renderSolid(o.solidType,o.solidYaw||0,o.solidPitch||0,false));}
function create(type){
 closePanel();const yaw=-.58,pitch=.42,px=Math.max(230,Math.min(350,Math.min(cssW,cssH)*.46));
 const w=px/Math.max(1,cssW),h=px/Math.max(1,cssH),o={type:'image',src:'',x:clamp(.5-w/2,0,1-w),y:clamp(.43-h/2,0,1-h),w,h,smartGenerated:true,smartType:'solid3d',solidType:type,solidYaw:yaw,solidPitch:pitch,smartId:uid(),smartOriginal:[]};
 refresh(o);strokes.push(o);target=o;redraw();syncUi();try{tool='select';syncUi()}catch{};notify((L[type]||type)+' ✓');
}
function openPanel(){
 closePanel();panel=document.createElement('div');panel.style.cssText='position:absolute;z-index:10130;left:50%;top:16px;transform:translateX(-50%);width:min(520px,calc(100% - 24px));padding:12px;background:#fff;border:1px solid #cfd9de;border-radius:14px;box-shadow:0 10px 28px rgba(18,32,46,.2)';
 const h=document.createElement('div');h.textContent=L.title;h.style.cssText='font-weight:950;color:#17324d;margin-bottom:9px';panel.appendChild(h);
 const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px';
 [['cube',L.cube],['cuboid',L.cuboid],['sphere',L.sphere],['cylinder',L.cylinder],['cone',L.cone],['pyramid',L.pyramid],['prism',L.prism]].forEach(([t,label])=>{const b=document.createElement('button');b.className='btn soft';b.type='button';b.textContent=label;b.onclick=()=>create(t);grid.appendChild(b)});panel.appendChild(grid);
 const c=document.createElement('button');c.className='btn';c.type='button';c.textContent=L.cancel;c.style.cssText='width:100%;margin-top:8px';c.onclick=closePanel;panel.appendChild(c);wrap.appendChild(panel);
}
window.__smartSolidOpen=openPanel;

function bounds(o){return{x:o.x*cssW,y:o.y*cssH,w:o.w*cssW,h:o.h*cssH}}
function point(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
function hitSolid(e){const p=point(e);for(let i=strokes.length-1;i>=0;i--){const s=strokes[i];if(s?.type!=='image'||s.smartType!=='solid3d')continue;const b=bounds(s);if(p.x>=b.x-5&&p.x<=b.x+b.w+5&&p.y>=b.y-5&&p.y<=b.y+b.h+5)return s}return null}
function handle(o){const b=bounds(o);return{x:b.x+b.w/2,y:Math.max(21,b.y-34),r:10,b}}
function hitHandle(e,o){const p=point(e),h=handle(o);return Math.hypot(p.x-h.x,p.y-h.y)<=19}
function drawHandle(){
 if(typeof tool!=='undefined'&&tool!=='select')return;if(!target||!strokes.includes(target)||target.smartType!=='solid3d'||gesture)return;const h=handle(target);
 ctx.save();ctx.globalCompositeOperation='source-over';ctx.strokeStyle='#7c3aed';ctx.fillStyle='#fff';ctx.lineWidth=2.5;ctx.setLineDash([]);ctx.beginPath();ctx.moveTo(h.b.x+h.b.w/2,h.b.y-4);ctx.lineTo(h.x,h.y+h.r);ctx.stroke();ctx.beginPath();ctx.arc(h.x,h.y,h.r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#7c3aed';ctx.font='900 13px system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('⟳',h.x,h.y+.5);ctx.restore();
}
const baseRedraw=redraw;redraw=function(){baseRedraw();drawHandle()};

function removePreview(){if(preview){preview.remove();preview=null}}
function makePreview(o){
 removePreview();const b=bounds(o);preview=document.createElement('div');preview.setAttribute('aria-hidden','true');Object.assign(preview.style,{position:'absolute',zIndex:'90',pointerEvents:'none',left:`${b.x}px`,top:`${b.y}px`,width:`${b.w}px`,height:`${b.h}px`,overflow:'visible'});wrap.appendChild(preview);renderPreview(o);
}
function renderPreview(o){if(!preview)return;preview.innerHTML=renderSolid(o.solidType,o.solidYaw||0,o.solidPitch||0,true);const svg=preview.firstElementChild;if(svg)Object.assign(svg.style,{display:'block',width:'100%',height:'100%'});}
function schedulePreview(o){
 if(raf)return;raf=requestAnimationFrame(()=>{raf=0;renderPreview(o)});
}
function finishPreview(o){
 cancelAnimationFrame(raf);raf=0;refresh(o);const img=new Image();img.onload=()=>{redraw();requestAnimationFrame(()=>requestAnimationFrame(()=>{removePreview();redraw()}))};img.onerror=()=>{removePreview();redraw()};img.src=o.src;
}

window.addEventListener('pointerdown',e=>{
 if(e.button!==undefined&&e.button!==0)return;if(typeof tool!=='undefined'&&tool!=='select'){target=null;return}
 if(target&&hitHandle(e,target)){
  const p=point(e);gesture={o:target,sx:p.x,sy:p.y,yaw:target.solidYaw||0,pitch:target.solidPitch||0,src:target.src};makePreview(target);target.src=TRANSPARENT;redraw();try{canvas.setPointerCapture?.(e.pointerId)}catch{};e.preventDefault();e.stopImmediatePropagation();return;
 }
 const hit=hitSolid(e);target=hit||null;setTimeout(()=>redraw(),0);
},true);
window.addEventListener('pointermove',e=>{
 if(!gesture)return;const p=point(e),dx=p.x-gesture.sx,dy=p.y-gesture.sy;gesture.o.solidYaw=gesture.yaw+dx*.010;gesture.o.solidPitch=clamp(gesture.pitch+dy*.010,-1.48,1.48);schedulePreview(gesture.o);e.preventDefault();e.stopImmediatePropagation();
},true);
window.addEventListener('pointerup',e=>{
 if(!gesture)return;const o=gesture.o;gesture=null;finishPreview(o);try{canvas.releasePointerCapture?.(e.pointerId)}catch{};e.preventDefault();e.stopImmediatePropagation();
},true);
window.addEventListener('pointercancel',e=>{
 if(!gesture)return;cancelAnimationFrame(raf);raf=0;const g=gesture;gesture=null;g.o.solidYaw=g.yaw;g.o.solidPitch=g.pitch;g.o.src=g.src;removePreview();redraw();try{canvas.releasePointerCapture?.(e.pointerId)}catch{};
},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closePanel();if(gesture){cancelAnimationFrame(raf);raf=0;gesture.o.solidYaw=gesture.yaw;gesture.o.solidPitch=gesture.pitch;gesture.o.src=gesture.src;gesture=null;removePreview()}target=null;redraw()}},true);

document.addEventListener('click',e=>{
 const b=e.target?.closest?.('button');if(!b)return;const t=(b.textContent||'').trim();if(!MENU_LABELS.has(t)||b.id==='smartMathBtn'||b.id==='smartSolidBtn')return;
 e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();const p=b.parentElement;if(p?.style)p.style.display='none';openPanel();
},true);

[document.getElementById('penBtn'),document.getElementById('textBtn'),document.getElementById('eraserBtn')].forEach(b=>b?.addEventListener('click',()=>{target=null;removePreview();redraw()}));
})();
