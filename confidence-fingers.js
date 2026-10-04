(function(){
'use strict';
const S=window.Support;
if(!S||S.slug!=='confidence-check'||window.__confidenceFingersV1)return;
window.__confidenceFingersV1=true;

function install(){
  const panel=S.panel||document.getElementById('panel');
  if(!panel)return false;

  if(!document.getElementById('confidenceFingersStyle')){
    const style=document.createElement('style');
    style.id='confidenceFingersStyle';
    style.textContent=`
      .fingerGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;max-width:1000px;margin:24px auto 0}
      .fingerCard{min-height:190px;border:1px solid var(--line);border-radius:25px;background:#fff;padding:18px 12px;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 7px 20px rgba(18,32,46,.05)}
      .fingerNum{width:76px;height:76px;border-radius:50%;display:grid;place-items:center;background:var(--teal2);color:var(--teal);font-size:48px;line-height:1;font-weight:1000;margin-bottom:12px}
      .fingerLabel{font-size:20px;line-height:1.15;font-weight:1000;color:var(--navy)}
      .fingerSub{font-size:13px;line-height:1.3;color:var(--muted);font-weight:800;margin-top:8px}
      .fingerInstruction{font-size:clamp(17px,2vw,25px);line-height:1.4;color:var(--muted);font-weight:850;max-width:900px;margin:0 auto}
      .fingerMax{display:inline-block;margin-top:10px;padding:7px 12px;border-radius:999px;background:var(--teal2);color:var(--teal);font-size:13px;font-weight:1000}
      @media(max-width:760px){.fingerGrid{grid-template-columns:repeat(2,1fr);gap:12px}.fingerCard{min-height:170px;padding:14px 9px}.fingerNum{width:66px;height:66px;font-size:42px}.fingerLabel{font-size:17px}.fingerSub{font-size:12px}}
    `;
    document.head.appendChild(style);
  }

  panel.innerHTML=`
    <div class="eyebrow">How is learning going?</div>
    <div class="hero small">Show 1–4 fingers</div>
    <div class="fingerInstruction">Hold up the number of fingers that matches how you feel.</div>
    <div class="fingerMax">4 fingers maximum</div>
    <div class="fingerGrid">
      <div class="fingerCard"><div class="fingerNum">1</div><div class="fingerLabel">I need help</div><div class="fingerSub">Please support me</div></div>
      <div class="fingerCard"><div class="fingerNum">2</div><div class="fingerLabel">I’m getting there</div><div class="fingerSub">I need more practice</div></div>
      <div class="fingerCard"><div class="fingerNum">3</div><div class="fingerLabel">I can do it</div><div class="fingerSub">I can try independently</div></div>
      <div class="fingerCard"><div class="fingerNum">4</div><div class="fingerLabel">I can explain it</div><div class="fingerSub">I can help someone else</div></div>
    </div>`;
  return true;
}

let tries=0;
const id=setInterval(()=>{tries++;if(install()||tries>80)clearInterval(id)},50);
})();
