/* Replay the eight same-ink disagreements that motivated component priority.
 * These frozen UJI V1 compositions are regression checks, never training data. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const createContext=require('./helpers/handwriting-context.cjs');
const {assemble,canonical}=require('./benchmark-handwriting-simulations.cjs');
const ctx=createContext(),W=1800,H=600;
vm.runInContext(fs.readFileSync('scripts/handwriting-uji-real-ink-fixtures.js','utf8'),ctx);
const cases=[
 [1,1,'8m³'],[3,1,'8m³'],[7,0,'6−2=4cm²'],[8,1,'10m²'],
 [8,0,'20cm³'],[9,0,'20cm³'],[10,0,'8m³'],[11,1,'20cm³']
];
(async()=>{
 for(const [writer,rep,expected] of cases){
  const ink=assemble(ctx.WhiteboardUJIInkFixtures.samples[writer],expected,rep);
  const result=await ctx.WhiteboardHandwritingMath.recognize(ink,W,H,{mode:'auto'});
  assert.equal(canonical(result.text),expected,`writer ${writer}, repetition ${rep}`);
  assert.equal(result.engine,'unit-first-components');
 }
 console.log('PASS all eight component-priority regressions with actual offline models');
})().catch(error=>{console.error(error);process.exitCode=1});
