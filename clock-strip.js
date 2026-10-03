(function(){
'use strict';
let clockWin=null;
function openClock({format='24',seconds=false,date=true}={}){
  const q=new URLSearchParams({format,seconds:seconds?'1':'0',date:date?'1':'0',v:'20261003clock1'});
  const url='clock.html?'+q.toString();
  try{if(clockWin&&!clockWin.closed){clockWin.location.href=url;clockWin.focus();return}}catch(e){}
  const w=Math.max(900,screen.availWidth||1200),h=Math.max(650,screen.availHeight||800);
  clockWin=window.open(url,'ClassroomCompanionClock',`popup=yes,width=${w},height=${h},left=0,top=0,resizable=yes,scrollbars=no`);
  if(!clockWin){toast('Allow popups to open the full-screen clock');return}
  try{clockWin.moveTo(0,0);clockWin.resizeTo(screen.availWidth,screen.availHeight);clockWin.focus()}catch(e){}
}
const oldInstant=window.instantTool;
window.instantTool=function(t){
  if(t&&t.slug==='full-screen-clock'){openClock();return}
  return oldInstant&&oldInstant(t);
};
const oldOptions=window.toolOptions;
window.toolOptions=function(t){
  if(!t||t.slug!=='full-screen-clock')return oldOptions&&oldOptions(t);
  showQuick('Full-Screen Clock',[
    {label:'🕘 24-hour + Date',primary:true,action:()=>{closeQuick();openClock({format:'24',date:true})}},
    {label:'🕘 12-hour + Date',action:()=>{closeQuick();openClock({format:'12',date:true})}},
    {label:'⏱ 24-hour + Seconds',action:()=>{closeQuick();openClock({format:'24',seconds:true,date:true})}},
    {label:'◻ Clock Only',action:()=>{closeQuick();openClock({format:'24',seconds:false,date:false})}}
  ]);
};
const oldStop=window.universalStop;
window.universalStop=function(){
  try{if(clockWin&&!clockWin.closed)clockWin.close()}catch(e){}clockWin=null;
  return oldStop&&oldStop();
};
window.addEventListener('message',e=>{if(e.origin===location.origin&&e.data?.type==='classroom-companion-return-to-strip'){clockWin=null;try{window.focus()}catch(_){}}});
})();