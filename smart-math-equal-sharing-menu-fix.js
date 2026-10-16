(function(){
'use strict';
const edition=(new URLSearchParams(location.search).get('edition')||'en').toLowerCase();
const TEXT={en:{sharing:'Equal Sharing',grouping:'Equal Grouping',groups:'Equal Groups'},zh:{sharing:'平均分配',grouping:'等分组合',groups:'等组'},ms:{sharing:'Perkongsian Sama',grouping:'Pengumpulan Sama',groups:'Kumpulan Sama'},ta:{sharing:'சமப் பகிர்வு',grouping:'சமக் குழுவாக்கம்',groups:'சமக் குழுக்கள்'}};
const L=TEXT[edition]||TEXT.en;
function ensure(){
 const m=document.getElementById('smartBarTypeMenu');
 if(!m)return false;
 if(m.querySelector('[data-equal-sharing]'))return true;
 const buttons=[...m.querySelectorAll('button')];
 const anchor=buttons.find(b=>{const t=(b.textContent||'').trim();return t===L.grouping||t===L.groups||t==='Equal Grouping'||t==='Equal Groups'});
 const b=document.createElement('button');
 b.type='button';b.className='btn';b.dataset.equalSharing='1';b.textContent=L.sharing;
 b.style.cssText='display:block;width:100%;text-align:left;margin:3px 0';
 b.addEventListener('click',e=>{
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  m.style.display='none';
  if(typeof window.__smartEqualSharingOpen==='function')window.__smartEqualSharingOpen();
 },true);
 if(anchor?.nextSibling)m.insertBefore(b,anchor.nextSibling);else m.appendChild(b);
 return true;
}
new MutationObserver(ensure).observe(document.body,{childList:true,subtree:true});
const timer=setInterval(()=>{if(ensure())clearInterval(timer)},250);
ensure();
})();
