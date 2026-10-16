(function(){
'use strict';
const LABEL='Multiplicative Comparison · As many as';
let timer=null;
function original(menu){return menu?.querySelector('[data-multiplicative-comparison]')||null}
function proxy(menu){return menu?.querySelector('[data-multiplicative-menu-proxy]')||null}
function nudge(){
 const marker=document.createElement('span');marker.style.display='none';marker.dataset.multiNudge='1';document.body.appendChild(marker);marker.remove();
}
function activateOriginal(menu){
 let tries=0;
 const go=()=>{
  const o=original(menu);
  if(o){o.click();return}
  nudge();
  if(++tries<8)setTimeout(go,25);
  else if(typeof say==='function')say('Multiplicative Comparison is still loading. Please open Bar Model again.');
 };
 go();
}
function ensure(){
 const menu=document.getElementById('smartBarTypeMenu');
 if(!menu)return;
 const o=original(menu),p=proxy(menu);
 if(o){if(p)p.remove();return}
 nudge();
 queueMicrotask(()=>{
  if(original(menu)){proxy(menu)?.remove();return}
  if(proxy(menu))return;
  const b=document.createElement('button');
  b.type='button';b.className='btn';b.dataset.multiplicativeMenuProxy='1';b.textContent=LABEL;
  b.style.cssText='display:block;width:100%;text-align:left;margin:3px 0';
  b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();activateOriginal(menu)},true);
  const buttons=[...menu.querySelectorAll('button')];
  const comparison=buttons.find(x=>(x.textContent||'').trim()==='Comparison')||buttons.find(x=>(x.textContent||'').toLowerCase().includes('comparison'));
  if(comparison?.nextSibling)menu.insertBefore(b,comparison.nextSibling);else menu.appendChild(b);
 });
}
new MutationObserver(ensure).observe(document.body,{childList:true,subtree:true});
timer=setInterval(ensure,250);
setTimeout(ensure,0);
})();