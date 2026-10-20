'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),create=require('../../scripts/helpers/handwriting-context.cjs');
const f=require('./sign-fixtures.cjs');
function context(memory=new Map()){
 const c=create(memory);c.localStorage.removeItem=k=>memory.delete(k);
 for(const name of ['symbol-learning-v2.js','reader-v2.js'])vm.runInContext(fs.readFileSync('experimental/math-structure/'+name,'utf8'),c);
 return c;
}
const shift=ss=>ss.map(s=>({...s,points:s.points.map(p=>({x:p.x*.85+.1,y:p.y*.85+.08}))}));
const S=(ps,size=5)=>({size,points:ps.map(([x,y])=>({x:x/f.W,y:y/f.H}))});
const unusual=[S([[0,0],[5,0]]),S([[0,35],[20,35]])];
const read=(c,ss,mode='auto')=>c.WhiteboardHandwritingMath.recognize(ss,f.W,f.H,{mode});
(async()=>{
 const memory=new Map(),c=context(memory),L=c.WhiteboardHandwritingLearning,R=c.WhiteboardHandwritingMath;
 const equation=f.equation('10','2','5',undefined,1,unusual),before=await read(c,equation);console.log('Before teaching',before.text,before.engine);
 const tx=L.confirm(await read(c,unusual),'=',R.rasterDigit,unusual,f.W,f.H,'auto');assert.equal(tx.symbols.char,'=');assert.equal(L.info().symbolExamples,1);
 for(const ss of [f.equation('18','3','6',undefined,1,unusual),shift(f.equation('8','2','4',undefined,1,unusual)),f.equation('10','2','7',undefined,1,unusual).reverse().map(s=>({...s,points:s.points.slice().reverse()}))]){
  const result=await read(c,ss);assert.equal(result.engine,'local-personal-symbols-v2');assert(result.text.includes('='));assert(result.tokens.some(t=>t.engine==='local-personal-symbol-v2'));assert.equal(result.tokens.flatMap(t=>t.parts).length,ss.length);
 }
 assert.equal((await read(c,f.equation('18','3','6',undefined,1,unusual))).text.replace(/\s/g,''),'18÷3=6');
 assert.equal((await read(c,f.equation('10','2','7',undefined,1,unusual))).text.replace(/\s/g,''),'10÷2=7');
 const pack=JSON.stringify(L.exportPack());assert.equal(L.validatePack(pack).symbols.length,1);
 const restored=context(memory);assert.equal((await read(restored,f.equation('18','3','6',undefined,1,unusual))).engine,'local-personal-symbols-v2');
 const imported=context(),result=imported.WhiteboardHandwritingLearning.importPack(pack);assert(result.added>0);assert.equal((await read(imported,f.equation('8','2','4',undefined,1,unusual))).text.replace(/\s/g,''),'8÷2=4');assert.equal(imported.WhiteboardHandwritingLearning.importPack(pack).added,0);
 const snapshot=JSON.stringify(imported.WhiteboardHandwritingLearning.exportPack());assert.throws(()=>imported.WhiteboardHandwritingLearning.importPack('{"schema":"other"}'));const invalid=JSON.parse(pack);invalid.symbols[0].strokes[0].points[0].x=Infinity;assert.throws(()=>imported.WhiteboardHandwritingLearning.importPack(invalid));assert.equal(JSON.stringify(imported.WhiteboardHandwritingLearning.exportPack()).replace(/"createdAt":"[^"]*"/,''),snapshot.replace(/"createdAt":"[^"]*"/,''));
 // Exact changed-token alignment teaches only the corrected sign's strokes.
 const automatic=context(),autoR=automatic.WhiteboardHandwritingMath,old=await read(automatic,equation);
 const autoTx=automatic.WhiteboardHandwritingLearning.confirm(old,'10 ÷ 2 = 5',autoR.rasterDigit,equation,f.W,f.H,'auto');
 assert(autoTx?.symbols,'Unique equation correction extracts reusable equals strokes');assert.equal(autoTx.symbols.char,'=');assert.equal(automatic.WhiteboardHandwritingLearning.exportPack().symbols[0].strokes.length,2);
 // Other operations and all three division strokes retain their meaning.
 const plus=[S([[0,0],[26,0]]),S([[13,-13],[13,13]])],times=[S([[0,-13],[26,13]]),S([[0,13],[26,-13]])];
 assert.equal((await read(c,f.equation('3','2','6',times))).text.replace(/\s/g,''),'3×2=6');
 assert.equal((await read(c,f.equation('3','2','5',plus))).text.replace(/\s/g,''),'3+2=5');
 for(const [char,sign,a,b,answer]of [['+',plus,'3','2','5'],['×',times,'3','2','6'],['÷',f.divide,'8','2','4'],['−',[S([[0,0],[26,0]])],'8','2','6']]){
  const other=context(),model=other.WhiteboardHandwritingMath,learner=other.WhiteboardHandwritingLearning;
  const saved=learner.confirm(await read(other,sign),char,model.rasterDigit,sign,f.W,f.H,'auto');assert.equal(saved.symbols.char,char);
  const r=await read(other,f.equation(a,b,answer,sign));assert.equal(r.engine,'local-personal-symbols-v2',char+' transfers into an equation');assert.equal(r.text.replace(/\s/g,''),a+char+b+'='+answer);
 }
 assert(!L.proposeSymbols([...unusual,S([[10,55]])],f.W,f.H,'auto',R.rasterDigit).length,'Do not consume an incomplete three-mark sign');
 assert(!L.proposeSymbols(unusual,f.W,f.H,'digits',R.rasterDigit).length,'Explicit modes stay unchanged');
 L.undo(tx);assert.equal(L.info().symbolExamples,0);assert.equal((await read(c,equation)).text,before.text);
 // Full storage must not discard local examples or falsely report additions.
 const full=JSON.parse(pack);full.symbols=Array.from({length:160},(_,i)=>({...full.symbols[0],id:'local-'+i,aspect:full.symbols[0].aspect+i*.00001}));const capped=context();capped.WhiteboardHandwritingLearning.importPack(full);assert.equal(capped.WhiteboardHandwritingLearning.info().symbolExamples,160);assert.equal(capped.WhiteboardHandwritingLearning.importPack(pack).added,0);
 const denied=context();denied.localStorage.setItem=()=>{throw Error('storage denied')};const deniedTx=denied.WhiteboardHandwritingLearning.confirm(await read(denied,unusual),'=',denied.WhiteboardHandwritingMath.rasterDigit,unusual,f.W,f.H,'auto');assert.equal(deniedTx.persistent,false);assert.equal(denied.WhiteboardHandwritingLearning.info().symbolExamples,1);assert.equal((await read(denied,f.equation('18','3','6',undefined,1,unusual))).engine,'local-personal-symbols-v2');denied.WhiteboardHandwritingLearning.undo(deniedTx);assert.equal(denied.WhiteboardHandwritingLearning.info().symbolExamples,0);
 console.log('PASS symbol transfer across values/placement/scale/pen order; wrong written answer; unique edit extraction; export/import/deduplication/reload; malformed import atomicity; division/plus/times negatives; explicit modes; Undo');
})().catch(e=>{console.error(e);process.exitCode=1});
