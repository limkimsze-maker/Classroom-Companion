
(function(){
'use strict';
const slot=document.getElementById('ccSaveSlot');
const tools=document.querySelector('.tools');
if(!slot||!tools)return;
let pending=false;
function arrange(){
 pending=false;
 const usual=[...tools.querySelectorAll('button')].find(b=>b.textContent.trim()==='Usual whiteboard');
 if(usual&&usual.parentElement!==slot)slot.insertBefore(usual,slot.firstChild);
 const old=document.getElementById('ccDocumentSaveTop');
 if(old)old.style.setProperty('display','none','important');
 const inline=document.getElementById('ccInlineSave');
 if(inline)inline.style.setProperty('display','none','important');
}
const observer=new MutationObserver(()=>{if(!pending){pending=true;requestAnimationFrame(arrange)}});
observer.observe(tools,{childList:true,subtree:false});
arrange();
})();
