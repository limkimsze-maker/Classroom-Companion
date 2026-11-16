(function(){
'use strict';
  let audioCtx=null,marchMaster=null,marchCompressor=null,beatId=null,step=0,playRequest=0;

  function ensureAudio(){
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC)return null;
    if(!audioCtx){
      audioCtx=new AC();
      marchCompressor=audioCtx.createDynamicsCompressor();
      marchCompressor.threshold.value=-18;marchCompressor.knee.value=16;marchCompressor.ratio.value=3;marchCompressor.attack.value=.01;marchCompressor.release.value=.22;
      marchMaster=audioCtx.createGain();marchMaster.gain.value=1.38;
      marchMaster.connect(marchCompressor);marchCompressor.connect(audioCtx.destination);
    }
    try{if(audioCtx.state==='suspended')audioCtx.resume()}catch(e){}
    return audioCtx;
  }

  function output(node){node.connect(marchMaster||ensureAudio()?.destination)}

  function tone(freq,dur=.13,vol=.052,type='square',delay=0){
    const c=ensureAudio();if(!c)return;
    const now=c.currentTime+delay,o=c.createOscillator(),g=c.createGain(),f=c.createBiquadFilter();
    o.type=type;o.frequency.value=freq;f.type='lowpass';f.frequency.value=1650;
    g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(vol,now+.012);g.gain.exponentialRampToValueAtTime(.0001,now+dur);
    o.connect(f);f.connect(g);output(g);o.start(now);o.stop(now+dur+.03);
  }

  function kick(){
    const c=ensureAudio();if(!c)return;
    const now=c.currentTime,o=c.createOscillator(),g=c.createGain();
    o.type='sine';o.frequency.setValueAtTime(118,now);o.frequency.exponentialRampToValueAtTime(56,now+.14);
    g.gain.setValueAtTime(.09,now);g.gain.exponentialRampToValueAtTime(.0001,now+.18);
    o.connect(g);output(g);o.start(now);o.stop(now+.20);
  }

  function snare(){
    const c=ensureAudio();if(!c)return;
    const len=Math.floor(c.sampleRate*.12),buf=c.createBuffer(1,len,c.sampleRate),data=buf.getChannelData(0);
    for(let i=0;i<len;i++)data[i]=(Math.random()*2-1)*(1-i/len);
    const src=c.createBufferSource(),hp=c.createBiquadFilter(),g=c.createGain(),now=c.currentTime;
    hp.type='highpass';hp.frequency.value=1150;g.gain.setValueAtTime(.065,now);g.gain.exponentialRampToValueAtTime(.0001,now+.11);
    src.buffer=buf;src.connect(hp);hp.connect(g);output(g);src.start(now);
  }

  const melody=[523.25,659.25,783.99,659.25,587.33,698.46,783.99,698.46];
  function marchStep(){
    const strong=step%4===0,back=step%4===2;
    if(strong||back)kick();
    if(step%4===1||step%4===3)snare();
    const f=melody[step%melody.length];
    tone(f,.14,.048,'square');
    tone(f/2,.17,.022,'triangle',.015);
    step++;
  }

  function stop(){
    ++playRequest;
    clearInterval(beatId);
    beatId=null;
  }

  async function start(){
    stop();
    const request=playRequest;
    const c=ensureAudio();
    if(!c)return false;
    try{if(c.state!=='running')await c.resume()}catch(e){return false}
    if(request!==playRequest)return false;
    step=0;
    marchStep();
    beatId=setInterval(marchStep,250);
    return true;
  }

  window.ClassroomMarchAudio={start,stop};
})();
