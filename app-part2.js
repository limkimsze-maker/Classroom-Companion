// Generic choices
  function exclusive(parent,selector='.chip'){ $$(selector,parent).forEach(b=>b.onclick=()=>{$$(selector,parent).forEach(x=>x.classList.remove('active'));b.classList.add('active')})}
  exclusive($('#lessonStages'),'.stage');exclusive($('#noiseMeter'),'button');exclusive($('#workMode'),'.chip');exclusive($('#precorrect'),'.chip');exclusive($('#groupSize'),'.chip');
  $$('#noiseMeter button').forEach(b=>b.onclick=()=>{$$('#noiseMeter button').forEach(x=>x.classList.remove('active'));b.classList.add('active');syncFloat()});
  $$('#workMode .chip').forEach(b=>b.onclick=()=>{$$('#workMode .chip').forEach(x=>x.classList.remove('active'));b.classList.add('active')});
  $$('#groupSize .chip').forEach(b=>b.onclick=()=>{$$('#groupSize .chip').forEach(x=>x.classList.remove('active'));b.classList.add('active');groupN=+b.dataset.size});
  $$('#lessonStages .stage').forEach(b=>b.onclick=()=>{$$('#lessonStages .stage').forEach(x=>x.classList.remove('active'));b.classList.add('active')});
  $$('#precorrect .chip').forEach(b=>b.onclick=()=>{$$('#precorrect .chip').forEach(x=>x.classList.remove('active'));b.classList.add('active')});
  $$('#expectations .chip').forEach(b=>b.onclick=()=>b.classList.toggle('active'));
  $$('#trafficLights .light').forEach(b=>b.onclick=()=>{$$('#trafficLights .light').forEach(x=>x.classList.remove('active'));b.classList.add('active')});

  $$('.transPreset').forEach(b=>b.onclick=()=>{if(transState.running)return;$$('.transPreset').forEach(x=>x.classList.remove('active'));b.classList.add('active');transState.base=transState.sec=+b.dataset.sec;$('#transitionDisplay').textContent=format(transState.sec)});
  $('#transitionStart').onclick=()=>{if(transState.running)return;transState.running=true;$('#transitionStart').textContent='Running…';transState.id=setInterval(()=>{transState.sec--;$('#transitionDisplay').textContent=format(transState.sec);if(transState.sec<=0){clearInterval(transState.id);transState.running=false;$('#transitionStart').textContent='Start';chime()}},1000)};
  $('#transitionReset').onclick=()=>{clearInterval(transState.id);transState.running=false;transState.sec=transState.base;$('#transitionDisplay').textContent=format(transState.sec);$('#transitionStart').textContent='Start'};

  $$('.movePreset').forEach(b=>b.onclick=()=>{$$('.movePreset').forEach(x=>x.classList.remove('active'));b.classList.add('active');moveState.base=moveState.sec=+b.dataset.sec;$('#moveDisplay').textContent=format(moveState.sec)});
  $('#moveStart').onclick=()=>{clearInterval(moveState.id);moveState.sec=moveState.base;$('#moveStart').textContent='Running…';moveState.id=setInterval(()=>{moveState.sec--;$('#moveDisplay').textContent=format(moveState.sec);if(moveState.sec<=0){clearInterval(moveState.id);$('#moveStart').textContent='Start';chime()}},1000)};

  function renderFocus(){const label=focusState.phase==='focus'?`${Math.ceil(focusState.sec/60)} min focus`:`${Math.ceil(focusState.sec/60)} min reset`;$('#focusLabel').textContent=label;$('#focusBar').style.width=`${(1-focusState.sec/focusState.total)*100}%`}
  $('#focusStart').onclick=()=>{if(focusState.running){clearInterval(focusState.id);focusState.running=false;$('#focusStart').textContent='Resume';return}focusState.running=true;$('#focusStart').textContent='Pause';focusState.id=setInterval(()=>{focusState.sec--;renderFocus();if(focusState.sec<=0){chime();focusState.phase=focusState.phase==='focus'?'reset':'focus';focusState.total=focusState.sec=focusState.phase==='focus'?480:60;renderFocus()}},1000)};
  $('#focusReset').onclick=()=>{clearInterval(focusState.id);focusState={running:false,id:null,phase:'focus',sec:480,total:480};$('#focusStart').textContent='Start Cycle';renderFocus()};

  $('#attentionBtn').onclick=()=>{chime();let n=3;overlay(String(n),'Eyes here');const id=setInterval(()=>{n--;if(n>0)$('#overlayContent').innerHTML=`<div class="overlay-title">${n}</div><div class="overlay-sub">Eyes here</div>`;else{clearInterval(id);$('#overlayContent').innerHTML=`<div class="overlay-title">Eyes here</div><div class="overlay-sub">Ready to learn</div>`}},800)};
  $('#calmBtn').onclick=()=>{let sec=30;overlay('Breathe in…','Follow the circle • 30 seconds',`<div id="breathCircle" style="width:180px;height:180px;border-radius:50%;background:#8fd8d0;margin:0 auto 24px;transform:scale(.7);transition:transform 4s ease-in-out"></div><div class="overlay-title" style="font-size:48px" id="breathText">Breathe in…</div><div class="overlay-sub"><span id="breathSec">30</span> seconds</div>`);let inhale=true;setTimeout(()=>$('#breathCircle').style.transform='scale(1.25)',50);const id=setInterval(()=>{sec--;$('#breathSec').textContent=sec;if(sec%4===0){inhale=!inhale;$('#breathText').textContent=inhale?'Breathe in…':'Breathe out…';$('#breathCircle').style.transform=inhale?'scale(1.25)':'scale(.7)'}if(sec<=0){clearInterval(id);$('#breathText').textContent='Ready';chime()}},1000)};

  $('#clockFull').onclick=()=>{const w=Math.max(900,screen.availWidth||1200),h=Math.max(650,screen.availHeight||800);const win=window.open('clock.html?format=24&date=1&seconds=0&v=20261003clock1','ClassroomCompanionClock',`popup=yes,width=${w},height=${h},left=0,top=0,resizable=yes,scrollbars=no`);if(!win){toast('Allow popups to open the full-screen clock');return}try{win.moveTo(0,0);win.resizeTo(screen.availWidth,screen.availHeight);win.focus()}catch(e){}};
  $('#dateFull').onclick=()=>overlay($('#dateWidget').textContent);
  $('[data-expand="lessonStage"]').onclick=()=>overlay($('#lessonStages .active').textContent,'Current lesson stage');
  $('#noiseFull').onclick=()=>overlay($('#noiseMeter .active').textContent,'Expected voice level');
  $('#trafficFull').onclick=()=>{const b=$('#trafficLights .active');overlay(b?b.dataset.label:'Green — Keep going')};
  $('#workFull').onclick=()=>overlay($('#workMode .active').textContent,'Work mode');
  $('#helpFull').onclick=()=>overlay('Try → Check → Ask a friend → Ask the teacher','Use these steps before calling the teacher.');
  $('#expectationsFull').onclick=()=>{const a=$$('#expectations .active').map(x=>x.textContent);overlay(a.length?a.join(' • '):'Listen • Start promptly • Stay on task • Use the right voice level','Our expectations')};
  $('#precorrectShow').onclick=()=>{const k=$('#precorrect .active').textContent;overlay(k,preCorrections[k])};

  let tps={id:null,stage:0,sec:0,total:0};const tpsStages=[['Think',20],['Pair',60],['Share',60]];
  function tpsRender(){if(tps.stage>=3){$('#tpsLabel').textContent='Done';$('#tpsBar').style.width='100%';return}$('#tpsLabel').textContent=`${tpsStages[tps.stage][0]} • ${tps.sec}s`;$('#tpsBar').style.width=`${(1-tps.sec/tps.total)*100}%`}
  $('#tpsStart').onclick=()=>{clearInterval(tps.id);tps.stage=0;tps.total=tps.sec=tpsStages[0][1];tpsRender();tps.id=setInterval(()=>{tps.sec--;tpsRender();if(tps.sec<=0){chime();tps.stage++;if(tps.stage>=3){clearInterval(tps.id);tpsRender();return}tps.total=tps.sec=tpsStages[tps.stage][1];tpsRender()}},1000)};
  $('#tpsReset').onclick=()=>{clearInterval(tps.id);tps.stage=0;tps.sec=0;$('#tpsLabel').textContent='Ready';$('#tpsBar').style.width='0%'};

  let wb=0;const wbStages=['Think','Write','Show'];
  $('#whiteboardNext').onclick=()=>{wb=(wb+1)%3;$('#whiteboardStage').textContent=wbStages[wb];if(wb===2)chime()};
  $('#whiteboardReset').onclick=()=>{wb=0;$('#whiteboardStage').textContent='Think'};