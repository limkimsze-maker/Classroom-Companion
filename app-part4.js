// Classes
  function renderClasses(){
    const sel=$('#classSelect');sel.innerHTML='<option value="">No class selected</option>'+Object.keys(data.classes).map(n=>`<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join('');
    sel.value=data.selectedClass||'';
    $('#classList').innerHTML=Object.entries(data.classes).map(([name,c])=>`<div class="class-item"><div><b>${escapeHtml(name)}</b><div class="source">${c.names.length} pupils</div></div><button class="btn" data-use="${escapeHtml(name)}">Use</button><button class="btn danger" data-del="${escapeHtml(name)}">Delete</button></div>`).join('')||'<p class="help">No classes yet. Add one above if you want pupil-aware tools.</p>';
    $$('[data-use]').forEach(b=>b.onclick=()=>{data.selectedClass=b.dataset.use;saveData();renderAll();modal('classModal',false)});
    $$('[data-del]').forEach(b=>b.onclick=()=>{if(confirm(`Delete ${b.dataset.del}?`)){delete data.classes[b.dataset.del];if(data.selectedClass===b.dataset.del)data.selectedClass='';saveData();renderAll()}});
  }
  $('#addClassBtn').onclick=()=>{renderClasses();modal('classModal')};
  $('#classSelect').onchange=e=>{data.selectedClass=e.target.value;pickerPool=[];saveData();renderAll()};
  $('#saveClass').onclick=()=>{const name=$('#newClassName').value.trim();const names=$('#newClassNames').value.split(/\n|,/).map(x=>x.trim()).filter(Boolean);if(!name){toast('Enter a class name');return}data.classes[name]={names};data.selectedClass=name;saveData();$('#newClassName').value='';$('#newClassNames').value='';renderAll();toast('Class saved')};
  $('#exportData').onclick=()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='classroom-companion-backup.json';a.click();URL.revokeObjectURL(a.href)};
  $('#importData').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const imported=JSON.parse(await f.text());data={...structuredClone(defaultData),...imported};saveData();renderAll();toast('Backup imported')}catch(err){toast('Could not import this file')}e.target.value=''};

  function resetPicker(){const c=selectedClass();pickerPool=c?[...c.names]:[]}
  $('#pickPupil').onclick=()=>{const c=selectedClass();if(!c||!c.names.length){toast('Add or select a class first');return}if(!pickerPool.length)resetPicker();const i=Math.floor(Math.random()*pickerPool.length),name=pickerPool.splice(i,1)[0];$('#pickedPupil').textContent=name;beep(720,.08,.05);syncFloat()};
  $('#pickerReset').onclick=()=>{resetPicker();$('#pickedPupil').textContent=selectedClass()?'Ready':'Add or select a class';toast('Picker cycle reset')};

  let currentGroups=[];
  $('#makeGroups').onclick=()=>{const c=selectedClass();if(!c||!c.names.length){toast('Add or select a class first');return}const a=[...c.names].sort(()=>Math.random()-.5);currentGroups=[];for(let i=0;i<a.length;i+=groupN)currentGroups.push(a.slice(i,i+groupN));$('#groupPreview').textContent=currentGroups.map((g,i)=>`G${i+1}: ${g.join(', ')}`).join(' • ')};
  $('#groupsFull').onclick=()=>{if(!currentGroups.length){toast('Generate groups first');return}overlay('','',`<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px">${currentGroups.map((g,i)=>`<div style="background:white;color:#17202a;border-radius:18px;padding:18px"><div style="font-weight:950;color:#0f766e;font-size:22px">Group ${i+1}</div><div style="font-size:20px;line-height:1.7;margin-top:8px">${g.map(escapeHtml).join('<br>')}</div></div>`).join('')}</div>`)};

  function renderRewardModal(){
    const c=selectedClass(),body=$('#rewardPersonalBody');if(!c){body.innerHTML='<p class="help">Select a class first to award pupil points.</p>';return}
    data.pupilPoints[currentClassName()] ||= {};
    body.innerHTML=`<div class="option-row" style="margin-bottom:14px">${['Team 1','Team 2','Team 3','Team 4'].map(t=>`<button class="chip teamReward" data-team="${t}">${t} +1</button>`).join('')}</div><div class="grid">${c.names.map(n=>`<button class="counter pupilReward" data-pupil="${escapeHtml(n)}">${escapeHtml(n)} <b>${data.pupilPoints[currentClassName()][n]||0}</b></button>`).join('')}</div>`;
    $$('.pupilReward',body).forEach(b=>b.onclick=()=>{const n=b.dataset.pupil;data.pupilPoints[currentClassName()][n]=(data.pupilPoints[currentClassName()][n]||0)+1;$('b',b).textContent=data.pupilPoints[currentClassName()][n];saveData();beep(780,.08,.04);toast(`+1 ${selectedRewardReason} — ${n}`)});
    $$('.teamReward',body).forEach(b=>b.onclick=()=>{data.teamPoints[currentClassName()] ||= {};const t=b.dataset.team;data.teamPoints[currentClassName()][t]=(data.teamPoints[currentClassName()][t]||0)+1;saveData();toast(`+1 ${selectedRewardReason} — ${t}`)});
  }

  const weekdays=['Monday','Tuesday','Wednesday','Thursday','Friday'];
  function classSchedule(){const c=currentClassName()||'_general';data.timetables[c] ||= Object.fromEntries(weekdays.map(d=>[d,[]]));return data.timetables[c]}
  function renderTimetableEditor(){
    $('#dayTabs').innerHTML=weekdays.map(d=>`<button class="tab ${d===activeTimetableDay?'active':''}" data-day="${d}">${d}</button>`).join('');
    $$('#dayTabs .tab').forEach(b=>b.onclick=()=>{activeTimetableDay=b.dataset.day;renderTimetableEditor()});
    const rows=classSchedule()[activeTimetableDay]||[];
    $('#scheduleEditor').innerHTML=rows.map((r,i)=>scheduleRowHtml(r,i)).join('')||'<p class="help">No activities yet. Add the first activity for this day.</p>';
    bindScheduleRows();
  }
  function scheduleRowHtml(r,i){
    const opts=Object.keys(subjects).map(s=>`<option ${s===r.subject?'selected':''}>${s}</option>`).join('');
    return `<div class="schedule-row" data-i="${i}"><input type="time" class="schTime" value="${r.time||'08:00'}"><select class="schSubject">${opts}</select><input class="schCustom" value="${escapeHtml(r.custom||'')}" placeholder="Optional label"><button class="schDelete">×</button></div>`
  }
  function bindScheduleRows(){$$('.schDelete').forEach(b=>b.onclick=()=>{const i=+b.parentElement.dataset.i;classSchedule()[activeTimetableDay].splice(i,1);saveData();renderTimetableEditor()})}
  $('#addScheduleRow').onclick=()=>{classSchedule()[activeTimetableDay].push({time:'08:00',subject:'Mathematics',custom:''});saveData();renderTimetableEditor()};
  $('#saveTimetable').onclick=()=>{$$('#scheduleEditor .schedule-row').forEach((r,i)=>{classSchedule()[activeTimetableDay][i]={time:$('.schTime',r).value,subject:$('.schSubject',r).value,custom:$('.schCustom',r).value.trim()}});classSchedule()[activeTimetableDay].sort((a,b)=>a.time.localeCompare(b.time));saveData();renderTimetableEditor();updateDailyTimetable();toast('Timetable saved')};
  function openTimetable(){renderTimetableEditor();modal('timetableModal')}
  $('#editTimetable').onclick=openTimetable;$('#editTimetable2').onclick=openTimetable;

  function timetableToday(){
    const d=new Date(),day=d.toLocaleDateString('en-SG',{weekday:'long'});return (classSchedule()[day]||[]).slice().sort((a,b)=>a.time.localeCompare(b.time))
  }
  function updateDailyTimetable(){
    const rows=timetableToday();if(!rows.length){$('#dayNow').textContent='No timetable yet';$('#dayNext').textContent='Set a weekly timetable once.';$('#dayEmoji').textContent='🗓️';$('#dayStrip').innerHTML='';return}
    const now=new Date(),mins=now.getHours()*60+now.getMinutes();let idx=0;
    rows.forEach((r,i)=>{const [h,m]=r.time.split(':').map(Number);if(h*60+m<=mins)idx=i});
    const cur=rows[idx],next=rows[idx+1];const label=cur.custom||cur.subject;$('#dayNow').textContent=label;$('#dayNext').textContent=next?`Next: ${next.custom||next.subject} at ${next.time}`:'Last activity for today';$('#dayEmoji').textContent=subjects[cur.subject]||'⭐';
    $('#dayStrip').innerHTML=rows.slice(idx,idx+4).map((r,i)=>`<div class="subject-card ${i===0?'now':''}"><div class="emoji">${subjects[r.subject]||'⭐'}</div><small>${escapeHtml(r.custom||r.subject)}</small></div>`).join('');
  }
  $('#dayFull').onclick=()=>{const rows=timetableToday();if(!rows.length){toast('Set the weekly timetable first');return}const now=new Date(),mins=now.getHours()*60+now.getMinutes();let idx=0;rows.forEach((r,i)=>{const [h,m]=r.time.split(':').map(Number);if(h*60+m<=mins)idx=i});const cur=rows[idx],next=rows[idx+1],later=rows[idx+2];overlay('','',`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">${[['NOW',cur],['NEXT',next],['LATER',later]].map(([t,r],i)=>`<div style="background:${i===0?'#dff6f1':'white'};color:#17202a;border-radius:24px;padding:28px;min-height:300px;display:grid;place-items:center"><div><div style="font-size:15px;font-weight:950;color:#0f766e;letter-spacing:.14em">${t}</div><div style="font-size:72px;margin:12px">${r?(subjects[r.subject]||'⭐'):'—'}</div><div style="font-size:30px;font-weight:950">${r?escapeHtml(r.custom||r.subject):'—'}</div>${r?`<div style="margin-top:8px;color:#667085;font-weight:800">${r.time}</div>`:''}</div></div>`).join('')}</div>`)};
  $('#weekFull').onclick=()=>{const s=classSchedule();overlay('','',`<div style="background:white;color:#17202a;border-radius:22px;padding:20px;text-align:left"><div style="font-size:30px;font-weight:950;margin-bottom:14px">Our Week</div><div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px">${weekdays.map(d=>`<div><div style="font-weight:950;color:#0f766e;font-size:18px;margin-bottom:8px">${d}</div>${(s[d]||[]).map(r=>`<div style="border:1px solid #d9e2ec;border-radius:12px;padding:8px;margin-bottom:7px"><span style="font-size:22px">${subjects[r.subject]||'⭐'}</span><div style="font-weight:850">${escapeHtml(r.custom||r.subject)}</div><small>${r.time}</small></div>`).join('')||'<div style="color:#98a2b3">—</div>'}</div>`).join('')}</div></div>`)};

  $$('[data-close]').forEach(b=>b.onclick=()=>modal(b.dataset.close,false));
  $$('.modal').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('show')}));
  $('#overlayClose').onclick=()=>$('#overlay').classList.remove('show');
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){$$('.modal.show').forEach(m=>m.classList.remove('show'));$('#overlay').classList.remove('show')}});
