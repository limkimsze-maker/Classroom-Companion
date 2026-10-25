(function(){'use strict';
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
const anchor=document.getElementById('textBtn'),board=document.getElementById('board');
if(!anchor||!board)return;
const btn=document.getElementById('speechToTextBtn');if(!btn)return;
const panel=document.createElement('div');panel.id='ccSpeechToTextPanel';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Speech to Text');panel.style.cssText='display:none;box-sizing:border-box;position:fixed;top:max(8px,env(safe-area-inset-top));left:50%;transform:translateX(-50%);width:min(96vw,480px);max-height:92dvh;overflow-y:auto;overscroll-behavior:contain;padding:12px;background:white;border:1px solid #cfd9de;border-radius:14px;box-shadow:0 14px 45px #17324d44;z-index:20000';
panel.innerHTML='<strong style="display:block;margin-bottom:7px;font-size:16px">🎙 Speech to Text</strong><div data-listen-controls role="group" aria-label="Microphone controls" style="position:sticky;top:0;z-index:10;background:#fff;padding:8px 2px;border-bottom:1px solid #dae5ea;display:flex;flex-wrap:nowrap;gap:8px"><button type="button" data-action="start" aria-label="Start listening" style="display:inline-flex!important;justify-content:center;align-items:center;flex:1 1 50%;min-width:0;min-height:44px;padding:9px 12px;background:#087b6d;color:#fff;border:1px solid #087b6d;border-radius:9px;font-size:13px;font-weight:800;cursor:pointer">🎙 Start Listening</button><button type="button" data-action="stop" aria-label="Stop listening" disabled style="display:inline-flex!important;justify-content:center;align-items:center;flex:1 1 50%;min-width:0;min-height:44px;padding:9px 12px;background:#fff1ee;color:#a52719;border:1px solid #dfa49c;border-radius:9px;font-size:13px;font-weight:800;cursor:pointer">■ Stop Listening</button></div><p style="font-size:12px">Press Start to dictate, Stop when finished. Pauses will not end your session.</p><textarea aria-label="Speech transcript" rows="6" wrap="soft" spellcheck="true" style="box-sizing:border-box;width:100%;min-height:120px;padding:9px;border:1px solid #cfd9de;border-radius:8px;resize:vertical;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word"></textarea><p data-interim aria-live="off" style="font-size:11px;color:#667085;min-height:14px;overflow-wrap:anywhere"></p><label style="display:block;font-size:12px"><input type="checkbox" data-caps checked> Automatically capitalise sentences, days, months and common names</label><label style="display:block;font-size:12px;margin-top:7px">Additional names (comma-separated)<input type="text" data-names placeholder="e.g. John Tan, River Valley High School" style="box-sizing:border-box;display:block;width:100%;margin-top:4px;padding:7px;border:1px solid #cfd9de;border-radius:7px"></label><div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:10px"><button type="button" class="btn" data-action="math">Convert maths</button><button type="button" class="btn soft" data-action="insert">Insert</button><button type="button" class="btn" data-action="clear">Clear panel</button><button type="button" class="btn" data-action="close">Close</button></div><p data-status role="status" aria-live="polite" style="font-size:11px;color:#667085"></p>';
document.body.appendChild(panel);
const ta=panel.querySelector('textarea'),status=panel.querySelector('[data-status]');let rec=null;
const BUILD='speech-operator-verified-20261021-01';
const units={'zero':'0','one':'1','two':'2','three':'3','four':'4','five':'5','six':'6','seven':'7','eight':'8','nine':'9','ten':'10','eleven':'11','twelve':'12','thirteen':'13','fourteen':'14','fifteen':'15','sixteen':'16','seventeen':'17','eighteen':'18','nineteen':'19'};
const tens={'twenty':20,'thirty':30,'forty':40,'fifty':50,'sixty':60,'seventy':70,'eighty':80,'ninety':90};
function numberWords(s){return s.replace(/\b(?:minus\s+)?(?:(?:one|two|three|four|five|six|seven|eight|nine)\s+thousand\s+)?(?:(?:one|two|three|four|five|six|seven|eight|nine)\s+hundred(?:\s+and)?\s+)?(?:(?:twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)(?:[ -](?:one|two|three|four|five|six|seven|eight|nine))?|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen)\b/gi,m=>{let total=0,cur=0;for(const w of m.toLowerCase().replace(/-/g,' ').split(/\s+/)){if(w==='and')continue;if(w==='thousand'){total+=cur*1000;cur=0}else if(w==='hundred')cur*=100;else if(w in tens)cur+=tens[w];else if(w in units)cur+=+units[w];else return m}return String(total+cur)})}
function mathify(t){
 let s=String(t||'').trim();
 if(!/(?:\d|\b(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand)\b)/i.test(s))return s;
 s=s.toLowerCase();
 s=s.replace(/[.,!?]+$/,'')
 .replace(/\b(?:is\s+equal\s+to|equals?|equal\s+to)\b/g,' = ')
 .replace(/\b(?:multiplied\s+by|multiply\s+by|times)\b|[×*]|\bx\b/g,' × ')
 .replace(/\b(?:divided\s+by|divide\s+by|over)\b|[÷/]/g,' ÷ ')
 .replace(/\b(?:plus|add)\b|[+]/g,' + ')
 .replace(/\b(?:minus|subtract)\b|[−-]/g,' − ');
 s=numberWords(s);
 return s.replace(/\s+/g,' ').trim().replace(/\s*×\s*/g,' × ');
}
const cases=[['80 / 2 = 40','80 ÷ 2 = 40'],['ten times four equals forty','10 × 4 = 40'],['80 divided by 2 equals 40','80 ÷ 2 = 40'],['10 * 4 = 40','10 × 4 = 40']];
const failed=cases.filter(([input,expected])=>mathify(input)!==expected);
console.info('[Speech-to-Text]',BUILD,failed.length?'FAIL '+JSON.stringify(failed):'4 conversion cases passed');
function looksLikeMath(t){return /(?:\d\s*(?:[×*÷/+=−-]|\bx\b)|\b(?:times|multiplied by|divide(?:d)? by|plus|minus|equals?|equal to)\b)/i.test(t)}
// Speech punctuation and capitalisation are kept separate from mathematical
// conversion, which may lowercase or replace English words.
const interim=panel.querySelector('[data-interim]'),capToggle=panel.querySelector('[data-caps]'),names=panel.querySelector('[data-names]');
const startBtn=panel.querySelector('[data-action=start]'),stopBtn=panel.querySelector('[data-action=stop]'),insertBtn=panel.querySelector('[data-action=insert]');
let listening=false,finishing=false,restartTimer=null,baseText='',activeRec=null;
try{names.value=localStorage.getItem('ccSpeechProperNounsV1')||''}catch{}
names.addEventListener('change',()=>{try{localStorage.setItem('ccSpeechProperNounsV1',names.value.slice(0,1200))}catch{}});
const punctuationCommands=[
 ['new paragraph','\n\n'],['new line','\n'],['next line','\n'],
 ['exclamation mark','!'],['exclamation point','!'],['question mark','?'],
 ['full stop','.'],['period','.'],['semicolon',';'],['semi colon',';'],['colon',':'],['comma',','],
 ['open bracket','('],['close bracket',')'],['open quote','“'],['close quote','”']
];
const escapeRx=s=>s.replace(/[|\\{}()[\]^$+*?.]/g,'\\$&');
function spokenPunctuation(raw){
 let s=String(raw||'').replace(/\r\n?/g,'\n');
 for(const [command,mark] of punctuationCommands){
  const re=new RegExp('\\b'+command.split(' ').map(escapeRx).join('\\s+')+'\\b','gi');
  s=s.replace(re,' '+mark+' ');
 }
 return s.replace(/[ \t]+([,.!?;:])/g,'$1').replace(/([(\u201c])[ \t]+/g,'$1')
 .replace(/[ \t]+([)\u201d])/g,'$1').replace(/[ \t]*\n[ \t]*/g,'\n')
 .replace(/[ \t]{2,}/g,' ').trim();
}
const proper=['Singapore','MOE','SLS','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday',
 'January','February','March','April','May','June','July','August','September','October','November','December'];
function automaticCapitals(raw){
 if(!capToggle.checked)return String(raw||'');
 let s=String(raw||'');
 const extra=names.value.split(',').map(v=>v.trim()).filter(v=>v.length&&v.length<90).slice(0,40);
 for(const noun of [...new Set([...proper,...extra])].sort((a,b)=>b.length-a.length)){
  if(noun.toLowerCase()==='may'){
   // Avoid changing modal 'may' into the month unless date context is evident.
   s=s.replace(/\b(in|during|by|on|since|until|before|after|next|last)\s+may\b/gi,(_m,w)=>w+' May');
   s=s.replace(/\bmay(?=\s+\d{1,2}\b)/gi,'May');
   continue;
  }
  const re=new RegExp('\\b'+escapeRx(noun).replace(/\\ /g,'\\s+')+'\\b','gi');
  s=s.replace(re,noun);
 }
 s=s.replace(/\bi\b/g,'I');
 return s.replace(/(^|[.!?]\s+|\n+)([a-z])/g,(_m,lead,ch)=>lead+ch.toUpperCase());
}
function formatProse(raw){return automaticCapitals(spokenPunctuation(raw))}
function joinSpeech(a,b){
 const first=String(a||''),second=String(b||'').trim();
 return !second?first:!first.trim()?second:first+(/\s$/.test(first)?'':' ')+second;
}
function syncListenUi(){
 startBtn.disabled=listening||finishing;
 stopBtn.disabled=!listening;
 startBtn.style.opacity=startBtn.disabled?'.45':'1';
 stopBtn.style.opacity=stopBtn.disabled?'.45':'1';
 startBtn.setAttribute('aria-pressed',String(listening));
 stopBtn.setAttribute('aria-pressed',String(!listening&&!finishing));
 insertBtn.disabled=listening||finishing;
 ta.readOnly=listening||finishing;
}
function stop(discard=false){
 listening=false;if(restartTimer){clearTimeout(restartTimer);restartTimer=null}
 const old=activeRec;
 finishing=!!old&&!discard;
 if(discard)activeRec=null;
 syncListenUi();
 if(old){try{discard?old.abort():old.stop()}catch{finishing=false;activeRec=null;syncListenUi()}}
 if(discard){interim.textContent='';status.textContent='Stopped.'}
 else status.textContent=finishing?'Finishing the last spoken words…':'Stopped. Review the transcript and press Insert.';
 // Some browsers never deliver onend after stop(); keep the editor usable.
 if(finishing)setTimeout(()=>{if(!listening&&finishing&&activeRec===old){activeRec=null;finishing=false;syncListenUi();status.textContent='Stopped. Review the transcript and press Insert.'}},2500);
}
function beginSession(){
 if(!listening||!SR)return;
 const instance=new SR();activeRec=instance;baseText=ta.value;
 instance.lang=(document.documentElement.lang||'en-SG').toLowerCase()==='en'?'en-SG':(document.documentElement.lang||'en-SG');
 instance.continuous=true;instance.interimResults=true;instance.maxAlternatives=1;
 instance.onstart=()=>{if(activeRec===instance&&listening)status.textContent='Listening until you press Stop…'};
 instance.onresult=e=>{
  if(activeRec!==instance||(!listening&&!finishing))return;
  let final='',partial='';
  for(let i=0;i<e.results.length;i++){
   const chunk=e.results[i]?.[0]?.transcript||'';
   if(e.results[i].isFinal)final=joinSpeech(final,chunk);
   else partial=joinSpeech(partial,chunk);
  }
  if(final)ta.value=formatProse(joinSpeech(baseText,final));
  interim.textContent=partial?'Hearing: '+partial:'';
 };
 instance.onerror=e=>{
  if(activeRec!==instance||!listening)return;
  if(['not-allowed','service-not-allowed','audio-capture','language-not-supported','network'].includes(e.error)){
   stop();status.textContent='Microphone unavailable: '+e.error+'. Press Start to retry.';
  }else status.textContent='Microphone: '+e.error+'; reconnecting if needed.';
 };
 instance.onend=()=>{
  if(activeRec!==instance)return;
  activeRec=null;interim.textContent='';
  if(finishing){finishing=false;syncListenUi();status.textContent='Stopped. Review the transcript and press Insert.';return}
  if(!listening)return;
  // Some browsers stop Web Speech after silence even with continuous=true.
  status.textContent='Reconnecting microphone after a pause…';
  restartTimer=setTimeout(()=>{restartTimer=null;if(listening)beginSession()},450);
 };
 try{instance.start();status.textContent='Starting microphone…'}
 catch(e){stop();status.textContent='Unable to start microphone: '+(e?.message||e)}
}
function startListening(){
 if(!SR){status.textContent='Speech recognition is not available in this browser. You can type instead.';return}
 if(listening||finishing)return;
 listening=true;syncListenUi();beginSession();
}
function insertTranscript(){
 if(listening||finishing){status.textContent='Finish listening before inserting.';return}
 let value=formatProse(ta.value);
 if(looksLikeMath(value))value=mathify(value);
 if(!value){status.textContent='Nothing to insert.';return}
 if(/[0-9]/.test(value)&&/[×*]/.test(value)&&!/[0-9]\s*×\s*[0-9]/.test(value)){status.textContent='Review multiplication before inserting: '+value;return}
 const detail={text:value,inserted:false};
 document.dispatchEvent(new CustomEvent('whiteboard-insert-speech-text',{detail}));
 if(!detail.inserted&&!detail.overflow){
  try{
   if(typeof strokes!=='undefined'&&typeof redraw==='function'){
    const obj={type:'text',x:.06,y:.12,w:.85,h:.6,text:value,colour:'#17324d',size:22,font:'Arial',bold:false,italic:false,underline:false,align:'left'};
    strokes.push(obj);redraw();detail.inserted=strokes.includes(obj);detail.insertedText=obj.text;
   }
  }catch(err){detail.error=String(err?.message||err)}
 }
 if(detail.inserted){status.textContent='Inserted on whiteboard.';panel.style.display='none'}
 else status.textContent='Not inserted: '+(detail.error||'Whiteboard text handler unavailable');
}
btn.addEventListener('click',()=>{
 panel.style.display='block';syncListenUi();
 status.textContent=SR?'Press Start to listen and Stop whenever you wish.':'Speech recognition unsupported; type in the box.';
});
panel.addEventListener('click',e=>{
 const action=e.target.closest('[data-action]')?.dataset.action;
 if(!action)return;
 if(action==='start'){startListening();return}
 if(action==='stop'){if(listening)stop();return}
 if(action==='close'){stop(true);panel.style.display='none';return}
 if(action==='clear'){stop(true);ta.value='';interim.textContent='';status.textContent='Panel cleared.';ta.focus();return}
 if(action==='math'){if(listening||finishing){status.textContent='Stop listening first.';return}ta.value=mathify(ta.value);status.textContent='Converted maths. Review before inserting.';return}
 if(action==='insert')insertTranscript();
});
window.ClassroomSpeechFormatting={spokenPunctuation,automaticCapitals,formatProse,mathify,looksLikeMath};
})();