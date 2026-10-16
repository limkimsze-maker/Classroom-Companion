(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function'||typeof syncUi!=='function'||typeof wrap==='undefined')return;

const edition=(new URLSearchParams(location.search).get('edition')||'en').toLowerCase();
const TXT={
 en:{menu:'Equation',title:'Format vertical equation',hint:'Type an expression, e.g. 345 + 2 or 345 ÷ 5',format:'Format',cancel:'Cancel',bad:'Enter an equation such as 345 + 2 or 345 ÷ 5.',made:'Math equation created'},
 zh:{menu:'算式',title:'整理竖式',hint:'输入算式，例如 345 + 2 或 345 ÷ 5',format:'整理',cancel:'取消',bad:'请输入算式，例如 345 + 2 或 345 ÷ 5。',made:'已创建数学算式'},
 ms:{menu:'Persamaan',title:'Format pengiraan menegak',hint:'Taip pengiraan, cth. 345 + 2 atau 345 ÷ 5',format:'Format',cancel:'Batal',bad:'Masukkan pengiraan seperti 345 + 2 atau 345 ÷ 5.',made:'Pengiraan Matematik dicipta'},
 ta:{menu:'சமன்பாடு',title:'செங்குத்து கணக்கை வடிவமை',hint:'345 + 2 அல்லது 345 ÷ 5 போன்ற கணக்கை உள்ளிடவும்',format:'வடிவமை',cancel:'ரத்து',bad:'345 + 2 அல்லது 345 ÷ 5 போன்ற கணக்கை உள்ளிடவும்.',made:'கணிதக் கணக்கு உருவாக்கப்பட்டது'}
};
const L=TXT[edition]||TXT.en;
const MENU_LABELS=new Set(['Equation','算式','Persamaan','சமன்பாடு']);
let panel=null;
const uid=()=>`smeq-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function esc(v){return String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&apos;'}[c]))}
function svgData(svg){return'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)}
function notify(msg){if(typeof say==='function'){try{say(msg);return}catch{}}const t=document.getElementById('toast');if(t){t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1400)}}
function close(){if(panel){panel.remove();panel=null}}
function font(){return `'Comic Sans MS','Segoe Print','Trebuchet MS','Arial Rounded MT Bold',sans-serif`}

function verticalSvg(a,op,b){
 const fontSize=58,maxChars=Math.max(a.length,b.length+2);
 const W=clamp(maxChars*43+44,210,330),H=190,right=W-24,row1Y=64,row2Y=126,lineY=148;
 const lineWidth=clamp(maxChars*41+24,145,W-30),lineStart=right-lineWidth;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`+
 `<rect width="100%" height="100%" fill="white"/>`+
 `<g fill="#17324d" font-family="${font()}" font-size="${fontSize}" font-weight="700">`+
 `<text x="${right}" y="${row1Y}" text-anchor="end">${esc(a)}</text>`+
 `<text x="${right}" y="${row2Y}" text-anchor="end">${esc(op)} ${esc(b)}</text>`+
 `</g><line x1="${lineStart}" y1="${lineY}" x2="${right+4}" y2="${lineY}" stroke="#17324d" stroke-width="5" stroke-linecap="round"/>`+
 `</svg>`;
 return{svg,W,H};
}

function divisionSvg(dividend,divisor){
 const fontSize=58,digits=Math.max(1,dividend.length);
 const dividendWidth=clamp(digits*42+30,140,300),W=clamp(dividendWidth+130,275,425),H=280;
 const roofX=94,roofY=72,roofEnd=clamp(roofX+dividendWidth,W-38,W-18);
 const dividendX=roofX+18,numberY=132,divisorX=roofX-22;
 const bracketBottom=numberY+24,corner=12;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`+
 `<rect width="100%" height="100%" fill="white"/>`+
 `<g fill="#17324d" font-family="${font()}" font-size="${fontSize}" font-weight="700">`+
 `<text x="${divisorX}" y="${numberY}" text-anchor="end">${esc(divisor)}</text>`+
 `<text x="${dividendX}" y="${numberY}" text-anchor="start">${esc(dividend)}</text>`+
 `</g>`+
 `<path d="M ${roofX} ${bracketBottom} L ${roofX} ${roofY+corner} Q ${roofX} ${roofY} ${roofX+corner} ${roofY} L ${roofEnd} ${roofY}" fill="none" stroke="#17324d" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`+
 `</svg>`;
 return{svg,W,H};
}

function make(a,op,b){
 const isDivision=op==='÷',made=isDivision?divisionSvg(a,b):verticalSvg(a,op,b),svg=made.svg;
 const pxW=made.W,pxH=made.H;
 const obj={type:'image',src:svgData(svg),x:isDivision?.24:.31,y:isDivision?.18:.24,w:clamp(pxW/Math.max(1,cssW),isDivision?.20:.15,isDivision?.36:.28),h:clamp(pxH/Math.max(1,cssH),isDivision?.24:.20,isDivision?.40:.32),smartGenerated:true,smartType:'equation',smartId:uid(),smartOriginal:[],equationExpression:`${a} ${op} ${b}`,equationLayout:isDivision?'long-division':'vertical'};
 strokes.push(obj);redraw();syncUi();try{tool='select';syncUi()}catch{}notify(L.made);
}

function openPanel(){
 close();panel=document.createElement('div');
 panel.style.cssText='position:absolute;z-index:10120;left:50%;top:16px;transform:translateX(-50%);width:min(380px,calc(100% - 24px));padding:12px;background:rgba(255,255,255,.99);border:1px solid #cfd9de;border-radius:13px;box-shadow:0 10px 28px rgba(18,32,46,.2)';
 const title=document.createElement('div');title.textContent=L.title;title.style.cssText='font-weight:950;color:#17324d;margin-bottom:7px';
 const inp=document.createElement('input');inp.type='text';inp.placeholder=L.hint;inp.style.cssText='width:100%;padding:9px 10px;border:1px solid #cfd9de;border-radius:9px;margin-bottom:9px;font-weight:800;color:#17324d';
 const row=document.createElement('div');row.style.cssText='display:flex;gap:7px';
 const ok=document.createElement('button');ok.type='button';ok.className='btn soft';ok.textContent=L.format;ok.style.flex='1';
 const ca=document.createElement('button');ca.type='button';ca.className='btn';ca.textContent=L.cancel;
 ok.onclick=()=>{const m=inp.value.trim().match(/^(-?\d+)\s*([+\-×x*÷/])\s*(-?\d+)$/);if(!m){notify(L.bad);return}const a=m[1],op=m[2].replace('x','×').replace('*','×').replace('/','÷'),b=m[3];close();make(a,op,b)};
 ca.onclick=close;row.append(ok,ca);panel.append(title,inp,row);wrap.appendChild(panel);setTimeout(()=>inp.focus(),0);
}

document.addEventListener('click',e=>{
 const b=e.target?.closest?.('button');if(!b)return;
 if(!MENU_LABELS.has((b.textContent||'').trim()))return;
 if(b.id==='smartMathBtn')return;
 const parent=b.parentElement;
 if(!parent||!parent.style||parent.style.position!=='fixed')return;
 e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();parent.style.display='none';openPanel();
},true);

document.addEventListener('keydown',e=>{if(e.key==='Escape')close()},true);
})();
