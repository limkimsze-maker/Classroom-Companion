(function(){
'use strict';
window.__MOE_SAFE_MODE__=true;
const deny=name=>function(){throw new Error(`${name} is disabled in MOE Safe Mode`)};
try{window.fetch=()=>Promise.reject(new Error('Network requests are disabled in MOE Safe Mode'))}catch{}
try{window.XMLHttpRequest=function(){throw new Error('XMLHttpRequest is disabled in MOE Safe Mode')}}catch{}
try{window.WebSocket=function(){throw new Error('WebSocket is disabled in MOE Safe Mode')}}catch{}
try{window.EventSource=function(){throw new Error('EventSource is disabled in MOE Safe Mode')}}catch{}
try{if(navigator&&typeof navigator.sendBeacon==='function')navigator.sendBeacon=()=>false}catch{}
try{window.open=deny('window.open')}catch{}
window.addEventListener('securitypolicyviolation',e=>{
 console.warn('[MOE Safe Mode] Blocked by Content Security Policy:',e.violatedDirective,e.blockedURI);
});
})();
