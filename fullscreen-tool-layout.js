(function(){
'use strict';
if(window.__ccFullscreenToolLayoutV1)return;
const params=new URLSearchParams(location.search);
if(params.get('display')!=='fullscreen')return;
const S=window.Support;
if(!S)return;
const slug=S.slug;
if(slug!=='timer-calm-music'&&slug!=='transition-countdown')return;
window.__ccFullscreenToolLayoutV1=true;
document.body.classList.add('ccTrueFullscreenLayout');

const style=document.createElement('style');
style.id='ccTrueFullscreenLayoutStyleV1';
style.textContent=`
  html,body{width:100%!important;height:100%!important;min-height:100%!important;overflow:hidden!important}
  body.ccTrueFullscreenLayout .shell{
    width:100vw!important;height:100vh!important;min-height:0!important;
    padding:16px 18px 18px!important;overflow:hidden!important
  }
  body.ccTrueFullscreenLayout .top{
    width:100%!important;max-width:none!important;min-height:58px!important;
    margin:0 0 12px!important;padding:9px 13px!important;border-radius:18px!important
  }
  body.ccTrueFullscreenLayout .toolIcon{width:44px!important;height:44px!important;border-radius:13px!important;font-size:22px!important}
  body.ccTrueFullscreenLayout .toolTitle{font-size:20px!important;line-height:1.1!important}
  body.ccTrueFullscreenLayout .toolHint{display:block!important;font-size:12px!important;margin-top:2px!important}
  body.ccTrueFullscreenLayout .topActions{display:none!important}
  body.ccTrueFullscreenLayout .stage{
    width:100%!important;max-width:none!important;min-height:0!important;margin:0!important;
    flex:1!important;align-items:stretch!important;justify-content:stretch!important
  }
  body.ccTrueFullscreenLayout .panel{
    width:100%!important;max-width:none!important;height:100%!important;min-height:0!important;
    margin:0!important;border-radius:28px!important;padding:clamp(22px,2.5vw,42px)!important;overflow:hidden!important
  }

  /* TIMER — scale with the screen instead of keeping the PiP proportions. */
  body.ccTrueFullscreenLayout.ccTimerCompact .panel{
    display:flex!important;align-items:center!important;justify-content:center!important;
    background:linear-gradient(145deg,#fff 0,#fff7fb 54%,#ffeaf4 100%)!important
  }
  body.ccTrueFullscreenLayout.ccTimerCompact .timerCompactGrid{
    width:min(1420px,100%)!important;height:100%!important;margin:auto!important;
    display:grid!important;grid-template-columns:minmax(420px,.9fr) minmax(520px,1.1fr)!important;
    gap:clamp(42px,5vw,90px)!important;align-items:center!important
  }
  body.ccTrueFullscreenLayout.ccTimerCompact .timerVisual{height:auto!important;min-width:0!important}
  body.ccTrueFullscreenLayout.ccTimerCompact .timerVisual .eyebrow{
    font-size:clamp(15px,1.15vw,20px)!important;letter-spacing:.2em!important;margin-bottom:12px!important
  }
  body.ccTrueFullscreenLayout.ccTimerCompact .timerRing{
    width:min(38vw,54vh,500px)!important;min-width:310px!important;max-width:500px!important;
    box-shadow:0 20px 46px rgba(255,47,146,.22),0 0 0 1px rgba(255,47,146,.08)!important
  }
  body.ccTrueFullscreenLayout.ccTimerCompact .timerRing::before{inset:18px!important}
  body.ccTrueFullscreenLayout.ccTimerCompact .timerValue{
    font-size:clamp(78px,8vw,124px)!important;letter-spacing:-.065em!important
  }
  body.ccTrueFullscreenLayout.ccTimerCompact .timerMicro{
    margin-top:16px!important;font-size:clamp(14px,1vw,18px)!important;line-height:1.25!important
  }
  body.ccTrueFullscreenLayout.ccTimerCompact .timerActions{
    width:100%!important;max-width:690px!important;margin:auto!important;gap:14px!important
  }
  body.ccTrueFullscreenLayout.ccTimerCompact .timerPresets{gap:12px!important}
  body.ccTrueFullscreenLayout.ccTimerCompact .timerPresets .btn{
    min-height:66px!important;border-radius:16px!important;padding:12px 10px!important;
    font-size:clamp(17px,1.25vw,22px)!important
  }
  body.ccTrueFullscreenLayout.ccTimerCompact .timerMusic{
    min-height:68px!important;border-radius:16px!important;padding:12px 16px!important;
    font-size:clamp(17px,1.2vw,21px)!important
  }
  body.ccTrueFullscreenLayout.ccTimerCompact .timerMainControls{gap:12px!important}
  body.ccTrueFullscreenLayout.ccTimerCompact .timerMainControls .btn{
    min-height:74px!important;border-radius:17px!important;padding:14px 16px!important;
    font-size:clamp(19px,1.35vw,24px)!important
  }
  body.ccTrueFullscreenLayout.ccTimerCompact .timerStatus{
    min-height:24px!important;font-size:clamp(13px,.95vw,17px)!important;line-height:1.25!important
  }

  /* TRANSITION — timer and marching band share the visual weight. */
  body.ccTrueFullscreenLayout.ccTransitionCompact .panel{
    display:grid!important;
    grid-template-columns:minmax(350px,.78fr) minmax(610px,1.22fr)!important;
    grid-template-rows:82px minmax(0,1fr) 150px!important;
    column-gap:clamp(30px,4vw,72px)!important;row-gap:12px!important;
    background:linear-gradient(145deg,#fff 0,#f4faff 52%,#e5f3ff 100%)!important
  }
  body.ccTrueFullscreenLayout.ccTransitionCompact .panel>.eyebrow{
    grid-column:1!important;grid-row:1!important;align-self:end!important;
    font-size:clamp(15px,1vw,19px)!important;letter-spacing:.19em!important;text-align:center!important
  }
  body.ccTrueFullscreenLayout.ccTransitionCompact #cue{
    grid-column:2!important;grid-row:1!important;align-self:start!important;
    font-size:clamp(32px,2.5vw,48px)!important;line-height:1!important;text-align:left!important
  }
  body.ccTrueFullscreenLayout.ccTransitionCompact .panel>.supportText{
    grid-column:2!important;grid-row:1!important;align-self:end!important;
    font-size:clamp(15px,1.1vw,19px)!important;line-height:1.2!important;text-align:left!important;white-space:normal!important
  }
  body.ccTrueFullscreenLayout.ccTransitionCompact #ring{
    grid-column:1!important;grid-row:2!important;
    width:min(34vw,48vh,390px)!important;min-width:280px!important;max-width:390px!important;
    box-shadow:0 20px 46px rgba(22,140,255,.22),0 0 0 1px rgba(22,140,255,.07)!important
  }
  body.ccTrueFullscreenLayout.ccTransitionCompact #ring::before{inset:17px!important}
  body.ccTrueFullscreenLayout.ccTransitionCompact #time{
    font-size:clamp(78px,7.4vw,116px)!important;letter-spacing:-.065em!important
  }
  body.ccTrueFullscreenLayout.ccTransitionCompact #marchWrap{
    grid-column:2!important;grid-row:2!important;width:100%!important;height:100%!important;
    min-height:330px!important;margin:0!important;padding:18px 24px 14px!important;border-radius:24px!important;
    display:flex!important;align-items:center!important;justify-content:center!important
  }
  body.ccTrueFullscreenLayout.ccTransitionCompact #marchBand{
    width:520px!important;min-height:150px!important;gap:42px!important;
    scale:1.28!important;transform-origin:50% 58%!important;margin:0!important
  }
  body.ccTrueFullscreenLayout.ccTransitionCompact .marchGround{
    width:100%!important;height:10px!important;margin-top:16px!important
  }
  body.ccTrueFullscreenLayout.ccTransitionCompact .panel>.controls{
    grid-column:1/3!important;grid-row:3!important;width:min(1100px,100%)!important;margin:0 auto!important;
    display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:12px!important
  }
  body.ccTrueFullscreenLayout.ccTransitionCompact .panel>.controls .btn{
    min-height:58px!important;border-radius:15px!important;padding:11px 12px!important;
    font-size:clamp(16px,1.15vw,20px)!important
  }
  body.ccTrueFullscreenLayout.ccTransitionCompact #music,
  body.ccTrueFullscreenLayout.ccTransitionCompact #start{
    min-height:66px!important;font-size:clamp(17px,1.2vw,21px)!important
  }

  @media(max-width:1050px), (max-height:700px){
    body.ccTrueFullscreenLayout .shell{padding:10px!important}
    body.ccTrueFullscreenLayout .top{min-height:48px!important;margin-bottom:8px!important;padding:6px 10px!important}
    body.ccTrueFullscreenLayout .toolIcon{width:36px!important;height:36px!important;font-size:18px!important}
    body.ccTrueFullscreenLayout .toolTitle{font-size:16px!important}
    body.ccTrueFullscreenLayout .toolHint{display:none!important}
    body.ccTrueFullscreenLayout .panel{padding:14px!important;border-radius:20px!important}
    body.ccTrueFullscreenLayout.ccTimerCompact .timerCompactGrid{
      grid-template-columns:minmax(300px,.9fr) minmax(390px,1.1fr)!important;gap:28px!important
    }
    body.ccTrueFullscreenLayout.ccTimerCompact .timerRing{width:min(37vw,50vh,390px)!important;min-width:260px!important}
    body.ccTrueFullscreenLayout.ccTimerCompact .timerValue{font-size:clamp(66px,7vw,96px)!important}
    body.ccTrueFullscreenLayout.ccTimerCompact .timerPresets .btn{min-height:52px!important;font-size:16px!important}
    body.ccTrueFullscreenLayout.ccTimerCompact .timerMusic{min-height:54px!important;font-size:16px!important}
    body.ccTrueFullscreenLayout.ccTimerCompact .timerMainControls .btn{min-height:58px!important;font-size:18px!important}
    body.ccTrueFullscreenLayout.ccTransitionCompact .panel{
      grid-template-columns:minmax(280px,.8fr) minmax(460px,1.2fr)!important;
      grid-template-rows:64px minmax(0,1fr) 120px!important;column-gap:24px!important
    }
    body.ccTrueFullscreenLayout.ccTransitionCompact #ring{width:min(31vw,43vh,320px)!important;min-width:240px!important}
    body.ccTrueFullscreenLayout.ccTransitionCompact #time{font-size:clamp(64px,6vw,92px)!important}
    body.ccTrueFullscreenLayout.ccTransitionCompact #cue{font-size:clamp(25px,2.2vw,34px)!important}
    body.ccTrueFullscreenLayout.ccTransitionCompact #marchWrap{min-height:250px!important;padding:10px 14px!important}
    body.ccTrueFullscreenLayout.ccTransitionCompact #marchBand{scale:1.02!important;gap:32px!important}
    body.ccTrueFullscreenLayout.ccTransitionCompact .panel>.controls .btn{min-height:48px!important;font-size:15px!important}
    body.ccTrueFullscreenLayout.ccTransitionCompact #music,
    body.ccTrueFullscreenLayout.ccTransitionCompact #start{min-height:54px!important;font-size:16px!important}
  }
`;
document.head.appendChild(style);
})();
