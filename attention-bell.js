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

  if(!document.getElementById('attentionGooglyStyle')){
    const style=document.createElement('style');
    style.id='attentionGooglyStyle';
    style.textContent=`
      .attentionSignalStack{display:grid;justify-items:center;gap:12px;margin:0 auto 20px}
      .attentionGooglyEyes{font-size:clamp(70px,9vw,120px);line-height:1;transform-origin:50% 55%;user-select:none;filter:drop-shadow(0 5px 8px rgba(23,50,77,.10))}
      .attentionGooglyEyes.wiggle{animation:attentionEyesWiggle .34s ease-in-out infinite alternate}
      @keyframes attentionEyesWiggle{
        0%{transform:translateX(-8px) rotate(-5deg) scale(1)}
        50%{transform:translateX(2px) rotate(2deg) scale(1.04)}
        100%{transform:translateX(8px) rotate(5deg) scale(1)}
      }
      @media (prefers-reduced-motion:reduce){.attentionGooglyEyes.wiggle{animation:none}}
    `;
    document.head.appendChild(style);
  }

  let stack=document.getElementById('attentionSignalStack');
  let eyes=document.getElementById('attentionGooglyEyes');
  if(!stack){
    stack=document.createElement('div');
    stack.id='attentionSignalStack';
    stack.className='attentionSignalStack';
    signal.parentNode.insertBefore(stack,signal);
    stack.appendChild(signal);
    eyes=document.createElement('div');
    eyes.id='attentionGooglyEyes';
    eyes.className='attentionGooglyEyes';
    eyes.setAttribute('aria-hidden','true');
    eyes.textContent='👀';
    stack.appendChild(eyes);
  }

  let busy=false;
  let bellLoop=null;

  function schoolBellStrike(){
    // Metallic alternating hits for a traditional electric school-bell effect.
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
        // The bell rings for the full 3-2-1 countdown, then stops on “Eyes here”.
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
const id=setInterval(()=>{tries++;if(install()||tries>30)clearInterval(id)},50);
})();