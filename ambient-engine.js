'use strict';
(() => {
  let ctx=null, master=null, compressor=null, sessionBus=null;
  let airSource=null, airFilter=null, airGain=null, airLfo=null, airLfoGain=null;
  let scheduler=null, playing=false, nextChordTime=0, nextBellTime=0, chordIndex=0, bellIndex=0;
  const active=new Set();
  const CHORDS=[
    [146.83,220.00,277.18,329.63],
    [123.47,185.00,246.94,293.66],
    [98.00,146.83,185.00,246.94],
    [110.00,164.81,220.00,329.63]
  ];
  const BELLS=[587.33,659.25,739.99,880.00,987.77,880.00,739.99,659.25];
  const AC=()=>window.AudioContext||window.webkitAudioContext;

  function ensureContext(){
    const C=AC();if(!C)return false;
    if(!ctx){
      ctx=new C();
      compressor=ctx.createDynamicsCompressor();
      compressor.threshold.value=-24;compressor.knee.value=20;compressor.ratio.value=2;compressor.attack.value=.1;compressor.release.value=1.2;
      master=ctx.createGain();master.gain.value=.72;master.connect(compressor);compressor.connect(ctx.destination);
    }
    return true;
  }
  async function prime(){
    if(!ensureContext())return false;
    try{if(ctx.state==='suspended')await ctx.resume();return true}catch(e){return false}
  }
  function makeAirBuffer(){
    const seconds=8,len=Math.floor(ctx.sampleRate*seconds),b=ctx.createBuffer(2,len,ctx.sampleRate);
    for(let ch=0;ch<2;ch++){
      const out=b.getChannelData(ch);let brown=0;
      for(let i=0;i<len;i++){
        const white=Math.random()*2-1;brown=(brown+.014*white)/1.014;
        const shimmer=(Math.random()*2-1)*.035;out[i]=Math.max(-1,Math.min(1,brown*1.45+shimmer));
      }
    }
    return b;
  }
  function startAir(bus){
    airSource=ctx.createBufferSource();airSource.buffer=makeAirBuffer();airSource.loop=true;
    airFilter=ctx.createBiquadFilter();airFilter.type='bandpass';airFilter.frequency.value=430;airFilter.Q.value=.24;
    airGain=ctx.createGain();airGain.gain.value=.012;
    airLfo=ctx.createOscillator();airLfo.type='sine';airLfo.frequency.value=.045;
    airLfoGain=ctx.createGain();airLfoGain.gain.value=.004;
    airLfo.connect(airLfoGain);airLfoGain.connect(airGain.gain);
    airSource.connect(airFilter);airFilter.connect(airGain);airGain.connect(bus);airSource.start();airLfo.start();
  }
  function track(nodes){
    nodes.forEach(n=>active.add(n));
    return ()=>nodes.forEach(n=>{try{n.disconnect()}catch(e){}active.delete(n)});
  }
  function padVoice(freq,start,duration,detune,pan,bus){
    const osc=ctx.createOscillator(),filter=ctx.createBiquadFilter(),g=ctx.createGain(),p=ctx.createStereoPanner?ctx.createStereoPanner():null;
    osc.type='triangle';osc.frequency.value=freq;osc.detune.value=detune;
    filter.type='lowpass';filter.frequency.value=780;filter.Q.value=.25;
    g.gain.setValueAtTime(.0001,start);g.gain.exponentialRampToValueAtTime(.0095,start+4.2);g.gain.setValueAtTime(.0095,start+Math.max(4.4,duration-5.5));g.gain.exponentialRampToValueAtTime(.0001,start+duration);
    osc.connect(filter);filter.connect(g);if(p){p.pan.value=pan;g.connect(p);p.connect(bus)}else g.connect(bus);
    const cleanup=track([osc,filter,g,...(p?[p]:[])]);osc.start(start);osc.stop(start+duration+.15);osc.onended=cleanup;
  }
  function scheduleChord(start,bus){
    const chord=CHORDS[chordIndex%CHORDS.length];chordIndex++;const duration=21;
    chord.forEach((f,i)=>{padVoice(f,start,duration,-3.5,(i-1.5)*.16,bus);padVoice(f,start,duration,3.5,(1.5-i)*.13,bus)});
    padVoice(chord[0]/2,start,duration,0,0,bus);
  }
  function bell(freq,start,bus){
    const o1=ctx.createOscillator(),o2=ctx.createOscillator(),g=ctx.createGain(),filter=ctx.createBiquadFilter(),p=ctx.createStereoPanner?ctx.createStereoPanner():null;
    o1.type='sine';o2.type='sine';o1.frequency.value=freq;o2.frequency.value=freq*2.005;
    filter.type='lowpass';filter.frequency.value=1900;filter.Q.value=.18;
    g.gain.setValueAtTime(.0001,start);g.gain.exponentialRampToValueAtTime(.014,start+.12);g.gain.exponentialRampToValueAtTime(.0001,start+6.2);
    o1.connect(g);o2.connect(g);g.connect(filter);if(p){p.pan.value=((bellIndex%5)-2)*.1;filter.connect(p);p.connect(bus)}else filter.connect(bus);
    const cleanup=track([o1,o2,g,filter,...(p?[p]:[])]);o1.start(start);o2.start(start);o1.stop(start+6.4);o2.stop(start+6.4);o1.onended=cleanup;
  }
  function schedule(){
    if(!playing||!ctx||!sessionBus)return;
    const bus=sessionBus,horizon=ctx.currentTime+24;
    while(nextChordTime<horizon){scheduleChord(nextChordTime,bus);nextChordTime+=18}
    while(nextBellTime<horizon){if((bellIndex%4)!==3)bell(BELLS[bellIndex%BELLS.length],nextBellTime,bus);bellIndex++;nextBellTime+=8.5}
  }
  async function start(){
    if(playing){if(ctx?.state==='suspended')await ctx.resume();return true}
    if(!(await prime()))return false;
    playing=true;chordIndex=0;bellIndex=0;
    const now=ctx.currentTime+.04;
    sessionBus=ctx.createGain();sessionBus.gain.setValueAtTime(.0001,now);sessionBus.gain.exponentialRampToValueAtTime(1,now+3.2);sessionBus.connect(master);
    nextChordTime=now;nextBellTime=now+5.2;startAir(sessionBus);schedule();scheduler=setInterval(schedule,3000);return true;
  }
  function stop(fade=1){
    if(!ctx)return;
    playing=false;clearInterval(scheduler);scheduler=null;
    const oldBus=sessionBus,oldAir=[airSource,airFilter,airGain,airLfo,airLfoGain],oldNodes=[...active];
    sessionBus=null;airSource=airFilter=airGain=airLfo=airLfoGain=null;active.clear();
    const now=ctx.currentTime;
    if(oldBus){
      try{oldBus.gain.cancelScheduledValues(now);oldBus.gain.setValueAtTime(Math.max(.0001,oldBus.gain.value||1),now);oldBus.gain.exponentialRampToValueAtTime(.0001,now+fade)}catch(e){}
    }
    setTimeout(()=>{
      try{oldAir[0]?.stop();oldAir[3]?.stop()}catch(e){}
      oldAir.forEach(n=>{try{n?.disconnect()}catch(e){}});
      oldNodes.forEach(n=>{try{n.stop?.()}catch(e){}try{n.disconnect?.()}catch(e){}});
      try{oldBus?.disconnect()}catch(e){}
    },Math.max(80,fade*1000+120));
  }
  window.ClassroomAmbient={start,stop,prime,isPlaying:()=>playing};
})();
