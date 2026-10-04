(function(){
'use strict';
const params=new URLSearchParams(location.search),slug=params.get('tool')||'timer-calm-music';
const CC_STORE='classroomCompanionV1',MASTER_STORE='classroomCompanionClassMasterV1',TIMETABLE_STORE='classroomCompanionSupportTimetableV1';
const CORE=[
 {slug:'timer-calm-music',icon:'⏱️',title:'Timer + Calm Music',hint:'Make time visible and predictable.'},
 {slug:'transition-countdown',icon:'⏳',title:'Transition Countdown',hint:'Move safely and be ready.'},
 {slug:'attention-signal',icon:'👀',title:'Attention Signal',hint:'A clear cue to stop, look and listen.'},
 {slug:'noise-level',icon:'🔊',title:'Noise Level',hint:'Show pupils the voice level expected.'},
 {slug:'question-spinner',icon:'💬',title:'Sentence Starters',hint:'Simple ways to start an answer.'},
 {slug:'confidence-check',icon:'📈',title:'Confidence Check',hint:'A safe way for pupils to show how learning is going.'},
 {slug:'pick-a-pupil',icon:'🎯',title:'Pick a Pupil',hint:'Invite participation fairly from your class.'},
 {slug:'make-groups',icon:'👥',title:'Make Groups',hint:'Create random groups quickly from the class list.'},
 {slug:'brain-break',icon:'🧠',title:'Brain Break',hint:'A short reset before learning continues.'},
 {slug:'reflect',icon:'💭',title:'Reflect',hint:'Help pupils notice what supported their learning.'},
 {slug:'quote-of-the-day',icon:'✨',title:'Quote of the Day',hint:'Encouragement for pupils who find learning difficult.'},
 {slug:'daily-visual-timetable',icon:'🗓️',title:'Daily Visual Timetable',hint:'Make today predictable and easy to follow.'}
];
const tool=CORE.find(x=>x.slug===slug)||CORE[0],$=s=>document.querySelector(s),panel=$('#panel');
$('#toolIcon').textContent=tool.icon;$('#toolTitle').textContent=tool.title;$('#toolHint').textContent=tool.hint;document.title=tool.title+' • Classroom Companion';
$('#closeBtn').onclick=()=>window.close();
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[m]))}
function safe(raw,fallback){try{return JSON.parse(raw)||fallback}catch(e){return fallback}}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(t._id);t._id=setTimeout(()=>t.classList.remove('show'),1500)}
function fmt(sec){sec=Math.max(0,Math.floor(sec));return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`}
function classData(){return safe(localStorage.getItem(CC_STORE),{})||{classes:{},selectedClass:''}}
function masterStore(){return safe(localStorage.getItem(MASTER_STORE),{})||{}}
function hasPupils(rows){return Array.isArray(rows)&&rows.some(r=>String(r?.pupil||'').trim())}
function classNames(){const configured=Object.keys(classData().classes||{}),store=masterStore(),names=[];if(hasPupils(store._general))names.push('General');for(const name of configured)if(!names.includes(name))names.push(name);for(const key of Object.keys(store))if(key!=='_general'&&hasPupils(store[key])&&!names.includes(key))names.push(key);return names}
function selectedClass(){const d=classData(),names=classNames();return d.selectedClass&&names.includes(d.selectedClass)?d.selectedClass:(names[0]||'')}
function setSelectedClass(name){const d=classData();d.classes=d.classes||{};d.selectedClass=name==='General'?'':name;localStorage.setItem(CC_STORE,JSON.stringify(d))}
function masterRows(name=selectedClass()){const key=!name||name==='General'?'_general':name,store=masterStore(),rows=store[key];if(hasPupils(rows))return rows.filter(r=>String(r?.pupil||'').trim());if(!name||name==='General')return[];const d=classData(),c=d.classes?.[name],names=Array.isArray(c?.names)?c.names:Array.isArray(c)?c:[];return names.map((p,i)=>({index:String(i+1),pupil:typeof p==='string'?p:(p?.name||p?.pupil||''),group:''})).filter(r=>r.pupil)}
function openClassSetup(){const w=window.open('configure.html?panel=class&v='+Date.now(),'ClassroomCompanionConfigure','popup=yes,width=620,height=720,resizable=yes,scrollbars=yes');if(!w)toast('Allow pop-ups to add a class');else try{w.focus()}catch(e){}}
function classControls(){$('#classBtn').classList.remove('hidden');$('#classBtn').onclick=openClassSetup;const names=classNames(),sel=selectedClass();return `<div class="classBar">${names.length?`<select class="classSelect" id="classSelect">${names.map(n=>`<option ${n===sel?'selected':''}>${esc(n)}</option>`).join('')}</select>`:'<span class="supportText" style="margin:0;font-size:15px">No class yet.</span>'}<button class="btn soft" id="addClassInline">＋ Add class</button></div>`}
function bindClassControls(onChange){$('#addClassInline')?.addEventListener('click',openClassSetup);$('#classSelect')?.addEventListener('change',e=>{setSelectedClass(e.target.value);onChange?.()})}
function timetableKey(){const name=selectedClass();return !name||name==='General'?'_general':name}
function loadTimetable(){const all=safe(localStorage.getItem(TIMETABLE_STORE),{})||{};return Array.isArray(all[timetableKey()])?all[timetableKey()]:[]}
function saveTimetable(rows){const all=safe(localStorage.getItem(TIMETABLE_STORE),{})||{};all[timetableKey()]=rows;localStorage.setItem(TIMETABLE_STORE,JSON.stringify(all))}
let audioCtx=null;
function audio(){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;if(!audioCtx)audioCtx=new AC();try{audioCtx.resume()}catch(e){}return audioCtx}
function tone(freq=660,dur=.18,vol=.08,type='sine',delay=0){const c=audio();if(!c)return;const o=c.createOscillator(),g=c.createGain(),n=c.currentTime+delay;o.type=type;o.frequency.value=freq;o.connect(g);g.connect(c.destination);g.gain.setValueAtTime(.0001,n);g.gain.exponentialRampToValueAtTime(vol,n+.015);g.gain.exponentialRampToValueAtTime(.0001,n+dur);o.start(n);o.stop(n+dur+.04)}
function chime(){[659,784,1047].forEach((f,i)=>tone(f,.18,.07,'sine',i*.11))}
function tickTone(){tone(520,.06,.035,'triangle')}
function speak(text){try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-SG';u.rate=.86;u.pitch=1.03;const vs=speechSynthesis.getVoices()||[];u.voice=vs.find(v=>/^en[-_]SG$/i.test(v.lang||''))||vs.find(v=>/^en/i.test(v.lang||''))||null;speechSynthesis.speak(u)}catch(e){toast('Read aloud is unavailable')}}
function attachLauncher(){const s=document.createElement('script');s.src='embedded-launcher.js?v=20261003core13';s.dataset.currentTool=slug;document.body.appendChild(s)}
window.addEventListener('storage',e=>{if((slug==='pick-a-pupil'||slug==='make-groups')&&(e.key===MASTER_STORE||e.key===CC_STORE))location.reload()});
window.Support={slug,tool,CORE,$,panel,esc,safe,toast,fmt,CC_STORE,MASTER_STORE,TIMETABLE_STORE,classData,classNames,selectedClass,setSelectedClass,masterRows,openClassSetup,classControls,bindClassControls,timetableKey,loadTimetable,saveTimetable,tone,chime,tickTone,speak,attachLauncher};
if(slug==='question-spinner'){const ss=document.createElement('script');ss.src='sentence-starters.js?v=20261004ss1';document.body.appendChild(ss)}
})();