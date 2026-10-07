(function(){
'use strict';
if(window.__ccEditableContentSettingsV1)return;
window.__ccEditableContentSettingsV1=true;

const DEFAULTS={
  sentence:[
    'I think ___ because ___.',
    'One reason is ___.',
    'For example, ___.',
    'I know this because ___.',
    'This means that ___.',
    'I can tell that ___ because ___.',
    'So, ___.'
  ],
  reflection:[
    'What did you learn?',
    'What was difficult?',
    'What helped you?',
    'What are you more confident about now?',
    'What strategy worked for you?',
    'What will you try next time?'
  ],
  quote:[
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
  ],
  brain:[
    {motion:'march',title:'March & Move',text:'March quietly on the spot.'},
    {motion:'stretch',title:'Reach for the Sky',text:'Reach both arms high, then relax. Keep moving!'},
    {motion:'balance',title:'Balance Challenge',text:'Balance on one foot. Switch halfway through.'},
    {motion:'roll',title:'Shoulder Roll',text:'Roll your shoulders slowly and loosen up.'},
    {motion:'jump',title:'Star Jump Energy',text:'Do gentle star jumps with plenty of space.'},
    {motion:'shake',title:'Shake It Out',text:'Shake your hands and arms, then your legs.'},
    {motion:'figure8',title:'Figure 8',text:'Trace a giant figure 8 in the air.'},
    {motion:'toes',title:'Touch Your Toes',text:'Reach down toward your toes, then stand tall.'}
  ]
};

const LABELS={
  en:{settings:'Settings',edit:'Edit content',add:'Add item',save:'Save',cancel:'Cancel',reset:'Reset defaults',remove:'Remove',activity:'Activity name',instruction:'Instruction',empty:'Keep at least one item.'},
  zh:{settings:'设置',edit:'编辑内容',add:'添加一项',save:'保存',cancel:'取消',reset:'恢复默认',remove:'删除',activity:'活动名称',instruction:'指示',empty:'请至少保留一项。'},
  ms:{settings:'Tetapan',edit:'Edit kandungan',add:'Tambah item',save:'Simpan',cancel:'Batal',reset:'Pulihkan asal',remove:'Buang',activity:'Nama aktiviti',instruction:'Arahan',empty:'Simpan sekurang-kurangnya satu item.'},
  ta:{settings:'அமைப்புகள்',edit:'உள்ளடக்கத்தைத் திருத்து',add:'உருப்படி சேர்',save:'சேமி',cancel:'ரத்து',reset:'இயல்புநிலைக்கு மீட்டமை',remove:'நீக்கு',activity:'செயல்பாட்டு பெயர்',instruction:'வழிமுறை',empty:'குறைந்தது ஒரு உருப்படியை வைத்திருக்கவும்.'}
};

function edition(){
  let p=location.pathname;
  try{p=(window.top&&window.top.location&&window.top.location.pathname)||p}catch(e){}
  if(/Chinese-Edition/i.test(p))return 'zh';
  if(/Malay-Edition/i.test(p))return 'ms';
  if(/Tamil-Edition/i.test(p))return 'ta';
  return 'en';
}
const ED=edition(),L=LABELS[ED]||LABELS.en;
function key(type){return 'classroomCompanionEditableContentV1:'+ED+':'+type}
function clone(v){return JSON.parse(JSON.stringify(v))}
function load(type){
  try{const v=JSON.parse(localStorage.getItem(key(type)));if(Array.isArray(v)&&v.length)return v}catch(e){}
  return clone(DEFAULTS[type]);
}
function hasSaved(type){try{return !!localStorage.getItem(key(type))}catch(e){return false}}
function save(type,v){try{localStorage.setItem(key(type),JSON.stringify(v))}catch(e){}}
function reset(type){try{localStorage.removeItem(key(type))}catch(e){}}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

function addBaseStyle(){
  if(document.getElementById('ccEditContentStyle'))return;
  const s=document.createElement('style');s.id='ccEditContentStyle';s.textContent=`
  .ccEditGear{min-width:40px;min-height:40px;border:1px solid #cbd8df;border-radius:12px;background:rgba(255,255,255,.96);color:#17324d;font:900 18px/1 system-ui;display:grid;place-items:center;cursor:pointer;box-shadow:0 4px 14px rgba(18,32,46,.10);z-index:2147483646}
  .ccEditGear:hover{background:#eef8f6;border-color:#79c8bc}
  .ccEditGear.ccFixed{position:fixed;left:12px;top:12px}
  .ccEditOverlay{position:fixed;inset:0;z-index:2147483647;background:rgba(15,32,46,.58);display:grid;place-items:center;padding:18px}
  .ccEditModal{width:min(760px,96vw);max-height:min(760px,92vh);overflow:auto;background:#fff;border-radius:22px;border:1px solid #d7e4e2;box-shadow:0 28px 80px rgba(0,0,0,.25);padding:20px;color:#17324d;font-family:Inter,ui-sans-serif,system-ui,sans-serif}
  .ccEditHead{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.ccEditHead h2{margin:0;font-size:22px}.ccEditX{border:0;background:#f2f5f5;border-radius:10px;width:38px;height:38px;font-size:20px;cursor:pointer}
  .ccEditRows{display:grid;gap:9px}.ccEditRow{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:start}.ccEditPair{display:grid;grid-template-columns:1fr;gap:7px;padding:10px;border:1px solid #dbe5e8;border-radius:14px;background:#fbfdfd}
  .ccEditField{min-height:44px;border:1px solid #cbd8df;border-radius:11px;padding:10px 12px;background:#fff;color:#17324d;font:800 14px/1.35 system-ui;text-align:left;white-space:pre-wrap}.ccEditField:focus{outline:3px solid rgba(15,118,110,.14);border-color:#63bdb2}
  .ccEditRemove{width:40px;height:40px;border:1px solid #efc1bb;border-radius:10px;background:#fff3f1;color:#b42318;font-weight:1000;cursor:pointer}.ccEditLabel{font-size:11px;font-weight:900;color:#667085;margin-bottom:3px;text-align:left}
  .ccEditActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px;justify-content:flex-end}.ccEditBtn{min-height:42px;border:1px solid #cbd8df;border-radius:11px;background:#fff;color:#17324d;padding:8px 13px;font-weight:900;cursor:pointer}.ccEditBtn.primary{background:#0f766e;border-color:#0f766e;color:#fff}.ccEditBtn.danger{background:#fff7ed;color:#9a3412;border-color:#f4c38e}.ccEditMsg{font-size:12px;color:#b42318;font-weight:850;min-height:16px;margin-top:8px;text-align:left}
  `;document.head.appendChild(s);
}

function gear(onClick,fixed=false){
  addBaseStyle();
  if(document.getElementById('ccEditContentGear'))return;
  const b=document.createElement('button');b.id='ccEditContentGear';b.type='button';b.className='ccEditGear'+(fixed?' ccFixed':'');b.textContent='⚙';b.title=L.settings;b.setAttribute('aria-label',L.settings);b.onclick=onClick;
  if(!fixed){const a=document.querySelector('.topActions');if(a)a.insertBefore(b,a.firstChild);else{b.classList.add('ccFixed');document.body.appendChild(b)}}else document.body.appendChild(b);
}

function openListEditor(type,title,onSaved){
  addBaseStyle();
  const overlay=document.createElement('div');overlay.className='ccEditOverlay';
  overlay.innerHTML=`<div class="ccEditModal" role="dialog" aria-modal="true"><div class="ccEditHead"><h2>⚙ ${esc(title||L.edit)}</h2><button class="ccEditX" type="button" aria-label="${esc(L.cancel)}">×</button></div><div class="ccEditRows"></div><div class="ccEditMsg"></div><div class="ccEditActions"><button class="ccEditBtn" data-add type="button">＋ ${esc(L.add)}</button><button class="ccEditBtn danger" data-reset type="button">↺ ${esc(L.reset)}</button><button class="ccEditBtn" data-cancel type="button">${esc(L.cancel)}</button><button class="ccEditBtn primary" data-save type="button">${esc(L.save)}</button></div></div>`;
  document.body.appendChild(overlay);
  const rows=overlay.querySelector('.ccEditRows'),msg=overlay.querySelector('.ccEditMsg');
  function draw(values){rows.innerHTML=values.map(v=>`<div class="ccEditRow"><div class="ccEditField" contenteditable="true" spellcheck="true">${esc(v)}</div><button class="ccEditRemove" type="button" title="${esc(L.remove)}">×</button></div>`).join('');rows.querySelectorAll('.ccEditRemove').forEach(b=>b.onclick=()=>{b.closest('.ccEditRow').remove()})}
  draw(load(type));
  const close=()=>overlay.remove();overlay.querySelector('.ccEditX').onclick=close;overlay.querySelector('[data-cancel]').onclick=close;overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
  overlay.querySelector('[data-add]').onclick=()=>{const r=document.createElement('div');r.className='ccEditRow';r.innerHTML=`<div class="ccEditField" contenteditable="true" spellcheck="true"></div><button class="ccEditRemove" type="button" title="${esc(L.remove)}">×</button>`;r.querySelector('.ccEditRemove').onclick=()=>r.remove();rows.appendChild(r);r.querySelector('.ccEditField').focus()};
  overlay.querySelector('[data-reset]').onclick=()=>{reset(type);draw(clone(DEFAULTS[type]));msg.textContent=''};
  overlay.querySelector('[data-save]').onclick=()=>{const values=[...rows.querySelectorAll('.ccEditField')].map(x=>x.textContent.trim()).filter(Boolean);if(!values.length){msg.textContent=L.empty;return}save(type,values);close();onSaved&&onSaved(values)};
}

function openBrainEditor(onSaved){
  addBaseStyle();
  const overlay=document.createElement('div');overlay.className='ccEditOverlay';
  overlay.innerHTML=`<div class="ccEditModal" role="dialog" aria-modal="true"><div class="ccEditHead"><h2>⚙ ${esc(L.edit)}</h2><button class="ccEditX" type="button">×</button></div><div class="ccEditRows"></div><div class="ccEditActions"><button class="ccEditBtn danger" data-reset type="button">↺ ${esc(L.reset)}</button><button class="ccEditBtn" data-cancel type="button">${esc(L.cancel)}</button><button class="ccEditBtn primary" data-save type="button">${esc(L.save)}</button></div></div>`;
  document.body.appendChild(overlay);const rows=overlay.querySelector('.ccEditRows');
  function draw(values){rows.innerHTML=values.map((v,i)=>`<div class="ccEditPair" data-motion="${esc(v.motion||DEFAULTS.brain[i].motion)}"><div><div class="ccEditLabel">${esc(L.activity)}</div><div class="ccEditField" data-title contenteditable="true" spellcheck="true">${esc(v.title)}</div></div><div><div class="ccEditLabel">${esc(L.instruction)}</div><div class="ccEditField" data-text contenteditable="true" spellcheck="true">${esc(v.text)}</div></div></div>`).join('')}
  draw(load('brain'));
  const close=()=>overlay.remove();overlay.querySelector('.ccEditX').onclick=close;overlay.querySelector('[data-cancel]').onclick=close;overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
  overlay.querySelector('[data-reset]').onclick=()=>{reset('brain');draw(clone(DEFAULTS.brain))};
  overlay.querySelector('[data-save]').onclick=()=>{const values=[...rows.querySelectorAll('.ccEditPair')].map((r,i)=>({motion:r.dataset.motion||DEFAULTS.brain[i].motion,title:r.querySelector('[data-title]').textContent.trim()||DEFAULTS.brain[i].title,text:r.querySelector('[data-text]').textContent.trim()||DEFAULTS.brain[i].text}));save('brain',values);close();onSaved&&onSaved(values)};
}

function installSentence(){
  const S=window.Support;if(!S||S.slug!=='question-spinner')return false;
  const box=document.querySelector('.starterSlide');if(!box)return false;
  const apply=(values)=>{box.innerHTML=values.map((x,i)=>`<div class="starterRow"><div class="starterNum">${i+1}</div><div class="starterText">${esc(x)}</div></div>`).join('')};
  if(hasSaved('sentence'))apply(load('sentence'));
  gear(()=>openListEditor('sentence','Sentence Starters',apply));return true;
}

function installReflection(){
  const S=window.Support;if(!S||S.slug!=='reflect')return false;
  const prompt=document.getElementById('prompt'),old=document.getElementById('next');if(!prompt||!old)return false;
  let values=load('reflection'),i=0;
  if(hasSaved('reflection'))prompt.textContent=values[0];
  function wire(){const cur=document.getElementById('next');if(!cur||cur.dataset.ccEditableWired)return;const b=cur.cloneNode(true);b.dataset.ccEditableWired='1';cur.replaceWith(b);b.onclick=()=>{values=load('reflection');if(values.length===1){i=0}else{i=(i+1+Math.floor(Math.random()*(values.length-1)))%values.length}prompt.textContent=values[i]}}
  wire();gear(()=>openListEditor('reflection','Reflection Prompts',v=>{values=v;i=0;prompt.textContent=values[0]}));return true;
}

function installQuote(){
  const q=document.getElementById('quoteText'),old=document.getElementById('another');if(!q||!old)return false;
  let values=load('quote');
  function daily(){const d=new Date(),day=Math.floor(new Date(d.getFullYear(),d.getMonth(),d.getDate())/86400000);return ((day%values.length)+values.length)%values.length}
  let i=daily();if(hasSaved('quote'))q.textContent=values[i];
  const b=old.cloneNode(true);old.replaceWith(b);b.onclick=()=>{values=load('quote');if(values.length===1)i=0;else{let n=i;while(n===i)n=Math.floor(Math.random()*values.length);i=n}q.textContent=values[i];try{window.speak&&window.speak()}catch(e){}};
  gear(()=>openListEditor('quote','Motivation Quotes',v=>{values=v;i=daily();q.textContent=values[i]}),true);return true;
}

function currentBrainMotion(){const kid=document.getElementById('kid');if(!kid)return '';return DEFAULTS.brain.map(x=>x.motion).find(m=>kid.classList.contains(m))||''}
function applyBrain(values){const motion=currentBrainMotion();if(!motion)return;const a=values.find(x=>x.motion===motion);if(!a)return;const t=document.getElementById('breakTitle'),ins=document.getElementById('instruction');if(t)t.textContent=a.title;if(ins)ins.textContent=a.text}
function installBrain(){
  const kid=document.getElementById('kid'),t=document.getElementById('breakTitle'),ins=document.getElementById('instruction');if(!kid||!t||!ins)return false;
  if(hasSaved('brain'))applyBrain(load('brain'));
  const mo=new MutationObserver(()=>{if(hasSaved('brain'))applyBrain(load('brain'))});mo.observe(kid,{attributes:true,attributeFilter:['class']});
  gear(()=>openBrainEditor(v=>applyBrain(v)),true);return true;
}

function boot(){
  const S=window.Support;
  if(S&&S.slug==='question-spinner')return installSentence();
  if(S&&S.slug==='reflect')return installReflection();
  if(document.getElementById('quoteText'))return installQuote();
  if(document.getElementById('breakTitle'))return installBrain();
  return false;
}
let tries=0;const timer=setInterval(()=>{tries++;if(boot()||tries>120)clearInterval(timer)},75);
})();
