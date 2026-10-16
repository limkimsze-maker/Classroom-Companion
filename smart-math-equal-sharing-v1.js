(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function'||typeof syncUi!=='function')return;
const edition=(new URLSearchParams(location.search).get('edition')||'en').toLowerCase();
const TXT={
 en:{menu:'Equal Sharing',title:'Create Equal Sharing',total:'Total',shares:'Number of equal shares',ready:'Ready to create',create:'Create model',cancel:'Cancel',bad:'Enter a total and a whole-number number of equal shares (2–20).',made:'Equal Sharing model created'},
 zh:{menu:'平均分配',title:'建立平均分配模型',total:'总数',shares:'平均分成几份',ready:'可以建立模型',create:'建立模型',cancel:'取消',bad:'请输入总数和平均分配的份数（2–20的整数）。',made:'已建立平均分配模型'},
 ms:{menu:'Perkongsian Sama',title:'Bina Perkongsian Sama',total:'Jumlah',shares:'Bilangan bahagian sama',ready:'Sedia untuk dibina',create:'Bina model',cancel:'Batal',bad:'Masukkan jumlah dan bilangan bahagian sama dalam nombor bulat (2–20).',made:'Model Perkongsian Sama dicipta'},
 ta:{menu:'சமப் பகிர்வு',title:'சமப் பகிர்வு மாதிரியை உருவாக்கு',total:'மொத்தம்',shares:'சம பங்குகளின் எண்ணிக்கை',ready:'உருவாக்கத் தயாராக உள்ளது',create:'மாதிரியை உருவாக்கு',cancel:'ரத்து செய்',bad:'மொத்தத்தையும் 2–20 வரையிலான முழு எண்ணான சம பங்குகளின் எண்ணிக்கையையும் உள்ளிடவும்.',made:'சமப் பகிர்வு மாதிரி உருவாக்கப்பட்டது'}
};
const L=TXT[edition]||TXT.en;
const clone=v=>JSON.parse(JSON.stringify(v));
const uid=()=>`smshare-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
let panel=null;
function esc(v){return String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&apos;'}[c]))}
function svgData(svg){return'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)}
function notify(msg){if(typeof say==='function'){try{say(msg);return}catch{}}const t=document.getElementById('toast');if(t){t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1400)}}
function numeric(v){const m=String(v||'').replace(/,/g,'').match(/-?\d+(?:\.\d+)?/);return m?Number(m[0]):NaN}
function close(){if(panel){panel.remove();panel=null}}
function bracket(x1,x2,y,label){const arm=14,mid=(x1+x2)/2,tip=y-10,endY=y+arm;return `<path d="M ${x1} ${endY} Q ${x1} ${y} ${x1+10} ${y} L ${mid-14} ${y} Q ${mid} ${y} ${mid} ${tip} Q ${mid} ${y} ${mid+14} ${y} L ${x2-10} ${y} Q ${x2} ${y} ${x2} ${endY}" fill="none" stroke="#111827" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>${label?`<text x="${mid}" y="${y-20}" text-anchor="middle" font-family="Arial,sans-serif" font-size="34" font-weight="700" fill="#111827">${esc(label)}</text>`:''}`}
function build(totalLabel,count){
 const W=1000,H=340,x=120,y=135,h=86,w=760,stroke='#17324d',fill='#8db8dc',parts=[];
 parts.push(bracket(x,x+w,95,totalLabel));
 parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="5"/>`);
 for(let i=1;i<count;i++){const px=x+w*i/count;parts.push(`<line x1="${px}" y1="${y}" x2="${px}" y2="${y+h}" stroke="${stroke}" stroke-width="4"/>`)}
 return svgData(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${parts.join('')}</svg>`)
}
function make(totalLabel,count){const before=clone(strokes);const obj={type:'image',src:build(totalLabel,count),x:.16,y:.18,w:.68,h:.39,smartGenerated:true,smartType:'barModel',smartBarType:'equalsharing',smartId:uid(),equalSharingTotalLabel:totalLabel,equalSharingCount:count,smartOriginal:[]};strokes.push(obj);window.__smartBarLastHistory={before,afterId:obj.smartId};redraw();syncUi();try{tool='select';syncUi()}catch{}notify(L.made)}
function openPanel(){
 close();panel=document.createElement('div');panel.style.cssText='position:fixed;z-index:10125;width:min(360px,calc(100vw - 20px));padding:14px;background:#fff;border:1px solid #cfd9de;border-radius:15px;box-shadow:0 14px 36px rgba(23,50,77,.24);left:50%;top:50%;transform:translate(-50%,-50%)';
 const title=document.createElement('div');title.textContent=L.title;title.style.cssText='font:900 16px Inter,system-ui,sans-serif;color:#17324d;margin-bottom:11px';
 const mk=(label,ph)=>{const w=document.createElement('label');w.style.cssText='display:block;margin:8px 0;font:800 11px Inter,system-ui,sans-serif;color:#667085';w.textContent=label;const i=document.createElement('input');i.type='text';i.placeholder=ph;i.style.cssText='display:block;width:100%;margin-top:5px;border:1px solid #cfd9de;border-radius:10px;padding:9px 10px;font-size:15px;font-weight:800;color:#17324d';w.appendChild(i);return{wrap:w,input:i}};
 const total=mk(L.total,'80'),shares=mk(L.shares,'10');
 const hint=document.createElement('div');hint.style.cssText='min-height:21px;margin:7px 0 10px;font:800 12px Inter,system-ui,sans-serif;color:#0f766e';
 const row=document.createElement('div');row.style.cssText='display:flex;gap:7px';const create=document.createElement('button'),cancel=document.createElement('button');create.type=cancel.type='button';create.className='btn soft';cancel.className='btn';create.textContent=L.create;cancel.textContent=L.cancel;create.style.flex='1';
 function calc(){const a=numeric(total.input.value),n=numeric(shares.input.value);if(Number.isFinite(a)&&a>=0&&Number.isInteger(n)&&n>=2&&n<=20){hint.textContent=L.ready;return n}hint.textContent='';return null}
 total.input.addEventListener('input',calc);shares.input.addEventListener('input',calc);
 create.addEventListener('click',e=>{e.preventDefault();const n=calc();if(!n){notify(L.bad);return}const totalLabel=total.input.value.trim();close();make(totalLabel,n)},true);cancel.addEventListener('click',e=>{e.preventDefault();close()},true);
 row.append(create,cancel);panel.append(title,total.wrap,shares.wrap,hint,row);document.body.appendChild(panel);setTimeout(()=>total.input.focus(),0)
}
window.__smartEqualSharingOpen=openPanel;
function inject(){const m=document.getElementById('smartBarTypeMenu');if(!m||m.querySelector('[data-equal-sharing]'))return;const buttons=[...m.querySelectorAll('button')],anchor=buttons.find(b=>(b.textContent||'').trim().toLowerCase()==='equal grouping');const b=document.createElement('button');b.type='button';b.className='btn';b.dataset.equalSharing='1';b.textContent=L.menu;b.style.cssText='display:block;width:100%;text-align:left;margin:3px 0';b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();m.style.display='none';openPanel()},true);if(anchor?.nextSibling)m.insertBefore(b,anchor.nextSibling);else m.appendChild(b)}
new MutationObserver(inject).observe(document.body,{childList:true,subtree:true});inject();document.addEventListener('keydown',e=>{if(e.key==='Escape')close()},true);
})();
