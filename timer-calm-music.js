(function(){
'use strict';
const S=window.Support;
if(!S||S.slug!=='timer-calm-music'||window.__timerCalmV8)return;

function install(){
  const panel=S.panel||document.getElementById('panel');
  const ambient=window.TimerCalmAmbient;
  if(!panel||!ambient)return false;
  window.__timerCalmV8=true;
  document.body.classList.add('ccTimerCompact');

  if(!document.getElementById('ccTimerCompactStyle')){
    const style=document.createElement('style');
    style.id='ccTimerCompactStyle';
    style.textContent=`
      body.ccTimerCompact{overflow:hidden!important;background:radial-gradient(circle at 50% 0,#fff 0,#eef8f6 46%,#e5eef1 100%)!important}
      body.ccTimerCompact .shell{height:100vh;min-height:0;padding:4px;overflow:hidden}
      body.ccTimerCompact .top{width:100%;margin:0 auto 4px;padding:4px 6px;min-height:36px;border-radius:12px;box-shadow:0 5px 14px rgba(18,32,46,.07)}
      body.ccTimerCompact .toolIcon{width:30px;height:30px;border-radius:9px;font-size:16px}
      body.ccTimerCompact .toolTitle{font-size:13px;line-height:1.05}
      body.ccTimerCompact .toolHint{display:none}
      body.ccTimerCompact .topActions .btn{width:30px;height:30px;min-height:30px;padding:0;border-radius:9px;font-size:14px}
      body.ccTimerCompact .topActions .label{display:none}
      body.ccTimerCompact .stage{min-height:0;width:100%;margin:0;align-items:stretch}
      body.ccTimerCompact .panel{width:100%;height:100%;min-height:0;margin:0;padding:6px;border-radius:15px;overflow:hidden;background:linear-gradient(145deg,#fff,#f3faf8);border-color:#cfe4e0;box-shadow:0 8px 22px rgba(15,118,110,.10)}
      body.ccTimerCompact .timerCompactGrid{height:100%;width:100%;display:grid;grid-template-columns:minmax(128px,1.06fr) minmax(150px,.94fr);gap:8px;align-items:center}
      body.ccTimerCompact .timerVisual{min-width:0;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center}
      body.ccTimerCompact .timerVisual .eyebrow{font-size:8px;letter-spacing:.15em;margin:0 0 3px}
      body.ccTimerCompact .timerRing{width:min(46vw,calc(100vh - 86px),190px);min-width:122px;max-width:190px;margin:0;box-shadow:0 8px 20px rgba(15,118,110,.14)}
      body.ccTimerCompact .timerRing::before{inset:8px;box-shadow:inset 0 0 0 1px #e3eeee}
      body.ccTimerCompact .timerValue{font-size:clamp(34px,10vw,52px);letter-spacing:-.06em}
      body.ccTimerCompact .timerMicro{margin-top:3px;color:#72817f;font-size:7.5px;line-height:1.1;font-weight:850;text-align:center;white-space:nowrap}
      body.ccTimerCompact .timerActions{min-width:0;display:grid;gap:5px;align-content:center}
      body.ccTimerCompact .timerPresets{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px}
      body.ccTimerCompact .timerPresets .btn{min-height:27px;padding:3px 3px;border-radius:8px;font-size:9px;line-height:1;font-weight:1000;box-shadow:none}
      body.ccTimerCompact .timerPresets .btn.selected{background:#e1f5f1;border-color:#0f766e;color:#0a5d57;box-shadow:inset 0 0 0 1px rgba(15,118,110,.25)}
      body.ccTimerCompact .timerMusic{width:100%;min-height:29px;padding:4px 6px;border-radius:9px;font-size:9px;line-height:1.05;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      body.ccTimerCompact .timerMainControls{display:grid;grid-template-columns:1fr 1fr;gap:5px}
      body.ccTimerCompact .timerMainControls .btn{min-height:31px;padding:4px 5px;border-radius:9px;font-size:10px;line-height:1;font-weight:1000}
      body.ccTimerCompact .timerStatus{min-height:9px;color:#75817f;font-size:7.5px;line-height:1.1;font-weight:850;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center}
      @media(max-width:330px){
        body.ccTimerCompact .timerCompactGrid{grid-template-columns:minmax(112px,.95fr) minmax(142px,1.05fr);gap:5px}
        body.ccTimerCompact .timerRing{width:min(43vw,calc(100vh - 88px));min-width:110px}
        body.ccTimerCompact .timerPresets .btn{font-size:8px;padding-inline:2px}
      }
      @media(min-width:520px){
        body.ccTimerCompact .timerCompactGrid{grid-template-columns:minmax(190px,1.08fr) minmax(210px,.92fr);gap:12px}
        body.ccTimerCompact .timerRing{width:min(40vw,calc(100vh - 92px),230px);max-width:230px}
        body.ccTimerCompact .timerRing::before{inset:10px}
        body.ccTimerCompact .timerValue{font-size:58px}
        body.ccTimerCompact .timerPresets .btn{min-height:31px;font-size:10px}
        body.ccTimerCompact .timerMusic{min-height:33px;font-size:10px}
        body.ccTimerCompact .timerMainControls .btn{min-height:34px;font-size:11px}
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