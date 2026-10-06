(function(){
'use strict';
const S=window.Support;
if(!S||S.slug!=='confidence-check'||window.__confidenceFullscreenDesignV1)return;
window.__confidenceFullscreenDesignV1=true;

function install(){
  if(!document.body.classList.contains('ccConfidenceFit'))return false;
  if(document.getElementById('confidenceFullscreenDesignV1'))return true;
  const style=document.createElement('style');
  style.id='confidenceFullscreenDesignV1';
  style.textContent=`
    @media (min-width:1200px) and (min-height:700px){
      body.ccConfidenceFit .shell{
        height:100vh!important;
        padding:14px 18px 18px!important;
      }
      body.ccConfidenceFit .top{
        width:min(1440px,calc(100vw - 36px))!important;
        max-width:none!important;
        margin:0 auto 12px!important;
        padding:10px 14px!important;
        border-radius:20px!important;
      }
      body.ccConfidenceFit .toolIcon{
        width:52px!important;
        height:52px!important;
        font-size:27px!important;
      }
      body.ccConfidenceFit .toolTitle{font-size:21px!important}
      body.ccConfidenceFit .toolHint{font-size:12px!important}
      body.ccConfidenceFit .stage{
        width:100%!important;
        max-width:none!important;
        min-height:0!important;
        margin:0 auto!important;
        align-items:center!important;
        justify-content:center!important;
        overflow:hidden!important;
      }
      body.ccConfidenceFit .panel{
        width:min(1320px,calc(100vw - 80px))!important;
        max-width:none!important;
        height:min(690px,calc(100vh - 115px))!important;
        max-height:none!important;
        margin:0 auto!important;
        padding:28px 40px 34px!important;
        border-radius:32px!important;
        display:flex!important;
        flex-direction:column!important;
        justify-content:center!important;
        overflow:hidden!important;
        box-shadow:0 24px 62px rgba(18,32,46,.13)!important;
      }
      body.ccConfidenceFit .panel>.eyebrow{
        font-size:14px!important;
        margin:0 0 5px!important;
        letter-spacing:.17em!important;
      }
      body.ccConfidenceFit .panel>.hero{
        font-size:clamp(48px,4vw,64px)!important;
        line-height:1!important;
        margin:0 auto 9px!important;
      }
      body.ccConfidenceFit .fingerInstruction{
        font-size:clamp(19px,1.6vw,24px)!important;
        max-width:1000px!important;
        line-height:1.25!important;
      }
      body.ccConfidenceFit .fingerMax{
        margin-top:10px!important;
        padding:8px 14px!important;
        font-size:14px!important;
      }
      body.ccConfidenceFit .fingerGrid{
        width:min(1160px,100%)!important;
        max-width:none!important;
        flex:1 1 auto!important;
        min-height:0!important;
        grid-template-columns:repeat(2,minmax(0,1fr))!important;
        grid-template-rows:repeat(2,minmax(0,1fr))!important;
        gap:20px!important;
        margin:20px auto 0!important;
      }
      body.ccConfidenceFit .fingerCard{
        min-height:0!important;
        height:100%!important;
        padding:18px 24px!important;
        grid-template-columns:170px minmax(0,1fr)!important;
        column-gap:20px!important;
        border-radius:26px!important;
        box-shadow:0 12px 30px rgba(18,32,46,.075)!important;
      }
      body.ccConfidenceFit .fingerCard:before{
        width:7px!important;
        border-radius:26px 0 0 26px!important;
      }
      body.ccConfidenceFit .fingerVisuals{
        gap:7px!important;
      }
      body.ccConfidenceFit .confidencePic{
        font-size:58px!important;
      }
      body.ccConfidenceFit .cartoonHand{
        width:100px!important;
        height:100px!important;
      }
      body.ccConfidenceFit .fingerCount{
        padding:7px 12px!important;
        font-size:14px!important;
        margin-bottom:6px!important;
      }
      body.ccConfidenceFit .fingerLabel{
        font-size:clamp(24px,2vw,31px)!important;
        line-height:1.05!important;
      }
      body.ccConfidenceFit .fingerSub{
        font-size:15px!important;
        line-height:1.22!important;
        margin-top:8px!important;
      }
    }

    @media (min-width:1400px) and (min-height:820px){
      body.ccConfidenceFit .panel{
        width:min(1380px,calc(100vw - 110px))!important;
        height:min(740px,calc(100vh - 128px))!important;
        padding:32px 48px 38px!important;
      }
      body.ccConfidenceFit .fingerGrid{
        width:min(1220px,100%)!important;
        gap:24px!important;
      }
      body.ccConfidenceFit .fingerCard{
        grid-template-columns:190px minmax(0,1fr)!important;
        padding:22px 28px!important;
      }
      body.ccConfidenceFit .confidencePic{font-size:64px!important}
      body.ccConfidenceFit .cartoonHand{width:112px!important;height:112px!important}
      body.ccConfidenceFit .fingerCount{font-size:15px!important}
      body.ccConfidenceFit .fingerLabel{font-size:clamp(27px,2vw,34px)!important}
      body.ccConfidenceFit .fingerSub{font-size:16px!important}
    }
  `;
  document.head.appendChild(style);
  return true;
}

let tries=0;
const id=setInterval(()=>{tries++;if(install()||tries>100)clearInterval(id)},40);
})();
