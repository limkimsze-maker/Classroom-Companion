(function(){
'use strict';
const S=window.Support;
if(!S||S.slug!=='pick-a-pupil')return;
const STORE='classroomCompanionPickFairnessV2';
const PALETTE=['#ef4444','#f97316','#eab308','#22c55e','#14b8a6','#3b82f6','#8b5cf6','#ec4899'];
const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
let busy=false,observer=null;

function safe(raw,fallback){try{return JSON.parse(raw)||fallback}catch(e){return fallback}}
function allState(){return safe(localStorage.getItem(STORE),{})||{}}
function classKey(){return S.selectedClass()||'General'}
function uniquePool(){
 const seen=new Set(),out=[];
 for(const r of S.masterRows()){
   const n=String(r?.pupil||'').trim(),k=n.toLowerCase();
   if(n&&!seen.has(k)){seen.add(k);out.push(n)}
 }
 return out;
}
function shuffle(a){
 const x=[...a];
 for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]]}
 return x;
}
function freshQueue(pool,last=''){
 const q=shuffle(pool);
 if(q.length>1&&last&&q[0].toLowerCase()===String(last).toLowerCase()){
   const j=1+Math.floor(Math.random()*(q.length-1));[q[0],q[j]]=[q[j],q[0]];
 }
 return q;
}
function loadState(pool){
 const all=allState(),key=classKey(),saved=all[key]||{};
 const currentMap=new Map(pool.map(n=>[n.toLowerCase(),n]));
 let remaining=Array.isArray(saved.remaining)?saved.remaining.map(n=>currentMap.get(String(n).toLowerCase())).filter(Boolean):[];
 const queued=new Set(remaining.map(n=>n.toLowerCase()));
 const oldMembers=new Set((saved.members||[]).map(n=>String(n).toLowerCase()));
 const added=pool.filter(n=>!oldMembers.has(n.toLowerCase())&&!queued.has(n.toLowerCase()));
 if(added.length)remaining.push(...shuffle(added));
 if(!saved.members||!Array.isArray(saved.remaining))remaining=freshQueue(pool,saved.lastSelected||'');
 return {members:[...pool],remaining,lastSelected:saved.lastSelected||''};
}
function saveState(st){const all=allState();all[classKey()]=st;localStorage.setItem(STORE,JSON.stringify(all))}
function ensureQueue(st,pool){
 if(st.remaining.length)return st;
 st.remaining=freshQueue(pool,st.lastSelected);
 st.members=[...pool];
 saveState(st);
 return st;
}
function injectStyle(){
 if(document.getElementById('pickSpinnerStyle'))return;
 const style=document.createElement('style');style.id='pickSpinnerStyle';style.textContent=`
 #pickSpinnerCard{position:relative;overflow:hidden;border:3px solid var(--pick-accent,#14b8a6)!important;background:linear-gradient(135deg,#fff7ed 0%,#ecfeff 32%,#eef2ff 66%,#fdf2f8 100%)!important;background-size:240% 240%!important;box-shadow:0 18px 48px color-mix(in srgb,var(--pick-accent,#14b8a6) 23%,transparent)!important;transition:border-color .12s ease,box-shadow .12s ease,transform .12s ease}
 #pickSpinnerCard.spinning{animation:pickRainbow .9s linear infinite;transform:scale(1.018)}
 #pickSpinnerCard.winner{animation:pickWinner .46s ease-out 1;box-shadow:0 0 0 10px color-mix(in srgb,var(--pick-accent,#14b8a6) 18%,transparent),0 24px 60px rgba(18,32,46,.16)!important}
 #pickName{color:var(--pick-accent,#17324d)!important;text-shadow:0 2px 0 rgba(255,255,255,.9);transition:color .08s linear,transform .08s linear}
 #pickSpinnerCard.spinning #pickName{transform:scale(1.045)}
 .pickDots{font-size:18px;letter-spacing:7px;font-weight:1000;margin:4px auto 12px;white-space:nowrap}
 @keyframes pickRainbow{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
 @keyframes pickWinner{0%{transform:scale(.96)}60%{transform:scale(1.035)}100%{transform:scale(1)}}
 @media(prefers-reduced-motion:reduce){#pickSpinnerCard.spinning,#pickSpinnerCard.winner{animation:none!important;transform:none!important}}
 `;document.head.appendChild(style);
}
function clickSound(step){const notes=[420,500,580,660,740];S.tone(notes[step%notes.length],.035,.026,'square')}
function setAccent(card,name,step){
 const c=PALETTE[step%PALETTE.length];card.style.setProperty('--pick-accent',c);
 const dots=document.getElementById('pickDots');if(dots)dots.style.color=c;
 const el=document.getElementById('pickName');if(el)el.textContent=name;
}
function setMeta(text){const meta=document.getElementById('pickMeta');if(meta)meta.textContent=text}
function spinTo(target,pool,done){
 const card=document.getElementById('pickSpinnerCard'),nameEl=document.getElementById('pickName');
 if(!card||!nameEl){done();return}
 card.classList.remove('winner');card.classList.add('spinning');setMeta('Spinning…');
 const frames=reduced?5:28;let step=0,last='';
 function frame(){
   step++;
   let shown=target;
   if(step<frames){
     const choices=pool.filter(n=>n!==last);
     shown=choices[Math.floor(Math.random()*choices.length)]||target;
   }
   last=shown;setAccent(card,shown,step);clickSound(step);
   if(step>=frames){
     setAccent(card,target,step+2);card.classList.remove('spinning');card.classList.add('winner');setMeta('Selected!');S.chime();done();return;
   }
   const p=step/frames,delay=reduced?45:Math.round(42+178*Math.pow(p,2.45));
   setTimeout(frame,delay);
 }
 frame();
}
function enhance(){
 const pick=document.getElementById('pick'),reset=document.getElementById('resetPick'),name=document.getElementById('pickName');
 if(!pick||!reset||!name||pick.dataset.fairEnhanced==='1')return;
 injectStyle();pick.dataset.fairEnhanced='1';
 const card=name.closest('.resultCard');if(card)card.id='pickSpinnerCard';
 if(card&&!card.querySelector('.pickDots')){
   const dots=document.createElement('div');dots.className='pickDots';dots.id='pickDots';dots.textContent='● ● ● ● ●';card.appendChild(dots);
 }
 document.getElementById('pickFair')?.remove();
 const eyebrow=document.querySelector('#panel .eyebrow');if(eyebrow)eyebrow.textContent='Name spinner';
 const help=card?.nextElementSibling;if(help?.classList.contains('supportText'))help.textContent='Spin the names and see who it lands on.';
 const toolHint=document.getElementById('toolHint');if(toolHint)toolHint.textContent='Spin the class list and see who is chosen.';
 setMeta('Ready to spin');
 const pool=uniquePool();let st=loadState(pool);if(pool.length&&!st.remaining.length)st=ensureQueue(st,pool);saveState(st);
 if(st.lastSelected)name.textContent=st.lastSelected;
 pick.textContent='🎡 Spin a pupil';
 reset.textContent='↺ Clear display';
 pick.onclick=()=>{
   if(busy)return;
   const currentPool=uniquePool();if(!currentPool.length){S.toast('Add pupils first');return}
   st=ensureQueue(loadState(currentPool),currentPool);
   const target=st.remaining[0];if(!target)return;
   busy=true;pick.disabled=true;reset.disabled=true;
   spinTo(target,currentPool,()=>{
     st.remaining=st.remaining.slice(1);st.lastSelected=target;st.members=[...currentPool];saveState(st);
     busy=false;pick.disabled=false;reset.disabled=false;
   });
 };
 reset.onclick=()=>{
   if(busy)return;
   name.textContent='?';setMeta('Ready to spin');if(card)card.classList.remove('winner');
 };
}
function watch(){
 enhance();
 const panel=document.getElementById('panel');if(!panel)return;
 observer=new MutationObserver(()=>{if(!busy)setTimeout(enhance,0)});observer.observe(panel,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch,{once:true});else watch();
})();