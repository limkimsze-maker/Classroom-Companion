(function(){
'use strict';
const S=window.Support;
if(!S||S.slug!=='timer-calm-music'||window.__timerCalmV9)return;

function install(){
  const panel=S.panel||document.getElementById('panel');
  const ambient=window.TimerCalmAmbient;
  if(!panel||!ambient)return false;
  window.__timerCalmV9=true;
  document.body.classList.add('ccTimerCompact');

  if(!document.getElementById('ccTimerCompactStyleV9')){
    const style=document.createElement('style');
    style.id='ccTimerCompactStyleV9';
    style.textContent=`
      body.ccTimerCompact{
        --timerPink:#ff2f92;
        --timerPinkDark:#d91f72;
        --timerPinkSoft:#ffe3f0;
        --timerPinkPale:#fff5fa;
        overflow:hidden!important;
        background:radial-gradient(circle at 48% -10%,#fff 0,#fff4f9 46%,#edf4f6 100%)!important
      }
      body.ccTimerCompact .shell{height:100vh;min-height:0;padding:4px;overflow:hidden}
      body.ccTimerCompact .top{width:100%;margin:0 auto 4px;padding:4px 6px;min-height:36px;border-radius:12px;border-color:#f3c6da;box-shadow:0 5px 14px rgba(61,31,46,.08)}
      body.ccTimerCompact .toolIcon{width:30px;height:30px;border-radius:9px;font-size:16px;background:linear-gradient(145deg,var(--timerPink),#ff65ad);color:#fff;box-shadow:0 5px 12px rgba(255,47,146,.22)}
      body.ccTimerCompact .toolTitle{font-size:13px;line-height:1.05}
      body.ccTimerCompact .toolHint{display:none}
      body.ccTimerCompact .topActions .btn{width:30px;height:30px;min-height:30px;padding:0;border-radius:9px;font-size:14px}
      body.ccTimerCompact .topActions .label{display:none}
      body.ccTimerCompact .stage{min-height:0;width:100%;margin:0;align-items:stretch}
      body.ccTimerCompact .panel{width:100%;height:100%;min-height:0;margin:0;padding:7px;border-radius:15px;overflow:hidden;background:linear-gradient(145deg,#fff 0,#fff8fb 58%,#fff1f7 100%);border-color:#f2c6d9;box-shadow:0 8px 22px rgba(217,31,114,.10)}
      body.ccTimerCompact .timerCompactGrid{height:100%;width:100%;display:grid;grid-template-columns:minmax(148px,1.04fr) minmax(170px,.96fr);gap:10px;align-items:center}
      body.ccTimerCompact .timerVisual{min-width:0;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center}
      body.ccTimerCompact .timerVisual .eyebrow{font-size:9px;letter-spacing:.17em;margin:0 0 4px;color:var(--timerPinkDark)}
      body.ccTimerCompact .timerRing{
        width:min(51vw,calc(100vh - 78px),210px);
        min-width:144px;
        max-width:210px;
        margin:0;
        background:conic-gradient(var(--timerPink) var(--progress,100%),#f8dce9 0)!important;
        box-shadow:0 10px 24px rgba(255,47,146,.20),0 0 0 1px rgba(255,47,146,.05)
      }
      body.ccTimerCompact .timerRing::before{inset:9px;background:#fff;border-radius:50%;box-shadow:inset 0 0 0 1px #f8d7e6}
      body.ccTimerCompact .timerValue{font-size:clamp(40px,11.5vw,60px);letter-spacing:-.065em;color:#17324d}
      body.ccTimerCompact .timerMicro{margin-top:4px;color:#7d6470;font-size:8px;line-height:1.1;font-weight:850;text-align:center;white-space:nowrap}
      body.ccTimerCompact .timerActions{min-width:0;display:grid;gap:6px;align-content:center}
      body.ccTimerCompact .timerPresets{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px}
      body.ccTimerCompact .timerPresets .btn{min-height:35px;padding:5px 4px;border-radius:10px;font-size:10.5px;line-height:1;font-weight:1000;background:#fff;border-color:#e6cbd6;color:#17324d;box-shadow:0 2px 7px rgba(57,39,48,.04)}
      body.ccTimerCompact .timerPresets .btn:hover{border-color:#ff86bc;background:#fff8fb;transform:none}
      body.ccTimerCompact .timerPresets .btn.selected{background:var(--timerPinkSoft);border-color:var(--timerPink);color:#a91759;box-shadow:inset 0 0 0 1px rgba(255,47,146,.15)}
      body.ccTimerCompact .timerMusic{width:100%;min-height:37px;padding:6px 8px;border-radius:10px;font-size:10.5px;line-height:1.05;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background:#fff0f7!important;border-color:#ffb6d6!important;color:#9d1851!important}
      body.ccTimerCompact .timerMainControls{display:grid;grid-template-columns:1.16fr .84fr;gap:6px}
      body.ccTimerCompact .timerMainControls .btn{min-height:40px;padding:6px 7px;border-radius:11px;font-size:11.5px;line-height:1;font-weight:1000}
      body.ccTimerCompact .timerMainControls .btn.primary{background:linear-gradient(145deg,var(--timerPink),#e82180)!important;border-color:var(--timerPink)!important;color:#fff!important;box-shadow:0 5px 12px rgba(255,47,146,.20)}
      body.ccTimerCompact .timerStatus{min-height:10px;color:#7d6470;font-size:8px;line-height:1.1;font-weight:850;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center}
      @media(max-width:360px){
        body.ccTimerCompact .timerCompactGrid{grid-template-columns:minmax(132px,.98fr) minmax(158px,1.02fr);gap:6px}
        body.ccTimerCompact .timerRing{width:min(47vw,calc(100vh - 80px));min-width:128px}
        body.ccTimerCompact .timerPresets .btn{min-height:32px;font-size:9px;padding-inline:2px}
        body.ccTimerCompact .timerMusic{min-height:34px;font-size:9px}
        body.ccTimerCompact .timerMainControls .btn{min-height:37px;font-size:10px}
      }
      @media(min-width:520px){
        body.ccTimerCompact .timerCompactGrid{grid-template-columns:minmax(215px,1.08fr) minmax(230px,.92fr);gap:14px}
        body.ccTimerCompact .timerRing{width:min(42vw,calc(100vh - 84px),250px);max-width:250px}
        body.ccTimerCompact .timerRing::before{inset:11px}
        body.ccTimerCompact .timerValue{font-size:64px}
        body.ccTimerCompact .timerPresets .btn{min-height:38px;font-size:11px}
        body.ccTimerCompact .timerMusic{min-height:40px;font-size:11px}
        body.ccTimerCompact .timerMainControls .btn{min-height:43px;font-size:12px}
      }
    `;
    document.head.appendChild(style);
  }

  let base=300,sec=base,running=false,timerId=null,music=true;

  panel.innerHTML=`
    <div class="timerCompactGrid">
      <div class="timerVisual">
        <div class="eyebrow">Focus time</div>
        <div class="timerRing" id="ring"><div class="timerValue" id="time">05:00</div></div>
        <div class="timerMicro">Work calmly • one step at a time</div>
      </div>
      <div class="timerActions">
        <div class="timerPresets">
          ${[0.5,1,3,5,10,15].map(m=>`<button class="btn${m===5?' selected':''}" data-min="${m}">${m<1?'30 sec':m+' min'}</button>`).join('')}
        </div>
        <button class="btn soft timerMusic" id="music">♫ Calm music: On</button>
        <div class="timerMainControls">
          <button class="btn primary" id="start">▶ Start</button>
          <button class="btn" id="reset">↺ Reset</button>
        </div>
        <div class="timerStatus" id="musicHint">Warm pads and soft bells fade in gently.</div>
      </div>
    </div>`;

  const time=document.getElementById('time');
  const ring=document.getElementById('ring');
  const start=document.getElementById('start');
  const musicBtn=document.getElementById('music');
  const hint=document.getElementById('musicHint');
  const presetButtons=[...document.querySelectorAll('[data-min]')];

  function selectPreset(){presetButtons.forEach(b=>b.classList.toggle('selected',Number(b.dataset.min)*60===base));}
  function draw(){
    time.textContent=S.fmt(sec);
    ring.style.setProperty('--progress',`${base?Math.max(0,sec/base*100):100}%`);
    start.textContent=running?'Ⅱ Pause':'▶ Start';
    musicBtn.textContent='♫ Calm music: '+(music?'On':'Off');
    musicBtn.setAttribute('aria-pressed',music?'true':'false');
    selectPreset();
  }
  function stopMusic(fade=.8){try{ambient.stop(fade)}catch(e){}}
  async function startMusic(){
    if(!running||!music)return false;
    hint.textContent='Calm ambience fading in…';
    try{
      await ambient.prime();
      const ok=await ambient.start();
      hint.textContent=ok?'Warm pads • soft bells • gentle air texture':'Tap Start again to enable sound.';
      return ok;
    }catch(e){hint.textContent='Tap Start again to enable sound.';return false;}
  }
  function stop(resetMusic=false){
    if(timerId){clearInterval(timerId);timerId=null;}
    running=false;stopMusic(.6);
    if(resetMusic)hint.textContent='Warm pads and soft bells fade in gently.';
    draw();
  }
  async function go(){
    if(running){stop(false);return;}
    if(sec<=0)sec=base;
    running=true;draw();
    if(music)await startMusic();
    timerId=setInterval(()=>{sec--;draw();if(sec<=0){stop(true);S.chime();S.toast('Time is up');}},1000);
  }

  presetButtons.forEach(b=>b.onclick=()=>{stop(true);base=sec=Number(b.dataset.min)*60;draw();});
  start.onclick=go;
  document.getElementById('reset').onclick=()=>{stop(true);sec=base;draw();};
  musicBtn.onclick=async()=>{
    music=!music;draw();
    if(!music){stopMusic(.6);hint.textContent='Calm music is off.';return;}
    hint.textContent='Warm pads and soft bells fade in gently.';
    if(running)await startMusic();
  };

  draw();
  return true;
}

let tries=0;
const id=setInterval(()=>{tries++;if(install()||tries>80)clearInterval(id)},50);
})();