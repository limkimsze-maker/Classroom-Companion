/* Diagnostic only: force the same immutable UJI V1 compositions through both
 * powered-unit recognizers. No changes to production engine selection. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const createContext=require('./helpers/handwriting-context.cjs');
const {assemble,canonical}=require('./benchmark-handwriting-simulations.cjs');
const root=path.resolve(__dirname,'..'),W=1800,H=600;
const ctx=createContext();
vm.runInContext(fs.readFileSync(path.join(root,'scripts/handwriting-uji-real-ink-fixtures.js'),'utf8'),ctx);
const src=fs.readFileSync(path.join(root,'whiteboard-handwriting-recognition-beta.js'),'utf8');
const marker="window.WhiteboardHandwritingMath={recognize,predictDigit,rasterDigit,segment};";
if(!src.includes(marker))throw Error('Reader export anchor changed');
vm.runInContext(src.replace(marker,marker+"window.__compareUnitEngines={components:recognizeUnitComponents,whole:recognizeUnitFirst,combined:recognize};"),ctx);
const expectedCases=['10m²','35cm²','8m³','20cm³','6−2=4cm²','9+7=16m²'];
(async()=>{
 const records=[],stats={};
 for(const [writer,samples] of Object.entries(ctx.WhiteboardUJIInkFixtures.samples)){
  for(const expected of expectedCases)for(const rep of [0,1]){
   const ink=assemble(samples,expected,rep);if(!ink)continue;
   const row={id:`uji-${writer}-${rep}-${expected}`,expected,partition:Number(writer)<=5?'development':'validation'};
   for(const [name,fn] of Object.entries(ctx.__compareUnitEngines)){
    try{const result=await fn(ink,W,H,{mode:'auto'});row[name]={text:result?.text||'',engine:result?.engine||'abstain',correct:!!result&&canonical(result.text)===canonical(expected),abstain:!result,flagged:!!result?.uncertain?.length};}
    catch(error){row[name]={text:'',engine:'error',correct:false,abstain:true,error:String(error)};}
   }
   records.push(row);
  }
 }
 for(const key of ['components','whole','combined']){
  const handled=records.filter(r=>!r[key].abstain),correct=records.filter(r=>r[key].correct);
  stats[key]={correct:correct.length,total:records.length,handled:handled.length,accuracyAll:correct.length/records.length,accuracyWhenHandled:correct.length/Math.max(1,handled.length)};
 }
 const paired={bothCorrect:0,componentsOnly:0,wholeOnly:0,bothWrong:0,componentAbstainWholeCorrect:0,wholeAbstainComponentCorrect:0};
 for(const r of records){
  const a=r.components.correct,b=r.whole.correct;
  if(a&&b)paired.bothCorrect++;else if(a)paired.componentsOnly++;else if(b)paired.wholeOnly++;else paired.bothWrong++;
  if(r.components.abstain&&b)paired.componentAbstainWholeCorrect++;
  if(r.whole.abstain&&a)paired.wholeAbstainComponentCorrect++;
 }
 console.log('CONTROLLED_SUMMARY',JSON.stringify({stats,paired}));
 console.log('CONTROLLED_DISAGREEMENTS',JSON.stringify(records.filter(r=>r.components.correct!==r.whole.correct||r.components.abstain!==r.whole.abstain)));
 fs.writeFileSync('beta-handwriting-engine-comparison.json',JSON.stringify({stats,paired,records},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
