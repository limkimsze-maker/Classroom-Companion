/* Hum to Compose benchmark CI. Quantitative synthetic verification only.
 * IMPORTANT: this DOES NOT run Spotify Basic Pitch inference or prove
 * performance on recordings of real people.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const core=require('./hum-to-compose-core.js'),benchmark=require('./hum-to-compose-benchmark.js');
const source=fs.readFileSync(path.join(__dirname,'hum-to-compose-basic-pitch-adapter.js'),'utf8');
const adapter=new Function(source.replace(/\bexport (const|function|async function)\b/g,'$1')+
 '\nreturn {verifyPerformance,toSingleMelody};')();
const m=benchmark.run(core,adapter);
console.log(m.description);
console.log(JSON.stringify({
 cases:m.cases,knownNotes:m.pitchedNotes,notesCorrect:m.matchedPitch,
 pitchAccuracyPct:+(100*m.pitchAccuracy).toFixed(2),
 corruptedCases:m.correctionAttempts,fullyRecovered:m.fullyRecovered,
 recoveredPct:+(100*m.recoveryRate).toFixed(2),
 cleanCases:m.cleanCases,cleanCasesUnchanged:m.cleanUntouched,
 falseShifts:m.falseShifts,restDetectionPct:+(100*m.restRecall).toFixed(2),
 meanOnsetErrorMs:+(m.meanOnsetErrorSeconds*1000).toFixed(1)
},null,2));
const remaining=m.rows.filter(x=>x.correct!==x.expected);
if(remaining.length)console.log('Remaining doubtful cases (teacher review needed):',remaining.map(x=>x.name).join(', '));
assert.ok(m.cases>=70,'Benchmark should include at least seventy varied cases');
assert.ok(m.pitchAccuracy>=.95,'Synthetic pitch accuracy below 95%');
assert.ok(m.restRecall>=.95,'Synthetic rest detection below 95%');
assert.ok(m.cleanUntouched===m.cleanCases,'Clean notes changed unexpectedly');
assert.equal(m.falseShifts,0,'Unsafe pitch changes on correct inputs');
assert.ok(m.meanOnsetErrorSeconds<=.09,'Synthetic note timing regression');
console.log('PASS: quantified synthetic verification checks');
