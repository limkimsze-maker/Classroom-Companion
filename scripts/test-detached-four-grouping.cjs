/* Replay frozen UJI V1 glyphs without importing them into training. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx=require('./helpers/handwriting-context.cjs')();
const {assemble,canonical}=require('./benchmark-handwriting-simulations.cjs');
vm.runInContext(fs.readFileSync('scripts/handwriting-uji-real-ink-fixtures.js','utf8'),ctx);
const reader=ctx.WhiteboardHandwritingMath,W=1800,H=600,samples=ctx.WhiteboardUJIInkFixtures.samples;
const transform=(ink,sx,sy,dx,dy)=>ink.map(s=>({...s,points:s.points.map(p=>({x:p.x*sx+dx,y:p.y*sy+dy}))}));
const signs=tokens=>Array.from(tokens).filter(t=>['−','+','×','÷','='].includes(t.char)).map(t=>t.char);
(async()=>{
 for(const expected of ['4','1234','6−2=4','8÷2=4','6−2=4cm²']){
  const result=await reader.recognize(assemble(samples[4],expected,1),W,H,{mode:'auto'});
  assert.equal(canonical(result.text),expected,`complete reading: ${expected}`);
 }
 const four=assemble(samples[4],'4',1);
 for(const [sx,sy,dx,dy] of [[1,1,0,0],[.65,.65,.1,.1],[1.3,1.3,.02,-.05]]){
  for(const ink of [transform(four,sx,sy,dx,dy),transform(four,sx,sy,dx,dy).reverse()]){
   const tokens=reader.segment(ink,W,H);
   assert.equal(tokens.length,1,'detached parts stay grouped after movement, scaling and pen-order reversal');
   assert.equal(tokens[0].char,'4');assert.equal(tokens[0].parts.length,2,'both original strokes are preserved');
  }
 }
 // This stretched variant makes the image model prefer 6 while the pen
 // model prefers 4. Keep the grouping conservative when those models differ.
 assert.equal(reader.segment(transform(four,1.08,.94,.03,.01),W,H).length,2,
   'naturally disagreeing classifiers must not force a detached-4 merge');
 // Preserve each true adjacent glyph across all eleven writers and both
 // repetitions, regardless of how its numeral is classified downstream.
 let controls=0;
 for(const sample of Object.values(samples))for(const rep of [0,1]){
  for(const value of ['61','41','11','71','64','14','12']){
   const boundary=assemble(sample,value[0],rep).length;
   for(const scale of [1,.7]){
    const ink=transform(assemble(sample,value,rep),scale,scale,.02,.01);
    const tokens=reader.segment(ink,W,H);
    for(const token of tokens){
     const indices=Array.from(token.parts,p=>ink.indexOf(p.source));
     assert(!(indices.some(i=>i<boundary)&&indices.some(i=>i>=boundary)),
       `true ${value} must not merge across its digit boundary`);
    }
    controls++;
   }
  }
 }
 for(const [text,expected] of [['4−2',['−']],['4+2',['+']],['4×2',['×']],['4÷2',['÷']],['4=4',['=']]]){
  assert.deepEqual(signs(reader.segment(assemble(samples[4],text,1),W,H)),expected,`operator preserved: ${text}`);
 }
 const falseEquation=await reader.recognize(assemble(samples[4],'6−2=61',1),W,H,{mode:'auto'});
 assert.equal(canonical(falseEquation.text),'6−2=61','the recognizer must preserve a genuine 61 rather than infer 4 from the arithmetic');
 const far=four.map((s,i)=>i?{...s,points:s.points.map(p=>({...p,x:p.x+.03}))}:s);
 assert.equal(reader.segment(far,W,H).length,2,'a large gap must not be bridged');
 const pen=ctx.WhiteboardUjiReader;
 ctx.WhiteboardUjiReader={read:()=>[{label:'6',p:.9999},{label:'4',p:.0001}]};
 assert.equal(reader.segment(four,W,H).length,2,'model disagreement prevents a merge');
 ctx.WhiteboardUjiReader=pen;
 const result=await reader.recognize(four,W,H,{mode:'auto'});
 const transaction=ctx.WhiteboardHandwritingLearning.confirm(result,'61',reader.rasterDigit,four,W,H,'auto');
 assert(transaction?.count);
 assert.equal((await reader.recognize(four,W,H,{mode:'auto'})).text,'61','personal whole-ink correction stays authoritative');
 ctx.WhiteboardHandwritingLearning.undo(transaction);
 assert.equal((await reader.recognize(four,W,H,{mode:'auto'})).text,'4');
 console.log(`PASS five detached-4 regressions; ${controls} adjacent-digit boundary controls; transforms, genuine operators, false equation, large gap, model disagreement and personal corrections`);
})().catch(error=>{console.error(error);process.exitCode=1});
