'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const assert=require('node:assert/strict');
const {build,protectedSha256}=require('./candidate.cjs');
const {run}=require('../../scripts/benchmark-handwriting-simulations.cjs');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function compare(before,after){
 assert.equal(before.readerSha256,protectedSha256,'Baseline must be the protected V1 reader');
 assert.equal(after.readerSha256,hash(build()),'Candidate results must match the tested V2 source');
 assert.equal(before.records.length,924,'Full frozen benchmark required');
 assert.equal(after.records.length,before.records.length);
 const old=new Map(before.records.map(r=>[r.id,r]));
 assert.equal(old.size,924,'Baseline IDs must be unique');
 assert.equal(new Set(after.records.map(r=>r.id)).size,924,'Candidate IDs must be unique');
 const gains=[],regressions=[],newUnflaggedErrors=[],changed=[];
 for(const r of after.records){
  const a=old.get(r.id);assert(a,'Missing baseline case: '+r.id);
  for(const key of ['expected','writer','partition','category'])assert.equal(r[key],a[key],key+' changed');
  if(!a.correct&&r.correct)gains.push(r.id);
  if(a.correct&&!r.correct)regressions.push(r.id);
  if(a.flagged&&!r.flagged&&!r.correct)newUnflaggedErrors.push(r.id);
  if(a.actual!==r.actual||a.flagged!==r.flagged)changed.push({id:r.id,before:a.actual,after:r.actual,beforeFlagged:a.flagged,afterFlagged:r.flagged});
 }
 const report={schema:'classroom-isolated-v2-paired-simulations-v1',
  method:'Identical frozen UJI V1 glyph compositions, fresh isolated model/storage contexts. No training or model changes.',
  limitation:'Simulation scores and existing teacher development controls do not estimate unfamiliar-writer whole-expression accuracy.',
  protectedV1Sha256:protectedSha256,candidateSha256:hash(build()),
  fixtureSha256:hash(fs.readFileSync(path.resolve(__dirname,'../../scripts/handwriting-uji-real-ink-fixtures.js'))),
  before:before.summary,after:after.summary,beforeByCategory:before.by,afterByCategory:after.by,
  gains,regressions,newUnflaggedErrors,changed,
  regressionGatePassed:!regressions.length&&!newUnflaggedErrors.length,
  productionIntegrated:false};
 return report;
}
module.exports={compare};
if(require.main===module)(async()=>{
 let before,after,output;
 if(process.argv[2]==='--compare'){
  before=JSON.parse(fs.readFileSync(process.argv[3]));after=JSON.parse(fs.readFileSync(process.argv[4]));output=process.argv[5];
 }else{
  output=process.argv[2];
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'classroom-v2-')),reader=path.join(dir,'reader.js');
  try{
   fs.writeFileSync(reader,build());
   before=await run({split:'all',progress:r=>console.log('V1',r.done,r.correct)});
   after=await run({split:'all',readerPath:reader,progress:r=>console.log('V2',r.done,r.correct)});
   const artifactDir=path.dirname(path.resolve(output||'v2-paired-report.json'));
   fs.mkdirSync(artifactDir,{recursive:true});
   fs.writeFileSync(path.join(artifactDir,'v1-simulations.json'),JSON.stringify(before,null,2)+'\n');
   fs.writeFileSync(path.join(artifactDir,'v2-simulations.json'),JSON.stringify(after,null,2)+'\n');
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
 }
 const report=compare(before,after);
 if(output)fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({before:report.before,after:report.after,gains:report.gains.length,
  regressions:report.regressions,newUnflaggedErrors:report.newUnflaggedErrors}));
 assert(report.regressionGatePassed,'V2 loses previously correct readings or hides incorrect-read uncertainty');
})().catch(error=>{console.error(error);process.exitCode=1});
