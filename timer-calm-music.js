(function(){
'use strict';
const S=window.Support;
if(!S||S.slug!=='timer-calm-music'||window.__timerCalmV3)return;
window.__timerCalmV3=true;

function install(){
  const panel=S.panel||document.getElementById('panel');
  if(!panel)return false;

  let base=300,sec=base,running=false,timerId=null,music=true,musicId=null,noteIndex=0;
  let calmCtx=null;
  const notes=[262,330,392,330]; // C-E-G-E calm loop used before.

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

  async function audio(){
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC)throw new Error('Audio unavailable');
    if(!calmCtx)calmCtx=new AC();
    if(calmCtx.state==='suspended')await calmCtx.resume();
    return calmCtx;
  }

  async function playNote(){
    if(!running||!music)return;
    try{
      const c=await audio();
      const now=c.currentTime;
      const f=notes[noteIndex++%notes.length];
      const master=c.createGain();
      master.gain.setValueAtTime(.0001,now);
      master.gain.exponentialRampToValueAtTime(.075,now+.035);
      master.gain.exponentialRampToValueAtTime(.0001,now+.72);
      master.connect(c.destination);

      const o1=c.createOscillator();
      o1.type='sine';
      o1.frequency.setValueAtTime(f,now);
      o1.connect(master);
      o1.start(now);
      o1.stop(now+.75);

      const o2=c.createOscillator();
      const g2=c.createGain();
      o2.type='sine';
      o2.frequency.setValueAtTime(f*2,now);
      g2.gain.value=.16;
      o2.connect(g2);g2.connect(master);
      o2.start(now);o2.stop(now+.58);
    }catch(e){
      S.toast('Sound could not start');
    }
  }

  function stopMusic(){
    if(musicId){clearInterval(musicId);musicId=null;}
  }

  async function startMusic(){
    stopMusic();
    if(!running||!music)return;
    try{await audio();}catch(e){S.toast('Sound is unavailable');return;}
    noteIndex=0;
    await playNote();
    musicId=setInterval(playNote,900);
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

  async function go(){
    if(running){stop();return;}
    if(sec<=0)sec=base;
    running=true;
    draw();
    if(music)await startMusic();
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

  start.onclick=()=>{go();};
  document.getElementById('reset').onclick=()=>{stop();sec=base;draw();};
  musicBtn.onclick=async()=>{
    music=!music;
    draw();
    if(running){music?await startMusic():stopMusic();}
  };

  draw();
  return true;
}

let tries=0;
const id=setInterval(()=>{tries++;if(install()||tries>60)clearInterval(id)},50);
})();