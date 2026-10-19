/* Local notation language model: shallow fusion with independent visual votes.
 * No network requests, equation solving, or handwriting training writes.
 */
(function(root){
'use strict';
const model=root.WhiteboardHandwritingContextModel;
if(!model)return;
const normalize=text=>String(text).replace(/\s/g,'').replace(/-/g,'−').replace(/\d+(?:\.\d+)?/g,'#');
const totals=model.counts.map(table=>{
 const result={};for(const [key,count]of Object.entries(table)){
  const prefix=key.slice(0,-1);result[prefix]=(result[prefix]||0)+count;
 }return result;
});
function score(text){
 const value='^^'+normalize(text)+'$';let sum=0;
 for(let i=2;i<value.length;i++){
  let probability=0;
  // Interpolated backoff keeps unseen but visually plausible sequences alive.
  for(let order=0;order<3;order++){
   const key=value.slice(i-order,i+1),prefix=key.slice(0,-1);
   const p=((model.counts[order][key]||0)+.25)/((totals[order][prefix]||0)+.25*model.vocabulary.length);
   probability+=(order===2?.65:order===1?.25:.10)*p;
  }
  sum+=Math.log(Math.max(1e-8,probability));
 }
 return sum/Math.max(1,value.length-2);
}
const canonical=text=>String(text).replace(/\s/g,'').replace(/-/g,'−');
function rank(candidates){
 const unique=new Map();
 for(const item of candidates){
  if(!item||typeof item.text!=='string'||!Number.isFinite(item.visualScore))continue;
  const languageScore=score(item.text),row={...item,languageScore,score:item.visualScore+.45*languageScore};
  const key=canonical(item.text),old=unique.get(key);
  if(!old||row.score>old.score)unique.set(key,row);
 }
 return [...unique.values()].sort((a,b)=>b.score-a.score);
}
root.WhiteboardHandwritingContext=Object.freeze({score,rank,canonical,
 units:Object.freeze(model.units.slice()),poweredUnits:Object.freeze(model.poweredUnits.slice()),
 info:()=>({schema:model.schema,samples:model.samples,corpusSha256:model.corpusSha256,method:model.method})});
})(window);
