(function(){
'use strict';
const S=window.Support;
if(!S||S.slug!=='daily-visual-timetable'||window.__ttDailyProjection)return;
window.__ttDailyProjection=true;
const style=document.createElement('style');
style.id='ttDailyProjectionStyle';
style.textContent=`
@media (min-width:901px){
  .stage:has(#ttSchedule){max-width:1600px!important;align-items:flex-start!important;padding-top:4px}
  .panel:has(#ttSchedule){width:min(1500px,calc(100vw - 36px))!important;max-width:none!important;padding:16px 24px 22px!important;border-radius:24px!important}
  .panel:has(#ttSchedule) .classBar{margin-bottom:8px!important}
  .panel:has(#ttSchedule) .ttManagedNav{margin:4px auto 10px!important;gap:10px!important}
  .panel:has(#ttSchedule) .ttManagedNav .btn{min-height:46px!important;padding:10px 17px!important;font-size:16px!important}
  .ttManagedHead{max-width:1240px!important;margin:6px auto 6px!important;align-items:center!important}
  .ttManagedHead h2{font-size:clamp(42px,4vw,64px)!important;line-height:1!important}
  .ttCompactEyebrow{font-size:13px!important;letter-spacing:.14em!important}
  .ttSavedMeta{font-size:14px!important;margin-top:5px!important}
  .ttManagedClass{font-size:16px!important;padding:9px 14px!important}
  .ttDayTabs{margin:10px auto 14px!important;gap:9px!important}
  .ttDayTabs .btn{min-width:78px!important;min-height:46px!important;font-size:17px!important;padding:9px 15px!important}
  .ttSchedule{max-width:1240px!important;width:100%!important;gap:9px!important;margin:12px auto 0!important}
  .ttSlotRow{grid-template-columns:190px minmax(0,1fr)!important;min-height:76px!important;border-radius:20px!important;border:2px solid #dbe5e8!important;box-shadow:0 7px 18px rgba(18,32,46,.055)!important}
  .ttSlotTime{background:#f4f8f9!important;border-right:2px solid #dbe5e8!important}
  .ttSlotTime:after{width:12px!important;height:12px!important;right:-7px!important;margin-top:-6px!important;box-shadow:0 0 0 5px #e7f7f4!important}
  .ttSlotStart{font-size:27px!important;letter-spacing:-.02em!important}
  .ttSlotEnd{font-size:14px!important;margin-top:5px!important}
  .ttSlotSubject{padding:12px 28px!important;gap:16px!important;font-size:clamp(28px,2.2vw,38px)!important;justify-content:flex-start!important}
  .ttSlotIcon{font-size:36px!important}
  .ttSlotName{letter-spacing:-.02em!important}
  .ttSlotRow.empty .ttSlotSubject{font-size:20px!important}
  .ttSlotRow.current{border-color:#55bbae!important;box-shadow:0 0 0 4px rgba(15,118,110,.18),0 10px 26px rgba(15,118,110,.14)!important;transform:scale(1.008)}
}
@media (min-width:1200px) and (min-height:780px){
  .ttSlotRow{min-height:82px!important}
  .ttSlotStart{font-size:29px!important}
  .ttSlotSubject{font-size:clamp(30px,2.25vw,40px)!important}
}
@media (max-width:900px){
  .ttSchedule{max-width:100%!important}
}
`;
document.head.appendChild(style);
})();