(function(){
'use strict';
function install(){
  const btn=document.getElementById('ccToolLauncherBtn'),quick=document.getElementById('quickbar');
  if(!btn||!quick||typeof allTools==='undefined'||typeof showQuick!=='function')return;
  if(window.__ccGroupedToolMenuInstalled)return;window.__ccGroupedToolMenuInstalled=true;
  const removed=new Set(['movement-break','end-of-lesson-self-check']);
  const specials=[{icon:'🗂️',title:'Class Organisation',slug:'class-organisation'}];
  const tools=[...new Map([...allTools.filter(t=>!removed.has(t.slug)),...specials].map(t=>[t.slug,t])).values()];
  const specialSlugs=new Set(specials.map(t=>t.slug));
  const cats=[
    {icon:'⏱️',title:'Teach & Pace',hint:'Timers, stages, transitions',slugs:['timer-calm-music','lesson-stages','transition-countdown','focus-intervals','full-screen-clock','date-day']},
    {icon:'🌿',title:'Settle & Manage',hint:'Attention, behaviour, routines',slugs:['attention-signal','calm-reset','noise-level','class-traffic-light','work-mode','behaviour-expectations','pre-correction','help-before-teacher','screen-shade']},
    {icon:'❓',title:'Ask & Check',hint:'Questions, responses, checks',slugs:['think-pair-share','mini-whiteboard-routine','question-spinner','answer-check','confidence-check','participation-counter','engagement-snapshot']},
    {icon:'🎲',title:'Choose & Group',hint:'Pick, randomise, make groups',slugs:['random-number','dice','coin-toss','action-spinner','pick-a-pupil','make-groups']},
    {icon:'💭',title:'Reflect & Extend',hint:'Brain breaks, reflection, extension',slugs:['early-finisher','brain-break','kwl-chart','reflect','quote-of-the-day']},
    {icon:'🗂️',title:'Plan & Organise',hint:'Master sheet, roster, roles, dismissal',slugs:['class-organisation','whole-class-goal','rewards','observation-counter','soundboard','daily-visual-timetable','weekly-visual-timetable']}
  ];
  const style=document.createElement('style');style.textContent=`
  #quickbar.ccGroupedMenu{border:1px solid #cfe0de!important;border-radius:18px!important;background:linear-gradient(180deg,#fff,#f7fbfa)!important;box-shadow:0 18px 46px rgba(18,32,46,.18)!important;padding:12px!important}
  #quickbar.ccGroupedMenu .quick-title{display:none!important}
  #quickbar.ccGroupedMenu .quick-scroll{width:100%!important;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;max-height:min(70vh,620px)!important;overflow:auto!important}
  #quickbar.ccGroupedMenu .quick-value{grid-column:1/-1!important;padding:2px 2px 7px!important;font-size:15px!important;font-weight:1000!important;color:#17324d!important;max-width:none!important}
  #quickbar.ccGroupedMenu .quick-chip{min-height:46px!important;border-radius:13px!important;padding:10px 12px!important;background:#fff!important;border:1px solid #d7e5e3!important;box-shadow:0 3px 10px rgba(15,118,110,.05)!important;font-size:12px!important;font-weight:900!important;white-space:normal!important;text-align:left!important;transition:.12s ease!important}
  #quickbar.ccGroupedMenu .quick-chip:hover{transform:translateY(-1px);background:#f0faf8!important;border-color:#7ccbc0!important}
  #quickbar.ccGroupedMenu.ccHome .quick-chip{min-height:88px!important;background:linear-gradient(145deg,#fff,#eef9f7)!important;white-space:pre-line!important;font-size:12px!important;line-height:1.35!important}
  #quickbar.ccGroupedMenu .ccMenuBack{grid-column:1/-1!important;min-height:38px!important;background:#eaf6f3!important;color:#0b5b55!important;border-color:#a9d8d1!important}
  @media(max-width:700px){#quickbar.ccGroupedMenu .quick-scroll{grid-template-columns:1fr!important}#quickbar.ccGroupedMenu .ccMenuBack{grid-column:1!important}}
  `;document.head.appendChild(style);
  function name(slug){return 'ClassroomCompanionTool_'+String(slug).replace(/[^a-z0-9]/gi,'_')}
  function openOrg(t){const sw=screen.availWidth||1280,sh=screen.availHeight||800,w=window.open('class-organisation.html?v='+Date.now(),name(t.slug),`popup=yes,width=${sw},height=${sh},left=0,top=0,resizable=yes,scrollbars=yes,toolbar=no,location=no,menubar=no,status=no`);if(w){try{w.focus()}catch(e){};try{closeQuick()}catch(e){}}}
  function orgOptions(t,c){showQuick(t.title,[{label:'🗂️ Open master sheet',primary:true,action:()=>openOrg(t)},{label:'▣ Open and use Project for filtered views',action:()=>openOrg(t)},{label:'← Back to '+c.title,action:()=>category(c)}],{withStop:false});prep(false);setTimeout(()=>quick.querySelectorAll('.quick-chip')[2]?.classList.add('ccMenuBack'),0)}
  function openTool(t,c){
    if(specialSlugs.has(t.slug)){orgOptions(t,c);return}
    const current=new URLSearchParams(location.search).get('tool')||'';
    if(t.slug===current){try{closeQuick()}catch(e){};if(typeof toolOptions==='function')toolOptions(t);return}
    const sw=screen.availWidth||1280,sh=screen.availHeight||800,w=Math.min(520,sw),h=Math.min(680,sh),left=Math.max(0,Math.min(sw-w,(window.screenX||100)+42)),top=Math.max(0,Math.min(sh-h,(window.screenY||60)+36));
    const child=window.open('tool-window.html?tool='+encodeURIComponent(t.slug)+'&v='+Date.now(),name(t.slug),`popup=yes,width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes,toolbar=no,location=no,menubar=no,status=no`);
    if(child){try{child.focus()}catch(e){};try{closeQuick()}catch(e){}}
  }
  function prep(home=false){quick.classList.add('ccGroupedMenu');quick.classList.toggle('ccHome',home)}
  function home(){const items=[{type:'value',label:'What do you need right now?'}];cats.forEach(c=>items.push({label:`${c.icon} ${c.title}\n${c.hint}`,action:()=>category(c)}));showQuick('All Tools',items,{withStop:false});prep(true)}
  function category(c){const items=[{type:'value',label:`${c.icon} ${c.title}`},{label:'← Back to categories',action:home}];c.slugs.forEach(slug=>{const t=tools.find(x=>x.slug===slug);if(t)items.push({label:`${t.icon} ${t.title}`,action:()=>openTool(t,c)})});showQuick('All Tools',items,{withStop:false});prep(false);setTimeout(()=>quick.querySelectorAll('.quick-chip')[0]?.classList.add('ccMenuBack'),0)}
  btn.onclick=home;
  const mo=new MutationObserver(()=>{if(!quick.classList.contains('show'))quick.classList.remove('ccGroupedMenu','ccHome')});mo.observe(quick,{attributes:true,attributeFilter:['class']});
}
setTimeout(install,0);
})();