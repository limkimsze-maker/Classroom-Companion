/* Bounded whole-glyph consensus using the existing, unchanged local models.
 * No fixture IDs, expected labels or handwriting samples are used here.
 * Scores are model evidence, not calibrated confidence probabilities.
 */
(function(root){
'use strict';
root.WhiteboardGlyphReviewFactory=function({bounds,rasterDigit,predictDigit,groupMeasurementInk,checkCancelled}){
 const family=c=>/^[A-Za-z]$/.test(c)?c.toLowerCase():c;
 const mass=(xs,label,weight,char)=>xs.reduce((n,p)=>n+(family(p[label])===family(char)?p[weight]:0),0);
 async function review(strokes,W,H,options,reading){
  if((options.mode||'auto')!=='auto'||!reading||reading.format==='latex'||strokes.length>6||!strokes.length||
    /personal|teacher-confusable|trained-j|local-operator/.test(reading.engine||'')||
    !root.WhiteboardUjiReader||!root.WhiteboardCharacterInference)return reading;
  checkCancelled(options);
  const parts=strokes.map(source=>({source,size:Number(source.size)||4,
   points:source.points.map(p=>({x:p.x*W,y:p.y*H}))})),box=bounds(parts);
  const wideLetter=strokes.length===1&&/^[A-Za-z]$/.test(reading.text)&&box.w<=box.h*4.5;
  if(box.h<10||box.w>box.h*1.7&&!wideLetter)return reading;
  // A full compact glyph may have several pen lifts. Separated neighbouring
  // characters must keep their own decoding, including adjacent numerals.
  const groups=groupMeasurementInk(parts.map(scaled=>({raw:scaled.source,scaled,box:bounds([scaled])})));
  if(groups.length!==1)return reading;
  const pixels=rasterDigit(parts),mixed=root.WhiteboardCharacterInference.predict(pixels,'auto'),
   alpha=root.WhiteboardCharacterInference.predict(pixels,'lowercase'),
   alternate=root.WhiteboardUjiReader.read(parts.map(p=>p.points));
  if(!alternate?.length)return reading;
  const best=alternate[0],fold=family(best.label),isLetter=/^[A-Za-z]$/.test(best.label),
   support=mass(mixed,'char','score',fold),alphabet=mass(alpha,'char','score',fold),
   same=mass(alternate,'label','p',fold);
  let selected=String(reading.text),changed=false;
  if(isLetter&&((same>=.50&&support>=.95&&alphabet>=.95)||
    (same>=.85&&alphabet>=.25)||(same>=.985&&same-(alternate.find(p=>family(p.label)!==fold)?.p||0)>=.95))){
   selected=best.label;changed=selected!==reading.text;
  }
  // Normalization removes absolute letter size. These letter pairs can have
  // the same contour in either case; a weak case vote is not a new identity.
  const caseOnly=/^[A-Za-z]$/.test(reading.text)&&family(reading.text)===family(selected)&&selected!==reading.text;
  if(caseOnly&&('ckopsuvwxyz'.includes(family(selected))||best.p<.98)){
   selected=reading.text;changed=false;
  }
  // Do not replace a letter supported by the mixed reader with an unrelated
  // letter on a unilateral alternate-model vote. Keep both for correction.
  if(/^[A-Za-z]$/.test(reading.text)&&family(reading.text)!==family(selected)&&
    family(mixed[0]?.char||'')===family(reading.text)&&mixed[0].score>=.90){
   selected=reading.text;changed=false;
  }
  // An isolated O/0, I/l/1 or S/5 supplies no additional context that would
  // justify replacing an already read numeral with its letter silhouette.
  if(({O:'0',o:'0',I:'1',l:'1',S:'5',s:'5',B:'8'})[best.label]===reading.text){
   selected=reading.text;changed=false;
  }
  // Digit proposals need explicit mixed-model support. A digit-only model's
  // top answer alone is never evidence that an isolated letter is a number.
  const digit=predictDigit(pixels),digitBest=alternate.find(p=>/^\d$/.test(p.label));
  if(!isLetter&&digitBest===best&&best.p>=.50){
   const image=mixed.find(p=>p.char===best.label)?.score||0,
    numeric= digit.find(p=>p.char===best.label)?.score||0,
    familyImage=mass(mixed,'char','score',({0:'O',1:'I',2:'Z',5:'S',8:'B',9:'g'})[best.label]||best.label)+image;
   if(image>=.05&&(best.p>=.90||numeric>=.05&&familyImage>=.90)){
    selected=best.label;changed=selected!==reading.text;
   }
  }
  const candidates=new Map();
  const add=(text,score)=>{if(!/^[A-Za-z0-9\[\]()]$/.test(text))return;
   const prior=candidates.get(text);if(!prior||score>prior.score)candidates.set(text,{text,score});};
  add(selected,1);add(String(reading.text),.99);
  for(const p of alternate.slice(0,4))if(p.p>=.04)add(p.label,p.p);
  for(const p of mixed.slice(0,3))if(p.score>=.10)add(p.char,p.score);
  // A plain vertical stem has a real 1/I/l ambiguity even when the numeric
  // geometry rule assigns 1 a perfect score. Surface the supported letter.
  for(const p of alpha.slice(0,2))if(p.score>=.25)add(p.char,p.score*.8);
  const disputed=changed||selected.length!==1||
   /^\d$/.test(selected)&&alpha[0]?.score>=.50&&alternate.some(p=>/^[A-Za-z]$/.test(p.label)&&p.p>=.15)||
   best.label!==selected&&best.p>=.15||
   /^[A-Za-z]$/.test(selected)&&(
    mixed[0]?.char!==selected||alternate.some(p=>p.label!==selected&&p.p>=.04));
  if(!disputed)return reading;
  const token={char:selected,score:Math.min(.74,best.p),parts,x:box.x,
   engine:'v2-whole-glyph-review',choices:[...candidates.values()].map(p=>({char:p.text,score:p.score}))};
  const choices=[...candidates.values()].sort((a,b)=>b.score-a.score).slice(0,5)
   .map(p=>({...p,tokens:[{...token,char:p.text}]}));
  if(choices.length<2&&!changed)return reading;
  const result={...reading,text:selected,tokens:[token],uncertain:[token],
   engine:changed?'v2-whole-glyph-consensus':reading.engine,
   format:/^[A-Za-z]$/.test(selected)?'letter':/^\d$/.test(selected)?'number':reading.format,
   context:{kind:'glyphs',model:'existing-local-glyph-consensus',originalText:reading.text,
    applied:changed,needsReview:true,alternatives:choices}};
  checkCancelled(options);return result;
 }
 return{review};
};
})(typeof window==='undefined'?self:window);
