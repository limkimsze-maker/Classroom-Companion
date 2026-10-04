(function(){
'use strict';
const S=window.Support;
if(!S||S.slug!=='transition-countdown'||window.__transitionMarchBandV1)return;
window.__transitionMarchBandV1=true;

function install(){
  const panel=S.panel||document.getElementById('panel');
  if(!panel)return false;

  if(!document.getElementById('transitionMarchBandStyle')){
    const style=document.createElement('style');
    style.id='transitionMarchBandStyle';
    style.textContent=`
      .marchWrap{max-width:980px;margin:8px auto 16px;overflow:hidden;border-radius:22px;background:linear-gradient(180deg,#f8fffd,#eef8f6);border:1px solid #d7e9e5;padding:10px 12px 8px;position:relative}
      .marchGround{height:3px;background:#b7d8d2;border-radius:999px;margin-top:5px}
      .marchBand{display:flex;justify-content:center;align-items:flex-end;gap:clamp(18px,4vw,48px);min-height:92px;transform:translateX(-7%)}
      .marchBand.marching{animation:bandTravel 3.2s ease-in-out infinite alternate}
      .marchBand.fast{animation-duration:1.8s}
      @keyframes bandTravel{from{transform:translateX(-7%)}to{transform:translateX(7%)}}
      .bandMember{width:76px;height:84px;position:relative;display:grid;justify-items:center;align-content:start;transform-origin:50% 100%}
      .marching .bandMember{animation:memberBob .42s ease-in-out infinite alternate}
      .marching .bandMember:nth-child(2){animation-delay:.10s}.marching .bandMember:nth-child(3){animation-delay:.20s}.marching .bandMember:nth-child(4){animation-delay:.30s}
      .fast .bandMember{animation-duration:.28s}
      @keyframes memberBob{from{transform:translateY(0) rotate(-1deg)}to{transform:translateY(-7px) rotate(1deg)}}
      .bandHead{width:30px;height:30px;border-radius:50%;background:#ffd7b5;border:2px solid #17324d;position:relative;z-index:3}
      .bandHead:before,.bandHead:after{content:'';position:absolute;top:10px;width:3px;height:3px;border-radius:50%;background:#17324d}.bandHead:before{left:7px}.bandHead:after{right:7px}
      .bandBody{width:34px;height:30px;border-radius:8px 8px 5px 5px;background:#0f766e;border:2px solid #17324d;position:relative;z-index:2;margin-top:-1px}
      .bandBody.alt{background:#f59e0b}.bandBody.blue{background:#60a5fa}.bandBody.red{background:#ef6b63}
      .instrument{position:absolute;z-index:5;font-size:30px;top:29px;left:37px;transform:translateX(-4px)}
      .flagIcon{font-size:33px;top:24px;left:39px}
      .bandLegs{width:34px;height:24px;display:flex;justify-content:space-between;margin-top:-2px;position:relative}
      .leg{width:7px;height:23px;background:#17324d;border-radius:4px;transform-origin:50% 0}
      .marching .leg:first-child{animation:legA .42s ease-in-out infinite alternate}.marching .leg:last-child{animation:legB .42s ease-in-out infinite alternate}
      .fast .leg{animation-duration:.28s!important}
      @keyframes legA{from{transform:rotate(18deg)}to{transform:rotate(-18deg)}}
      @keyframes legB{from{transform:rotate(-18deg)}to{transform:rotate(18deg)}}
      .musicNotes{position:absolute;inset:0;pointer-events:none;overflow:hidden;opacity:0;transition:opacity .2s}.marching~.musicNotes,.marchWrap.playing .musicNotes{opacity:1}
      .musicNote{position:absolute;font-size:18px;animation:noteFloat 2.4s linear infinite}.musicNote:nth-child(1){left:18%;bottom:10px}.musicNote:nth-child(2){left:43%;bottom:4px;animation-delay:.7s}.musicNote:nth-child(3){left:70%;bottom:8px;animation-delay:1.3s}.musicNote:nth-child(4){left:84%;bottom:6px;animation-delay:1.8s}
      @keyframes noteFloat{0%{transform:translateY(0) scale(.8);opacity:0}20%{opacity:.9}100%{transform:translateY(-80px) scale(1.1);opacity:0}}
      .transitionReadyPop{animation:readyPop .55s cubic-bezier(.2,.85,.25,1.35)}
      @keyframes readyPop{0%{transform:scale(.72);opacity:.2}100%{transform:scale(1);opacity:1}}
      @media(max-width:700px){.marchBand{gap:12px}.bandMember{transform:scale(.82);margin-inline:-4px}.marchWrap{padding-inline:6px}}
      @media(prefers-reduced-motion:reduce){.marchBand.marching,.marching .bandMember,.marching .leg,.musicNote{animation:none!important}}
    `;
    document.head.appendChild(style);
  }

  let base=60,sec=60,running=false,timerId=null,music=true;
  let audioCtx=null,beatId=null,step=0;

  panel.innerHTML=`
    <div class="eyebrow">Change activity</div>
    <div class="timerRing" id="ring"><div class="timerValue" id="time">01:00</div></div>
    <div class="hero small" id="cue">Move safely • Be ready</div>
    <div class="supportText">Finish the transition before the countdown ends.</div>
    <div class="marchWrap" id="marchWrap" aria-label="Animated marching band">
      <div class="marchBand" id="marchBand">
        <div class="bandMember" aria-label="Drummer"><div class="bandHead"></div><div class="bandBody"></div><div class="instrument">🥁</div><div class="bandLegs"><span class="leg"></span><span class="leg"></span></div></div>
        <div class="bandMember" aria-label="Trumpet player"><div class="bandHead"></div><div class="bandBody alt"></div><div class="instrument">🎺</div><div class="bandLegs"><span class="leg"></span><span class="leg"></span></div></div>
        <div class="bandMember" aria-label="Brass player"><div class="bandHead"></div><div class="bandBody blue"></div><div class="instrument">🎷</div><div class="bandLegs"><span class="leg"></span><span class="leg"></span></div></div>
        <div class="bandMember" aria-label="Flag bearer"><div class="bandHead"></div><div class="bandBody red"></div><div class="instrument flagIcon">🚩</div><div class="bandLegs"><span class="leg"></span><span class="leg"></span></div></div>
      </div>
      <div class="musicNotes" aria-hidden="true"><span class="musicNote">♪</span><span class="musicNote">♫</span><span class="musicNote">♪</span><span class="musicNote">♫</span></div>
      <div class="marchGround"></div>
    </div>
    <div class="controls">
      ${[30,60,120].map(s=>`<button class="btn" data-sec="${s}">${s<60?s+' sec':s/60+' min'}</button>`).join('')}
      <button class="btn soft" id="music">🥁 March music: On</button>
      <button class="btn primary" id="start">▶ Start transition</button>
    </div>`;

  const ring=document.getElementById('ring');
  const time=document.getElementById('time');
  const cue=document.getElementById('cue');
  const start=document.getElementById('start');
  const musicBtn=document.getElementById('music');
  const band=document.getElementById('marchBand');
  const wrap=document.getElementById('marchWrap');

  function ensureAudio(){
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC)return null;
    if(!audioCtx)audioCtx=new AC();
    try{if(audioCtx.state==='suspended')audioCtx.resume()}catch(e){}
    return audioCtx;
  }

  function tone(freq,dur=.12,vol=.035,type='square',delay=0){
    const c=ensureAudio();if(!c)return;
    const now=c.currentTime+delay,o=c.createOscillator(),g=c.createGain(),f=c.createBiquadFilter();
    o.type=type;o.frequency.value=freq;f.type='lowpass';f.frequency.value=1500;
    g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(vol,now+.012);g.gain.exponentialRampToValueAtTime(.0001,now+dur);
    o.connect(f);f.connect(g);g.connect(c.destination);o.start(now);o.stop(now+dur+.03);
  }

  function kick(){
    const c=ensureAudio();if(!c)return;
    const now=c.currentTime,o=c.createOscillator(),g=c.createGain();
    o.type='sine';o.frequency.setValueAtTime(115,now);o.frequency.exponentialRampToValueAtTime(58,now+.12);
    g.gain.setValueAtTime(.055,now);g.gain.exponentialRampToValueAtTime(.0001,now+.16);
    o.connect(g);g.connect(c.destination);o.start(now);o.stop(now+.18);
  }

  function snare(){
    const c=ensureAudio();if(!c)return;
    const len=Math.floor(c.sampleRate*.11),buf=c.createBuffer(1,len,c.sampleRate),data=buf.getChannelData(0);
    for(let i=0;i<len;i++)data[i]=(Math.random()*2-1)*(1-i/len);
    const src=c.createBufferSource(),hp=c.createBiquadFilter(),g=c.createGain(),now=c.currentTime;
    hp.type='highpass';hp.frequency.value=1200;g.gain.setValueAtTime(.035,now);g.gain.exponentialRampToValueAtTime(.0001,now+.10);
    src.buffer=buf;src.connect(hp);hp.connect(g);g.connect(c.destination);src.start(now);
  }

  const melody=[523.25,659.25,783.99,659.25,587.33,698.46,783.99,698.46];
  function marchStep(){
    if(!running||!music)return;
    const strong=step%4===0,back=step%4===2;
    if(strong||back)kick();
    if(step%4===1||step%4===3)snare();
    const f=melody[step%melody.length];
    tone(f,.13,.026,'square');
    tone(f/2,.16,.012,'triangle',.015);
    step++;
  }

  function stopMarchMusic(){
    if(beatId){clearInterval(beatId);beatId=null;}
  }

  async function startMarchMusic(){
    stopMarchMusic();
    if(!running||!music)return;
    const c=ensureAudio();
    if(!c){S.toast('Audio is unavailable');return;}
    try{if(c.state==='suspended')await c.resume()}catch(e){}
    step=0;marchStep();beatId=setInterval(marchStep,250);
  }

  function setAnimation(on){
    band.classList.toggle('marching',on);
    wrap.classList.toggle('playing',on);
    band.classList.toggle('fast',on&&sec<=10);
  }

  function draw(){
    time.textContent=S.fmt(sec);
    ring.style.setProperty('--progress',`${Math.max(0,sec/base*100)}%`);
    ring.classList.toggle('pulse',running&&sec<=10);
    start.textContent=running?'■ Stop':'▶ Start transition';
    musicBtn.textContent='🥁 March music: '+(music?'On':'Off');
    band.classList.toggle('fast',running&&sec<=10);
  }

  function stop(resetCue=false){
    if(timerId){clearInterval(timerId);timerId=null;}
    running=false;stopMarchMusic();setAnimation(false);
    if(resetCue)cue.textContent='Move safely • Be ready';
    draw();
  }

  async function go(){
    if(running){stop(false);return;}
    if(sec<=0)sec=base;
    running=true;
    cue.classList.remove('transitionReadyPop');
    cue.textContent='Move safely • Be ready';
    setAnimation(true);draw();
    if(music)await startMarchMusic();
    timerId=setInterval(()=>{
      sec--;draw();
      if(sec<=0){
        if(timerId){clearInterval(timerId);timerId=null;}
        running=false;stopMarchMusic();setAnimation(false);draw();
        cue.textContent='Ready!';
        cue.classList.remove('transitionReadyPop');void cue.offsetWidth;cue.classList.add('transitionReadyPop');
        S.chime();S.toast('Transition complete');
      }
    },1000);
  }

  document.querySelectorAll('[data-sec]').forEach(b=>b.onclick=()=>{
    stop(true);base=sec=Number(b.dataset.sec);draw();
  });

  musicBtn.onclick=async()=>{
    music=!music;draw();
    if(!music){stopMarchMusic();return;}
    if(running)await startMarchMusic();
  };
  start.onclick=go;
  window.addEventListener('beforeunload',stopMarchMusic,{once:true});
  draw();
  return true;
}

let tries=0;
const id=setInterval(()=>{tries++;if(install()||tries>80)clearInterval(id)},50);
})();
