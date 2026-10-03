'use strict';
(() => {
  let ctx=null, source=null, master=null, lowpass=null, highpass=null, lfo=null, lfoGain=null;
  let calmActive=false;
  let calmDuration=30;
  let breathTimer=null;
  let calmTick=null;
  let remaining=0;
  let inhale=true;
  let mode='off'; // off | background | calm | timer

  const $c=s=>document.querySelector(s);
  function notify(msg){
    const t=$c('#toast');
    if(!t)return;
    t.textContent=msg;
    t.classList.add('show');
    clearTimeout(t._calmToast);
    t._calmToast=setTimeout(()=>t.classList.remove('show'),1600);
  }
  async function primeAudio(){
    try{
      const AC=window.AudioContext||window.webkitAudioContext;
      if(!AC){notify('Audio is not supported in this browser');return false}
      if(!ctx)ctx=new AC();
      if(ctx.state==='suspended')await ctx.resume();
      return true;
    }catch(e){notify('Tap again to enable sound');return false}
  }
  function makeBrownNoiseBuffer(){
    const seconds=3, len=Math.floor(ctx.sampleRate*seconds), buffer=ctx.createBuffer(1,len,ctx.sampleRate), out=buffer.getChannelData(0);
    let last=0;
    for(let i=0;i<len;i++){
      const white=Math.random()*2-1;
      last=(last+0.035*white)/1.035;
      out[i]=Math.max(-1,Math.min(1,last*3.2));
    }
    return buffer;
  }
  async function startAmbient(nextMode='background'){
    if(!(await primeAudio()))return false;
    if(source){mode=nextMode;return true}
    source=ctx.createBufferSource();
    source.buffer=makeBrownNoiseBuffer();
    source.loop=true;
    highpass=ctx.createBiquadFilter(); highpass.type='highpass'; highpass.frequency.value=90;
    lowpass=ctx.createBiquadFilter(); lowpass.type='lowpass'; lowpass.frequency.value=1200; lowpass.Q.value=.45;
    master=ctx.createGain(); master.gain.value=.22;
    lfo=ctx.createOscillator(); lfo.type='sine'; lfo.frequency.value=.11;
    lfoGain=ctx.createGain(); lfoGain.gain.value=.045;
    lfo.connect(lfoGain); lfoGain.connect(master.gain);
    source.connect(highpass); highpass.connect(lowpass); lowpass.connect(master); master.connect(ctx.destination);
    source.start(); lfo.start();
    mode=nextMode;
    return true;
  }
  function stopAmbient(){
    try{source?.stop()}catch(e){}
    try{lfo?.stop()}catch(e){}
    try{source?.disconnect();highpass?.disconnect();lowpass?.disconnect();master?.disconnect();lfo?.disconnect();lfoGain?.disconnect()}catch(e){}
    source=master=lowpass=highpass=lfo=lfoGain=null;
    mode='off';
  }
  function resetMusicButton(){
    const music=$c('#musicToggle');
    if(music)music.textContent='♫ Music Off';
  }
  function stopCalm(closeOverlay=false){
    clearInterval(breathTimer); breathTimer=null;
    clearInterval(calmTick); calmTick=null;
    calmActive=false;
    remaining=0;
    stopAmbient();
    const btn=$c('#calmBtn'); if(btn)btn.textContent='Start Calm';
    resetMusicButton();
    if(closeOverlay)$c('#overlay')?.classList.remove('show');
  }
  function showBreathingOverlay(sec){
    const overlay=$c('#overlay'),box=$c('#overlayContent');
    if(!overlay||!box)return;
    const durationText=sec===0?'Until stopped':sec<60?`${sec} seconds`:`${Math.round(sec/60)} min`;
    box.innerHTML=`<div id="breathCircle" style="width:180px;height:180px;border-radius:50%;background:#8fd8d0;margin:0 auto 24px;transform:scale(.72);transition:transform 4s ease-in-out"></div><div class="overlay-title" style="font-size:48px" id="breathText">Breathe in…</div><div class="overlay-sub"><span id="breathSec">${sec===0?'∞':sec}</span>${sec===0?'':' seconds'} • Soft ambient sound</div><div class="overlay-sub" style="margin-top:10px">${durationText}</div>`;
    overlay.classList.add('show');
    requestAnimationFrame(()=>{const circle=$c('#breathCircle');if(circle)circle.style.transform='scale(1.25)'});
  }
  async function startCalm(){
    if(calmActive){stopCalm(true);return}
    stopAmbient(); resetMusicButton();
    if(!(await startAmbient('calm')))return;
    calmActive=true;
    remaining=calmDuration;
    const btn=$c('#calmBtn'); if(btn)btn.textContent='Stop Calm';
    showBreathingOverlay(calmDuration);
    inhale=true;
    breathTimer=setInterval(()=>{
      inhale=!inhale;
      const text=$c('#breathText'),circle=$c('#breathCircle');
      if(text)text.textContent=inhale?'Breathe in…':'Breathe out…';
      if(circle)circle.style.transform=inhale?'scale(1.25)':'scale(.72)';
    },4000);
    if(calmDuration>0){
      calmTick=setInterval(()=>{
        if(!calmActive||mode!=='calm')return;
        remaining=Math.max(0,remaining-1);
        const el=$c('#breathSec'); if(el)el.textContent=remaining;
        if(remaining<=0){
          clearInterval(calmTick); calmTick=null;
          clearInterval(breathTimer); breathTimer=null;
          calmActive=false; stopAmbient();
          if(btn)btn.textContent='Start Calm';
          const text=$c('#breathText'); if(text)text.textContent='Ready';
          const sec=$c('#breathSec'); if(sec)sec.textContent='0';
          if(typeof window.chime==='function')window.chime(); else notify('Calm reset complete');
        }
      },1000);
    }
  }

  // Replace the original background-tone button so there is one reliable audio engine.
  const musicOld=$c('#musicToggle');
  if(musicOld){
    const musicBtn=musicOld.cloneNode(true);
    musicOld.replaceWith(musicBtn);
    musicBtn.textContent='♫ Music Off';
    musicBtn.onclick=async()=>{
      await primeAudio();
      if(mode==='background'){
        stopAmbient(); musicBtn.textContent='♫ Music Off'; notify('Calm sound off'); return;
      }
      if(calmActive)stopCalm(false); else stopAmbient();
      if(await startAmbient('background')){musicBtn.textContent='♫ Music On';notify('Calm ambient sound on')}
    };
  }

  // Calm / Reset: 30 sec is the default and sound starts immediately with the button click.
  const calmOld=$c('#calmBtn');
  if(calmOld){
    const widget=calmOld.closest('.widget');
    const sub=widget?.querySelector('.widget-sub'); if(sub)sub.textContent='Guided breathing + soft ambient sound';
    const body=widget?.querySelector('.widget-body');
    if(body){
      body.innerHTML='<div class="large-letter">○</div><div class="option-row" id="calmPresets"><button class="chip active" data-sec="30">30 sec</button><button class="chip" data-sec="60">1 min</button><button class="chip" data-sec="120">2 min</button><button class="chip" data-sec="300">5 min</button><button class="chip" data-sec="0">Until I stop</button></div><div class="source">Built-in ambient sound • no external audio file</div>';
    }
    const calmBtn=calmOld.cloneNode(true);
    calmOld.replaceWith(calmBtn);
    calmBtn.textContent='Start Calm';
    calmBtn.onclick=startCalm;
    document.querySelectorAll('#calmPresets .chip').forEach(b=>b.onclick=()=>{
      if(calmActive)return;
      document.querySelectorAll('#calmPresets .chip').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      calmDuration=Number(b.dataset.sec);
      calmBtn.textContent=calmDuration===0?'Start Until Stopped':`Start ${calmDuration<60?calmDuration+' sec':calmDuration/60+' min'}`;
    });
  }

  // Timer: automatically play the same ambient sound while the timer is running.
  const timerStart=$c('#timerStart'),timerReset=$c('#timerReset'),timerDisplay=$c('#timerDisplay');
  if(timerStart){
    timerStart.addEventListener('click',()=>{
      primeAudio();
      setTimeout(async()=>{
        if(timerStart.textContent.trim()==='Pause'){
          if(calmActive){clearInterval(breathTimer);clearInterval(calmTick);calmActive=false}
          stopAmbient();
          await startAmbient('timer');
          const m=$c('#musicToggle'); if(m)m.textContent='♫ Music On';
        }else if(mode==='timer'){
          stopAmbient(); resetMusicButton();
        }
      },0);
    });
  }
  timerReset?.addEventListener('click',()=>{if(mode==='timer'){stopAmbient();resetMusicButton()}});
  if(timerDisplay && 'MutationObserver' in window){
    new MutationObserver(()=>{
      if(timerDisplay.textContent.trim()==='00:00' && mode==='timer'){stopAmbient();resetMusicButton()}
    }).observe(timerDisplay,{childList:true,characterData:true,subtree:true});
  }

  $c('#overlayClose')?.addEventListener('click',()=>{if(calmActive)stopCalm(false)});
  window.addEventListener('beforeunload',()=>stopAmbient());
})();
