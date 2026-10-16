(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function')return;
const clone=v=>JSON.parse(JSON.stringify(v));
let picked=null;
const COLOUR_NAMES=new Set(['Red','Blue','Yellow','Green','Purple','Orange','Light Blue','White']);

function comparisonAt(clientX,clientY){
 const r=canvas.getBoundingClientRect(),x=(clientX-r.left)/Math.max(1,r.width),y=(clientY-r.top)/Math.max(1,r.height);
 for(let i=strokes.length-1;i>=0;i--){
  const o=strokes[i];
  if(!o||o.smartType!=='barModel'||o.smartBarType!=='comparison'||!o.w||!o.h)continue;
  if(x<o.x||x>o.x+o.w||y<o.y||y>o.y+o.h)continue;
  const n=Math.max(2,Math.min(5,Number(o.barCount)||2));
  const modern=Number(o.barCompareLayoutVersion)>=2;
  const H=modern?Math.max(340,150+n*145):Math.max(260,120+n*115);
  const startY=modern?60:45,rowGap=modern?145:105,barH=modern?76:72;
  const py=((y-o.y)/o.h)*H;
  let index=-1,best=Infinity;
  for(let j=0;j<n;j++){
   const cy=startY+j*rowGap+barH/2,d=Math.abs(py-cy);
   if(d<best){best=d;index=j}
  }
  return{obj:o,index};
 }
 return null;
}

function svgText(src){
 if(typeof src!=='string'||!src.startsWith('data:image/svg+xml'))return null;
 const comma=src.indexOf(',');if(comma<0)return null;
 let body=src.slice(comma+1);
 try{return decodeURIComponent(body)}catch{return body}
}
function recolourExistingSvg(obj,index,hex){
 const text=svgText(obj.src);if(!text)return false;
 const doc=new DOMParser().parseFromString(text,'image/svg+xml');
 if(doc.querySelector('parsererror'))return false;
 const rects=[...doc.querySelectorAll('rect')].filter(r=>r.hasAttribute('stroke'));
 if(index<0||index>=rects.length)return false;
 rects[index].setAttribute('fill',hex);
 const out=new XMLSerializer().serializeToString(doc.documentElement);
 obj.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(out);
 return true;
}
function buttonHex(btn){
 const bg=btn.style.background||btn.style.backgroundColor||'';
 if(/^#[0-9a-f]{6}$/i.test(bg))return bg;
 const map={Red:'#dc2626',Blue:'#2563eb',Yellow:'#facc15',Green:'#15803d',Purple:'#7c3aed',Orange:'#f97316','Light Blue':'#dbeafe',White:'#ffffff'};
 return map[btn.getAttribute('aria-label')]||null;
}

// Record exactly which comparison row the teacher clicked before the legacy
// colour panel opens. Use window capture so this runs before canvas handlers.
window.addEventListener('click',e=>{
 if(e.target!==canvas)return;
 const h=comparisonAt(e.clientX,e.clientY);if(h)picked=h;
},true);

// Intercept the legacy palette BEFORE its own click handler rebuilds the SVG.
// We change only the selected rect's fill in the current SVG, preserving every
// existing x/y/width/height and therefore the exact teacher-adjusted geometry.
window.addEventListener('click',e=>{
 const btn=e.target instanceof Element?e.target.closest('button'):null;
 if(!btn||!picked||!COLOUR_NAMES.has(btn.getAttribute('aria-label')||''))return;
 const hex=buttonHex(btn);if(!hex)return;
 const obj=strokes.find(s=>s&&s.smartId===picked.obj.smartId);
 if(!obj||obj.smartType!=='barModel'||obj.smartBarType!=='comparison'){picked=null;return}
 e.preventDefault();e.stopImmediatePropagation();
 window.__smartBarLastHistory={before:clone(strokes),afterId:obj.smartId};
 const n=Math.max(2,Math.min(5,Number(obj.barCount)||2));
 obj.barFills=Array.from({length:n},(_,i)=>obj.barFills?.[i]||'#ffffff');
 obj.barFills[picked.index]=hex;
 recolourExistingSvg(obj,picked.index,hex);
 const panel=btn.parentElement;if(panel&&panel.style.position==='fixed')panel.remove();
 redraw();if(typeof syncUi==='function')syncUi();
 picked=null;
},true);

document.addEventListener('keydown',e=>{if(e.key==='Escape')picked=null},true);
})();
