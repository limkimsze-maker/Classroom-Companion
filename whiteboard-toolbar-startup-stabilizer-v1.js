(function(){
'use strict';
const tools=document.querySelector('.tools');
if(!tools){document.body.classList.add('toolbar-ready');return;}
let timer=0,revealed=false;
const reveal=()=>{
 if(revealed)return;
 revealed=true;
 obs.disconnect();
 requestAnimationFrame(()=>requestAnimationFrame(()=>document.body.classList.add('toolbar-ready')));
};
const settle=()=>{
 clearTimeout(timer);
 timer=setTimeout(reveal,90);
};
const obs=new MutationObserver(settle);
obs.observe(tools,{subtree:true,childList:true,characterData:true,attributes:true});
settle();
setTimeout(reveal,600);
})();
