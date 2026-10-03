(()=>{
  const style=document.createElement('style');
  style.textContent=`
    #quickLauncher{position:fixed;inset:0;z-index:9998;background:linear-gradient(145deg,#eef8f7 0%,#f8fbff 55%,#f6f3ff 100%);display:grid;place-items:center;padding:18px;font-family:system-ui,-apple-system,Segoe UI,sans-serif}
    #quickLauncher.hidden{display:none}
    .ql-card{width:min(760px,96vw);background:rgba(255,255,255,.96);border:1px solid #dbe7e5;border-radius:28px;box-shadow:0 24px 70px rgba(15,48,45,.18);overflow:hidden}
    .ql-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 18px 12px;border-bottom:1px solid #e7efee}
    .ql-brand{display:flex;align-items:center;gap:10px;min-width:0}.ql-logo{width:38px;height:38px;border-radius:13px;background:#0f766e;color:#fff;display:grid;place-items:center;font-size:20px;font-weight:900}.ql-title{font-weight:900;color:#17312f;font-size:18px}.ql-sub{font-size:12px;color:#667875}
    .ql-class{max-width:210px;min-height:42px;border:1px solid #d4e2e0;border-radius:12px;padding:0 10px;background:#fff;font-weight:700;color:#27423f}
    .ql-main{padding:14px 16px 16px}.ql-time-row{display:flex;align-items:center;justify-content:space-between;gap:12px;background:#f4fbfa;border:1px solid #d7ebe8;border-radius:18px;padding:14px 15px;margin-bottom:12px}.ql-time{font-size:38px;line-height:1;font-weight:950;letter-spacing:-1px;color:#0f5f59}.ql-time-label{font-size:12px;color:#6a7d7a;margin-top:5px}
    .ql-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:9px}.ql-btn{min-height:74px;border:1px solid #dfe9e7;border-radius:16px;background:#fff;color:#213b38;font-weight:850;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;cursor:pointer;box-shadow:0 2px 8px rgba(28,56,52,.05)}.ql-btn:hover{background:#f3faf9;border-color:#bddbd6}.ql-btn:active{transform:translateY(1px)}.ql-icon{font-size:23px}.ql-btn.primary{background:#0f766e;color:#fff;border-color:#0f766e}.ql-btn.soft{background:#f5f1ff;border-color:#e4daf9;color:#5b3a8d}.ql-btn.warn{background:#fff8e8;border-color:#f3dfaa;color:#855d09}
    .ql-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:12px}.ql-status{font-size:12px;color:#6a7d7a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ql-more{min-height:42px;border:0;border-radius:12px;background:#edf4f3;color:#24443f;padding:0 14px;font-weight:850;cursor:pointer}
    @media(max-width:700px){.ql-card{border-radius:22px}.ql-grid{grid-template-columns:repeat(3,1fr)}.ql-time{font-size:34px}.ql-head{align-items:flex-start}.ql-class{max-width:150px}.ql-btn{min-height:68px}}
    @media(max-width:430px){#quickLauncher{padding:8px}.ql-head{flex-direction:column}.ql-class{width:100%;max-width:none}.ql-grid{grid-template-columns:repeat(2,1fr)}.ql-foot{align-items:stretch;flex-direction:column}.ql-more{width:100%}}
  `;
  document.head.appendChild(style);

  const launcher=document.createElement('div');
  launcher.id='quickLauncher';
  launcher.innerHTML=`<div class="ql-card" role="dialog" aria-label="Classroom Companion quick tools">
    <div class="ql-head"><div class="ql-brand"><div class="ql-logo">✦</div><div><div class="ql-title">Classroom Companion</div><div class="ql-sub">Open. Tap. Teach.</div></div></div><select id="qlClass" class="ql-class" aria-label="Choose class"><option value="">No class selected</option></select></div>
    <div class="ql-main">
      <div class="ql-time-row"><div><div class="ql-time" id="qlTime">05:00</div><div class="ql-time-label">Timer</div></div><button class="ql-btn primary" id="qlTimer" style="min-width:110px;min-height:64px"><span class="ql-icon">⏱️</span><span id="qlTimerLabel">Start</span></button></div>
      <div class="ql-grid">
        <button class="ql-btn warn" id="qlPoint"><span class="ql-icon">⭐</span><span>+ Point</span></button>
        <button class="ql-btn" id="qlPick"><span class="ql-icon">🎯</span><span>Pick</span></button>
        <button class="ql-btn soft" id="qlQuestion"><span class="ql-icon">❓</span><span>Question</span></button>
        <button class="ql-btn" id="qlNoise"><span class="ql-icon">🔊</span><span id="qlNoiseText">Noise</span></button>
        <button class="ql-btn" id="qlAddClass"><span class="ql-icon">👥</span><span>Add Class</span></button>
        <button class="ql-btn primary" id="qlFloat"><span class="ql-icon">▣</span><span>Float</span></button>
      </div>
      <div class="ql-foot"><div class="ql-status" id="qlStatus">Ready for any class</div><button class="ql-more" id="qlMore">All Tools →</button></div>
    </div>
  </div>`;
  document.body.appendChild(launcher);

  const click=(id)=>document.getElementById(id)?.click();
  const mainClass=document.getElementById('classSelect');
  const qlClass=document.getElementById('qlClass');
  function syncClass(){
    if(!mainClass)return;
    const sig=[...mainClass.options].map(o=>o.value+'|'+o.textContent).join('~');
    if(qlClass.dataset.sig!==sig){qlClass.innerHTML='';[...mainClass.options].forEach(o=>qlClass.add(new Option(o.textContent,o.value)));qlClass.dataset.sig=sig}
    qlClass.value=mainClass.value;
    document.getElementById('qlStatus').textContent=mainClass.value?`Class: ${mainClass.value}`:'Ready for any class';
  }
  qlClass.addEventListener('change',()=>{if(mainClass){mainClass.value=qlClass.value;mainClass.dispatchEvent(new Event('change',{bubbles:true}));syncClass()}});

  document.getElementById('qlTimer').onclick=()=>click('timerStart');
  document.getElementById('qlPoint').onclick=()=>click('rewardPlus');
  document.getElementById('qlPick').onclick=()=>click('pickPupil');
  document.getElementById('qlQuestion').onclick=()=>click('questionSpin');
  document.getElementById('qlNoise').onclick=()=>{
    const buttons=[...document.querySelectorAll('#noiseMeter button')];
    if(!buttons.length)return;
    const i=buttons.findIndex(b=>b.classList.contains('active'));
    buttons[(i+1+buttons.length)%buttons.length].click();
  };
  document.getElementById('qlAddClass').onclick=()=>click('addClassBtn');
  document.getElementById('qlFloat').onclick=()=>click('floatBtn');
  document.getElementById('qlMore').onclick=()=>launcher.classList.add('hidden');

  const back=document.createElement('button');
  back.id='returnWidgetBtn';back.type='button';back.textContent='◧ Quick Widget';
  back.style.cssText='position:fixed;right:18px;bottom:18px;z-index:9000;min-height:46px;padding:0 15px;border:0;border-radius:14px;background:#0f766e;color:#fff;font:800 14px system-ui;box-shadow:0 8px 24px rgba(15,61,57,.25);cursor:pointer';
  back.onclick=()=>launcher.classList.remove('hidden');
  document.body.appendChild(back);

  function sync(){
    const t=document.getElementById('timerDisplay'); if(t)document.getElementById('qlTime').textContent=t.textContent;
    const ts=document.getElementById('timerStart'); if(ts)document.getElementById('qlTimerLabel').textContent=ts.textContent;
    const active=document.querySelector('#noiseMeter .active'); if(active)document.getElementById('qlNoiseText').textContent=active.textContent;
    syncClass();
  }
  setInterval(sync,500); sync();
})();