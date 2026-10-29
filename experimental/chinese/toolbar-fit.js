(function(){
'use strict';
// Alpha only. Keep original controls and their event handlers intact.
if(!/\/whiteboard-chinese-trial\.html$/i.test(location.pathname))return;
const bar=document.querySelector('header.top .tools');
if(!bar)return;
let scheduled=false,working=false;
const kinds=['draw','files','create'];
function visibleChildren(group){
 return [...group.children].filter(el=>!el.hidden&&getComputedStyle(el).display!=='none');
}
function metrics(group){
 const cs=getComputedStyle(group);
 const children=visibleChildren(group);
 const gap=parseFloat(cs.columnGap)||parseFloat(cs.gap)||0;
 const padding=(parseFloat(cs.paddingLeft)||0)+(parseFloat(cs.paddingRight)||0);
 const border=(parseFloat(cs.borderLeftWidth)||0)+(parseFloat(cs.borderRightWidth)||0);
 const width=children.reduce((sum,el)=>{
  const s=getComputedStyle(el);
  return sum+el.getBoundingClientRect().width+(parseFloat(s.marginLeft)||0)+(parseFloat(s.marginRight)||0);
 },padding+border+Math.max(0,children.length-1)*gap);
 return {children,gap,padding,border,width};
}
function fit(){
 if(working)return;
 const groups=Object.fromEntries(kinds.map(k=>[k,bar.querySelector('.ccToolGroup[data-kind="'+k+'"]')]));
 if(!kinds.every(k=>groups[k]))return;
 working=true;
 try{
  // Measure at natural size before changing any allocations, preventing drift.
  for(const k of kinds)
   for(const el of groups[k].children)el.style.zoom='1';
  const natural=Object.fromEntries(kinds.map(k=>[k,metrics(groups[k])]));
  const a=Math.max(1,natural.draw.width),b=Math.max(1,natural.files.width);
  bar.style.setProperty('--cc-draw-weight',a.toFixed(2)+'fr');
  bar.style.setProperty('--cc-files-weight',b.toFixed(2)+'fr');
  for(const k of kinds){
   const group=groups[k],m=natural[k];
   if(!m.children.length)continue;
   const inner=Math.max(1,group.clientWidth-m.padding-m.border-m.gap*Math.max(0,m.children.length-1)-2);
   const content=Math.max(1,m.width-m.padding-m.border-m.gap*Math.max(0,m.children.length-1));
   const ratio=Math.max(.1,Math.min(1,inner/content));
   for(const el of m.children)el.style.zoom=String(ratio);
  }
 }finally{working=false}
}
function schedule(){
 if(scheduled)return;
 scheduled=true;
 requestAnimationFrame(()=>{scheduled=false;fit()});
}
function start(){
 schedule();
 const header=document.querySelector('header.top');
 if(typeof ResizeObserver!=='undefined'){
  const resize=new ResizeObserver(schedule);
  resize.observe(header);
  resize.observe(bar);
 }
 const observer=new MutationObserver(schedule);
 for(const k of kinds){
  const group=bar.querySelector('.ccToolGroup[data-kind="'+k+'"]');
  if(group)observer.observe(group,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});
 }
 observer.observe(document.body,{attributes:true,attributeFilter:['class']});
 window.addEventListener('resize',schedule,{passive:true});
 window.addEventListener('orientationchange',schedule,{passive:true});
 window.addEventListener('cc-document-opened',schedule);
 window.addEventListener('cc-document-closed',schedule);
 if(document.fonts&&document.fonts.ready)document.fonts.ready.then(schedule);
 setTimeout(schedule,200);
 setTimeout(schedule,950);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
else start();
})();
