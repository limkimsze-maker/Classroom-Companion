(function(){
'use strict';
const S=window.Support;
if(!S||S.slug!=='timer-calm-music'||window.__timerCalmV4)return;

function install(){
  const panel=S.panel||document.getElementById('panel');
  if(!panel)return false;
  window.__timerCalmV4=true;

  let base=300,sec=base,running=false,timerId=null,music=true;
  const notes=[261.63,329.63,392.00,329.63];

  function makeCalmWavUrl(){
    const sampleRate=16000;
    const beat=0.9;
    const totalSeconds=beat*notes.length;
    const sampleCount=Math.floor(sampleRate*totalSeconds);
    const dataBytes=sampleCount*2;
    const buf=new ArrayBuffer(44+dataBytes);
    const view=new DataView(buf);
    const write=(off,str)=>{for(let i=0;i<str.length;i++)view.setUint8(off+i,str.charCodeAt(i));};
    write(0,'RIFF');view.setUint32(4,36+dataBytes,true);write(8,'WAVE');write(12,'fmt ');
    view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);
    view.setUint32(24,sampleRate,true);view.setUint32(28,sampleRate*2,true);
    view.setUint16(32,2,true);view.setUint16(34,16,true);write(36,'data');view.setUint32(40,dataBytes,true);
    for(let i=0;i<sampleCount;i++){
      const t=i/sampleRate;
      const slot=Math.min(notes.length-1,Math.floor(t/beat));
      const local=t-slot*beat;
      const f=notes[slot];
      const attack=Math.min(1,local/.08);
      const release=Math.min(1,(beat-local)/.20);
      const env=Math.max(0,Math.min(attack,release));
      const fundamental=Math.sin(2*Math.PI*f*local);
      const harmonic=.14*Math.sin(2*Math.PI*f*2*local);
      const low=.10*Math.sin(2*Math.PI*(f/2)*local);
      const sample=(fundamental+harmonic+low)*env*.42;
      view.setInt16(44+i*2,Math.max(-1,Math.min(1,sample))*32767,true);
    }
    return URL.createObjectURL(new Blob([buf],{type:'audio/wav'}));
  }

  const calmAudio=new Audio(makeCalmWavUrl());
  calmAudio.loop=true;
  calmAudio.preload='auto';
  calmAudio.volume=.55;

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

  function draw(){
    time.textContent=S.fmt(sec);
    ring.style.setProperty('--progress',`${base?Math.max(0,sec/base*100):100}%`);
    start.textContent=running?'Ⅱ Pause':'▶ Start';
    musicBtn.textContent='♫ Calm music: '+(music?'On':'Off');
    musicBtn.setAttribute('aria-pressed',music?'true':'false');
  }

  function pauseAudio(){
    calmAudio.pause();
  }

  async function playAudio(restart=false){
    if(!music||!running)return;
    try{
      if(restart)calmAudio.currentTime=0;
      await calmAudio.play();
    }catch(e){
      S.toast('Sound was blocked. Tap Calm music Off, then On.');
    }
  }

  function stop(resetMusic=false){
    if(timerId){clearInterval(timerId);timerId=null;}
    running=false;
    pauseAudio();
    if(resetMusic)calmAudio.currentTime=0;
    draw();
  }

  async function go(){
    if(running){stop(false);return;}
    if(sec<=0)sec=base;
    running=true;
    draw();
    if(music)await playAudio(calmAudio.currentTime===0);
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
    if(!music){pauseAudio();return;}
    if(running)await playAudio(false);
  };

  draw();
  return true;
}

let tries=0;
const id=setInterval(()=>{tries++;if(install()||tries>60)clearInterval(id)},50);
})();