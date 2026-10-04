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
  function schoolBell(){
    // Fast alternating metallic strikes to imitate a traditional electric school bell.
    const hits=[0,.12,.24,.36,.48,.60,.72,.84,.96,1.08];
    hits.forEach((delay,i)=>{
      const base=i%2?940:820;
      S.tone(base,.16,.085,'square',delay);
      S.tone(base*1.5,.13,.045,'triangle',delay+.008);
      S.tone(base*2,.09,.022,'sine',delay+.014);
    });
  }
  btn.onclick=()=>{
    if(busy)return;
    busy=true;
    schoolBell();
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
    },1250);
  };
  return true;
}
let tries=0;
const id=setInterval(()=>{tries++;if(install()||tries>30)clearInterval(id)},50);
})();