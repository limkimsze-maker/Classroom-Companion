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
// An accurate metric must penalise duplicate, invented and missed notes.
const example=[{start:0,end:.4,midi:60},{start:.4,end:.8,midi:62}];
const duplicated=benchmark.scoreMelody(example,[example[0],example[0],example[1]]);
assert.equal(duplicated.truePositive,2);
assert.equal(duplicated.falsePositive,1);
assert.equal(duplicated.falseNegative,0);
assert.ok(duplicated.precision<1&&duplicated.recall===1);
const missing=benchmark.scoreMelody(example,[example[0]]);
assert.equal(missing.falseNegative,1);
const wrongPitch=benchmark.scoreMelody([example[0]],[{...example[0],midi:61}]);
assert.equal(wrongPitch.falseNegative,1);
assert.equal(wrongPitch.falsePositive,1);
const m=benchmark.run(core,adapter);
console.log(m.description);
console.log(JSON.stringify({
 cases:m.cases,knownNotes:m.pitchedNotes,notesCorrect:m.matchedPitch,
 pitchAccuracyPct:+(100*m.pitchAccuracy).toFixed(2),
 corruptedCases:m.correctionAttempts,fullyRecovered:m.fullyRecovered,
 recoveredPct:+(100*m.recoveryRate).toFixed(2),
 cleanCases:m.cleanCases,cleanCasesUnchanged:m.cleanUntouched,
 falseShifts:m.falseShifts,restDetectionPct:+(100*m.restRecall).toFixed(2),
 meanOnsetErrorMs:+(m.meanOnsetErrorSeconds*1000).toFixed(1),
 notePrecisionPct:+(m.notePrecision*100).toFixed(2),
 noteRecallPct:+(m.noteRecall*100).toFixed(2),
 noteF1Pct:+(m.noteF1*100).toFixed(2),
 trueNotes:m.truePositive,extraOrWrongNotes:m.falsePositive,missedOrWrongNotes:m.falseNegative
},null,2));
const remaining=m.rows.filter(x=>x.correct!==x.expected);
if(remaining.length)console.log('Remaining doubtful cases (teacher review needed):',remaining.map(x=>x.name).join(', '));
assert.ok(m.cases>=70,'Benchmark should include at least seventy varied cases');
assert.ok(m.pitchAccuracy>=.95,'Synthetic pitch accuracy below 95%');
assert.ok(m.restRecall>=.95,'Synthetic rest detection below 95%');
assert.ok(m.cleanUntouched===m.cleanCases,'Clean notes changed unexpectedly');
assert.equal(m.falseShifts,0,'Unsafe pitch changes on correct inputs');
assert.ok(m.meanOnsetErrorSeconds<=.09,'Synthetic note timing regression');
assert.equal(m.truePositive+m.falseNegative,m.pitchedNotes,'Every expected note must be accounted for');
assert.ok(m.falsePositive>=0&&m.falseNegative>=0,'Invalid false-note counters');
assert.ok(m.noteF1>=.94,'One-to-one F1 score below baseline');

console.log('PASS: quantified synthetic verification checks');
