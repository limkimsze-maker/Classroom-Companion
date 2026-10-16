(function(){
'use strict';
if(typeof wrap==='undefined'||typeof canvas==='undefined')return;

const edition=(new URLSearchParams(location.search).get('edition')||'en').toLowerCase();
const TXT={
 en:{start:'🪟 Overlay',stop:'■ Stop Overlay',pick:'Choose the PDF tab, window or screen to place behind the whiteboard.',unsupported:'Screen overlay is not supported in this browser.',failed:'Overlay could not be started.',on:'Overlay started',off:'Overlay stopped'},
 zh:{start:'🪟 叠加',stop:'■ 停止叠加',pick:'选择要放在白板下方的PDF标签页、窗口或屏幕。',unsupported:'此浏览器不支持屏幕叠加。',failed:'无法启动叠加。',on:'已启动叠加',off:'已停止叠加'},
 ms:{start:'🪟 Overlay',stop:'■ Henti Overlay',pick:'Pilih tab PDF, tetingkap atau skrin untuk diletakkan di belakang papan putih.',unsupported:'Overlay skrin tidak disokong dalam pelayar ini.',failed:'Overlay tidak dapat dimulakan.',on:'Overlay bermula',off:'Overlay dihentikan'},
 ta:{start:'🪟 மேலடுக்கு',stop:'■ மேலடுக்கை நிறுத்து',pick:'வெண்பலகையின் கீழ் காட்ட PDF தாவல், சாளரம் அல்லது திரையைத் தேர்ந்தெடுக்கவும்.',unsupported:'இந்த உலாவி திரை மேலடுக்கை ஆதரிக்கவில்லை.',failed:'மேலடுக்கை தொடங்க முடியவில்லை.',on:'மேலடுக்கு தொடங்கியது',off:'மேலடுக்கு நிறுத்தப்பட்டது'}
};
const L=TXT[edition]||TXT.en;
let stream=null,video=null,active=false;

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
  position:'absolute',inset:'0',width:'100%',height:'100%',objectFit:'contain',
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
 b=document.createElement('button');b.className='btn soft';b.type='button';b.id='liveOverlayBtn';b.textContent=L.start;b.title=L.pick;
 const anchor=document.getElementById('gridBtn');
 if(anchor)tools.insertBefore(b,anchor);else tools.appendChild(b);
 b.addEventListener('click',()=>active?stopOverlay(true):startOverlay());
 return b;
}

function syncButton(){const b=ensureButton();if(!b)return;b.textContent=active?L.stop:L.start;b.classList.toggle('danger',active);b.classList.toggle('soft',!active)}

function cleanupStream(){
 if(stream){for(const tr of stream.getTracks()){try{tr.stop()}catch{}}}
 stream=null;
 if(video){try{video.pause()}catch{};video.srcObject=null;video.style.display='none'}
 wrap.classList.remove('live-overlay-active');
 active=false;syncButton();
}

function stopOverlay(showToast){cleanupStream();if(showToast)sayLocal(L.off)}

async function startOverlay(){
 if(!navigator.mediaDevices?.getDisplayMedia){sayLocal(L.unsupported);return}
 const b=ensureButton();if(b)b.disabled=true;
 try{
  const s=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:{ideal:30,max:30}},audio:false});
  stopOverlay(false);
  stream=s;active=true;
  const v=ensureVideo();v.srcObject=s;v.style.display='block';
  wrap.classList.add('live-overlay-active');
  const track=s.getVideoTracks()[0];if(track)track.addEventListener('ended',()=>stopOverlay(false),{once:true});
  try{await v.play()}catch{}
  syncButton();sayLocal(L.on);
 }catch(err){if(err?.name!=='NotAllowedError'&&err?.name!=='AbortError')sayLocal(L.failed)}
 finally{if(b)b.disabled=false;syncButton()}
}

const style=document.createElement('style');
style.textContent=`#boardWrap.live-overlay-active{background-image:none!important;background-color:#fff!important}#boardWrap.live-overlay-active::after{opacity:.35}`;
document.head.appendChild(style);

ensureButton();syncButton();
window.addEventListener('beforeunload',()=>cleanupStream());
})();
