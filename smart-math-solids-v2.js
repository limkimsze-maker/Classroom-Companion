(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function'||typeof syncUi!=='function'||typeof wrap==='undefined')return;

const edition=(new URLSearchParams(location.search).get('edition')||'en').toLowerCase();
const TXT={
 en:{menu:'3D Solid',title:'Choose a 3D solid',cube:'Cube',cuboid:'Cuboid',sphere:'Sphere',cylinder:'Cylinder',cone:'Cone',pyramid:'Pyramid',prism:'Triangular Prism',cancel:'Cancel',flipX:'↔ Flip view',flipY:'↕ Flip view'},
 zh:{menu:'3D 立体图形',title:'选择3D立体图形',cube:'正方体',cuboid:'长方体',sphere:'球体',cylinder:'圆柱体',cone:'圆锥体',pyramid:'棱锥',prism:'三棱柱',cancel:'取消',flipX:'↔ 翻转视角',flipY:'↕ 翻转视角'},
 ms:{menu:'Pepejal 3D',title:'Pilih pepejal 3D',cube:'Kubus',cuboid:'Kuboid',sphere:'Sfera',cylinder:'Silinder',cone:'Kon',pyramid:'Piramid',prism:'Prisma Segi Tiga',cancel:'Batal',flipX:'↔ Balik pandangan',flipY:'↕ Balik pandangan'},
 ta:{menu:'3D திண்மம்',title:'3D திண்மத்தைத் தேர்ந்தெடுக்கவும்',cube:'கனசதுரம்',cuboid:'செவ்வகக் கனசதுரம்',sphere:'கோளம்',cylinder:'உருளை',cone:'கூம்பு',pyramid:'பிரமிடு',prism:'முக்கோணப் பட்டகம்',cancel:'ரத்து',flipX:'↔ காட்சியைத் திருப்பு',flipY:'↕ காட்சியைத் திருப்பு'}
};
const L=TXT[edition]||TXT.en;
const MENU_LABELS=new Set(Object.values(TXT).map(x=>x.menu));
let panel=null,toolbar=null,target=null;
const uid=()=>`solid-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&apos;'}[c]));
const svgData=svg=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
const notify=msg=>{if(typeof say==='function'){try{say(msg);return}catch{}}const t=document.getElementById('toast');if(t){t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1200)}};
function closePanel(){if(panel){panel.remove();panel=null}}
function closeToolbar(){if(toolbar){toolbar.remove();toolbar=null}target=null}

function defs(){return `<defs><linearGradient id="face" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eef8ff"/><stop offset="1" stop-color="#c9e5f7"/></linearGradient><linearGradient id="side" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#cfe8f7"/><stop offset="1" stop-color="#9ecbe6"/></linearGradient><radialGradient id="sphere" cx="34%" cy="28%" r="72%"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#dff1fb"/><stop offset="1" stop-color="#8fc3e2"/></radialGradient><linearGradient id="cone" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3fbff"/><stop offset="1" stop-color="#9fcfe8"/></linearGradient></defs>`}
function wrapSvg(inner,w=760,h=560,fx=false,fy=false){const tx=fx?w:0,ty=fy?h:0,sx=fx?-1:1,sy=fy?-1:1;return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="white"/>${defs()}<g transform="translate(${tx} ${ty}) scale(${sx} ${sy})">${inner}</g></svg>`}
function solidSvg(type,fx,fy){
 const S='#17324d',sw=8,dash='16 14';
 if(type==='sphere')return wrapSvg(`<circle cx="380" cy="280" r="190" fill="url(#sphere)" stroke="${S}" stroke-width="${sw}"/><ellipse cx="380" cy="280" rx="190" ry="58" fill="none" stroke="${S}" stroke-width="4" stroke-dasharray="${dash}" opacity=".42"/><path d="M 380 90 C 330 170 330 390 380 470" fill="none" stroke="#fff" stroke-width="11" opacity=".42" stroke-linecap="round"/>`,760,560,fx,fy);
 if(type==='cylinder')return wrapSvg(`<path d="M180 165 L180 395 C180 448 580 448 580 395 L580 165 Z" fill="url(#face)" stroke="${S}" stroke-width="${sw}"/><ellipse cx="380" cy="165" rx="200" ry="70" fill="#d9eef9" stroke="${S}" stroke-width="${sw}"/><path d="M180 395 C180 448 580 448 580 395" fill="none" stroke="${S}" stroke-width="${sw}"/><path d="M180 395 C180 342 580 342 580 395" fill="none" stroke="${S}" stroke-width="5" stroke-dasharray="${dash}" opacity=".55"/>`,760,560,fx,fy);
 if(type==='cone')return wrapSvg(`<path d="M380 78 L165 405 Q380 505 595 405 Z" fill="url(#cone)" stroke="${S}" stroke-width="${sw}" stroke-linejoin="round"/><path d="M165 405 Q380 505 595 405" fill="none" stroke="${S}" stroke-width="${sw}"/><path d="M165 405 Q380 315 595 405" fill="none" stroke="${S}" stroke-width="5" stroke-dasharray="${dash}" opacity=".55"/>`,760,560,fx,fy);
 if(type==='pyramid')return wrapSvg(`<polygon points="380,70 145,430 615,430" fill="url(#face)" stroke="${S}" stroke-width="${sw}" stroke-linejoin="round"/><polygon points="380,70 615,430 520,485" fill="url(#side)" stroke="${S}" stroke-width="${sw}" stroke-linejoin="round"/><line x1="145" y1="430" x2="520" y2="485" stroke="${S}" stroke-width="${sw}"/><line x1="380" y1="70" x2="520" y2="485" stroke="${S}" stroke-width="5"/><line x1="145" y1="430" x2="520" y2="485" stroke="${S}" stroke-width="5" stroke-dasharray="${dash}" opacity=".55"/>`,760,560,fx,fy);
 if(type==='prism')return wrapSvg(`<polygon points="145,395 280,135 415,395" fill="url(#face)" stroke="${S}" stroke-width="${sw}" stroke-linejoin="round"/><polygon points="280,135 535,105 670,365 415,395" fill="url(#side)" stroke="${S}" stroke-width="${sw}" stroke-linejoin="round"/><polygon points="415,395 670,365 535,105" fill="#b9dced" opacity=".65" stroke="${S}" stroke-width="${sw}" stroke-linejoin="round"/><line x1="145" y1="395" x2="400" y2="365" stroke="${S}" stroke-width="5" stroke-dasharray="${dash}" opacity=".55"/><line x1="400" y1="365" x2="535" y2="105" stroke="${S}" stroke-width="5" stroke-dasharray="${dash}" opacity=".55"/>`,820,560,fx,fy);
 const cuboid=type==='cuboid',x=150,y=175,w=cuboid?420:300,h=cuboid?230:300,dx=120,dy=-90;
 const A=[x,y],B=[x+w,y],C=[x+w,y+h],D=[x,y+h],A2=[x+dx,y+dy],B2=[x+w+dx,y+dy],C2=[x+w+dx,y+h+dy],D2=[x+dx,y+h+dy];
 return wrapSvg(`<polygon points="${A2} ${B2} ${B} ${A}" fill="#e8f5fc" stroke="${S}" stroke-width="${sw}" stroke-linejoin="round"/><polygon points="${B2} ${C2} ${C} ${B}" fill="url(#side)" stroke="${S}" stroke-width="${sw}" stroke-linejoin="round"/><polygon points="${A} ${B} ${C} ${D}" fill="url(#face)" stroke="${S}" stroke-width="${sw}" stroke-linejoin="round"/><line x1="${A[0]}" y1="${A[1]}" x2="${A2[0]}" y2="${A2[1]}" stroke="${S}" stroke-width="${sw}"/><line x1="${D[0]}" y1="${D[1]}" x2="${D2[0]}" y2="${D2[1]}" stroke="${S}" stroke-width="5" stroke-dasharray="${dash}" opacity=".55"/><line x1="${D2[0]}" y1="${D2[1]}" x2="${C2[0]}" y2="${C2[1]}" stroke="${S}" stroke-width="5" stroke-dasharray="${dash}" opacity=".55"/>`,760,560,fx,fy);
}
function create(type){
 closePanel();const src=svgData(solidSvg(type,false,false));
 const size={sphere:[.28,.42],cylinder:[.32,.42],cone:[.31,.43],pyramid:[.34,.43],prism:[.43,.40],cube:[.34,.43],cuboid:[.43,.39]}[type]||[.36,.42];
 const o={type:'image',src,x:.30,y:.22,w:size[0],h:size[1],smartGenerated:true,smartType:'solid3d',solidType:type,solidFlipX:false,solidFlipY:false,smartId:uid(),smartOriginal:[]};
 strokes.push(o);redraw();syncUi();try{tool='select';syncUi()}catch{};notify((L[type]||type)+' ✓');setTimeout(()=>showToolbar(o),0);
}
function openPanel(){
 closePanel();panel=document.createElement('div');panel.style.cssText='position:absolute;z-index:10130;left:50%;top:16px;transform:translateX(-50%);width:min(520px,calc(100% - 24px));padding:12px;background:#fff;border:1px solid #cfd9de;border-radius:14px;box-shadow:0 10px 28px rgba(18,32,46,.2)';
 const h=document.createElement('div');h.textContent=L.title;h.style.cssText='font-weight:950;color:#17324d;margin-bottom:9px';panel.appendChild(h);
 const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px';
 [['cube',L.cube],['cuboid',L.cuboid],['sphere',L.sphere],['cylinder',L.cylinder],['cone',L.cone],['pyramid',L.pyramid],['prism',L.prism]].forEach(([t,label])=>{const b=document.createElement('button');b.className='btn soft';b.type='button';b.textContent=label;b.onclick=()=>create(t);grid.appendChild(b)});panel.appendChild(grid);
 const c=document.createElement('button');c.className='btn';c.type='button';c.textContent=L.cancel;c.style.cssText='width:100%;margin-top:8px';c.onclick=closePanel;panel.appendChild(c);wrap.appendChild(panel);
}
function hitSolid(e){const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;for(let i=strokes.length-1;i>=0;i--){const s=strokes[i];if(s?.type!=='image'||s.smartType!=='solid3d')continue;const bx=s.x*cssW,by=s.y*cssH,bw=s.w*cssW,bh=s.h*cssH;if(x>=bx&&x<=bx+bw&&y>=by&&y<=by+bh)return s}return null}
function showToolbar(o){
 if(!o||!strokes.includes(o))return;closeToolbar();target=o;toolbar=document.createElement('div');toolbar.style.cssText='position:absolute;z-index:10125;display:flex;gap:6px;padding:6px;background:rgba(255,255,255,.98);border:1px solid #cfd9de;border-radius:11px;box-shadow:0 7px 18px rgba(18,32,46,.16)';
 const bx=o.x*cssW,by=o.y*cssH,bw=o.w*cssW;toolbar.style.left=Math.max(6,Math.min(cssW-220,bx+bw/2-100))+'px';toolbar.style.top=Math.max(6,by-48)+'px';
 const fx=document.createElement('button');fx.className='btn soft';fx.type='button';fx.textContent=L.flipX;fx.onclick=e=>{e.stopPropagation();o.solidFlipX=!o.solidFlipX;o.src=svgData(solidSvg(o.solidType,o.solidFlipX,o.solidFlipY));redraw();showToolbar(o)};
 const fy=document.createElement('button');fy.className='btn soft';fy.type='button';fy.textContent=L.flipY;fy.onclick=e=>{e.stopPropagation();o.solidFlipY=!o.solidFlipY;o.src=svgData(solidSvg(o.solidType,o.solidFlipX,o.solidFlipY));redraw();showToolbar(o)};
 toolbar.append(fx,fy);wrap.appendChild(toolbar);
}

document.addEventListener('click',e=>{
 const b=e.target?.closest?.('button');if(!b)return;const t=(b.textContent||'').trim();if(!MENU_LABELS.has(t))return;if(b.id==='smartMathBtn')return;
 e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();const p=b.parentElement;if(p?.style)p.style.display='none';openPanel();
},true);
canvas.addEventListener('pointerdown',e=>{const s=hitSolid(e);if(s)setTimeout(()=>showToolbar(s),0);else if(toolbar&&!toolbar.contains(e.target))closeToolbar()},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closePanel();closeToolbar()}},true);
})();
