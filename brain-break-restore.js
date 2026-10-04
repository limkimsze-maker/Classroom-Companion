(function(){
'use strict';
const S=window.Support;
if(!S||S.slug!=='brain-break'||window.__brainBreakRestoreV1)return;
window.__brainBreakRestoreV1=true;
const target='brain-break.html?sec=30&sound=1&v=20261004bbrestore1';
if(!location.pathname.endsWith('/brain-break.html')) location.replace(target);
})();
