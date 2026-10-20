/* Actual offline-model checks; frozen fixture ink is never added to training. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx=require('./helpers/handwriting-context.cjs')();
const {assemble,canonical}=require('./benchmark-handwriting-simulations.cjs');
vm.runInContext(fs.readFileSync('scripts/handwriting-uji-real-ink-fixtures.js','utf8'),ctx);
const reader=ctx.WhiteboardHandwritingMath,W=1800,H=600,samples=ctx.WhiteboardUJIInkFixtures.samples;
async function read(writer,rep,text){return reader.recognize(assemble(samples[writer],text,rep),W,H,{mode:'auto'})}
(async()=>{
 const cases=[[3,1,'1cm'],[3,0,'8ml'],[5,1,'97kg'],[9,1,'1cm'],[9,1,'10m'],
  [9,0,'8ml'],[9,1,'8ml'],[9,1,'97kg'],[3,0,'8m³'],[9,0,'8m³'],
  [9,1,'8m³'],[9,1,'20cm³']];
 for(const [writer,rep,text] of cases){
  const result=await read(writer,rep,text);
  assert.equal(canonical(result.text),text,`${writer}/${rep}: ${text}`);
 }
 for(const [writer,rep,text] of [[3,1,'1cm'],[5,1,'97kg'],[9,1,'10m'],[9,0,'8ml'],[9,1,'8ml']]){
  assert((await read(writer,rep,text)).uncertain.length,'weak or conflicting image evidence stays flagged');
 }
 const kg=await read(9,1,'97kg');
 assert.equal(kg.tokens.map(t=>t.char).join(''),'97kg');
 assert.equal(kg.tokens.find(t=>t.char==='k').parts.length,3,'all disconnected k strokes stay together');
 for(const [writer,rep] of [[1,0],[3,0],[9,0],[9,1]]){
  assert.equal(canonical((await read(writer,rep,'10m')).text),'10m','genuine zero stays intact');
 }
 for(const text of ['28ml','109kg','603cm']){
  assert.equal(canonical((await read(1,0,text)).text),text,'new quantities use the same unit rules');
 }
 const cm=await read(1,0,'35cm');
 assert.equal(canonical(cm.text),'35cm');
 assert.equal(cm.tokens.slice(-2).map(t=>t.char).join(''),'cm','c and m retain their separate letter evidence');
 for(const writer of [1,2]){
  assert.notEqual(canonical((await read(writer,0,'8mc')).text),'8ml','clear c evidence is not forced into ml');
 }
 const originalPen=ctx.WhiteboardUjiReader.read;
 ctx.WhiteboardUjiReader.read=parts=>{
  const votes=originalPen(parts);
  return votes[0]?.label.toLowerCase()==='l'?[{label:'e',p:.9999},{label:'l',p:.0001}]:votes;
 };
 assert.notEqual(canonical((await read(9,0,'8ml')).text),'8ml','unit context alone cannot manufacture an l without pen evidence');
 ctx.WhiteboardUjiReader.read=originalPen;
 const ink=assemble(samples[9],'8ml',0),initial=await read(9,0,'8ml');
 const transaction=ctx.WhiteboardHandwritingLearning.confirm(initial,'8 mc',reader.rasterDigit,ink,W,H,'auto');
 assert(transaction?.count);
 assert.equal(canonical((await reader.recognize(ink,W,H,{mode:'auto'})).text),'8mc','personal correction precedes measurement consensus');
 ctx.WhiteboardHandwritingLearning.undo(transaction);
 assert.equal(canonical((await read(9,0,'8ml')).text),'8ml');
 console.log('PASS twelve measurement/power regressions; weak-evidence review flags; disconnected k; zero/8 distinction; new quantities; separate cm; non-unit controls; pen disagreement; personal corrections');
})().catch(error=>{console.error(error);process.exitCode=1});
