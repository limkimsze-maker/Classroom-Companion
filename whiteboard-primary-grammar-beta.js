/* Browser-local P1-P6 symbol vocabulary decoder.
 * Combines independently trained MNIST numerals and EMNIST letters after
 * segmenting the original pen trajectories. No hardcoded full quantities and
 * no personal handwriting collection. Never forces weak candidate readings. */
(function(){
'use strict';
const UNITS=Object.freeze(['mm','cm','km','m','mg','g','kg','ml','min','h','s','L']);
function create({segment,predictDigit,rasterDigit,bounds,loopedStandaloneL}){
 async function recognize(strokes,W,H,options={}){
  if(!window.WhiteboardCharacterReader||strokes.length<2||strokes.length>18)return null;
  const tokens=segment(strokes,W,H);
  if(tokens.length<2||tokens.length>14||tokens.some(t=>!t.parts?.length))return null;
  const choices=[];
  for(let len=1;len<=3&&len<tokens.length;len++){
   const before=tokens.slice(0,-len),after=tokens.slice(-len);
   if(after.some(t=>['+','−','×','÷','=','.','$'].includes(t.char)))continue;
   const d=before.map(t=>predictDigit(rasterDigit(t.parts))[0]);
   if(d.some(p=>p.score<.96))continue;
   const numeric=d.map(p=>p.char).join('');
   const nb=bounds(before.flatMap(t=>t.parts)),ab=bounds(after.flatMap(t=>t.parts));
   if(ab.cx<=nb.cx+nb.w*.34||ab.cy<nb.y-nb.h*.15||ab.cy>nb.y+nb.h*1.2)continue;
   const alpha=await window.WhiteboardCharacterReader.predictBatch(after.map(t=>rasterDigit(t.parts)),'lowercase',options.onProgress);
   for(const word of UNITS){
    if(word.length!==len)continue;
    let sum=0,ok=true;
    for(let i=0;i<len;i++){
     const wanted=word[i].toLowerCase();
     let score=alpha[i].find(q=>q.char.toLowerCase()===wanted)?.score||0;
     if(word[i]==='L'&&loopedStandaloneL(after[i].parts.map(p=>({points:p.points.map(q=>({x:q.x/W,y:q.y/H}))})),W,H))score=Math.max(score,.95);
     if(score<(len===1?.88:.48)||word[i]==='L'&&score<.95){ok=false;break}
     sum+=Math.log(score);
    }
    if(ok)choices.push({word,d,numeric,before,after,alpha,score:sum/len});
   }
  }
  choices.sort((a,b)=>b.score-a.score);
  const chosen=choices[0],second=choices.find(x=>x.word!==chosen?.word||x.numeric!==chosen?.numeric);
  if(!chosen||second&&chosen.score-second.score<.23)return null;
  const first=chosen.before.map((t,i)=>({char:chosen.numeric[i],parts:t.parts,score:chosen.d[i].score}));
  const last=chosen.after.map((t,i)=>({char:chosen.word[i],parts:t.parts,score:chosen.alpha[i].find(q=>q.char.toLowerCase()===chosen.word[i].toLowerCase())?.score||.95}));
  return{text:chosen.numeric+' '+chosen.word,tokens:[...first,...last],
   uncertain:last.filter(t=>t.score<.8),engine:'local-general-primary-grammar',format:'unit'};
 }
 return Object.freeze({recognize,units:UNITS});
}
window.WhiteboardPrimaryMathGrammar=Object.freeze({create});
})();