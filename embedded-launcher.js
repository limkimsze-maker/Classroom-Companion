(function(){
'use strict';
if(document.getElementById('ccEmbeddedLauncher'))return;
const script=document.currentScript;
const current=(script?.dataset?.currentTool||'').trim();
const tools=[
['⏱️','Timer + Calm Music'],['🧭','Lesson Stages'],['⏳','Transition Countdown'],['👀','Attention Signal'],['🎯','Focus Intervals'],['🤸','Movement Break'],['🌿','Calm / Reset'],['🕘','Full-Screen Clock'],['📅','Date & Day'],
['🔊','Noise Level'],['🚦','Class Traffic Light'],['🧩','Work Mode'],['💬','Think–Pair–Share'],['🖊️','Mini-Whiteboard Routine'],['✅','Behaviour Expectations'],['🛎️','Pre-Correction'],['🆘','Help Before Teacher'],['🚀','Early Finisher'],['🧠','Brain Break'],
['❓','Question Spinner'],['🅰️','Answer Check'],['📈','Confidence Check'],['🙋','Participation Counter'],['📊','Engagement Snapshot'],['🧠','KWL Chart'],['💭','Reflect'],['🖐️','End-of-Lesson Self-Check'],
['✨','Quote of the Day'],['🏁','Whole-Class Goal'],['⭐','Rewards'],['🎵','Soundboard'],['📝','Observation Counter'],['🪟','Screen Shade'],['🔢','Random Number'],['🎲','Dice'],['🪙','Coin Toss'],['🧭','Action Spinner'],['🎯','Pick a Pupil'],['👥','Make Groups'],['🗓️','Daily Visual Timetable'],['📆','Weekly Visual Timetable']
].map(([icon,title])=>({icon,title,slug:String(title).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}));

const style=document.createElement('style');
style.textContent=`
#ccEmbeddedLauncher{position:fixed;left:12px;top:12px;z-index:2147483647;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
#ccEmbeddedButton{width:52px;height:52px;border:2px solid rgba(255,255,255,.72);border-radius:15px;background:#0f766e;color:#fff;display:grid;place-items:center;font:1000 23px/1 inherit;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.24);backdrop-filter:blur(10px)}
#ccEmbeddedButton.active{background:#fff;color:#0f766e;border-color:#0f766e}
#ccEmbeddedMenu{position:absolute;left:0;top:60px;width:min(360px,calc(100vw - 24px));max-height:min(620px,calc(100vh - 84px));display:none;flex-direction:column;background:rgba(255,255,255,.98);border:1px solid #b8d8d3;border-radius:15px;box-shadow:0 18px 46px rgba(0,0,0,.28);overflow:hidden;color:#17202a}
#ccEmbeddedMenu.show{display:flex}
.ccEmbeddedHead{display:flex;align-items:center;gap:8px;padding:10px 11px;border-bottom:1px solid #e1e8ec;flex:0 0 auto}.ccEmbeddedTitle{font-size:13px;font-weight:1000;flex:1}.ccEmbeddedClose{width:30px;height:30px;border:0;border-radius:8px;background:#eef2f5;font-weight:1000;cursor:pointer}
#ccEmbeddedList{overflow:auto;padding:7px;display:flex;flex-direction:column;gap:4px}.ccEmbeddedTool{min-height:38px;border:1px solid #d8e1e8;border-radius:9px;background:#fff;padding:7px 9px;text-align:left;font:900 12px/1.2 inherit;color:#17202a;cursor:pointer}.ccEmbeddedTool:hover,.ccEmbeddedTool:focus-visible{background:#f0faf8;border-color:#83cfc4;outline:none}.ccEmbeddedTool.current{background:#dff6f1;border-color:#83cfc4;color:#0b5b55}
@media(max-width:700px){#ccEmbeddedLauncher{left:8px;top:8px}#ccEmbeddedButton{width:48px;height:48px}#ccEmbeddedMenu{top:56px;width:min(330px,calc(100vw - 16px));max-height:calc(100vh - 72px)}}
`;
document.head.appendChild(style);

const root=document.createElement('div');root.id='ccEmbeddedLauncher';
root.innerHTML=`<button id="ccEmbeddedButton" type="button" aria-label="Open classroom tools" title="Classroom tools">✦</button><div id="ccEmbeddedMenu" role="menu"><div class="ccEmbeddedHead"><div class="ccEmbeddedTitle">All Tools</div><button class="ccEmbeddedClose" type="button" aria-label="Close tools">×</button></div><div id="ccEmbeddedList"></div></div>`;
document.body.appendChild(root);
const btn=root.querySelector('#ccEmbeddedButton'),menu=root.querySelector('#ccEmbeddedMenu'),list=root.querySelector('#ccEmbeddedList');

function toolWindowName(slug){return 'ClassroomCompanionTool_'+slug.replace(/[^a-z0-9]/gi,'_')}
function closeMenu(){menu.classList.remove('show');btn.classList.remove('active')}
function openMenu(){menu.classList.add('show');btn.classList.add('active')}
function openTool(t){
  if(t.slug===current){closeMenu();return}
  const sw=screen.availWidth||1280,sh=screen.availHeight||800;
  const left=Math.max(90,Math.min(sw-480,170+Math.floor(Math.random()*100)));
  const top=Math.max(20,Math.min(sh-560,40+Math.floor(Math.random()*80)));
  const url='tool-window.html?tool='+encodeURIComponent(t.slug)+'&v=20261003toolwin4';
  const w=window.open(url,toolWindowName(t.slug),`popup=yes,width=480,height=560,left=${left},top=${top},resizable=yes,scrollbars=yes,toolbar=no,location=no,menubar=no,status=no`);
  if(w){try{w.focus()}catch(e){};closeMenu()}
}
for(const t of tools){
  const b=document.createElement('button');b.type='button';b.className='ccEmbeddedTool'+(t.slug===current?' current':'');
  b.textContent=(t.slug===current?'✓ ':'')+t.icon+' '+t.title;
  b.onclick=e=>{e.stopPropagation();openTool(t)};
  list.appendChild(b);
}
btn.onclick=e=>{e.stopPropagation();menu.classList.contains('show')?closeMenu():openMenu()};
root.querySelector('.ccEmbeddedClose').onclick=e=>{e.stopPropagation();closeMenu()};
menu.onclick=e=>e.stopPropagation();
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.classList.contains('show')){e.stopPropagation();closeMenu()}},true);
})();