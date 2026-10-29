/* Chinese browser-voice previews. Stores a voice preference, never reader text. */
(function(){
'use strict';
if(window.CCChineseVoicePicker)return;
const COPY={
 zh:{try:'试听 / 选声音',title:'选一个喜欢的声音',hint:'每个声音试听同一句话。选好后会在此浏览器记住。',sample:'同学们，大家好。我们一起学习。',online:'在线 · 需要网络',local:'本机',privacy:'在线声音会将文字交由浏览器的语音服务处理。试听只使用上面的示例句；选好后才用于白板或文档朗读。',listen:'▶ 试听',use:'使用此声音',useOnline:'使用此在线声音',selected:'已选择',automatic:'自动选择本机女声',builtin:'内置女声（备用）',none:'此设备暂时没有可试听的普通话声音，可继续使用内置女声。',missing:'上次选择的声音暂不可用，请试听并选择另一种声音。',saved:'已记住此声音。点击“朗读”即可使用。',session:'已选择此声音；此浏览器暂时无法保存设置。',fast:'响应快',slow:'响应较慢',failed:'暂时无法播放',listening:'正在试听……',error:'这个声音暂时无法播放，请试听其他声音。',current:'声音：',playing:'正在使用：',backup:'原声音暂不可用，正在使用备用声音。',unavailable:'暂不可用'},
 en:{try:'Try / choose voice',title:'Choose a voice you like',hint:'Each preview reads the same Chinese sentence. Your choice is remembered in this browser.',sample:'同学们，大家好。我们一起学习。',online:'Online · Internet needed',local:'On this device',privacy:'Online voices send text to the browser’s speech service. Previews use only the example above; board or document text is read only after you choose the voice.',listen:'▶ Try voice',use:'Use this voice',useOnline:'Use this online voice',selected:'Selected',automatic:'Automatic local female voice',builtin:'Built-in female voice (backup)',none:'No Mandarin browser voice is available yet. You can use the built-in female voice.',missing:'Your previous voice is unavailable. Preview and choose another voice.',saved:'Voice remembered. Click Read to use it.',session:'Voice selected. This browser could not save the preference.',fast:'Quick response',slow:'Slower response',failed:'Could not play',listening:'Playing voice sample…',error:'This voice could not play. Try another sample.',current:'Voice: ',playing:'Using: ',backup:'The original voice is unavailable; using the backup.',unavailable:'Unavailable'},
 ms:{try:'Cuba / pilih suara',title:'Pilih suara yang disukai',hint:'Setiap pratonton membaca ayat Cina yang sama. Pilihan diingati dalam pelayar ini.',sample:'同学们，大家好。我们一起学习。',online:'Dalam talian · Perlu Internet',local:'Pada peranti',privacy:'Suara dalam talian menghantar teks kepada perkhidmatan pertuturan pelayar. Suara itu digunakan untuk bacaan hanya selepas anda memilihnya.',listen:'▶ Cuba suara',use:'Guna suara ini',useOnline:'Guna suara dalam talian ini',selected:'Dipilih',automatic:'Suara wanita peranti automatik',builtin:'Suara wanita terbina dalam (sandaran)',none:'Tiada suara Mandarin pelayar tersedia. Suara terbina dalam boleh digunakan.',missing:'Suara terdahulu tidak tersedia. Cuba dan pilih suara lain.',saved:'Suara diingati. Tekan Baca untuk menggunakannya.',session:'Suara dipilih. Pelayar ini tidak dapat menyimpan pilihan.',fast:'Respons pantas',slow:'Respons lebih lambat',failed:'Tidak dapat dimainkan',listening:'Memainkan contoh suara…',error:'Suara ini tidak dapat dimainkan. Cuba suara lain.',current:'Suara: ',playing:'Menggunakan: ',backup:'Suara asal tidak tersedia; menggunakan suara sandaran.',unavailable:'Tidak tersedia'},
 ta:{try:'குரலைக் கேட்டுத் தேர்வு செய்',title:'விரும்பும் குரலைத் தேர்வு செய்',hint:'ஒவ்வொரு குரலும் ஒரே சீன வாக்கியத்தை வாசிக்கும். தேர்வு இந்த உலாவியில் நினைவில் வைக்கப்படும்.',sample:'同学们，大家好。我们一起学习。',online:'இணையக் குரல் · இணையம் தேவை',local:'இந்தச் சாதனத்தில்',privacy:'இணையக் குரல்கள் உரையை உலாவியின் பேச்சுச் சேவைக்கு அனுப்பும். நீங்கள் தேர்வு செய்த பின்னரே அவை வாசிப்பிற்குப் பயன்படும்.',listen:'▶ குரலைக் கேள்',use:'இந்தக் குரலைப் பயன்படுத்து',useOnline:'இந்த இணையக் குரலைப் பயன்படுத்து',selected:'தேர்வு செய்யப்பட்டது',automatic:'தானியங்கி சாதனப் பெண் குரல்',builtin:'உள்ளமைந்த பெண் குரல் (மாற்று)',none:'மாண்டரின் உலாவிக் குரல் கிடைக்கவில்லை. உள்ளமைந்த குரலைப் பயன்படுத்தலாம்.',missing:'முந்தைய குரல் கிடைக்கவில்லை. மற்றொரு குரலைக் கேட்டுத் தேர்வு செய்யவும்.',saved:'குரல் நினைவில் வைக்கப்பட்டது. வாசி என்பதை அழுத்தவும்.',session:'குரல் தேர்வு செய்யப்பட்டது. இந்த உலாவியால் தேர்வைச் சேமிக்க முடியவில்லை.',fast:'விரைவான பதில்',slow:'மெதுவான பதில்',failed:'இயக்க முடியவில்லை',listening:'குரல் மாதிரி ஒலிக்கிறது…',error:'இந்தக் குரலை இயக்க முடியவில்லை. மற்றொரு குரலை முயலவும்.',current:'குரல்: ',playing:'பயன்படும் குரல்: ',backup:'முந்தைய குரல் கிடைக்கவில்லை; மாற்றுக் குரல் பயன்படுகிறது.',unavailable:'கிடைக்கவில்லை'}
};
const STORAGE='cc-whiteboard-chinese-reader-voice-v1';
function key(v){return JSON.stringify([String(v.voiceURI||''),String(v.name||''),String(v.lang||'').toLowerCase().replace(/_/g,'-'),v.localService===true])}
function female(v){return /xiaoxiao|晓晓|曉曉|huihui|慧慧|yaoyao|瑶瑶|瑤瑤|ting[- ]?ting|婷婷|hanhan|涵涵|yating|雅婷|\bfemale\b|女声|女聲/i.test(v.name||'')}
function unsuitable(v){return /\b(?:male|child|girl|boy|kid)\b|kangkang|yunxi|yunjian|yunyang|zhiwei|童声|儿童|男声|男聲|xiaoshuang|xiaoyou/i.test(v.name||'')}
function create({ui,host,details,language,voice,speed,voiceHint,status,onStop,onAudition,onRefresh,autoVoice}){
 const L=COPY[ui]||COPY.en,health=new Map();let list=[],active=null,preference=null,restoredRate=false;
 try{const saved=JSON.parse(localStorage.getItem(STORAGE)||'null');if(saved?.version===1&&['auto','builtin','voice'].includes(saved.kind)&&(saved.kind!=='voice'||typeof saved.key==='string'))preference=saved}catch{}
 const section=document.createElement('div');section.className='cc-reader-chinese-voices';section.hidden=true;
 const row=document.createElement('div');row.className='cc-reader-voice-current';
 const current=document.createElement('span');current.id='ccChineseCurrentVoice';
 const toggle=makeButton(L.try,'voice-picker');toggle.id='ccChineseTryVoices';toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','ccChineseVoicePicker');row.append(current,toggle);
 const picker=document.createElement('div');picker.id='ccChineseVoicePicker';picker.className='cc-reader-voice-picker';picker.hidden=true;picker.setAttribute('aria-label',L.title);
 const heading=document.createElement('strong');heading.textContent=L.title;
 const hint=document.createElement('p');hint.className='cc-reader-hint';hint.textContent=L.hint;
 const sample=document.createElement('p');sample.className='cc-reader-voice-sample';sample.lang='zh-CN';sample.textContent='“'+L.sample+'”';
 const privacy=document.createElement('p');privacy.className='cc-reader-hint';privacy.textContent=L.privacy;
 const cards=document.createElement('div');cards.id='ccChineseVoiceChoices';
 picker.append(heading,hint,sample,privacy,cards);section.append(row,picker);host.insertBefore(section,details);
 function makeButton(text,action,k){const b=document.createElement('button');b.type='button';b.textContent=text;b.dataset.chineseVoiceAction=action;if(k)b.dataset.voiceKey=k;return b}
 function tag(v){return v?.localService===true?L.local:L.online}
 function resolve(){
  const value=voice.value;
  if(value==='saved-unavailable')return {missing:true};
  if(value==='builtin')return {voice:null};
  if(value.startsWith('voice-')){const chosen=list[Number(value.slice(6))];return chosen?{voice:chosen}:{missing:true}}
  const eligible=list.filter(v=>v.localService===true&&!health.get(key(v))?.failed&&!(health.get(key(v))?.delay>2000));
  return {voice:autoVoice(eligible)||null};
 }
 function describe(v){return v?v.name+' · '+tag(v):L.builtin}
 function showCurrent(v,playing=false){current.textContent=(playing?L.playing:L.current)+describe(v);current.dataset.online=String(v?.localService!==true&&!!v)}
 function updateCurrent(){const result=resolve();if(result.missing)current.textContent=L.current+(preference?.name||'')+' · '+L.unavailable;else showCurrent(result.voice)}
 function save(){
  const value=voice.value,chosen=value.startsWith('voice-')?list[Number(value.slice(6))]:null;
  if(value==='saved-unavailable')return false;
  preference={version:1,kind:chosen?'voice':value==='builtin'?'builtin':'auto',...(chosen?{key:key(chosen),name:chosen.name,online:chosen.localService!==true}:{}),speed:Number(speed.value)||.85};
  let stored=true;try{localStorage.setItem(STORAGE,JSON.stringify(preference))}catch{stored=false}
  updateCurrent();renderCards();return stored;
 }
 function renderCards(){
  const focused=document.activeElement,focusAction=focused?.dataset.chineseVoiceAction,focusKey=focused?.dataset.voiceKey;
  const rank=v=>(unsuitable(v)?1000:0)+(female(v)?0:30)+(/natural|neural|premium|enhanced|自然|增强|增強/i.test(v.name)?-15:0)+(v.localService===true?0:2)+(health.get(key(v))?.failed?500:0)+(health.get(key(v))?.delay>2000?50:0);
  const saved=preference?.kind==='voice'?list.find(v=>key(v)===preference.key):null;
  const candidates=[...(saved?[saved]:[]),...[...list].filter(v=>!unsuitable(v)).sort((a,b)=>rank(a)-rank(b))];
  const unique=candidates.filter((v,i,all)=>all.findIndex(x=>key(x)===key(v))===i).slice(0,3);
  cards.replaceChildren();
  if(!unique.length){const empty=document.createElement('p');empty.className='cc-reader-hint';empty.textContent=L.none;cards.append(empty);unique.push(null)}
  for(const candidate of unique){
   const k=candidate?key(candidate):'builtin',h=health.get(k),selected=candidate?preference?.kind==='voice'&&preference.key===k:preference?.kind==='builtin';
   const card=document.createElement('div');card.className='cc-reader-voice-card';card.dataset.voiceKey=k;
   const name=document.createElement('strong');name.textContent=candidate?.name||L.builtin;
   const badge=document.createElement('span');badge.className='cc-reader-voice-tag';badge.textContent=candidate?tag(candidate):L.local;
   const feedback=document.createElement('span');feedback.className='cc-reader-voice-feedback';feedback.textContent=active===k?L.listening:h?.failed?L.failed:h?.delay!==undefined?(h.delay>2000?L.slow:L.fast):'';
   const actions=document.createElement('div');actions.className='cc-reader-voice-actions';const audition=makeButton(L.listen,'audition',k),use=makeButton(selected?L.selected:candidate&&candidate.localService!==true?L.useOnline:L.use,'use',k);use.setAttribute('aria-pressed',String(selected));use.disabled=!!h?.failed;actions.append(audition,use);card.append(name,badge,feedback,actions);cards.append(card);
  }
  if(focusAction&&focusKey){const replacement=[...cards.querySelectorAll('button')].find(b=>b.dataset.chineseVoiceAction===focusAction&&b.dataset.voiceKey===focusKey);replacement?.focus({preventScroll:true})}
 }
 function refresh(available){
  list=available;section.hidden=false;
  if(!restoredRate){if([...speed.options].some(o=>Number(o.value)===preference?.speed))speed.value=String(preference.speed);restoredRate=true}
  voice.replaceChildren();
  for(const [value,label] of [['auto',L.automatic],['builtin',L.builtin],...list.map((v,i)=>['voice-'+i,v.name+' · '+tag(v)])]){const option=document.createElement('option');option.value=value;option.textContent=label;voice.append(option)}
  const index=preference?.kind==='voice'?list.findIndex(v=>key(v)===preference.key):-1;
  if(preference?.kind==='voice'&&index<0){const option=document.createElement('option');option.value='saved-unavailable';option.textContent=(preference.name||L.unavailable)+' · '+L.unavailable;option.disabled=true;voice.append(option);voice.value=option.value}
  else voice.value=preference?.kind==='voice'?'voice-'+index:preference?.kind||'auto';
  voiceHint.textContent=L.privacy;updateCurrent();renderCards();
 }
 async function audition(k){
  const chosen=k==='builtin'?null:list.find(v=>key(v)===k);if(k!=='builtin'&&!chosen)return;
  onStop();active=k;renderCards();status.textContent=L.listening;
  await onAudition(chosen,L.sample,{start:delay=>{health.set(k,{delay,failed:false});renderCards()},end:()=>{active=null;updateCurrent();renderCards()},error:()=>{health.set(k,{failed:true});active=null;updateCurrent();renderCards();status.textContent=L.error}});
 }
 section.addEventListener('click',event=>{
  const b=event.target.closest('[data-chinese-voice-action]');if(!b)return;
  if(b.dataset.chineseVoiceAction==='voice-picker'){onStop();onRefresh?.();picker.hidden=!picker.hidden;toggle.setAttribute('aria-expanded',String(!picker.hidden));if(!picker.hidden)renderCards();return}
  const k=b.dataset.voiceKey;
  if(b.dataset.chineseVoiceAction==='audition'){void audition(k);return}
  if(b.dataset.chineseVoiceAction==='use'){
   onStop();const index=k==='builtin'?-1:list.findIndex(v=>key(v)===k);if(k!=='builtin'&&index<0)return;
   voice.value=k==='builtin'?'builtin':'voice-'+index;const saved=save();picker.hidden=true;toggle.setAttribute('aria-expanded','false');status.textContent=saved?L.saved:L.session;toggle.focus({preventScroll:true});
  }
 });
 return Object.freeze({refresh,resolve,hide:()=>{section.hidden=true;picker.hidden=true;toggle.setAttribute('aria-expanded','false')},collapse:()=>{picker.hidden=true;toggle.setAttribute('aria-expanded','false')},changed:()=>save(),stopped:()=>{active=null;renderCards()},missing:()=>{status.textContent=L.missing;picker.hidden=false;toggle.setAttribute('aria-expanded','true');renderCards()},using:(v,backup=false)=>{showCurrent(v,true);if(backup)status.textContent=L.backup},record:(v,delay,failed=false)=>{if(v)health.set(key(v),{delay,failed});renderCards()}});
}
window.CCChineseVoicePicker=Object.freeze({create});
})();
