/* Independent synthetic audio regression suite for Hum to Compose TEST.
   Uses only original generated waveforms; no audio assets or model downloads.
   These tests do NOT prove accuracy on real human humming. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const C=require('./hum-to-compose-core.js');
const adapterSource=fs.readFileSync(path.join(__dirname,'hum-to-compose-basic-pitch-adapter.js'),'utf8');
const adapter=new Function(adapterSource.replace(/\bexport (const|function|async function)\b/g,'$1')+
 '\nreturn {verifyPerformance,verifyOctaves,toSingleMelody,resampleMono,recordingWindows,canJoinWindowNotes};')();
const RATE=22050,SAMPLES=RATE*2;
let passed=0;
function test(name,fn){try{fn();console.log('PASS '+name);passed++}catch(e){console.error('FAIL '+name+': '+e.message);process.exitCode=1}}
function waveform(segments){
 const pcm=new Float32Array(SAMPLES);
 for(const p of segments){
  const freq=440*Math.pow(2,(p.midi-69)/12),parts=p.harmonics||[1];
  const total=parts.reduce((a,b)=>a+b,0);
  for(let i=Math.floor(p.start*RATE);i<Math.ceil(p.end*RATE)&&i<SAMPLES;i++){
   const t=i/RATE;
   if(t<p.start||t>p.end)continue;
   const attack=Math.max(0,Math.min(1,(t-p.start)/.025,(p.end-t)/.025));
   let signal=0;
   for(let k=0;k<parts.length;k++)signal+=parts[k]*Math.sin(2*Math.PI*freq*(k+1)*t);
   pcm[i]+=.35*attack*signal/total;
  }
 }
 return pcm;
}
const note=(pitch,start=.2,end=1.1,amplitude=.95)=>({
 pitchMidi:pitch,startTimeSeconds:start,durationSeconds:end-start,amplitude
});
const verify=(model,p)=>adapter.verifyPerformance(model,waveform(p),RATE,C.estimatePitch);
for(const midi of [48,52,55,57,60,62,64,67,69,72,76,79]){
 test('Correct pitch retained MIDI '+midi,()=>{
  const r=verify([note(midi)],[{midi,start:.2,end:1.1}]);
  assert.equal(r.notes[0].pitchMidi,midi);
  assert.equal(r.summary.pitchCorrected+r.summary.octavesCorrected,0);
 });
 for(const [label,error] of [['semitone',-1],['whole tone',-2],['octave below',-12],['octave above',12]]){
  if(midi+error<36||midi+error>95)continue;
  test('Correct '+label+' for sung MIDI '+midi,()=>{
   const r=verify([note(midi+error)],[{midi,start:.2,end:1.1}]);
   assert.equal(r.notes[0].pitchMidi,midi);
  });
 }
 for(const [label,harmonics] of [
  ['normal',[1,.3,.12]],['rich',[.45,1,.3]],
  ['weak fundamental',[.06,1,.3]],['dominant upper harmonics',[.02,1,.8]]
 ]){
  test('Do not shift true MIDI '+midi+' with '+label,()=>{
   const r=verify([note(midi)],[{midi,start:.2,end:1.1,harmonics}]);
   assert.equal(r.notes[0].pitchMidi,midi);
  });
 }
}
test('Merge-to-rest repair keeps two repeated C4 attacks',()=>{
 const r=verify([note(60,.2,.96)],[
  {midi:60,start:.2,end:.48},{midi:60,start:.65,end:.96}
 ]);
 const performance=adapter.toSingleMelody(r.notes);
 assert.equal(r.summary.pausesRestored,1);
 assert.deepEqual(performance.map(x=>x.midi),[60,null,60]);
 const score=C.transcribeAlignedEvents(performance,120,'4/4');
 assert.ok(score.some(x=>x.midi===null));
});
test('Suppress false same-pitch trailing note only when no new attack exists',()=>{
 const pcm=waveform([{midi:60,start:.2,end:.9}]);
 const result=adapter.toSingleMelody([note(60,.2,.81),note(60,.81,.9)],2,pcm,RATE);
 assert.deepEqual(result.map(x=>x.midi),[60]);
 assert.equal(result[0].qualityStatus,'review');
});
test('Sustained hum fragmented into four model notes sounds as ONE note',()=>{
 const fragments=[
  note(60,.20,.56),note(60,.56,.92),
  note(60,.92,1.30),note(60,1.30,1.72)
 ];
 const pcm=waveform([{midi:60,start:.20,end:1.72,harmonics:[1,.35,.12]}]);
 const melody=adapter.toSingleMelody(fragments,2,pcm,RATE);
 assert.deepEqual(melody.map(x=>x.midi),[60],'False repeated note attacks remained');
 assert.ok(Math.abs(melody[0].duration-1.52)<.001);
 const score=C.transcribeAlignedEvents(melody,120,'4/4');
 assert.equal(score.filter(n=>n.midi!==null).length,1,'One hum became four written notes');
 assert.equal(score[0].uncertain,true,'Automatically grouped note must remain reviewable');
});
test('Short false rest inside continuous humming does not cause a replay',()=>{
 const pcm=waveform([{midi:64,start:.20,end:1.60}]);
 const fragments=[note(64,.20,.67),note(64,.72,1.11),note(64,1.11,1.60)];
 const melody=adapter.toSingleMelody(fragments,2,pcm,RATE);
 assert.deepEqual(melody.map(x=>x.midi),[64]);
 assert.ok(Math.abs(melody[0].duration-1.4)<.001);
});
test('Real silence between repeated same-pitch hums remains TWO notes',()=>{
 const pcm=waveform([{midi:60,start:.20,end:.65},{midi:60,start:.75,end:1.15}]);
 const fragments=[note(60,.20,.65),note(60,.75,1.15)];
 const melody=adapter.toSingleMelody(fragments,2,pcm,RATE);
 assert.deepEqual(melody.map(x=>x.midi),[60,null,60]);
 assert.ok(melody[1].duration>=.09,'Actual silence was hidden');
});
test('No source audio does not invent a merge of repeated pitches',()=>{
 const fragments=[note(60,.20,.55),note(60,.55,.90),note(60,.90,1.25)];
 const melody=adapter.toSingleMelody(fragments,2,null,RATE);
 assert.deepEqual(melody.map(x=>x.midi),[60,60,60]);
});
test('Keep repeated same-pitch notes when their source recording has a fresh attack',()=>{
 const pcm=waveform([{midi:60,start:.2,end:.5},{midi:60,start:.5,end:.9}]);
 const result=adapter.toSingleMelody([note(60,.2,.5),note(60,.5,.9)],2,pcm,RATE);
 assert.deepEqual(result.map(x=>x.midi),[60,60]);
});
test('Keep a short same-pitch reattack even if the second note lasts 0.1 seconds',()=>{
 const pcm=waveform([{midi:60,start:.2,end:.65},{midi:60,start:.65,end:.75}]);
 const result=adapter.toSingleMelody([note(60,.2,.65),note(60,.65,.75)],2,pcm,RATE);
 assert.deepEqual(result.map(x=>x.midi),[60,60]);
});
test('Section seam preserves continuous humming as one note',()=>{
 const pcm=waveform([{midi:60,start:.5,end:1.6}]);
 const audio={sampleRate:RATE,length:pcm.length,duration:2,numberOfChannels:1,
  getChannelData:()=>pcm};
 const previous={midi:60,start:.6,end:1,sectionIndex:0};
 const next={midi:60,start:1,end:1.4,sectionIndex:1};
 assert.equal(adapter.canJoinWindowNotes(previous,next,audio),true,
  'One continuous held note was broken at an analysis seam');
});
test('Section seam preserves a real same-pitch reattack',()=>{
 const pcm=waveform([{midi:60,start:.5,end:1},{midi:60,start:1,end:1.6}]);
 const audio={sampleRate:RATE,length:pcm.length,duration:2,numberOfChannels:1,
  getChannelData:()=>pcm};
 const previous={midi:60,start:.6,end:1,sectionIndex:0};
 const next={midi:60,start:1,end:1.4,sectionIndex:1};
 assert.equal(adapter.canJoinWindowNotes(previous,next,audio),false,
  'A real repeated note was swallowed at an analysis seam');
});
test('Section seam refuses silent gap, different pitch or unavailable source',()=>{
 const pcm=waveform([{midi:60,start:.5,end:.97},{midi:60,start:1.05,end:1.6}]);
 const audio={sampleRate:RATE,length:pcm.length,duration:2,numberOfChannels:1,
  getChannelData:()=>pcm};
 const previous={midi:60,start:.6,end:1,sectionIndex:0};
 const next={midi:60,start:1,end:1.4,sectionIndex:1};
 assert.equal(adapter.canJoinWindowNotes(previous,next,audio),false,
  'A real silence gap should not be erased');
 assert.equal(adapter.canJoinWindowNotes(previous,{...next,midi:62},audio),false);
 assert.equal(adapter.canJoinWindowNotes(previous,next,null),false);
 assert.equal(adapter.canJoinWindowNotes(previous,{...next,sectionIndex:3},audio),false);
});
test('Find a missed C4-to-E4 change with stable independent pitch',()=>{
 const r=verify([note(60,.2,1.17)],[
  {midi:60,start:.2,end:.65},{midi:64,start:.65,end:1.17}
 ]);
 assert.equal(r.summary.noteSplits,1);
 assert.deepEqual(r.notes.map(x=>x.pitchMidi),[60,64]);
});
test('Reject model-only noise but do not invent pitches',()=>{
 const r=verify([note(60,.2,.9,.2)],[]);
 assert.equal(r.summary.noiseRejected,1);
 assert.equal(r.notes.length,0);
 const uncertain=verify([note(60,.2,.9,.95)],[]);
 assert.equal(uncertain.notes[0].pitchMidi,60);
 assert.ok(uncertain.summary.review>0);
});
test('Retain bounded pitch bends without rewriting notation',()=>{
 const events=adapter.toSingleMelody([{startTimeSeconds:0,durationSeconds:.7,pitchMidi:69,
  amplitude:.96,pitchBends:[0,1.5,3,-1.5,0]}]);
 assert.equal(events[0].midi,69);
 assert.ok(events[0].points.some(x=>x.midi>69.4));
 assert.equal(C.transcribeAlignedEvents(events,120,'4/4')[0].midi,69);
});
test('Resampling 48kHz audio retains A4 frequency',()=>{
 const rate=48000,length=rate/2,pcm=new Float32Array(length);
 for(let i=0;i<length;i++)pcm[i]=.35*Math.sin(2*Math.PI*440*i/rate);
 const resampled=adapter.resampleMono({sampleRate:rate,length,
  numberOfChannels:1,getChannelData:()=>pcm});
 assert.equal(resampled.length,11025);
 const pitch=C.estimatePitch(resampled.subarray(1000,5096),22050,null);
 assert.ok(Math.abs(pitch.midi-69)<.2);
});
test('Phase-inverted stereo recording keeps its melody rather than cancelling',()=>{
 const rate=48000,length=rate,left=new Float32Array(length),right=new Float32Array(length);
 for(let i=0;i<length;i++){
  const v=.30*Math.sin(2*Math.PI*440*i/rate);
  left[i]=v;right[i]=-v;
 }
 const audio={sampleRate:rate,length,duration:1,numberOfChannels:2,
  getChannelData:i=>i===0?left:right};
 const pcm=adapter.resampleMono(audio,1,0);
 assert.equal(pcm.length,22050);
 assert.ok(C.rmsOf(pcm)>.15,'Stereo phase cancellation destroyed most of the melody');
 const pitch=C.estimatePitch(pcm.subarray(900,4996),22050,null);
 assert.ok(Math.abs(pitch.midi-69)<.25,'A4 pitch lost in phase-opposed stereo');
});
test('Ordinary stereo content is still averaged, not arbitrarily amplified',()=>{
 const rate=22050,length=rate,one=new Float32Array(length),both=new Float32Array(length);
 for(let i=0;i<length;i++){
  const wave=.3*Math.sin(2*Math.PI*330*i/rate);one[i]=wave;both[i]=wave;
 }
 const audio={sampleRate:rate,length,duration:1,numberOfChannels:2,
  getChannelData:i=>i===0?one:both};
 const pcm=adapter.resampleMono(audio,1);
 assert.ok(Math.abs(C.rmsOf(pcm)-C.rmsOf(one))<.0001,
  'Centre-panned stereo was unexpectedly boosted or weakened');
});
test('All supported metres preserve longer scores without a bar cap',()=>{
 for(const metre of Object.keys(C.METERS)){
  const beat=C.beatSeconds(120,metre);
  const events=Array.from({length:90},(_,i)=>({start:i*beat,end:(i+1)*beat,duration:beat,midi:60,confidence:.95}));
  const score=C.transcribeAlignedEvents(events,120,metre);
  assert.ok(C.auditScore(score,metre).ok);
  assert.ok(score.length===90,'Detected performance was truncated for '+metre);
 }
});

test('Ten-minute recording divides into overlapping windows with complete coverage',()=>{
 const windows=adapter.recordingWindows(600);
 assert.ok(windows.length>20);
 assert.equal(windows[0].start,0);
 assert.equal(windows[0].keepStart,0);
 assert.equal(windows.at(-1).keepEnd,600);
 for(let i=0;i<windows.length;i++){
  const w=windows[i];
  assert.ok(w.seconds>0&&w.seconds<=20);
  assert.ok(w.keepStart>=w.start&&w.keepEnd<=w.start+w.seconds+.001);
  if(i)assert.equal(w.keepStart,windows[i-1].keepEnd,'Lost audio at section boundary');
 }
 assert.throws(()=>adapter.recordingWindows(601),/10 minutes/);
});
test('Resample a selected recording interval, rather than the first 20 seconds',()=>{
 const rate=22050,pcm=new Float32Array(rate*2);
 for(let i=rate;i<pcm.length;i++)pcm[i]=.3*Math.sin(2*Math.PI*440*i/rate);
 const buffer={sampleRate:rate,length:pcm.length,numberOfChannels:1,getChannelData:()=>pcm};
 const segment=adapter.resampleMono(buffer,.5,1.2);
 assert.equal(segment.length,Math.floor(rate*.5));
 assert.ok(Math.abs(C.estimatePitch(segment.subarray(0,4096),rate).midi-69)<.25);
});
test('Independent continuous melody output can exceed 256 note events',()=>{
 const events=Array.from({length:300},(_,i)=>({
  startTimeSeconds:i*.065,durationSeconds:.061,pitchMidi:60+i%3,amplitude:.95
 }));
 const out=adapter.toSingleMelody(events,20);
 assert.equal(out.filter(n=>n.midi!==null).length,300,'Long melody lost later notes');
});
/* Instrument playback smoke tests, using actual TEST-page synthesiser code,
   mocked Web Audio and no audio downloads. */
const instrumentPage=fs.readFileSync(path.join(__dirname,'hum-to-compose-test.html'),'utf8');
const instrumentStart=instrumentPage.indexOf('function scheduleWarmPiano(');
const instrumentEnd=instrumentPage.indexOf('async function playDetected(',instrumentStart);
assert.ok(instrumentStart>0&&instrumentEnd>instrumentStart,'Instrument scheduler missing');
const instrumentCode=instrumentPage.slice(instrumentStart,instrumentEnd);
function testInstrument(name,volume=1.9,duration=.8){
 const result={osc:[],stops:[],frequencies:[],gains:[],voices:[]};
 const audioContext={destination:{},sampleRate:48000,
  createOscillator(){return {type:'sine',
   frequency:{setValueAtTime(freq,at){result.frequencies.push([freq,at])}},
   connect(){},start(at){result.osc.push([at,this.type])},stop(at){result.stops.push(at)}
  }},
  createGain(){const env={ramp:[]};result.gains.push(env);
   return {gain:{setValueAtTime(){},linearRampToValueAtTime(v,at){env.ramp.push([v,at])},exponentialRampToValueAtTime(){}},connect(){}}
  }
 };
 const f=new Function('playerCtx','scoreLevel','voices','$',
  instrumentCode+String.fromCharCode(10)+'return {scheduleInstrument,INSTRUMENTS};');
 const engine=f(audioContext,()=>volume,result.voices,id=>({value:name}));
 engine.scheduleInstrument(69,.15,duration,[{t:.12,midi:69.3,confidence:.95}]);
 return {...result,profiles:engine.INSTRUMENTS};
}
for(const [name,partials,peak] of [
 ['piano',3,.43],['guitar',4,.45],['flute',3,.31],
 ['violin',5,.31],['xylophone',3,.43]
]){
 test('Instrument '+name+' tunes A4 correctly with bounded gain',()=>{
  const r=testInstrument(name);
  assert.equal(r.osc.length,partials);
  assert.equal(r.voices.length,partials);
  assert.equal(r.stops.length,partials);
  assert.equal(r.frequencies[0][0],440);
  assert.ok(r.osc.every(x=>x[1]==='sine'));
  assert.ok(Math.abs(Math.max(...r.gains.flatMap(g=>g.ramp.map(x=>x[0])))-peak*1.9)<1e-8);
  assert.ok(peak*1.9<1);
  assert.equal(r.frequencies.filter(x=>Math.abs(x[1]-.27)<1e-6).length,partials);
 });
}
test('Guitar and violin envelopes have distinct attack speed',()=>{
 const a=testInstrument('guitar'),b=testInstrument('violin');
 assert.ok(a.gains.find(x=>x.ramp.length).ramp[0][1]<
           b.gains.find(x=>x.ramp.length).ramp[0][1]);
});
test('Xylophone strikes decay before a long note ends',()=>{
 assert.ok(testInstrument('xylophone').stops.every(at=>at<.65));
 assert.ok(testInstrument('flute').stops.every(at=>at>.95));
});
test('Both score players share instrument while Original hum remains separate',()=>{
 assert.ok(instrumentPage.includes('scheduleInstrument(n.midi,begin+at,n.beats*sec)'));
 assert.ok(instrumentPage.includes('const token=++playbackEpoch'),'Long playback must have a cancelable scheduler');
 assert.ok(instrumentPage.includes('scheduleInstrument(e.midi,begin+e.start,e.duration,e.points||[])'));
 assert.ok(instrumentPage.includes('originalAudio.play()'));
});
console.log(passed+' synthetic audio verification checks passed.');
if(process.exitCode)process.exit(1);
