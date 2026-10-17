(function(){
'use strict';
let queued=false;
const contextWords=[
 'Duplicate','Duplikasi','复制','நகல்',
 'Forward','Ke depan','上移一层','முன்னே',
 'Backward','Ke belakang','下移一层','பின்னே',
 'Lock','Unlock','Kunci','Buka kunci','锁定','解锁','பூட்டு','திற'
];
function isContextButton(b){
 if(!b||b.tagName!=='BUTTON')return false;
 if(b.id==='editTextBtn')return true;
 const text=(b.textContent||'').trim();
 const title=(b.title||'').trim();
 return contextWords.some(w=>text.includes(w)||title.includes(w));
}
function sync(){
 queued=false;
 const tools=document.querySelector('.tools');
 if(!tools)return;
 for(const b of tools.querySelectorAll('button')){
  if(!isContextButton(b))continue;
  b.dataset.contextualAction='true';
  const wanted=b.disabled?'none':'';
  if(b.style.display!==wanted)b.style.display=wanted;
 }
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(sync)}
const obs=new MutationObserver(schedule);
obs.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['disabled']});
schedule();
})();
