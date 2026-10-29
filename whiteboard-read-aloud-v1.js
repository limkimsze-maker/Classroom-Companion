/* Shared Read Board: browser/device voices with a same-origin local fallback.
 * Only reads text. No board objects, documents, annotations or saved data are changed. */
(function(){
'use strict';
if(!/\/whiteboard-smart-beta\.html$/i.test(location.pathname)||window.CCReadAloud)return;
const LANGS={en:{tag:'en-SG',name:'English'},zh:{tag:'zh-CN',name:'中文'},ms:{tag:'ms-MY',name:'Bahasa Melayu'},ta:{tag:'ta-SG',name:'தமிழ்'}};
const edition=new URLSearchParams(location.search).get('edition')||'en',ui=LANGS[edition]?edition:'en';
const COPY={
 en:{short:'Read',title:'Read all whiteboard text',close:'Close',read:'Read',stop:'Stop',repeat:'Repeat',speed:'Speed',language:'Language',voice:'Voice',automatic:'Automatic',builtin:'Built-in voice',selection:'Use whiteboard text',document:'Load document text',preview:'Text to read',hint:'Select words in this box, then Read. With no selection, Read speaks all the text shown.',empty:'Add text to the whiteboard, then click Read. No object selection is needed.',loading:'Getting document text…',ready:'Ready to read.',reading:'Reading…',stopped:'Stopped.',finished:'Finished reading.',choose:'Add readable text to the whiteboard, or load document text.',noDocument:'Open a document first.',busy:'The document is still loading. Try again shortly.',noText:'No readable text found. Scanned PDFs and pictures need OCR.',changed:'The document or page changed. Load its text again.',failed:'Unable to read.',femaleMissing:'No female Malay voice is available in this browser. Try Microsoft Edge with Yasmin, if available.',femaleFailed:'The female Malay voice could not play. Check your connection or try Microsoft Edge.',preparing:'Preparing the built-in voice…',fallback:'Using the built-in voice.',page:'Page',board:'All whiteboard text',local:'Built-in speech works without installing a voice. Its sound is more synthetic.',unavailable:'Audio is unavailable in this browser.',long:'The first 200,000 characters are shown. Select a shorter passage to read.'},
 zh:{short:'朗读',title:'朗读白板全部文字',close:'关闭',read:'朗读',stop:'停止',repeat:'重读',speed:'语速',language:'语言',voice:'声音',automatic:'自动选择',builtin:'内置声音',selection:'使用白板文字',document:'载入文档文字',preview:'朗读文字',hint:'选中框内的词句，再点击“朗读”。未选择时，将朗读框内全部文字。',empty:'在白板上添加文字，再点击“朗读”。无需选择对象。',loading:'正在提取文档文字……',ready:'可以开始朗读。',reading:'正在朗读……',stopped:'已停止。',finished:'朗读完毕。',choose:'请在白板上添加可朗读的文字，或载入文档文字。',noDocument:'请先打开文档。',busy:'文档仍在载入，请稍后重试。',noText:'未找到可朗读的文字。扫描版 PDF 和图片需要文字识别。',changed:'文档或页面已更改，请重新载入文字。',failed:'无法朗读。',femaleMissing:'此浏览器没有可用的马来语女声。可尝试 Microsoft Edge 的 Yasmin 女声。',femaleFailed:'马来语女声无法播放，请检查网络或尝试 Microsoft Edge。',preparing:'正在准备内置声音……',fallback:'正在使用内置声音。',page:'页',board:'白板全部文字',local:'内置朗读无需安装声音，音色较为机械。',unavailable:'此浏览器无法播放语音。',long:'显示前 200,000 个字符，请选择较短的段落朗读。'},
 ms:{short:'Baca',title:'Baca semua teks papan putih',close:'Tutup',read:'Baca',stop:'Henti',repeat:'Ulang',speed:'Kelajuan',language:'Bahasa',voice:'Suara',automatic:'Automatik',builtin:'Suara terbina dalam',selection:'Guna teks papan putih',document:'Muatkan teks dokumen',preview:'Teks untuk dibaca',hint:'Pilih perkataan dalam kotak ini, kemudian tekan Baca. Jika tiada pilihan, semua teks yang dipaparkan akan dibaca.',empty:'Tambah teks pada papan putih, kemudian tekan Baca. Tidak perlu memilih objek.',loading:'Mendapatkan teks dokumen…',ready:'Sedia untuk membaca.',reading:'Sedang membaca…',stopped:'Dihentikan.',finished:'Bacaan selesai.',choose:'Tambah teks yang boleh dibaca pada papan putih atau muatkan teks dokumen.',noDocument:'Buka dokumen dahulu.',busy:'Dokumen masih dimuatkan. Cuba sebentar lagi.',noText:'Tiada teks yang boleh dibaca. PDF imbasan dan gambar memerlukan OCR.',changed:'Dokumen atau halaman telah berubah. Muatkan teks semula.',failed:'Suara tidak dapat dimainkan.',femaleMissing:'Tiada suara wanita Bahasa Melayu tersedia dalam pelayar ini. Cuba Microsoft Edge dengan suara Yasmin, jika tersedia.',femaleFailed:'Suara wanita Bahasa Melayu gagal dimainkan. Semak sambungan Internet atau cuba Microsoft Edge.',preparing:'Menyediakan suara terbina dalam…',fallback:'Menggunakan suara terbina dalam.',page:'Halaman',board:'Semua teks papan putih',local:'Suara terbina dalam berfungsi tanpa memasang suara. Bunyinya lebih sintetik.',unavailable:'Audio tidak tersedia dalam pelayar ini.',long:'200,000 aksara pertama dipaparkan. Pilih petikan lebih pendek untuk dibaca.'},
 ta:{short:'வாசி',title:'வெண்பலகையின் முழு உரையையும் வாசி',close:'மூடு',read:'வாசி',stop:'நிறுத்து',repeat:'மீண்டும் வாசி',speed:'வேகம்',language:'மொழி',voice:'குரல்',automatic:'தானாகத் தேர்வு',builtin:'உள்ளமைந்த குரல்',selection:'வெண்பலகை உரையைப் பயன்படுத்து',document:'ஆவண உரையை ஏற்று',preview:'வாசிப்பதற்கான உரை',hint:'இந்தப் பெட்டியில் சொற்களைத் தேர்ந்தெடுத்து வாசி என்பதை அழுத்தவும். தேர்வு இல்லாவிட்டால், காட்டப்படும் முழு உரையும் வாசிக்கப்படும்.',empty:'வெண்பலகையில் உரையைச் சேர்த்து வாசி என்பதை அழுத்தவும். பொருளைத் தேர்ந்தெடுக்கத் தேவையில்லை.',loading:'ஆவண உரையைப் பெறுகிறது…',ready:'வாசிக்கத் தயார்.',reading:'வாசிக்கிறது…',stopped:'நிறுத்தப்பட்டது.',finished:'வாசித்து முடிந்தது.',choose:'வெண்பலகையில் வாசிக்கக்கூடிய உரையைச் சேர்க்கவும் அல்லது ஆவண உரையை ஏற்றவும்.',noDocument:'முதலில் ஆவணத்தைத் திறக்கவும்.',busy:'ஆவணம் ஏற்றப்படுகிறது. சிறிது நேரத்தில் முயலவும்.',noText:'வாசிக்கக்கூடிய உரை இல்லை. வருடப்பட்ட PDF கோப்புகளுக்கும் படங்களுக்கும் OCR தேவை.',changed:'ஆவணம் அல்லது பக்கம் மாறிவிட்டது. உரையை மீண்டும் ஏற்றவும்.',failed:'வாசிக்க முடியவில்லை.',femaleMissing:'இந்த உலாவியில் மலாய் பெண் குரல் இல்லை. Microsoft Edge-இல் Yasmin குரலை முயற்சிக்கவும்.',femaleFailed:'மலாய் பெண் குரலை இயக்க முடியவில்லை. இணையத்தைச் சரிபார்க்கவும்.',preparing:'உள்ளமைந்த குரலைத் தயார் செய்கிறது…',fallback:'உள்ளமைந்த குரலைப் பயன்படுத்துகிறது.',page:'பக்கம்',board:'வெண்பலகையின் முழு உரை',local:'குரலை நிறுவாமல் உள்ளமைந்த குரல் இயங்கும். அதன் ஒலி செயற்கையாக இருக்கும்.',unavailable:'இந்த உலாவியில் ஒலி கிடைக்கவில்லை.',long:'முதல் 200,000 எழுத்துகள் காட்டப்படுகின்றன. வாசிக்கச் சிறிய பகுதியைத் தேர்ந்தெடுக்கவும்.'}
};
const L=COPY[ui],synth=window.speechSynthesis,Utterance=window.SpeechSynthesisUtterance;
const CHINESE_VOICE_COPY={
 en:{automatic:'Gentle female (automatic)',builtin:'Built-in female voice',hint:'Prefers an available female Mandarin device voice. The default Chinese pace is 0.85×. The built-in female voice works on this device too, but sounds more synthetic.'},
 zh:{automatic:'温柔女声（自动）',builtin:'内置女声',hint:'优先使用设备上的普通话女声。中文默认语速为 0.85×，较为舒缓。没有合适的女声时使用内置女声，音色仍较为机械。'},
 ms:{automatic:'Suara wanita lembut (automatik)',builtin:'Suara wanita terbina dalam',hint:'Mengutamakan suara wanita Mandarin pada peranti. Kelajuan lalai bahasa Cina ialah 0.85×. Suara wanita terbina dalam juga tersedia, tetapi bunyinya lebih sintetik.'},
 ta:{automatic:'மென்மையான பெண் குரல் (தானாக)',builtin:'உள்ளமைந்த பெண் குரல்',hint:'சாதனத்தில் உள்ள மாண்டரின் பெண் குரலுக்கு முன்னுரிமை அளிக்கப்படும். சீன மொழியின் இயல்புநிலை வேகம் 0.85×. உள்ளமைந்த பெண் குரலும் கிடைக்கும்; அதன் ஒலி செயற்கையாக இருக்கும்.'}
}[ui];
let panel,preview,status,sourceLabel,language,voice,voiceHint,speed,quickSpeed,read,stopButton,repeat,mainButton,railButton;
let quickMode=false;
let voices=[],run=0,extract=0,state='idle',last=null,source=null,activeUtterance=null,cancelNative=null;
let audio=null,audioSource=null,worker=null,workerSerial=0,pending=new Map();
let chineseReaderVoice=null;
const workerUrl=new URL('vendor/read-aloud/worker.js?v=20261029-zh-female1',document.currentScript.src);
function notice(message){
 if(!quickMode||!message)return;
 const toast=document.getElementById('toast');if(!toast)return;
 toast.textContent=message;toast.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>toast.classList.remove('show'),2700);
}
function say(key){if(status)status.textContent=L[key]||key;if(['empty','busy','noText','changed','failed','unavailable','choose'].includes(key))notice(L[key]||key)}
function setState(value){
 state=value;if(stopButton)stopButton.disabled=value==='idle';if(repeat)repeat.disabled=!last;if(read)read.disabled=value==='loading'||!preview?.value.trim();if(panel)panel.dataset.state=value;
 for(const button of [mainButton,railButton]){
  if(!button)continue;const active=value!=='idle';button.textContent=button===railButton?(active?'■':'🔊'):(active?'■ '+L.stop:'🔊 '+L.short);
  button.title=active?L.stop:L.title;button.setAttribute('aria-label',active?L.stop:L.title);button.setAttribute('aria-pressed',String(active));
 }
}
function sameDocument(a,b){return !!a&&!!b&&a.open&&b.open&&a.session===b.session&&a.page===b.page}
function stop(message='stopped'){
 ++run;if(cancelNative){const cancel=cancelNative;cancelNative=null;cancel()}activeUtterance=null;
 if(synth)try{synth.cancel()}catch{}
 if(audioSource){audioSource.onended=null;try{audioSource.stop();audioSource.disconnect()}catch{}audioSource=null}
 setState('idle');if(message)say(message);
}
function primeAudio(){
 try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;if(!audio||audio.state==='closed')audio=new C();if(audio.state!=='running')audio.resume().catch(()=>{});return audio}catch{return null}
}
function browserVoices(){try{return synth?.getVoices()||[]}catch{return []}}
function nativeVoices(){return browserVoices().filter(v=>v.localService===true)}
function matches(v,code){
 const tag=String(v.lang||'').toLowerCase().replace(/_/g,'-');
 if(code==='zh')return /^(?:zh-(?:cn|sg|tw)(?:-|$)|zh-(?:hans|hant)(?:-(?:cn|sg|tw))?$|cmn(?:-|$))/.test(tag)||tag==='zh';
 return tag===code||tag.startsWith(code+'-');
}
/* Browser voice availability varies; only names actually advertised by
 * speechSynthesis are usable. Cloud TTS voices are not automatically browser voices. */
function femaleMalay(v){
 if(!v||!matches(v,'ms'))return false;
 const id=(String(v.name||'')+' '+String(v.voiceURI||'')).normalize('NFKC').toLowerCase();
 if(/\b(?:osman|male|man)\b/i.test(id))return false;
 if(/\byasmin\b/i.test(id))return true; // Microsoft Yasmin (female)
 if(/\b(?:female|woman|lady)\b/i.test(id))return true;
 // Accept explicitly named Google Cloud female voice identifiers only when
 // the browser itself advertises them; do not call any cloud API.
 return /\bgoogle\b/i.test(id)&&/\b(?:wavenet|standard)[-_ ]?[ac]\b/i.test(id);
}
function preferred(list,code){
 const candidates=list.filter(v=>matches(v,code)),norm=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
 const name=v=>norm(v.name)+' '+norm(v.voiceURI);
 const rank=(v,patterns)=>patterns.findIndex(p=>p.test(name(v)));
 const genderMale=/\b(?:male|man|boy|osman|valluvar|surya|anbu|kumar)\b|男声|男聲/i;
 const genderFemale=/\b(?:female|woman|lady)\b|女声|女聲/i;
 // Female Malay voice is more important than provider. A generic "Google
 // Bahasa Melayu" label does not identify gender and may play a male voice.
 if(code==='ms'){
  const female=candidates.filter(femaleMalay);
  const quality=v=>{
   const id=name(v),tag=norm(v.lang).replace(/_/g,'-');
   return (/\byasmin\b/i.test(id)?0:/\bgoogle\b/i.test(id)?10:20)
     +(tag==='ms-my'?0:tag==='ms-sg'?2:4)
     -(/\b(?:natural|neural|enhanced|wavenet)\b/i.test(id)?1:0);
  };
  return female.sort((a,b)=>quality(a)-quality(b))[0]||null;
 }
 const known={
  en:[/\bgoogle\s+uk\s+english\s+female\b/i,/\b(?:microsoft\s+)?(?:sonia|libby|hazel)\b/i,/\b(?:serena|kate|heather|olivia|susan|zira|samantha|jenny|aria|natasha)\b/i],
  ms:[/\b(?:microsoft\s+)?yasmin\b/i],
  ta:[/\b(?:microsoft\s+)?venba\b/i,/\b(?:microsoft\s+)?kani\b/i,/\b(?:microsoft\s+)?pallavi\b/i,/\b(?:microsoft\s+)?saranya\b/i]
 }[code]||[];
 const female=candidates.filter(v=>{
  if(genderMale.test(name(v)))return false;
  return genderFemale.test(name(v))||rank(v,known)>=0;
 });
 const locales=code==='en'?['en-gb','en-sg','en-au','en-us']:code==='ms'?['ms-my','ms-sg']:['ta-sg','ta-my','ta-in','ta-lk'];
 const score=v=>{
  const match=rank(v,known),i=locales.indexOf(norm(v.lang).replace(/_/g,'-'));
  // Prioritise named high-quality female voices, then accent, then neural.
  return (match<0?100:match*15)+(i<0?50:i*4)-
   (/\b(?:natural|neural|premium|enhanced)\b/i.test(name(v))?2:0);
 };
 const chosen=female.sort((a,b)=>score(a)-score(b))[0];
 if(chosen)return chosen;
 // A voice without a verified female label is not auto-picked for English or Tamil.
 return null;
}

function refreshVoices(){
 if(voice&&language.value==='zh'&&chineseReaderVoice){voices=browserVoices().filter(v=>matches(v,'zh'));chineseReaderVoice.refresh(voices);return}
 chineseReaderVoice?.hide();
 if(!voice)return;const previous=voice.value;voices=browserVoices().filter(v=>matches(v,language.value)&& (language.value!=='ms'||femaleMalay(v)));voice.replaceChildren();
 const chinese=language.value==='zh';
 for(const [value,label] of [['auto',language.value==='ms'?(ui==='ms'?'Suara wanita (automatik)':'Female Malay (automatic)'):chinese?CHINESE_VOICE_COPY.automatic:L.automatic],...(language.value==='ms'?[]:[['builtin',chinese?CHINESE_VOICE_COPY.builtin:L.builtin]]),...voices.map((v,i)=>['voice-'+i,v.name+' · '+v.lang])]){const option=document.createElement('option');option.value=value;option.textContent=label;voice.append(option)}
 voice.value=[...voice.options].some(o=>o.value===previous)?previous:'auto';
 if(voiceHint)voiceHint.textContent=language.value==='ms'?(ui==='ms'?'Hanya suara wanita Bahasa Melayu disenaraikan. Yasmin diutamakan jika tersedia.':'Only verified female Malay voices are listed. Yasmin is preferred when available.'):chinese?CHINESE_VOICE_COPY.hint:L.local;
}
/* Reflow the narration copy only: original PDF, layout, annotations and
 * extracted preview are untouched. Blank lines remain paragraph boundaries. */
function reflowPdfForSpeech(raw,code){
 const lines=String(raw||'').replace(/\r\n?/g,'\n').replace(/[\u2028\u2029]/g,'\n').split('\n');
 let result='',paragraph=false;
 for(const original of lines){
  const line=original.trim();
  if(!line){if(result)paragraph=true;continue}
  if(result){
   if(paragraph)result+='\n\n';
   else if(code==='zh'){
    if(/[A-Za-z0-9]$/.test(result.slice(-1))&&/^[A-Za-z0-9]/.test(line))result+=' ';
   }else if(!/^[,.;:!?।॥，。！？；：、\)\]\}]/u.test(line)&&!/[\(\[\{]$/u.test(result))result+=' ';
  }
  result+=line;paragraph=false;
 }
 return result;
}
function reflowChinesePdfForSpeech(raw){return reflowPdfForSpeech(raw,'zh')}
function splitFluentSpeech(raw,code){
 const text=String(raw||''),locale=LANGS[code]?.tag||'en',max=code==='zh'?72:code==='ta'?92:125;
 const graphemes=s=>typeof Intl.Segmenter==='function'
  ?[...new Intl.Segmenter(locale,{granularity:'grapheme'}).segment(s)].map(x=>x.segment):Array.from(s);
 const sentences=typeof Intl.Segmenter==='function'
  ?[...new Intl.Segmenter(locale,{granularity:'sentence'}).segment(text)].map(x=>x.segment)
  :text.split(/(?<=[.!?。！？])\s*/u);
 const chunks=[];let pending='',offset=0;
 const emit=s=>{const value=s.trim();if(!value)return;const at=text.indexOf(value,offset),start=at<0?offset:at;chunks.push({text:value,start,end:start+value.length});offset=start+value.length};
 for(const sentence of sentences){
  if(graphemes(pending+sentence).length<=max){pending+=sentence;continue}
  emit(pending);pending='';
  const pieces=graphemes(sentence);
  if(pieces.length<=max){pending=sentence;continue}
  let i=0;
  while(pieces.length-i>max){
   let end=i+max;
   for(let k=end-1;k>=i+Math.floor(max*.56);k--){
    if(/[，,;；:：.!?。！？]/u.test(pieces[k])){end=k+1;break}
    if(/\s/u.test(pieces[k])){end=k+1;break}
   }
   emit(pieces.slice(i,end).join(''));i=end;
  }
  pending=pieces.slice(i).join('');
 }
 emit(pending);return chunks;
}
function splitText(text,code){return splitFluentSpeech(text,code)}

function synthesize(text,code,rate){
 if(!worker){worker=new Worker(workerUrl,{type:'module'});worker.addEventListener('message',event=>{const result=event.data||{},request=pending.get(result.id);if(!request)return;pending.delete(result.id);clearTimeout(request.timer);result.error?request.reject(Error(result.error)):request.resolve(result)});worker.addEventListener('error',()=>resetWorker(Error('Local speech worker failed')))}
 return new Promise((resolve,reject)=>{const id=++workerSerial,timer=setTimeout(()=>resetWorker(Error('Local voice timed out')),45000);pending.set(id,{resolve,reject,timer});worker.postMessage({id,text,language:code,rate})});
}
function resetWorker(error){if(worker)worker.terminate();worker=null;for(const request of pending.values()){clearTimeout(request.timer);request.reject(error)}pending.clear()}
async function localChunk(chunk,job){
 if(job.id!==run)return;
 say('preparing');const context=primeAudio();if(!context)throw Error('Audio unavailable');
 const result=await synthesize(chunk.text,job.code,job.rate);if(job.id!==run)return;
 if(context.state!=='running')await context.resume();if(job.id!==run)return;
 const samples=result.samples;if(!(samples instanceof Int16Array)||!samples.length||!Number.isFinite(result.sampleRate))throw Error('Empty local speech');
 const buffer=context.createBuffer(1,samples.length,result.sampleRate),channel=buffer.getChannelData(0);for(let i=0;i<samples.length;i++)channel[i]=samples[i]/32768;
 await new Promise((resolve,reject)=>{const player=context.createBufferSource();audioSource=player;player.buffer=buffer;player.connect(context.destination);player.onended=()=>{player.disconnect();if(audioSource===player)audioSource=null;resolve()};try{say('reading');player.start()}catch(error){reject(error)}});
}
function systemChunk(chunk,job,chosen){
 return new Promise((resolve,reject)=>{
  if(job.id!==run){resolve();return}
  const utterance=new Utterance(chunk.text);let settled=false,timer=null;
  function finish(error){
   if(settled)return;settled=true;clearTimeout(timer);
   if(cancelNative===cancel)cancelNative=null;if(activeUtterance===utterance)activeUtterance=null;
   error&&job.id===run?reject(error):resolve();
  }
  const cancel=()=>finish();cancelNative=cancel;activeUtterance=utterance;
  utterance.lang=chosen.lang||LANGS[job.code].tag;utterance.voice=chosen;utterance.rate=job.rate;utterance.pitch=1;utterance.volume=1;
  utterance.onstart=()=>{clearTimeout(timer);if(job.id===run)say('reading')};utterance.onend=()=>finish();utterance.onerror=event=>finish(Error(event.error||'Speech failed'));
  timer=setTimeout(()=>{
   if(job.id!==run){finish();return}
   finish(Error('Device voice did not start'));try{synth.cancel()}catch{}
  },4000);
  try{synth.resume();synth.speak(utterance)}catch(error){finish(error)}
 });
}
async function play(text){
 const value=String(text||'').trim();if(!value){say('choose');return}
 if(source?.document&&!sameDocument(source.document,window.CCDocumentText?.snapshot())){invalidate();return}
 if(language.value==='zh'&&chineseReaderVoice)refreshVoices();
 stop('');primeAudio();
 // Prevent the dictation microphone from transcribing the reader's own voice.
 const micStop=document.querySelector('#ccSpeechToTextPanel [data-action=stop]');if(micStop&&!micStop.disabled)micStop.click();
 const job={id:run,code:language.value,rate:Number(speed.value)||1},selected=voice.value;
 last={text:value,code:job.code};setState('reading');say('reading');
 try{
  if(job.code==='zh'&&!chineseReaderVoice){setState('idle');say('failed');return}
  const choice=job.code==='zh'?await chineseReaderVoice.ready(()=>job.id!==run):null;
  if(job.id!==run)return;
  if(choice?.missing){setState('idle');chineseReaderVoice.missing();notice(status.textContent);return}
  let chosen=choice?choice.voice:selected==='builtin'?null:selected.startsWith('voice-')?voices[Number(selected.slice(6))]:preferred(browserVoices().filter(v=>matches(v,job.code)),job.code);
  if(job.code==='ms'){
   // A stale selection, unnamed generic Google voice or absent Web Speech
   // voice must never silently fall back to the synthetic male voice.
   if(!femaleMalay(chosen))chosen=preferred(browserVoices(),'ms');
   if(!chosen||!synth||!Utterance){
    stop('');const msg=L.femaleMissing;if(status)status.textContent=msg;notice(msg);return;
   }
  }
  const speechCopy=source?.document?.kind==='pdf'?reflowPdfForSpeech(value,job.code):value;
  const chunks=splitText(speechCopy,job.code);
  for(const chunk of chunks){
   if(job.id!==run)return;
   if(source?.document&&!sameDocument(source.document,window.CCDocumentText?.snapshot())){invalidate();return}
   if(chosen&&synth&&Utterance){try{await systemChunk(chunk,job,chosen)}catch(error){if(job.id!==run)return;if(job.code==='ms'||job.code==='zh'&&chineseReaderVoice)throw error;chosen=null;say('fallback');await localChunk(chunk,job)}}else await localChunk(chunk,job);
  }
  if(job.id===run){setState('idle');say('finished')}
 }catch(error){if(job.id===run){stop('failed');if(job.code==='zh'){chineseReaderVoice?.failed();notice(status.textContent)}else if(job.code==='ms'){const msg=L.femaleFailed;if(status)status.textContent=msg;notice(msg)}console.warn('[Read Aloud]',error.message)}}
}
function readPreview(){
 const start=preview.selectionStart,end=preview.selectionEnd;
 const selected=end>start?preview.value.slice(start,end):preview.value;
 void play(selected);
}
function boardText(){
 const objects=(typeof strokes==='undefined'?[]:strokes).filter(object=>object&&!object.erase);
 const items=objects.map(object=>({object,text:String(object.type==='text'?object.text||'':object.handwritingBeautified?object.handwritingReading||'':'').trim()})).filter(item=>item.text);
 items.sort((a,b)=>(a.object.y||0)-(b.object.y||0)||(a.object.x||0)-(b.object.x||0));
 const rows=[];
 for(const item of items){
  const y=Number(item.object.y)||0,previous=rows.at(-1);
  const tolerance=Math.max(.005,Math.min(.025,(Number(item.object.h)||.05)*.2));
  if(previous&&Math.abs(y-previous.y)<=tolerance)previous.items.push(item);else rows.push({y,items:[item]});
 }
 return rows.flatMap(row=>row.items.sort((a,b)=>(a.object.x||0)-(b.object.x||0)).map(item=>item.text)).join('\n');
}
function fill(text,label,documentSource=null){
 stop('');last=null;source={document:documentSource};const full=String(text||'').trim();preview.value=full.slice(0,200000);preview.setSelectionRange(0,0);sourceLabel.textContent=label||'';setState('idle');say(full.length>200000?'long':full?'ready':'choose');
}
async function loadDocument(autoRead=false,annotations=''){
 const ticket=++extract,snapshot=window.CCDocumentText?.snapshot();
 stop('');const expectedRun=run;if(!snapshot?.open){say('noDocument');return}if(!snapshot.ready){say('busy');return}say('loading');setState('loading');
 try{const result=await window.CCDocumentText.read();if(ticket!==extract||expectedRun!==run||(panel.hidden&&!quickMode))return;if(!sameDocument(result,window.CCDocumentText.snapshot())){invalidate();return}
  const text=[result.text,annotations].filter(value=>value?.trim()).join('\n\n');
  fill(text,result.name+(result.scope==='page'?' · '+L.page+' '+result.page+'/'+result.pages:''),result);if(!text)say('noText');else if(autoRead)void play(preview.value);
 }catch{if(ticket===extract&&expectedRun===run){setState('idle');say('changed')}}
}
function invalidate(){++extract;stop('changed');last=null;source=null;if(preview){preview.value='';sourceLabel.textContent='';setState('idle')}}
function close(){++extract;stop('');quickMode=false;panel.hidden=true;mainButton?.setAttribute('aria-expanded','false');mainButton?.focus({preventScroll:true})}
function open(autoRead=false,quick=false){
 quickMode=quick;panel.hidden=quick;if(!quick)mainButton.setAttribute('aria-expanded','true');refreshVoices();
 const text=boardText();if(autoRead)primeAudio();
 if(window.CCDocumentText?.snapshot().open)void loadDocument(autoRead,text);
 else{fill(text,L.board);if(text&&autoRead)void play(preview.value);else if(!text)say('empty')}
 if(!quick)preview.focus({preventScroll:true});
}
function button(text,action,cls=''){const b=document.createElement('button');b.type='button';b.textContent=text;b.dataset.readAction=action;if(cls)b.className=cls;return b}
function boot(){
 const anchor=document.getElementById('speechToTextBtn');if(!anchor)return;
 mainButton=button('🔊 '+L.short,'open','btn soft');mainButton.id='ccReadAloudBtn';mainButton.title=L.title;mainButton.setAttribute('aria-label',L.title);mainButton.setAttribute('aria-expanded','false');mainButton.setAttribute('aria-controls','ccReadAloudPanel');anchor.insertAdjacentElement('afterend',mainButton);
 {
  mainButton.removeAttribute('aria-controls');mainButton.removeAttribute('aria-expanded');mainButton.setAttribute('aria-pressed','false');
  const quickLabel=document.createElement('label');quickLabel.className='cc-reader-inline-speed';quickLabel.htmlFor='ccReadAloudQuickSpeed';
  const caption=document.createElement('span');caption.textContent=L.speed;
  quickSpeed=document.createElement('select');quickSpeed.id='ccReadAloudQuickSpeed';quickSpeed.setAttribute('aria-label',L.speed);
  for(const rate of [.7,.85,1,1.15,1.3]){const opt=document.createElement('option');opt.value=String(rate);opt.textContent=rate+'×';quickSpeed.append(opt)}
  quickLabel.append(caption,quickSpeed);mainButton.insertAdjacentElement('afterend',quickLabel);
 }
 panel=document.createElement('section');panel.id='ccReadAloudPanel';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-label',L.title);panel.setAttribute('lang',LANGS[ui].tag);
 const head=document.createElement('div');head.className='cc-reader-head';const heading=document.createElement('strong');heading.textContent='🔊 '+L.title;const x=button('×','close');x.setAttribute('aria-label',L.close);head.append(heading,x);
 const sources=document.createElement('div');sources.className='cc-reader-sources';sources.append(button(L.selection,'selection'),button(L.document,'document'));
 sourceLabel=document.createElement('p');sourceLabel.className='cc-reader-source';
 const hint=document.createElement('p');hint.className='cc-reader-hint';hint.textContent=L.hint;
 preview=document.createElement('textarea');preview.id='ccReadAloudText';preview.readOnly=true;preview.rows=7;preview.wrap='soft';preview.setAttribute('aria-label',L.preview);
 const controls=document.createElement('div');controls.className='cc-reader-controls';read=button('▶ '+L.read,'read','cc-reader-primary');stopButton=button('■ '+L.stop,'stop');repeat=button('↻ '+L.repeat,'repeat');controls.append(read,stopButton,repeat);
 const options=document.createElement('div');options.className='cc-reader-options';
 function select(label,items,id){const wrap=document.createElement('label');wrap.textContent=label;const sel=document.createElement('select');sel.id=id;sel.setAttribute('aria-label',label);for(const [value,text] of items){const option=document.createElement('option');option.value=value;option.textContent=text;sel.append(option)}wrap.append(sel);return [wrap,sel]}
 const [languageLabel,languageSelect]=select(L.language,Object.entries(LANGS).map(([key,value])=>[key,value.name]),'ccReadAloudLanguage');language=languageSelect;language.value=ui;
 const [speedLabel,speedSelect]=select(L.speed,[.7,.85,1,1.15,1.3].map(value=>[String(value),value+'×']),'ccReadAloudSpeed');speed=speedSelect;speed.value=ui==='zh'?'0.85':'1';options.append(languageLabel,speedLabel);
 const details=document.createElement('details');const summary=document.createElement('summary');summary.textContent=L.voice;const [voiceLabel,voiceSelect]=select(L.voice,[],'ccReadAloudVoice');voice=voiceSelect;voiceHint=document.createElement('p');voiceHint.className='cc-reader-hint';details.append(summary,voiceLabel,voiceHint);
 status=document.createElement('p');status.id='ccReadAloudStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 panel.append(head,sources,sourceLabel,hint,preview,controls,options,details,status);document.body.append(panel);
 if(window.CCChineseReaderVoice)chineseReaderVoice=window.CCChineseReaderVoice.create({ui,host:panel,details,voice,speed,status,onRefresh:refreshVoices});
 refreshVoices();if(quickSpeed)quickSpeed.value=speed.value;setState('idle');say('empty');
 mainButton.addEventListener('click',()=>{if(state!=='idle')stop();else open(true,true)});
 if(quickSpeed)quickSpeed.addEventListener('change',()=>{
  const wasReading=state!=='idle';if(wasReading)stop('');speed.value=quickSpeed.value;chineseReaderVoice?.changed();
  if(wasReading)open(true,true);
 });
 panel.addEventListener('click',event=>{const action=event.target.closest('[data-read-action]')?.dataset.readAction;if(!action)return;if(action==='close'){close();return}if(action==='read'){readPreview();return}if(action==='stop'){stop();return}if(action==='repeat'){if(last){language.value=last.code;refreshVoices();void play(last.text)}return}if(action==='document'){void loadDocument();return}if(action==='selection'){const text=boardText();if(text)fill(text,L.board);else say('choose')}});
 for(const option of [language,speed,voice])option.addEventListener('change',()=>{stop('ready');if(option===language)refreshVoices();else if(language.value==='zh')chineseReaderVoice?.changed();if(quickSpeed)quickSpeed.value=speed.value});
 synth?.addEventListener?.('voiceschanged',refreshVoices);
 const toolbar=document.getElementById('documentQuickBar');
 function rail(){const top=document.getElementById('documentRailTop');if(!top||document.getElementById('ccDocumentReadBtn'))return;const search=top.querySelector('.doc-search-main');const row=document.createElement('div');row.className='cc-reader-rail-row';railButton=button('🔊','open','doc-search-main');railButton.id='ccDocumentReadBtn';railButton.title=L.title;railButton.setAttribute('aria-label',L.title);railButton.addEventListener('click',()=>{if(state!=='idle')stop();else open(true,true)});if(search)row.append(search);row.append(railButton);top.append(row)}
 if(toolbar){rail();new MutationObserver(rail).observe(toolbar,{childList:true,subtree:true})}
 for(const event of ['cc-document-opened','cc-document-closed','cc-document-page-changing'])window.addEventListener(event,()=>{if(source?.document||state!=='idle')invalidate()});
 window.addEventListener('pagehide',()=>{stop('');resetWorker(Error('Page closed'));audio?.close().catch(()=>{})});
}
// Register before the whiteboard's keyboard shortcuts, scoped to the reader.
window.addEventListener('keydown',event=>{if(event.target===mainButton&&(event.key==='Enter'||event.key===' ')){event.preventDefault();event.stopImmediatePropagation();mainButton.click();return}if(!panel||panel.hidden||!event.target?.closest?.('#ccReadAloudPanel'))return;if(event.key==='Escape'){event.preventDefault();close()}event.stopImmediatePropagation()},true);
window.CCReadAloud=Object.freeze({open:()=>open(),stop:()=>stop(),state:()=>({state,language:language?.value,source:source?.document?{...source.document,text:undefined}:null}),splitText,reflowChinesePdfForSpeech,reflowPdfForSpeech});
if(document.readyState!=='complete')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
