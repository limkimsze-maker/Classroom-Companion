(function(){
'use strict';
const S=window.Support;
if(!S||S.slug!=='daily-visual-timetable'||window.__ttDailyVertical)return;
window.__ttDailyVertical=true;
let T=null,observer=null;
function clean(v){return T?.clean?T.clean(v):String(v??'').trim()}
function esc(v){return T?.esc?T.esc(v):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function mins(t){const m=String(t||'').match(/^(\d{1,2}):(\d{2})$/);return m?(+m[1]*60)+(+m[2]):0}
function clock(m){m=(m+1440)%1440;return`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`}
function endTime(times,i){if(i+1<times.length)return times[i+1];if(i>0){const step=Math.max(15,mins(times[i])-mins(times[i-1]));return clock(mins(times[i])+step)}return clock(mins(times[i])+30)}
function sgToday(){try{return new Intl.DateTimeFormat('en-SG',{weekday:'long',timeZone:'Asia/Singapore'}).format(new Date())}catch(e){return'Monday'}}
function injectStyles(){if(document.getElementById('ttDailyVerticalStyle'))return;const s=document.createElement('style');s.id='ttDailyVerticalStyle';s.textContent=`
.ttSchedule{display:flex!important;flex-direction:column!important;gap:8px!important;max-width:780px!important;margin:18px auto!important}
.ttHalfHourRow{display:grid;grid-template-columns:118px 1fr;align-items:stretch;min-height:66px;border:1px solid #dfe7ea;border-radius:18px;overflow:hidden;background:#fff;box-shadow:0 5px 15px rgba(18,32,46,.045);text-align:left}
.ttHalfHourTime{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#f6fafb;color:#17324d;font-weight:1000;border-right:1px solid #dfe7ea;font-variant-numeric:tabular-nums}
.ttHalfHourTime::after{content:'';position:absolute;right:-5px;top:50%;width:9px;height:9px;margin-top:-4.5px;border-radius:50%;background:#0f766e;box-shadow:0 0 0 4px #e7f7f4}
.ttHalfHourStart{font-size:16px;line-height:1}.ttHalfHourEnd{font-size:10px;color:#667085;margin-top:5px;font-weight:850}
.ttHalfHourSubject{display:flex;align-items:center;gap:11px;padding:10px 16px;font-size:22px;font-weight:1000;color:#17324d;line-height:1.08;min-width:0}
.ttHalfHourIcon{font-size:25px;flex:0 0 auto}.ttHalfHourName{overflow-wrap:anywhere}.ttHalfHourRow.empty .ttHalfHourSubject{background:#fbfcfd!important;color:#a2abb3;font-size:15px;font-weight:800}.ttHalfHourRow.current{box-shadow:0 0 0 3px rgba(15,118,110,.18),0 8px 22px rgba(15,118,110,.12);border-color:#72c9be}.ttHalfHourRow.current .ttHalfHourTime{background:#eaf8f5;color:#0b5b55}
@media(max-width:620px){.ttSchedule{gap:6px!important}.ttHalfHourRow{grid-template-columns:92px 1fr;min-height:60px;border-radius:15px}.ttHalfHourStart{font-size:14px}.ttHalfHourEnd{font-size:9px}.ttHalfHourSubject{font-size:18px;padding:9px 12px;gap:8px}.ttHalfHourIcon{font-size:21px}}
`;document.head.appendChild(s)}
function isCurrentSlot(day,start,end){if(day!==sgToday())return false;const now=new Date(),fmt=new Intl.DateTimeFormat('en-SG',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Asia/Singapore'}).format(now),n=mins(fmt),a=mins(start),b=mins(end);return n>=a&&n<b}
function render(){if(!T)return;const root=document.getElementById('ttSchedule');if(!root)return;const active=document.querySelector('[data-tt-day].active');const day=active?.dataset?.ttDay||sgToday();const data=T.load();if(!data||!Array.isArray(data.times))return;const sig=`${data.className||''}|${day}|${data.times.join(',')}|${data.times.map(t=>clean(data.days?.[day]?.[t]||'')).join('|')}`;if(root.dataset.verticalSig===sig&&root.querySelector('.ttHalfHourRow'))return;root.dataset.verticalSig=sig;root.innerHTML=data.times.map((t,i)=>{const end=endTime(data.times,i),subject=clean(data.days?.[day]?.[t]||''),bg=subject?T.colour(subject):'#fbfcfd',cur=isCurrentSlot(day,t,end);return`<div class="ttHalfHourRow ${subject?'':'empty'} ${cur?'current':''}"><div class="ttHalfHourTime"><div class="ttHalfHourStart">${esc(t)}</div><div class="ttHalfHourEnd">to ${esc(end)}</div></div><div class="ttHalfHourSubject" style="background:${bg}">${subject?`<span class="ttHalfHourIcon">${T.icon(subject)}</span><span class="ttHalfHourName">${esc(subject)}</span>`:'<span>—</span>'}</div></div>`}).join('')}
function boot(){injectStyles();render();observer=new MutationObserver(()=>requestAnimationFrame(render));observer.observe(S.panel,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});setInterval(render,60000)}
function wait(){if(window.ClassroomTimetableData){T=window.ClassroomTimetableData;boot()}else setTimeout(wait,80)}
wait();
})();