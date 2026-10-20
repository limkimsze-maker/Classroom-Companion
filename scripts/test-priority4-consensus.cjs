/* Acceptance checks use frozen UJI V1 ink; no samples enter training. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx=require('./helpers/handwriting-context.cjs')();
const {assemble,canonical}=require('./benchmark-handwriting-simulations.cjs');
vm.runInContext(fs.readFileSync('scripts/handwriting-uji-real-ink-fixtures.js','utf8'),ctx);
const reader=ctx.WhiteboardHandwritingMath,W=1800,H=600,samples=ctx.WhiteboardUJIInkFixtures.samples;
const ink=(writer,rep,text)=>assemble(samples[writer],text,rep);
const read=(writer,rep,text,options={mode:'auto'})=>reader.recognize(ink(writer,rep,text),W,H,options);
(async()=>{
 for(const [writer,rep,text] of [[2,0,'8ml'],[2,1,'8ml'],[9,1,'35cm'],[11,0,'97kg'],[9,1,'35cm²']]){
  const result=await read(writer,rep,text);
  assert.equal(canonical(result.text),text,`${writer}/${rep}: ${text}`);
  assert(result.uncertain.length,'recovered but disputed readings remain flagged');
 }
 const unresolved=await read(10,0,'97kg');
 if(canonical(unresolved.text)!=='97kg')assert(unresolved.uncertain.length,'an unresolved conflicting numeric prefix must be flagged');
 for(const [writer,rep,text] of [[2,0,'28ml'],[2,1,'175ml'],[9,1,'53cm'],[9,1,'105cm'],[11,0,'27kg']]){
  assert.equal(canonical((await read(writer,rep,text)).text),text,'new quantities must use the same component evidence');
 }
 assert.equal((await read(9,1,'5',{mode:'uppercase'})).text,'S','measurement-only digit families must not change explicit letter mode');
 for(const sample of Object.values(samples))for(const rep of [0,1]){
  const result=await reader.recognize(assemble(sample,'8mc',rep),W,H,{mode:'auto'});
  assert.notEqual(canonical(result.text),'8ml','a normal-height c must not be turned into a cursive l');
 }
 const teacher=ctx.WhiteboardTeacherUnits;
 ctx.WhiteboardTeacherUnits={...teacher,rank:()=>[{label:'ml',score:.81},{label:'cm',score:.80}]};
 assert.notEqual(canonical((await read(2,0,'8ml')).text),'8ml','a weak tied whole-unit prototype cannot force a recovery');
 ctx.WhiteboardTeacherUnits=teacher;
 const original=await read(2,0,'8ml'),strokes=ink(2,0,'8ml');
 const tx=ctx.WhiteboardHandwritingLearning.confirm(original,'8 mc',reader.rasterDigit,strokes,W,H,'auto');
 assert(tx?.count);
 assert.equal(canonical((await reader.recognize(strokes,W,H,{mode:'auto'})).text),'8mc','personal correction stays authoritative');
 ctx.WhiteboardHandwritingLearning.undo(tx);
 assert.equal(canonical((await read(2,0,'8ml')).text),'8ml');
 console.log('PASS Priority 4: five corrected readings, unresolved-prefix review, new quantities, explicit letter mode, 22 non-unit controls, weak-prototype rejection and personal corrections');
})().catch(error=>{console.error(error);process.exitCode=1});
