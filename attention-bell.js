(function(){
'use strict';
if(window.__attentionBellInstalledV5)return;
const S=window.Support;
if(!S||S.slug!=='attention-signal')return;

function install(){
  const btn=document.getElementById('signalBtn');
  const signal=document.getElementById('signal');
  if(!btn||!signal)return false;
  if(window.__attentionBellInstalledV5)return true;
  window.__attentionBellInstalledV5=true;

  const extra=signal.nextElementSibling;
  if(extra&&extra.classList.contains('supportText'))extra.remove();

  if(!document.getElementById('attentionGooglyStyleV5')){
    const style=document.createElement('style');
    style.id='attentionGooglyStyleV5';
    style.textContent=`
      .attentionGooglyEyes{display:none!important}
      .attentionSignalStack{display:grid!important;justify-items:center!important;gap:16px!important;margin:0 auto 24px!important}
      .attentionEyes{display:flex!important;align-items:center!important;justify-content:center!important;gap:18px!important;min-height:92px!important;transform-origin:center;filter:drop-shadow(0 6px 10px rgba(23,50,77,.12))}
      .attentionEye{display:block!important;width:clamp(66px,7.5vw,108px)!important;height:clamp(82px,9vw,132px)!important;border-radius:50%!important;background:#fff!important;border:5px solid #17324d!important;position:relative!important;overflow:hidden!important;box-shadow:inset 0 -7px 0 rgba(15,118,110,.06)!important}
      .attentionPupil{display:block!important;position:absolute!important;width:38%!important;aspect-ratio:1!important;border-radius:50%!important;background:#17324d!important;left:50%!important;top:50%!important;transform:translate(-50%,-50%);transition:transform .15s ease}
      .attentionPupil::after{content:'';position:absolute;width:28%;height:28%;border-radius:50%;background:#fff;left:18%;top:14%}
      .attentionEyes.wiggle{animation:attentionEyesWiggleV5 .32s ease-in-out infinite alternate}
      .attentionEyes.wiggle .attentionEye:first-child .attentionPupil{animation:attentionPupilLeftV5 .48s ease-in-out infinite alternate}
      .attentionEyes.wiggle .attentionEye:last-child .attentionPupil{animation:attentionPupilRightV5 .48s ease-in-out infinite alternate}
      @keyframes attentionEyesWiggleV5{0%{transform:translateX(-9px) rotate(-4deg)}100%{transform:translateX(9px) rotate(4deg)}}
      @keyframes attentionPupilLeftV5{0%{transform:translate(-72%,-50%)}100%{transform:translate(-28%,-50%)}}
      @keyframes attentionPupilRightV5{0%{transform:translate(-28%,-50%)}100%{transform:translate(-72%,-50%)}}
      @media (prefers-reduced-motion:reduce){.attentionEyes.wiggle,.attentionEyes.wiggle .attentionPupil{animation:none!important}}
    `;
    document.head.appendChild(style);
  }

  let stack=document.getElementById('attentionSignalStack');
  if(!stack){
    stack=document.createElement('div');
    stack.id='attentionSignalStack';
    stack.className='attentionSignalStack';
    signal.parentNode.insertBefore(stack,signal);
    stack.appendChild(signal);
  }

  let eyes=document.getElementById('attentionEyes');
  if(!eyes){
    eyes=document.createElement('div');
    eyes.id='attentionEyes';
    eyes.className='attentionEyes';
    eyes.setAttribute('aria-hidden','true');
    eyes.innerHTML='<div class="attentionEye"><div class="attentionPupil"></div></div><div class="attentionEye"><div class="attentionPupil"></div></div>';
    stack.appendChild(eyes);
  }else{
    eyes.className='attentionEyes';
    if(!eyes.querySelector('.attentionEye'))eyes.innerHTML='<div class="attentionEye"><div class="attentionPupil"></div></div><div class="attentionEye"><div class="attentionPupil"></div></div>';
  }

  let busy=false;
  let bellLoop=null;

  function schoolBellStrike(){
    S.tone(820,.15,.085,'square',0);
    S.tone(1230,.12,.045,'triangle',.006);
    S.tone(1640,.08,.022,'sine',.012);
    setTimeout(()=>{
      S.tone(940,.14,.082,'square',0);
      S.tone(1410,.11,.042,'triangle',.006);
      S.tone(1880,.08,.020,'sine',.012);
    },115);
  }

  function startBell(){
    stopBell();
    schoolBellStrike();
    bellLoop=setInterval(schoolBellStrike,270);
  }

  function stopBell(){
    if(bellLoop){clearInterval(bellLoop);bellLoop=null;}
  }

  btn.onclick=()=>{
    if(busy)return;
    busy=true;
    const seq=['3','2','1','Eyes here'];
    let i=0;
    eyes.classList.add('wiggle');
    startBell();

    function next(){
      signal.textContent=seq[i];
      signal.classList.remove('pulse');
      void signal.offsetWidth;
      signal.classList.add('pulse');
      i++;
      if(i<seq.length){
        setTimeout(next,650);
      }else{
        stopBell();
        setTimeout(()=>{
          signal.classList.remove('pulse');
          eyes.classList.remove('wiggle');
          busy=false;
        },900);
      }
    }
    next();
  };
  return true;
}

let tries=0;
const id=setInterval(()=>{tries++;if(install()||tries>80)clearInterval(id)},50);
})();