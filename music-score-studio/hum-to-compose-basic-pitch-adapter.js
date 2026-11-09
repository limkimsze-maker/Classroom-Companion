/*
 * Music Score Studio Hum to Compose TEST — Spotify Basic Pitch integration adapter.
 * Adapter copyright (c) 2026 Music Score Studio contributors, AGPL-3.0.
 *
 * Spotify Basic Pitch is Copyright 2022 Spotify AB, licensed Apache-2.0:
 * https://github.com/spotify/basic-pitch-ts/blob/main/LICENSE
 * A full licence copy is included in hum-to-compose-APACHE-2.0-LICENSE.txt.
 * No Spotify code is copied into this adapter. Spotify does not endorse this tool.
 *
 * The pinned library and model are fetched only when the user chooses the
 * experimental engine. Recorded audio is decoded and inferred in this browser.
 */

export const BASIC_PITCH_VERSION = '@spotify/basic-pitch@1.0.1';
export const BASIC_PITCH_MODULE = 'https://esm.sh/@spotify/basic-pitch@1.0.1?bundle';
export const BASIC_PITCH_MODEL =
 'https://cdn.jsdelivr.net/gh/spotify/basic-pitch-ts@2d498f82b61c71898edf0e8dd661b99076676c8b/model/model.json';
export const BASIC_PITCH_MODEL_FALLBACK =
 'https://raw.githubusercontent.com/spotify/basic-pitch-ts/2d498f82b61c71898edf0e8dd661b99076676c8b/model/model.json';

let cachedEngine=null;
async function engine(){
 if(!cachedEngine){
  cachedEngine=(async()=>{
   const library=await import(BASIC_PITCH_MODULE);
   if(!library.BasicPitch||!library.outputToNotesPoly||!library.noteFramesToTime)
    throw Error('Spotify Basic Pitch module exports were not available');
   let lastError=null;
   for(const modelURL of [BASIC_PITCH_MODEL,BASIC_PITCH_MODEL_FALLBACK]){
    try{
     const model=new library.BasicPitch(modelURL);
     await model.model; // Verify the graph manifest and its weights are loadable.
     return {library,model};
    }catch(error){lastError=error}
   }
   throw Error('Spotify model files could not be loaded: '+(lastError?.message||'network or browser error'));
  })().catch(err=>{cachedEngine=null;throw err});
 }
 return cachedEngine;
}

/* Resample speech/humming to the model's exact 22050 Hz mono input.
   The low-pitch voice band is far below 11.025 kHz; this is deliberately
   lightweight for short clips and avoids external audio processing services. */
export function resampleMono(audio,limitSeconds=20,startSeconds=0){
 if(!audio||!Number.isFinite(audio.sampleRate)||audio.sampleRate<8000||audio.numberOfChannels<1)
  throw Error('Unsupported audio buffer');
 const rate=audio.sampleRate,targetRate=22050;
 const begin=Math.min(audio.length,Math.max(0,Math.floor(startSeconds*rate)));
 const count=Math.min(audio.length-begin,Math.round(Math.max(0,limitSeconds)*rate));
 const channels=Array.from({length:Math.min(2,audio.numberOfChannels)},(_,i)=>audio.getChannelData(i));
 if(count<Math.round(rate*.12))throw Error('Audio is too short');
 // Stereo recordings can have partially inverted channels. A straight
 // average can then erase the melody. Only when downmix cancellation is
 // demonstrably severe do we use the louder channel instead.
 let strongest=null;
 if(channels.length===2){
  let leftPower=0,rightPower=0,mixPower=0;
  const step=Math.max(1,Math.floor(count/8192));
  for(let i=0;i<count;i+=step){
   const left=channels[0][begin+i]||0,right=channels[1][begin+i]||0;
   leftPower+=left*left;rightPower+=right*right;
   const sum=(left+right)/2;mixPower+=sum*sum;
  }
  if(Math.max(leftPower,rightPower)>1e-5&&
   mixPower<Math.max(leftPower,rightPower)*.12)
   strongest=channels[leftPower>=rightPower?0:1];
 }
 const mono=new Float32Array(count);
 for(let i=0;i<count;i++){
  if(strongest){mono[i]=strongest[begin+i]||0;continue}
  let sum=0;for(const channel of channels)sum+=channel[begin+i]||0;
  mono[i]=sum/channels.length;
 }
 if(rate===targetRate)return mono;
 const outputLength=Math.max(1,Math.floor(count*targetRate/rate)),out=new Float32Array(outputLength);
 // Band-limited-windowed sinc for downsampling; simple interpolation when
 // upsampling. A small kernel keeps the test usable on mid-range phones.
 const down=rate>targetRate,ratio=rate/targetRate,radius=down?12:1;
 const cutoff=down?targetRate/rate*.88:1;
 for(let j=0;j<outputLength;j++){
  const pos=j*ratio,k=Math.floor(pos);
  if(!down){
   const frac=pos-k;out[j]=mono[Math.min(count-1,k)]*(1-frac)+mono[Math.min(count-1,k+1)]*frac;
   continue;
  }
  let sum=0,weight=0;
  for(let n=k-radius;n<=k+radius;n++){
   if(n<0||n>=count)continue;
   const x=pos-n;
   const sinc=Math.abs(x)<1e-9?cutoff:Math.sin(Math.PI*x*cutoff)/(Math.PI*x);
   const window=.5+.5*Math.cos(Math.PI*x/(radius+1));
   const w=sinc*window;
   sum+=mono[n]*w;weight+=w;
  }
  out[j]=weight?sum/weight:0;
 }
 return out;
}

/* Independent, conservative octave verification for monophonic humming.
   Work on the original audio timeline BEFORE trimming leading silence.
   A YIN-based fundamental estimate proposes the octave; spectral evidence
   and a second window must agree before any automatic +/-12 correction.
   Doubtful notes remain unchanged and are marked for teacher review.
   Original project integration code; no copied Spotify code or audio samples. */
function octaveFrequency(midi){return 440*Math.pow(2,(midi-69)/12)}
function octaveEnergy(samples,rate,freq){
 if(!(freq>60&&freq<rate*.45)||!samples?.length)return 0;
 const coeff=2*Math.cos(2*Math.PI*freq/rate);
 let a=0,b=0,energy=0;const n=samples.length;
 for(let i=0;i<n;i++){
  const weight=1-Math.abs(2*i/(n-1)-1),v=samples[i]*weight;
  const c=v+coeff*a-b;b=a;a=c;energy+=v*v;
 }
 return Math.max(0,a*a+b*b-coeff*a*b)/(energy*n+1e-9);
}
function octaveSample(pcm,rate,start,length,position=.5){
 const count=Math.min(4096,Math.floor((length-.025)*rate));
 if(count<Math.max(2048,Math.ceil(rate*.105)))return null;
 const min=Math.max(0,Math.ceil((start+.010)*rate));
 const max=Math.min(pcm.length-count,Math.floor((start+length-.010)*rate)-count);
 if(max<min)return null;
 const center=Math.floor((start+position*length)*rate-count/2);
 const begin=Math.min(max,Math.max(min,center));
 return pcm.subarray(begin,begin+count);
}
export function verifyOctaves(noteEvents,pcm,rate,pitchEstimator){
 if(!Array.isArray(noteEvents))return {notes:[],checked:0,corrected:0,review:0};
 const copy=noteEvents.map(note=>({...note}));
 if(!(pcm instanceof Float32Array)||!(rate>0)||typeof pitchEstimator!=='function')
  return {notes:copy,checked:0,corrected:0,review:0};
 let checked=0,corrected=0,review=0;
 for(const note of copy){
  const midi=Number(note.pitchMidi),start=Number(note.startTimeSeconds);
  const length=Math.min(Number(note.durationSeconds),20-start);
  if(!Number.isFinite(midi)||midi<36||midi>95||!Number.isFinite(start)||!(length>0))continue;
  // Short notes or unreliable audio cannot support an automatic octave shift.
  if(length<.14){note.octaveStatus='review';review++;continue}
  const primary=octaveSample(pcm,rate,start,length,.5);
  if(!primary){note.octaveStatus='review';review++;continue}
  const result=pitchEstimator(primary,rate,null);
  if(!result||!Number.isFinite(result.midi)||result.confidence<.89){
   note.octaveStatus='review';review++;continue
  }
  checked++;
  const difference=result.midi-midi;
  if(Math.abs(Math.abs(difference)-12)>.70){
   if(Math.abs(difference)>1.5){note.octaveStatus='review';review++}
   else note.octaveStatus='matched';
   continue;
  }
  const direction=difference>0?1:-1,target=midi+direction*12;
  if(target<36||target>95){note.octaveStatus='review';review++;continue}
  const f0=octaveFrequency(result.midi),low=octaveEnergy(primary,rate,f0/2);
  const current=octaveEnergy(primary,rate,f0);
  const overtone=octaveEnergy(primary,rate,f0*2);
  // Up: model pitch is below the fundamental; low-frequency model
  // component must be nearly absent, with little odd harmonic evidence.
  // Down: independently detected lower fundamental must be audible.
  const supported=direction>0
   ? current>low*8&&current>.005&&octaveEnergy(primary,rate,f0*1.5)<current*.22
   : current>overtone*.6&&current>.005;
  const secondary=octaveSample(pcm,rate,start,length,.32);
  const confirm=secondary&&pitchEstimator(secondary,rate,null);
  const stable=confirm&&Number.isFinite(confirm.midi)&&confirm.confidence>=.88&&
   Math.abs(confirm.midi-result.midi)<.7;
  if(supported&&stable){
   note.originalPitchMidi=note.pitchMidi;
   note.pitchMidi=target;note.octaveStatus='corrected';corrected++;
  }else{note.octaveStatus='review';review++}
 }
 return {notes:copy,checked,corrected,review};
}

/* Teacher-safe audio verification after Spotify inference.
   Invariant: no new pitch is invented from audio alone. We only correct a
   detected note after two stable independent estimates; silent gaps may
   divide a model note but never insert an ungrounded pitch.
   All analysis is local on the original PCM time axis (not trimmed). */
function sectionRms(pcm,rate,start,end){
 const a=Math.max(0,Math.floor(start*rate)),b=Math.min(pcm.length,Math.ceil(end*rate));
 if(b-a<16)return 0;
 let power=0;for(let i=a;i<b;i++)power+=pcm[i]*pcm[i];
 return Math.sqrt(power/(b-a));
}
function markReview(note){
 note.qualityStatus='review';
 if(note.octaveStatus!=='corrected')note.octaveStatus='review';
}
export function verifyPerformance(noteEvents,pcm,rate,pitchEstimator){
 const octaves=verifyOctaves(noteEvents,pcm,rate,pitchEstimator);
 const input=octaves.notes,processed=[];
 const summary={checked:octaves.checked,octavesCorrected:octaves.corrected,
  pitchCorrected:0,noteSplits:0,pausesRestored:0,boundariesTrimmed:0,noiseRejected:0,review:0};
 if(!(pcm instanceof Float32Array)||!(rate>0))return {notes:input,summary};
 for(const note of input){
  const start=Number(note.startTimeSeconds),duration=Number(note.durationSeconds);
  if(!(Number.isFinite(start)&&Number.isFinite(duration)&&duration>.001)){
   processed.push(note);continue;
  }
  const stop=Math.min(20,start+duration);
  if(stop<=start){processed.push(note);continue}
  const valid=Number.isFinite(note.pitchMidi)&&note.pitchMidi>=36&&note.pitchMidi<=95;
  const checked={...note};
  if(Array.isArray(checked.pitchBends)){checked.originalBendStart=Number(note.startTimeSeconds);checked.originalBendDuration=Number(note.durationSeconds)}
  const overallRms=sectionRms(pcm,rate,start,stop);
  if(overallRms<.0015){
   if((Number(note.amplitude)||0)<.5){summary.noiseRejected++;continue}
   markReview(checked);processed.push(checked);continue;
  }
  // Confirm small non-octave pitch discrepancies only with two independent
  // stable measurements and strong spectral advantage over Spotify's bin.
  // Octaves are already handled by verifyOctaves; we never double-correct.
  if(valid&&checked.octaveStatus!=='corrected'&&duration>=.22&&typeof pitchEstimator==='function'){
   const primary=octaveSample(pcm,rate,start,duration,.53);
   const secondary=octaveSample(pcm,rate,start,duration,.29);
   const a=primary&&pitchEstimator(primary,rate,null),b=secondary&&pitchEstimator(secondary,rate,null);
   if(a&&b&&Number.isFinite(a.midi)&&Number.isFinite(b.midi)
    &&a.confidence>.94&&b.confidence>.92&&Math.abs(a.midi-b.midi)<.30){
    const delta=a.midi-checked.pitchMidi,whole=Math.round(delta),candidate=checked.pitchMidi+whole;
    if(Math.abs(delta)<.55){if(checked.octaveStatus!=='review')checked.qualityStatus='matched'}
    else if(Math.abs(whole)>=1&&Math.abs(whole)<=5&&Math.abs(delta-whole)<.30&&candidate>=36&&candidate<=95){
     const wanted=octaveEnergy(primary,rate,octaveFrequency(a.midi));
     const former=octaveEnergy(primary,rate,octaveFrequency(checked.pitchMidi));
     const stableAudio=octaveEnergy(secondary,rate,octaveFrequency(b.midi))>.01;
     if(wanted>.03&&wanted>former*2.5&&stableAudio){
      checked.originalPitchMidi=checked.pitchMidi;
      checked.pitchMidi=candidate;checked.qualityStatus='corrected';summary.pitchCorrected++;
     }else markReview(checked);
    }else if(Math.abs(delta)>.7)markReview(checked);
   }else if(checked.octaveStatus==='review')markReview(checked);
  }
  // Only long enough notes can support trimming or splitting on silence.
  if(!valid||duration<.28){processed.push(checked);continue}
  const step=.012,window=.024;
  const blocks=[];for(let t=start;t+window<=stop+.00001;t+=step)
   blocks.push({time:t+window*.5,rms:sectionRms(pcm,rate,t,t+window)});
  if(blocks.length<12){processed.push(checked);continue}
  const peak=Math.max(...blocks.map(x=>x.rms));
  if(peak<.012){markReview(checked);processed.push(checked);continue}
  const threshold=Math.max(.004,peak*.12);
  const voiced=blocks.map(x=>x.rms>=threshold);
  const first=voiced.indexOf(true),last=voiced.lastIndexOf(true);
  if(first<0){markReview(checked);processed.push(checked);continue}
  // Do not invent new boundaries by shaving a few milliseconds of a soft attack.
  const head=blocks[first].time-start,tail=stop-blocks[last].time;
  let voiceStart=start,voiceEnd=stop;
  if(head>.065&&head<duration*.4){voiceStart=blocks[first].time;summary.boundariesTrimmed++}
  if(tail>.065&&tail<duration*.4){voiceEnd=blocks[last].time;summary.boundariesTrimmed++}
  if(voiceEnd-voiceStart<.12){processed.push(checked);continue}
  const pauses=[];
  for(let i=Math.max(0,first);i<=last;){
   if(voiced[i]){i++;continue}
   const begin=i;while(i<=last&&!voiced[i])i++;
   const from=blocks[begin].time-step*.5,to=blocks[i-1].time+step*.5;
   if(to-from>=.075&&from-voiceStart>=.12&&voiceEnd-to>=.12)
    pauses.push({from,to});
  }
  if(!pauses.length){
   processed.push({...checked,startTimeSeconds:voiceStart,durationSeconds:voiceEnd-voiceStart});
   continue;
  }
  // A real silent gap inside an otherwise voiced model note restores a rest.
  // Preserve the original Spotify note pitch; repeated attacks are not merged.
  let cursor=voiceStart;
  for(const gap of pauses){
   if(gap.from-cursor>=.12){
    const fragment={...checked,startTimeSeconds:cursor,durationSeconds:gap.from-cursor};
    markReview(fragment);processed.push(fragment);
   }
   cursor=gap.to;summary.pausesRestored++;
  }
  if(voiceEnd-cursor>=.12){
   const fragment={...checked,startTimeSeconds:cursor,durationSeconds:voiceEnd-cursor};
   markReview(fragment);processed.push(fragment);
  }
 }
 // Look for one missing note transition within a very long Spotify event.
 // Two stable YIN plateaus and agreement with one Spotify pitch are required.
 // Limit analysis windows so short audio stays usable on mid-range phones.
 const withTransitions=[];let remainingSamples=90;
 for(const n of processed){
  const length=Number(n.durationSeconds),start=Number(n.startTimeSeconds);
  if(!Number.isFinite(n.pitchMidi)||length<.62||!Number.isFinite(start)
   ||typeof pitchEstimator!=='function'||remainingSamples<4){
   withTransitions.push(n);continue;
  }
  const frames=Math.min(12,Math.floor(length/.095),remainingSamples);
  remainingSamples-=frames;
  const reads=[];
  for(let i=0;i<frames;i++){
   const relative=.12+(.76*(i+.5)/frames);
   const window=octaveSample(pcm,rate,start,length,relative);
   const found=window&&pitchEstimator(window,rate,null);
   const reliable=found&&found.confidence>.94&&Number.isFinite(found.midi)&&
    Math.abs(found.midi-Math.round(found.midi))<.32;
   reads.push({t:start+relative*length,pitch:reliable?Math.round(found.midi):null});
  }
  const reliable=reads.filter(x=>x.pitch!==null);
  if(reliable.length<5){withTransitions.push(n);continue}
  const variants=[...new Set(reliable.map(x=>x.pitch))];
  if(variants.length!==2){withTransitions.push(n);continue}
  const [m1,m2]=variants;const same=r=>r.pitch===m1?1:r.pitch===m2?2:0;
  const ordered=reads.map(same),switchAt=ordered.findIndex(x=>x===2);
  const before=ordered.slice(0,switchAt),after=ordered.slice(switchAt);
  // Mixed transition windows often lack reliable pitch. Permit up to two
  // uncertain readings, but never an alternating reliable A-B-A pattern.
  const clean=before.filter(x=>x===1).length>=2&&after.filter(x=>x===2).length>=2
   &&before.every(x=>x===0||x===1)&&after.every(x=>x===0||x===2)
   &&ordered.filter(x=>x===0).length<=2;
  const previous=ordered.lastIndexOf(1);
  const edge=clean?(reads[previous].t+reads[switchAt].t)/2:null;
  if(!clean||!(Math.abs(m1-m2)>=2&&Math.abs(m1-m2)<12)
   ||Math.min(Math.abs(m1-n.pitchMidi),Math.abs(m2-n.pitchMidi))>.7
   ||!(edge-start>.20&&start+length-edge>.20)){
   // There may be a missed note, but not enough evidence to invent a split.
   if(variants.length>1){const candidate={...n};markReview(candidate);withTransitions.push(candidate)}
   else withTransitions.push(n);
   continue;
  }
  const first={...n,startTimeSeconds:start,durationSeconds:edge-start,pitchMidi:m1};
  const second={...n,startTimeSeconds:edge,durationSeconds:start+length-edge,pitchMidi:m2};
  markReview(first);markReview(second);
  withTransitions.push(first,second);summary.noteSplits++;
 }
 summary.review=withTransitions.filter(n=>n.octaveStatus==='review'||n.qualityStatus==='review'||n.octaveStatus==='corrected'||n.qualityStatus==='corrected').length;
 return {notes:withTransitions,summary};
}

/* Basic Pitch can return simultaneous notes. This is an experimental
   single-stave monophonic adapter: keep the strongest active note per
   interval. Preserve separate attacks even when the repeated pitch matches. */
/* Keep short same-pitch Spotify fragments together only when the source audio
   shows no convincing new attack. Real repeated notes (including short ones)
   must remain separate; when the evidence is missing we do NOT merge. */
function hasIndependentReattack(pcm,rate,at){
 if(!(pcm instanceof Float32Array)||!(rate>0)||at<.06||at+.055>=pcm.length/rate)return true;
 const before=sectionRms(pcm,rate,at-.052,at-.022);
 const valley=sectionRms(pcm,rate,at-.009,at+.009);
 const after=sectionRms(pcm,rate,at+.020,at+.052);
 return after>.012&&before>.012&&valley<before*.72&&valley<after*.72&&after>before*.55;
}
function continuousPhonationAcross(pcm,rate,from,to){
 if(!(pcm instanceof Float32Array)||!(rate>0)||from<.04||to>pcm.length/rate-.04||to<from)return false;
 if(to-from>.095)return false;
 const prior=sectionRms(pcm,rate,from-.045,from-.015);
 const following=sectionRms(pcm,rate,to+.015,to+.045);
 const bridge=sectionRms(pcm,rate,Math.max(0,from-.007),Math.min(pcm.length/rate,to+.007));
 const floor=Math.min(prior,following);
 return floor>.012&&bridge>Math.max(.009,floor*.56);
}
export function toSingleMelody(noteEvents,maxDuration=20,sourcePcm=null,rate=22050,preserveStart=false){
 if(!Array.isArray(noteEvents))return [];
 const clean=noteEvents.map((n,index)=>{
  const start=Math.max(0,Number(n.startTimeSeconds));
  const duration=Number(n.durationSeconds),pitch=Math.round(Number(n.pitchMidi));
  const end=Math.min(maxDuration,start+duration);
  return {index,start,end,pitch,octaveStatus:n.octaveStatus||'unchecked',qualityStatus:n.qualityStatus||'unchecked',
  amplitude:Math.max(0,Math.min(1,Number(n.amplitude)||0)),
  pitchBends:Array.isArray(n.pitchBends)?n.pitchBends:null,
  bendStart:Number.isFinite(n.originalBendStart)?n.originalBendStart:start,
  bendDuration:Number.isFinite(n.originalBendDuration)?n.originalBendDuration:end-start};
 }).filter(n=>Number.isFinite(n.start)&&Number.isFinite(n.end)&&n.end-n.start>=.06&&n.pitch>=36&&n.pitch<=95);
 if(!clean.length)return [];
 const boundaries=[...new Set(clean.flatMap(n=>[n.start,n.end]))].sort((a,b)=>a-b);
 // A rolling set of overlapping notes avoids O(events × boundaries) scans
 // for long (up to 10-minute) recordings. Preserve the previous amplitude,
 // later-onset, original-index priority exactly.
 const byStart=clean.slice().sort((a,b)=>a.start-b.start);
 const byEnd=clean.slice().sort((a,b)=>a.end-b.end);
 const active=new Set();let nextStart=0,nextEnd=0;
 let last=null;const timeline=[];
 for(let i=0;i<boundaries.length-1;i++){
  const start=boundaries[i],end=boundaries[i+1];
  if(end-start<.0001)continue;
  while(nextStart<byStart.length&&byStart[nextStart].start<=start+.00001)
   active.add(byStart[nextStart++]);
  while(nextEnd<byEnd.length&&byEnd[nextEnd].end<end-.00001)
   active.delete(byEnd[nextEnd++]);
  let best=null;
  for(const candidate of active){
   if(candidate.end<end-.00001)continue;
   if(!best||candidate.amplitude>best.amplitude||
    candidate.amplitude===best.amplitude&&(candidate.start>best.start||
    candidate.start===best.start&&candidate.index<best.index))
    best=candidate;
  }
  const id=best?best.index:null,pitch=best?best.pitch:null;
  if(last&&last.index===id&&Math.abs(last.end-start)<.0001){last.end=end;last.duration=end-last.start}
  else{
   last={index:id,start,end,duration:end-start,midi:pitch,
    confidence:best?((best.octaveStatus==='corrected'||best.octaveStatus==='review'||
     best.qualityStatus==='corrected'||best.qualityStatus==='review')
     ?Math.min(.75,Math.max(.25,best.amplitude)):Math.max(.25,best.amplitude)):1,
    octaveStatus:best?.octaveStatus||'unchecked',qualityStatus:best?.qualityStatus||'unchecked',
    bends:best?.pitchBends||null,bendStart:best?.bendStart,bendDuration:best?.bendDuration};
   timeline.push(last);
  }
 }
 // A sustained vowel may be split into several 0.2-0.5s model notes.
 // Use source audio to identify independent attacks, never an arbitrary 140ms
 // fragment limit. Preserve true rearticulation and silent gaps.
 const smoothed=[];
 function absorb(prev,next){
  prev.end=next.end;prev.duration=prev.end-prev.start;
  prev.confidence=Math.min(prev.confidence,next.confidence,.8);
  prev.qualityStatus='review';
 }
 for(let i=0;i<timeline.length;i++){
  const piece=timeline[i],prev=smoothed.at(-1);
  if(piece.midi!==null&&prev&&prev.midi===piece.midi&&
   Math.abs(piece.start-prev.end)<.008&&sourcePcm instanceof Float32Array&&
   !hasIndependentReattack(sourcePcm,rate,piece.start)){
   absorb(prev,piece);continue;
  }
  const next=timeline[i+1];
  // Bridge a *spurious* short detector rest only if audible phonation
  // continues across the gap. A genuine breath/rest must remain intact.
  if(piece.midi===null&&prev&&prev.midi!==null&&next&&next.midi===prev.midi&&
   piece.duration<=.095&&Math.abs(next.start-piece.end)<.008&&
   continuousPhonationAcross(sourcePcm,rate,piece.start,piece.end)&&
   !hasIndependentReattack(sourcePcm,rate,next.start)){
   absorb(prev,next);i++;continue;
  }
  smoothed.push({...piece});
 }
 const first=smoothed.find(n=>n.midi!==null),lastPitch=[...smoothed].reverse().find(n=>n.midi!==null);
 if(!first||!lastPitch)return [];
 const start=preserveStart?0:first.start,end=lastPitch.end;
 return smoothed.filter(n=>n.end>start&&n.start<end).map(n=>{
  const at=Math.max(0,n.start-start),until=Math.min(end-start,n.end-start),duration=until-at;
  const points=n.midi===null?[]:[{t:0,midi:n.midi,confidence:n.confidence}];
  if(n.midi!==null&&Array.isArray(n.bends)&&n.bends.length>=2&&Number.isFinite(n.bendStart)&&n.bendDuration>0){
   // Spotify contours are spaced at one third of a semitone per bin.
   // Keep the score pitch discrete and bound short playback inflections.
   const step=Math.max(1,Math.ceil(n.bends.length/24));
   for(let i=0;i<n.bends.length;i+=step){
    const bend=Number(n.bends[i]);if(!Number.isFinite(bend))continue;
    const t=n.bendStart+(i/n.bends.length)*n.bendDuration-n.start;
    if(t<=0||t>=duration)continue;
    points.push({t,midi:n.midi+Math.max(-1.5,Math.min(1.5,bend/3)),confidence:n.confidence});
   }
  }
  return {start:at,end:until,duration,midi:n.midi,confidence:n.confidence,
   octaveStatus:n.octaveStatus,qualityStatus:n.qualityStatus,points};
 }).filter(n=>n.duration>=.025);
}

/* A window boundary is not itself a musical note attack.
   Merge same-pitch fragments only if the actual waveform stays voiced and
   there is no independent attack around the seam. Genuine repeated notes
   remain separate and retain the model's original pitches/timestamps. */
export function canJoinWindowNotes(previous,current,audioBuffer){
 if(!previous||!current||previous.midi===null||
  previous.midi!==current.midi||
  !Number.isInteger(previous.sectionIndex)||!Number.isInteger(current.sectionIndex)||
  current.sectionIndex!==previous.sectionIndex+1||
  Math.abs(previous.end-current.start)>=.055||
  !audioBuffer||!Number.isFinite(audioBuffer.sampleRate))return false;
 const start=Math.max(0,Math.min(previous.end,current.start)-.15);
 const until=Math.max(previous.end,current.start)+.15;
 const full=Number.isFinite(audioBuffer.duration)?audioBuffer.duration:
  audioBuffer.length/audioBuffer.sampleRate;
 if(!(until<=full))return false;
 let pcm;
 try{pcm=resampleMono(audioBuffer,until-start,start)}
 catch(_){return false}
 const prevEnd=previous.end-start,nextStart=current.start-start;
 return continuousPhonationAcross(pcm,22050,Math.min(prevEnd,nextStart),Math.max(prevEnd,nextStart))&&
  !hasIndependentReattack(pcm,22050,nextStart);
}

// Independent 20-second inferences with one second overlap keep memory bounded.
// Each window owns its middle interval; boundary fragments are marked for review.
export function recordingWindows(duration,windowSeconds=20,overlapSeconds=1){
 if(!Number.isFinite(duration)||duration<.12||duration>600.01)throw Error('Audio must be between 0.12 seconds and 10 minutes');
 const stride=windowSeconds-overlapSeconds;
 if(!(stride>0&&overlapSeconds>=0))throw Error('Invalid recording window');
 const out=[];
 for(let start=0;start<duration;start+=stride){
  const seconds=Math.min(windowSeconds,duration-start);
  out.push({start,seconds,keepStart:start===0?0:start+overlapSeconds/2,
   keepEnd:Math.min(duration,start+stride+overlapSeconds/2)});
  if(start+windowSeconds>=duration)break;
 }
 return out;
}

export async function recognise(audioBuffer,onProgress=()=>{},pitchEstimator=null){
 const seconds=Number.isFinite(audioBuffer?.duration)?audioBuffer.duration:audioBuffer?.length/audioBuffer?.sampleRate;
 if(!audioBuffer||!Number.isFinite(seconds))throw Error('No recorded audio to analyse');
 const windows=recordingWindows(seconds);
 onProgress('Loading Spotify Basic Pitch (first use needs a network connection)…');
 const {library,model}=await engine();
 const allEvents=[],summary={checked:0,octavesCorrected:0,pitchCorrected:0,noteSplits:0,
  pausesRestored:0,boundariesTrimmed:0,noiseRejected:0,review:0};
 let rawNoteCount=0;
 for(let index=0;index<windows.length;index++){
  const window=windows[index];
  onProgress('Preparing section '+(index+1)+' of '+windows.length+'…');
  const pcm=resampleMono(audioBuffer,window.seconds,window.start);
  const frames=[],onsets=[],contours=[];
  await model.evaluateModel(pcm,(f,o,c)=>{frames.push(...f);onsets.push(...o);contours.push(...c)},
   progress=>onProgress('Analysing section '+(index+1)+'/'+windows.length+' · '+Math.round(progress*100)+'%'));
  let noteFrames=library.outputToNotesPoly(frames,onsets,.25,.25,5);
  if(typeof library.addPitchBendsToNoteEvents==='function'&&contours.length){
   try{noteFrames=library.addPitchBendsToNoteEvents(contours,noteFrames)}
   catch(_){/* Contours are optional; preserve recognised discrete notes. */}
  }
  const raw=library.noteFramesToTime(noteFrames);rawNoteCount+=raw.length;
  const verified=verifyPerformance(raw,pcm,22050,pitchEstimator);
  for(const [key,value] of Object.entries(verified.summary))summary[key]=(summary[key]||0)+value;
  const section=toSingleMelody(verified.notes,window.seconds,pcm,22050,true);
  for(const event of section){
   const absoluteStart=event.start+window.start,absoluteEnd=event.end+window.start;
   const start=Math.max(absoluteStart,window.keepStart),end=Math.min(absoluteEnd,window.keepEnd);
   if(end-start<.025)continue;
   const clipped=start>absoluteStart+.001||end<absoluteEnd-.001;
   const points=event.midi===null?[]:[{t:0,midi:event.midi,confidence:event.confidence},
    ...(event.points||[]).map(p=>({...p,t:p.t+absoluteStart-start}))
     .filter(p=>p.t>0&&p.t<end-start)];
   allEvents.push({...event,start,end,duration:end-start,points,sectionIndex:index,
    qualityStatus:clipped&&event.midi!==null?'review':event.qualityStatus});
  }
  // Let the UI update between sections; the entire decoded recording is retained.
  await new Promise(resolve=>setTimeout(resolve,0));
 }
 const ordered=allEvents.sort((a,b)=>a.start-b.start||a.sectionIndex-b.sectionIndex);
 const combined=[];
 for(const event of ordered){
  const prev=combined.at(-1);
  if(canJoinWindowNotes(prev,event,audioBuffer)){
   prev.end=Math.max(prev.end,event.end);prev.duration=prev.end-prev.start;
   prev.confidence=Math.min(prev.confidence,event.confidence);
   prev.qualityStatus='review'; // Independent reattack near a seam needs teacher review.
   for(const p of event.points||[]){
    const t=p.t+event.start-prev.start;
    if(t>0&&t<prev.duration)prev.points.push({...p,t});
   }
  }else if(event.end>event.start+.024){
   combined.push({...event});
  }
 }
 const first=combined.find(e=>e.midi!==null),last=[...combined].reverse().find(e=>e.midi!==null);
 if(!first||!last)throw Error('Spotify Basic Pitch could not detect clear melody notes');
 const events=combined.filter(e=>e.end>first.start&&e.start<last.end)
  .map(({sectionIndex,...e})=>{
   const start=Math.max(0,e.start-first.start),end=Math.min(last.end-first.start,e.end-first.start);
   return {...e,start,end,duration:end-start};
  }).filter(e=>e.duration>=.025);
 return {events,rawNoteCount,engine:'Spotify Basic Pitch 1.0.1',
  octaveCheck:{checked:summary.checked,corrected:summary.octavesCorrected,review:summary.review},
  verification:summary};
}
