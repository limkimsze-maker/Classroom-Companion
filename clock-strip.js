(function(){
'use strict';
window.__clockStripReady=true;
let clockTimer=null,current={format:'24',seconds:false,date:true};
function ensureClockOverlay(){
  let o=document.getElementById('ccClockOverlay');
  if(o)return o;
  o=document.createElement('div');
  o.id='ccClockOverlay';
  o.innerHTML=`<style>
  #ccClockOverlay{position:fixed;inset:0;z-index:2147483647;background:radial-gradient(circle at 50% 20%,#184c68 0,#0f2c43 43%,#081925 100%);color:#fff;display:none;align-items:center;justify-content:center;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif}
  #ccClockOverlay.show{display:flex}
  #ccClockOverlay .clockWrap{text-align:center;width:min(1200px,94vw);padding:5vh 3vw}
  #ccClockOverlay .clockTime{font-size:clamp(110px,24vw,330px);font-weight:1000;line-height:.9;letter-spacing:-.07em;font-variant-numeric:tabular-nums;text-shadow:0 12px 50px rgba(0,0,0,.28)}
  #ccClockOverlay .clockDate{font-size:clamp(28px,4.7vw,68px);font-weight:850;margin-top:4vh;color:#dff6f1}
  #ccClockOverlay .clockHint{font-size:clamp(15px,1.7vw,23px);font-weight:750;margin-top:2.5vh;color:#9fc7d8}
  #ccClockOverlay .clockControls{position:absolute;top:18px;right:18px;display:flex;gap:8px;opacity:.16;transition:.2s}
  #ccClockOverlay:hover .clockControls,#ccClockOverlay.controls .clockControls{opacity:1}
  #ccClockOverlay button{border:1px solid rgba(255,255,255,.35);background:rgba(255,255,255,.12);color:#fff;border-radius:14px;padding:10px 14px;font:inherit;font-weight:900;cursor:pointer;backdrop-filter:blur(8px)}
  @media(max-width:700px){#ccClockOverlay .clockTime{font-size:clamp(78px,27vw,170px)}#ccClockOverlay .clockDate{font-size:clamp(22px,6vw,38px)}#ccClockOverlay .clockControls{opacity:1}}
  </style><div class="clockWrap"><div class="clockTime" id="ccClockTime">--:--</div><div class="clockDate" id="ccClockDate"></div><div class="clockHint">Classroom Clock</div></div><div class="clockControls"><button type="button" id="ccClockMode">24h</button><button type="button" id="ccClockSeconds">Seconds</button><button type="button" id="ccClockClose">✕ Close</button></div>`;
  document.body.appendChild(o);
  o.addEventListener('pointerdown',e=>{if(!e.target.closest('button'))o.classList.toggle('controls')});
  o.querySelector('#ccClockClose').onclick=closeClock;
  o.querySelector('#ccClockMode').onclick=()=>{current.format=current.format==='24'?'12':'24';renderClock()};
  o.querySelector('#ccClockSeconds').onclick=()=>{current.seconds=!current.seconds;renderClock()};
  return o;
}
function renderClock(){
  const o=ensureClockOverlay(),d=new Date(),hour12=current.format==='12';
  o.querySelector('#ccClockTime').textContent=d.toLocaleTimeString('en-SG',{hour:'2-digit',minute:'2-digit',second:current.seconds?'2-digit':undefined,hour12});
  const date=o.querySelector('#ccClockDate');date.textContent=current.date?d.toLocaleDateString('en-SG',{weekday:'long',day:'numeric',month:'long',year:'numeric'}):'';date.style.display=current.date?'':'none';
  o.querySelector('#ccClockMode').textContent=hour12?'12h':'24h';
  o.querySelector('#ccClockSeconds').textContent=current.seconds?'Hide seconds':'Seconds';
}
async function enterFullscreen(){
  const el=document.documentElement;
  try{
    if(document.fullscreenElement)return;
    if(el.requestFullscreen)await el.requestFullscreen();
    else if(el.webkitRequestFullscreen)el.webkitRequestFullscreen();
  }catch(e){}
}
async function openClock(opts={}){
  current={format:opts.format||'24',seconds:!!opts.seconds,date:opts.date!==false};
  const o=ensureClockOverlay();o.classList.add('show');renderClock();clearInterval(clockTimer);clockTimer=setInterval(renderClock,250);await enterFullscreen();
}
function closeClock(){
  clearInterval(clockTimer);clockTimer=null;const o=document.getElementById('ccClockOverlay');if(o)o.classList.remove('show');
  try{if(document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen();else if(document.webkitFullscreenElement&&document.webkitExitFullscreen)document.webkitExitFullscreen()}catch(e){}
}
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement){const o=document.getElementById('ccClockOverlay');if(o&&o.classList.contains('show')){clearInterval(clockTimer);clockTimer=null;o.classList.remove('show')}}});
const oldInstant=window.instantTool;
window.instantTool=function(t){if(t&&t.slug==='full-screen-clock'){openClock();return}return oldInstant&&oldInstant(t)};
const oldOptions=window.toolOptions;
window.toolOptions=function(t){
  if(!t||t.slug!=='full-screen-clock')return oldOptions&&oldOptions(t);
  showQuick('Full-Screen Clock',[
    {label:'🕘 24-hour + Date',primary:true,action:()=>{closeQuick();openClock({format:'24',date:true})}},
    {label:'🕘 12-hour + Date',action:()=>{closeQuick();openClock({format:'12',date:true})}},
    {label:'⏱ 24-hour + Seconds',action:()=>{closeQuick();openClock({format:'24',seconds:true,date:true})}},
    {label:'◻ Clock Only',action:()=>{closeQuick();openClock({format:'24',date:false})}}
  ]);
};
const oldStop=window.universalStop;
window.universalStop=function(){closeClock();return oldStop&&oldStop()};
})();