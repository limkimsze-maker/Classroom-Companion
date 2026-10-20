'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const tests=[
 'test-math-structure-regression','test-square-root-real-teacher-ink',
 'test-natural-operator-geometry','test-stacked-fraction-structure','test-priority5-audit',
 'test-unit-components','test-unit-first-exponent','test-unit-first-exponent-zero',
 'test-authoritative-m2m3','test-raised-three-reconcile','test-equation-units',
 'test-handwriting-context-review','test-handwriting-reader-recovery','test-handwriting-words',
 'test-priority4-consensus','test-measurement-consensus','test-detached-four-grouping',
 'test-crossed-seven-grouping','test-powered-component-priority',
 'test-recognition-learning-priority','test-recognition-engine-trace',
 'test-teacher-confusables','test-teacher-units-override','test-raised-measurement-structural',
 'test-raised-two-geometry','test-raised-three-contour'
];
const records=[];
for(const test of tests){
 const start=performance.now();
 const result=spawnSync(process.execPath,['-r',path.join(__dirname,'preload.cjs'),`scripts/${test}.cjs`],
  {cwd:root,encoding:'utf8',timeout:180000});
 const row={test,pass:result.status===0,exitCode:result.status,ms:Math.round(performance.now()-start),
  stdout:result.stdout,stderr:result.stderr,error:result.error?.message};
 if(!row.pass){
  const baseline=spawnSync(process.execPath,[`scripts/${test}.cjs`],{cwd:root,encoding:'utf8',timeout:180000});
  row.baseline={pass:baseline.status===0,exitCode:baseline.status,stdout:baseline.stdout,stderr:baseline.stderr,error:baseline.error?.message};
  // Preserve the failure and its logs; do not count it as a passing test.
  row.inheritedFailure=baseline.status!==0&&result.status===baseline.status&&result.stderr===baseline.stderr;
 }
 records.push(row);console.log(row.pass?'PASS':row.inheritedFailure?'EXISTING BASELINE FAILURE':'NEW FAILURE',test);
}
const report={candidate:crypto.createHash('sha256').update(require('./candidate.cjs').build()).digest('hex'),
 protectedV1Sha256:require('./candidate.cjs').protectedSha256,total:records.length,
 passed:records.filter(r=>r.pass).length,inheritedFailures:records.filter(r=>r.inheritedFailure).length,
 newFailures:records.filter(r=>!r.pass&&!r.inheritedFailure).length,
 integrationBlocked:records.some(r=>!r.pass),records};
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');
if(report.newFailures)process.exitCode=1;
