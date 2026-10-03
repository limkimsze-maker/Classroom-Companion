'use strict';
(() => {
  let calmActive=false, calmDuration=30, breathTimer=null, calmTick=null, remaining=0, inhale=true, mode='off';
  const $c=s=>document.querySelector(s);
  const ambient=()=>window.ClassroomAmbient;

  function notify(msg){
    const t=$c('#toast'); if(!t)return;
    t.textContent=msg;t.classList.add('show');
    clearTimeout(t._calmToast);t._calmToast=setTimeout(()=>t.classList.remove('show'),1600);
  }
  async function startSound(nextMode){
    if(!ambient()){notify('Soundtrack is still loading');return false}
    const ok=await ambient().start();
    if(ok)mode=nextMode; else notify('Tap again to enable sound');
    return ok;
  }
  function stopSound(){ambient()?.stop(.9);mode='off'}
  function resetMusicButton(){const b=$c('#musicToggle');if(b)b.textContent='♫ Music Off'}
  function stopCalm(closeOverlay=false){
    clearInterval(breathTimer);clearInterval(calmTick);breathTimer=calmTick=null;
    calmActive=false;remaining=0;stopSound();
    const b=$c('#calmBtn');if(b)b.textContent='Start Calm';resetMusicButton();
    if(closeOverlay)$c('#overlay')?.classList.remove('show');
  }
  function showBreathingOverlay(sec){
    const overlay=$c('#overlay'),box=$c('#overlayContent');if(!overlay||!box)return;
    const d=sec===0?'Until stopped':sec<60?`${sec} seconds`:`${Math.round(sec/60)} min`;
    box.innerHTML=`<div id="breathCircle" style="width:180px;height:180px;border-radius:50%;background:#8fd8d0;margin:0 auto 24px;transform:scale(.72);transition:transform 4s ease-in-out"></div><div class="overlay-title" style="font-size:48px" id="breathText">Breathe in…</div><div class="overlay-sub"><span id="breathSec">${sec===0?'∞':sec}</span>${sec===0?'':' seconds'} • Gentle classroom ambience</div><div class="overlay-sub" style="margin-top:10px">${d}</div>`;
    overlay.classList.add('show');
    requestAnimationFrame(()=>{const c=$c('#breathCircle');if(c)c.style.transform='scale(1.25)'});
  }
  async function startCalm(){
    if(calmActive){stopCalm(true);return}
    stopSound();resetMusicButton();
    if(!(await startSound('calm')))return;
    calmActive=true;remaining=calmDuration;
    const btn=$c('#calmBtn');if(btn)btn.textContent='Stop Calm';
    showBreathingOverlay(calmDuration);inhale=true;
    breathTimer=setInterval(()=>{
      inhale=!inhale;const t=$c('#breathText'),c=$c('#breathCircle');
      if(t)t.textContent=inhale?'Breathe in…':'Breathe out…';
      if(c)c.style.transform=inhale?'scale(1.25)':'scale(.72)';
    },4000);
    if(calmDuration>0){
      calmTick=setInterval(()=>{
        if(!calmActive||mode!=='calm')return;
        remaining=Math.max(0,remaining-1);const e=$c('#breathSec');if(e)e.textContent=remaining;
        if(remaining<=0){
          clearInterval(calmTick);clearInterval(breathTimer);calmTick=breathTimer=null;calmActive=false;stopSound();
          if(btn)btn.textContent='Start Calm';const t=$c('#breathText');if(t)t.textContent='Ready';if(e)e.textContent='0';
          if(typeof window.chime==='function')window.chime();else notify('Calm reset complete');
        }
      },1000);
    }
  }

  const musicOld=$c('#musicToggle');
  if(musicOld){
    const musicBtn=musicOld.cloneNode(true);musicOld.replaceWith(musicBtn);musicBtn.textContent='♫ Music Off';
    musicBtn.onclick=async()=>{
      if(mode==='background'){stopSound();musicBtn.textContent='♫ Music Off';notify('Calm music off');return}
      if(calmActive)stopCalm(false);else stopSound();
      if(await startSound('background')){musicBtn.textContent='♫ Music On';notify('Gentle soundtrack on')}
    };
  }

  const calmOld=$c('#calmBtn');
  if(calmOld){
    const widget=calmOld.closest('.widget');
    const sub=widget?.querySelector('.widget-sub');if(sub)sub.textContent='Guided breathing + gentle ambient music';
    const body=widget?.querySelector('.widget-body');
    if(body)body.innerHTML='<div class="large-letter">○</div><div class="option-row" id="calmPresets"><button class="chip active" data-sec="30">30 sec</button><button class="chip" data-sec="60">1 min</button><button class="chip" data-sec="120">2 min</button><button class="chip" data-sec="300">5 min</button><button class="chip" data-sec="0">Until I stop</button></div><div class="source">Original generative soundtrack • warm pads + soft bells + air texture</div>';
    const calmBtn=calmOld.cloneNode(true);calmOld.replaceWith(calmBtn);calmBtn.textContent='Start Calm';calmBtn.onclick=startCalm;
    document.querySelectorAll('#calmPresets .chip').forEach(b=>b.onclick=()=>{
      if(calmActive)return;document.querySelectorAll('#calmPresets .chip').forEach(x=>x.classList.remove('active'));b.classList.add('active');
      calmDuration=Number(b.dataset.sec);calmBtn.textContent=calmDuration===0?'Start Until Stopped':`Start ${calmDuration<60?calmDuration+' sec':calmDuration/60+' min'}`;
    });
  }

  const timerStart=$c('#timerStart'),timerReset=$c('#timerReset'),timerDisplay=$c('#timerDisplay');
  timerStart?.addEventListener('click',()=>{
    ambient()?.prime();
    setTimeout(async()=>{
      if(timerStart.textContent.trim()==='Pause'){
        if(calmActive){clearInterval(breathTimer);clearInterval(calmTick);breathTimer=calmTick=null;calmActive=false}
        stopSound();
        if(await startSound('timer')){const m=$c('#musicToggle');if(m)m.textContent='♫ Music On'}
      }else if(mode==='timer'){stopSound();resetMusicButton()}
    },0);
  });
  timerReset?.addEventListener('click',()=>{if(mode==='timer'){stopSound();resetMusicButton()}});
  if(timerDisplay&&'MutationObserver'in window){new MutationObserver(()=>{if(timerDisplay.textContent.trim()==='00:00'&&mode==='timer'){stopSound();resetMusicButton()}}).observe(timerDisplay,{childList:true,characterData:true,subtree:true})}
  $c('#overlayClose')?.addEventListener('click',()=>{if(calmActive)stopCalm(false)});
  window.addEventListener('beforeunload',()=>ambient()?.stop(.1));
})();
