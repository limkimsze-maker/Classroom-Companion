(function(){'use strict';
const slot=document.getElementById('ccSaveSlot'),tools=document.querySelector('.tools');
if(!slot||!tools)return;
const placeholder=document.getElementById('ccUsualWhiteboardInSlot');
let scheduled=false,settled=false;
function arrange(){
 scheduled=false;
 // Do not relocate dynamically managed buttons: other toolbar scripts may recreate them.
 // Hide the static duplicate and leave the original Usual whiteboard in its native toolbar.
 if(placeholder)placeholder.remove();
 const native=[...tools.querySelectorAll('button')].find(b=>b.textContent.trim()==='Usual whiteboard');
 if(native&&native.parentElement!==tools)tools.appendChild(native);
 for(const id of ['ccDocumentSaveTop','ccInlineSave','ccQuickSave']){
  const el=document.getElementById(id);
  if(el)el.style.setProperty('display','none','important');
 }
 settled=true;
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(arrange)}
schedule();
new MutationObserver(schedule).observe(tools,{childList:true});
})();