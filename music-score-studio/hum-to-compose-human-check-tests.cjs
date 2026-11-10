/* Human humming vs teacher reference score: offline scoring regression tests.
 * These are NOT human voice recordings; human accuracy must be measured from
 * consented real input in the browser test tool. AGPL-3.0. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('./hum-to-compose-core.js'),H=require('./hum-to-compose-human-check.js');
let count=0;
function test(name,fn){try{fn();console.log('PASS '+name);count++}catch(e){process.exitCode=1;console.error('FAIL '+name+': '+e.message)}}
const reference={
 format:'music-score-studio-hum-test-v2',name:'Reference melody',
 meter:'4/4',tempo:120,
 notes:[{midi:60,beats:1},{midi:null,beats:.5},{midi:62,beats:1},{midi:64,beats:1}]
};
const expected=H.referenceEvents(reference,C);
const events=expected.map(n=>({...n}));
test('Reference uses British score beat times and retains a sung pause',()=>{
 assert.equal(expected.length,3);
 assert.deepEqual(expected.map(n=>n.midi),[60,62,64]);
 assert.ok(Math.abs(expected[0].end-.5)<.001);
 assert.ok(Math.abs(expected[1].start-.75)<.001);
 assert.ok(Math.abs(expected[2].start-1.25)<.001);
});
test('Exact pitch sequence obtains 100% without invented notes',()=>{
 const result=H.compare(expected,events);
 assert.equal(result.accuracy,1);
 assert.deepEqual([result.matched,result.incorrect,result.missing,result.extra],[3,0,0,0]);
 assert.equal(result.likelyShift,null);
});
test('Voice an octave too high is identified, not silently called correct',()=>{
 const result=H.compare(expected,events.map(n=>({...n,midi:n.midi+12})));
 assert.equal(result.accuracy,0);assert.equal(result.incorrect,3);
 assert.equal(result.octaveErrors,3);assert.equal(result.likelyShift,12);
});
test('A wrong middle pitch is counted as a substitution',()=>{
 const changed=events.map((n,i)=>({...n,midi:i===1?63:n.midi}));
 const result=H.compare(expected,changed);
 assert.equal(result.matched,2);assert.equal(result.incorrect,1);
 assert.equal(result.missing,0);assert.equal(result.extra,0);
});
test('Missing and duplicated notes are not counted as correct',()=>{
 const missing=H.compare(expected,[events[0],events[2]]);
 assert.equal(missing.matched,2);assert.equal(missing.missing,1);
 const extra=H.compare(expected,[events[0],events[1],events[1],events[2]]);
 assert.equal(extra.matched,3);assert.equal(extra.extra,1);
});
test('A different recording speed does not falsely turn correct pitches into wrong notes',()=>{
 const slower=events.map(n=>({...n,start:n.start*1.2,end:n.end*1.2}));
 assert.equal(H.compare(expected,slower).accuracy,1);
});
test('6/8 dotted-crotchet BPM generates correct seconds',()=>{
 const six=H.referenceEvents({meter:'6/8',tempo:80,notes:[{midi:60,beats:1.5},{midi:62,beats:.5}]},C);
 assert.ok(Math.abs(six[0].end-.75)<.001);
 assert.ok(Math.abs(six[1].start-.75)<.001);
});
test('Invalid references, excessive length and oversized comparisons are refused',()=>{
 assert.throws(()=>H.referenceEvents({meter:'4/4',tempo:120,notes:[{midi:60,beats:1}]},C),/two notes/);
 assert.throws(()=>H.referenceEvents({meter:'4/4',tempo:40,
   notes:Array.from({length:90},()=>({midi:60,beats:1}))},C),/2 minutes/);
 assert.throws(()=>H.compare(expected,Array.from({length:351},()=>({midi:60,start:0,end:.1}))),/2–350/);
});
test('Browser page contains local input controls and real-model route',()=>{
 const page=fs.readFileSync(path.join(__dirname,'hum-to-compose-benchmark.html'),'utf8');
 const block=page.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];
 assert.ok(block);assert.doesNotThrow(()=>new Function(block));
 for(const id of ['humanAudio','humanScore','runHuman','humanResult'])assert.ok(page.includes('id="'+id+'"'));
 assert.ok(page.includes("adapter.recognise(audio"),'Human test must run actual Spotify model');
 assert.ok(page.includes('window.HumHumanCheck.compare(reference,found)'));
 assert.ok(page.includes('No voice recording or score was stored or sent'));
});
console.log(count+' human humming comparison and page checks passed');
if(process.exitCode)process.exit(1);
