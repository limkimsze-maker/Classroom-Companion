/* Hum to Compose: deterministic regression checks. Node: node hum-to-compose-tests.js
   Browser: open hum-to-compose-regression-tests.html (no microphone requested). */
(function(root){'use strict';
 const C=typeof module==='object'&&module.exports?require('./hum-to-compose-core.js'):root.HumCore;
 const results=[];const assert=(cond,msg)=>{if(!cond)throw Error(msg||'assertion failed')};
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
  test('Stable score respects metre and 64-beat cap',()=>{
   for(const m of ['2/4','3/4','4/4','6/8']){
    const score=C.transcribeDetectedEvents(Array(100).fill(null).map(()=>({midi:60,duration:.5,confidence:1,points:[]})),120,m);
    assert(score.reduce((s,n)=>s+n.beats,0)<=64.001,'cap '+m);
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
  test('Aligned transcription handles 6/8 and a 64-beat cap',()=>{
   for(const metre of ['2/4','3/4','4/4','6/8']){
    const beat=C.beatSeconds(120,metre),events=Array.from({length:100},(_,i)=>({
     start:i*beat,end:(i+1)*beat,duration:beat,midi:60,confidence:.95
    }));
    const s=C.transcribeAlignedEvents(events,120,metre),sum=s.reduce((n,x)=>n+x.beats,0);
    assert(sum<=64.001&&sum>=63.75,'wrong cap '+metre+' '+sum);
    assert(C.auditScore(s,metre).ok,'audit failed '+metre);
    for(const bar of C.measures(s,metre))
     assert(bar.reduce((n,x)=>n+x.beats,0)<=C.METERS[metre].beats+.001,'overfilled bar '+metre);
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
  test('Reject corrupt saved score',()=>{let bad=false;try{C.validateScore({meter:'9/9',tempo:96,notes:[]})}catch(_){bad=true}assert(bad)});
  test('Saved score retained pitch and review metadata',()=>{const n={midi:61,beats:.75,confidence:.55,uncertain:true,reviewed:false};const [c]=C.validateScore({meter:'6/8',tempo:96,notes:[n]});assert(c.midi===61&&c.beats===.75&&c.uncertain)});
  return results.slice();
 }
 root.runHumTests=run;
 if(typeof module==='object'&&module.exports){const r=run();r.forEach(t=>console.log((t.ok?'PASS ':'FAIL ')+t.name+(t.error?': '+t.error:'')));const fail=r.filter(x=>!x.ok);console.log((r.length-fail.length)+'/'+r.length+' passed');if(fail.length)process.exitCode=1;}
})(typeof globalThis!=='undefined'?globalThis:this);