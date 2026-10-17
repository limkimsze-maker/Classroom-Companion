(function(){
'use strict';
if(typeof eraserBtn==='undefined'||typeof strokes==='undefined')return;
eraserBtn.addEventListener('click',e=>{
 if(typeof tool==='undefined'||tool!=='select')return;
 const before=strokes.length;
 document.dispatchEvent(new KeyboardEvent('keydown',{key:'Delete',code:'Delete',bubbles:true,cancelable:true}));
 if(strokes.length<before){
  e.preventDefault();
  e.stopImmediatePropagation();
 }
},true);
})();
