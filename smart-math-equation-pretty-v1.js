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
 const W=520,H=245,right=455,fontSize=58,row1Y=78,row2Y=145,lineY=166;
 const maxChars=Math.max(a.length,b.length+2);
 const lineWidth=clamp(maxChars*39+34,155,300);
 const lineStart=right-lineWidth;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`+
 `<rect width="100%" height="100%" fill="white"/>`+
 `<g fill="#17324d" font-family="${font()}" font-size="${fontSize}" font-weight="700">`+
 `<text x="${right}" y="${row1Y}" text-anchor="end">${esc(a)}</text>`+
 `<text x="${right}" y="${row2Y}" text-anchor="end">${esc(op)} ${esc(b)}</text>`+
 `</g><line x1="${lineStart}" y1="${lineY}" x2="${right+8}" y2="${lineY}" stroke="#17324d" stroke-width="5" stroke-linecap="round"/>`+
 `</svg>`;
}

function divisionSvg(dividend,divisor){
 const W=620,H=390,fontSize=58;
 const digits=Math.max(1,dividend.length);
 const dividendWidth=clamp(digits*39+38,150,310);
 const roofStart=225,roofEnd=clamp(roofStart+dividendWidth,390,555),roofY=108;
 const dividendX=roofStart+24,numberY=168,divisorX=roofStart-34;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`+
 `<rect width="100%" height="100%" fill="white"/>`+
 `<g fill="#17324d" font-family="${font()}" font-size="${fontSize}" font-weight="700">`+
 `<text x="${divisorX}" y="${numberY}" text-anchor="end">${esc(divisor)}</text>`+
 `<text x="${dividendX}" y="${numberY}" text-anchor="start">${esc(dividend)}</text>`+
 `</g>`+
 `<path d="M ${roofStart} 205 C ${roofStart-9} 192 ${roofStart-9} 162 ${roofStart} ${roofY} L ${roofEnd} ${roofY}" fill="none" stroke="#17324d" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`+
 `</svg>`;
}

function make(a,op,b){
 const isDivision=op==='÷';
 const svg=isDivision?divisionSvg(a,b):verticalSvg(a,op,b);
 const obj={type:'image',src:svgData(svg),x:isDivision?.22:.28,y:isDivision?.16:.22,w:isDivision?.5:.38,h:isDivision?.48:.29,smartGenerated:true,smartType:'equation',smartId:uid(),smartOriginal:[],equationExpression:`${a} ${op} ${b}`,equationLayout:isDivision?'long-division':'vertical'};
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
