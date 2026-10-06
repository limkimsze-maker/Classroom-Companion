(function(){
'use strict';
if(window.__classroomMiniPiPV4)return;
window.__classroomMiniPiPV4=true;

const api=window.documentPictureInPicture;
if(!api||typeof api.requestWindow!=='function')return;

let pipWindow=null;
let pipSlug=null;
let pipButton=null;
let opening=false;

function toolName(button){
  const label=(button.getAttribute('aria-label')||'').trim();
  return (label.split(' • ')[0]||label||'Classroom Companion').trim();
}
function toolUrl(slug){return 'support-tool.html?tool='+encodeURIComponent(slug)+'&v='+Date.now();}
function isCompactShowcase(slug){return slug==='timer-calm-music'||slug==='transition-countdown';}
function pipSize(slug){return isCompactShowcase(slug)?{width:344,height:256,preferInitialWindowPlacement:true}:{width:430,height:320};}
function clearActive(){if(pipButton)pipButton.classList.remove('active','expanded');pipWindow=null;pipSlug=null;pipButton=null;}
function fallback(button){button.dataset.ccPipBypass='1';button.click();}
function enforceCompactSize(win,slug){
  if(!isCompactShowcase(slug)||!win)return;
  const resize=()=>{try{win.resizeTo(344,256)}catch(e){}};
  resize();setTimeout(resize,80);setTimeout(resize,260);
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
    d.body.style.cssText='margin:0;width:100%;height:100%;overflow:hidden;background:#fff;';
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
