/* Hum to Compose: deterministic regression checks. Node: node hum-to-compose-tests.js
   Browser: open hum-to-compose-regression-tests.html (no microphone requested). */
(function(root){'use strict';
 const C=typeof module==='object'&&module.exports?require('./hum-to-compose-core.js'):root.HumCore;
 const results=[];const assert=(cond,msg)=>{if(!cond)throw Error(msg||'assertion failed')};
 assert.equal=(actual,expected,message)=>assert(actual===expected,message||'Expected '+expected+', got '+actual);
 assert.deepEqual=(actual,expected,message)=>assert(JSON.stringify(actual)===JSON.stringify(expected),message||'Objects differ');
 assert.throws=(fn)=>{let rejected=false;try{fn()}catch(_){rejected=true}assert(rejected,'Expected an error')};
 const near=(a,b,tol=.3)=>assert(a!=null&&Math.abs(a-b)<=tol,'Expected '+b+', got '+a);
 function test(name,fn){try{fn();results.push({name,ok:true})}catch(e){results.push({name,ok:false,error:e.message})}}
 const tone=(hz,amp=.4,harmonic=0,rate=44100)=>{const b=new Float32Array(4096);for(let i=0;i<b.length;i++){const t=i/rate;b[i]=amp*Math.sin(2*Math.PI*hz*t)+harmonic*Math.sin(4*Math.PI*hz*t)}return b};
 const frames=(sections,step=.025)=>{const f=[];let t=0;sections.forEach(([pitch,seconds,rms=.15,confidence=.96,onset=false])=>{for(let i=0;i<Math.round(seconds/step);i++){f.push({t:+t.toFixed(5),pitch,rms,confidence,onset:i===0&&onset});t+=step}});return f};
 function run(){
  results.length=0;
  test('Synthetic pitches A4/C4/G3 and octave',()=>{near(C.estimatePitch(tone(440),44100).midi,69,.2);near(C.estimatePitch(tone(261.6256),44100).midi,60,.2);near(C.estimatePitch(tone(196),44100).midi,55,.3)});
  test('Second harmonics and octave confusion',()=>{near(C.estimatePitch(tone(220,.30,.50),44100).midi,57,.3);near(C.estimatePitch(tone(261.6256,.1,.65),44100).midi,60,.35)});
  test('Natural five-hertz vibrato remains near the central pitch',()=>{let phase=0;const buf=new Float32Array(4096);for(let i=0;i<buf.length;i++){const freq=440+3*Math.sin(2*Math.PI*5*i/44100);phase+=2*Math.PI*freq/44100;buf[i]=.4*Math.sin(phase)}near(C.estimatePitch(buf,44100).midi,69,.5)});
  test('Normal amplitude variation',()=>{near(C.estimatePitch(tone(330,.06,.05),44100).midi,64,.4);near(C.estimatePitch(tone(330,.4,.18),44100).midi,64,.4)});
  test('Silence is not a note',()=>{assert(C.estimatePitch(new Float32Array(4096),44100).midi===null)});
  test('Uncorrelated noise is not a note',()=>{let seed=1234567;const buf=new Float32Array(4096);for(let i=0;i<buf.length;i++){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;buf[i]=seed/2147483648*.18}assert(C.estimatePitch(buf,44100).midi===null)});
  test('Semiquavers remain separate',()=>{const n=C.transcribe(frames([[60,.125],[62,.125],[64,.125]]),120,'4/4');assert(n.filter(x=>x.midi!==null).length===3,JSON.stringify(n));assert(n[0].beats===.25)});
  test('Repeated pitches with separate attacks remain separate',()=>{const n=C.transcribe(frames([[60,.125],[60,.125,.22,.96,true],[60,.125,.21,.96,true]]),120,'4/4');assert(n.filter(x=>x.midi!==null).length===3,JSON.stringify(n))});
  test('Sustained note not fragmented',()=>{const n=C.transcribe(frames([[60,1]]),120,'4/4');assert(n.length===1&&n[0].beats===2,JSON.stringify(n))});
  test('Actual silent pause becomes rest',()=>{const n=C.transcribe(frames([[60,.25],[null,.25,.002,0],[62,.25]]),120,'4/4');assert(n.some(x=>x.midi===null),JSON.stringify(n))});
  test('Short pitch detector dropout is bridged',()=>{const n=C.transcribe(frames([[60,.2],[null,.025,.2,.1],[60,.2]]),120,'4/4');assert(n.length===1,JSON.stringify(n))});
  test('Low confidence remains flagged',()=>{const n=C.transcribe(frames([[60,.25,.15,.58]]),120,'4/4');assert(n[0].uncertain===true&&n[0].confidence<.8)});
  test('Quavers, semiquavers and dotted durations',()=>{for(const n of [.25,.375,.5,.75,1,1.5,2,3,4])assert(C.lengthParts(n)[0]===n,'duration '+n)});
  test('4/4 tie over barline',()=>{const b=C.measures([{midi:60,beats:5}],'4/4');assert(b.length===2&&b[0].at(-1).tieNext&&b[1][0].tiePrev)});
  test('Barline ties do not add additional events',()=>{const n=[{midi:60,beats:9}];const b=C.measures(n,'4/4');assert(b.length===3&&n.length===1);const secs=n.reduce((t,x)=>t+x.beats*C.beatSeconds(96,'4/4'),0);near(secs,5.625,.001)});
  test('Accidental carry, naturals and bar reset',()=>{const b=C.displayAccidentals(C.measures([{midi:61,beats:1},{midi:61,beats:1},{midi:60,beats:1},{midi:61,beats:1},{midi:61,beats:1}],'4/4'));assert(b[0][0].displayAccidental==='♯');assert(b[0][1].displayAccidental===null);assert(b[0][2].displayAccidental==='♮');assert(b[0][3].displayAccidental==='♯');assert(b[1][0].displayAccidental==='♯','barline must reset the sharp')});
  test('Flat enharmonic spelling',()=>{const n=C.changeAccidental({midi:62,beats:1,spelling:{step:1,alter:0,octave:4}},-1);assert(n.midi===61&&n.spelling.alter===-1);assert(C.validateScore({meter:'4/4',tempo:96,notes:[n]}).length===1)});
  test('All four selected time signatures',()=>{for(const [meter,spec] of Object.entries(C.METERS)){const b=C.measures([{midi:60,beats:10}],meter);near(b[0].reduce((s,n)=>s+n.beats,0),spec.beats,.001);assert(b.length>=3)}});
  test('6/8 dotted crotchet tempo',()=>{near(C.beatSeconds(60,'6/8'),2/3,.000001);near(C.beatSeconds(60,'4/4'),1,.000001)});
  test('Calibration estimates natural tempo in 4/4',()=>{
   const voiced=frames([[60,1.25]],.025),notes=[{midi:60,beats:2}];
   near(C.matchRecordedTempo(notes,voiced,'4/4'),96,1);
  });
  test('Calibration uses dotted-beat tempo in 6/8',()=>{
   const voiced=frames([[60,2]],.025),notes=[{midi:60,beats:3}];
   near(C.matchRecordedTempo(notes,voiced,'6/8'),60,1);
  });
  test('Calibration refuses unreliable or absent recordings',()=>{
   assert(C.matchRecordedTempo([{midi:60,beats:1}],[],'4/4')===null);
   assert(C.matchRecordedTempo([{midi:60,beats:1}],frames([[null,1,.002,.1]]),'4/4')===null);
   assert(C.matchRecordedTempo([{midi:60,beats:1}],frames([[60,.1,.1,.3]]),'4/4')===null);
  });
  test('Detected performance retains fractional pitch and measured durations',()=>{
   let raw=frames([[60,.5],[62,.5]],.025);
   raw=raw.map(f=>({...f,rawMidi:f.pitch+.21}));
   const p=C.performanceFromFrames(raw);
   assert(p.length===2,'expected two distinct note events');
   near(p[0].midi,60.21,.001);
   near(p[1].start,.5,.03);
   near(p[0].duration,.5,.03);
   assert(p[0].points.length>=10&&p[0].points.some(x=>x.midi>60),'pitch trace lost');
  });
  test('Detected performance retains natural pauses and separate attacks',()=>{
   const s=frames([[60,.125],[60,.125,.22,.96,true],[null,.15,.002,0],[62,.3]],.025);
   const p=C.performanceFromFrames(s);
   assert(p.filter(x=>x.midi!==null).length===3,JSON.stringify(p.map(x=>[x.midi,x.duration])));
   assert(p.some(x=>x.midi===null&&x.duration>=.125),'pause missing');
  });
  test('Small vibrato stays one note with pitch movement retained',()=>{
   const f=frames([[60,.6]],.025).map((x,i)=>({...x,rawMidi:60+0.3*Math.sin(2*Math.PI*i/11)}));
   const p=C.performanceFromFrames(f);
   assert(p.length===1,'vibrato fragmented into different notes');
   assert(Math.max(...p[0].points.map(x=>x.midi))-Math.min(...p[0].points.map(x=>x.midi))>.5);
  });
  test('Automatic tempo chooses simple pulses at 80, 120 and 150 BPM',()=>{
   for(const [bpm,duration] of [[80,.75],[120,.5],[150,.4]]){
    const events=[0,1,2,3].map(()=>({midi:60,duration}));
    near(C.estimateNaturalTempo(events,'4/4').bpm,bpm,1);
   }
  });
  test('Auto tempo refuses to guess from just one note',()=>{
   assert(C.estimateNaturalTempo([{midi:60,duration:1}],'4/4').bpm===null);
  });
  test('Stable event transcription preserves pitch, pauses, and repeated notes',()=>{
   const performed=[
    {midi:60.18,duration:.5,confidence:.95,points:[{midi:60.18}]},
    {midi:60.11,duration:.5,confidence:.92,points:[{midi:60.11}]},
    {midi:null,duration:.25,confidence:1,points:[]},
    {midi:62.10,duration:.5,confidence:.94,points:[{midi:62.10}]}
   ];
   const score=C.transcribeDetectedEvents(performed,120,'4/4');
   assert(score.length===4,'note count changed '+JSON.stringify(score));
   assert(score[0].midi===60&&score[1].midi===60&&score[2].midi===null&&score[3].midi===62);
   assert(score.map(x=>x.beats).join(',')==='1,1,0.5,1',JSON.stringify(score));
  });
  test('Stable performance notation resists vibrato fragmentation',()=>{
   const input=frames([[60,.5],[62,.5]],.025)
     .map((f,i)=>({...f,rawMidi:f.pitch+.22*Math.sin(i/3)}));
   const stable=C.performanceFromFrames(input);
   const score=C.transcribeDetectedEvents(stable,120,'4/4');
   assert(score.length===2,'unexpected note split '+JSON.stringify(score));
   assert(score.map(x=>x.midi).join(',')==='60,62','wrong pitch');
  });
  test('Uncertain note confidence is preserved in score conversion',()=>{
   const out=C.transcribeDetectedEvents([{midi:60.37,duration:.38,confidence:.58,points:[{midi:60.32},{midi:60.48}]}],120,'4/4');
   assert(out.length===1&&out[0].uncertain&&out[0].confidence===.58);
  });
  test('Stable score supports more than 40 bars',()=>{
   for(const m of ['2/4','3/4','4/4','6/8']){
    const score=C.transcribeDetectedEvents(Array(100).fill(null).map(()=>({midi:60,duration:.5,confidence:1,points:[]})),120,m);
    assert(score.length===100,'truncated score '+m);
    assert(C.measures(score,m)[0].reduce((s,n)=>s+n.beats,0)<=C.METERS[m].beats,'bar '+m);
   }
  });
  test('Basic Pitch adapter aligns notes and inserts actual rests',()=>{
   const p=C.basicPitchToPerformance([
    {startTimeSeconds:.5,durationSeconds:.5,pitchMidi:60,amplitude:.9},
    {startTimeSeconds:1.25,durationSeconds:.5,pitchMidi:62,amplitude:.85}
   ]);
   assert(p.length===3,JSON.stringify(p));
   near(p[0].start,0,.0001);near(p[0].duration,.5,.001);
   assert(p[1].midi===null&&Math.abs(p[1].duration-.25)<.0001,'missing rest');
   assert(p[2].midi===62,'wrong pitch');
  });
  test('Basic Pitch overlapping pitches reduce to one source note',()=>{
   const p=C.basicPitchToPerformance([
    {startTimeSeconds:0,durationSeconds:1,pitchMidi:60,amplitude:.9},
    {startTimeSeconds:.25,durationSeconds:.5,pitchMidi:64,amplitude:.4}
   ]);
   assert(p.length===1&&p[0].midi===60,'polyphonic overlap was not resolved monophonically '+JSON.stringify(p));
  });
  test('Basic Pitch overlapping stronger notes override only their own span',()=>{
   const p=C.basicPitchToPerformance([
    {startTimeSeconds:0,durationSeconds:1,pitchMidi:60,amplitude:.2},
    {startTimeSeconds:.25,durationSeconds:.5,pitchMidi:64,amplitude:.9}
   ]);
   assert(p.map(x=>x.midi).join(',')==='60,64,60',JSON.stringify(p.map(x=>x.midi)));
  });
  test('Basic Pitch separate same-pitch attacks remain separate',()=>{
   const p=C.basicPitchToPerformance([
    {startTimeSeconds:0,durationSeconds:.25,pitchMidi:60,amplitude:.8},
    {startTimeSeconds:.25,durationSeconds:.25,pitchMidi:60,amplitude:.8}
   ]);
   assert(p.length===2&&p[0].midi===p[1].midi,'repeated pitch attack merged');
  });
  test('Basic Pitch adapter rejects invalid events and respects 20-second limit',()=>{
   const p=C.basicPitchToPerformance([
    {startTimeSeconds:0,durationSeconds:1,pitchMidi:12,amplitude:1},
    {startTimeSeconds:0,durationSeconds:1,pitchMidi:60,amplitude:1},
    {startTimeSeconds:19.9,durationSeconds:12,pitchMidi:62,amplitude:1},
    {startTimeSeconds:23,durationSeconds:2,pitchMidi:65,amplitude:1}
   ],20);
   assert(p.filter(x=>x.midi!==null).length===2,'invalid notes remained');
   near(p.at(-1).end,20,.0001);
  });
  test('Basic Pitch score conversion flags ML notes for review',()=>{
   const p=C.basicPitchToPerformance([{startTimeSeconds:0,durationSeconds:.5,pitchMidi:60,amplitude:.95}]);
   const score=C.transcribeDetectedEvents(p,120,'4/4');
   assert(score.length===1&&score[0].midi===60&&score[0].uncertain,'new model notes must be reviewable');
  });
  test('Fast, clear recorded demisemiquavers survive as separate written notes',()=>{
   const bpm=120,beat=C.beatSeconds(bpm,'4/4'),steps=[.125,.125,.125,.125,.5];
   let time=0;const events=steps.map((beats,i)=>{const start=time;time+=beats*beat;
    return {start,end:time,duration:beats*beat,midi:60+i,confidence:.98}});
   assert(C.rhythmGridFromPerformance(events,bpm,'4/4')===.125,'Fast pitches need a finer grid');
   const score=C.transcribeAlignedEvents(events,bpm,'4/4');
   assert(score.length===5,'No recorded attacks may be discarded');
   assert(score.slice(0,4).every(n=>n.beats===.125),'Demisemiquavers were rounded to semiquavers');
   assert(score.every(n=>!n.uncertain),'Perfectly aligned short notes should not be marked erroneous');
   const xml=C.scoreToMusicXML(score,'4/4',bpm);
   assert((xml.match(/<type>32nd<\/type>/g)||[]).length===4,'MusicXML lost short values');
   assert(C.validateScore({meter:'4/4',tempo:bpm,notes:score}).length===5);
  });
  test('Slow expressive timing does not invent demisemiquaver notes',()=>{
   const bpm=96,secs=C.beatSeconds(bpm,'4/4');
   const timings=[0,1.04,2.13,3.18].map(x=>x*secs);
   const events=timings.map((start,i)=>({start,
    end:start+secs*.93,duration:secs*.93,midi:60+i,confidence:.97}));
   assert(C.rhythmGridFromPerformance(events,bpm,'4/4')===.25);
   const notes=C.transcribeAlignedEvents(events,bpm,'4/4');
   assert(notes.filter(n=>n.midi!==null).length===4);
   assert(notes.every(n=>n.beats>=.25));
  });
  test('Performance fit reports uncertainty instead of claiming a time signature',()=>{
   const bpm=120,secs=C.beatSeconds(bpm,'4/4');
   const events=[0,1,2,3].map((beat,i)=>({start:beat*secs,end:(beat+1)*secs,
    duration:secs,midi:60+i,confidence:.97}));
   const exact=C.analyseRhythmFit(events,C.transcribeAlignedEvents(events,bpm,'4/4'),bpm,'4/4');
   assert(exact.available&&exact.quality==='close'&&exact.ms===0);
   const free=events.map((e,i)=>({...e,start:e.start+i*.13,end:e.end+i*.13}));
   const rough=C.analyseRhythmFit(free,C.transcribeAlignedEvents(events,bpm,'4/4'),bpm,'4/4');
   assert(rough.available&&rough.quality==='review-rhythm'&&rough.ms>150);
   const fewer=C.analyseRhythmFit(events,[{midi:60,beats:1}],bpm,'4/4');
   assert(fewer.quality==='review-notes'&&fewer.missing===3);
   assert(!Object.prototype.hasOwnProperty.call(exact,'suggestedMeter'),
    'No evidence of meter may be invented from note timing alone');
  });
  test('Teachers can request detailed or standard transcription without changing pitch',()=>{
   const bpm=120,beat=C.beatSeconds(bpm,'4/4');
   const events=[0,.125,.25].map((b,i)=>({
    start:b*beat,end:(b+.125)*beat,duration:.125*beat,midi:60+i,confidence:.98
   }));
   const fine=C.transcribeAlignedEvents(events,bpm,'4/4',{grid:.125});
   const standard=C.transcribeAlignedEvents(events,bpm,'4/4',{grid:.25});
   assert(fine.length===3&&fine.every(n=>n.beats===.125));
   assert(standard.length===3&&standard.every(n=>n.beats>=.25));
   assert(JSON.stringify(fine.map(x=>x.midi))===JSON.stringify(standard.map(x=>x.midi)));
  });
  test('Aligned transcription avoids cumulative duration-rounding drift',()=>{
   const e=Array.from({length:8},(_,i)=>({start:i*.47,end:(i+1)*.47,duration:.47,midi:60+i%4,confidence:.97}));
   const n=C.transcribeAlignedEvents(e,120,'4/4'),total=n.reduce((a,x)=>a+x.beats,0);
   near(total,Math.round(e.at(-1).end/.5*4)/4,.001);
   assert(n.filter(x=>x.midi!==null).length===8,'lost pitched notes');
  });
  test('Aligned score preserves separate repeated notes and silence',()=>{
   const e=[
    {start:0,end:.25,duration:.25,midi:60,confidence:.96},
    {start:.25,end:.50,duration:.25,midi:60,confidence:.96},
    {start:.50,end:.75,duration:.25,midi:null,confidence:1},
    {start:.75,end:1,duration:.25,midi:62,confidence:.96}
   ];
   const n=C.transcribeAlignedEvents(e,120,'4/4');
   assert(n.map(x=>x.midi).join(',')==='60,60,,62',JSON.stringify(n));
   assert(n.every(x=>x.beats===.5),'durations wrong');
  });
  test('Aligned transcription flags independently corrected pitches',()=>{
   const e=[{start:0,end:.50,duration:.50,midi:64,confidence:.95,qualityStatus:'corrected'}];
   const n=C.transcribeAlignedEvents(e,120,'4/4');
   assert(n.length===1&&n[0].midi===64&&n[0].uncertain,'teacher review missing');
  });
  test('Aligned transcription supports more than 40 bars in every metre',()=>{
   for(const metre of ['2/4','3/4','4/4','6/8']){
    const beat=C.beatSeconds(120,metre),events=Array.from({length:100},(_,i)=>({
     start:i*beat,end:(i+1)*beat,duration:beat,midi:60,confidence:.95
    }));
    const s=C.transcribeAlignedEvents(events,120,metre),sum=s.reduce((n,x)=>n+x.beats,0);
    const expected=100;
     assert(Math.abs(sum-expected)<.001,'unexpected score duration '+metre+' '+sum+' expected '+expected);
    assert(C.auditScore(s,metre).ok,'audit failed '+metre);
    for(const bar of C.measures(s,metre))
     assert(bar.reduce((n,x)=>n+x.beats,0)<=C.METERS[metre].beats+.001,'overfilled bar '+metre);
   }
  });
  test('Full 20-second fast 6/8 performance retains its last note',()=>{
    const metre='6/8',bpm=200,beat=C.beatSeconds(bpm,metre);
    const events=Array.from({length:100},(_,i)=>({
     start:i*beat,end:(i+1)*beat,duration:beat,midi:60+i%7,confidence:.98
    }));
    const score=C.transcribeAlignedEvents(events,bpm,metre);
    assert(score.filter(n=>n.midi!==null).length===100,'Fast 20-second melody lost notes');
    near(score.reduce((s,n)=>s+n.beats,0),100,.001);
    assert(C.auditScore(score,metre).ok,'40-bar audit rejected complete melody');
    assert(C.measures(score,metre).length===34,'Expected 34 6/8 bars');
   });
   test('20-second held note survives engraving, MusicXML and save/reopen',()=>{
    const score=C.transcribe(frames([[60,20]],.025),200,'6/8');
    assert(score.length===1&&score[0].beats===100,'Held pitch was clipped');
    assert(C.measures(score,'6/8').length===34,'Held pitch was clipped in bar splitting');
    assert(C.validateScore({meter:'6/8',tempo:200,notes:score})[0].beats===100,'Saved held pitch cannot reopen');
    const xml=C.scoreToMusicXML(score,'6/8',200);
    assert((xml.match(/<measure /g)||[]).length===34,'MusicXML lost part of the held note');
   });
   test('Auditing permits additional bars without an arbitrary cutoff',()=>{
    for(const [metre,spec] of Object.entries(C.METERS)){
     const full=Array.from({length:40},()=>({midi:60,beats:spec.beats}));
     assert(C.auditScore(full,metre).ok,'Full 40 bars rejected '+metre);
     assert(C.auditScore([...full,{midi:62,beats:.25}],metre).ok,'41st bar rejected '+metre);
     assert(C.measures([...full,{midi:62,beats:.25}],metre).length===41,'Expected 41st bar');
    }
   });
   test('Score audit permits dotted semiquavers and rejects illegal values',()=>{
   assert(C.auditScore([{midi:60,beats:.375}], '4/4').ok,'dotted semiquaver rejected');
   assert(!C.auditScore([{midi:60,beats:.125}], '4/4').ok,'too-short note accepted');
   assert(!C.auditScore([{midi:60,beats:1.1}], '4/4').ok,'invalid beat accepted');
   assert(!C.auditScore([{midi:97,beats:1}], '4/4').ok,'invalid MIDI accepted');
   assert(!C.auditScore([{midi:null,beats:1}], '4/4').ok,'rest-only score accepted');
  });
  test('Rhythm verification flags contradictory event timing',()=>{
   const e=[{start:0,end:.5,duration:.2,midi:60,confidence:.99},
    {start:.5,end:1,duration:.2,midi:62,confidence:.99}];
   const notes=C.transcribeAlignedEvents(e,120,'4/4');
   assert(notes.some(x=>x.uncertain),'contradictory duration/onset must be reviewable');
  });
  test('Automatic score timing calibration corrects a recogniser tempo mismatch',()=>{
   const actualBpm=112,wrongBpm=120,beat=C.beatSeconds(actualBpm,'4/4');
   const pitches=[60,62,64,65,67,69];
   const events=pitches.map((midi,i)=>({
    midi,start:i*beat,end:(i+1)*beat,duration:beat,confidence:.98
   }));
   const before=C.transcribeAlignedEvents(events,wrongBpm,'4/4');
   const cal=C.calibrateScoreTiming(events,'4/4',wrongBpm);
   assert(cal.changed,'A substantial timing mismatch should be corrected');
   assert(Math.abs(cal.bpm-actualBpm)<=2,'Tempo was not calibrated near the recorded rhythm: '+cal.bpm);
   assert(cal.errorAfter<cal.errorBefore*.45,'Playback onset timing remains mismatched');
   assert.deepEqual(cal.score.filter(n=>n.midi!==null).map(n=>n.midi),pitches,
    'Calibration must never transpose or invent pitches');
   assert(before.length>=cal.score.length-1,'Calibration unexpectedly expanded the melody');
  });
  test('6/8 tempo calibration respects dotted-crotchet BPM and keeps exact MIDI',()=>{
   const meter='6/8',actualBpm=80,wrongBpm=92,beat=C.beatSeconds(actualBpm,meter);
   const pitches=[60,60,62,64,65,67,65,64];
   const events=pitches.map((midi,i)=>({
    midi,start:i*beat,end:(i+1)*beat,duration:beat,confidence:.97
   }));
   const cal=C.calibrateScoreTiming(events,meter,wrongBpm);
   assert(cal.changed&&Math.abs(cal.bpm-actualBpm)<=2,'Wrong 6/8 beat-unit calibration '+cal.bpm);
   assert(cal.errorAfter<cal.errorBefore*.5,'6/8 timing error remains');
   assert.deepEqual(cal.score.filter(n=>n.midi!==null).map(n=>n.midi),pitches);
  });
  test('Calibration is conservative for short or already-correct performances',()=>{
   const beat=C.beatSeconds(112,'4/4');
   const good=Array.from({length:6},(_,i)=>({
    midi:60+i,start:i*beat,end:(i+1)*beat,duration:beat,confidence:.95
   }));
   const stable=C.calibrateScoreTiming(good,'4/4',112);
   assert.equal(stable.changed,false,'Correct performance must not be retimed');
   assert.equal(stable.bpm,112);
   const short=C.calibrateScoreTiming(good.slice(0,2),'4/4',120);
   assert.equal(short.changed,false,'Two notes cannot prove tempo');
   assert.equal(short.bpm,120);
   assert.throws(()=>C.calibrateScoreTiming(good,'9/8',120));
  });
  test('Tempo calibration preserves real rests and repeated attacks',()=>{
   const beat=C.beatSeconds(105,'4/4'),events=[
    {midi:60,start:0,end:beat,duration:beat,confidence:.95},
    {midi:null,start:beat,end:2*beat,duration:beat,confidence:1},
    {midi:60,start:2*beat,end:3*beat,duration:beat,confidence:.95},
    {midi:62,start:3*beat,end:4*beat,duration:beat,confidence:.95},
    {midi:64,start:4*beat,end:5*beat,duration:beat,confidence:.95}
   ];
   const cal=C.calibrateScoreTiming(events,'4/4',120);
   assert.deepEqual(cal.score.map(n=>n.midi),[60,null,60,62,64]);
   assert(cal.score.some(n=>n.midi===null),'Silence lost during calibration');
   assert(cal.bpm>=94&&cal.bpm<=120,'Surprising half/double time tempo');
  });
  test('Detected-performance tempo fitting works after importing audio',()=>{
   const score=[{midi:60,beats:1},{midi:62,beats:1}];
   const events=[{start:0,end:.5,duration:.5,midi:60},{start:.5,end:1,duration:.5,midi:62}];
   assert(C.matchPerformanceTempo(score,events,'4/4')===120,'4/4 fit');
   assert(C.matchPerformanceTempo(score,events,'6/8')===80,'6/8 dotted crotchet fit');
   assert(C.matchPerformanceTempo(score,events.slice(0,1),'4/4')===null,'one note should not set tempo');
  });
  test('Tempo fitter rejects invalid metre and out-of-range BPM',()=>{
   assert(C.matchPerformanceTempo([{midi:60,beats:2}],[{start:0,end:.05,midi:60},{start:.05,end:.1,midi:62}],'4/4')===null);
   assert(C.matchPerformanceTempo([{midi:60,beats:1},{midi:62,beats:1}],[{start:0,end:.5,midi:60},{start:.5,end:1,midi:62}],'9/9')===null);
  });
  test('Whole-measure rests engrave as semibreve rest in every metre',()=>{
   for(const metre of ['2/4','3/4','4/4','6/8']){
    const total=C.METERS[metre].beats,bar=C.measures([{midi:null,beats:total}],metre)[0];
    assert(bar.length===1&&bar[0].midi===null&&bar[0].fullMeasureRest===true,
     metre+' full bar rest missing');
    assert(bar[0].beats===total,'full-bar rest must keep its original duration');
   }
   const partial=C.measures([{midi:null,beats:2}],'3/4')[0][0];
   assert(!partial.fullMeasureRest,'incomplete bar wrongly received full-bar rest');
  });
  test('A tied sharp across the barline does not alter a following untied sharp',()=>{
   const bars=C.displayAccidentals(C.measures([
    {midi:61,beats:4.5},{midi:61,beats:1}
   ],'4/4'));
   assert(bars[0][0].displayAccidental==='♯','first C sharp missing');
   assert(bars[1][0].tiePrev&&!bars[1][0].displayAccidental,'tied accidental repeated');
   assert(bars[1][1].displayAccidental==='♯','next untied C sharp MUST display a new sharp');
  });
  test('Following natural after a tied sharp needs no redundant natural',()=>{
   const bars=C.displayAccidentals(C.measures([
    {midi:61,beats:4.5},{midi:60,beats:1}
   ],'4/4'));
   assert(bars[1][0].tiePrev&&!bars[1][0].displayAccidental,'tied sharp sign repeated');
   assert(!bars[1][1].displayAccidental,'natural after barline already default');
  });
  test('A tied flat uses correct accidental scope in the next bar',()=>{
   const flat={midi:61,beats:4.5,spelling:C.spelling(61,true)};
   const repeat={midi:61,beats:1,spelling:C.spelling(61,true)};
   const bars=C.displayAccidentals(C.measures([flat,repeat],'4/4'));
   assert(bars[0][0].displayAccidental==='♭','flat missing');
   assert(bars[1][0].tiePrev&&bars[1][0].displayAccidental===null,'tied flat repeated');
   assert(bars[1][1].displayAccidental==='♭','untied flat omitted');
  });
  test('Within-bar ties do not repeat accidentals or change note duration',()=>{
   const bars=C.displayAccidentals(C.measures([{midi:61,beats:2.5}],'4/4'));
   assert(bars[0].length===2,'2.5 beats expected a minim tied to a quaver');
   assert(bars[0][0].displayAccidental==='♯'&&bars[0][1].displayAccidental===null);
   assert(bars[0][0].tieNext&&bars[0][1].tiePrev);
   near(bars[0].reduce((sum,x)=>sum+x.beats,0),2.5,.0001);
  });
  test('Key signatures have the standard sharp and flat order',()=>{
   assert(JSON.stringify(C.keyDefaults(2))===JSON.stringify([1,0,0,1,0,0,0]));
   assert(JSON.stringify(C.keyDefaults(-2))===JSON.stringify([0,0,-1,0,0,0,-1]));
   let bad=false;try{C.keyDefaults(8)}catch(_){bad=true}assert(bad);
  });
  test('Key G major omits F sharp, but displays F natural and return sharp',()=>{
   const b=C.displayAccidentals(C.measures([{midi:66,beats:1},{midi:65,beats:1},
    {midi:66,beats:1}],'4/4'),1)[0];
   assert(b[0].displayAccidental===null&&b[1].displayAccidental==='♮'&&
    b[2].displayAccidental==='♯');
  });
  test('B flat key spells B-flat, not A-sharp, with implicit signature',()=>{
   const b=C.displayAccidentals(C.measures([{midi:70,beats:1},{midi:71,beats:1}],
    '4/4'),-2)[0];
   assert(b[0].spelling.step===6&&b[0].spelling.alter===-1&&
    b[0].displayAccidental===null&&b[1].displayAccidental==='♮');
  });
  test('MusicXML exports crotchets, quavers, dotted notes and rests',()=>{
   const xml=C.scoreToMusicXML([{midi:60,beats:1},{midi:null,beats:.5},
    {midi:62,beats:1.5},{midi:64,beats:1}],'4/4',120);
   assert(xml.includes('<score-partwise version="4.0">'));
   assert(xml.includes('<rest/><duration>240</duration><type>eighth</type>'));
   assert(xml.includes('<duration>720</duration><type>quarter</type><dot/>'));
   assert(xml.includes('<clef><sign>G</sign><line>2</line></clef>'));
  });
  test('MusicXML exports bass clef, 6/8 and dotted-crotchet pulse',()=>{
   const xml=C.scoreToMusicXML([{midi:43,beats:1.5},{midi:45,beats:1.5}],
    '6/8',96,{clef:'bass',fifths:-1});
   assert(xml.includes('<time><beats>6</beats><beat-type>8</beat-type></time>'));
   assert(xml.includes('<key><fifths>-1</fifths>'));
   assert(xml.includes('<clef><sign>F</sign><line>4</line></clef>'));
   assert(xml.includes('<beat-unit-dot/><per-minute>96</per-minute>'));
  });
  test('MusicXML exports two directions of tie across barlines',()=>{
   const xml=C.scoreToMusicXML([{midi:61,beats:4.5},{midi:61,beats:1}],'4/4',96);
   assert(xml.includes('<tie type="start"/>')&&xml.includes('<tie type="stop"/>'));
   assert(xml.includes('<tied type="start"/>')&&xml.includes('<tied type="stop"/>'));
   const bar2=xml.split('<measure implicit="no" number="2">')[1];
   assert(bar2.includes('<accidental>sharp</accidental>'));
  });
  test('MusicXML represents whole-measure rest in 3/4',()=>{
   const xml=C.scoreToMusicXML([{midi:60,beats:3},{midi:null,beats:3}],
    '3/4',96);
   assert(xml.includes('<rest measure="yes"/><duration>1440</duration><type>whole</type>'));
  });
  test('MusicXML escapes untrusted work titles',()=>{
   const xml=C.scoreToMusicXML([{midi:60,beats:1}],'2/4',96,{title:'A & <B> "Song"'});
   assert(xml.includes('A &amp; &lt;B&gt; &quot;Song&quot;'));
   assert(!xml.includes('<B>'));
  });
  test('All fifteen key signatures preserve the sound of every note',()=>{
   for(let key=-7;key<=7;key++)for(let midi=36;midi<=95;midi++){
    const sp=C.spellingForKey(midi,key);
    assert(C.midiFromSpelling(sp)===midi,'Changed pitch '+midi+' in '+key);
    assert(Math.abs(sp.alter)<=1,'Unusual unsupported accidental');
    const [eng]=C.displayAccidentals(C.measures([{midi,beats:1}],'4/4'),key)[0];
    assert(C.midiFromSpelling(eng.spelling)===midi,'Engraving pitch changed');
   }
  });
  test('Flat signatures prefer B-flat and avoid unnecessary sharp signs',()=>{
   for(const key of [-2,-3,-4,-5,-6,-7]){
    const sp=C.spellingForKey(70,key);
    assert(sp.step===6&&sp.alter===-1,'Expected B flat in '+key);
    const n=C.displayAccidentals(C.measures([{midi:70,beats:1}],'4/4'),key)[0][0];
    assert(!n.displayAccidental,'B-flat key signature must cover this note '+key);
   }
  });
  test('Extreme key spellings C-flat and B-sharp survive export',()=>{
   const cb=C.scoreToMusicXML([{midi:71,beats:1}],'4/4',96,{fifths:-7,clef:'treble'});
   const bs=C.scoreToMusicXML([{midi:72,beats:1}],'4/4',96,{fifths:7,clef:'treble'});
   assert(cb.includes('<step>C</step><alter>-1</alter><octave>5</octave>'),
    'Expected C-flat 5 rather than B4 in C-flat major');
   assert(bs.includes('<step>B</step><alter>1</alter><octave>4</octave>'),
    'Expected B-sharp 4 rather than C5 in C-sharp major');
  });
  test('Explicit teacher spelling is never overridden by chosen key',()=>{
   const teacher={midi:70,beats:1,spelling:{step:5,alter:1,octave:4}};
   const displayed=C.displayAccidentals(C.measures([teacher],'4/4'),-2)[0][0];
   assert(displayed.spelling.step===5&&displayed.spelling.alter===1);
   const xml=C.scoreToMusicXML([teacher],'4/4',96,{fifths:-2});
   assert(xml.includes('<step>A</step><alter>1</alter><octave>4</octave>'));
  });
  test('Extreme staff pitches use standard octave displacement without changing MIDI',()=>{
   const high={midi:71,beats:1},veryHigh={midi:95,beats:1},low={midi:43,beats:1};
   assert(C.engravingOctaveShift(high,'bass')===-1,'B4 in bass should use 8va');
   assert(C.engravingOctaveShift(high,'treble')===0,'B4 in treble should remain ordinary');
   assert(C.engravingOctaveShift(veryHigh,'bass')===-2,'B6 should use 15ma');
   assert(C.engravingOctaveShift(low,'treble')===1,'G2 in treble should use 8vb');
   assert(C.engravingOctaveShift(low,'bass')===0,'G2 in bass needs no shift');
   assert(C.validateScore({meter:'4/4',tempo:96,notes:[high,low]})[0].midi===71);
  });
  test('MusicXML octave shifts preserve exact sounding pitches',()=>{
   const b4=C.scoreToMusicXML([{midi:71,beats:1},{midi:60,beats:1}],'4/4',96,{clef:'bass'});
   assert(b4.includes('<octave-shift type="down" number="1" size="8"/>'));
   assert(b4.includes('<octave-shift type="stop" number="1" size="8"/>'));
   assert(b4.includes('<step>B</step><octave>4</octave>'),'B4 sounding pitch changed');
   const g2=C.scoreToMusicXML([{midi:43,beats:1}],'4/4',96,{clef:'treble'});
   assert(g2.includes('<octave-shift type="up" number="1" size="8"/>'));
   assert(g2.includes('<step>G</step><octave>2</octave>'),'G2 sounding pitch changed');
  });
  test('Accidentals track written octave when 8va is active',()=>{
   const input=[{midi:73,beats:1},{midi:61,beats:1},{midi:73,beats:1}];
   const staff=C.displayAccidentals(C.measures(input,'4/4'),0,'bass')[0];
   assert(staff[0].displayAccidental==='♯','C-sharp requires written accidental');
   assert(staff[1].displayAccidental===null,'Repeated written C-sharp 4 must not repeat sharp');
   assert(staff[2].displayAccidental===null,'8va note should share the displayed accidental');
  });
  test('Ten-minute 6/8 transcription at 200 BPM keeps 1,000 bars',()=>{
   const metre='6/8',bpm=200,beat=C.beatSeconds(bpm,metre);
   const events=Array.from({length:3000},(_,i)=>({
    start:i*beat,end:(i+1)*beat,duration:beat,midi:60+i%8,confidence:.96
   }));
   const score=C.transcribeAlignedEvents(events,bpm,metre);
   assert(score.length===3000,'Truncated long 10-minute transcription');
   const bars=C.measures(score,metre);
   assert(bars.length===1000,'Expected 1,000 bars, got '+bars.length);
   assert(C.validateScore({meter:metre,tempo:bpm,notes:score}).length===3000);
   const xml=C.scoreToMusicXML(score,metre,bpm);
   assert((xml.match(/<measure /g)||[]).length===1000,'MusicXML dropped later bars');
   assert(xml.includes('<measure implicit="no" number="1000">'),'Final bar missing');
  });
  test('Long score notation rejects non-finite or excessive note lengths',()=>{
   for(const beats of [Infinity,NaN,12001]){
    let rejected=false;try{C.measures([{midi:60,beats}],'4/4')}catch(_){rejected=true}
    assert(rejected,'Invalid length must not create an infinite loop');
   }
  });
  test('Reject corrupt saved score',()=>{let bad=false;try{C.validateScore({meter:'9/9',tempo:96,notes:[]})}catch(_){bad=true}assert(bad)});
  test('Saved score retained pitch and review metadata',()=>{const n={midi:61,beats:.75,confidence:.55,uncertain:true,reviewed:false};const [c]=C.validateScore({meter:'6/8',tempo:96,notes:[n]});assert(c.midi===61&&c.beats===.75&&c.uncertain)});
  return results.slice();
 }
 root.runHumTests=run;
 if(typeof module==='object'&&module.exports){const r=run();r.forEach(t=>console.log((t.ok?'PASS ':'FAIL ')+t.name+(t.error?': '+t.error:'')));const fail=r.filter(x=>!x.ok);console.log((r.length-fail.length)+'/'+r.length+' passed');if(fail.length)process.exitCode=1;}
})(typeof globalThis!=='undefined'?globalThis:this);