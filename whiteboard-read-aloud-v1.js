/* Shared Read Selected: browser/device voices with a same-origin local fallback.
 * Only reads text. No board objects, documents, annotations or saved data are changed. */
(function(){
'use strict';
if(!/\/whiteboard-smart-beta\.html$/i.test(location.pathname)||window.CCReadAloud)return;
const LANGS={en:{tag:'en-SG',name:'English'},zh:{tag:'zh-CN',name:'中文'},ms:{tag:'ms-MY',name:'Bahasa Melayu'},ta:{tag:'ta-SG',name:'தமிழ்'}};
const edition=new URLSearchParams(location.search).get('edition')||'en',ui=LANGS[edition]?edition:'en';
const COPY={
 en:{short:'Read',title:'Read selected text',close:'Close',read:'Read',stop:'Stop',repeat:'Repeat',speed:'Speed',language:'Language',voice:'Voice',automatic:'Automatic',builtin:'Built-in voice',selection:'Use selected text',document:'Load document text',preview:'Text to read',hint:'Select words in this box, then Read. With no selection, Read speaks all the text shown.',empty:'Use Select to choose a text box, beautified text or speech-to-text output. For a document, choose Load document text.',loading:'Getting document text…',ready:'Ready to read.',reading:'Reading…',stopped:'Stopped.',finished:'Finished reading.',choose:'Select some text first, or load document text.',noDocument:'Open a document first.',busy:'The document is still loading. Try again shortly.',noText:'No readable text found. Scanned PDFs and pictures need OCR.',changed:'The document or page changed. Load its text again.',failed:'Unable to read. Try Built-in voice.',preparing:'Preparing the built-in voice…',fallback:'Using the built-in voice.',page:'Page',board:'Whiteboard selection',local:'Built-in speech works without installing a voice. Its sound is more synthetic.',unavailable:'Audio is unavailable in this browser.',long:'The first 200,000 characters are shown. Select a shorter passage to read.'},
 zh:{short:'朗读',title:'朗读所选文字',close:'关闭',read:'朗读',stop:'停止',repeat:'重读',speed:'语速',language:'语言',voice:'声音',automatic:'自动选择',builtin:'内置声音',selection:'使用所选文字',document:'载入文档文字',preview:'朗读文字',hint:'选中框内的词句，再点击“朗读”。未选择时，将朗读框内全部文字。',empty:'用“选择”工具选中文本框、美化后的文字或语音转文字内容。文档请点击“载入文档文字”。',loading:'正在提取文档文字……',ready:'可以开始朗读。',reading:'正在朗读……',stopped:'已停止。',finished:'朗读完毕。',choose:'请先选择文字，或载入文档文字。',noDocument:'请先打开文档。',busy:'文档仍在载入，请稍后重试。',noText:'未找到可朗读的文字。扫描版 PDF 和图片需要文字识别。',changed:'文档或页面已更改，请重新载入文字。',failed:'无法朗读，请尝试“内置声音”。',preparing:'正在准备内置声音……',fallback:'正在使用内置声音。',page:'页',board:'白板所选文字',local:'内置朗读无需安装声音，音色较为机械。',unavailable:'此浏览器无法播放语音。',long:'显示前 200,000 个字符，请选择较短的段落朗读。'},
 ms:{short:'Baca',title:'Baca teks terpilih',close:'Tutup',read:'Baca',stop:'Henti',repeat:'Ulang',speed:'Kelajuan',language:'Bahasa',voice:'Suara',automatic:'Automatik',builtin:'Suara terbina dalam',selection:'Guna teks terpilih',document:'Muatkan teks dokumen',preview:'Teks untuk dibaca',hint:'Pilih perkataan dalam kotak ini, kemudian tekan Baca. Jika tiada pilihan, semua teks yang dipaparkan akan dibaca.',empty:'Gunakan Pilih untuk memilih kotak teks, tulisan yang dikemaskan atau hasil pertuturan ke teks. Untuk dokumen, tekan Muatkan teks dokumen.',loading:'Mendapatkan teks dokumen…',ready:'Sedia untuk membaca.',reading:'Sedang membaca…',stopped:'Dihentikan.',finished:'Bacaan selesai.',choose:'Pilih teks dahulu atau muatkan teks dokumen.',noDocument:'Buka dokumen dahulu.',busy:'Dokumen masih dimuatkan. Cuba sebentar lagi.',noText:'Tiada teks yang boleh dibaca. PDF imbasan dan gambar memerlukan OCR.',changed:'Dokumen atau halaman telah berubah. Muatkan teks semula.',failed:'Tidak dapat membaca. Cuba Suara terbina dalam.',preparing:'Menyediakan suara terbina dalam…',fallback:'Menggunakan suara terbina dalam.',page:'Halaman',board:'Teks papan putih terpilih',local:'Suara terbina dalam berfungsi tanpa memasang suara. Bunyinya lebih sintetik.',unavailable:'Audio tidak tersedia dalam pelayar ini.',long:'200,000 aksara pertama dipaparkan. Pilih petikan lebih pendek untuk dibaca.'},
 ta:{short:'வாசி',title:'தேர்ந்தெடுத்த உரையை வாசி',close:'மூடு',read:'வாசி',stop:'நிறுத்து',repeat:'மீண்டும் வாசி',speed:'வேகம்',language:'மொழி',voice:'குரல்',automatic:'தானாகத் தேர்வு',builtin:'உள்ளமைந்த குரல்',selection:'தேர்ந்தெடுத்த உரையைப் பயன்படுத்து',document:'ஆவண உரையை ஏற்று',preview:'வாசிப்பதற்கான உரை',hint:'இந்தப் பெட்டியில் சொற்களைத் தேர்ந்தெடுத்து வாசி என்பதை அழுத்தவும். தேர்வு இல்லாவிட்டால், காட்டப்படும் முழு உரையும் வாசிக்கப்படும்.',empty:'உரைப்பெட்டி, அழகாக்கிய எழுத்து அல்லது பேச்சிலிருந்து உருவான உரையைத் தேர்வுக் கருவியால் தேர்ந்தெடுக்கவும். ஆவணத்திற்கு ஆவண உரையை ஏற்று என்பதை அழுத்தவும்.',loading:'ஆவண உரையைப் பெறுகிறது…',ready:'வாசிக்கத் தயார்.',reading:'வாசிக்கிறது…',stopped:'நிறுத்தப்பட்டது.',finished:'வாசித்து முடிந்தது.',choose:'முதலில் உரையைத் தேர்ந்தெடுக்கவும் அல்லது ஆவண உரையை ஏற்றவும்.',noDocument:'முதலில் ஆவணத்தைத் திறக்கவும்.',busy:'ஆவணம் ஏற்றப்படுகிறது. சிறிது நேரத்தில் முயலவும்.',noText:'வாசிக்கக்கூடிய உரை இல்லை. வருடப்பட்ட PDF கோப்புகளுக்கும் படங்களுக்கும் OCR தேவை.',changed:'ஆவணம் அல்லது பக்கம் மாறிவிட்டது. உரையை மீண்டும் ஏற்றவும்.',failed:'வாசிக்க முடியவில்லை. உள்ளமைந்த குரலை முயலவும்.',preparing:'உள்ளமைந்த குரலைத் தயார் செய்கிறது…',fallback:'உள்ளமைந்த குரலைப் பயன்படுத்துகிறது.',page:'பக்கம்',board:'தேர்ந்தெடுத்த வெண்பலகை உரை',local:'குரலை நிறுவாமல் உள்ளமைந்த குரல் இயங்கும். அதன் ஒலி செயற்கையாக இருக்கும்.',unavailable:'இந்த உலாவியில் ஒலி கிடைக்கவில்லை.',long:'முதல் 200,000 எழுத்துகள் காட்டப்படுகின்றன. வாசிக்கச் சிறிய பகுதியைத் தேர்ந்தெடுக்கவும்.'}
};
const L=COPY[ui],synth=window.speechSynthesis,Utterance=window.SpeechSynthesisUtterance;
let panel,preview,status,sourceLabel,language,voice,speed,read,stopButton,repeat,mainButton,railButton;
let voices=[],run=0,extract=0,state='idle',last=null,source=null,captured='',activeUtterance=null;
let audio=null,audioSource=null,worker=null,workerSerial=0,pending=new Map();
const workerUrl=new URL('vendor/read-aloud/worker.js?v=20261029-read1',document.currentScript.src);
function say(key){if(status)status.textContent=L[key]||key}
function setState(value){state=value;if(stopButton)stopButton.disabled=value==='idle';if(repeat)repeat.disabled=!last;if(read)read.disabled=!preview?.value.trim();if(panel)panel.dataset.state=value}
function sameDocument(a,b){return !!a&&!!b&&a.open&&b.open&&a.session===b.session&&a.page===b.page}
function stop(message='stopped'){
 ++run;activeUtterance=null;
 if(synth)try{synth.cancel()}catch{}
 if(audioSource){audioSource.onended=null;try{audioSource.stop();audioSource.disconnect()}catch{}audioSource=null}
 setState('idle');if(message)say(message);
}
function primeAudio(){
 try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;if(!audio||audio.state==='closed')audio=new C();if(audio.state!=='running')audio.resume().catch(()=>{});return audio}catch{return null}
}
function nativeVoices(){
 try{return (synth?.getVoices()||[]).filter(v=>v.localService===true)}catch{return []}
}
function matches(v,code){
 const tag=String(v.lang||'').toLowerCase().replace(/_/g,'-');
 if(code==='zh')return /^(?:zh-(?:cn|sg|tw)|cmn(?:-|$))/.test(tag)||tag==='zh';
 return tag===code||tag.startsWith(code+'-');
}
function preferred(list,code){
 const tags=code==='en'?['en-sg','en-gb','en-us']:code==='zh'?['zh-sg','zh-cn','cmn-hans-cn','zh-tw']:code==='ms'?['ms-sg','ms-my']:['ta-sg','ta-in','ta-lk'];
 return [...list].sort((a,b)=>{const score=v=>{const i=tags.indexOf(String(v.lang).toLowerCase());return i<0?99:i};return score(a)-score(b)})[0];
}
function refreshVoices(){
 if(!voice)return;const previous=voice.value;voices=nativeVoices().filter(v=>matches(v,language.value));voice.replaceChildren();
 for(const [value,label] of [['auto',L.automatic],['builtin',L.builtin],...voices.map((v,i)=>['voice-'+i,v.name+' · '+v.lang])]){const option=document.createElement('option');option.value=value;option.textContent=label;voice.append(option)}
 voice.value=[...voice.options].some(o=>o.value===previous)?previous:'auto';
}
function splitText(text,code){
 const sentences=typeof Intl.Segmenter==='function'?[...new Intl.Segmenter(LANGS[code]?.tag||'en',{granularity:'sentence'}).segment(text)].map(x=>({text:x.segment,start:x.index})):[{text,start:0}];
 const chunks=[],limit=code==='zh'?55:code==='ta'?85:140;
 for(const sentence of sentences){
  const symbols=typeof Intl.Segmenter==='function'?[...new Intl.Segmenter(LANGS[code]?.tag||'en',{granularity:'grapheme'}).segment(sentence.text)].map(x=>({text:x.segment,index:x.index})):Array.from(sentence.text).map((text,i,all)=>({text,index:all.slice(0,i).join('').length}));
  let i=0;
  while(i<symbols.length){let end=Math.min(symbols.length,i+limit);if(end<symbols.length){for(let k=end;k>i+Math.floor(limit*.55);k--)if(/\s/.test(symbols[k-1].text)){end=k;break}}
   const raw=symbols.slice(i,end).map(x=>x.text).join(''),trimmed=raw.trim();
   if(trimmed){const start=sentence.start+symbols[i].index+raw.indexOf(trimmed);chunks.push({text:trimmed,start,end:start+trimmed.length})}i=end;
  }
 }
 return chunks;
}
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
  const utterance=new Utterance(chunk.text);activeUtterance=utterance;utterance.lang=chosen.lang||LANGS[job.code].tag;utterance.voice=chosen;utterance.rate=job.rate;utterance.pitch=1;utterance.volume=1;
  utterance.onstart=()=>{if(job.id===run)say('reading')};utterance.onend=()=>{if(activeUtterance===utterance)activeUtterance=null;resolve()};utterance.onerror=event=>{if(job.id!==run){resolve();return}reject(Error(event.error||'Speech failed'))};
  try{synth.resume();synth.speak(utterance)}catch(error){reject(error)}
 });
}
async function play(text){
 const value=String(text||'').trim();if(!value){say('choose');return}
 if(source?.document&&!sameDocument(source.document,window.CCDocumentText?.snapshot())){invalidate();return}
 stop('');primeAudio();
 // Prevent the dictation microphone from transcribing the reader's own voice.
 const micStop=document.querySelector('#ccSpeechToTextPanel [data-action=stop]');if(micStop&&!micStop.disabled)micStop.click();
 const job={id:run,code:language.value,rate:Number(speed.value)||1},selected=voice.value;
 const chosen=selected==='builtin'?null:selected.startsWith('voice-')?voices[Number(selected.slice(6))]:preferred(nativeVoices().filter(v=>matches(v,job.code)),job.code);
 last={text:value,code:job.code};setState('reading');
 try{
  const chunks=splitText(value,job.code);
  for(const chunk of chunks){
   if(job.id!==run)return;
   if(source?.document&&!sameDocument(source.document,window.CCDocumentText?.snapshot())){invalidate();return}
   if(chosen&&synth&&Utterance){try{await systemChunk(chunk,job,chosen)}catch{if(job.id!==run)return;say('fallback');await localChunk(chunk,job)}}else await localChunk(chunk,job);
  }
  if(job.id===run){setState('idle');say('finished')}
 }catch(error){if(job.id===run){stop('failed');console.warn('[Read Aloud]',error.message)}}
}
function readPreview(){
 const start=preview.selectionStart,end=preview.selectionEnd;
 const selected=end>start?preview.value.slice(start,end):preview.value;
 void play(selected);
}
function boardSelection(){
 const selection=window.ClassroomObjectSelection?.getSelectedText?.();if(selection?.trim())return selection;
 const objects=window.WhiteboardMarqueeSelection?.get?.()||[];
 return objects.filter(o=>o?.type==='text'||o?.handwritingBeautified).sort((a,b)=>(a.y||0)-(b.y||0)||(a.x||0)-(b.x||0)).map(o=>o.type==='text'?o.text:o.handwritingReading).filter(Boolean).join('\n');
}
function captureSelection(){
 const element=document.activeElement;
 if(element?.tagName==='TEXTAREA'&&(element.closest('#boardWrap')||element.closest('#ccSpeechToTextPanel'))){const a=element.selectionStart,b=element.selectionEnd;if(b>a)return element.value.slice(a,b)}
 const selected=window.getSelection();if(selected&&!selected.isCollapsed&&selected.anchorNode?.parentElement?.closest('#documentUnderlay'))return selected.toString();
 return boardSelection();
}
function fill(text,label,documentSource=null){
 stop('');last=null;source={document:documentSource};const full=String(text||'').trim();preview.value=full.slice(0,200000);preview.setSelectionRange(0,0);sourceLabel.textContent=label||'';setState('idle');say(full.length>200000?'long':full?'ready':'choose');
}
async function loadDocument(){
 const ticket=++extract,snapshot=window.CCDocumentText?.snapshot();
 stop('');if(!snapshot?.open){say('noDocument');return}if(!snapshot.ready){say('busy');return}say('loading');
 try{const result=await window.CCDocumentText.read();if(ticket!==extract||panel.hidden)return;if(!sameDocument(result,window.CCDocumentText.snapshot())){invalidate();return}
  fill(result.text,result.name+(result.scope==='page'?' · '+L.page+' '+result.page+'/'+result.pages:''),result);if(!result.text)say('noText');
 }catch{if(ticket===extract)say('changed')}
}
function invalidate(){++extract;stop('changed');last=null;source=null;if(preview){preview.value='';sourceLabel.textContent='';setState('idle')}}
function close(){++extract;stop('');panel.hidden=true;mainButton?.setAttribute('aria-expanded','false');mainButton?.focus({preventScroll:true})}
function open(selected=captureSelection()){
 panel.hidden=false;mainButton.setAttribute('aria-expanded','true');refreshVoices();
 if(selected?.trim())fill(selected,L.board);else if(window.CCDocumentText?.snapshot().open)void loadDocument();else if(!preview.value){say('empty')}
 preview.focus({preventScroll:true});
}
function button(text,action,cls=''){const b=document.createElement('button');b.type='button';b.textContent=text;b.dataset.readAction=action;if(cls)b.className=cls;return b}
function boot(){
 const anchor=document.getElementById('speechToTextBtn');if(!anchor)return;
 mainButton=button('🔊 '+L.short,'open','btn soft');mainButton.id='ccReadAloudBtn';mainButton.title=L.title;mainButton.setAttribute('aria-label',L.title);mainButton.setAttribute('aria-expanded','false');mainButton.setAttribute('aria-controls','ccReadAloudPanel');anchor.insertAdjacentElement('afterend',mainButton);
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
 const [speedLabel,speedSelect]=select(L.speed,[.7,.85,1,1.15,1.3].map(value=>[String(value),value+'×']),'ccReadAloudSpeed');speed=speedSelect;speed.value='1';options.append(languageLabel,speedLabel);
 const details=document.createElement('details');const summary=document.createElement('summary');summary.textContent=L.voice;const [voiceLabel,voiceSelect]=select(L.voice,[],'ccReadAloudVoice');voice=voiceSelect;const note=document.createElement('p');note.textContent=L.local;note.className='cc-reader-hint';details.append(summary,voiceLabel,note);
 status=document.createElement('p');status.id='ccReadAloudStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 panel.append(head,sources,sourceLabel,hint,preview,controls,options,details,status);document.body.append(panel);refreshVoices();setState('idle');say('empty');
 mainButton.addEventListener('pointerdown',()=>{captured=captureSelection()},true);mainButton.addEventListener('click',()=>{open(captured||captureSelection());captured=''});
 panel.addEventListener('click',event=>{const action=event.target.closest('[data-read-action]')?.dataset.readAction;if(!action)return;if(action==='close'){close();return}if(action==='read'){readPreview();return}if(action==='stop'){stop();return}if(action==='repeat'){if(last){language.value=last.code;refreshVoices();void play(last.text)}return}if(action==='document'){void loadDocument();return}if(action==='selection'){const text=boardSelection();if(text)fill(text,L.board);else say('choose')}});
 for(const option of [language,speed,voice])option.addEventListener('change',()=>{stop('ready');if(option===language)refreshVoices()});
 synth?.addEventListener?.('voiceschanged',refreshVoices);
 const toolbar=document.getElementById('documentQuickBar');
 function rail(){const top=document.getElementById('documentRailTop');if(!top||document.getElementById('ccDocumentReadBtn'))return;const search=top.querySelector('.doc-search-main');const row=document.createElement('div');row.className='cc-reader-rail-row';railButton=button('🔊','open','doc-search-main');railButton.id='ccDocumentReadBtn';railButton.title=L.title;railButton.setAttribute('aria-label',L.title);railButton.addEventListener('click',()=>open());if(search)row.append(search);row.append(railButton);top.append(row)}
 if(toolbar){rail();new MutationObserver(rail).observe(toolbar,{childList:true,subtree:true})}
 for(const event of ['cc-document-opened','cc-document-closed','cc-document-page-changing'])window.addEventListener(event,()=>{if(source?.document||state!=='idle')invalidate()});
 window.addEventListener('pagehide',()=>{stop('');resetWorker(Error('Page closed'));audio?.close().catch(()=>{})});
}
// Register before the whiteboard's keyboard shortcuts, scoped to the reader.
window.addEventListener('keydown',event=>{if(!panel||panel.hidden||!event.target?.closest?.('#ccReadAloudPanel'))return;if(event.key==='Escape'){event.preventDefault();close()}event.stopImmediatePropagation()},true);
window.CCReadAloud=Object.freeze({open:()=>open(),stop:()=>stop(),state:()=>({state,language:language?.value,source:source?.document?{...source.document,text:undefined}:null}),splitText});
if(document.readyState!=='complete')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
