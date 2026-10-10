(function(){
'use strict';
if(window.__ccEmbeddedFullToolsV1)return;window.__ccEmbeddedFullToolsV1=true;
const ORDER=['timer-calm-music','transition-countdown','attention-signal','noise-level','custom-text','whiteboard','question-spinner','confidence-check','pick-a-pupil','make-groups','brain-break','reflect','quote-of-the-day','class-organisation','daily-duty-roster','pupil-reward-points','group-reward-points','daily-visual-timetable'];
const LEGACY=['timer-calm-music','transition-countdown','attention-signal','noise-level','question-spinner','confidence-check','pick-a-pupil','make-groups','brain-break','reflect','quote-of-the-day','class-organisation','daily-visual-timetable'];
const META={
 'custom-text':{icon:'📝',en:['Custom Text / Instructions','Show clear instructions.'],zh:['自定义文字／指示','显示清楚的课堂指示。'],ms:['Teks / Arahan Tersuai','Paparkan arahan yang jelas.'],ta:['தனிப்பயன் உரை / வழிமுறைகள்','தெளிவான வழிமுறைகளைக் காட்டவும்.'],url:'custom-text.html'},
 'whiteboard':{icon:'✏️',en:['Whiteboard','Write and draw for the class.'],zh:['白板','为全班书写和绘画。'],ms:['Papan Putih','Tulis dan lukis untuk kelas.'],ta:['வெள்ளைப் பலகை','வகுப்பிற்காக எழுதவும் வரையவும்.'],url:'whiteboard.html'},
 'daily-duty-roster':{icon:'🧹',en:['Daily Duty Roster','Show today’s class duties.'],zh:['每日值日表','显示今天的班级值日任务。'],ms:['Jadual Tugas Harian','Paparkan tugas kelas hari ini.'],ta:['தினசரி கடமைப் பட்டியல்','இன்றைய வகுப்பு கடமைகளைக் காட்டவும்.'],url:'daily-duty-roster.html'},
 'pupil-reward-points':{icon:'⭐',en:['Pupil Reward Points','Track pupil reward points.'],zh:['学生奖励分数','记录学生奖励分数。'],ms:['Mata Ganjaran Murid','Jejaki mata ganjaran murid.'],ta:['மாணவர் வெகுமதி புள்ளிகள்','மாணவர் வெகுமதி புள்ளிகளைப் பதிவு செய்யவும்.'],url:'reward-points.html?mode=pupil'},
 'group-reward-points':{icon:'🏆',en:['Group Reward Points','Track group reward points.'],zh:['小组奖励分数','记录小组奖励分数。'],ms:['Mata Ganjaran Kumpulan','Jejaki mata ganjaran kumpulan.'],ta:['குழு வெகுமதி புள்ளிகள்','குழு வெகுமதி புள்ளிகளைப் பதிவு செய்யவும்.'],url:'reward-points.html?mode=group'}
};
function lang(){const x=(document.documentElement.lang||'en').toLowerCase();return x.startsWith('zh')?'zh':x.startsWith('ms')?'ms':x.startsWith('ta')?'ta':'en'}
function label(meta){return meta[lang()]||meta.en}
function directOpen(slug){const m=META[slug];if(!m)return;const sw=screen.availWidth||1280,sh=screen.availHeight||800;const sep=m.url.includes('?')?'&':'?';const url=m.url+sep+'v='+Date.now();const w=window.open(url,'ClassroomCompanionTool_'+slug.replace(/[^a-z0-9]/gi,'_'),`popup=yes,width=${sw},height=${sh},left=0,top=0,resizable=yes,scrollbars=yes,toolbar=no,location=no,menubar=no,status=no`);if(w)try{w.focus()}catch(e){}
 const menu=document.getElementById('ccEmbeddedMenu'),btn=document.getElementById('ccEmbeddedButton');menu?.classList.remove('show');btn?.classList.remove('active')}
function make(slug){const m=META[slug],a=label(m),b=document.createElement('button');b.type='button';b.className='ccEmbeddedTool';b.dataset.ccSlug=slug;b.innerHTML=`<span class="ccIcon">${m.icon}</span><span class="ccTitle"></span><span class="ccHint"></span>`;b.onclick=e=>{e.stopPropagation();directOpen(slug)};return b}
let busy=false,lastList=null,observer=null;
function sync(){if(busy)return;const list=document.getElementById('ccEmbeddedList');if(!list)return;if(list!==lastList){observer?.disconnect();lastList=list;observer=new MutationObserver(()=>setTimeout(sync,0));observer.observe(list,{childList:true})}busy=true;try{
 let nodes=[...list.children];if(nodes.length===LEGACY.length&&!nodes.some(x=>x.dataset.ccSlug))nodes.forEach((b,i)=>b.dataset.ccSlug=LEGACY[i]);
 const by=new Map([...list.children].filter(x=>x.dataset.ccSlug).map(x=>[x.dataset.ccSlug,x]));
 for(const slug of Object.keys(META))if(!by.has(slug)){const b=make(slug);by.set(slug,b)}
 for(const slug of Object.keys(META)){const b=by.get(slug),m=META[slug],a=label(m);if(b){b.querySelector('.ccTitle').textContent=a[0];b.querySelector('.ccHint').textContent=a[1]}}
 for(const slug of ORDER){const b=by.get(slug);if(b)list.appendChild(b)}
 }finally{busy=false}}
let tries=0;const timer=setInterval(()=>{sync();if(++tries>240)clearInterval(timer)},250);setTimeout(sync,0);
})();
