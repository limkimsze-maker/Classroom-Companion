'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const createContext=require('../../scripts/helpers/handwriting-context.cjs');
const {cases,ink}=require('./layout-fixtures.cjs'),ctx=createContext(),v1=createContext();
vm.runInContext(require('./candidate.cjs').build(),ctx);
const reader=ctx.WhiteboardHandwritingMath;
(async()=>{
 const records=[];
 for(const [name,node,expected] of cases()){
  for(const [variant,options] of [['original',{}],['moved/scaled/reordered',{scale:.8,reverse:true,direction:true}]]){
   const strokes=ink(node,options),start=performance.now();
   const result=await reader.recognize(strokes,1800,1200,{mode:'auto'});
   const actual=result.text.replace(/\s+/g,''),correct=actual===expected;
   const before=await v1.WhiteboardHandwritingMath.recognize(strokes,1800,1200,{mode:'auto'});
   const row={name,variant,expected,actual,correct,engine:result.engine,ms:Math.round(performance.now()-start),
    v1:before.text,v1Correct:before.text.replace(/\s+/g,'')===expected,
    candidates:result.structuralCandidates,search:result.structuralSearch};
   records.push(row);console.log(JSON.stringify(row));
   if(result.engine==='local-structural-v2'){
    assert.equal(result.consumedStrokeIds.length,strokes.length,'Every selected stroke must be consumed');
    assert.equal(new Set(result.consumedStrokeIds).size,strokes.length,'No stroke assigned twice');
    const sources=result.tokens.flatMap(t=>t.parts||[]).map(p=>p.source);
    assert.equal(new Set(sources).size,strokes.length,'All input strokes represented in teachable tokens');
    assert.equal(result.labelGraph.nodes.length,strokes.length,'One labelled graph node per original stroke');
    assert.equal(new Set(result.labelGraph.nodes.map(n=>n.id)).size,strokes.length);
    assert(reader.structuralV2.toLg(result).includes('N, '),'Export direct CROHME label graph syntax');
   }
  }
 }
 if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify({
  method:'New invented layouts composed from existing UJI V1 glyphs; development tests, not natural whole-expression or held-out-writer accuracy.',
  correct:records.filter(r=>r.correct).length,v1Correct:records.filter(r=>r.v1Correct).length,
  regressions:records.filter(r=>r.v1Correct&&!r.correct).length,total:records.length,records},null,2)+'\n');
 assert.equal(records.filter(r=>!r.correct).length,0,'Nested expression controls');
 const control=ink(cases()[0][1]),outside={size:3,points:[{x:.8,y:.3},{x:.8,y:.4}]};
 assert.notEqual((await reader.recognize([...control,outside],1800,1200,{mode:'auto'})).engine,'local-structural-v2','No surrounding selected ink may disappear');
 const aborted=new AbortController();aborted.abort();
 await assert.rejects(reader.recognize(control,1800,1200,{mode:'auto',signal:aborted.signal}),e=>e.name==='AbortError');
 const learning=ctx.WhiteboardHandwritingLearning,original=await reader.recognize(control,1800,1200,{mode:'auto'});
 const tx=learning.confirm(original,'\\sqrt{\\frac{5}{4}}',reader.rasterDigit,control,1800,1200,'auto');
 assert(tx?.count);assert.equal((await reader.recognize(control,1800,1200,{mode:'auto'})).text,'\\sqrt{\\frac{5}{4}}');
 learning.undo(tx);assert.equal((await reader.recognize(control,1800,1200,{mode:'auto'})).text,original.text);
 console.log('PASS nested layout recognition and complete stroke accounting');
})().catch(error=>{console.error(error);process.exitCode=1});
