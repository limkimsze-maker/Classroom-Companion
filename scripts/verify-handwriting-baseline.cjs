/* Reject lost cases even when other gains compensate in the aggregate score. */
const fs=require('node:fs'),assert=require('node:assert/strict');
const baseline=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const current=JSON.parse(fs.readFileSync(process.argv[3],'utf8'));
const rows=new Map(current.records.map(r=>[r.id,r]));
assert.equal(rows.size,current.records.length,'candidate IDs must be unique');
assert.equal(rows.size,baseline.cases.length,'the frozen case set must stay unchanged');
const regressions=[],gains=[];
for(const [id,correct] of baseline.cases){
 assert(rows.has(id),`missing frozen case: ${id}`);
 if(correct&&!rows.get(id).correct)regressions.push(id);
 if(!correct&&rows.get(id).correct)gains.push(id);
}
console.log('FROZEN_BASELINE_COMPARISON',JSON.stringify({baseline:baseline.commit,
 before:baseline.cases.filter(([,correct])=>correct).length,after:current.records.filter(r=>r.correct).length,
 total:rows.size,gains,regressions}));
assert.equal(regressions.length,0,'previously correct readings must not regress');
