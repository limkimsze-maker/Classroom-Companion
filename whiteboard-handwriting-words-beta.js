/* Offline word suggestions. Dictionary evidence never silently rewrites ink. */
(function(){
'use strict';
let vocabulary=null,trie=null;
const sameCaseShapes='cosuvwxz';
const protectedEngine=/personal|teacher-confusable|trained-cursive|local-operator|numeric-ensemble|primary-arithmetic|primary-digit|equal-sign/;
const unitPattern=/^(?:mm|cm|km|m|kg|mg|g|ml|mL|L|s|min|h)[²³]?$/;
function load(){
 if(vocabulary)return;
 const data=window.WhiteboardHandwritingWordList;
 if(!data?.levels)throw Error('The local word vocabulary has not loaded.');
 vocabulary=new Map([['a',10],['i',10]]);trie=Object.create(null);
 for(const [level,list]of Object.entries(data.levels))for(const word of list.split(' '))if(word)vocabulary.set(word,Number(level));
 for(const [word,level]of vocabulary){let node=trie;for(const char of word)node=node[char]??=(Object.create(null));node.$=level;}
}
function known(word){load();return vocabulary.has(String(word).toLowerCase());}
function rank(evidence){
 load();if(!evidence.length||evidence.length>20)return[];
 let beam=[{node:trie,text:'',sum:0,minSupport:1}];
 for(const entry of evidence){
  const choices=entry.personal?
   (/^[A-Za-z]$/.test(entry.personal.char)?[{char:entry.personal.char.toLowerCase(),score:1}]:[]):
   entry.letters.filter(p=>p.score>=Math.max(.035,(entry.letters[0]?.score||0)*.10)).slice(0,5);
  const next=[];
  for(const state of beam)for(const choice of choices){
   const node=state.node[choice.char];if(!node)continue;
   next.push({node,text:state.text+choice.char,sum:state.sum+Math.log(Math.max(.001,choice.score)),minSupport:Math.min(state.minSupport,choice.score)});
  }
  beam=next.sort((a,b)=>b.sum-a.sum).slice(0,64);if(!beam.length)return[];
 }
 return beam.filter(p=>p.node.$).map(p=>({text:p.text,minSupport:p.minSupport,
  visualScore:p.sum/evidence.length,score:p.sum/evidence.length+(p.node.$===10?.14:p.node.$===20?.07:0)}))
  .sort((a,b)=>b.score-a.score).slice(0,4);
}
function bounds(parts){
 const points=parts.flatMap(p=>p.points),xs=points.map(p=>p.x),ys=points.map(p=>p.y);
 const x=Math.min(...xs),y=Math.min(...ys),w=Math.max(...xs)-x,h=Math.max(...ys)-y;
 return{x,y,w,h,cx:x+w/2,cy:y+h/2};
}
function median(values){values=values.slice().sort((a,b)=>a-b);return values[Math.floor(values.length/2)]||0;}
function compatible(text,evidence){
 const letters=text.replace(/\s/g,'');
 return letters.length===evidence.length&&evidence.every((e,i)=>!e.personal||e.personal.char===letters[i]);
}
function aligned(text,tokens,evidence){
 const letters=text.replace(/\s/g,'');if(letters.length!==tokens.length)return[];
 return tokens.map((token,i)=>({...token,char:letters[i],score:evidence[i].letters.find(p=>p.char===letters[i].toLowerCase())?.score||token.score}));
}
function variants(word,source,mode,evidence){
 const upper=word.toUpperCase(),title=upper[0]+word.slice(1);
 let forms=mode==='lowercase'?[word]:mode==='uppercase'?[upper]:[word,title];
 // Keep case chosen by the teacher even inside a longer word.
 forms=forms.filter(text=>compatible(text,evidence));
 if(mode==='auto'&&/^[A-Z]{2,}$/.test(source))forms.sort((a,b)=>Number(b===upper)-Number(a===upper));
 else if(mode==='auto'&&/^[A-Z][a-z]+$/.test(source))forms.sort((a,b)=>Number(b===title)-Number(a===title));
 return [...new Set(forms)];
}
async function check(strokes,W,H,options,reading,api){
 const mode=options.mode||'auto';
 if(options.context===false||options.words===false||!['auto','lowercase','uppercase'].includes(mode)||
  !reading||reading.format==='latex'||protectedEngine.test(reading.engine||'')||
  !window.WhiteboardCharacterReader||!window.WhiteboardUjiReader||strokes.length>100||
  !/^[A-Za-z0-9? ]+$/.test(reading.text)||!/[A-Za-z]/.test(reading.text)||
  unitPattern.test(reading.text.trim()))return reading;
 const tokens=api.segment(strokes,W,H).slice().sort((a,b)=>bounds(a.parts).cx-bounds(b.parts).cx);
 if(!tokens.length||tokens.length>48||tokens.some(t=>!t.parts?.length))return reading;
 // Never propose a word by omitting a dot, exponent, ruling or other stroke.
 const coverage=tokens.flatMap(t=>t.parts.map(p=>p.source));
 if(coverage.length!==strokes.length||new Set(coverage).size!==strokes.length||strokes.some(s=>!coverage.includes(s)))return reading;
 const boxes=tokens.map(t=>bounds(t.parts)),height=median(boxes.map(b=>b.h));
 if(height<10||boxes.some(b=>b.h<height*.30||Math.abs(b.y+b.h-median(boxes.map(q=>q.y+q.h)))>height*.55))return reading;
 const rasters=tokens.map(t=>api.rasterDigit(t.parts));
 const alpha=await window.WhiteboardCharacterReader.predictBatch(rasters,'lowercase',options.onProgress,options.signal);
 const evidence=[];
 for(let i=0;i<tokens.length;i++){
  if(i%4===0){await new Promise(resolve=>setTimeout(resolve,0));if(options.signal?.aborted)throw Object.assign(new Error('Reading cancelled'),{name:'AbortError'});}
  const token=tokens[i];
  const personal=window.WhiteboardHandwritingLearning?.match?.(rasters[i]);
  const raw=token.parts.map(p=>p.source);
  const taught=window.WhiteboardTeacherConfusables?.match?.(raw,W,H,mode,.955,.08);
  const fixed=taught&&/^[A-Za-z0-9]$/.test(taught.text)?{char:taught.text,score:1,personal:true}:personal;
  const pen=window.WhiteboardUjiReader.read(token.parts.map(p=>p.points))||[];
  const letters=alpha[i].map(p=>({char:p.char.toLowerCase(),score:.65*p.score+
   .35*pen.reduce((sum,q)=>sum+(q.label.toLowerCase()===p.char.toLowerCase()?q.p:0),0)})).sort((a,b)=>b.score-a.score);
  evidence.push({letters,personal:fixed,pen,box:boxes[i]});
 }
 // A measurement route can occasionally read an entire word as a number and
 // unit. Offer a word only when at least three clear, non-digit-like letters
 // independently disagree. Ordinary quantities retain their measurement UI.
 if(reading.format==='unit'&&evidence.filter(e=>e.letters[0]?.score>=.55&&
  /^[acefhjkmnrtuvwxy]$/.test(e.letters[0].char)).length<3)return reading;
 const original=String(reading.text).trim(),choices=[{text:original,tokens:reading.tokens||[],original:true}];
 const add=text=>{
  if(text===original||choices.some(c=>c.text===text)||!compatible(text,evidence))return;
  const result=aligned(text,tokens,evidence);if(result.length===tokens.length)choices.push({text,tokens:result,original:false});
 };
 if(tokens.length===1){
  const char=original.toLowerCase();
  if(mode!=='auto'||original.length!==1||!sameCaseShapes.includes(char)||evidence[0].personal)return reading;
  const support=evidence[0].letters.find(p=>p.char===char)?.score||0;
  if(support<.45)return reading;
  add(original===char?char.toUpperCase():char);
 }else{
  const chunks=[];let start=0;
  for(let i=1;i<tokens.length;i++){
   const a=boxes[i-1],b=boxes[i];
   if(b.x-a.x-a.w>height*.48){chunks.push({start,end:i});start=i;}
  }
  chunks.push({start,end:tokens.length});if(chunks.length>8)return reading;
  const sourceWords=original.split(/\s+/),sourceAligned=sourceWords.length===chunks.length&&sourceWords.every((w,i)=>w.length===chunks[i].end-chunks[i].start);
  const optionsByWord=[];
  for(let i=0;i<chunks.length;i++){
   const {start,end}=chunks[i],ev=evidence.slice(start,end),source=sourceAligned?sourceWords[i]:'';
   if(end-start===1&&source&&!/^[aAiI]$/.test(source))return reading;
   const ranked=rank(ev).filter(p=>p.minSupport>=.08&&p.visualScore>=Math.log(.32));
   const best=ranked[0];
   const candidates=ranked.filter(p=>p.score>=best.score-.65).slice(0,2);
   const forms=[];
   for(const candidate of candidates)for(const text of variants(candidate.text,source,mode,ev)){
    if(!forms.some(p=>p.text===text))forms.push({text,score:candidate.score,supported:true});
   }
   // An unfamiliar name, acronym or case-sensitive identifier remains a candidate.
   if(source&&/^[A-Za-z]+$/.test(source)&&compatible(source,ev)&&!forms.some(p=>p.text===source))forms.push({text:source,score:0,supported:false});
   if(!forms.length)return reading;
   optionsByWord.push(forms);
  }
  if(!optionsByWord.some(forms=>forms.some(p=>p.supported)))return reading;
  // Offer a consistent word reading first. Preserve clear all-capital writing.
  const common=optionsByWord.map(forms=>forms.find(p=>p.supported&&/^[a-z]+$/.test(p.text))||forms[0]);
  if(mode==='uppercase')add(optionsByWord.map(forms=>forms.find(p=>/^[A-Z]+$/.test(p.text))?.text||forms[0].text).join(' '));
  else add(common.map(p=>mode==='auto'&&p.text==='i'?'I':p.text).join(' '));
  // At a selection boundary either sentence case or lowercase may be intended.
  if(mode==='auto'){
   const title=common.map((p,i)=>i===0?p.text[0].toUpperCase()+p.text.slice(1):p.text==='i'?'I':p.text).join(' ');
   add(title);
  }
  // Alternative spellings must have actual support at every letter position.
  for(let i=0;i<optionsByWord.length&&choices.length<4;i++)for(const form of optionsByWord[i]){
   const words=common.map(p=>p.text);words[i]=form.text;add(words.join(' '));
   if(choices.length>=4)break;
  }
 }
 if(choices.length<2)return reading;
 return{...reading,uncertain:[...(reading.uncertain||[]),{char:'?',score:0,parts:[],engine:'word-context-review'}],
  context:{model:'offline-english-word-check-v1',kind:tokens.length===1?'letter-case':'words',applied:false,
   originalText:reading.text,alternatives:choices.slice(0,4),needsReview:true}};
}
window.WhiteboardHandwritingWords=Object.freeze({check,rank,known,
 info:()=>({version:'offline-english-word-check-v1',words:window.WhiteboardHandwritingWordList?.count||0,automaticRewriting:false})});
})();
