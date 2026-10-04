(function(){
'use strict';
const S=window.Support;
if(!S||S.slug!=='timer-calm-music'||window.__timerCalmV1)return;
window.__timerCalmV1=true;

function install(){
  const panel=S.panel||document.getElementById('panel');
  if(!panel)return false;

  let base=300,sec=base,running=false,timerId=null,music=true,musicId=null,noteIndex=0;
  const notes=[262,330,392,330]; // C-E-G-E: the calm loop used before.

  panel.innerHTML=`
    <div class="eyebrow">Focus time</div>
    <div class="timerRing" id="ring"><div class="timerValue" id="time">05:00</div></div>
    <div class="supportText">See how much time is left. Work calmly, one step at a time.</div>
    <div class="controls">
      ${[1,3,5,10,15].map(m=>`<button class="btn" data-min="${m}">${m} min</button>`).join('')}
      <button class="btn soft" id="music">♫ Calm music: On</button>
    </div>
    <div class="controls" style="margin-top:12px">
      <button class="btn primary" id="start">▶ Start</button>
      <button class="btn" id="reset">↺ Reset</button>
    </div>`;

  const time=document.getElementById('time');
  const ring=document.getElementById('ring');
  const start=document.getElementById('start');
  const musicBtn=document.getElementById('music');

  function playNote(){
    if(!running||!music)return;
    const f=notes[noteIndex++%notes.length];
    S.tone(f,.55,.028,'sine');
  }

  function stopMusic(){
    if(musicId){clearInterval(musicId);musicId=null;}
  }

  function startMusic(){
    stopMusic();
    if(!running||!music)return;
    noteIndex=0;
    playNote();
    musicId=setInterval(playNote,850);
  }

  function draw(){
    time.textContent=S.fmt(sec);
    ring.style.setProperty('--progress',`${base?Math.max(0,sec/base*100):100}%`);
    start.textContent=running?'Ⅱ Pause':'▶ Start';
    musicBtn.textContent='♫ Calm music: '+(music?'On':'Off');
    musicBtn.setAttribute('aria-pressed',music?'true':'false');
  }

  function stop(){
    if(timerId){clearInterval(timerId);timerId=null;}
    running=false;
    stopMusic();
    draw();
  }

  function go(){
    if(running){stop();return;}
    if(sec<=0)sec=base;
    running=true;
    draw();
    startMusic();
    timerId=setInterval(()=>{
      sec--;
      draw();
      if(sec<=0){
        stop();
        S.chime();
        S.toast('Time is up');
      }
    },1000);
  }

  document.querySelectorAll('[data-min]').forEach(b=>b.onclick=()=>{
    stop();
    base=sec=Number(b.dataset.min)*60;
    draw();
  });

  start.onclick=go;
  document.getElementById('reset').onclick=()=>{stop();sec=base;draw();};
  musicBtn.onclick=()=>{
    music=!music;
    draw();
    if(running){music?startMusic():stopMusic();}
  };

  draw();
  return true;
}

let tries=0;
const id=setInterval(()=>{tries++;if(install()||tries>40)clearInterval(id)},50);
})();