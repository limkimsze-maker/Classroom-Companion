/* Hum to Compose TEST deterministic benchmark, no third-party audio assets.
 * Tests a verification pipeline from Spotify-like seeded note events against
 * known-frequency/known-duration synthesised audio. Does NOT run Spotify ML.
 * Copyright (c) 2026 Music Score Studio contributors, AGPL-3.0.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.HumBenchmark=api})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 const RATE=22050,MODES=['correct','semitone','whole-tone','octave-up','octave-down','spurious'];
 function makeClip(events,voice='pure'){
  const seconds=events.at(-1).end+.2,pcm=new Float32Array(Math.ceil(seconds*RATE));
  const components=voice==='rich'?[.4,1,.25]:voice==='soft'?[.3,.1]:[1];
  for(const note of events){
   const fundamental=440*Math.pow(2,(note.midi-69)/12),count=Math.min(pcm.length,Math.round(note.end*RATE));
   for(let i=Math.max(0,Math.round(note.start*RATE));i<count;i++){
    const t=i/RATE,fade=Math.max(0,Math.min(1,(t-note.start)/.025,(note.end-t)/.035));
    let wave=0;for(let k=0;k<components.length;k++)
     wave+=components[k]*Math.sin(2*Math.PI*fundamental*(k+1)*t);
    pcm[i]+=.32*fade*wave/components.reduce((a,b)=>a+b,0);
   }
  }
  return pcm;
 }
 function deterministicCases(){
  const result=[],base=[60,62,64,67,69,72,74],durations=[.35,.44,.53,.38];
  for(let pattern=0;pattern<7;pattern++){
   const notes=[];let cursor=.16;
   for(let i=0;i<4;i++){
    const duration=durations[(i+pattern)%4];
    const midi=base[(pattern+i*2)%base.length];
    notes.push({start:cursor,end:cursor+duration,midi});
    cursor+=duration+(i===1?.17:.025);
   }
   for(const voice of ['pure','rich']){
    for(const mode of MODES){
     const model=notes.map((n,i)=>{
      const shift=i!==1?0:mode==='semitone'?1:mode==='whole-tone'?-2:mode==='octave-up'?12:mode==='octave-down'?-12:0;
      return {startTimeSeconds:n.start,durationSeconds:n.end-n.start,
       pitchMidi:n.midi+shift,amplitude:.96};
     });
     if(mode==='spurious')model.push({startTimeSeconds:notes[1].end+.035,durationSeconds:.09,pitchMidi:73,amplitude:.18});
     result.push({name:'pattern'+pattern+'-'+voice+'-'+mode,mode,voice,
      notes,model,pcm:makeClip(notes,voice)});
    }
   }
  }
  return result;
 }
 /* One-to-one note comparison: a recognised note can match at most one
    expected note. A duplicate, invented or mistuned note counts as a false
    positive; a missed note counts as a false negative. Onsets are relative to
    the first voiced event, the same convention used by the recogniser. */
 function scoreMelody(truth,predicted){
  const expected=(Array.isArray(truth)?truth:[]).filter(n=>Number.isFinite(n.midi)&&Number.isFinite(n.start)&&Number.isFinite(n.end)&&n.end>n.start);
  const actual=(Array.isArray(predicted)?predicted:[]).filter(n=>Number.isFinite(n.midi)&&Number.isFinite(n.start)&&Number.isFinite(n.end)&&n.end>n.start);
  const pairs=[];
  for(let i=0;i<expected.length;i++)for(let j=0;j<actual.length;j++){
   const a=expected[i],b=actual[j];
   if(Math.round(a.midi)!==Math.round(b.midi))continue;
   const intersect=Math.max(0,Math.min(a.end,b.end)-Math.max(a.start,b.start));
   const union=Math.max(a.end,b.end)-Math.min(a.start,b.start),iou=intersect/union;
   if(intersect>=.045&&iou>=.30)pairs.push({i,j,iou,onsetError:Math.abs(a.start-b.start)});
  }
  pairs.sort((a,b)=>b.iou-a.iou||a.onsetError-b.onsetError||a.i-b.i||a.j-b.j);
  const usedTruth=new Set(),usedActual=new Set(),matched=[];
  for(const pair of pairs)if(!usedTruth.has(pair.i)&&!usedActual.has(pair.j)){
   matched.push(pair);usedTruth.add(pair.i);usedActual.add(pair.j);
  }
  const truePositive=matched.length,falsePositive=actual.length-truePositive,falseNegative=expected.length-truePositive;
  const precision=actual.length?truePositive/actual.length:expected.length?0:1;
  const recall=expected.length?truePositive/expected.length:actual.length?0:1;
  const f1=precision+recall?2*precision*recall/(precision+recall):0;
  return {truePositive,falsePositive,falseNegative,expectedNotes:expected.length,predictedNotes:actual.length,
   precision,recall,f1,meanOnsetErrorSeconds:matched.length?
    matched.reduce((a,p)=>a+p.onsetError,0)/matched.length:null};
 }
 function run(core,adapter){
  if(!core?.estimatePitch||!adapter?.verifyPerformance)throw Error('Missing core and adapter');
  const all=deterministicCases(),rows=[];
  let total=0,matched=0,corrected=0,correctionAttempts=0,falseShifts=0;
  let onsetError=0,onsetCount=0,restCases=0,restCorrect=0,cleanCases=0,cleanCorrect=0;
  let truePositive=0,falsePositive=0,falseNegative=0;
  for(const fixture of all){
   const result=adapter.verifyPerformance(fixture.model,fixture.pcm,RATE,core.estimatePitch);
   const predicted=result.notes.filter(n=>n.pitchMidi!==null),expected=fixture.notes;
   let localCorrect=0;
   for(const truth of expected){
    total++;
    const candidates=predicted.filter(n=>{
     const b=n.startTimeSeconds,e=b+n.durationSeconds;
     return b<truth.end&&e>truth.start;
    }).sort((a,b)=>{
     const overlap=n=>Math.min(truth.end,n.startTimeSeconds+n.durationSeconds)-Math.max(truth.start,n.startTimeSeconds);
     return overlap(b)-overlap(a);
    });
    if(candidates[0]){
     const choice=candidates[0],correct=choice.pitchMidi===truth.midi;
     if(correct){matched++;localCorrect++}
     onsetError+=Math.abs(choice.startTimeSeconds-truth.start);onsetCount++;
    }
   }
   if(fixture.mode==='correct'||fixture.mode==='spurious'){
    cleanCases++;if(localCorrect===expected.length)cleanCorrect++;
    for(const n of result.notes)if(n.originalPitchMidi!==undefined&&n.pitchMidi!==n.originalPitchMidi)falseShifts++;
   }else{
    correctionAttempts++;if(localCorrect===expected.length)corrected++;
   }
   restCases++;
   const performance=adapter.toSingleMelody(result.notes,10);
   const firstTruth=fixture.notes[0]?.start||0;
   const judged=scoreMelody(fixture.notes.map(n=>({start:n.start-firstTruth,end:n.end-firstTruth,midi:n.midi})),performance);
   truePositive+=judged.truePositive;falsePositive+=judged.falsePositive;falseNegative+=judged.falseNegative;
   const rests=performance.filter(e=>e.midi===null&&e.duration>.09);
   if(rests.some(r=>{
    const origin=fixture.notes[0].start,expectedRest=fixture.notes[1].end-origin+.025;
    return r.start<=expectedRest+.12&&r.end>=expectedRest+.02;
   }))restCorrect++;
   rows.push({name:fixture.name,mode:fixture.mode,voice:fixture.voice,correct:localCorrect,
    expected:expected.length,review:result.summary.review,octave:result.summary.octavesCorrected,
    pitch:result.summary.pitchCorrected,restored:result.summary.pausesRestored});
  }
  return {
   description:'Synthetic verification with seeded Spotify-like note events. This benchmark does not run the Spotify neural model.',
   cases:all.length,pitchedNotes:total,matchedPitch:matched,
   pitchAccuracy:total?matched/total:0,correctionAttempts,fullyRecovered:corrected,
   recoveryRate:correctionAttempts?corrected/correctionAttempts:0,
   cleanCases,cleanUntouched:cleanCorrect,falseShifts,
   expectedRests:restCases,restDetected:restCorrect,restRecall:restCases?restCorrect/restCases:0,
   meanOnsetErrorSeconds:onsetCount?onsetError/onsetCount:null,
   truePositive,falsePositive,falseNegative,
   notePrecision:truePositive+falsePositive?truePositive/(truePositive+falsePositive):0,
   noteRecall:truePositive+falseNegative?truePositive/(truePositive+falseNegative):0,
   noteF1:(2*truePositive+falsePositive+falseNegative)?
    2*truePositive/(2*truePositive+falsePositive+falseNegative):0,rows
  };
 }
 return {RATE,MODES,makeClip,deterministicCases,scoreMelody,run};
});
