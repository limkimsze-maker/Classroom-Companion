(function(){
'use strict';
const S=window.Support;
if(!S||S.slug!=='transition-countdown'||window.__transitionCompactDesignV2)return;
window.__transitionCompactDesignV2=true;

function install(){
  const panel=S.panel||document.getElementById('panel');
  const ring=document.getElementById('ring');
  const cue=document.getElementById('cue');
  const wrap=document.getElementById('marchWrap');
  const controls=panel&&panel.querySelector('.controls');
  if(!panel||!ring||!cue||!wrap||!controls)return false;

  document.body.classList.add('ccTransitionCompact');

  if(!document.getElementById('ccTransitionCompactStyleV2')){
    const style=document.createElement('style');
    style.id='ccTransitionCompactStyleV2';
    style.textContent=`
      body.ccTransitionCompact{
        --transitionBlue:#168cff;
        --transitionBlueDark:#0868c7;
        --transitionBlueSoft:#e7f3ff;
        --transitionBluePale:#f5faff;
        overflow:hidden!important;
        background:radial-gradient(circle at 50% 0,#fff 0,#eef7ff 48%,#e8f0f5 100%)!important
      }
      body.ccTransitionCompact .shell{height:100vh;min-height:0;padding:4px;overflow:hidden}
      body.ccTransitionCompact .top{width:100%;margin:0 auto 4px;padding:4px 6px;min-height:36px;border-radius:12px;border-color:#b9daf6;box-shadow:0 5px 14px rgba(20,79,131,.09)}
      body.ccTransitionCompact .toolIcon{width:30px;height:30px;border-radius:9px;font-size:16px;background:linear-gradient(145deg,var(--transitionBlue),#54adff);color:#fff;box-shadow:0 5px 12px rgba(22,140,255,.22)}
      body.ccTransitionCompact .toolTitle{font-size:13px;line-height:1.05}
      body.ccTransitionCompact .toolHint{display:none}
      body.ccTransitionCompact .topActions .btn{width:30px;height:30px;min-height:30px;padding:0;border-radius:9px;font-size:14px}
      body.ccTransitionCompact .topActions .label{display:none}
      body.ccTransitionCompact .stage{min-height:0;width:100%;margin:0;align-items:stretch}
      body.ccTransitionCompact .panel{
        width:100%;height:100%;min-height:0;margin:0;padding:7px;
        border-radius:15px;overflow:hidden;
        background:linear-gradient(145deg,#fff 0,#f8fcff 54%,#eef7ff 100%);
        border-color:#bfdcf5;box-shadow:0 8px 22px rgba(22,104,178,.11);
        display:grid;
        grid-template-columns:minmax(128px,.9fr) minmax(160px,1.1fr);
        grid-template-rows:30px minmax(96px,1fr) auto;
        column-gap:8px;row-gap:5px;align-items:center
      }
      body.ccTransitionCompact .panel>.eyebrow{
        grid-column:1;grid-row:1;margin:0;align-self:center;
        font-size:9px;letter-spacing:.16em;color:var(--transitionBlueDark);text-align:center
      }
      body.ccTransitionCompact #cue{
        grid-column:2;grid-row:1;margin:0;align-self:start;
        font-size:13px;line-height:1.05;text-align:center;letter-spacing:-.02em;color:#17324d
      }
      body.ccTransitionCompact .panel>.supportText{
        grid-column:2;grid-row:1;margin:0;align-self:end;
        font-size:8px;line-height:1.05;text-align:center;font-weight:850;color:#667085;white-space:nowrap
      }
      body.ccTransitionCompact #ring{
        grid-column:1;grid-row:2;
        width:min(35vw,calc(100vh - 118px),122px);
        min-width:108px;max-width:122px;margin:0 auto;
        background:conic-gradient(var(--transitionBlue) var(--progress,100%),#d9ebfb 0)!important;
        box-shadow:0 10px 24px rgba(22,140,255,.18),0 0 0 1px rgba(22,140,255,.05)
      }
      body.ccTransitionCompact #ring::before{inset:8px;background:#fff;box-shadow:inset 0 0 0 1px #d7e8f7}
      body.ccTransitionCompact #time{font-size:clamp(35px,9.4vw,45px);color:#17324d}
      body.ccTransitionCompact #marchWrap{
        grid-column:2;grid-row:2;width:100%;height:100%;max-width:none;margin:0;padding:3px 4px 3px;
        border-radius:13px;align-self:stretch;overflow:hidden;
        background:linear-gradient(180deg,#f9fdff,#e9f5ff);border-color:#bddbf5;
        display:flex;flex-direction:column;justify-content:center
      }
      body.ccTransitionCompact #marchBand{
        width:300px;min-height:96px;align-self:center;gap:10px;
        scale:.58;transform-origin:50% 58%;margin:-17px -62px -14px
      }
      body.ccTransitionCompact .marchGround{margin-top:0;height:6px;background:repeating-linear-gradient(90deg,#68b5fa 0 28px,#d7ebfb 28px 52px)}
      body.ccTransitionCompact .musicNote{color:var(--transitionBlueDark)}
      body.ccTransitionCompact .panel>.controls{
        grid-column:1/3;grid-row:3;margin:0!important;width:100%;display:grid!important;
        grid-template-columns:repeat(3,minmax(0,1fr));gap:5px!important;align-items:stretch!important
      }
      body.ccTransitionCompact .panel>.controls .btn{
        min-height:33px;padding:5px 5px;border-radius:10px;font-size:10px;line-height:1;
        font-weight:1000;box-shadow:none
      }
      body.ccTransitionCompact .panel>.controls [data-sec]{background:#fff;border-color:#c7d8e7;color:#17324d}
      body.ccTransitionCompact .panel>.controls [data-sec]:hover{border-color:#77bfff;background:#f7fbff;transform:none}
      body.ccTransitionCompact .panel>.controls [data-sec].selected{
        background:var(--transitionBlueSoft);border-color:var(--transitionBlue);color:#075ca8;
        box-shadow:inset 0 0 0 1px rgba(22,140,255,.14)
      }
      body.ccTransitionCompact #music{
        grid-column:1/3;min-height:36px;background:#eaf5ff;border-color:#8ac8ff;color:#075ca8;font-size:10.5px
      }
      body.ccTransitionCompact #start{
        grid-column:3;min-height:36px;background:linear-gradient(145deg,var(--transitionBlue),#0876dc);
        border-color:var(--transitionBlue);color:#fff;font-size:10.5px;box-shadow:0 4px 10px rgba(22,140,255,.19)
      }
      body.ccTransitionCompact .panel>.controls .btn:hover{transform:none}
      @media(max-width:360px){
        body.ccTransitionCompact .panel{grid-template-columns:minmax(118px,.88fr) minmax(152px,1.12fr);column-gap:6px;padding:6px}
        body.ccTransitionCompact #ring{width:112px;min-width:112px}
        body.ccTransitionCompact #time{font-size:38px}
        body.ccTransitionCompact #marchBand{scale:.54;margin-left:-70px;margin-right:-70px}
        body.ccTransitionCompact #cue{font-size:12px}
        body.ccTransitionCompact .panel>.supportText{font-size:7.5px}
        body.ccTransitionCompact .panel>.controls .btn{font-size:9.5px;padding-inline:3px}
      }
    `;
    document.head.appendChild(style);
  }

  const presetButtons=[...panel.querySelectorAll('[data-sec]')];
  function mark(button){presetButtons.forEach(b=>b.classList.toggle('selected',b===button));}
  presetButtons.forEach(b=>b.addEventListener('click',()=>mark(b)));
  const initial=presetButtons.find(b=>Number(b.dataset.sec)===60)||presetButtons[0];
  if(initial)mark(initial);
  return true;
}

let tries=0;
const id=setInterval(()=>{tries++;if(install()||tries>100)clearInterval(id)},50);
})();
