// Floating Document Picture-in-Picture
  let pipWin=null;
  function floatMarkup(){
    return `<!doctype html><html><head><meta charset="utf-8"><style>
      *{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#f8fafc;color:#17202a}
      .bar{padding:8px;display:flex;gap:6px;align-items:center;flex-wrap:wrap;background:white}
      button{min-height:42px;border:1px solid #d9e2ec;border-radius:11px;background:#eef6f5;color:#0f5f59;font-weight:900;padding:7px 10px}
      .time{font-size:20px;font-weight:950;padding:0 6px;min-width:64px}.score{font-weight:950;color:#a16207}.wide{flex:1}
      .sub{font-size:11px;color:#667085;padding:0 10px 7px}
    </style></head><body><div class="bar">
      <div class="time" id="fTime">${format(timerState.sec)}</div>
      <button id="fTimer">${timerState.running?'Pause':'Start'}</button>
      <button id="fPoint">⭐ <span id="fScore">${getClassPoints()}</span></button>
      <button id="fPick">🎯 Pick</button>
      <button id="fQuestion">❓ ${escapeHtml($('#questionPrompt').textContent)}</button>
      <button id="fNoise">🔊 ${escapeHtml($('#noiseMeter .active').textContent)}</button>
    </div><div class="sub" id="fStatus">${escapeHtml(currentClassName()||'No class selected')}</div></body></html>`
  }
  async function openFloat(){
    try{
      if('documentPictureInPicture' in window){
        pipWin=await window.documentPictureInPicture.requestWindow({width:520,height:120});
        pipWin.document.open();pipWin.document.write(floatMarkup());pipWin.document.close();bindFloat();
      }else{
        pipWin=window.open('','classroomFloat','width=560,height=150,resizable=yes');
        if(!pipWin){toast('Popup blocked. Allow popups for this site.');return}
        pipWin.document.open();pipWin.document.write(floatMarkup());pipWin.document.close();bindFloat();toast('Fallback window opened. Always-on-top depends on your system.')
      }
    }catch(e){toast('Could not open floating tools')}
  }
  function bindFloat(){
    if(!pipWin||pipWin.closed)return;const d=pipWin.document;
    d.getElementById('fTimer').onclick=()=>$('#timerStart').click();
    d.getElementById('fPoint').onclick=()=>$('#rewardPlus').click();
    d.getElementById('fPick').onclick=()=>{ $('#pickPupil').click();setTimeout(()=>{if(d.getElementById('fStatus'))d.getElementById('fStatus').textContent=$('#pickedPupil').textContent},50)};
    d.getElementById('fQuestion').onclick=()=>{ $('#questionSpin').click();setTimeout(syncFloat,900)};
    d.getElementById('fNoise').onclick=()=>{const bs=$$('#noiseMeter button'),i=bs.findIndex(x=>x.classList.contains('active'));bs[(i+1)%bs.length].click();syncFloat()};
  }
  function syncFloat(){
    if(!pipWin||pipWin.closed)return;try{const d=pipWin.document;if(d.getElementById('fTime'))d.getElementById('fTime').textContent=format(timerState.sec);if(d.getElementById('fTimer'))d.getElementById('fTimer').textContent=timerState.running?'Pause':'Start';if(d.getElementById('fScore'))d.getElementById('fScore').textContent=getClassPoints();if(d.getElementById('fQuestion'))d.getElementById('fQuestion').textContent='❓ '+$('#questionPrompt').textContent;if(d.getElementById('fNoise'))d.getElementById('fNoise').textContent='🔊 '+$('#noiseMeter .active').textContent}catch(e){}
  }
  $('#floatBtn').onclick=openFloat;$('#floatHint').onclick=openFloat;

  function renderAll(){
    renderClasses();renderReward();resetPicker();$('#pickedPupil').textContent=selectedClass()?'Ready':'Add or select a class';$('#groupPreview').textContent=selectedClass()?'Choose a group size and generate.':'Add or select a class.';updateClock();updateDailyTimetable();syncFloat()
  }
  renderTimer();renderFocus();renderAll();
