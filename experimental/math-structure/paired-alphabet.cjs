'use strict';
// Broader development audit: uppercase and lowercase controls must not be
// sacrificed to improve the six-letter portion of the original benchmark.
const fs=require('node:fs'),vm=require('node:vm'),zlib=require('node:zlib'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const createContext=require('../../scripts/helpers/handwriting-context.cjs'),{assemble}=require('../../scripts/benchmark-handwriting-simulations.cjs');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
(async()=>{
 const source=require('./candidate.cjs').build(),baseline=createContext(),candidate=createContext();vm.runInContext(source,candidate);
 const fixture=fs.readFileSync('scripts/handwriting-uji-word-fixtures.json.gz'),samples=JSON.parse(zlib.gunzipSync(fixture)).samples,records=[];
 for(const writer of ['1','2','3','4','5'])for(const expected of 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz')for(const rep of [0,1]){
  const strokes=assemble(samples[writer],expected,rep),a=await baseline.WhiteboardHandwritingMath.recognize(strokes,1800,600,{mode:'auto'}),
   b=await candidate.WhiteboardHandwritingMath.recognize(strokes,1800,600,{mode:'auto'});
  records.push({writer,expected,rep,before:a.text,after:b.text,beforeCorrect:a.text===expected,
   afterCorrect:b.text===expected,flagged:!!b.uncertain?.length,choices:b.context?.alternatives.map(p=>p.text)});
  if(records.length%104===0)console.log('Alphabet',records.length,'/',520);
 }
 const regressions=records.filter(r=>r.beforeCorrect&&!r.afterCorrect),report={
  method:'520 isolated glyph controls from existing UJI V1 writers 1–5. Development preservation audit, not independent real-world accuracy. Overlaps some original benchmark letters.',
  protectedV1Sha256:require('./candidate.cjs').protectedSha256,candidateSha256:hash(source),fixtureSha256:hash(fixture),total:records.length,
  beforeCorrect:records.filter(r=>r.beforeCorrect).length,afterCorrect:records.filter(r=>r.afterCorrect).length,
  gains:records.filter(r=>!r.beforeCorrect&&r.afterCorrect).length,regressions,records};
 if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({total:report.total,before:report.beforeCorrect,after:report.afterCorrect,gains:report.gains,regressions:regressions.length}));
 assert.equal(regressions.length,0,'Previously correct uppercase/lowercase controls must be preserved');
})().catch(error=>{console.error(error);process.exitCode=1});
