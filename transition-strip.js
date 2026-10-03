(function(){
'use strict';
let run=null,beatTimer=null,ctx=null,master=null;
const originalInstant=window.instantTool;
const originalOptions=window.toolOptions;
const originalStop=window.universalStop;

function fmt(sec){sec=Math.max(0,Math.floor(sec));return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`}
function shortcutLabel(){return document.querySelector('.shortcut[data-slug="transition-countdown"] span:last-child')}
function render(){
  const label=shortcutLabel();
  if(label)label.textContent=run&&run.running?`Transition ${fmt(run.sec)}`:'Transition Countdown';
  const bar=document.getElementById('quickbar');
  if(bar?.classList.contains('show')&&document.getElementById('quickTitle')?.textContent==='Transition'){
    const value=bar.querySelector('.transition-live');
    if(value)value.textContent=`${fmt(run?.sec||0)}  •  Move safely • Be ready`;
  }
  try{window.fitStrip?.()}catch(e){}
}
function ensureAudio(){
  const AC=window.AudioContext||window.webkitAudioContext;
  if(!AC)return null;
  if(!ctx)ctx=new AC();
  if(!master){master=ctx.createGain();master.gain.value=.0001;master.connect(ctx.destination)}
  return ctx;
}
function note(freq,when,dur=.12,vol=.055,type='triangle'){
  const c=ensureAudio();if(!c||!master)return;
  const o=c.createOscillator(),g=c.createGain();
  o.type=type;o.frequency.setValueAtTime(freq,when);
  g.gain.setValueAtTime(.0001,when);g.gain.exponentialRampToValueAtTime(vol,when+.012);g.gain.exponentialRampToValueAtTime(.0001,when+dur);
  o.connect(g);g.connect(master);o.start(when);o.stop(when+dur+.03);
}
function beat(){
  if(!run?.running||!run.music)return;
  const c=ensureAudio();if(!c)return;
  const now=c.currentTime;
  const urgent=run.sec<=10;
  const step=(run.beat||0)%8;
  const melody=[523.25,659.25,783.99,659.25,587.33,698.46,880,698.46];
  note(130.81,now,.10,urgent?.065:.05,'triangle');
  note(melody[step],now+.015,urgent?.10:.14,urgent?.07:.055,'sine');
  if(step%2===1)note(melody[(step+2)%8]*.5,now+.08,.09,.03,'triangle');
  run.beat=(run.beat||0)+1;
  beatTimer=setTimeout(beat,urgent?300:460);
}
async function startMusic(){
  const c=ensureAudio();if(!c)return;
  try{await c.resume()}catch(e){}
  master.gain.cancelScheduledValues(c.currentTime);master.gain.setValueAtTime(Math.max(master.gain.value,.0001),c.currentTime);master.gain.exponentialRampToValueAtTime(.85,c.currentTime+.08);
  clearTimeout(beatTimer);beat();
}
function stopMusic(){
  clearTimeout(beatTimer);beatTimer=null;
  if(ctx&&master){try{master.gain.cancelScheduledValues(ctx.currentTime);master.gain.setValueAtTime(Math.max(master.gain.value,.0001),ctx.currentTime);master.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.18)}catch(e){}}
}
function finishChime(){
  const c=ensureAudio();if(!c)return;const n=c.currentTime;
  [659.25,783.99,1046.5].forEach((f,i)=>note(f,n+i*.12,.18,.075,'sine'));
}
function stopTransition(silent=false){
  if(run?.id)clearInterval(run.id);
  stopMusic();
  run=null;render();
  if(!silent)try{window.toast?.('Transition stopped')}catch(e){}
}
function showLive(){
  if(typeof window.showQuick!=='function')return;
  window.showQuick('Transition',[{type:'value',label:`${fmt(run?.sec||0)}  •  Move safely • Be ready`}]);
  const v=document.querySelector('#quickbar .quick-value');if(v)v.classList.add('transition-live');render();
}
async function startTransition(sec=60,music=true){
  stopTransition(true);
  try{window.stopTimer?.()}catch(e){}
  run={sec,base:sec,running:true,music,beat:0,id:null};
  showLive();
  if(music)await startMusic();
  try{window.toast?.(music?'Transition started — upbeat music on':'Transition started — no music')}catch(e){}
  run.id=setInterval(()=>{
    if(!run)return;
    run.sec--;render();
    if(run.sec<=0){
      clearInterval(run.id);run.id=null;run.running=false;stopMusic();finishChime();render();
      try{window.toast?.('Ready! Transition complete')}catch(e){}
      setTimeout(()=>{if(run&&!run.running){run=null;render()}},1600);
    }
  },1000);
}
function transitionOptions(){
  if(typeof window.showQuick!=='function')return;
  window.showQuick('Transition',[
    {label:'30 sec ♫',action:()=>startTransition(30,true)},
    {label:'1 min ♫',primary:true,action:()=>startTransition(60,true)},
    {label:'2 min ♫',action:()=>startTransition(120,true)},
    {label:'30 sec silent',action:()=>startTransition(30,false)},
    {label:'1 min silent',action:()=>startTransition(60,false)},
    {label:'2 min silent',action:()=>startTransition(120,false)}
  ]);
}

window.startTransitionCountdown=startTransition;
window.stopTransitionCountdown=stopTransition;
if(typeof originalInstant==='function')window.instantTool=function(t){if(t?.slug==='transition-countdown'){startTransition(60,true);return}return originalInstant(t)};
if(typeof originalOptions==='function')window.toolOptions=function(t){if(t?.slug==='transition-countdown'){transitionOptions();return}return originalOptions(t)};
window.universalStop=function(){stopTransition(true);if(typeof originalStop==='function')return originalStop();try{window.closeQuick?.()}catch(e){}};

// Rebind already-rendered Transition shortcuts so this works even if earlier closures captured old functions.
function bindExisting(){document.querySelectorAll('.shortcut[data-slug="transition-countdown"]').forEach(b=>{
  if(b.dataset.transitionFixed)return;b.dataset.transitionFixed='1';
  b.onclick=e=>{e.preventDefault();e.stopPropagation();startTransition(60,true)};
  try{window.bindLongPress?.(b,transitionOptions)}catch(e){}
})}
setTimeout(bindExisting,0);setTimeout(bindExisting,250);setTimeout(bindExisting,800);
new MutationObserver(bindExisting).observe(document.body,{childList:true,subtree:true});
})();
