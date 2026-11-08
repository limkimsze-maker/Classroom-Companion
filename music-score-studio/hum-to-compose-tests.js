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
  test('Reject corrupt saved score',()=>{let bad=false;try{C.validateScore({meter:'9/9',tempo:96,notes:[]})}catch(_){bad=true}assert(bad)});
  test('Saved score retained pitch and review metadata',()=>{const n={midi:61,beats:.75,confidence:.55,uncertain:true,reviewed:false};const [c]=C.validateScore({meter:'6/8',tempo:96,notes:[n]});assert(c.midi===61&&c.beats===.75&&c.uncertain)});
  return results.slice();
 }
 root.runHumTests=run;
 if(typeof module==='object'&&module.exports){const r=run();r.forEach(t=>console.log((t.ok?'PASS ':'FAIL ')+t.name+(t.error?': '+t.error:'')));const fail=r.filter(x=>!x.ok);console.log((r.length-fail.length)+'/'+r.length+' passed');if(fail.length)process.exitCode=1;}
})(typeof globalThis!=='undefined'?globalThis:this);