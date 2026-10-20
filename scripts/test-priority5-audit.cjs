/* Frozen UJI V1 regressions and changed-value controls; never training data. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx=require('./helpers/handwriting-context.cjs')();
const {assemble,canonical}=require('./benchmark-handwriting-simulations.cjs');
vm.runInContext(fs.readFileSync('scripts/handwriting-uji-real-ink-fixtures.js','utf8'),ctx);
const samples=ctx.WhiteboardUJIInkFixtures.samples,reader=ctx.WhiteboardHandwritingMath;
async function read(writer,rep,text,mode='auto'){
 return reader.recognize(assemble(samples[writer],text,rep),1800,600,{mode});
}
(async()=>{
 const fixed=[[3,0,'1'],[5,1,'3'],[9,1,'35'],[9,1,'507'],[9,1,'1234'],[9,1,'10m²'],
  [9,1,'6−2=4'],[9,1,'8÷2=4'],[9,1,'6−2=4cm²'],[9,1,'9+7=16m²']];
 for(const [w,rep,text]of fixed)assert.equal(canonical((await read(w,rep,text)).text),text);
 // No fixed quantity or arithmetic answer is baked into the rescue rules.
 for(const text of ['57','1507','12m²','6−2=5','9+7=15m²']){
  assert.equal(canonical((await read(9,1,text)).text),text,`changed value ${text}`);
 }
 for(const text of ['4','5']){
  const ambiguous=await read(9,1,text);
  assert(ambiguous.uncertain.length,`isolated ${text} requires review`);
 }
 assert.equal((await read(9,1,'5','uppercase')).text,'S','explicit letters retain S');
 assert.equal((await read(9,1,'4','uppercase')).text,'Y','explicit letters retain Y');
 const measurement=await read(10,0,'97kg');
 assert(measurement.uncertain.length,'remaining unit boundary disagreement remains visible');
 const reviewed=await read(9,1,'6−2=4');
 assert(reviewed.uncertain.some(t=>t.char==='4'),'weak image support must not become confident 4');
 console.log('PASS Priority 5: ten fixes, changed quantities, unchanged false equations, isolated ambiguity review and explicit letter modes');
})().catch(error=>{console.error(error);process.exitCode=1});
