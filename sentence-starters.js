(function(){
'use strict';
const starters=[
  'I think ___ because ___.',
  'One reason is ___.',
  'For example, ___.',
  'I know this because ___.',
  'This means that ___.',
  'I can tell that ___ because ___.',
  'So, ___. '
];
function addStyle(){
  if(document.getElementById('sentenceStarterStyle'))return;
  const s=document.createElement('style');
  s.id='sentenceStarterStyle';
  s.textContent=`
  .starterSlide{max-width:980px;margin:8px auto 0;display:grid;gap:10px;text-align:left}
  .starterRow{display:grid;grid-template-columns:48px 1fr;gap:14px;align-items:center;min-height:64px;padding:10px 18px;border:1px solid #d8e7e4;border-radius:16px;background:linear-gradient(145deg,#fff,#f2faf8);box-shadow:0 4px 14px rgba(15,118,110,.05)}
  .starterNum{width:42px;height:42px;border-radius:13px;display:grid;place-items:center;background:#0f766e;color:#fff;font-weight:1000;font-size:20px}
  .starterText{font-size:clamp(22px,2.6vw,34px);line-height:1.2;font-weight:950;color:#17324d;letter-spacing:-.02em}
  @media(max-width:700px){.starterSlide{gap:8px}.starterRow{grid-template-columns:38px 1fr;padding:9px 12px;min-height:56px}.starterNum{width:36px;height:36px;border-radius:11px;font-size:17px}.starterText{font-size:clamp(19px,5vw,26px)}}
  `;
  document.head.appendChild(s);
}
function render(){
  const S=window.Support;
  if(!S||S.slug!=='question-spinner')return false;
  const panel=S.panel||document.getElementById('panel');
  if(!panel)return false;
  addStyle();
  const icon=document.getElementById('toolIcon'),title=document.getElementById('toolTitle'),hint=document.getElementById('toolHint');
  if(icon)icon.textContent='💬';
  if(title)title.textContent='Sentence Starters';
  if(hint)hint.textContent='Simple ways to start an answer.';
  document.title='Sentence Starters • Classroom Companion';
  panel.innerHTML=`<div class="eyebrow">Answer help</div><div class="hero small" style="font-size:clamp(34px,5vw,62px);margin-bottom:10px">Sentence Starters</div><div class="supportText" style="margin-bottom:18px">Choose a starter to help you begin your answer.</div><div class="starterSlide">${starters.map((x,i)=>`<div class="starterRow"><div class="starterNum">${i+1}</div><div class="starterText">${x}</div></div>`).join('')}</div>`;
  return true;
}
let tries=0;
const id=setInterval(()=>{tries++;if(render()||tries>40)clearInterval(id)},50);
})();