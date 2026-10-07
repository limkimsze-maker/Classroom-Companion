(function(){
'use strict';
const S=window.Support;
if(!S)return;
if(S.slug==='quote-of-the-day'){
  if(!location.pathname.endsWith('/quote-editable.html')) location.replace('quote-editable.html?v=20261007edit1');
  return;
}
if(S.slug==='brain-break'){
  if(!location.pathname.endsWith('/brain-break-editable.html')) location.replace('brain-break-editable.html?sec=30&sound=1&v=20261007edit1');
  return;
}
if((S.slug==='question-spinner'||S.slug==='reflect')&&!document.getElementById('ccEditableContentSettingsScript')){
  const script=document.createElement('script');
  script.id='ccEditableContentSettingsScript';
  script.src='editable-content-settings.js?v=20261007edit1';
  document.body.appendChild(script);
}
})();
