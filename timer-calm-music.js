(function(){
'use strict';
const S=window.Support;
if(!S||S.slug!=='timer-calm-music'||window.__timerCalmV10)return;

function install(){
  const panel=S.panel||document.getElementById('panel');
  const ambient=window.TimerCalmAmbient;
  if(!panel||!ambient)return false;
  window.__timerCalmV10=true;
  document.body.classList.add('ccTimerCompact');

  if(!document.getElementById('ccTimerCompactStyleV10')){
    const style=document.createElement('style');
    style.id='ccTimerCompactStyleV10';
    style.textContent=`
      body.ccTimerCompact{
        --timerPink:#66bf86;
        --timerPinkDark:#2f7d4c;
        --timerPinkSoft:#e3f5e9;
        overflow:hidden!important;
        background:radial-gradient(circle at 48% -10%,#fff 0,#f2fbf5 46%,#eaf3ed 100%)!important
      }
      body.ccTimerCompact .shell{height:100vh;min-height:0;padding:4px;overflow:hidden}
      body.ccTimerCompact .top{width:100%;margin:0 auto 4px;padding:4px 6px;min-height:36px;border-radius:12px;border-color:#c8e5d2;box-shadow:0 5px 14px rgba(38,86,55,.08)}
      body.ccTimerCompact .toolIcon{width:30px;height:30px;border-radius:9px;font-size:16px;background:linear-gradient(145deg,var(--timerPink),#83d5a0);color:#fff;box-shadow:0 5px 12px rgba(72,164,105,.20)}
      body.ccTimerCompact .toolTitle{font-size:13.5px;line-height:1.05}
      body.ccTimerCompact .toolHint{display:none}
      body.ccTimerCompact .topActions .btn{width:30px;height:30px;min-height:30px;padding:0;border-radius:9px;font-size:15px}
      body.ccTimerCompact .topActions .label{display:none}
      body.ccTimerCompact .stage{min-height:0;width:100%;margin:0;align-items:stretch}
      body.ccTimerCompact .panel{width:100%;height:100%;min-height:0;margin:0;padding:7px;border-radius:15px;overflow:hidden;background:linear-gradient(145deg,#fff 0,#f8fcf9 58%,#edf8f1 100%);border-color:#cce7d5;box-shadow:0 8px 22px rgba(58,145,88,.10)}
      body.ccTimerCompact .timerCompactGrid{height:100%;width:100%;display:grid;grid-template-columns:minmax(150px,.98fr) minmax(184px,1.02fr);gap:11px;align-items:center}
      body.ccTimerCompact .timerVisual{min-width:0;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center}
      body.ccTimerCompact .timerVisual .eyebrow{font-size:10px;letter-spacing:.15em;margin:0 0 4px;color:var(--timerPinkDark)}
      body.ccTimerCompact .timerRing{width:min(52vw,calc(100vh - 78px),218px);min-width:152px;max-width:218px;margin:0;background:conic-gradient(var(--timerPink) var(--progress,100%),#dceee2 0)!important;box-shadow:0 10px 24px rgba(72,164,105,.18),0 0 0 1px rgba(72,164,105,.06)}
      body.ccTimerCompact .timerRing::before{inset:9px;background:#fff;border-radius:50%;box-shadow:inset 0 0 0 1px #dcebe1}
      body.ccTimerCompact .timerValue{font-size:clamp(44px,12vw,62px);letter-spacing:-.065em;color:#17324d}
      body.ccTimerCompact .timerMicro{margin-top:5px;color:#5f7165;font-size:10.5px;line-height:1.15;font-weight:850;text-align:center;white-space:nowrap}
      body.ccTimerCompact .timerActions{min-width:0;display:grid;gap:7px;align-content:center}
      body.ccTimerCompact .timerPresets{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
      body.ccTimerCompact .timerPresets .btn{min-height:40px;padding:6px 4px;border-radius:11px;font-size:12.5px;line-height:1;font-weight:1000;background:#fff;border-color:#cfe1d4;color:#17324d;box-shadow:0 2px 7px rgba(39,70,49,.05)}
      body.ccTimerCompact .timerPresets .btn:hover{border-color:#91d4a9;background:#f5fbf7;transform:none}
      body.ccTimerCompact .timerPresets .btn.selected{background:var(--timerPinkSoft);border-color:var(--timerPink);color:#277a49;box-shadow:inset 0 0 0 1px rgba(72,164,105,.14)}
      body.ccTimerCompact .timerMusic{width:100%;min-height:42px;padding:7px 9px;border-radius:11px;font-size:12px;line-height:1.05;font-weight:1000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background:#edf9f1!important;border-color:#a9dcb9!important;color:#2f7750!important}
      body.ccTimerCompact .timerMainControls{display:grid;grid-template-columns:1.12fr .88fr;gap:7px}
      body.ccTimerCompact .timerMainControls .btn{min-height:44px;padding:7px 8px;border-radius:11px;font-size:13px;line-height:1;font-weight:1000}
      body.ccTimerCompact .timerMainControls .btn.primary{background:linear-gradient(145deg,var(--timerPink),#48a469)!important;border-color:var(--timerPink)!important;color:#fff!important;box-shadow:0 5px 12px rgba(72,164,105,.20)}
      body.ccTimerCompact .timerStatus{min-height:12px;color:#5f7165;font-size:10px;line-height:1.15;font-weight:850;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center}

      /* Keep the same calm green palette in the dedicated fullscreen layout. */
      html body.ccTrueFullscreenLayout.ccTimerCompact .panel{background:linear-gradient(145deg,#fff 0,#f4fbf6 54%,#e5f5ea 100%)!important;border-color:#c9e6d3!important}
      html body.ccTrueFullscreenLayout.ccTimerCompact .timerRing{box-shadow:0 20px 46px rgba(72,164,105,.20),0 0 0 1px rgba(72,164,105,.07)!important}
      html body.ccTrueFullscreenLayout.ccTimerCompact .top{border-color:#c8e5d2!important}

      @media(max-width:370px){
        body.ccTimerCompact .timerCompactGrid{grid-template-columns:minmax(138px,.96fr) minmax(170px,1.04fr);gap:7px}
        body.ccTimerCompact .timerRing{width:min(49vw,calc(100vh - 80px));min-width:136px}
        body.ccTimerCompact .timerPresets{gap:4px}
        body.ccTimerCompact .timerPresets .btn{min-height:37px;font-size:11.5px;padding-inline:2px}
        body.ccTimerCompact .timerMusic{min-height:39px;font-size:11.5px}
        body.ccTimerCompact .timerMainControls .btn{min-height:41px;font-size:12px}
        body.ccTimerCompact .timerMicro,body.ccTimerCompact .timerStatus{font-size:9.5px}
      }
      @media(min-width:520px){
        body.ccTimerCompact .timerCompactGrid{grid-template-columns:minmax(220px,1.05fr) minmax(250px,.95fr);gap:16px}
        body.ccTimerCompact .timerRing{width:min(43vw,calc(100vh - 84px),258px);max-width:258px}
        body.ccTimerCompact .timerRing::before{inset:11px}
        body.ccTimerCompact .timerValue{font-size:66px}
        body.ccTimerCompact .timerPresets .btn{min-height:42px;font-size:13px}
        body.ccTimerCompact .timerMusic{min-height:44px;font-size:12.5px}
        body.ccTimerCompact .timerMainControls .btn{min-height:46px;font-size:13.5px}
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