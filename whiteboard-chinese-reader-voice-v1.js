/* Fixed Chinese voice: Google 普通话（中国大陆）. No voice selection or model download. */
(function(){
'use strict';
if(window.CCChineseReaderVoice)return;
const NAME='Google 普通话（中国大陆）',STORAGE='cc-whiteboard-chinese-reader-google-v1';
const COPY={
 zh:{current:'声音：',online:'在线 · 需要网络',local:'本机',privacy:'中文使用 Google 普通话（中国大陆）。在线朗读需要网络，文字交由浏览器提供的 Google 语音服务处理。',loading:'正在准备 Google 普通话……',missing:'此浏览器暂未提供 Google 普通话（中国大陆）。声音可用后，点击“朗读”即可。',failed:'Google 普通话暂时无法播放。请检查网络后重试。'},
 en:{current:'Voice: ',online:'Online · Internet needed',local:'On this device',privacy:'Chinese uses Google 普通话（中国大陆）. Online reading needs an Internet connection and sends text to the Google speech service provided by your browser.',loading:'Preparing Google Mandarin…',missing:'Google Mandarin (Mainland China) is not available in this browser yet. Click Read when it becomes available.',failed:'Google Mandarin could not play. Check your connection and try again.'},
 ms:{current:'Suara: ',online:'Dalam talian · Perlu Internet',local:'Pada peranti',privacy:'Bahasa Cina menggunakan Google 普通话（中国大陆）. Bacaan dalam talian memerlukan Internet dan menghantar teks kepada perkhidmatan pertuturan Google yang disediakan oleh pelayar.',loading:'Menyediakan Google Mandarin…',missing:'Google Mandarin (Tanah Besar China) belum tersedia dalam pelayar ini. Tekan Baca apabila suara tersedia.',failed:'Google Mandarin tidak dapat dimainkan. Semak sambungan dan cuba lagi.'},
 ta:{current:'குரல்: ',online:'இணையக் குரல் · இணையம் தேவை',local:'இந்தச் சாதனத்தில்',privacy:'சீன மொழிக்கு Google 普通话（中国大陆） பயன்படும். இணைய வாசிப்பு உரையை உலாவி வழங்கும் Google பேச்சுச் சேவைக்கு அனுப்பும்.',loading:'Google மாண்டரின் குரல் தயாராகிறது…',missing:'Google மாண்டரின் குரல் இந்த உலாவியில் இன்னும் கிடைக்கவில்லை. குரல் கிடைத்ததும் வாசி என்பதை அழுத்தவும்.',failed:'Google மாண்டரின் குரலை இயக்க முடியவில்லை. இணைய இணைப்பைச் சரிபார்த்து மீண்டும் முயலவும்.'}
};
function normalized(value){return String(value||'').normalize('NFKC').toLowerCase().replace(/\s+/g,'')}
function find(voices){
 const exact=normalized(NAME);
 return voices.find(v=>normalized(v.name)===exact||normalized(v.voiceURI)===exact)||voices.find(v=>{
  const tag=String(v.lang||'').toLowerCase().replace(/_/g,'-'),name=normalized(v.name)+' '+normalized(v.voiceURI);
  return /^(?:zh-cn|zh-hans(?:-cn)?|cmn-hans-cn)$/.test(tag)&&/google/.test(name)&&/普通[话話]|mandarin|chinese/.test(name);
 });
}
function create({ui,host,details,voice,speed,status,onRefresh}){
 const L=COPY[ui]||COPY.en;let list=[],restoredRate=false;
 const section=document.createElement('div');section.className='cc-reader-chinese-voice';section.hidden=true;
 const current=document.createElement('p');current.id='ccChineseCurrentVoice';
 const note=document.createElement('p');note.className='cc-reader-hint';note.textContent=L.privacy;section.append(current,note);host.insertBefore(section,details);
 function refresh(available){
  list=available;section.hidden=false;details.hidden=true;
  if(!restoredRate){
   try{const saved=JSON.parse(localStorage.getItem(STORAGE)||localStorage.getItem('cc-whiteboard-chinese-reader-voice-v1')||'null');if([...speed.options].some(o=>Number(o.value)===saved?.speed))speed.value=String(saved.speed)}catch{}
   restoredRate=true;
  }
  const chosen=find(list),option=document.createElement('option');option.value='google-mandarin';option.textContent=NAME;voice.replaceChildren(option);voice.value=option.value;
  current.textContent=L.current+NAME+' · '+(chosen?.localService===true?L.local:L.online);
 }
 function resolve(){const chosen=find(list);return chosen?{voice:chosen}:{missing:true}}
 async function ready(cancelled){
  const until=performance.now()+1200;
  while(true){
   if(cancelled())return {cancelled:true};
   onRefresh();const choice=resolve();if(!choice.missing)return choice;
   status.textContent=L.loading;
   if(performance.now()>=until)return choice;
   await new Promise(resolve=>setTimeout(resolve,100));
  }
 }
 return Object.freeze({refresh,resolve,ready,hide:()=>{section.hidden=true;details.hidden=false},changed:()=>{try{localStorage.setItem(STORAGE,JSON.stringify({version:1,speed:Number(speed.value)||.85}))}catch{}},missing:()=>{status.textContent=L.missing},failed:()=>{status.textContent=L.failed}});
}
window.CCChineseReaderVoice=Object.freeze({create});
})();
