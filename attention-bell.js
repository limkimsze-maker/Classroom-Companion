(function(){
'use strict';
const S=window.Support;
if(!S||S.slug!=='attention-signal')return;
function install(){
  const btn=document.getElementById('signalBtn');
  const signal=document.getElementById('signal');
  if(!btn||!signal)return false;
  const extra=signal.nextElementSibling;
  if(extra&&extra.classList.contains('supportText'))extra.remove();
  let busy=false;
  function bell(){
    const strikes=[0,.34,.68];
    strikes.forEach(delay=>{
      S.tone(880,.32,.075,'triangle',delay);
      S.tone(1320,.24,.045,'sine',delay+.01);
      S.tone(1760,.14,.025,'sine',delay+.02);
    });
  }
  btn.onclick=()=>{
    if(busy)return;
    busy=true;
    bell();
    const seq=['3','2','1','Eyes here'];
    let i=0;
    setTimeout(function next(){
      signal.textContent=seq[i];
      signal.classList.remove('pulse');
      void signal.offsetWidth;
      signal.classList.add('pulse');
      i++;
      if(i<seq.length)setTimeout(next,650);
      else setTimeout(()=>{signal.classList.remove('pulse');busy=false},800);
    },850);
  };
  return true;
}
let tries=0;
const id=setInterval(()=>{tries++;if(install()||tries>30)clearInterval(id)},50);
})();