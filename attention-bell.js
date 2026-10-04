(function(){
'use strict';
if(window.__attentionBellInstalledV8)return;
const S=window.Support;
if(!S||S.slug!=='attention-signal')return;

function install(){
  const btn=document.getElementById('signalBtn');
  const signal=document.getElementById('signal');
  if(!btn||!signal)return false;
  if(window.__attentionBellInstalledV8)return true;
  window.__attentionBellInstalledV8=true;

  // Remove any old eye implementation so only this version controls the eyes.
  document.querySelectorAll('[id^="attentionGooglyStyle"]').forEach(x=>x.remove());
  document.getElementById('attentionEyes')?.remove();
  document.querySelectorAll('.attentionGooglyEyes').forEach(x=>x.remove());

  const extra=signal.nextElementSibling;
  if(extra&&extra.classList.contains('supportText'))extra.remove();

  const style=document.createElement('style');
  style.id='attentionGooglyStyleV8';
  style.textContent=`
    .attentionSignalStack{display:grid!important;justify-items:center!important;gap:16px!important;margin:0 auto 24px!important}
    .attentionEyes{display:flex!important;align-items:center!important;justify-content:center!important;gap:20px!important;min-height:108px!important;filter:drop-shadow(0 6px 10px rgba(23,50,77,.13))}
    .attentionEye{width:clamp(78px,8.5vw,118px)!important;height:clamp(94px,10vw,142px)!important;border-radius:50%!important;background:#fff!important;border:5px solid #17324d!important;position:relative!important;overflow:hidden!important;box-shadow:inset 0 -8px 0 rgba(15,118,110,.07)!important}
    .attentionPupil{position:absolute!important;width:40%!important;aspect-ratio:1!important;border-radius:50%!important;background:#17324d!important;left:50%!important;top:50%!important;transition:transform .10s linear!important;will-change:transform!important}
    .attentionPupil::after{content:'';position:absolute;width:28%;height:28%;border-radius:50%;background:#fff;left:17%;top:14%}
  `;
  document.head.appendChild(style);

  let stack=document.getElementById('attentionSignalStack');
  if(!stack){
    stack=document.createElement('div');
    stack.id='attentionSignalStack';
    stack.className='attentionSignalStack';
    signal.parentNode.insertBefore(stack,signal);
    stack.appendChild(signal);
  }

  const eyes=document.createElement('div');
  eyes.id='attentionEyes';
  eyes.className='attentionEyes';
  eyes.setAttribute('aria-hidden','true');
  eyes.innerHTML='<div class="attentionEye"><div class="attentionPupil"></div></div><div class="attentionEye"><div class="attentionPupil"></div></div>';
  stack.appendChild(eyes);

  const pupils=[...eyes.querySelectorAll('.attentionPupil')];
  let busy=false;
  let bellLoop=null;
  let eyeLoop=null;
  let eyeIndex=0;

  function setPupils(dx,dy){
    // Pixel translation is deliberately large and set inline with !important,
    // so movement remains visible regardless of browser or old CSS.
    pupils.forEach(p=>p.style.setProperty('transform',`translate(-50%,-50%) translate3d(${dx}px,${dy}px,0)`,'important'));
  }

  function stopEyes(){
    if(eyeLoop){clearInterval(eyeLoop);eyeLoop=null}
  }

  const idleMoves=[[0,0],[-18,0],[18,0],[0,-14],[0,14],[-15,-11],[15,11],[0,0]];
  function startIdleEyes(){
    stopEyes();
    eyeIndex=0;
    setPupils(0,0);
    eyeLoop=setInterval(()=>{
      const m=idleMoves[eyeIndex++%idleMoves.length];
      setPupils(m[0],m[1]);
    },600);
  }

  const countdownMoves=[[-24,0],[24,0],[0,-18],[0,18],[-22,-16],[22,-16],[22,16],[-22,16]];
  function startCountdownEyes(){
    stopEyes();
    eyeIndex=0;
    const move=()=>{
      const m=countdownMoves[eyeIndex++%countdownMoves.length];
      setPupils(m[0],m[1]);
    };
    move();
    eyeLoop=setInterval(move,145);
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

  function stopBell(){if(bellLoop){clearInterval(bellLoop);bellLoop=null}}
  function startBell(){stopBell();schoolBellStrike();bellLoop=setInterval(schoolBellStrike,270)}

  startIdleEyes();

  btn.onclick=()=>{
    if(busy)return;
    busy=true;
    const seq=['3','2','1','Eyes here'];
    let i=0;
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
        stopEyes();
        setPupils(0,0);
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