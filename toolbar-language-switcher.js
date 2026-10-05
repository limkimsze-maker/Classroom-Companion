(function(){
'use strict';
if(window.__ccLanguageSwitcherV1)return;
window.__ccLanguageSwitcherV1=true;
const LANGS=[
  ['EN','English','/Classroom-Companion/widget-launch.html'],
  ['中文','中文','/Classroom-Companion-Chinese-Edition/widget-launch.html'],
  ['BM','Bahasa Melayu','/Classroom-Companion-Malay-Edition/widget-launch.html'],
  ['த','தமிழ்','/Classroom-Companion-Tamil-Edition/widget-launch.html']
];
function go(url){location.href=url+'?v='+Date.now()}
function buttons(cls){return LANGS.map(([code,label,url])=>`<button type="button" class="${cls}" data-url="${url}" aria-label="${label}" title="${label}">${code}</button>`).join('')}
function bind(root){root.querySelectorAll('[data-url]').forEach(b=>b.onclick=e=>{e.preventDefault();e.stopPropagation();go(b.dataset.url)})}
function init(){
  const bar=document.getElementById('ccSmartBar');
  if(!bar){setTimeout(init,60);return}
  if(document.getElementById('ccLanguageSwitchStyle'))return;
  const style=document.createElement('style');style.id='ccLanguageSwitchStyle';style.textContent=`
  .ccLangBtn{border:0;background:transparent;color:#0f766e;font:1000 9px/1.1 Inter,ui-sans-serif,system-ui,sans-serif;padding:1px 2px;cursor:pointer;border-radius:5px}.ccLangBtn:hover,.ccLangBtn:focus-visible{background:#dff6f1;outline:none}
  #ccMobileLanguages{display:none;position:absolute;top:5px;right:7px;z-index:2147483647;gap:3px;align-items:center;padding:3px 5px;border:1px solid #d7e4e2;border-radius:9px;background:rgba(255,255,255,.96);box-shadow:0 3px 10px rgba(18,32,46,.08)}
  #ccPaletteTitle .ccDesktopLanguages{display:inline-flex;align-items:center;gap:2px;vertical-align:middle;margin-left:2px}
  #ccPaletteTitle .ccDesktopLanguages .ccLangBtn{font-size:8px;padding:0 1px}
  @media(max-width:700px),(pointer:coarse){#ccMobileLanguages{display:flex}#ccSmartBar.collapsed #ccMobileLanguages{display:none!important}}
  `;document.head.appendChild(style);
  const title=document.getElementById('ccPaletteTitle');
  if(title){
    const sub=title.querySelector('span');
    if(sub){sub.innerHTML=`Created by Lim Kim Sze • <span class="ccDesktopLanguages">${buttons('ccLangBtn')}</span>`;bind(sub)}
  }else{
    const row=document.createElement('div');row.id='ccMobileLanguages';row.setAttribute('aria-label','Language');row.innerHTML=buttons('ccLangBtn');bar.appendChild(row);bind(row)
  }
}
init();
})();
