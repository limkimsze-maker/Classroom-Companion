(function(){
'use strict';
window.addEventListener('keydown',function(e){
  if(e.key!=='Escape')return;
  if(/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||''))return;
  const selectButton=document.getElementById('selectBtn');
  if(!selectButton)return;
  if(typeof tool==='string'&&tool==='select')return;
  e.preventDefault();
  selectButton.click();
},true);
})();
