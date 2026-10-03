'use strict';
(() => {
  const AUDIO_URL='assets/calm-river-loop.mp3?v=20261003calm1';
  const player=new Audio(AUDIO_URL);
  player.loop=true;
  player.preload='auto';
  player.volume=0.58;

  let calmActive=false;
  let calmDuration=30;
  let calmTimer=null;
  let breathTimer=null;
  let remaining=0;
  let inhale=true;
  let mode='off';

  const $c=s=>document.querySelector(s);
  function notify(msg){
    const t=$c('#toast');
    if(!t)return;
    t.textContent=msg;
    t.classList.add('show');
    clearTimeout(t._calmToast);
    t._calmToast=setTimeout(()=>t.classList.remove('show'),1600);
  }
  function stopAudio(reset=true){
    player.pause();
    if(reset){try{player.currentTime=0}catch(e){}}
  }
  async function playAudio(){
    try{await player.play();return true}catch(e){notify('Tap again if your browser blocks audio');return false}
  }
  function stopCalm(closeOverlay=false){
    clearTimeout(calmTimer); calmTimer=null;
    clearInterval(breathTimer); breathTimer=null;
    calmActive=false;
    remaining=0;
    mode='off';
    stopAudio(true);
    const btn=$c('#calmBtn'); if(btn)btn.textContent='Start Calm';
    const music=$c('#musicToggle'); if(music)music.textContent='♫ Music Off';
    if(closeOverlay)$c('#overlay')?.classList.remove('show');
  }
  function showBreathingOverlay(sec){
    const overlay=$c('#overlay'),box=$c('#overlayContent');
    if(!overlay||!box)return;
    const durationText=sec===0?'Until stopped':sec<60?`${sec} seconds`:`${Math.round(sec/60)} min`;
    box.innerHTML=`<div id="breathCircle" style="width:180px;height:180px;border-radius:50%;background:#8fd8d0;margin:0 auto 24px;transform:scale(.72);transition:transform 4s ease-in-out"></div><div class="overlay-title" style="font-size:48px" id="breathText">Breathe in…</div><div class="overlay-sub"><span id="breathSec">${sec===0?'∞':sec}</span>${sec===0?'':' seconds'} • River ambience</div><div class="overlay-sub" style="margin-top:10px">${durationText}</div>`;
    overlay.classList.add('show');
    requestAnimationFrame(()=>{const circle=$c('#breathCircle');if(circle)circle.style.transform='scale(1.25)'});
  }
  async function startCalm(){
    if(calmActive){stopCalm(true);return}
    mode='calm';
    stopAudio(true);
    const music=$c('#musicToggle'); if(music)music.textContent='♫ Music Off';
    if(!(await playAudio())){mode='off';return}
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
      const tick=setInterval(()=>{
        if(!calmActive||mode!=='calm'){clearInterval(tick);return}
        remaining=Math.max(0,remaining-1);
        const el=$c('#breathSec'); if(el)el.textContent=remaining;
        if(remaining<=0){
          clearInterval(tick);
          clearInterval(breathTimer); breathTimer=null;
          calmActive=false; mode='off'; stopAudio(true);
          if(btn)btn.textContent='Start Calm';
          const text=$c('#breathText'); if(text)text.textContent='Ready';
          const sec=$c('#breathSec'); if(sec)sec.textContent='0';
          if(typeof window.chime==='function')window.chime();
          else notify('Calm reset complete');
        }
      },1000);
      calmTimer=setTimeout(()=>{},calmDuration*1000+1000);
    }
  }

  const musicOld=$c('#musicToggle');
  if(musicOld){
    const musicBtn=musicOld.cloneNode(true);
    musicOld.replaceWith(musicBtn);
    musicBtn.onclick=async()=>{
      if(mode==='background'){
        mode='off'; stopAudio(true); musicBtn.textContent='♫ Music Off'; notify('Calm music off'); return;
      }
      if(calmActive)stopCalm(false);
      mode='background'; stopAudio(true);
      if(await playAudio()){musicBtn.textContent='♫ Music On';notify('River ambience on')}else mode='off';
    };
  }

  const calmOld=$c('#calmBtn');
  if(calmOld){
    const widget=calmOld.closest('.widget');
    const sub=widget?.querySelector('.widget-sub'); if(sub)sub.textContent='Guided breathing + river ambience';
    const body=widget?.querySelector('.widget-body');
    if(body){
      body.innerHTML='<div class="large-letter">○</div><div class="option-row" id="calmPresets"><button class="chip active" data-sec="30">30 sec</button><button class="chip" data-sec="60">1 min</button><button class="chip" data-sec="120">2 min</button><button class="chip" data-sec="300">5 min</button><button class="chip" data-sec="0">Until I stop</button></div><div class="source">Built-in river ambience • Pixabay</div>';
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

  $c('#overlayClose')?.addEventListener('click',()=>{if(calmActive)stopCalm(false)});
  window.addEventListener('beforeunload',()=>stopAudio(false));
})();
