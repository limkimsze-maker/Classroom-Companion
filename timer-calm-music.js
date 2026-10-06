(function(){
'use strict';
const S=window.Support;
if(!S||S.slug!=='timer-calm-music'||window.__timerCalmV7)return;

function install(){
  const panel=S.panel||document.getElementById('panel');
  const ambient=window.TimerCalmAmbient;
  if(!panel||!ambient)return false;
  window.__timerCalmV7=true;
  document.body.classList.add('ccTimerCompact');

  if(!document.getElementById('ccTimerCompactStyle')){
    const style=document.createElement('style');
    style.id='ccTimerCompactStyle';
    style.textContent=`
      body.ccTimerCompact{overflow:hidden!important;background:radial-gradient(circle at 50% 0,#fff 0,#eef8f6 48%,#e6eef2 100%)!important}
      body.ccTimerCompact .shell{height:100vh;min-height:0;padding:6px;overflow:hidden}
      body.ccTimerCompact .top{margin:0 auto 5px;padding:5px 7px;min-height:40px;border-radius:14px;box-shadow:0 7px 18px rgba(18,32,46,.08)}
      body.ccTimerCompact .toolIcon{width:32px;height:32px;border-radius:10px;font-size:17px}
      body.ccTimerCompact .toolTitle{font-size:14px;line-height:1.05}
      body.ccTimerCompact .toolHint{display:none}
      body.ccTimerCompact .topActions .btn{width:32px;height:32px;min-height:32px;padding:0;border-radius:10px;font-size:15px}
      body.ccTimerCompact .topActions .label{display:none}
      body.ccTimerCompact .stage{min-height:0;margin:0 auto;align-items:stretch}
      body.ccTimerCompact .panel{width:min(420px,100%);height:100%;min-height:0;margin:0 auto;padding:8px 9px;border-radius:18px;overflow:hidden;background:linear-gradient(145deg,rgba(255,255,255,.99),rgba(242,250,248,.98));border-color:#cfe4e0;box-shadow:0 10px 28px rgba(15,118,110,.10)}
      body.ccTimerCompact .timerCompactGrid{height:100%;display:grid;grid-template-columns:minmax(96px,.82fr) minmax(164px,1.18fr);gap:8px;align-items:center}
      body.ccTimerCompact .timerVisual{min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
      body.ccTimerCompact .timerVisual .eyebrow{font-size:8px;letter-spacing:.14em;margin:0 0 4px}
      body.ccTimerCompact .timerRing{width:min(29vw,108px);min-width:88px;max-width:108px;margin:0;box-shadow:0 9px 22px rgba(15,118,110,.12)}
      body.ccTimerCompact .timerRing::before{inset:7px;box-shadow:inset 0 0 0 1px #e4eeee}
      body.ccTimerCompact .timerValue{font-size:clamp(27px,8.5vw,37px);letter-spacing:-.06em}
      body.ccTimerCompact .timerMicro{margin-top:4px;color:#72817f;font-size:8px;line-height:1.15;font-weight:800;text-align:center}
      body.ccTimerCompact .timerActions{min-width:0;display:grid;gap:5px;align-content:center}
      body.ccTimerCompact .timerPresets{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px}
      body.ccTimerCompact .timerPresets .btn{min-height:27px;padding:3px 4px;border-radius:8px;font-size:9px;line-height:1;font-weight:950;box-shadow:none}
      body.ccTimerCompact .timerPresets .btn.selected{background:#e3f6f2;border-color:#0f766e;color:#0a5d57;box-shadow:inset 0 0 0 1px rgba(15,118,110,.28)}
      body.ccTimerCompact .timerMusic{width:100%;min-height:29px;padding:4px 6px;border-radius:9px;font-size:9px;line-height:1.05;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      body.ccTimerCompact .timerMainControls{display:grid;grid-template-columns:1fr 1fr;gap:5px}
      body.ccTimerCompact .timerMainControls .btn{min-height:31px;padding:4px 6px;border-radius:9px;font-size:10px;line-height:1;font-weight:1000}
      body.ccTimerCompact .timerStatus{min-height:10px;color:#75817f;font-size:8px;line-height:1.15;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center}
      @media(max-width:310px){
        body.ccTimerCompact .timerCompactGrid{grid-template-columns:86px 1fr;gap:5px}
        body.ccTimerCompact .timerRing{width:82px;min-width:82px}
        body.ccTimerCompact .timerPresets .btn{font-size:8px;padding-inline:2px}
      }
      @media(min-width:700px) and (min-height:500px){
        body.ccTimerCompact .panel{width:min(560px,100%);height:auto;min-height:260px;padding:15px 17px}
        body.ccTimerCompact .timerCompactGrid{grid-template-columns:180px 1fr;gap:18px}
        body.ccTimerCompact .timerRing{width:160px;max-width:160px}
        body.ccTimerCompact .timerRing::before{inset:10px}
        body.ccTimerCompact .timerValue{font-size:48px}
        body.ccTimerCompact .timerPresets .btn{min-height:34px;font-size:11px}
        body.ccTimerCompact .timerMusic{min-height:36px;font-size:11px}
        body.ccTimerCompact .timerMainControls .btn{min-height:38px;font-size:12px}
        body.ccTimerCompact .timerStatus,body.ccTimerCompact .timerMicro{font-size:9px}
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

  function selectPreset(){
    presetButtons.forEach(b=>b.classList.toggle('selected',Number(b.dataset.min)*60===base));
  }

  function draw(){
    time.textContent=S.fmt(sec);
    ring.style.setProperty('--progress',`${base?Math.max(0,sec/base*100):100}%`);
    start.textContent=running?'Ⅱ Pause':'▶ Start';
    musicBtn.textContent='♫ Calm music: '+(music?'On':'Off');
    musicBtn.setAttribute('aria-pressed',music?'true':'false');
    selectPreset();
  }

  function stopMusic(fade=.8){
    try{ambient.stop(fade)}catch(e){}
  }

  async function startMusic(){
    if(!running||!music)return false;
    hint.textContent='Calm ambience fading in…';
    try{
      await ambient.prime();
      const ok=await ambient.start();
      hint.textContent=ok?'Warm pads • soft bells • gentle air texture':'Tap Start again to enable sound.';
      return ok;
    }catch(e){
      hint.textContent='Tap Start again to enable sound.';
      return false;
    }
  }

  function stop(resetMusic=false){
    if(timerId){clearInterval(timerId);timerId=null;}
    running=false;
    stopMusic(.6);
    if(resetMusic)hint.textContent='Warm pads and soft bells fade in gently.';
    draw();
  }

  async function go(){
    if(running){stop(false);return;}
    if(sec<=0)sec=base;
    running=true;
    draw();
    if(music)await startMusic();
    timerId=setInterval(()=>{
      sec--;
      draw();
      if(sec<=0){
        stop(true);
        S.chime();
        S.toast('Time is up');
      }
    },1000);
  }

  presetButtons.forEach(b=>b.onclick=()=>{
    stop(true);
    base=sec=Number(b.dataset.min)*60;
    draw();
  });

  start.onclick=go;
  document.getElementById('reset').onclick=()=>{stop(true);sec=base;draw();};
  musicBtn.onclick=async()=>{
    music=!music;
    draw();
    if(!music){
      stopMusic(.6);
      hint.textContent='Calm music is off.';
      return;
    }
    hint.textContent='Warm pads and soft bells fade in gently.';
    if(running)await startMusic();
  };

  draw();
  return true;
}

let tries=0;
const id=setInterval(()=>{tries++;if(install()||tries>80)clearInterval(id)},50);
})();