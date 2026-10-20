/* A component hypothesis must explain a complete compound unit, with a
 * separate valid numeric prefix. Disagreements remain visible for review. */
(function(root){
'use strict';
root.WhiteboardCompoundReviewFactory=function({bounds,rasterDigit}){
 return function(groups,letters,suffix,prefix){
  if(groups.length!==2||!root.WhiteboardUjiReader||!root.WhiteboardCharacterInference)return null;
  const choices=groups.map(parts=>{
   const ranked=root.WhiteboardUjiReader.read(parts.map(p=>p.points)),best=ranked?.[0];
   if(!best||!/[A-Za-z]/.test(best.label))return null;
   const char=best.label.toLowerCase(),same=ranked.reduce((n,p)=>n+(p.label.toLowerCase()===char?p.p:0),0),
    other=ranked.find(p=>p.label.toLowerCase()!==char)?.p||0,
    image=root.WhiteboardCharacterInference.predict(rasterDigit(parts),'lowercase'),
    support=image.find(p=>p.char===char)?.score||0;
   if(same<.75||same-other<.50)return null;
   return{char,same,support};
  });
  if(choices.some(p=>!p))return null;
  const word=choices.map(p=>p.char).join('');
  // ml/L uses a separate prototype-backed cursive-l rule. Do not bypass it.
  if(!['cm','km','kg','mg'].includes(word)||!choices.some(p=>p.same>=.85&&p.support>=.85))return null;
  const body=bounds(suffix.map(p=>p.scaled)),numeric=bounds(prefix.map(p=>p.scaled));
  if(word.endsWith('g')&&body.y+body.h<numeric.y+numeric.h+Math.max(body.h,numeric.h)*.09)return null;
  return{word,score:Math.min(...choices.map(p=>p.same)),
   confidence:choices.map(p=>Math.min(.74,p.support,p.same)),evidence:'component-alternate-consensus'};
 };
};
})(typeof window==='undefined'?self:window);
