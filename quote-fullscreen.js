(function(){
  'use strict';
  const synth=window.speechSynthesis;
  let currentUtterance=null;
  let lastVoiceName='';

  const style=document.createElement('style');
  style.textContent=`
  .quote-garden{position:fixed;inset:0;z-index:2147483646;display:none;overflow:hidden;color:#17332f;background:linear-gradient(#8ed8f2 0 55%,#9bdd76 55% 100%);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
  .quote-garden.show{display:block}
  .quote-garden .sun{position:absolute;right:7vw;top:6vh;width:110px;height:110px;border-radius:50%;background:radial-gradient(circle at 38% 35%,#fff8b8 0 22%,#ffd95c 55%,#ffbe3b 100%);box-shadow:0 0 55px rgba(255,214,75,.75)}
  .quote-garden .cloud{position:absolute;font-size:clamp(54px,7vw,100px);filter:drop-shadow(0 5px 8px rgba(30,70,90,.09));opacity:.94;user-select:none}.quote-garden .c1{left:7vw;top:7vh}.quote-garden .c2{left:45vw;top:12vh;transform:scale(.72)}
  .quote-garden .hill{position:absolute;bottom:-17vh;width:72vw;height:46vh;border-radius:50% 50% 0 0}.quote-garden .h1{left:-13vw;background:#68bb5f}.quote-garden .h2{right:-15vw;background:#57a953}.quote-garden .path{position:absolute;left:50%;bottom:-4vh;transform:translateX(-50%);width:24vw;height:45vh;background:linear-gradient(180deg,#f6e6b1,#d9bc7e);clip-path:polygon(43% 0,57% 0,90% 100%,10% 100%);opacity:.95}
  .quote-garden .flowers{position:absolute;left:0;right:0;bottom:2vh;text-align:center;font-size:clamp(28px,4vw,58px);letter-spacing:.16em;filter:drop-shadow(0 3px 2px rgba(0,0,0,.08));white-space:nowrap}.quote-garden .butterfly{position:absolute;font-size:clamp(28px,3.5vw,54px);animation:qFloat 5s ease-in-out infinite}.quote-garden .b1{left:14vw;top:33vh}.quote-garden .b2{right:13vw;top:29vh;animation-delay:-2s}.quote-garden .b3{right:28vw;bottom:18vh;animation-delay:-3.5s}@keyframes qFloat{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-16px) rotate(5deg)}}
  .quote-garden .panel{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(920px,86vw);background:rgba(255,255,255,.93);border:4px solid rgba(255,255,255,.82);border-radius:34px;padding:clamp(24px,4vw,48px);box-shadow:0 24px 70px rgba(28,73,58,.24);text-align:center;backdrop-filter:blur(8px)}
  .quote-garden .eyebrow{font-size:clamp(16px,2vw,23px);font-weight:950;letter-spacing:.05em;color:#14756c;text-transform:uppercase;margin-bottom:18px}.quote-garden .quote-text{font-size:clamp(34px,5vw,66px);line-height:1.16;font-weight:950;letter-spacing:-.035em;color:#17332f;text-wrap:balance}.quote-garden .encourage{margin-top:18px;font-size:clamp(17px,2vw,24px);font-weight:800;color:#3b625c}.quote-garden .voice-note{margin-top:10px;font-size:13px;font-weight:800;color:#68807c;min-height:20px}
  .quote-garden .controls{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-top:28px}.quote-garden .qbtn{border:0;border-radius:14px;padding:12px 17px;font:inherit;font-size:15px;font-weight:950;cursor:pointer;background:#fff;color:#17332f;box-shadow:0 4px 12px rgba(23,51,47,.12)}.quote-garden .qbtn.primary{background:#0f766e;color:#fff}.quote-garden .qbtn.stop{background:#fff0ee;color:#a92a20}.quote-garden .qbtn.close{background:#17332f;color:#fff}.quote-garden .qbtn:focus-visible{outline:4px solid #ffd95c;outline-offset:2px}
  @media(max-width:650px){.quote-garden .panel{width:92vw;border-radius:24px}.quote-garden .controls{gap:7px}.quote-garden .qbtn{padding:10px 12px;font-size:13px}.quote-garden .sun{width:80px;height:80px}.quote-garden .flowers{letter-spacing:.05em}}
  `;
  document.head.appendChild(style);

  const garden=document.createElement('section');
  garden.id='quoteGarden';
  garden.className='quote-garden';
  garden.setAttribute('role','dialog');
  garden.setAttribute('aria-modal','true');
  garden.setAttribute('aria-label','Quote of the Day');
  garden.innerHTML=`
    <div class="sun" aria-hidden="true"></div>
    <div class="cloud c1" aria-hidden="true">☁️</div><div class="cloud c2" aria-hidden="true">☁️</div>
    <div class="hill h1" aria-hidden="true"></div><div class="hill h2" aria-hidden="true"></div><div class="path" aria-hidden="true"></div>
    <div class="butterfly b1" aria-hidden="true">🦋</div><div class="butterfly b2" aria-hidden="true">🦋</div><div class="butterfly b3" aria-hidden="true">🐝</div>
    <div class="flowers" aria-hidden="true">🌼 🌷 🌻 🌸 🌺 🌼 🌷 🌻 🌸 🌺 🌼</div>
    <div class="panel">
      <div class="eyebrow">✨ Today’s Encouraging Thought ✨</div>
      <div class="quote-text" id="gardenQuote"></div>
      <div class="encourage">One small step at a time. You can keep learning.</div>
      <div class="voice-note" id="gardenVoice">Preparing UK English voice…</div>
      <div class="controls">
        <button class="qbtn primary" id="gardenRead" type="button">🔊 Read Again</button>
        <button class="qbtn" id="gardenPause" type="button">⏸ Pause</button>
        <button class="qbtn stop" id="gardenStop" type="button">⏹ Stop</button>
        <button class="qbtn" id="gardenNew" type="button">🎲 New Quote</button>
        <button class="qbtn close" id="gardenClose" type="button">✕ Close</button>
      </div>
    </div>`;
  document.body.appendChild(garden);

  const $q=id=>document.getElementById(id);
  function getQuote(){return document.getElementById('dailyQuote')?.textContent?.trim()||'Keep going. One small step at a time.'}
  function refreshQuote(){ $q('gardenQuote').textContent=getQuote(); }

  function chooseUKFemaleVoice(){
    if(!synth)return null;
    const voices=synth.getVoices()||[];
    const female=/female|sonia|libby|hazel|serena|susan|kate|emma|emily|amy|fiona|samantha|moira|victoria/i;
    const uk=voices.filter(v=>/^en[-_]GB$/i.test(v.lang||'')||/united kingdom|british|uk english/i.test(v.name||''));
    return uk.find(v=>female.test(v.name||'')) || uk[0] || voices.find(v=>/^en/i.test(v.lang||'')&&female.test(v.name||'')) || voices.find(v=>/^en/i.test(v.lang||'')) || voices[0] || null;
  }

  function voiceReady(timeout=900){
    return new Promise(resolve=>{
      if(!synth){resolve(null);return}
      const now=chooseUKFemaleVoice();if(now){resolve(now);return}
      let done=false;
      const finish=()=>{if(done)return;done=true;synth.removeEventListener?.('voiceschanged',onChange);resolve(chooseUKFemaleVoice())};
      const onChange=()=>finish();
      synth.addEventListener?.('voiceschanged',onChange,{once:true});
      setTimeout(finish,timeout);
    });
  }

  async function speakQuote(){
    if(!synth){$q('gardenVoice').textContent='Text-to-speech is not available in this browser.';return}
    synth.cancel();
    $q('gardenPause').textContent='⏸ Pause';
    const voice=await voiceReady();
    const u=new SpeechSynthesisUtterance(getQuote());
    u.lang='en-GB';u.rate=.86;u.pitch=1.04;u.volume=1;
    if(voice){u.voice=voice;lastVoiceName=voice.name||'UK English';$q('gardenVoice').textContent='Voice: '+lastVoiceName}
    else{$q('gardenVoice').textContent='UK English voice preference enabled'}
    u.onend=()=>{$q('gardenPause').textContent='⏸ Pause'};
    u.onerror=()=>{$q('gardenVoice').textContent='Tap Read Again if your browser blocked automatic speech.'};
    currentUtterance=u;synth.speak(u);
  }

  function stopSpeech(){if(synth)synth.cancel();currentUtterance=null;$q('gardenPause').textContent='⏸ Pause'}
  function pauseResume(){
    if(!synth)return;
    if(synth.paused){synth.resume();$q('gardenPause').textContent='⏸ Pause';return}
    if(synth.speaking){synth.pause();$q('gardenPause').textContent='▶ Resume';return}
    speakQuote();
  }

  function openGarden(){
    refreshQuote();garden.classList.add('show');
    try{document.documentElement.requestFullscreen?.()}catch(e){}
    setTimeout(()=>speakQuote(),70);
    setTimeout(()=>$q('gardenRead')?.focus(),120);
  }
  function closeGarden(){
    stopSpeech();garden.classList.remove('show');
    try{if(document.fullscreenElement)document.exitFullscreen?.()}catch(e){}
  }

  $q('gardenRead').onclick=speakQuote;
  $q('gardenPause').onclick=pauseResume;
  $q('gardenStop').onclick=stopSpeech;
  $q('gardenNew').onclick=()=>{document.getElementById('quoteNew')?.click();refreshQuote();speakQuote()};
  $q('gardenClose').onclick=closeGarden;
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&garden.classList.contains('show'))closeGarden()});

  const fullBtn=document.getElementById('quoteFull');
  if(fullBtn){fullBtn.onclick=openGarden;fullBtn.textContent='Full Screen + Voice'}
  window.openQuoteExperience=openGarden;

  if(new URLSearchParams(location.search).get('quote')==='1')setTimeout(openGarden,350);
})();
