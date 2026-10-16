(function(){
'use strict';
if(typeof strokes==='undefined'||typeof redraw!=='function')return;
function isEqual(o){return !!(o&&o.smartType==='barModel'&&o.smartBarType==='equalauto'&&typeof o.src==='string'&&o.src.startsWith('data:image/svg+xml'))}
function decode(src){const i=src.indexOf(',');if(i<0)return null;try{return decodeURIComponent(src.slice(i+1))}catch{return src.slice(i+1)}}
function encode(svg){return'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)}
function clean(o){
 if(!isEqual(o))return false;
 const raw=decode(o.src);if(!raw)return false;
 const doc=new DOMParser().parseFromString(raw,'image/svg+xml');if(doc.querySelector('parsererror'))return false;
 let changed=false;
 for(const t of [...doc.querySelectorAll('text')]){
  const x=Number(t.getAttribute('x')),y=Number(t.getAttribute('y')),s=(t.textContent||'').trim().toLowerCase();
  const centre=Number.isFinite(x)&&Number.isFinite(y)&&x>=350&&x<=650&&y>=140&&y<=220;
  const derived=/\b\d+(?:\.\d+)?\s*(groups?|group|kumpulan)\b/i.test(s)||/[0-9]+\s*组/.test(s);
  if(centre||derived){t.remove();changed=true}
 }
 if(changed)o.src=encode(new XMLSerializer().serializeToString(doc.documentElement));
 return changed;
}
function cleanAll(){let changed=false;for(const o of strokes)if(clean(o))changed=true;return changed}
const previous=redraw;
redraw=function(){cleanAll();return previous.apply(this,arguments)};
setTimeout(()=>{if(cleanAll())previous()},0);
})();
