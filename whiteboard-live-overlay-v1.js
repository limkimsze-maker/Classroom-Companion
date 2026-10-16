(function(){
'use strict';
if(typeof wrap==='undefined'||typeof canvas==='undefined')return;

const edition=(new URLSearchParams(location.search).get('edition')||'en').toLowerCase();
const TXT={
 en:{start:'Overlay',stop:'Stop Overlay',pick:'Choose the PDF tab, window or screen to place behind the whiteboard.',unsupported:'Screen overlay is not supported in this browser.',failed:'Overlay could not be started.',on:'Overlay started',off:'Overlay stopped',fill:'Maximum fill',whole:'Whole view',switch:'Switch source',switchPick:'Choose another PDF tab, window or screen.'},
 zh:{start:'叠加',stop:'停止叠加',pick:'选择要放在白板下方的PDF标签页、窗口或屏幕。',unsupported:'此浏览器不支持屏幕叠加。',failed:'无法启动叠加。',on:'已启动叠加',off:'已停止叠加',fill:'最大显示',whole:'完整显示',switch:'切换来源',switchPick:'选择另一个PDF标签页、窗口或屏幕。'},
 ms:{start:'Overlay',stop:'Henti Overlay',pick:'Pilih tab PDF, tetingkap atau skrin untuk diletakkan di belakang papan putih.',unsupported:'Overlay skrin tidak disokong dalam pelayar ini.',failed:'Overlay tidak dapat dimulakan.',on:'Overlay bermula',off:'Overlay dihentikan',fill:'Paparan maksimum',whole:'Paparan penuh',switch:'Tukar sumber',switchPick:'Pilih tab PDF, tetingkap atau skrin lain.'},
 ta:{start:'மேலடுக்கு',stop:'மேலடுக்கை நிறுத்து',pick:'வெண்பலகையின் கீழ் காட்ட PDF தாவல், சாளரம் அல்லது திரையைத் தேர்ந்தெடுக்கவும்.',unsupported:'இந்த உலாவி திரை மேலடுக்கை ஆதரிக்கவில்லை.',failed:'மேலடுக்கை தொடங்க முடியவில்லை.',on:'மேலடுக்கு தொடங்கியது',off:'மேலடுக்கு நிறுத்தப்பட்டது',fill:'அதிகபட்ச காட்சி',whole:'முழுக் காட்சி',switch:'மூலத்தை மாற்று',switchPick:'வேறு PDF தாவல், சாளரம் அல்லது திரையைத் தேர்ந்தெடுக்கவும்.'}
};
const L=TXT[edition]||TXT.en;
let stream=null,video=null,active=false,fitMode='fill',fitBtn=null,switchBtn=null,dock=null;

function sayLocal(msg){
 if(typeof say==='function'){try{say(msg);return}catch{}}
 const t=document.getElementById('toast');
 if(t){t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1500)}
}

function ensureVideo(){
 if(video)return video;
 video=document.createElement('video');
 video.id='liveOverlayVideo';
 video.autoplay=true;
 video.muted=true;
 video.playsInline=true;
 video.setAttribute('aria-hidden','true');
 Object.assign(video.style,{
  position:'absolute',inset:'0',width:'100%',height:'100%',objectFit:'cover',objectPosition:'center center',
  background:'#fff',zIndex:'0',pointerEvents:'none',display:'none'
 });
 wrap.insertBefore(video,wrap.firstChild);
 canvas.style.position='relative';
 canvas.style.zIndex='2';
 const mode=document.getElementById('modeBadge');if(mode){mode.style.zIndex='3'}
 return video;
}

function ensureButton(){
 const tools=document.querySelector('.tools');if(!tools)return null;
 let b=document.getElementById('liveOverlayBtn');if(b)return b;
 b=document.createElement('button');b.className='btn soft';b.type='button';b.id='liveOverlayBtn';b.textContent='🪟';b.title=L.pick;b.setAttribute('aria-label',L.start);
 const anchor=document.getElementById('gridBtn');
 if(anchor)tools.insertBefore(b,anchor);else tools.appendChild(b);
 b.addEventListener('click',()=>active?stopOverlay(true):startOverlay());
 return b;
}

function ensureDock(){
 if(dock)return dock;
 dock=document.createElement('div');
 dock.id='overlayQuickControls';
 Object.assign(dock.style,{position:'absolute',right:'5px',top:'5px',zIndex:'8',display:'none',gap:'3px',alignItems:'center',pointerEvents:'auto'});
 wrap.appendChild(dock);
 return dock;
}

function tinyButton(id,text,title){
 const b=document.createElement('button');b.type='button';b.id=id;b.textContent=text;b.title=title;b.setAttribute('aria-label',title);
 Object.assign(b.style,{width:'28px',height:'28px',minWidth:'28px',padding:'0',border:'1px solid rgba(23,50,77,.28)',borderRadius:'7px',background:'rgba(255,255,255,.94)',color:'#17324d',font:'900 13px system-ui,sans-serif',boxShadow:'0 2px 8px rgba(18,32,46,.16)',cursor:'pointer'});
 return b;
}

function ensureFitButton(){
 if(fitBtn)return fitBtn;
 fitBtn=tinyButton('overlayFitBtn','▣',L.whole);
 fitBtn.addEventListener('click',()=>{fitMode=fitMode==='fill'?'whole':'fill';applyFit()});
 ensureDock().appendChild(fitBtn);
 return fitBtn;
}

function ensureSwitchButton(){
 if(switchBtn)return switchBtn;
 switchBtn=tinyButton('overlaySwitchBtn','⇄',L.switch);
 switchBtn.addEventListener('click',switchSource);
 ensureDock().appendChild(switchBtn);
 return switchBtn;
}

function applyFit(){
 const v=ensureVideo(),b=ensureFitButton();
 if(fitMode==='fill'){
  v.style.objectFit='cover';v.style.objectPosition='center center';
  b.textContent='▣';b.title=L.whole;b.setAttribute('aria-label',L.whole);
 }else{
  v.style.objectFit='contain';v.style.objectPosition='center center';
  b.textContent='□';b.title=L.fill;b.setAttribute('aria-label',L.fill);
 }
}

function syncButton(){
 const b=ensureButton();if(!b)return;
 b.textContent=active?'■':'🪟';b.title=active?L.stop:L.pick;b.setAttribute('aria-label',active?L.stop:L.start);
 b.classList.toggle('danger',active);b.classList.toggle('soft',!active);
 const d=ensureDock();ensureFitButton();ensureSwitchButton();d.style.display=active?'flex':'none';
 if(active)applyFit();
}

function stopTracks(s){if(!s)return;for(const tr of s.getTracks()){try{tr.stop()}catch{}}}

function cleanupStream(){
 stopTracks(stream);stream=null;
 if(video){try{video.pause()}catch{};video.srcObject=null;video.style.display='none'}
 wrap.classList.remove('live-overlay-active');
 document.body.classList.remove('live-overlay-mode');
 active=false;syncButton();
}

function stopOverlay(showToast){cleanupStream();if(showToast)sayLocal(L.off)}

async function pickDisplay(){
 return navigator.mediaDevices.getDisplayMedia({video:{frameRate:{ideal:30,max:30}},audio:false});
}

async function attachStream(s,resetFit){
 const old=stream;
 stream=s;active=true;if(resetFit)fitMode='fill';
 const v=ensureVideo();v.srcObject=s;v.style.display='block';
 wrap.classList.add('live-overlay-active');document.body.classList.add('live-overlay-mode');
 const track=s.getVideoTracks()[0];if(track)track.addEventListener('ended',()=>{if(stream===s)stopOverlay(false)},{once:true});
 try{await v.play()}catch{}
 if(old&&old!==s)stopTracks(old);
 syncButton();
}

async function startOverlay(){
 if(!navigator.mediaDevices?.getDisplayMedia){sayLocal(L.unsupported);return}
 const b=ensureButton();if(b)b.disabled=true;
 try{const s=await pickDisplay();await attachStream(s,true);sayLocal(L.on)}
 catch(err){if(err?.name!=='NotAllowedError'&&err?.name!=='AbortError')sayLocal(L.failed)}
 finally{if(b)b.disabled=false;syncButton()}
}

async function switchSource(){
 if(!active)return startOverlay();
 if(!navigator.mediaDevices?.getDisplayMedia){sayLocal(L.unsupported);return}
 if(switchBtn)switchBtn.disabled=true;
 try{const s=await pickDisplay();await attachStream(s,false)}
 catch(err){if(err?.name!=='NotAllowedError'&&err?.name!=='AbortError')sayLocal(L.failed)}
 finally{if(switchBtn)switchBtn.disabled=false;syncButton()}
}

const style=document.createElement('style');
style.textContent=`
#boardWrap.live-overlay-active{background-image:none!important;background-color:#fff!important}
#boardWrap.live-overlay-active::after{opacity:.20}
body.live-overlay-mode .shell{padding:2px!important;gap:2px!important}
body.live-overlay-mode .top{padding:2px 4px!important;border-radius:7px!important;gap:2px!important}
body.live-overlay-mode .brand{display:none!important}
body.live-overlay-mode .tools{width:100%!important;gap:2px!important;flex-wrap:nowrap!important;overflow-x:auto!important;scrollbar-width:none!important}
body.live-overlay-mode .tools::-webkit-scrollbar{display:none!important}
body.live-overlay-mode .btn{min-height:24px!important;height:24px!important;padding:1px 5px!important;border-radius:6px!important;font-size:10px!important;line-height:1!important;white-space:nowrap!important}
body.live-overlay-mode .btn:disabled{display:none!important}
body.live-overlay-mode #liveOverlayBtn{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:26px!important;min-width:26px!important;padding:0!important;font-size:12px!important}
body.live-overlay-mode #modeBadge{display:none!important}
body.live-overlay-mode .boardWrap{border-radius:6px!important}
`;
document.head.appendChild(style);

ensureButton();ensureDock();ensureFitButton();ensureSwitchButton();syncButton();
window.addEventListener('beforeunload',()=>cleanupStream());
})();
