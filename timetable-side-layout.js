(function(){
'use strict';
const S=window.Support;
if(!S||S.slug!=='daily-visual-timetable'||window.__ttSideLayout)return;
window.__ttSideLayout=true;
const $=s=>document.querySelector(s);
function injectStyles(){
  if($('#ttSideLayoutStyle'))return;
  const s=document.createElement('style');
  s.id='ttSideLayoutStyle';
  s.textContent=`
  .stage{max-width:1600px}
  .panel{width:min(1540px,100%)}
  .ttHomeSplit{display:grid;grid-template-columns:minmax(400px,.9fr) minmax(520px,1.1fr);gap:28px;align-items:start;margin:18px auto 0;max-width:1460px;text-align:left}
  .ttHomeLeft,.ttHomeRight{min-width:0}
  .ttHomeLeft .ttShotGuide{max-width:none;margin:0 0 14px}
  .ttHomeLeft .ttPasteZone{max-width:none;margin:0;padding:24px 20px}
  .ttHomeLeft .ttPasteIcon{font-size:46px;text-align:center}
  .ttHomeLeft .ttPasteTitle{text-align:center;font-size:24px}
  .ttHomeLeft .ttPasteHint{text-align:center}
  .ttHomeLeft .controls{gap:8px}
  .ttHomeLeft .controls .btn{flex:1 1 180px}
  .ttHomeRight{background:#fbfdfd;border:1px solid #dbe6e8;border-radius:24px;padding:18px 18px 20px;box-shadow:0 8px 24px rgba(18,32,46,.055)}
  .ttHomeRight .ttDays{justify-content:flex-start;margin:0 0 12px;gap:7px}
  .ttHomeRight .ttDays .btn{min-width:58px;padding:8px 10px}
  .ttHomeRight .hero.small{text-align:left;margin:4px 0 14px!important;font-size:34px!important}
  .ttHomeRight .ttToday{display:flex!important;flex-direction:column;gap:8px;max-width:none!important;margin:0!important}
  .ttHomeRight .ttLesson{display:grid;grid-template-columns:92px minmax(0,1fr);align-items:stretch;min-height:56px;padding:0!important;border-radius:16px!important;overflow:hidden;text-align:left!important}
  .ttHomeRight .ttTime{display:flex;align-items:center;justify-content:center;padding:10px 8px;background:rgba(255,255,255,.62);border-right:1px solid rgba(23,50,77,.10);font-size:15px!important;color:#41566d!important;font-variant-numeric:tabular-nums}
  .ttHomeRight .ttName{display:flex;align-items:center;margin:0!important;padding:10px 14px;font-size:20px!important;line-height:1.1}
  .ttHomeRight .emptyState{margin:8px 0!important}
  @media(max-width:1050px){
    .ttHomeSplit{grid-template-columns:1fr;gap:18px}
    .ttHomeRight{order:2}
    .ttHomeLeft{order:1}
  }
  @media(max-width:620px){
    .ttHomeRight{padding:14px}
    .ttHomeRight .ttDays{justify-content:center}
    .ttHomeRight .hero.small{text-align:center}
    .ttHomeRight .ttLesson{grid-template-columns:76px minmax(0,1fr);min-height:52px}
    .ttHomeRight .ttTime{font-size:13px!important}
    .ttHomeRight .ttName{font-size:17px!important;padding:9px 11px}
  }
  `;
  document.head.appendChild(s);
}
function applyLayout(){
  const zone=$('#pasteZone'),today=$('#todayBox');
  if(!zone||!today||today.closest('.ttHomeSplit'))return;
  const panel=S.panel,guide=panel.querySelector('.ttShotGuide'),file=panel.querySelector('#imageFile');
  const split=document.createElement('div');split.className='ttHomeSplit';
  const left=document.createElement('div');left.className='ttHomeLeft';
  const right=document.createElement('div');right.className='ttHomeRight';
  const anchor=guide||zone;anchor.parentNode.insertBefore(split,anchor);
  split.append(left,right);
  if(guide)left.appendChild(guide);
  left.appendChild(zone);
  if(file)left.appendChild(file);
  right.appendChild(today);
}
injectStyles();
applyLayout();
setInterval(applyLayout,500);
})();