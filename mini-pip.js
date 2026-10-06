(function(){
'use strict';
if(window.__classroomMiniPiPV5)return;
window.__classroomMiniPiPV5=true;

const api=window.documentPictureInPicture;
if(!api||typeof api.requestWindow!=='function')return;

let pipWindow=null;
let pipSlug=null;
let pipButton=null;
let opening=false;
let expanded=false;
let expandButton=null;

function toolName(button){
  const label=(button.getAttribute('aria-label')||'').trim();
  return (label.split(' • ')[0]||label||'Classroom Companion').trim();
}
function toolUrl(slug){return 'support-tool.html?tool='+encodeURIComponent(slug)+'&v='+Date.now();}
function isCompactShowcase(slug){return slug==='timer-calm-music'||slug==='transition-countdown';}
function pipSize(slug){return isCompactShowcase(slug)?{width:344,height:256,preferInitialWindowPlacement:true}:{width:430,height:320};}
function restoreSize(slug){const s=pipSize(slug);return{width:s.width,height:s.height};}
function expandedSize(){
  const sw=screen.availWidth||1280,sh=screen.availHeight||800;
  return{width:Math.max(760,Math.min(sw-36,1440)),height:Math.max(560,Math.min(sh-72,960))};
}
function clearActive(){
  if(pipButton)pipButton.classList.remove('active','expanded');
  pipWindow=null;pipSlug=null;pipButton=null;expandButton=null;expanded=false;
}
function fallback(button){button.dataset.ccPipBypass='1';button.click();}
function resizeFloating(win,size){
  if(!win||win.closed)return;
  try{win.resizeTo(size.width,size.height)}catch(e){}
}
function enforceCompactSize(win,slug){
  if(!isCompactShowcase(slug)||!win||expanded)return;
  const size=restoreSize(slug);
  const resize=()=>resizeFloating(win,size);
  resize();setTimeout(resize,80);setTimeout(resize,260);
}
function updateExpandUi(){
  if(!expandButton)return;
  expandButton.textContent=expanded?'↙':'⛶';
  expandButton.title=expanded?'Restore compact size':'Expand tool';
  expandButton.setAttribute('aria-label',expanded?'Restore compact size':'Expand tool');
  pipButton?.classList.toggle('expanded',expanded);
}
function toggleExpand(){
  if(!pipWindow||pipWindow.closed||!pipSlug)return;
  expanded=!expanded;
  resizeFloating(pipWindow,expanded?expandedSize():restoreSize(pipSlug));
  updateExpandUi();
  try{pipWindow.focus()}catch(e){}
}
function addExpandControl(win,title){
  const d=win.document;
  const b=d.createElement('button');
  b.type='button';
  b.textContent='⛶';
  b.title='Expand tool';
  b.setAttribute('aria-label','Expand tool');
  b.style.cssText='position:fixed;top:7px;right:48px;z-index:2147483647;width:31px;height:31px;border:1px solid #cbd8df;border-radius:9px;background:rgba(255,255,255,.97);color:#17324d;font:900 17px/1 system-ui;display:grid;place-items:center;cursor:pointer;box-shadow:0 3px 10px rgba(18,32,46,.10);padding:0;';
  b.addEventListener('mouseenter',()=>{b.style.background='#eef7ff';b.style.borderColor='#82bdf2'});
  b.addEventListener('mouseleave',()=>{b.style.background='rgba(255,255,255,.97)';b.style.borderColor='#cbd8df'});
  b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();toggleExpand()});
  d.body.appendChild(b);
  expandButton=b;
  updateExpandUi();
}

async function openFloating(button){
  if(opening)return;
  const slug=button.dataset.slug;
  if(!slug)return;
  if(pipWindow&&!pipWindow.closed&&pipSlug===slug){toggleExpand();return;}

  opening=true;
  try{
    if(pipWindow&&!pipWindow.closed){try{pipWindow.close()}catch(e){}clearActive();}
    const title=toolName(button);
    const win=await api.requestWindow(pipSize(slug));
    if(!win)throw new Error('No Picture-in-Picture window returned');
    enforceCompactSize(win,slug);

    pipWindow=win;pipSlug=slug;pipButton=button;expanded=false;button.classList.add('active');
    const d=win.document;
    d.title=title;
    d.documentElement.style.cssText='margin:0;width:100%;height:100%;overflow:hidden;background:#fff;';
    d.body.style.cssText='margin:0;width:100%;height:100%;overflow:hidden;background:#fff;position:relative;';
    d.body.replaceChildren();

    const frame=d.createElement('iframe');
    frame.src=toolUrl(slug);frame.title=title;frame.allow='autoplay';
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
    addExpandControl(win,title);

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
