(function(){
'use strict';
const S=window.Support;
if(!S||S.slug!=='confidence-check'||window.__confidenceFingersV3)return;
window.__confidenceFingersV3=true;

function hand(n){
  const common='fill="#ffd7b5" stroke="#17324d" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"';
  const hands={
    1:`<svg class="cartoonHand" viewBox="0 0 120 120" role="img" aria-label="1 finger: index finger up">
      <g ${common}>
        <rect x="36" y="58" width="57" height="47" rx="20"/>
        <rect x="39" y="13" width="18" height="58" rx="9"/>
        <path d="M37 73 C29 64 20 65 18 72 C16 79 24 87 38 91 Z"/>
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
        <path d="M35 74 C27 65 19 66 17 73 C15 80 23 88 37 92 Z"/>
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
        <path d="M30 75 C23 67 15 68 14 75 C13 82 21 89 32 93 Z"/>
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
        <path d="M27 76 C19 67 11 69 11 76 C11 83 19 90 30 94 Z"/>
      </g>
      <path d="M21 46 Q26 43 31 46 M42 37 Q46 34 51 37 M62 31 Q66 28 71 31 M82 41 Q86 38 91 41" fill="none" stroke="#f2a879" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`
  };
  return hands[n]||'';
}

function install(){
  const panel=S.panel||document.getElementById('panel');
  if(!panel)return false;

  if(!document.getElementById('confidenceFingersStyleV3')){
    const style=document.createElement('style');
    style.id='confidenceFingersStyleV3';
    style.textContent=`
      .fingerGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;max-width:1000px;margin:24px auto 0}
      .fingerCard{min-height:218px;border:1px solid var(--line);border-radius:25px;background:#fff;padding:18px 12px;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 7px 20px rgba(18,32,46,.05)}
      .fingerVisuals{display:flex;align-items:center;justify-content:center;gap:12px;min-height:98px;margin-bottom:8px}
      .confidencePic{font-size:56px;line-height:1;display:block;filter:drop-shadow(0 3px 3px rgba(23,50,77,.08))}
      .cartoonHand{width:86px;height:86px;display:block;overflow:visible;filter:drop-shadow(0 4px 4px rgba(23,50,77,.10))}
      .fingerCount{display:inline-flex;align-items:center;gap:5px;margin-bottom:7px;padding:5px 10px;border-radius:999px;background:var(--teal2);color:var(--teal);font-size:13px;font-weight:1000}
      .fingerLabel{font-size:20px;line-height:1.15;font-weight:1000;color:var(--navy)}
      .fingerSub{font-size:13px;line-height:1.3;color:var(--muted);font-weight:800;margin-top:8px}
      .fingerInstruction{font-size:clamp(17px,2vw,25px);line-height:1.4;color:var(--muted);font-weight:850;max-width:900px;margin:0 auto}
      .fingerMax{display:inline-block;margin-top:10px;padding:7px 12px;border-radius:999px;background:var(--teal2);color:var(--teal);font-size:13px;font-weight:1000}
      @media(max-width:760px){.fingerGrid{grid-template-columns:repeat(2,1fr);gap:12px}.fingerCard{min-height:198px;padding:14px 8px}.fingerVisuals{gap:6px;min-height:86px}.confidencePic{font-size:45px}.cartoonHand{width:72px;height:72px}.fingerLabel{font-size:17px}.fingerSub{font-size:12px}}
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
