(function(){
'use strict';
const style=document.createElement('style');
style.textContent=`#editTextBtn{display:none!important}.wb-context-action[disabled],.wb-context-action[data-context-off="1"]{display:none!important}`;
document.head.appendChild(style);

const words=[
 'Duplicate','Duplikasi','复制','நகல்',
 'Forward','Ke depan','上移一层','முன்னே',
 'Backward','Ke belakang','下移一层','பின்னே',
 'Lock','Unlock','Kunci','Buka kunci','锁定','解锁','பூட்டு','திற'
];
let queued=false;
function contextual(b){
 if(!b||b.tagName!=='BUTTON'||b.id==='editTextBtn')return false;
 const s=((b.textContent||'')+' '+(b.title||'')).trim();
 return words.some(w=>s.includes(w));
}
function sync(){
 queued=false;
 const tools=document.querySelector('.tools');
 if(!tools)return;
 const edit=document.getElementById('editTextBtn');
 if(edit){edit.hidden=true;edit.setAttribute('aria-hidden','true')}
 for(const b of tools.querySelectorAll('button')){
  if(!contextual(b))continue;
  b.classList.add('wb-context-action');
  if(b.disabled){b.dataset.contextOff='1';b.hidden=true}
  else{delete b.dataset.contextOff;b.hidden=false}
 }
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(sync)}
new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['disabled','class']});
document.addEventListener('pointerup',schedule,true);
document.addEventListener('click',schedule,true);
document.addEventListener('keyup',schedule,true);
schedule();
})();
