(function(){
'use strict';
const S=window.Support;
if(!S||S.slug!=='confidence-check'||window.__confidenceFingersV2)return;
window.__confidenceFingersV2=true;

function hand(n){
  return `<div class="drawnHand" aria-label="${n} ${n===1?'finger':'fingers'}">
    <div class="raisedFingers">${Array.from({length:n},(_,i)=>`<span class="raisedFinger f${i+1}"></span>`).join('')}</div>
    <div class="handPalm"></div>
  </div>`;
}

function install(){
  const panel=S.panel||document.getElementById('panel');
  if(!panel)return false;

  if(!document.getElementById('confidenceFingersStyleV2')){
    const style=document.createElement('style');
    style.id='confidenceFingersStyleV2';
    style.textContent=`
      .fingerGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;max-width:1000px;margin:24px auto 0}
      .fingerCard{min-height:210px;border:1px solid var(--line);border-radius:25px;background:#fff;padding:18px 12px;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 7px 20px rgba(18,32,46,.05)}
      .fingerVisuals{display:flex;align-items:flex-end;justify-content:center;gap:14px;min-height:92px;margin-bottom:10px}
      .confidencePic{font-size:58px;line-height:1;display:block;filter:drop-shadow(0 3px 3px rgba(23,50,77,.08))}
      .drawnHand{width:66px;height:88px;position:relative;display:flex;flex-direction:column;justify-content:flex-end;align-items:center}
      .raisedFingers{height:56px;display:flex;align-items:flex-end;justify-content:center;gap:3px;position:relative;z-index:2;margin-bottom:-6px}
      .raisedFinger{display:block;width:11px;background:#ffd7b5;border:2px solid #17324d;border-radius:9px 9px 5px 5px;box-sizing:border-box}
      .raisedFinger.f1{height:48px}.raisedFinger.f2{height:54px}.raisedFinger.f3{height:52px}.raisedFinger.f4{height:44px}
      .handPalm{width:50px;height:38px;background:#ffd7b5;border:2px solid #17324d;border-radius:12px 12px 18px 18px;position:relative;z-index:1}
      .handPalm:after{content:'';position:absolute;width:17px;height:9px;background:#ffd7b5;border:2px solid #17324d;border-left:0;border-radius:0 9px 9px 0;right:-13px;top:12px;transform:rotate(-18deg);transform-origin:left center}
      .fingerCount{display:inline-flex;align-items:center;gap:5px;margin-bottom:7px;padding:5px 9px;border-radius:999px;background:var(--teal2);color:var(--teal);font-size:13px;font-weight:1000}
      .fingerLabel{font-size:20px;line-height:1.15;font-weight:1000;color:var(--navy)}
      .fingerSub{font-size:13px;line-height:1.3;color:var(--muted);font-weight:800;margin-top:8px}
      .fingerInstruction{font-size:clamp(17px,2vw,25px);line-height:1.4;color:var(--muted);font-weight:850;max-width:900px;margin:0 auto}
      .fingerMax{display:inline-block;margin-top:10px;padding:7px 12px;border-radius:999px;background:var(--teal2);color:var(--teal);font-size:13px;font-weight:1000}
      @media(max-width:760px){.fingerGrid{grid-template-columns:repeat(2,1fr);gap:12px}.fingerCard{min-height:190px;padding:14px 8px}.fingerVisuals{gap:9px;min-height:82px}.confidencePic{font-size:48px}.drawnHand{transform:scale(.86);margin-inline:-5px}.fingerLabel{font-size:17px}.fingerSub{font-size:12px}}
    `;
    document.head.appendChild(style);
  }

  const items=[
    ['🆘',1,'I need help','Please support me'],
    ['🌱',2,'I’m getting there','I need more practice'],
    ['✅',3,'I can do it','I can try independently'],
    ['💡',4,'I can explain it','I can help someone else']
  ];

  panel.innerHTML=`
    <div class="eyebrow">How is learning going?</div>
    <div class="hero small">Show 1–4 fingers</div>
    <div class="fingerInstruction">Hold up the number of fingers that matches how you feel.</div>
    <div class="fingerMax">4 fingers maximum</div>
    <div class="fingerGrid">
      ${items.map(([pic,n,label,sub])=>`
        <div class="fingerCard">
          <div class="fingerVisuals"><span class="confidencePic">${pic}</span>${hand(n)}</div>
          <div class="fingerCount">${n} ${n===1?'finger':'fingers'}</div>
          <div class="fingerLabel">${label}</div>
          <div class="fingerSub">${sub}</div>
        </div>`).join('')}
    </div>`;
  return true;
}

let tries=0;
const id=setInterval(()=>{tries++;if(install()||tries>80)clearInterval(id)},50);
})();
