(function(){
'use strict';
if(window.__classroomMiniPiPV8)return;
window.__classroomMiniPiPV8=true;

const api=window.documentPictureInPicture;
if(!api||typeof api.requestWindow!=='function')return;

let pipWindow=null;
let pipSlug=null;
let pipButton=null;
let opening=false;
let fullscreenWindow=null;

function toolName(button){
  const label=(button.getAttribute('aria-label')||'').trim();
  return (label.split(' • ')[0]||label||'Classroom Companion').trim();
}
function toolUrl(slug,display){
  return 'support-tool.html?tool='+encodeURIComponent(slug)+(display?'&display='+encodeURIComponent(display):'')+'&v='+Date.now();
}
function isCompactShowcase(slug){return slug==='timer-calm-music'||slug==='transition-countdown';}
function pipSize(slug){return isCompactShowcase(slug)?{width:344,height:256,preferInitialWindowPlacement:true}:{width:430,height:320};}
function clearActive(){
  if(pipButton)pipButton.classList.remove('active','expanded');
  pipWindow=null;pipSlug=null;pipButton=null;
}
function fallback(button){button.dataset.ccPipBypass='1';button.click();}
function resizeFloating(win,size){
  if(!win||win.closed)return;
  try{win.resizeTo(size.width,size.height)}catch(e){}
}
function enforceCompactSize(win,slug){
  if(!isCompactShowcase(slug)||!win)return;
  const size=pipSize(slug);
  const resize=()=>resizeFloating(win,{width:size.width,height:size.height});
  resize();setTimeout(resize,80);setTimeout(resize,260);
}
function screenSize(){
  const s=window.screen||{};
  return{
    width:Math.max(800,s.availWidth||s.width||1280),
    height:Math.max(600,s.availHeight||s.height||800),
    left:Number.isFinite(s.availLeft)?s.availLeft:0,
    top:Number.isFinite(s.availTop)?s.availTop:0
  };
}
function styleButton(button,primary=false){
  button.style.cssText=[
    'height:42px','min-width:42px','padding:0 13px','border-radius:12px',
    'border:1px solid '+(primary?'#0f766e':'#cad7df'),
    'background:'+(primary?'#0f766e':'rgba(255,255,255,.97)'),
    'color:'+(primary?'#fff':'#17324d'),
    'font:900 14px/1 system-ui','cursor:pointer','box-shadow:0 5px 16px rgba(18,32,46,.14)',
    'display:flex','align-items:center','justify-content:center','gap:6px','white-space:nowrap'
  ].join(';');
}
function updateFullscreenButton(win,button){
  if(!win||win.closed||!button)return;
  const active=!!win.document.fullscreenElement;
  button.textContent=active?'↙ Exit full screen':'⛶ Full screen';
  button.title=active?'Exit full screen':'Enter full screen';
  button.setAttribute('aria-label',active?'Exit full screen':'Enter full screen');
}
async function toggleRealFullscreen(win,button){
  if(!win||win.closed)return;
  try{
    if(win.document.fullscreenElement){await win.document.exitFullscreen();}
    else if(win.document.documentElement.requestFullscreen){await win.document.documentElement.requestFullscreen({navigationUI:'hide'});}
  }catch(e){}
  updateFullscreenButton(win,button);
}
function injectFullscreenLayout(frame){
  try{
    const fd=frame.contentDocument;if(!fd)return;
    const s=fd.createElement('script');
    s.src='fullscreen-tool-layout.js?v='+Date.now();
    fd.body.appendChild(s);
  }catch(e){}
}
function buildFullscreenWindow(win,slug,title){
  const d=win.document;
  d.open();
  d.write('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title></title></head><body></body></html>');
  d.close();
  d.title=title+' • Full screen';
  d.documentElement.style.cssText='margin:0;width:100%;height:100%;overflow:hidden;background:#0b1520;';
  d.body.style.cssText='margin:0;width:100%;height:100%;overflow:hidden;background:#fff;position:relative;';

  const frame=d.createElement('iframe');
  frame.src=toolUrl(slug,'fullscreen');
  frame.title=title;
  frame.allow='autoplay; fullscreen';
  frame.setAttribute('allowfullscreen','');
  frame.style.cssText='position:absolute;inset:0;display:block;width:100%;height:100%;border:0;margin:0;padding:0;background:#fff;';
  if(isCompactShowcase(slug))frame.addEventListener('load',()=>injectFullscreenLayout(frame),{once:true});
  d.body.appendChild(frame);

  const controls=d.createElement('div');
  controls.style.cssText='position:fixed;top:10px;right:12px;z-index:2147483647;display:flex;gap:8px;align-items:center;';

  const fs=d.createElement('button');
  fs.type='button';
  styleButton(fs,true);
  fs.textContent='⛶ Full screen';
  fs.title='Enter full screen';
  fs.setAttribute('aria-label','Enter full screen');
  fs.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();toggleRealFullscreen(win,fs)});

  const close=d.createElement('button');
  close.type='button';
  styleButton(close,false);
  close.textContent='✕';
  close.title='Close';
  close.setAttribute('aria-label','Close full screen tool');
  close.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();try{win.close()}catch(err){}});

  controls.append(fs,close);
  d.body.appendChild(controls);

  const hint=d.createElement('div');
  hint.textContent='If Chrome keeps its bars visible, click “⛶ Full screen” once.';
  hint.style.cssText='position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:2147483646;background:rgba(23,50,77,.92);color:#fff;padding:9px 14px;border-radius:999px;font:800 12px/1.2 system-ui;box-shadow:0 5px 18px rgba(0,0,0,.18);opacity:0;transition:opacity .18s;pointer-events:none;';
  d.body.appendChild(hint);

  d.addEventListener('fullscreenchange',()=>{
    updateFullscreenButton(win,fs);
    if(d.fullscreenElement)hint.style.opacity='0';
  });

  setTimeout(()=>{
    if(!win.closed&&!d.fullscreenElement){hint.style.opacity='1';setTimeout(()=>{hint.style.opacity='0'},3500);}
  },500);

  return fs;
}
function openTrueFullscreen(slug,title){
  const s=screenSize();
  const name='ClassroomCompanionFull_'+slug.replace(/[^a-z0-9_-]/gi,'_');
  const features=[
    'popup=yes','resizable=yes','scrollbars=no','menubar=no','toolbar=no','location=no','status=no',
    'left='+s.left,'top='+s.top,'width='+s.width,'height='+s.height
  ].join(',');

  let win=null;
  try{win=window.open('',name,features)}catch(e){}
  if(!win){
    if(pipWindow&&!pipWindow.closed){resizeFloating(pipWindow,{width:s.width-20,height:s.height-70});}
    return false;
  }

  fullscreenWindow=win;
  try{win.moveTo(s.left,s.top)}catch(e){}
  try{win.resizeTo(s.width,s.height)}catch(e){}
  const fsButton=buildFullscreenWindow(win,slug,title);
  try{win.focus()}catch(e){}

  try{
    const p=win.document.documentElement.requestFullscreen&&win.document.documentElement.requestFullscreen({navigationUI:'hide'});
    if(p&&typeof p.then==='function')p.then(()=>updateFullscreenButton(win,fsButton)).catch(()=>{});
  }catch(e){}

  setTimeout(()=>{
    if(pipWindow&&!pipWindow.closed){try{pipWindow.close()}catch(e){}}
  },120);
  return true;
}
function addFullscreenControl(win,title,slug){
  const d=win.document;
  const b=d.createElement('button');
  b.type='button';
  b.textContent='⛶';
  b.title='Full screen';
  b.setAttribute('aria-label','Open tool full screen');
  b.style.cssText='position:fixed;top:7px;right:48px;z-index:2147483647;width:31px;height:31px;border:1px solid #cbd8df;border-radius:9px;background:rgba(255,255,255,.97);color:#17324d;font:900 17px/1 system-ui;display:grid;place-items:center;cursor:pointer;box-shadow:0 3px 10px rgba(18,32,46,.10);padding:0;';
  b.addEventListener('mouseenter',()=>{b.style.background='#eef7ff';b.style.borderColor='#82bdf2'});
  b.addEventListener('mouseleave',()=>{b.style.background='rgba(255,255,255,.97)';b.style.borderColor='#cbd8df'});
  b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openTrueFullscreen(slug,title)});
  d.body.appendChild(b);
}

async function openFloating(button){
  if(opening)return;
  const slug=button.dataset.slug;
  if(!slug)return;
  if(pipWindow&&!pipWindow.closed&&pipSlug===slug){try{pipWindow.focus()}catch(e){}return;}

  opening=true;
  try{
    if(pipWindow&&!pipWindow.closed){try{pipWindow.close()}catch(e){}clearActive();}
    const title=toolName(button);
    const win=await api.requestWindow(pipSize(slug));
    if(!win)throw new Error('No Picture-in-Picture window returned');
    enforceCompactSize(win,slug);

    pipWindow=win;pipSlug=slug;pipButton=button;button.classList.add('active');
    const d=win.document;
    d.title=title;
    d.documentElement.style.cssText='margin:0;width:100%;height:100%;overflow:hidden;background:#fff;';
    d.body.style.cssText='margin:0;width:100%;height:100%;overflow:hidden;background:#fff;position:relative;';
    d.body.replaceChildren();

    const frame=d.createElement('iframe');
    frame.src=toolUrl(slug);frame.title=title;frame.allow='autoplay; fullscreen';
    frame.setAttribute('allowfullscreen','');
    frame.style.cssText='display:block;width:100%;height:100%;border:0;margin:0;padding:0;background:#fff;';
    if(isCompactShowcase(slug)){
      frame.addEventListener('load',()=>{
        enforceCompactSize(win,slug);
        try{
          const fd=frame.contentDocument;if(!fd)return;
          const fresh=fd.createElement('script');
          fresh.src=(slug==='timer-calm-music'?'timer-calm-music.js':'transition-compact-design.js')+'?v='+Date.now();
          fd.body.appendChild(fresh);
        }catch(e){}
      },{once:true});
    }
    d.body.appendChild(frame);
    addFullscreenControl(win,title,slug);

    win.addEventListener('pagehide',()=>{if(pipWindow===win)clearActive();},{once:true});
  }catch(err){
    clearActive();
    console.warn('Classroom Companion floating mini tool unavailable; using popup fallback.',err);
    fallback(button);
  }finally{opening=false;}
}

document.addEventListener('click',function(event){
  const button=event.target&&event.target.closest?event.target.closest('#ccSmartBar .ccTool.mini'):null;
  if(!button)return;
  if(button.dataset.ccPipBypass==='1'){delete button.dataset.ccPipBypass;return;}
  event.preventDefault();event.stopImmediatePropagation();openFloating(button);
},true);
})();
