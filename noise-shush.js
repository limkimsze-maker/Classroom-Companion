(function(){
'use strict';
const S=window.Support;
if(!S||S.slug!=='noise-level'||window.__noiseShushV1)return;
window.__noiseShushV1=true;

const AUDIO_SRC='bredorantes-shushing-150148.mp3';
let audio=null;

function stopAudio(){
  if(!audio)return;
  try{audio.pause();audio.currentTime=0;}catch(e){}
}

function install(){
  const panel=S.panel||document.getElementById('panel');
  const badge=document.querySelector('.noiseBadge');
  const noiseBig=document.getElementById('noiseBig');
  if(!panel||!badge||!noiseBig)return false;
  if(document.getElementById('noiseShushWrap'))return true;

  if(!document.getElementById('noiseShushStyleV1')){
    const style=document.createElement('style');
    style.id='noiseShushStyleV1';
    style.textContent=`
      #noiseShushWrap{display:flex;justify-content:center;margin:-4px auto 18px;transition:.18s ease}
      #noiseShushWrap.hidden{display:none!important}
      #noiseShushBtn{
        min-height:46px;padding:10px 18px;border-radius:14px;border:1px solid #9dd9d0;
        background:linear-gradient(145deg,#f7fffd,#dff6f1);color:#0a5d57;
        font-size:15px;font-weight:1000;box-shadow:0 7px 18px rgba(15,118,110,.10)
      }
      #noiseShushBtn:hover{transform:translateY(-1px);border-color:#63c8b9;background:#eefbf8}
      #noiseShushBtn.playing{background:#17324d;border-color:#17324d;color:#fff;box-shadow:0 8px 20px rgba(23,50,77,.18)}
      @media(max-width:760px){#noiseShushWrap{margin:-2px auto 12px}#noiseShushBtn{min-height:44px;font-size:14px;padding:9px 15px}}
    `;
    document.head.appendChild(style);
  }

  audio=new Audio(AUDIO_SRC);
  audio.preload='auto';

  const wrap=document.createElement('div');
  wrap.id='noiseShushWrap';
  const btn=document.createElement('button');
  btn.id='noiseShushBtn';
  btn.className='btn soft';
  btn.type='button';
  btn.textContent='🔊 Play shush';
  btn.setAttribute('aria-label','Play shushing sound for Silent mode');
  wrap.appendChild(btn);
  badge.insertAdjacentElement('afterend',wrap);

  function updateButton(){
    const silent=(noiseBig.textContent||'').trim()==='Silent';
    wrap.classList.toggle('hidden',!silent);
    if(!silent){
      stopAudio();
      btn.classList.remove('playing');
      btn.textContent='🔊 Play shush';
    }
  }

  btn.addEventListener('click',()=>{
    if(!audio)return;
    if(!audio.paused){
      stopAudio();
      btn.classList.remove('playing');
      btn.textContent='🔊 Play shush';
      return;
    }
    try{audio.currentTime=0;}catch(e){}
    const p=audio.play();
    btn.classList.add('playing');
    btn.textContent='■ Stop shush';
    if(p&&typeof p.catch==='function')p.catch(()=>{
      btn.classList.remove('playing');
      btn.textContent='🔊 Play shush';
    });
  });

  audio.addEventListener('ended',()=>{
    btn.classList.remove('playing');
    btn.textContent='🔊 Play shush';
  });

  panel.addEventListener('click',e=>{
    if(e.target.closest('[data-i]'))setTimeout(updateButton,0);
  });

  const observer=new MutationObserver(updateButton);
  observer.observe(noiseBig,{childList:true,characterData:true,subtree:true});
  updateButton();
  return true;
}

let tries=0;
const id=setInterval(()=>{tries++;if(install()||tries>100)clearInterval(id)},50);
})();
