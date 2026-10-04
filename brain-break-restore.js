(function(){
'use strict';
const S=window.Support;
if(!S)return;
if(S.slug==='quote-of-the-day'){
  if(!location.pathname.endsWith('/quote.html')) location.replace('quote.html?v=20261004quoteold2');
  return;
}
if(S.slug!=='brain-break'||window.__brainBreakRestoreV2)return;
window.__brainBreakRestoreV2=true;
const target='brain-break.html?sec=30&sound=1&v=20261004bbmotion1';
if(!location.pathname.endsWith('/brain-break.html')) location.replace(target);
})();
