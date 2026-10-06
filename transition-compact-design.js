(function(){
'use strict';
const S=window.Support;
if(!S||S.slug!=='transition-countdown'||window.__transitionCompactDesignV1)return;
window.__transitionCompactDesignV1=true;

function install(){
  const panel=S.panel||document.getElementById('panel');
  const ring=document.getElementById('ring');
  const cue=document.getElementById('cue');
  const wrap=document.getElementById('marchWrap');
  const controls=panel&&panel.querySelector('.controls');
  if(!panel||!ring||!cue||!wrap||!controls)return false;

  document.body.classList.add('ccTransitionCompact');

  if(!document.getElementById('ccTransitionCompactStyleV1')){
    const style=document.createElement('style');
    style.id='ccTransitionCompactStyleV1';
    style.textContent=`
      body.ccTransitionCompact{overflow:hidden!important;background:radial-gradient(circle at 50% 0,#fff 0,#eef8f6 48%,#e8f0f3 100%)!important}
      body.ccTransitionCompact .shell{height:100vh;min-height:0;padding:4px;overflow:hidden}
      body.ccTransitionCompact .top{width:100%;margin:0 auto 4px;padding:4px 6px;min-height:36px;border-radius:12px;box-shadow:0 5px 14px rgba(18,32,46,.07)}
      body.ccTransitionCompact .toolIcon{width:30px;height:30px;border-radius:9px;font-size:16px}
      body.ccTransitionCompact .toolTitle{font-size:13px;line-height:1.05}
      body.ccTransitionCompact .toolHint{display:none}
      body.ccTransitionCompact .topActions .btn{width:30px;height:30px;min-height:30px;padding:0;border-radius:9px;font-size:14px}
      body.ccTransitionCompact .topActions .label{display:none}
      body.ccTransitionCompact .stage{min-height:0;width:100%;margin:0;align-items:stretch}
      body.ccTransitionCompact .panel{
        width:100%;height:100%;min-height:0;margin:0;padding:7px;
        border-radius:15px;overflow:hidden;
        background:linear-gradient(145deg,#fff 0,#f8fcfb 58%,#eef8f6 100%);
        border-color:#cfe4e0;box-shadow:0 8px 22px rgba(15,118,110,.10);
        display:grid;
        grid-template-columns:minmax(108px,.78fr) minmax(190px,1.22fr);
        grid-template-rows:22px 58px minmax(100px,1fr) auto;
        column-gap:10px;row-gap:5px;align-items:center
      }
      body.ccTransitionCompact .panel>.eyebrow{grid-column:2;grid-row:1;margin:0;align-self:end;font-size:9px;letter-spacing:.16em;color:#0f766e;text-align:left}
      body.ccTransitionCompact #ring{grid-column:1;grid-row:1/3;width:min(30vw,102px);min-width:92px;max-width:102px;margin:0 auto;box-shadow:0 8px 20px rgba(15,118,110,.13)}
      body.ccTransitionCompact #ring::before{inset:7px}
      body.ccTransitionCompact #time{font-size:clamp(30px,8vw,38px)}
      body.ccTransitionCompact #cue{grid-column:2;grid-row:2;margin:0;align-self:start;font-size:clamp(17px,4.6vw,23px);line-height:1.05;text-align:left;letter-spacing:-.03em}
      body.ccTransitionCompact .panel>.supportText{grid-column:2;grid-row:2;margin:0;align-self:end;font-size:10px;line-height:1.15;text-align:left;font-weight:850;color:#667085}
      body.ccTransitionCompact #marchWrap{grid-column:1/3;grid-row:3;width:100%;max-width:none;margin:0;padding:6px 8px 5px;border-radius:14px;align-self:stretch;display:flex;flex-direction:column;justify-content:center}
      body.ccTransitionCompact #marchBand{min-height:94px;gap:clamp(14px,4vw,34px)}
      body.ccTransitionCompact .marchGround{margin-top:2px}
      body.ccTransitionCompact .panel>.controls{
        grid-column:1/3;grid-row:4;margin:0!important;width:100%;display:grid!important;
        grid-template-columns:repeat(3,minmax(0,1fr));gap:5px!important;align-items:stretch!important
      }
      body.ccTransitionCompact .panel>.controls .btn{min-height:34px;padding:5px 6px;border-radius:10px;font-size:10px;line-height:1;font-weight:1000;box-shadow:none}
      body.ccTransitionCompact .panel>.controls [data-sec]{background:#fff;border-color:#cfdcda;color:#17324d}
      body.ccTransitionCompact .panel>.controls [data-sec].selected{background:#dff6f1;border-color:#0f766e;color:#0a5d57;box-shadow:inset 0 0 0 1px rgba(15,118,110,.18)}
      body.ccTransitionCompact #music{grid-column:1/3;min-height:37px;background:#eef9f7;border-color:#9dd9d0;color:#0a5d57;font-size:10.5px}
      body.ccTransitionCompact #start{grid-column:3;min-height:37px;background:#0f766e;border-color:#0f766e;color:#fff;font-size:10.5px;box-shadow:0 4px 10px rgba(15,118,110,.16)}
      body.ccTransitionCompact .panel>.controls .btn:hover{transform:none}
      @media(max-width:380px){
        body.ccTransitionCompact .panel{grid-template-columns:102px 1fr;column-gap:6px;padding:6px}
        body.ccTransitionCompact #ring{width:94px;min-width:94px}
        body.ccTransitionCompact #cue{font-size:17px}
        body.ccTransitionCompact .panel>.supportText{font-size:9px}
        body.ccTransitionCompact #marchBand{gap:10px}
        body.ccTransitionCompact .panel>.controls .btn{font-size:9px;padding-inline:3px}
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
