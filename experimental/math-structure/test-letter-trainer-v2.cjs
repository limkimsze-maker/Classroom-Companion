'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),create=require('../../scripts/helpers/handwriting-context.cjs');
const {assemble}=require('../../scripts/benchmark-handwriting-simulations.cjs');
function context(memory=new Map()){const c=create(memory);for(const f of ['symbol-learning-v2.js','reader-v2.js','letter-trainer-v2.js'])vm.runInContext(fs.readFileSync('experimental/math-structure/'+f,'utf8'),c);vm.runInContext(fs.readFileSync('scripts/handwriting-uji-real-ink-fixtures.js','utf8'),c);return c}
(async()=>{
 const memory=new Map(),c=context(memory),R=c.WhiteboardHandwritingMath,L=c.WhiteboardHandwritingLearning;
 const saved=[];
 for(const [label,writer,rep]of [['l',1,0],['k',10,0],['g',4,1]]){
  const ink=assemble(c.WhiteboardUJIInkFixtures.samples[writer],label,rep),before=await R.recognize(ink,1800,600,{mode:'auto'});
  assert.notEqual(before.text,label,'Existing failed letter used as a training control');
  const tx=c.WhiteboardLetterTrainerV2.teachExample(ink,1800,600,label);assert(tx?.count);assert(tx.persistent);saved.push({label,ink});
  assert(L.exportPack().characters.some(s=>s.char===label),'Reusable character feature saved');
  const moved=ink.map(s=>({...s,points:s.points.map(p=>({x:p.x*.85+.04,y:p.y*.85+.03}))}));
  assert.equal((await R.recognize(moved,1800,600,{mode:'auto'})).text,label,'Moved/scaled example reaches Beautify');
  L.undo(tx);assert.equal((await R.recognize(ink,1800,600,{mode:'auto'})).text,before.text,'Undo restores previous reading');
  c.WhiteboardLetterTrainerV2.teachExample(ink,1800,600,label);
 }
 const restored=context(memory);for(const {label,ink}of saved)assert.equal((await restored.WhiteboardHandwritingMath.recognize(ink,1800,600,{mode:'auto'})).text,label,'Saved training survives a reload');
 const pack=L.exportPack(),fresh=context();fresh.WhiteboardHandwritingLearning.importPack(pack);for(const {label,ink}of saved)assert.equal((await fresh.WhiteboardHandwritingMath.recognize(ink,1800,600,{mode:'auto'})).text,label,'Existing export/import includes trainer examples');
 const before=JSON.stringify(L.exportPack().characters);assert.throws(()=>c.WhiteboardLetterTrainerV2.teachExample([],600,330,'l'));assert.throws(()=>c.WhiteboardLetterTrainerV2.teachExample(saved[0].ink,1800,600,'1'));assert.equal(JSON.stringify(L.exportPack().characters),before,'Invalid label/blank pad cannot change learning');
 console.log('PASS explicit l/k/g teaching, all pen lifts labelled together, moved/scaled reuse, Undo, reload, existing export/import and invalid input');
})().catch(e=>{console.error(e);process.exitCode=1});
