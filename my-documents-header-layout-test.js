(function(){'use strict';
const slot=document.getElementById('ccSaveSlot'),tools=document.querySelector('.tools');
if(!slot||!tools)return;
const placeholder=document.getElementById('ccUsualWhiteboardInSlot');
let queued=false;
function arrange(){
 queued=false;
 const matches=[...document.querySelectorAll('button')].filter(b=>b!==placeholder&&b.textContent.trim()==='Usual whiteboard');
 const actual=matches[0];
 if(actual){
   if(placeholder?.isConnected)placeholder.remove();
   if(actual.parentElement!==slot)slot.insertBefore(actual,slot.firstChild);
 }else if(placeholder){
   placeholder.onclick=()=>{const live=[...document.querySelectorAll('button')].find(b=>b!==placeholder&&b.textContent.trim()==='Usual whiteboard');if(live)live.click()};
 }
 for(const id of ['ccDocumentSaveTop','ccInlineSave','ccQuickSave']){const el=document.getElementById(id);if(el)el.style.setProperty('display','none','important')}
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(arrange)}
new MutationObserver(schedule).observe(tools,{childList:true,subtree:true});
new MutationObserver(schedule).observe(slot,{childList:true});
arrange();
})();