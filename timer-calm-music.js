(function(){
'use strict';
const S=window.Support;
if(!S||S.slug!=='timer-calm-music'||window.__timerCalmV6)return;

function install(){
  const panel=S.panel||document.getElementById('panel');
  const ambient=window.TimerCalmAmbient;
  if(!panel||!ambient)return false;
  window.__timerCalmV6=true;

  let base=300,sec=base,running=false,timerId=null,music=true;

  panel.innerHTML=`
    <div class="eyebrow">Focus time</div>
    <div class="timerRing" id="ring"><div class="timerValue" id="time">05:00</div></div>
    <div class="supportText">See how much time is left. Work calmly, one step at a time.</div>
    <div class="controls">
      ${[0.5,1,3,5,10,15].map(m=>`<button class="btn" data-min="${m}">${m<1?'30 sec':m+' min'}</button>`).join('')}
      <button class="btn soft" id="music">♫ Calm music: On</button>
    </div>
    <div class="controls" style="margin-top:12px">
      <button class="btn primary" id="start">▶ Start</button>
      <button class="btn" id="reset">↺ Reset</button>
    </div>
    <div class="miniHint" id="musicHint">Warm pads and soft bells fade in gently.</div>`;

  const time=document.getElementById('time');
  const ring=document.getElementById('ring');
  const start=document.getElementById('start');
  const musicBtn=document.getElementById('music');
  const hint=document.getElementById('musicHint');

  function draw(){
    time.textContent=S.fmt(sec);
    ring.style.setProperty('--progress',`${base?Math.max(0,sec/base*100):100}%`);
    start.textContent=running?'Ⅱ Pause':'▶ Start';
    musicBtn.textContent='♫ Calm music: '+(music?'On':'Off');
    musicBtn.setAttribute('aria-pressed',music?'true':'false');
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

  document.querySelectorAll('[data-min]').forEach(b=>b.onclick=()=>{
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