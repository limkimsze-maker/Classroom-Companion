(function(){'use strict';
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
const anchor=document.getElementById('textBtn'),board=document.getElementById('board');
if(!anchor||!board)return;
const btn=document.getElementById('speechToTextBtn');if(!btn)return;
const panel=document.createElement('div');panel.style.cssText='display:none;position:fixed;top:15%;left:50%;transform:translateX(-50%);width:min(92vw,430px);padding:16px;background:white;border:1px solid #cfd9de;border-radius:14px;box-shadow:0 14px 45px #17324d44;z-index:20000';
panel.innerHTML='<strong>🎙 Speech to Text</strong><p style="font-size:12px">Speak a sentence or mathematical equation. Review before inserting.</p><textarea aria-label="Speech transcript" rows="3" style="width:100%;padding:9px;border:1px solid #cfd9de;border-radius:8px"></textarea><div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:10px"><button type="button" class="btn" data-action="listen">🎙 Listen</button><button type="button" class="btn" data-action="math">Convert maths</button><button type="button" class="btn soft" data-action="insert">Insert</button><button type="button" class="btn" data-action="close">Close</button></div><p data-status style="font-size:11px;color:#667085"></p>';
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
btn.addEventListener('click',()=>{panel.style.display='block';status.textContent=BUILD+' · '+(failed.length?'Conversion self-check failed':'4 conversion checks passed')+' · '+(SR?'Tap Listen.':'Speech recognition unsupported.')});
panel.addEventListener('click',e=>{const a=e.target.dataset.action;if(!a)return;
if(a==='close'){try{rec?.stop()}catch{}panel.style.display='none'}
if(a==='math')ta.value=mathify(ta.value);
if(a==='listen'){if(!SR){status.textContent='Try a supported browser such as Chrome.';return}try{rec?.stop()}catch{}rec=new SR();rec.lang=document.documentElement.lang||'en-SG';rec.interimResults=false;rec.maxAlternatives=1;rec.onresult=e=>{const raw=e.results[0][0].transcript;ta.value=mathify(raw);status.textContent='Recognised: '+raw+' | Output: '+ta.value};rec.onerror=e=>{status.textContent='Microphone error: '+e.error};rec.onend=()=>{if(status.textContent==='Listening…')status.textContent='Stopped listening.'};try{rec.start();status.textContent='Listening…'}catch(e){status.textContent=e.message}}
if(a==='insert'){const value=mathify(ta.value);status.textContent='Inserting: '+value+' · '+BUILD;if(!value)return;if(/[0-9]/.test(value)&&/[×*]/.test(value)&&!/[0-9]\s*×\s*[0-9]/.test(value)){status.textContent='Please review multiplication before inserting: '+value;return}const detail={text:value,inserted:false};document.dispatchEvent(new CustomEvent('whiteboard-insert-speech-text',{detail}));if(!detail.inserted){
 try{
  // Recovery route: core whiteboard state is shared by classic scripts.
  if(typeof strokes!=='undefined'&&typeof redraw==='function'){
   const obj={type:'text',x:.12,y:.2,w:.68,h:.22,text:value,colour:'#17324d',size:28,font:'Arial',bold:false,italic:false,underline:false,align:'left'};
   strokes.push(obj);redraw();detail.inserted=strokes.includes(obj);detail.insertedText=obj.text;
  }
 }catch(err){detail.error=String(err?.message||err)}
}
if(detail.inserted){status.textContent='Inserted: '+detail.insertedText;panel.style.display='none'}else{status.textContent='Not inserted: '+(detail.error||'Whiteboard text handler unavailable')+' · '+BUILD}}
});
})();