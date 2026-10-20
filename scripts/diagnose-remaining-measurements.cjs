/* Reproduce the five remaining measurement errors without altering model weights. */
const fs=require('node:fs'),vm=require('node:vm');
const ctx=require('./helpers/handwriting-context.cjs')();
const {assemble,canonical}=require('./benchmark-handwriting-simulations.cjs');
vm.runInContext(fs.readFileSync('scripts/handwriting-uji-real-ink-fixtures.js','utf8'),ctx);
const samples=ctx.WhiteboardUJIInkFixtures.samples,reader=ctx.WhiteboardHandwritingMath;
const cases=[
 {writer:2,rep:0,text:'8ml'},
 {writer:2,rep:1,text:'8ml'},
 {writer:9,rep:1,text:'35cm'},
 {writer:10,rep:0,text:'97kg'},
 {writer:11,rep:0,text:'97kg'}
];
(async()=>{
 let correct=0;
 for(const c of cases){
  const ink=assemble(samples[c.writer],c.text,c.rep);
  const r=await reader.recognize(ink,1800,600,{mode:'auto'});
  const ok=canonical(r.text)===c.text;
  correct+=Number(ok);
  console.log(JSON.stringify({case:c,actual:r.text,correct:ok,engine:r.engine,
   tokens:(r.tokens||[]).map(t=>({char:t.char,score:t.score,parts:t.parts?.length})),
   uncertain:(r.uncertain||[]).map(t=>({char:t.char,score:t.score}))}));
 }
 console.log('Remaining-measurement diagnostic:',correct+'/'+cases.length,'correct');
})().catch(e=>{console.error(e);process.exitCode=1});
