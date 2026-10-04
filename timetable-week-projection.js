(function(){
'use strict';
const S=window.Support;
if(!S||S.slug!=='daily-visual-timetable'||window.__ttWeekProjection)return;
window.__ttWeekProjection=true;
const style=document.createElement('style');
style.id='ttWeekProjectionStyle';
style.textContent=`
/* Weekly view: projection-first, full week visible without horizontal scrolling. */
.ttWeekShell{width:100%!important;max-width:1480px!important;margin:12px auto 0!important}
.ttWeekWrap{width:100%!important;overflow:visible!important;border:2px solid #dbe5e8!important;border-radius:22px!important;background:#fff!important;box-shadow:0 8px 24px rgba(18,32,46,.06)!important}
.ttWeekTable{width:100%!important;min-width:0!important;max-width:100%!important;table-layout:fixed!important;border-collapse:separate!important;border-spacing:0!important}
.ttWeekTable th,.ttWeekTable td{min-width:0!important;padding:6px!important;overflow:hidden!important}
.ttWeekTable th:first-child{width:116px!important}
.ttWeekTable thead th{height:54px!important;font-size:17px!important;letter-spacing:.02em!important;background:#eaf8f5!important;color:#0b5b55!important}
.ttWeekTime{font-size:16px!important;color:#17324d!important;background:#f4f8f9!important;white-space:normal!important;line-height:1.15!important}
.ttWeekCell{width:100%!important;min-width:0!important;min-height:82px!important;border-radius:14px!important;padding:10px 7px!important;font-size:clamp(16px,1.45vw,23px)!important;line-height:1.08!important;overflow-wrap:anywhere!important;word-break:normal!important;hyphens:auto!important;box-shadow:inset 0 0 0 1px rgba(23,50,77,.05)!important}
.ttWeekEmpty{background:#fbfcfd!important;color:#b0b7bf!important;font-size:15px!important}
.ttWeekHint{font-size:14px!important;margin:6px auto 10px!important}
.ttWeekActions{margin-top:10px!important}
.ttWeekInput{min-width:0!important;width:100%!important;min-height:64px!important;padding:6px!important;font-size:15px!important;overflow-wrap:anywhere!important}
@media (min-width:901px){
  .stage:has(.ttWeekShell){max-width:1600px!important;align-items:flex-start!important;padding-top:4px!important}
  .panel:has(.ttWeekShell){width:min(1540px,calc(100vw - 28px))!important;max-width:none!important;padding:14px 18px 20px!important;border-radius:24px!important}
  .panel:has(.ttWeekShell) .classBar{margin-bottom:8px!important}
  .panel:has(.ttWeekShell) .ttManagedNav{margin:4px auto 8px!important;gap:10px!important}
  .panel:has(.ttWeekShell) .ttManagedNav .btn{min-height:44px!important;padding:9px 15px!important;font-size:15px!important}
  .panel:has(.ttWeekShell) .ttCompactEyebrow{font-size:13px!important;letter-spacing:.14em!important}
  .panel:has(.ttWeekShell) .ttCompactTitle{font-size:clamp(38px,3.4vw,54px)!important;line-height:1!important;margin-top:2px!important}
  .panel:has(.ttWeekShell) .ttSavedMeta{font-size:14px!important;margin-top:4px!important}
}
@media (min-width:1200px) and (min-height:760px){
  .ttWeekTable thead th{height:58px!important;font-size:18px!important}
  .ttWeekCell{min-height:90px!important;font-size:clamp(18px,1.5vw,25px)!important}
  .ttWeekTime{font-size:17px!important}
}
@media (max-width:900px){
  .ttWeekShell{max-width:100%!important}
  .ttWeekWrap{overflow:hidden!important;border-radius:16px!important}
  .ttWeekTable th:first-child{width:78px!important}
  .ttWeekTable th,.ttWeekTable td{padding:4px!important}
  .ttWeekTable thead th{height:42px!important;font-size:12px!important}
  .ttWeekTime{font-size:11px!important}
  .ttWeekCell{min-height:58px!important;padding:6px 4px!important;font-size:11px!important;border-radius:9px!important}
  .ttWeekEmpty{font-size:10px!important}
  .ttWeekInput{min-height:52px!important;font-size:11px!important;padding:4px!important}
}
@media (max-width:620px){
  .ttWeekTable th:first-child{width:60px!important}
  .ttWeekTable th,.ttWeekTable td{padding:2px!important}
  .ttWeekTable thead th{height:36px!important;font-size:10px!important}
  .ttWeekTime{font-size:9px!important;line-height:1.05!important}
  .ttWeekCell{min-height:48px!important;padding:4px 2px!important;font-size:9px!important;line-height:1.05!important;border-radius:7px!important}
  .ttWeekEmpty{font-size:9px!important}
  .ttWeekInput{min-height:44px!important;font-size:9px!important;padding:2px!important;border-radius:7px!important}
  .ttWeekHint{font-size:11px!important}
}
`;
document.head.appendChild(style);
})();