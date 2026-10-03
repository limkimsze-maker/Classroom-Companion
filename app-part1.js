'use strict';
  const $ = (s, p=document) => p.querySelector(s);
  const $$ = (s, p=document) => [...p.querySelectorAll(s)];
  const STORE='classroomCompanionV1';
  const defaultData={classes:{},selectedClass:'',classPoints:{},pupilPoints:{},teamPoints:{},timetables:{},kwl:{k:'',w:'',l:''}};
  let data=loadData();
  let timerState={sec:300,base:300,running:false,id:null};
  let transState={sec:60,base:60,running:false,id:null};
  let moveState={sec:60,base:60,running:false,id:null};
  let focusState={running:false,id:null,phase:'focus',sec:480,total:480};
  let musicNode=null,audioCtx=null;
  let participation=0,goal=0,selectedRewardReason='Focus',pickerPool=[],groupN=2;
  let obs={off:0,call:0,seat:0,prompt:0};
  let activeTimetableDay=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];
  if(!['Monday','Tuesday','Wednesday','Thursday','Friday'].includes(activeTimetableDay)) activeTimetableDay='Monday';

  const subjects = {
    'Morning Routine':'🌞','English':'📖','Mathematics':'🔢','Science':'🔬','Mother Tongue':'🗣️','PE':'⚽',
    'Art':'🎨','Music':'🎵','Recess':'🍎','Lunch':'🍱','Assembly':'🏫','Library':'📚','CCE':'🤝','CCA':'🏀','Dismissal':'🏠','Other':'⭐'
  };
  const quoteBank=[
    ['Good learners notice what works, change what does not, and try again.','EEF — metacognition & self-regulation'],
    ['Before you begin, make a plan. While you work, check it. Afterward, reflect.','EEF — metacognition & self-regulation'],
    ['A useful mistake tells you what to try next.','EEF — feedback and self-regulated learning'],
    ['Explain your thinking. Hearing your own reasoning can help you improve it.','EEF — metacognition & classroom talk'],
    ['When a task is challenging, choose a strategy instead of giving up.','EEF — self-regulated learning'],
    ['Strong learners ask: What is my goal? How am I doing? What should I change?','EEF — plan, monitor and evaluate']
  ];
  const questionPrompts=['Who?','What?','When?','Where?','Why?','How?','Explain','Compare','Predict','What if…?','What evidence?','Give a reason','How do you know?','Describe'];
  const brainBreaks=['10 shoulder rolls.','Reach high, then touch your toes 5 times.','March quietly on the spot for 30 seconds.','Stretch both arms wide and take 3 slow breaths.','Do 8 slow chair squats.','Stand tall and balance on one foot for 10 seconds, then switch.','Trace a giant figure 8 in the air with your finger.','Shake out your hands, arms and shoulders for 20 seconds.'];
  const earlyFinish=['Check your work carefully.','Improve one answer.','Explain your thinking to a partner.','Find another way to solve it.','Create one challenge question.','Choose one answer and justify it.'];
  const reflections=['What did you learn today?','What was difficult?','What helped you learn?','What mistake taught you something?','Which strategy worked best for you?','What would you do differently next time?','What are you proud of today?'];
  const actions=['Turn left','Turn right','Step forward','Step back','Clap twice','Reach up','Touch your knees','Freeze','Swap places','Spin once'];
  const preCorrections={
    'Independent':'Work quietly • Start promptly • Stay on task • Try before asking',
    'Pair':'Partner voice • Take turns • Explain your thinking • Both participate',
    'Group':'Group voice • Everyone contributes • Stay with your group • Share materials',
    'Transition':'Stop • Listen • Move safely • Be ready quickly'
  };

  function loadData(){
    try{return {...structuredClone(defaultData),...JSON.parse(localStorage.getItem(STORE)||'{}')}}catch(e){return structuredClone(defaultData)}
  }
  function saveData(){localStorage.setItem(STORE,JSON.stringify(data))}
  function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(t._id);t._id=setTimeout(()=>t.classList.remove('show'),1800)}
  function beep(freq=660,dur=.15,vol=.08){
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
    const c=audioCtx||(audioCtx=new AC());const o=c.createOscillator(),g=c.createGain();o.frequency.value=freq;o.type='sine';g.gain.value=vol;o.connect(g);g.connect(c.destination);o.start();g.gain.exponentialRampToValueAtTime(.001,c.currentTime+dur);o.stop(c.currentTime+dur)
  }
  function chime(){beep(660,.12,.07);setTimeout(()=>beep(880,.18,.06),130)}
  function format(sec){sec=Math.max(0,sec);return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`}
  function modal(id,show=true){$('#'+id).classList.toggle('show',show)}
  function overlay(title,sub='',html=''){
    $('#overlayContent').innerHTML = html || `<div class="overlay-title">${title}</div>${sub?`<div class="overlay-sub">${sub}</div>`:''}`;
    $('#overlay').classList.add('show')
  }
  function escapeHtml(s=''){return s.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
  function selectedClass(){return data.classes[data.selectedClass]||null}
  function currentClassName(){return data.selectedClass||''}

  function updateClock(){
    const d=new Date(),time=d.toLocaleTimeString('en-SG',{hour:'2-digit',minute:'2-digit',hour12:false});
    const date=d.toLocaleDateString('en-SG',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
    $('#heroTime').textContent=time;$('#clockWidget').textContent=time;$('#heroDate').textContent=date;$('#dateWidget').textContent=date.replace(', ',' • ');
    $('#heroClass').textContent=currentClassName()?`Class: ${currentClassName()}`:'Ready for any class';
    updateDailyTimetable();
  }
  setInterval(updateClock,15000);

  function filterWidgets(){
    const q=$('#toolSearch').value.trim().toLowerCase(),cat=$('#categoryFilter').value;
    $$('.widget').forEach(w=>{const okQ=!q||w.dataset.name.includes(q)||$('.widget-title',w).textContent.toLowerCase().includes(q);const okC=cat==='all'||w.dataset.cat.split(' ').includes(cat);w.classList.toggle('hidden',!(okQ&&okC))});
    $$('.section').forEach(s=>{const visible=$$('.widget:not(.hidden)',s).length;s.style.display=visible?'':'none'})
  }
  $('#toolSearch').addEventListener('input',filterWidgets);$('#categoryFilter').addEventListener('change',filterWidgets);

  function renderTimer(){ $('#timerDisplay').textContent=format(timerState.sec); }
  $$('#timerPresets .chip').forEach(b=>b.onclick=()=>{if(timerState.running)return; $$('#timerPresets .chip').forEach(x=>x.classList.remove('active'));b.classList.add('active');timerState.base=timerState.sec=+b.dataset.min*60;renderTimer()});
  $('#timerStart').onclick=()=>{timerState.running=!timerState.running;$('#timerStart').textContent=timerState.running?'Pause':'Start';clearInterval(timerState.id);if(timerState.running)timerState.id=setInterval(()=>{timerState.sec--;renderTimer();syncFloat();if(timerState.sec<=0){clearInterval(timerState.id);timerState.running=false;$('#timerStart').textContent='Start';chime();toast('Time is up')}} ,1000)};
  $('#timerReset').onclick=()=>{clearInterval(timerState.id);timerState.running=false;timerState.sec=timerState.base;$('#timerStart').textContent='Start';renderTimer();syncFloat()};

  $('#musicToggle').onclick=async()=>{if(musicNode){stopMusic();return}const AC=window.AudioContext||window.webkitAudioContext;if(!AC){toast('Audio is not supported in this browser');return}audioCtx=audioCtx||new AC();await audioCtx.resume();const osc=audioCtx.createOscillator(),gain=audioCtx.createGain(),lfo=audioCtx.createOscillator(),lfoGain=audioCtx.createGain();osc.type='sine';osc.frequency.value=174;lfo.frequency.value=.08;lfoGain.gain.value=.015;gain.gain.value=.025;lfo.connect(lfoGain);lfoGain.connect(gain.gain);osc.connect(gain);gain.connect(audioCtx.destination);osc.start();lfo.start();musicNode={osc,lfo,gain};$('#musicToggle').textContent='♫ Music On';toast('Calm background tone on')};
  function stopMusic(){try{musicNode.osc.stop();musicNode.lfo.stop()}catch(e){}musicNode=null;$('#musicToggle').textContent='♫ Music Off'}
