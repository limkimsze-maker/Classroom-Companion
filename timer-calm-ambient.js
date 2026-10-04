'use strict';
(() => {
  let ctx=null, master=null, compressor=null, airSource=null, airFilter=null, airGain=null, airLfo=null, airLfoGain=null;
  let scheduler=null, playing=false, nextChordTime=0, nextBellTime=0, chordIndex=0, bellIndex=0;
  const active=new Set();
  const CHORDS=[
    [146.83,220.00,277.18,329.63], // Dmaj9 colour
    [123.47,185.00,246.94,293.66], // Bm7
    [98.00,146.83,185.00,246.94],  // Gmaj7
    [110.00,164.81,220.00,329.63]  // Asus2
  ];
  const BELLS=[587.33,659.25,739.99,880.00,987.77,880.00,739.99,659.25];
  const AC=()=>window.AudioContext||window.webkitAudioContext;

  function ensureContext(){
    const C=AC();
    if(!C)return false;
    if(!ctx){
      ctx=new C();
      compressor=ctx.createDynamicsCompressor();
      compressor.threshold.value=-22;
      compressor.knee.value=18;
      compressor.ratio.value=2.2;
      compressor.attack.value=.08;
      compressor.release.value=.8;
      master=ctx.createGain();
      master.gain.value=.0001;
      master.connect(compressor);
      compressor.connect(ctx.destination);
    }
    return true;
  }

  async function prime(){
    if(!ensureContext())return false;
    try{if(ctx.state==='suspended')await ctx.resume();return true}catch(e){return false}
  }

  function makeAirBuffer(){
    const seconds=6,len=Math.floor(ctx.sampleRate*seconds),b=ctx.createBuffer(2,len,ctx.sampleRate);
    for(let ch=0;ch<2;ch++){
      const out=b.getChannelData(ch);let brown=0;
      for(let i=0;i<len;i++){
        const white=Math.random()*2-1;
        brown=(brown+0.018*white)/1.018;
        const shimmer=(Math.random()*2-1)*.055;
        out[i]=Math.max(-1,Math.min(1,brown*1.7+shimmer));
      }
    }
    return b;
  }

  function startAir(){
    airSource=ctx.createBufferSource();airSource.buffer=makeAirBuffer();airSource.loop=true;
    airFilter=ctx.createBiquadFilter();airFilter.type='bandpass';airFilter.frequency.value=520;airFilter.Q.value=.28;
    airGain=ctx.createGain();airGain.gain.value=.018;
    airLfo=ctx.createOscillator();airLfo.type='sine';airLfo.frequency.value=.055;
    airLfoGain=ctx.createGain();airLfoGain.gain.value=.006;
    airLfo.connect(airLfoGain);airLfoGain.connect(airGain.gain);
    airSource.connect(airFilter);airFilter.connect(airGain);airGain.connect(master);
    airSource.start();airLfo.start();
  }

  function track(nodes){
    nodes.forEach(n=>active.add(n));
    return ()=>nodes.forEach(n=>{try{n.disconnect()}catch(e){}active.delete(n)});
  }

  function padVoice(freq,start,duration,detune,pan){
    const osc=ctx.createOscillator(),filter=ctx.createBiquadFilter(),g=ctx.createGain();
    const p=ctx.createStereoPanner?ctx.createStereoPanner():null;
    osc.type='triangle';osc.frequency.value=freq;osc.detune.value=detune;
    filter.type='lowpass';filter.frequency.value=900;filter.Q.value=.35;
    g.gain.setValueAtTime(.0001,start);
    g.gain.exponentialRampToValueAtTime(.012,start+3.2);
    g.gain.setValueAtTime(.012,start+Math.max(3.4,duration-5));
    g.gain.exponentialRampToValueAtTime(.0001,start+duration);
    osc.connect(filter);filter.connect(g);
    if(p){p.pan.value=pan;g.connect(p);p.connect(master)}else g.connect(master);
    const cleanup=track([osc,filter,g,...(p?[p]:[])]);
    osc.start(start);osc.stop(start+duration+.1);osc.onended=cleanup;
  }

  function scheduleChord(start){
    const chord=CHORDS[chordIndex%CHORDS.length];chordIndex++;
    const duration=19;
    chord.forEach((f,i)=>{
      padVoice(f,start,duration,-4,(i-1.5)*.18);
      padVoice(f,start,duration,4,(1.5-i)*.15);
    });
    padVoice(chord[0]/2,start,duration,0,0);
  }

  function bell(freq,start){
    const o1=ctx.createOscillator(),o2=ctx.createOscillator(),g=ctx.createGain(),filter=ctx.createBiquadFilter();
    const p=ctx.createStereoPanner?ctx.createStereoPanner():null;
    o1.type='sine';o2.type='sine';o1.frequency.value=freq;o2.frequency.value=freq*2.01;
    filter.type='lowpass';filter.frequency.value=2200;filter.Q.value=.2;
    g.gain.setValueAtTime(.0001,start);
    g.gain.exponentialRampToValueAtTime(.022,start+.08);
    g.gain.exponentialRampToValueAtTime(.0001,start+5.5);
    o1.connect(g);o2.connect(g);g.connect(filter);
    if(p){p.pan.value=((bellIndex%5)-2)*.12;filter.connect(p);p.connect(master)}else filter.connect(master);
    const cleanup=track([o1,o2,g,filter,...(p?[p]:[])]);
    o1.start(start);o2.start(start);o1.stop(start+5.7);o2.stop(start+5.7);o1.onended=cleanup;
  }

  function schedule(){
    if(!playing||!ctx)return;
    const horizon=ctx.currentTime+24;
    while(nextChordTime<horizon){scheduleChord(nextChordTime);nextChordTime+=16}
    while(nextBellTime<horizon){
      if((bellIndex%4)!==3)bell(BELLS[bellIndex%BELLS.length],nextBellTime);
      bellIndex++;nextBellTime+=7.5;
    }
  }

  async function start(){
    if(playing){if(ctx?.state==='suspended')await ctx.resume();return true}
    if(!(await prime()))return false;
    playing=true;chordIndex=0;bellIndex=0;
    const now=ctx.currentTime+.05;
    nextChordTime=now;nextBellTime=now+4.5;
    startAir();
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(.0001,now);
    master.gain.exponentialRampToValueAtTime(.78,now+2.5);
    schedule();scheduler=setInterval(schedule,3000);
    return true;
  }

  function stop(fade=.8){
    if(!ctx)return;
    playing=false;clearInterval(scheduler);scheduler=null;
    const now=ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(Math.max(.0001,master.gain.value||.78),now);
    master.gain.exponentialRampToValueAtTime(.0001,now+fade);
    setTimeout(()=>{
      try{airSource?.stop();airLfo?.stop()}catch(e){}
      [airSource,airFilter,airGain,airLfo,airLfoGain].forEach(n=>{try{n?.disconnect()}catch(e){}});
      airSource=airFilter=airGain=airLfo=airLfoGain=null;
      for(const n of [...active]){try{n.stop?.()}catch(e){}try{n.disconnect?.()}catch(e){}}
      active.clear();
    },Math.max(50,fade*1000+80));
  }

  window.TimerCalmAmbient={start,stop,prime,isPlaying:()=>playing};
})();
