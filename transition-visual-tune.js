(function(){
'use strict';
const S=window.Support;
if(!S||S.slug!=='transition-countdown'||window.__transitionVisualTuneV2)return;
window.__transitionVisualTuneV2=true;

function syncMobileViewport(){
  if(!matchMedia('(max-width:760px)').matches)return;
  const h=Math.round(window.visualViewport?.height||window.innerHeight||0);
  if(h>0)document.documentElement.style.setProperty('--ccTransitionVisualHeight',h+'px');
}

function install(){
  if(!document.body.classList.contains('ccTransitionCompact'))return false;
  if(document.getElementById('ccTransitionVisualTuneV2'))return true;
  const style=document.createElement('style');
  style.id='ccTransitionVisualTuneV2';
  style.textContent=`
    body.ccTransitionCompact .panel{
      grid-template-columns:132px minmax(0,1fr)!important;
      column-gap:7px!important
    }
    body.ccTransitionCompact #ring{
      width:128px!important;
      min-width:128px!important;
      max-width:128px!important;
      box-shadow:0 11px 26px rgba(22,140,255,.22),0 0 0 1px rgba(22,140,255,.06)!important
    }
    body.ccTransitionCompact #ring::before{inset:8px!important}
    body.ccTransitionCompact #time{
      font-size:46px!important;
      line-height:.95!important;
      letter-spacing:-.065em!important
    }
    body.ccTransitionCompact .panel>.eyebrow{
      font-size:10px!important;
      letter-spacing:.17em!important
    }
    body.ccTransitionCompact #cue{
      font-size:15px!important;
      line-height:1.04!important;
      font-weight:1000!important
    }
    body.ccTransitionCompact .panel>.supportText{
      font-size:8.5px!important;
      line-height:1.08!important
    }
    body.ccTransitionCompact #marchWrap{
      padding:1px 2px 1px!important
    }
    body.ccTransitionCompact #marchBand{
      width:300px!important;
      min-height:100px!important;
      gap:10px!important;
      scale:.66!important;
      transform-origin:50% 58%!important;
      margin:-13px -51px -10px!important
    }
    body.ccTransitionCompact .panel>.controls .btn{
      min-height:35px!important;
      font-size:11.5px!important;
      padding:5px 5px!important;
      letter-spacing:0!important
    }
    body.ccTransitionCompact #music,
    body.ccTransitionCompact #start{
      min-height:38px!important;
      font-size:12px!important
    }
    @media(max-width:760px){
      body.ccTransitionCompact .shell{
        height:var(--ccTransitionVisualHeight,100dvh)!important;
        min-height:0!important;
        max-height:var(--ccTransitionVisualHeight,100dvh)!important;
        padding-bottom:max(4px,env(safe-area-inset-bottom))!important;
        overflow:hidden!important
      }
      body.ccTransitionCompact .stage{
        min-height:0!important;
        flex:1 1 auto!important;
        overflow:hidden!important
      }
      body.ccTransitionCompact .panel{
        height:100%!important;
        min-height:0!important;
        grid-template-rows:30px minmax(0,1fr) auto!important;
        overflow:hidden!important
      }
      body.ccTransitionCompact .panel>.controls{
        align-self:end!important
      }
    }
    @media(max-width:360px){
      body.ccTransitionCompact .panel{
        grid-template-columns:132px minmax(0,1fr)!important;
        column-gap:5px!important;
        padding:6px!important
      }
      body.ccTransitionCompact #ring{
        width:126px!important;
        min-width:126px!important;
        max-width:126px!important
      }
      body.ccTransitionCompact #time{font-size:45px!important}
      body.ccTransitionCompact #marchBand{
        scale:.64!important;
        margin:-12px -54px -9px!important
      }
      body.ccTransitionCompact #cue{font-size:14px!important}
      body.ccTransitionCompact .panel>.supportText{font-size:8.2px!important}
      body.ccTransitionCompact .panel>.controls .btn{
        min-height:35px!important;
        font-size:11px!important;
        padding-inline:3px!important
      }
      body.ccTransitionCompact #music,
      body.ccTransitionCompact #start{
        min-height:38px!important;
        font-size:11.5px!important
      }
    }
  `;
  document.head.appendChild(style);
  syncMobileViewport();
  if(matchMedia('(max-width:760px)').matches){
    window.addEventListener('resize',syncMobileViewport,{passive:true});
    window.visualViewport?.addEventListener('resize',syncMobileViewport,{passive:true});
  }
  return true;
}

let tries=0;
const id=setInterval(()=>{tries++;if(install()||tries>100)clearInterval(id)},40);
})();
