'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const createContext=require('../../scripts/helpers/handwriting-context.cjs'),{assemble,canonical}=require('../../scripts/benchmark-handwriting-simulations.cjs');
const baseline=createContext(),ctx=createContext();vm.runInContext(require('./candidate.cjs').build(),ctx);
vm.runInContext(fs.readFileSync('scripts/handwriting-uji-real-ink-fixtures.js','utf8'),ctx);
const samples=ctx.WhiteboardUJIInkFixtures.samples,reader=ctx.WhiteboardHandwritingMath,W=1800,H=600;
const ink=(writer,text,rep)=>assemble(samples[writer],text,rep);
const variations=strokes=>[
 ['original',strokes],
 ['smaller and moved',strokes.map(s=>({...s,points:s.points.map(p=>({x:p.x*.8+.02,y:p.y*.8+.03}))}))],
 ['reversed strokes and direction',strokes.slice().reverse().map(s=>({...s,points:s.points.slice().reverse()}))]
];
(async()=>{
 const records=[];
 // Regression examples guide development; they are not an independent test.
 for(const [writer,text,rep] of [[9,'4',1],[9,'5',1],[10,'97kg',0],[1,'m',1],[8,'k',0],[7,'L',1]]){
  for(const [variant,strokes]of variations(ink(writer,text,rep))){
   const after=await reader.recognize(strokes,W,H,{mode:'auto'});
   // A compact k with no case context retains a review choice when needed.
   if(text==='k'&&after.text!=='k')assert(after.context?.alternatives.some(c=>c.text==='k'));
   else assert.equal(canonical(after.text),text,`${writer}/${rep} ${text}: ${variant}`);
   assert(after.uncertain.length,'Conflicting model evidence stays visible');
   const sources=after.tokens.flatMap(t=>(t.parts||[]).map(p=>p.source));
   assert.equal(new Set(sources).size,strokes.length,'Every selected stroke is represented');
   records.push({writer,expected:text,variant,actual:after.text,flagged:true,choices:after.context?.alternatives.map(c=>c.text)});
  }
 }
 for(const text of ['27kg','57kg','107kg','207kg']){
  const result=await reader.recognize(ink(10,text,0),W,H,{mode:'auto'});
  assert.equal(canonical(result.text),text,'Changed quantity: '+text);
 }
 for(const mode of ['lowercase','uppercase','digits'])for(const [writer,text,rep]of [[9,'4',1],[9,'5',1],[1,'m',1]]){
  const strokes=ink(writer,text,rep),a=await baseline.WhiteboardHandwritingMath.recognize(strokes,W,H,{mode}),
   b=await reader.recognize(strokes,W,H,{mode});
  assert.equal(b.text,a.text,'Explicit mode remains authoritative: '+mode);
 }
 const stems=ink(1,'l',0),stem=await reader.recognize(stems,W,H,{mode:'auto'});
 assert(stem.uncertain.length,'A 1/l/I ambiguity is not silently certain');
 assert(stem.context?.alternatives.some(c=>c.text==='l'),'Letter alternative survives numeric geometry');
 const strokes=ink(9,'4',1),before=await reader.recognize(strokes,W,H,{mode:'auto'});
 const tx=ctx.WhiteboardHandwritingLearning.confirm(before,'Y',reader.rasterDigit,strokes,W,H,'auto');
 assert(tx?.count);assert.equal((await reader.recognize(strokes,W,H,{mode:'auto'})).text,'Y');
 ctx.WhiteboardHandwritingLearning.undo(tx);
 assert.equal((await reader.recognize(strokes,W,H,{mode:'auto'})).text,'4');
 await assert.rejects(reader.recognize(strokes,W,H,{mode:'auto',signal:{aborted:true}}),{name:'AbortError'});
 if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify({method:'Known development errors, correlated transformations and changed quantities. No training; no independent accuracy claim.',records},null,2)+'\n');
 console.log('PASS numeric and unit recovery, whole-glyph coverage, visible alternatives, explicit modes, changed quantities, learning/Undo and cancellation');
})().catch(error=>{console.error(error);process.exitCode=1});
