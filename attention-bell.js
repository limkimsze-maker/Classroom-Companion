(function(){
'use strict';
if(window.__attentionBellInstalledV7)return;
const S=window.Support;
if(!S||S.slug!=='attention-signal')return;

function install(){
  const btn=document.getElementById('signalBtn');
  const signal=document.getElementById('signal');
  if(!btn||!signal)return false;
  if(window.__attentionBellInstalledV7)return true;
  window.__attentionBellInstalledV7=true;

  const extra=signal.nextElementSibling;
  if(extra&&extra.classList.contains('supportText'))extra.remove();

  if(!document.getElementById('attentionGooglyStyleV7')){
    const style=document.createElement('style');
    style.id='attentionGooglyStyleV7';
    style.textContent=`
      .attentionGooglyEyes{display:none!important}
      .attentionSignalStack{display:grid!important;justify-items:center!important;gap:16px!important;margin:0 auto 24px!important}
      .attentionEyes{display:flex!important;align-items:center!important;justify-content:center!important;gap:18px!important;min-height:92px!important;transform-origin:center!important;filter:drop-shadow(0 6px 10px rgba(23,50,77,.12))}
      .attentionEye{display:block!important;width:clamp(72px,8vw,112px)!important;height:clamp(88px,9.5vw,136px)!important;border-radius:50%!important;background:#fff!important;border:5px solid #17324d!important;position:relative!important;overflow:hidden!important;box-shadow:inset 0 -7px 0 rgba(15,118,110,.06)!important}
      .attentionPupil{display:block!important;position:absolute!important;width:38%!important;aspect-ratio:1!important;border-radius:50%!important;background:#17324d!important;transform:translate(-50%,-50%)!important;transition:left .12s ease,top .12s ease!important;animation:none!important}
      .attentionPupil::after{content:'';position:absolute;width:28%;height:28%;border-radius:50%;background:#fff;left:18%;top:14%}
      .attentionEyes.counting{animation:attentionEyesWiggleV7 .26s ease-in-out infinite alternate!important}
      @keyframes attentionEyesWiggleV7{0%{transform:translateX(-5px) rotate(-2deg)}100%{transform:translateX(5px) rotate(2deg)}}
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

  const pupils=[...eyes.querySelectorAll('.attentionPupil')];
  let busy=false;
  let bellLoop=null;
  let eyeLoop=null;
  let moveIndex=0;

  const positions=[
    [28,48],[72,48],[50,28],[50,72],[30,30],[70,70],[70,30],[30,70],[50,50]
  ];

  function movePupils(x,y,opposite=false){
    pupils.forEach((p,i)=>{
      const px=opposite&&i===1?100-x:x;
      p.style.setProperty('left',px+'%','important');
      p.style.setProperty('top',y+'%','important');
    });
  }

  function centreEyes(){movePupils(50,50,false)}

  function stopEyeMovement(){
    if(eyeLoop){clearInterval(eyeLoop);eyeLoop=null}
  }

  function startIdleEyes(){
    stopEyeMovement();
    centreEyes();
    eyeLoop=setInterval(()=>{
      const p=positions[moveIndex++%positions.length];
      movePupils(p[0],p[1],false);
    },850);
  }

  function startCountdownEyes(){
    stopEyeMovement();
    moveIndex=0;
    const dart=[[24,45],[76,45],[50,24],[50,74],[28,28],[72,28],[72,68],[28,68]];
    const move=()=>{
      const p=dart[moveIndex++%dart.length];
      movePupils(p[0],p[1],false);
    };
    move();
    eyeLoop=setInterval(move,170);
  }

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
    if(bellLoop){clearInterval(bellLoop);bellLoop=null}
  }

  startIdleEyes();

  btn.onclick=()=>{
    if(busy)return;
    busy=true;
    const seq=['3','2','1','Eyes here'];
    let i=0;
    eyes.classList.add('counting');
    startCountdownEyes();
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
        stopEyeMovement();
        eyes.classList.remove('counting');
        centreEyes();
        setTimeout(()=>{
          signal.classList.remove('pulse');
          busy=false;
          startIdleEyes();
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