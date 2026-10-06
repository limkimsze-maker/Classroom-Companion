(function(){
'use strict';
const S=window.Support;
if(!S||S.slug!=='noise-level'||window.__noiseShushV5)return;
window.__noiseShushV5=true;

const AUDIO_SRC='bredorantes-shushing-150148.mp3';
const SOUND_STORE='classroomCompanionNoiseShushSoundV1';
let audio=null;
let soundEnabled=loadSoundEnabled();
let detectorState=window.__ccNoiseDetectorState||'off';
let unlocking=false;

function loadSoundEnabled(){
  try{
    const saved=localStorage.getItem(SOUND_STORE);
    return saved===null?true:saved==='true';
  }catch(e){return true}
}
function saveSoundEnabled(){try{localStorage.setItem(SOUND_STORE,String(soundEnabled))}catch(e){}}
function stopAudio(reset=true){
  if(!audio)return;
  try{audio.pause();if(reset)audio.currentTime=0;}catch(e){}
}
function shouldShush(){return soundEnabled&&(detectorState==='near'||detectorState==='loud')}
function updateButton(){
  const btn=document.getElementById('noiseShushBtn');
  if(!btn)return;
  btn.textContent=soundEnabled?'♫ Sound On':'🔇 Sound Off';
  btn.classList.toggle('soundOff',!soundEnabled);
  btn.classList.toggle('playing',!!audio&&!audio.paused&&shouldShush());
  btn.setAttribute('aria-pressed',String(soundEnabled));
  btn.setAttribute('aria-label',soundEnabled?'Turn automatic shushing sound off':'Turn automatic shushing sound on');
}
function syncAudio(){
  if(!audio)return;
  if(!shouldShush()){
    stopAudio();
    updateButton();
    return;
  }
  if(!audio.paused){updateButton();return}
  try{audio.currentTime=0;}catch(e){}
  const p=audio.play();
  updateButton();
  if(p&&typeof p.catch==='function')p.catch(()=>updateButton());
}
function unlockAudio(){
  if(!audio||unlocking)return;
  unlocking=true;
  const oldVolume=audio.volume;
  try{
    audio.volume=0;
    const p=audio.play();
    if(p&&typeof p.then==='function'){
      p.then(()=>{
        try{audio.pause();audio.currentTime=0;audio.volume=oldVolume}catch(e){}
        unlocking=false;
        syncAudio();
      }).catch(()=>{
        try{audio.volume=oldVolume}catch(e){}
        unlocking=false;
      });
    }else{
      try{audio.pause();audio.currentTime=0;audio.volume=oldVolume}catch(e){}
      unlocking=false;
      syncAudio();
    }
  }catch(e){
    try{audio.volume=oldVolume}catch(err){}
    unlocking=false;
  }
}

function loadDetector(force=false){
  if(document.getElementById('noiseDetectorControls'))return;
  const old=document.getElementById('noiseDetectorScript');
  if(old&&!force)return;
  if(old)old.remove();
  if(force&&!document.getElementById('noiseDetectorControls'))window.__noiseDetectorV1=false;
  const script=document.createElement('script');
  script.id='noiseDetectorScript';
  script.src='noise-detector.js?v=20261006detector3&t='+Date.now();
  script.onerror=()=>{try{script.remove()}catch(e){};setTimeout(()=>loadDetector(true),350)};
  document.body.appendChild(script);
}

function install(){
  const panel=S.panel||document.getElementById('panel');
  const badge=document.querySelector('.noiseBadge');
  const noiseBig=document.getElementById('noiseBig');
  const noiseSub=document.getElementById('noiseSub');
  if(!panel||!badge||!noiseBig)return false;
  if(document.getElementById('noiseShushWrap'))return true;

  if(!document.getElementById('noiseShushStyleV5')){
    const style=document.createElement('style');
    style.id='noiseShushStyleV5';
    style.textContent=`
      .noiseMainContent{display:grid;grid-template-columns:auto auto;align-items:center;justify-content:center;column-gap:18px;row-gap:4px}
      #noiseSilentEmoji{font-size:clamp(72px,9vw,104px);line-height:1;filter:drop-shadow(0 5px 7px rgba(23,50,77,.10));transform:translateY(2px)}
      #noiseSilentEmoji.hidden{display:none!important}
      .noiseMainContent #noiseSub{grid-column:1/-1}
      #noiseShushWrap{display:flex;justify-content:center;margin:-4px auto 18px;transition:.18s ease}
      #noiseShushBtn{
        min-height:46px;padding:10px 18px;border-radius:14px;border:1px solid #9dd9d0;
        background:linear-gradient(145deg,#f7fffd,#dff6f1);color:#0a5d57;
        font-size:15px;font-weight:1000;box-shadow:0 7px 18px rgba(15,118,110,.10)
      }
      #noiseShushBtn:hover{transform:translateY(-1px);border-color:#63c8b9;background:#eefbf8}
      #noiseShushBtn.playing{background:#17324d;border-color:#17324d;color:#fff;box-shadow:0 8px 20px rgba(23,50,77,.18)}
      #noiseShushBtn.soundOff{background:#fff3f1;border-color:#f0b1a9;color:#b42318;box-shadow:none}
      @media(min-width:1200px) and (min-height:700px){
        #noiseSilentEmoji{font-size:clamp(96px,8vw,132px)}
        .noiseMainContent{column-gap:26px}
      }
      @media(max-width:760px){
        .noiseMainContent{column-gap:10px}
        #noiseSilentEmoji{font-size:clamp(58px,16vw,82px)}
        #noiseShushWrap{margin:-2px auto 12px}
        #noiseShushBtn{min-height:44px;font-size:14px;padding:9px 15px}
      }
    `;
    document.head.appendChild(style);
  }

  const mainContent=noiseBig.parentElement;
  if(mainContent)mainContent.classList.add('noiseMainContent');
  const emoji=document.createElement('span');
  emoji.id='noiseSilentEmoji';
  emoji.textContent='🤫';
  emoji.setAttribute('aria-hidden','true');
  noiseBig.insertAdjacentElement('beforebegin',emoji);

  audio=new Audio(AUDIO_SRC);
  audio.preload='auto';
  audio.loop=true;
  audio.volume=.65;

  const wrap=document.createElement('div');
  wrap.id='noiseShushWrap';
  const btn=document.createElement('button');
  btn.id='noiseShushBtn';
  btn.className='btn soft';
  btn.type='button';
  wrap.appendChild(btn);
  badge.insertAdjacentElement('afterend',wrap);

  function updateSilentUi(){
    const active=document.querySelector('.choice.active[data-i]');
    const silent=active?Number(active.dataset.i)===0:(noiseBig.textContent||'').trim()==='Silent';
    emoji.classList.toggle('hidden',!silent);
    if(noiseSub)noiseSub.style.gridColumn='1 / -1';
  }

  btn.addEventListener('click',()=>{
    soundEnabled=!soundEnabled;
    saveSoundEnabled();
    if(soundEnabled)unlockAudio();
    else stopAudio();
    updateButton();
    syncAudio();
  });

  document.addEventListener('pointerdown',e=>{
    if(soundEnabled&&e.target.closest?.('#noiseDetectorToggle'))unlockAudio();
  },true);

  window.addEventListener('cc-noise-detector-state',e=>{
    detectorState=e.detail?.state||'off';
    syncAudio();
  });

  audio.addEventListener('play',updateButton);
  audio.addEventListener('pause',updateButton);
  audio.addEventListener('error',()=>{stopAudio();updateButton()});

  panel.addEventListener('click',e=>{
    if(e.target.closest('[data-i]'))setTimeout(updateSilentUi,0);
  });

  const observer=new MutationObserver(updateSilentUi);
  observer.observe(noiseBig,{childList:true,characterData:true,subtree:true});
  window.addEventListener('pagehide',()=>stopAudio(),{once:true});
  updateSilentUi();
  updateButton();
  syncAudio();
  return true;
}

loadDetector();
let tries=0;
const id=setInterval(()=>{
  tries++;
  if(install()){
    clearInterval(id);
    setTimeout(()=>loadDetector(true),80);
    setTimeout(()=>loadDetector(true),500);
  }else if(tries>100){
    clearInterval(id);
  }
},50);
})();
