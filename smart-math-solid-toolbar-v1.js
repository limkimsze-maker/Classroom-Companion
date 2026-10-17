(function(){
'use strict';
function removeStandaloneSolidButton(){
 const b=document.getElementById('smartSolidBtn');
 if(b)b.remove();
}
removeStandaloneSolidButton();
new MutationObserver(removeStandaloneSolidButton).observe(document.body,{childList:true,subtree:true});
})();
