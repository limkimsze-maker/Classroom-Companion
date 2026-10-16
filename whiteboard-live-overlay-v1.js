(function(){
'use strict';
if(typeof wrap==='undefined'||typeof canvas==='undefined')return;

const edition=(new URLSearchParams(location.search).get('edition')||'en').toLowerCase();
const TXT={
 en:{start:'Overlay',stop:'Stop Overlay',pick:'Choose the PDF tab, window or screen to place behind the whiteboard.',unsupported:'Screen overlay is not supported in this browser.',failed:'Overlay could not be started.',on:'Overlay started',off:'Overlay stopped',fill:'Fill',fit:'Fit',switch:'Switch'},
 zh:{start:'叠加',stop:'停止叠加',pick:'选择要放在白板下方的PDF标签页、窗口或屏幕。',unsupported:'此浏览器不支持屏幕叠加。',failed:'无法启动叠加。',on:'已启动叠加',off:'已停止叠加',fill:'放大',fit:'适应',switch:'切换'},
 ms:{start:'Overlay',stop:'Henti Overlay',pick:'Pilih tab PDF, tetingkap atau skrin untuk diletakkan di belakang papan putih.',unsupported:'Overlay skrin tidak disokong dalam pelayar ini.',failed:'Overlay tidak dapat dimulakan.',on:'Overlay bermula',off:'Overlay dihentikan',fill:'Isi',fit:'Muat',switch:'Tukar'},
 ta:{start:'மேலடுக்கு',stop:'மேலடுக்கை நிறுத்து',pick:'வெண்பலகையின் கீழ் காட்ட PDF தாவல், சாளரம் அல்லது திரையைத் தேர்ந்தெடுக்கவும்.',unsupported:'இந்த உலாவி திரை மேலடுக்கை ஆதரிக்கவில்லை.',failed:'மேலடுக்கை தொடங்க முடியவில்லை.',on:'மேலடுக்கு தொடங்கியது',off:'மேலடுக்கு நிறுத்தப்பட்டது',fill:'நிரப்பு',fit:'பொருத்து',switch:'மாற்று'}
};
const L=TXT[edition]||TXT.en;
let stream=null,video=null,active=false,fitMode='fill',dock=null,fitBtn=null,switchBtn=null;

function sayLocal(msg){
 if(typeof say==='function'){try{say(msg);return}catch{}}
 const t=document.getElementById('toast');if(t){t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1500)}
}

function ensureVideo(){
 if(video)return video;
 video=document.createElement('video');
 video.id='liveOverlayVideo';video.autoplay=true;video.muted=true;video.playsInline=true;video.setAttribute('aria-hidden','true');
 Object.assign(video.style,{position:'absolute',left:'0',top:'0',width:'100%',height:'100%',objectFit:'contain',objectPosition:'center center',transformOrigin:'center center',background:'#fff',zIndex:'0',pointerEvents:'none',display:'none'});
 wrap.insertBefore(video,wrap.firstChild);
 canvas.style.position='relative';canvas.style.zIndex='2';
 const mode=document.getElementById('modeBadge');if(mode)mode.style.zIndex='3';
 return video;
}

function ensureMainButton(){
 const tools=document.querySelector('.tools');if(!tools)return null;
 let b=document.getElementById('liveOverlayBtn');if(b)return b;
 b=document.createElement('button');b.className='btn soft';b.type='button';b.id='liveOverlayBtn';b.textContent='🪟';b.title=L.pick;b.setAttribute('aria-label',L.start);
 const anchor=document.getElementById('gridBtn');if(anchor)tools.insertBefore(b,anchor);else tools.appendChild(b);
 b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();active?stopOverlay(true):startOverlay()});
 return b;
}

function controlButton(text,title){
 const b=document.createElement('button');b.type='button';b.textContent=text;b.title=title;
 Object.assign(b.style,{height:'26px',minHeight:'26px',padding:'0 7px',border:'1px solid #aab8c2',borderRadius:'6px',background:'rgba(255,255,255,.97)',color:'#17324d',font:'900 10px system-ui,sans-serif',boxShadow:'0 2px 8px rgba(18,32,46,.20)',cursor:'pointer',pointerEvents:'auto',whiteSpace:'nowrap'});
 return b;
}

function ensureDock(){
 if(dock)return dock;
 dock=document.createElement('div');dock.id='overlayQuickControls';
 Object.assign(dock.style,{position:'fixed',right:'6px',top:'6px',zIndex:'2147483647',display:'none',gap:'3px',alignItems:'center',pointerEvents:'auto'});
 document.body.appendChild(dock);
 fitBtn=controlButton(L.fit,L.fit);fitBtn.id='overlayFitBtn';
 switchBtn=controlButton('⇄ '+L.switch,L.switch);switchBtn.id='overlaySwitchBtn';
 fitBtn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();fitMode=fitMode==='fill'?'fit':'fill';applyFit()});
 switchBtn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();switchSource()});
 dock.appendChild(fitBtn);dock.appendChild(switchBtn);
 return dock;
}

function applyFit(){
 const v=ensureVideo();ensureDock();
 if(fitMode==='fill'){
  v.style.objectFit='cover';
  v.style.transform='scale(1.28)';
  fitBtn.textContent=L.fit;fitBtn.title=L.fit;
 }else{
  v.style.objectFit='contain';
  v.style.transform='scale(1)';
  fitBtn.textContent=L.fill;fitBtn.title=L.fill;
 }
}

function syncUI(){
 const b=ensureMainButton();ensureDock();
 if(b){b.textContent=active?'■':'🪟';b.title=active?L.stop:L.pick;b.classList.toggle('danger',active);b.classList.toggle('soft',!active)}
 dock.style.display=active?'flex':'none';
 if(active)applyFit();
}

function stopTracks(s){if(!s)return;for(const tr of s.getTracks()){try{tr.stop()}catch{}}}
function cleanupStream(){
 stopTracks(stream);stream=null;
 if(video){try{video.pause()}catch{};video.srcObject=null;video.style.display='none';video.style.transform='scale(1)'}
 wrap.classList.remove('live-overlay-active');document.body.classList.remove('live-overlay-mode');active=false;syncUI();
}
function stopOverlay(showToast){cleanupStream();if(showToast)sayLocal(L.off)}

async function pickDisplay(){return navigator.mediaDevices.getDisplayMedia({video:{frameRate:{ideal:30,max:30}},audio:false})}
async function attachStream(s,resetFit){
 const old=stream;stream=s;active=true;if(resetFit)fitMode='fill';
 const v=ensureVideo();v.srcObject=s;v.style.display='block';wrap.classList.add('live-overlay-active');document.body.classList.add('live-overlay-mode');
 const track=s.getVideoTracks()[0];if(track)track.addEventListener('ended',()=>{if(stream===s)stopOverlay(false)},{once:true});
 try{await v.play()}catch{}
 if(old&&old!==s)stopTracks(old);
 syncUI();
}

async function startOverlay(){
 if(!navigator.mediaDevices?.getDisplayMedia){sayLocal(L.unsupported);return}
 const b=ensureMainButton();if(b)b.disabled=true;
 try{const s=await pickDisplay();await attachStream(s,true);sayLocal(L.on)}
 catch(err){if(err?.name!=='NotAllowedError'&&err?.name!=='AbortError')sayLocal(L.failed)}
 finally{if(b)b.disabled=false;syncUI()}
}

async function switchSource(){
 if(!active){startOverlay();return}
 if(!navigator.mediaDevices?.getDisplayMedia){sayLocal(L.unsupported);return}
 if(switchBtn)switchBtn.disabled=true;
 try{const s=await pickDisplay();await attachStream(s,false)}
 catch(err){if(err?.name!=='NotAllowedError'&&err?.name!=='AbortError')sayLocal(L.failed)}
 finally{if(switchBtn)switchBtn.disabled=false;syncUI()}
}

const style=document.createElement('style');
style.textContent=`
#boardWrap.live-overlay-active{background-image:none!important;background-color:#fff!important}
#boardWrap.live-overlay-active::after{opacity:.15}
body.live-overlay-mode .shell{padding:2px!important;gap:2px!important}
body.live-overlay-mode .top{padding:2px 4px!important;border-radius:6px!important;gap:2px!important}
body.live-overlay-mode .brand{display:none!important}
body.live-overlay-mode .tools{width:100%!important;gap:2px!important;flex-wrap:nowrap!important;overflow-x:auto!important;scrollbar-width:none!important}
body.live-overlay-mode .tools::-webkit-scrollbar{display:none!important}
body.live-overlay-mode .btn{min-height:23px!important;height:23px!important;padding:1px 4px!important;border-radius:5px!important;font-size:9px!important;line-height:1!important;white-space:nowrap!important}
body.live-overlay-mode .btn:disabled{display:none!important}
body.live-overlay-mode #liveOverlayBtn{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:24px!important;min-width:24px!important;padding:0!important;font-size:11px!important}
body.live-overlay-mode #modeBadge{display:none!important}
body.live-overlay-mode .boardWrap{border-radius:4px!important}
`;
document.head.appendChild(style);

ensureMainButton();ensureDock();syncUI();
window.addEventListener('beforeunload',cleanupStream);
})();
