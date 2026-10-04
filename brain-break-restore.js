(function(){
'use strict';
const S=window.Support;
if(!S||S.slug!=='brain-break'||window.__brainBreakRestoreV2)return;
window.__brainBreakRestoreV2=true;
const target='brain-break.html?sec=30&sound=1&v=20261004bbrestore2';
if(!location.pathname.endsWith('/brain-break.html')) location.replace(target);
})();
