(function(){
'use strict';
const S=window.Support;
if(!S||S.slug!=='confidence-check'||window.__confidenceFingersV5)return;
window.__confidenceFingersV5=true;

function hand(n){
  const common='fill="#ffd7b5" stroke="#17324d" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"';
  const hands={
    1:`<svg class="cartoonHand" viewBox="0 0 120 120" role="img" aria-label="1 finger: index finger up">
      <g ${common}>
        <rect x="36" y="58" width="57" height="47" rx="20"/>
        <rect x="39" y="13" width="18" height="58" rx="9"/>
        <path d="M59 59 C59 51 65 47 72 49 C78 50 80 56 78 63"/>
        <path d="M72 62 C73 55 79 52 85 54 C91 56 92 62 89 68"/>
        <path d="M81 70 C84 64 91 64 95 69 C99 74 96 80 91 84"/>
      </g>
      <path d="M43 31 Q48 27 53 31" fill="none" stroke="#f2a879" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`,
    2:`<svg class="cartoonHand" viewBox="0 0 120 120" role="img" aria-label="2 fingers up">
      <g ${common}>
        <rect x="34" y="60" width="59" height="45" rx="20"/>
        <rect x="32" y="20" width="18" height="55" rx="9" transform="rotate(-7 41 47)"/>
        <rect x="55" y="12" width="18" height="62" rx="9" transform="rotate(5 64 43)"/>
        <path d="M73 62 C74 55 80 51 86 54 C92 57 92 63 89 69"/>
        <path d="M82 70 C86 65 93 66 96 71 C99 76 96 82 91 86"/>
      </g>
      <path d="M36 38 Q41 34 46 38 M59 31 Q64 27 69 31" fill="none" stroke="#f2a879" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`,
    3:`<svg class="cartoonHand" viewBox="0 0 120 120" role="img" aria-label="3 fingers up">
      <g ${common}>
        <rect x="28" y="61" width="66" height="44" rx="20"/>
        <rect x="24" y="27" width="17" height="49" rx="8.5" transform="rotate(-6 32 51)"/>
        <rect x="45" y="14" width="17" height="61" rx="8.5"/>
        <rect x="66" y="20" width="17" height="55" rx="8.5" transform="rotate(5 74 47)"/>
        <path d="M82 65 C84 58 91 57 96 61 C101 65 99 72 93 78"/>
      </g>
      <path d="M28 43 Q32 40 37 43 M49 32 Q53 29 58 32 M70 38 Q74 35 79 38" fill="none" stroke="#f2a879" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`,
    4:`<svg class="cartoonHand" viewBox="0 0 120 120" role="img" aria-label="4 fingers up">
      <g ${common}>
        <rect x="24" y="61" width="70" height="44" rx="20"/>
        <rect x="18" y="31" width="16" height="45" rx="8" transform="rotate(-5 26 53)"/>
        <rect x="38" y="20" width="16" height="56" rx="8"/>
        <rect x="58" y="13" width="16" height="63" rx="8"/>
        <rect x="78" y="24" width="16" height="52" rx="8" transform="rotate(5 86 50)"/>
      </g>
      <path d="M21 46 Q26 43 31 46 M42 37 Q46 34 51 37 M62 31 Q66 28 71 31 M82 41 Q86 38 91 41" fill="none" stroke="#f2a879" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`
  };
  return hands[n]||'';
}

function install(){
  const panel=S.panel||document.getElementById('panel');
  if(!panel)return false;

  document.body.classList.add('ccConfidenceFit');

  if(!document.getElementById('confidenceFingersStyleV5')){
    const style=document.createElement('style');
    style.id='confidenceFingersStyleV5';
    style.textContent=`
      body.ccConfidenceFit{overflow:hidden!important;background:radial-gradient(circle at 50% 0,#fff 0,#f4fbfa 46%,#e9f2f3 100%)!important}
      body.ccConfidenceFit .shell{height:100vh;min-height:0;padding:10px;overflow:hidden}
      body.ccConfidenceFit .top{margin:0 auto 10px;border-radius:18px;padding:9px 11px;box-shadow:0 8px 24px rgba(18,32,46,.07)}
      body.ccConfidenceFit .toolIcon{width:46px;height:46px;border-radius:14px;font-size:24px}
      body.ccConfidenceFit .toolTitle{font-size:18px}
      body.ccConfidenceFit .toolHint{font-size:11px}
      body.ccConfidenceFit .topActions .btn{min-height:42px;padding:8px 12px}
      body.ccConfidenceFit .stage{min-height:0;margin:0;align-items:flex-start;overflow:hidden}
      body.ccConfidenceFit .panel{width:min(900px,100%);height:auto;max-height:100%;margin:0 auto;padding:18px 20px 20px;border-radius:26px;overflow:hidden;box-shadow:0 16px 42px rgba(18,32,46,.10);background:linear-gradient(155deg,#fff 0,#fbfefd 58%,#f2faf8 100%)}
      body.ccConfidenceFit .panel>.eyebrow{font-size:11px;margin:0 0 4px;letter-spacing:.14em}
      body.ccConfidenceFit .panel>.hero{font-size:clamp(30px,4.5vw,44px);line-height:1.02;margin:0 auto 6px;letter-spacing:-.04em}
      .fingerInstruction{font-size:clamp(14px,1.9vw,18px);line-height:1.3;color:var(--muted);font-weight:850;max-width:760px;margin:0 auto}
      .fingerMax{display:inline-flex;align-items:center;margin-top:8px;padding:6px 11px;border-radius:999px;background:var(--teal2);color:var(--teal);font-size:12px;font-weight:1000}
      .fingerGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;max-width:780px;margin:13px auto 0}
      .fingerCard{min-width:0;min-height:158px;border:1px solid #d7e3e8;border-radius:22px;background:#fff;padding:12px 14px;display:grid;grid-template-columns:112px minmax(0,1fr);grid-template-rows:auto auto auto;column-gap:12px;align-items:center;text-align:left;box-shadow:0 7px 20px rgba(18,32,46,.055);position:relative;overflow:hidden}
      .fingerCard:before{content:'';position:absolute;inset:0 auto 0 0;width:5px;border-radius:22px 0 0 22px;background:#9dd9d0}
      .fingerCard:nth-child(1):before{background:#ff7da6}.fingerCard:nth-child(2):before{background:#8bcf69}.fingerCard:nth-child(3):before{background:#38b98b}.fingerCard:nth-child(4):before{background:#69a9ff}
      .fingerVisuals{grid-column:1;grid-row:1/4;display:flex;align-items:center;justify-content:center;gap:3px;min-height:0;margin:0}
      .confidencePic{font-size:38px;line-height:1;display:block;filter:drop-shadow(0 3px 3px rgba(23,50,77,.08))}
      .cartoonHand{width:64px;height:64px;display:block;overflow:visible;filter:drop-shadow(0 4px 4px rgba(23,50,77,.10))}
      .fingerCount{grid-column:2;justify-self:start;display:inline-flex;align-items:center;gap:5px;margin:0 0 3px;padding:5px 9px;border-radius:999px;background:var(--teal2);color:var(--teal);font-size:12px;font-weight:1000}
      .fingerLabel{grid-column:2;font-size:clamp(17px,2.2vw,21px);line-height:1.08;font-weight:1000;color:var(--navy);overflow-wrap:anywhere}
      .fingerSub{grid-column:2;font-size:12px;line-height:1.2;color:var(--muted);font-weight:800;margin-top:5px;overflow-wrap:anywhere}
      @media(max-height:700px) and (min-width:600px){
        body.ccConfidenceFit .shell{padding:6px}
        body.ccConfidenceFit .top{margin-bottom:6px;padding:6px 8px}
        body.ccConfidenceFit .toolIcon{width:38px;height:38px;font-size:20px}
        body.ccConfidenceFit .toolHint{display:none}
        body.ccConfidenceFit .panel{padding:12px 16px 14px}
        body.ccConfidenceFit .panel>.hero{font-size:32px}
        .fingerInstruction{font-size:14px}.fingerMax{margin-top:5px;padding:4px 9px;font-size:11px}
        .fingerGrid{gap:8px;margin-top:8px}.fingerCard{min-height:128px;padding:9px 11px;grid-template-columns:96px minmax(0,1fr);column-gap:8px}
        .confidencePic{font-size:31px}.cartoonHand{width:55px;height:55px}.fingerLabel{font-size:17px}.fingerSub{font-size:11px}.fingerCount{font-size:11px;padding:4px 8px}
      }
      @media(max-width:599px){
        body.ccConfidenceFit{overflow-y:auto!important}
        body.ccConfidenceFit .shell{height:auto;min-height:100vh;overflow:visible}
        body.ccConfidenceFit .stage{overflow:visible}
        body.ccConfidenceFit .panel{overflow:visible}
        .fingerGrid{grid-template-columns:1fr}
        .fingerCard{grid-template-columns:96px minmax(0,1fr);min-height:138px}
        .confidencePic{font-size:34px}.cartoonHand{width:58px;height:58px}
      }
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
