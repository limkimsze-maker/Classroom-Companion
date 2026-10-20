'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {run}=require('../../scripts/benchmark-handwriting-simulations.cjs');
const hash=source=>crypto.createHash('sha256').update(source).digest('hex');
(async()=>{
 const [previousReader,latestRecords,output]=process.argv.slice(2);
 assert(previousReader&&latestRecords&&output,'Provide previous reader, current benchmark records and output');
 const beforeSource=fs.readFileSync(previousReader),currentSource=fs.readFileSync(path.join(__dirname,'reader-v2.js'));
 assert.equal(hash(beforeSource),'2926ba0b76208ec33bdd04562a7d0edc5389a492027bfb54a12fa3bfd9c43c5d','Use the exact previously published V2 reader');
 const before=await run({split:'all',readerPath:path.resolve(previousReader),progress:r=>console.log('Previous V2',r.done,r.correct)});
 const after=JSON.parse(fs.readFileSync(latestRecords));assert.equal(after.readerSha256,hash(currentSource));
 assert.equal(before.records.length,924);assert.equal(after.records.length,924);
 const old=new Map(before.records.map(r=>[r.id,r]));assert.equal(old.size,924);
 const regressions=[],hidden=[];
 for(const r of after.records){const b=old.get(r.id);assert(b);for(const key of ['expected','writer','partition','category'])assert.equal(r[key],b[key]);if(b.correct&&!r.correct)regressions.push(r.id);if(b.flagged&&!r.flagged&&!r.correct)hidden.push(r.id);}
 const report={before:before.summary,after:after.summary,regressions,newlyHiddenErrors:hidden,beforeSha256:hash(beforeSource),afterSha256:hash(currentSource),limitation:'Identical correlated simulations; no unfamiliar-writer accuracy claim.'};
 fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));assert.equal(regressions.length,0);assert.equal(hidden.length,0);
})().catch(e=>{console.error(e);process.exitCode=1});
