(function(){
'use strict';
const S=window.Support;
const supportTimer=S&&(S.slug==='timer-calm-music'||S.slug==='transition-countdown');
const stripTimer=!!(document.getElementById('timerStart')&&document.getElementById('time'));
if((!supportTimer&&!stripTimer)||window.ClassroomTimerAlarm)return;
let context=null;

// The finish alarm has its own audio path: switching off/fading the optional
// soundtrack must never silence it. Unlock this context during the Start click.
async function primeAlarm(){
  const C=window.AudioContext||window.webkitAudioContext;
  if(!C)return false;
  try{
    if(!context||context.state==='closed')context=new C();
    if(context.state!=='running')await context.resume();
    return context.state==='running';
  }catch(e){return false}
}
async function endAlarm(){
  if(!(await primeAlarm()))return;
  // Schedule after resume, using the resumed context's currentTime.
  const now=context.currentTime+.025;
  [0,.48,.96].forEach(delay=>{
    const oscillator=context.createOscillator(),gain=context.createGain(),start=now+delay;
    oscillator.type='square';oscillator.frequency.value=880;
    gain.gain.setValueAtTime(.0001,start);
    gain.gain.exponentialRampToValueAtTime(.16,start+.015);
    gain.gain.setValueAtTime(.16,start+.22);
    gain.gain.exponentialRampToValueAtTime(.0001,start+.34);
    oscillator.connect(gain);gain.connect(context.destination);
    oscillator.onended=()=>{oscillator.disconnect();gain.disconnect()};
    oscillator.start(start);oscillator.stop(start+.38);
  });
}
window.ClassroomTimerAlarm={prime:primeAlarm,play:endAlarm};
if(supportTimer){S.endAlarm=endAlarm;S.chime=endAlarm;window.__ccTimerEndBeepV1=true}
document.addEventListener('click',event=>{
  const start=event.target?.closest?.('#start,#timerStart,#time');
  if(start)void primeAlarm();
},true);
})();
