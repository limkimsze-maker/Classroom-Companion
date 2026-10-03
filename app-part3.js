// Brain / early / question / reflection
  function random(arr){return arr[Math.floor(Math.random()*arr.length)]}
  $('#brainNext').onclick=()=>$('#brainText').textContent=random(brainBreaks);
  $('#brainFull').onclick=()=>overlay($('#brainText').textContent,'Brain break');
  $('#earlyNext').onclick=()=>$('#earlyText').textContent=random(earlyFinish);
  $('#earlyFull').onclick=()=>overlay($('#earlyText').textContent,'If you are finished');
  $('#questionSpin').onclick=()=>{let n=0;const id=setInterval(()=>{$('#questionPrompt').textContent=random(questionPrompts);if(++n>10){clearInterval(id);chime();syncFloat()}},65)};
  $('#questionFull').onclick=()=>overlay($('#questionPrompt').textContent,'Use this prompt with the current lesson.');
  $('#reflectionNext').onclick=()=>$('#reflectionText').textContent=random(reflections);
  $('#reflectionFull').onclick=()=>overlay($('#reflectionText').textContent,'Think • Pair • Share, or respond orally.');
  $('#confidenceFull').onclick=()=>overlay('1  •  2  •  3  •  4','1 Need help   •   2 Getting there   •   3 I can do it   •   4 I can teach it');
  $('#selfCheckFull').onclick=()=>overlay('1   2   3   4   5','1 = confused   •   5 = confident');

  let tf=false;
  $('#tfToggle').onclick=()=>{tf=!tf;$('#answerChoices').innerHTML=tf?'<button>True</button><button>False</button>':'<button>A</button><button>B</button><button>C</button><button>D</button>';$('#answerChoices').style.gridTemplateColumns=tf?'repeat(2,1fr)':'repeat(4,1fr)'};
  $('#answerFull').onclick=()=>{const vals=$$('#answerChoices button').map(b=>b.textContent);overlay(vals.join('     '),'Show your answer')};

  $('#participationPlus').onclick=()=>{$('#participationCount').textContent=++participation};
  $('#participationReset').onclick=()=>{$('#participationCount').textContent=participation=0};
  $$('#engagement .chip').forEach(b=>b.onclick=()=>{$$('#engagement .chip').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('#engageLog').textContent=`${b.textContent} at ${new Date().toLocaleTimeString('en-SG',{hour:'2-digit',minute:'2-digit'})}`});
  $('#engageClear').onclick=()=>{$$('#engagement .chip').forEach(x=>x.classList.remove('active'));$('#engageLog').textContent='No snapshot yet.'};

  $('#kwlOpen').onclick=()=>{overlay('','','<div class="full-k-w-l"><section><h3>K — What we know</h3><textarea id="kwlK" placeholder="Type pupils’ ideas live…"></textarea></section><section><h3>W — What we want to know</h3><textarea id="kwlW" placeholder="What are we wondering?"></textarea></section><section><h3>L — What we learnt</h3><textarea id="kwlL" placeholder="Return here at the end…"></textarea></section></div>');$('#kwlK').value=data.kwl.k||'';$('#kwlW').value=data.kwl.w||'';$('#kwlL').value=data.kwl.l||'';['K','W','L'].forEach(x=>$('#kwl'+x).addEventListener('input',()=>{data.kwl[x.toLowerCase()]=$('#kwl'+x).value;saveData()}))};

  const learnerQuotes=[
    'You do not have to understand everything at once. Learn one step at a time.',
    'Slow progress is still progress. Keep the next step small and clear.',
    'Not knowing yet is the beginning of learning.',
    'A hard question is not a stop sign. Try a different strategy.',
    'Your first answer does not need to be perfect. It only needs to get you started.',
    'Mistakes show you what to work on next.',
    'When one way does not work, change the way — not the goal.',
    'Ask for help when you need it. Strong learners do.',
    'You can learn difficult things by breaking them into smaller parts.',
    'Today, aim to understand one thing better than yesterday.',
    'Getting stuck does not mean you cannot learn it. It means you need a next move.',
    'Try, check, change, and try again. That is learning.',
    'You are allowed to take your time. Keep thinking.',
    'One careful step is better than rushing through ten.',
    'If the work feels hard, choose one part you can do first.',
    'Every time you correct a mistake, your understanding gets stronger.',
    'You do not need to be the fastest learner. You need to keep learning.',
    'A small success today can become confidence tomorrow.',
    'Say what you know first. Then work out what is missing.',
    'When you feel unsure, use a strategy instead of giving up.',
    'Learning can feel difficult before it starts to feel familiar.',
    'Compare your work with your last attempt, not with someone else’s.',
    'You can pause, think, and try again.',
    'A question you ask today can unlock something tomorrow.',
    'Keep the parts you understand and work on one confusing part at a time.',
    'Effort helps most when you also change your strategy.',
    'You have learnt hard things before. Use the same patience again.',
    'Read it again. Draw it. Say it. Try another way.',
    'Being confused is a signal to slow down and look for the next clue.',
    'You do not have to get it right immediately to get better at it.',
    'Keep going until the next small step makes sense.'
  ];
  function quoteIndex(){const d=new Date();return Math.floor(new Date(d.getFullYear(),d.getMonth(),d.getDate())/86400000)%learnerQuotes.length}
  function setQuote(i){const q=learnerQuotes[((i%learnerQuotes.length)+learnerQuotes.length)%learnerQuotes.length];$('#dailyQuote').textContent=q;$('#quoteSource').textContent='Learning focus: confidence, persistence and helpful strategies.'}
  setQuote(quoteIndex());$('#quoteNew').onclick=()=>setQuote(Math.floor(Math.random()*learnerQuotes.length));$('#quoteFull').onclick=()=>overlay($('#dailyQuote').textContent,$('#quoteSource').textContent);

  function renderGoal(){goal=Math.max(0,Math.min(10,goal));$('#goalScore').textContent=goal;$('#goalBar').style.width=`${goal*10}%`;if(goal===10){chime();toast('Class goal reached! ⭐')}}
  $('#goalPlus').onclick=()=>{goal++;renderGoal()};$('#goalReset').onclick=()=>{goal=0;renderGoal()};
  $$('.rewardReason').forEach(b=>b.onclick=()=>{$$('.rewardReason').forEach(x=>x.classList.remove('active'));b.classList.add('active');selectedRewardReason=b.textContent});
  function getClassPoints(){const c=currentClassName()||'_general';return data.classPoints[c]||0}
  function renderReward(){ $('#rewardScore').textContent=getClassPoints();syncFloat() }
  $('#rewardPlus').onclick=()=>{const c=currentClassName()||'_general';data.classPoints[c]=(data.classPoints[c]||0)+1;saveData();renderReward();beep(780,.1,.05);toast(`+1 ${selectedRewardReason}`)};
  $('#rewardOpen').onclick=()=>{renderRewardModal();modal('rewardModal')};

  $$('.soundBtn').forEach(b=>b.onclick=()=>{const s=b.dataset.sound;if(s==='chime')chime();if(s==='success'){beep(660,.08,.06);setTimeout(()=>beep(880,.08,.06),90);setTimeout(()=>beep(990,.15,.06),180)}if(s==='transition'){beep(520,.12,.06);setTimeout(()=>beep(620,.12,.06),140)}if(s==='applause'){for(let i=0;i<7;i++)setTimeout(()=>beep(420+Math.random()*250,.04,.03),i*65)}});

  $$('#obsCounters .counter').forEach(b=>b.onclick=()=>{const k=b.dataset.key;obs[k]++;$('b',b).textContent=obs[k]});
  $('#obsReset').onclick=()=>{obs={off:0,call:0,seat:0,prompt:0};$$('#obsCounters .counter').forEach(b=>$('b',b).textContent='0')};

  $('#shadeBtn').onclick=()=>overlay('','',`<div style="position:absolute;inset:0;background:#0f172a;display:grid;place-items:center"><button class="btn" onclick="document.getElementById('overlay').classList.remove('show')">Reveal</button></div>`);

  $('#randomNumBtn').onclick=()=>$('#randomNum').textContent=1+Math.floor(Math.random()*100);
  const die=['⚀','⚁','⚂','⚃','⚄','⚅'];
  $('#rollOne').onclick=()=>$('#diceValue').textContent=random(die);
  $('#rollTwo').onclick=()=>$('#diceValue').textContent=random(die)+' '+random(die);
  $('#coinBtn').onclick=()=>{$('#coinValue').textContent=Math.random()<.5?'Heads':'Tails';beep(600,.08,.05)};
  $('#actionSpin').onclick=()=>$('#actionValue').textContent=random(actions);
