(function(){
'use strict';
let brainWin=null;
function openBrainBreak(sec=30,sound=true,index=null){
  const q=new URLSearchParams({sec:String(sec),sound:sound?'1':'0'});if(index!==null)q.set('i',String(index));
  const url='brain-break.html?'+q.toString()+'&v=20261003bb2';
  try{if(brainWin&&!brainWin.closed){brainWin.location.href=url;brainWin.focus();return}}catch(e){}
  const w=Math.max(900,screen.availWidth||1200),h=Math.max(650,screen.availHeight||800);
  brainWin=window.open(url,'ClassroomCompanionBrainBreak',`popup=yes,width=${w},height=${h},left=0,top=0,resizable=yes,scrollbars=no`);
  if(!brainWin){toast('Allow popups to open Brain Break');return}
  try{brainWin.moveTo(0,0);brainWin.resizeTo(w,h)}catch(e){}
  brainWin.focus();
}
const names=['March & Move','Reach for the Sky','Balance Challenge','Shoulder Roll','Star Jump Energy','Shake It Out','Figure 8','Touch Your Toes'];
const oldInstant=window.instantTool;
window.instantTool=function(t){
  if(t&&t.slug==='brain-break'){openBrainBreak(30,true,null);return}
  return oldInstant&&oldInstant(t);
};
const oldOptions=window.toolOptions;
window.toolOptions=function(t){
  if(!t||t.slug!=='brain-break')return oldOptions&&oldOptions(t);
  const items=[
    {label:'⚡ Random + Sound',primary:true,action:()=>{closeQuick();openBrainBreak(30,true,null)}},
    {label:'🔇 Random Silent',action:()=>{closeQuick();openBrainBreak(30,false,null)}},
    {label:'30 sec',action:()=>{closeQuick();openBrainBreak(30,true,null)}},
    {label:'45 sec',action:()=>{closeQuick();openBrainBreak(45,true,null)}},
    {label:'60 sec',action:()=>{closeQuick();openBrainBreak(60,true,null)}},
    ...names.map((name,i)=>({label:name,action:()=>{closeQuick();openBrainBreak(30,true,i)}}))
  ];
  showQuick('Brain Break',items);
};
const oldStop=window.universalStop;
window.universalStop=function(){
  try{if(brainWin&&!brainWin.closed)brainWin.close()}catch(e){}brainWin=null;
  return oldStop&&oldStop();
};
window.addEventListener('message',e=>{if(e.origin===location.origin&&e.data?.type==='classroom-companion-return-to-strip'){try{window.focus()}catch(_){}}});
})();