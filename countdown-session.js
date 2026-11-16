(function(){
'use strict';

// The launcher owns the session and its audio across the PiP-to-popup handoff.
function create(slug){
  const calm=slug==='timer-calm-music';
  const soundtrack=calm?window.TimerCalmAmbient:window.ClassroomMarchAudio;
  const alarm=window.ClassroomTimerAlarm;
  const views=new Set();
  let duration=calm?300:60;
  let remainingMs=duration*1000;
  let seconds=duration;
  let deadline=null,finishTimer=null,completed=false,music=true;
  let audioStatus='idle',audioRequest=0;

  function refresh(){for(const render of views)render();}
  function stopSoundtrack(){
    ++audioRequest;
    audioStatus='idle';
    if(calm)soundtrack.stop(.6);
    else soundtrack.stop();
  }
  async function startSoundtrack(){
    const request=++audioRequest;
    audioStatus='starting';
    refresh();
    let playing=false;
    try{playing=await soundtrack.start()}catch(e){}
    if(request!==audioRequest)return;
    audioStatus=playing?'playing':'unavailable';
    refresh();
  }
  function stopClock(){
    deadline=null;
    clearTimeout(finishTimer);
    stopSoundtrack();
  }
  function tick(){
    if(deadline===null)return;
    remainingMs=Math.max(0,deadline-Date.now());
    const next=Math.ceil(remainingMs/1000);
    if(next===0){
      stopClock();
      completed=true;
      void alarm.play();
    }
    if(next===seconds)return;
    seconds=next;
    refresh();
  }
  function select(value){
    stopClock();
    duration=seconds=value;
    remainingMs=value*1000;
    completed=false;
    refresh();
  }
  function toggle(){
    if(deadline!==null){
      tick();
      if(deadline!==null){
        stopClock();
        refresh();
      }
      return;
    }
    if(completed){
      completed=false;
      seconds=duration;
      remainingMs=duration*1000;
    }
    void alarm.prime();
    deadline=Date.now()+remainingMs;
    finishTimer=setTimeout(tick,remainingMs);
    if(music)void startSoundtrack();
    else refresh();
  }
  function toggleMusic(){
    music=!music;
    if(music&&deadline!==null)void startSoundtrack();
    else{
      if(!music)stopSoundtrack();
      refresh();
    }
  }

  return {
    get duration(){return duration;},
    get seconds(){return seconds;},
    get running(){return deadline!==null;},
    get completed(){return completed;},
    get music(){return music;},
    get audioStatus(){return audioStatus;},
    tick,select,toggle,toggleMusic,
    subscribe(render){views.add(render);return ()=>views.delete(render);},
    dispose(){views.clear();stopClock();}
  };
}

function forView(slug){
  return window.frameElement?.classroomCountdown||create(slug);
}

function watch(session,draw,finishMessage){
  const local=!window.frameElement?.classroomCountdown;
  let completed=session.completed;
  function render(){
    draw();
    if(session.completed&&!completed)window.Support.toast(finishMessage);
    completed=session.completed;
  }
  const unsubscribe=session.subscribe(render);
  // The visible window drives display updates even if the launcher is in the background.
  const timer=setInterval(session.tick,125);
  document.addEventListener('visibilitychange',session.tick);
  window.addEventListener('focus',session.tick);
  window.addEventListener('pagehide',()=>{
    clearInterval(timer);
    document.removeEventListener('visibilitychange',session.tick);
    window.removeEventListener('focus',session.tick);
    unsubscribe();
    if(local)session.dispose();
  },{once:true});
  session.tick();
  render();
}

window.ClassroomCountdown={create,forView,watch};
})();
