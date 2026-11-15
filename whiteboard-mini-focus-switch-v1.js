/* One-tap Teach / Mini Whiteboard switch for the isolated focused beta.
   The classroom iframe remains mounted and connected when hidden. */
(function(){
'use strict';
const mini=window.MiniWhiteboard,modal=document.getElementById('ccMiniModal');
if(!mini||!modal||!document.body)return;
const css=document.createElement('style');css.textContent=[
 '#ccFocusSwitch{position:fixed;bottom:10px;right:12px;z-index:2147483205;border:2px solid #fff;border-radius:50px;box-shadow:0 5px 20px #17324d66;padding:11px 16px;background:#0f766e;color:white;font:850 14px system-ui;cursor:pointer;max-width:calc(100vw - 20px)}',
 '#ccFocusSwitch[aria-pressed=true]{background:#17324d}',
 '@media(max-width:600px){#ccFocusSwitch{font-size:12px;padding:9px 11px;right:5px;bottom:5px}}'
].join('\n');document.head.appendChild(css);
const toggle=document.createElement('button');toggle.id='ccFocusSwitch';toggle.type='button';
toggle.title='Switch between teaching whiteboard and live pupil work without resetting the class';
document.body.appendChild(toggle);
function sync(){
 const active=mini.isOpen();
 toggle.textContent=active?'✏ Teach / Reteach':'▣ Mini Whiteboard · Monitor';
 toggle.setAttribute('aria-pressed',String(active));
 toggle.setAttribute('aria-label',active?'Return to Whiteboard Smart to reteach':'Open Mini Whiteboard pupil monitoring');
}
function switchMode(){mini.isOpen()?mini.close():mini.open();sync()}
toggle.onclick=switchMode;
new MutationObserver(sync).observe(modal,{attributes:true,attributeFilter:['hidden']});
window.addEventListener('message',e=>{
 const frame=document.getElementById('ccMiniFrame');
 if(e.origin!==location.origin||e.source!==frame?.contentWindow)return;
 if(e.data?.type==='ccMiniFocusTeach'){mini.close();sync()}
 else if(e.data?.type==='ccMiniFocusMonitor'){mini.open();sync()}
});
document.addEventListener('keydown',e=>{
 if(e.key!=='F8'||e.repeat||e.altKey||e.ctrlKey||e.metaKey)return;
 const editable=e.target?.closest?.('input,textarea,select,[contenteditable=true]');
 if(editable)return;
 e.preventDefault();switchMode();
},true);
sync();
})();