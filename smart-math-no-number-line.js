(function(){
'use strict';
const LABELS=new Set([
  'Number Line','✨ Number Line?',
  '数轴','✨ 数轴？',
  'Garis Nombor','✨ Garis Nombor?',
  'எண் கோடு','✨ எண் கோடு?'
]);
function strip(){
  for(const b of document.querySelectorAll('button')){
    if(LABELS.has((b.textContent||'').trim())) b.remove();
  }
  for(const d of document.querySelectorAll('div')){
    const t=(d.textContent||'').trim();
    if((t==='Number Line'||t==='数轴'||t==='Garis Nombor'||t==='எண் கோடு')&&d.children.length===0){
      const p=d.parentElement;
      if(p&&p.style&&p.style.position==='absolute') p.remove();
    }
  }
}
document.addEventListener('click',e=>{
  const b=e.target&&e.target.closest&&e.target.closest('button');
  if(b&&LABELS.has((b.textContent||'').trim())){
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();b.remove();
  }
},true);
new MutationObserver(strip).observe(document.body,{childList:true,subtree:true});
strip();
})();
