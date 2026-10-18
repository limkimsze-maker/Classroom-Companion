/* Isolated exact ink-on app launcher. The embedded demo is built from
   pinned upstream Vue sources, not our experimental CoMER adapter. */
(function(){
  'use strict';
  const tools=document.querySelector('.tools');
  if(!tools) return;
  const button=document.createElement('button');
  button.type='button';
  button.className='btn soft';
  button.id='inkonExactDemoBtn';
  button.textContent='✍ ink-on demo';
  button.title='Open the original ink-on mathematical handwriting application';
  tools.insertBefore(button,document.getElementById('undoBtn'));

  let overlay=null;
  function close(){
    if(!overlay)return;
    overlay.remove();
    overlay=null;
    button.setAttribute('aria-expanded','false');
    button.focus();
  }
  function open(){
    if(overlay){close();return}
    overlay=document.createElement('div');
    overlay.id='inkonExactDemoOverlay';
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-label','Original ink-on mathematical handwriting demo');
    overlay.style.cssText='position:fixed;inset:8px;z-index:30000;display:flex;flex-direction:column;background:white;border:2px solid #0f766e;border-radius:16px;box-shadow:0 8px 40px #0005;overflow:hidden';
    const top=document.createElement('div');
    top.style.cssText='display:flex;gap:12px;align-items:center;justify-content:space-between;padding:8px 12px;background:#e7f7f4;color:#17324d;font:700 14px system-ui';
    const description=document.createElement('span');
    description.textContent='ink-on original demo · Auto mode · draw inside the demo canvas · local AI';
    const exit=document.createElement('button');
    exit.className='btn';
    exit.type='button';
    exit.textContent='✕ Close';
    exit.onclick=close;
    top.append(description,exit);
    const iframe=document.createElement('iframe');
    iframe.id='inkonExactDemoFrame';
    iframe.title='Original ink-on mathematical handwriting recognition demo';
    iframe.src='vendor/inkon-demo/index.html';
    iframe.style.cssText='border:0;display:block;width:100%;flex:1;min-height:0;background:white';
    // Only same-origin resources in the experimentally isolated Beta.
    overlay.append(top,iframe);
    document.body.appendChild(overlay);
    button.setAttribute('aria-expanded','true');
    exit.focus();
  }
  button.addEventListener('click',open);
  window.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&overlay){e.preventDefault();e.stopImmediatePropagation();close()}
  },true);
})();