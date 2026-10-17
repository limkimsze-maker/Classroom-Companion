(function(){
'use strict';
const STYLE_ID='documentDockLowerStyles';
function ensureStyle(){
 if(document.getElementById(STYLE_ID))return;
 const s=document.createElement('style');s.id=STYLE_ID;
 s.textContent=`
#documentQuickBar{top:var(--document-dock-top,64px)!important;bottom:auto!important;transform:none!important;max-height:calc(100vh - var(--document-dock-top,64px) - 8px)!important}
#documentSearchPanel{top:var(--document-dock-top,64px)!important;bottom:auto!important;transform:none!important;max-height:calc(100vh - var(--document-dock-top,64px) - 8px)!important;overflow:auto!important}
`;
 document.head.appendChild(s);
}
function placeDock(){
 ensureStyle();
 const header=document.querySelector('.top');
 const bottom=header?.getBoundingClientRect().bottom||52;
 const y=Math.max(64,Math.round(bottom+10));
 document.documentElement.style.setProperty('--document-dock-top',`${y}px`);
}
placeDock();
window.addEventListener('resize',placeDock);
const header=document.querySelector('.top');
if(header&&window.ResizeObserver)new ResizeObserver(placeDock).observe(header);
new MutationObserver(placeDock).observe(document.body,{childList:true,subtree:true});
})();
