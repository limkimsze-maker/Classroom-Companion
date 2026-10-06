(function(){
'use strict';
const S=window.Support;
if(!S||S.slug!=='noise-level'||window.__noiseDetectorV1)return;
window.__noiseDetectorV1=true;

const STORE='classroomCompanionNoiseLimitsV1';
const DEFAULTS={Silent:18,Whisper:28,Partner:42,Group:58,Presentation:72};
let limits=loadLimits();
let stream=null,audioCtx=null,analyser=null,data=null,raf=0,running=false;
let smoothLevel=0,aboveSince=0,quietSince=0,state='off';

function loadLimits(){
  try{return {...DEFAULTS,...JSON.parse(localStorage.getItem(STORE)||'{}')}}catch(e){return {...DEFAULTS}}
}
function saveLimits(){try{localStorage.setItem(STORE,JSON.stringify(limits))}catch(e){}}
function currentMode(){return (document.getElementById('noiseBig')?.textContent||'Silent').trim()}
function clamp(n,a,b){return Math.max(a,Math.min(b,n))}
function stopDetector(){
  running=false;cancelAnimationFrame(raf);raf=0;
  try{stream?.getTracks().forEach(t=>t.stop())}catch(e){}
  try{audioCtx?.close()}catch(e){}
  stream=null;audioCtx=null;analyser=null;data=null;
  setState('off');
  const btn=document.getElementById('noiseDetectorToggle');if(btn){btn.textContent='🎤 Start detector';btn.classList.remove('running')}
  const meter=document.getElementById('noiseMeterFill');if(meter)meter.style.width='0%';
  const live=document.getElementById('noiseLiveValue');if(live)live.textContent='—';
}
function setState(next){
  state=next;
  const badge=document.getElementById('noiseDetectorStatus');
  const noiseBadge=document.querySelector('.noiseBadge');
  if(!badge||!noiseBadge)return;
  badge.className='noiseDetectorStatus '+next;
  if(next==='off')badge.textContent='Sound detector off';
  if(next==='good')badge.textContent='✓ Good level';
  if(next==='near')badge.textContent='Getting loud — softer please';
  if(next==='loud')badge.textContent='TOO LOUD — SOFTER PLEASE';
  noiseBadge.classList.toggle('detectorNear',next==='near');
  noiseBadge.classList.toggle('detectorLoud',next==='loud');
  noiseBadge.classList.toggle('detectorGood',next==='good');
}
function updateModeUi(){
  const mode=currentMode();
  const limit=limits[mode]??DEFAULTS[mode]??40;
  const label=document.getElementById('noiseLimitLabel');
  const slider=document.getElementById('noiseLimitSlider');
  if(label)label.textContent=mode+' limit: '+limit;
  if(slider)slider.value=limit;
  aboveSince=0;quietSince=0;
}
function measure(){
  if(!running||!analyser||!data)return;
  analyser.getByteTimeDomainData(data);
  let sum=0;
  for(let i=0;i<data.length;i++){
    const v=(data[i]-128)/128;
    sum+=v*v;
  }
  const rms=Math.sqrt(sum/data.length)||0.000001;
  const db=20*Math.log10(rms);
  const level=clamp((db+60)/50*100,0,100);
  smoothLevel=smoothLevel? smoothLevel*.82+level*.18 : level;

  const mode=currentMode();
  const limit=limits[mode]??40;
  const now=performance.now();
  const meter=document.getElementById('noiseMeterFill');
  const live=document.getElementById('noiseLiveValue');
  if(meter)meter.style.width=clamp(smoothLevel,0,100)+'%';
  if(live)live.textContent=Math.round(smoothLevel);

  if(smoothLevel>=limit){
    if(!aboveSince)aboveSince=now;
    quietSince=0;
    setState(now-aboveSince>=1100?'loud':'near');
  }else if(smoothLevel>=limit*.82){
    aboveSince=0;quietSince=0;setState('near');
  }else{
    aboveSince=0;
    if(!quietSince)quietSince=now;
    if(now-quietSince>=550)setState('good');
  }
  raf=requestAnimationFrame(measure);
}
async function startDetector(){
  if(running){stopDetector();return}
  const btn=document.getElementById('noiseDetectorToggle');
  try{
    stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
    audioCtx=new (window.AudioContext||window.webkitAudioContext)();
    const source=audioCtx.createMediaStreamSource(stream);
    analyser=audioCtx.createAnalyser();
    analyser.fftSize=1024;analyser.smoothingTimeConstant=.4;
    source.connect(analyser);
    data=new Uint8Array(analyser.fftSize);
    running=true;smoothLevel=0;aboveSince=0;quietSince=0;
    if(btn){btn.textContent='■ Stop detector';btn.classList.add('running')}
    setState('good');
    measure();
  }catch(e){
    stopDetector();
    if(btn)btn.textContent='🎤 Allow microphone';
    const badge=document.getElementById('noiseDetectorStatus');
    if(badge){badge.className='noiseDetectorStatus off';badge.textContent='Microphone permission needed'}
  }
}
function install(){
  const panel=S.panel||document.getElementById('panel');
  const noiseBadge=document.querySelector('.noiseBadge');
  const noiseBig=document.getElementById('noiseBig');
  if(!panel||!noiseBadge||!noiseBig)return false;
  if(document.getElementById('noiseDetectorControls'))return true;

  if(!document.getElementById('noiseDetectorStyleV1')){
    const style=document.createElement('style');
    style.id='noiseDetectorStyleV1';
    style.textContent=`
      .noiseBadge{position:relative;transition:.22s ease}
      .noiseBadge.detectorGood{border-color:#7bd6a4;background:linear-gradient(145deg,#fff,#effcf5)}
      .noiseBadge.detectorNear{border-color:#f1bd58;background:linear-gradient(145deg,#fff,#fff8e9)}
      .noiseBadge.detectorLoud{border-color:#ef6f6f;background:linear-gradient(145deg,#fff,#fff0f0);box-shadow:0 0 0 5px rgba(239,111,111,.12),0 16px 35px rgba(180,40,40,.12)}
      .noiseDetectorStatus{margin-top:12px;font-weight:1000;letter-spacing:-.02em;transition:.18s ease}
      .noiseDetectorStatus.off{font-size:14px;color:#667085}
      .noiseDetectorStatus.good{font-size:clamp(18px,2vw,26px);color:#18794e}
      .noiseDetectorStatus.near{font-size:clamp(21px,2.5vw,34px);color:#9a6700}
      .noiseDetectorStatus.loud{font-size:clamp(28px,4vw,58px);line-height:1;color:#c62828;text-transform:uppercase;animation:noiseWarnPulse .85s ease-in-out infinite alternate}
      @keyframes noiseWarnPulse{to{transform:scale(1.035)}}
      #noiseDetectorControls{max-width:900px;margin:0 auto 18px;padding:12px 14px;border:1px solid #dce6ea;border-radius:18px;background:#fbfdfd;box-shadow:0 6px 18px rgba(18,32,46,.045)}
      .noiseDetectorTop{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap}
      #noiseDetectorToggle{min-height:44px}
      #noiseDetectorToggle.running{background:#17324d;border-color:#17324d;color:#fff}
      .noiseLimitBox{display:flex;align-items:center;gap:10px;flex:1 1 360px;max-width:580px;min-width:260px}
      #noiseLimitLabel{min-width:118px;text-align:right;font-size:13px;font-weight:1000;color:#17324d}
      #noiseLimitSlider{width:100%;accent-color:#0f766e}
      .noiseLive{display:flex;align-items:center;gap:8px;justify-content:center;margin-top:9px}
      .noiseMeter{width:min(620px,82%);height:12px;border-radius:999px;background:linear-gradient(90deg,#d7f3e4 0 45%,#ffedb8 45% 70%,#ffd0d0 70% 100%);overflow:hidden;box-shadow:inset 0 0 0 1px rgba(23,50,77,.08)}
      #noiseMeterFill{height:100%;width:0;background:#17324d;opacity:.72;border-radius:999px;transition:width .09s linear}
      #noiseLiveValue{font-size:12px;font-weight:1000;color:#667085;min-width:24px}
      .noiseDetectorHint{margin-top:7px;font-size:11px;line-height:1.3;color:#667085;font-weight:750}
      @media(max-width:760px){
        #noiseDetectorControls{padding:10px;margin-bottom:12px}.noiseLimitBox{min-width:100%;display:grid;grid-template-columns:1fr}.noiseLimitBox #noiseLimitLabel{text-align:center;min-width:0}.noiseMeter{width:80%}
      }
    `;
    document.head.appendChild(style);
  }

  const status=document.createElement('div');
  status.id='noiseDetectorStatus';status.className='noiseDetectorStatus off';status.textContent='Sound detector off';
  noiseBadge.querySelector('div')?.appendChild(status);

  const controls=document.createElement('div');
  controls.id='noiseDetectorControls';
  controls.innerHTML=`<div class="noiseDetectorTop"><button class="btn soft" id="noiseDetectorToggle">🎤 Start detector</button><div class="noiseLimitBox"><span id="noiseLimitLabel"></span><input id="noiseLimitSlider" type="range" min="5" max="95" step="1"></div></div><div class="noiseLive"><div class="noiseMeter"><div id="noiseMeterFill"></div></div><span id="noiseLiveValue">—</span></div><div class="noiseDetectorHint">Teacher sets a separate limit for each voice mode. Settings are saved on this device.</div>`;
  const shush=document.getElementById('noiseShushWrap');
  (shush||noiseBadge).insertAdjacentElement('afterend',controls);

  document.getElementById('noiseDetectorToggle').addEventListener('click',startDetector);
  const slider=document.getElementById('noiseLimitSlider');
  slider.addEventListener('input',()=>{
    const mode=currentMode();limits[mode]=+slider.value;saveLimits();updateModeUi();
  });

  panel.addEventListener('click',e=>{
    if(e.target.closest('[data-i]'))setTimeout(()=>{updateModeUi();if(running){aboveSince=0;quietSince=0;setState('good')}},0);
  });
  new MutationObserver(()=>updateModeUi()).observe(noiseBig,{childList:true,characterData:true,subtree:true});
  updateModeUi();
  window.addEventListener('pagehide',stopDetector,{once:true});
  return true;
}

let tries=0;
const id=setInterval(()=>{tries++;if(install()||tries>100)clearInterval(id)},50);
})();
