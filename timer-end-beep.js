(function(){
'use strict';
const S=window.Support;
if(!S||window.__ccTimerEndBeepV1)return;
if(S.slug!=='timer-calm-music'&&S.slug!=='transition-countdown')return;
window.__ccTimerEndBeepV1=true;

/*
  The finish alarm is deliberately separate from Calm/March music.
  Prime the shared AudioContext from the teacher's Start click so
  Chrome can play the alarm later when the countdown reaches zero,
  even when optional music is switched off.
*/
function primeAlarm(){
  try{S.tone(440,.01,.0001,'sine',0)}catch(e){}
}

function endAlarm(){
  try{
    [0,.34,.68].forEach(delay=>S.tone(880,.20,.13,'square',delay));
  }catch(e){}
}

S.endAlarm=endAlarm;
S.chime=endAlarm;

document.addEventListener('click',event=>{
  const start=event.target&&event.target.closest?event.target.closest('#start'):null;
  if(start)primeAlarm();
},true);
})();
