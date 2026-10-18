/* Writer-labelled adult-style tablet pen benchmarking, not retraining.
   Load scripts/handwriting-uji-real-ink-fixtures.js first, and load the
   Beta local digit/letter inference models and recogniser.
   Run await WhiteboardUJIRegression.run().
   Each expression is assembled from independently written REAL pen glyphs
   by the SAME writer/session; it is not a naturally written full phrase.
   Dataset: Llorens, Prat, Marzal & Vilar, UJI Pen Characters, CC BY 4.0.
   DOI https://doi.org/10.24432/C5731G
*/
(function(root){
'use strict';
const W=1000,H=700,scale=.085,gap=15;
const sentences=Object.freeze([
 ['97kg','97 kg'],['35cm','35 cm'],['8ml','8 ml'],
 ['821','821'],['842','842'],['972L','972 L']]);
function assemble(set,label,session){
 let shift=38;const strokes=[];
 for(const c of label){
  const ink=set[c]?.[session];if(!ink?.length)return null;
  const flat=ink.flat(),xmin=Math.min(...flat.map(p=>p[0])),xmax=Math.max(...flat.map(p=>p[0]));
  for(const part of ink){
   const points=part.map(([x,y])=>({x:(shift+(x-xmin)*scale)/W,y:(100+(y-400)*scale)/H}));
   if(points.length)strokes.push({size:3,points});
  }
  shift+=(xmax-xmin)*scale+gap+(c==='7'?7:0);
 }
 return strokes;
}
async function run(reader=root.WhiteboardHandwritingMath){
 if(!reader?.recognize)throw Error('Load the local handwriting recogniser first.');
 const all=root.WhiteboardUJIInkFixtures?.samples;
 if(!all)throw Error('Load scripts/handwriting-uji-real-ink-fixtures.js first.');
 const records=[];
 for(const [writer,set]of Object.entries(all)){
  for(const [label,expected]of sentences)for(const rep of [0,1]){
   const ink=assemble(set,label,rep);
   if(!ink){records.push({writer,label,expected,result:'MISSING',pass:false});continue}
   try{
    const prediction=await reader.recognize(ink,W,H,{mode:'auto'});
    records.push({writer,label,expected,result:prediction.text,
     engine:prediction.engine,pass:prediction.text.replace(/\s/g,'')===label});
   }catch(e){records.push({writer,label,expected,result:String(e.message),pass:false})}
  }
 }
 const by={};for(const row of records){
  const item=by[row.label]||(by[row.label]={correct:0,total:0});
  item.total++;if(row.pass)item.correct++;
 }
 return{testType:'composite of real UJI pen strokes from 11 writers; NOT writer-written equations',
  correct:records.filter(r=>r.pass).length,total:records.length,by,records,
  rights:'CC BY 4.0 UJI Pen Characters https://doi.org/10.24432/C5731G'};
}
root.WhiteboardUJIRegression=Object.freeze({run,assemble,sentences});
})(typeof window==='undefined'?self:window);
