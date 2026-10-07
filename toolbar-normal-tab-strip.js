(function(){
'use strict';
if(window.__ccNormalTabStripV1)return;
window.__ccNormalTabStripV1=true;
const ua=navigator.userAgent||'';
const isMobile=/Android|iPhone|iPad|iPod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
if(isMobile)return;
function install(){
  const bar=document.getElementById('ccSmartBar');
  if(!bar){setTimeout(install,50);return}
  if(document.getElementById('ccNormalTabStripStyle'))return;
  const style=document.createElement('style');
  style.id='ccNormalTabStripStyle';
  style.textContent=`
    @media (min-width:600px){
      html,body{background:#f4f7f8!important}
      #ccSmartBar{
        inset:8px auto auto 8px!important;
        width:286px!important;
        height:min(620px,calc(100vh - 16px))!important;
        max-width:calc(100vw - 16px)!important;
        max-height:calc(100vh - 16px)!important;
        border-radius:16px!important;
        box-shadow:0 18px 44px rgba(18,32,46,.18)!important
      }
    }
  `;
  document.head.appendChild(style);
}
install();
})();
