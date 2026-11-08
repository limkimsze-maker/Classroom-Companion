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
export function resampleMono(audio,limitSeconds=20){
 if(!audio||!Number.isFinite(audio.sampleRate)||audio.sampleRate<8000||audio.numberOfChannels<1)
  throw Error('Unsupported audio buffer');
 const rate=audio.sampleRate,targetRate=22050;
 const count=Math.min(audio.length,Math.round(Math.max(0,limitSeconds)*rate));
 const channels=Array.from({length:Math.min(2,audio.numberOfChannels)},(_,i)=>audio.getChannelData(i));
 if(count<Math.round(rate*.12))throw Error('Audio is too short');
 const mono=new Float32Array(count);
 for(let i=0;i<count;i++){
  let sum=0;for(const channel of channels)sum+=channel[i]||0;
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
  const clean=before.length>=2&&after.length>=2&&before.every(x=>x===1)&&after.every(x=>x===2);
  const edge=clean?(reads[switchAt-1].t+reads[switchAt].t)/2:null;
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
export function toSingleMelody(noteEvents,maxDuration=20){
 if(!Array.isArray(noteEvents))return [];
 const clean=noteEvents.map((n,index)=>{
  const start=Math.max(0,Number(n.startTimeSeconds));
  const duration=Number(n.durationSeconds),pitch=Math.round(Number(n.pitchMidi));
  const end=Math.min(maxDuration,start+duration);
  return {index,start,end,pitch,octaveStatus:n.octaveStatus||'unchecked',qualityStatus:n.qualityStatus||'unchecked',amplitude:Math.max(0,Math.min(1,Number(n.amplitude)||0))};
 }).filter(n=>Number.isFinite(n.start)&&Number.isFinite(n.end)&&n.end-n.start>=.06&&n.pitch>=36&&n.pitch<=95);
 if(!clean.length)return [];
 const boundaries=[...new Set(clean.flatMap(n=>[n.start,n.end]))].sort((a,b)=>a-b);
 let last=null;const timeline=[];
 for(let i=0;i<boundaries.length-1;i++){
  const start=boundaries[i],end=boundaries[i+1];
  if(end-start<.0001)continue;
  const active=clean.filter(n=>n.start<=start+.00001&&n.end>=end-.00001)
   .sort((a,b)=>b.amplitude-a.amplitude||b.start-a.start||a.index-b.index);
  const best=active[0]||null,id=best?best.index:null,pitch=best?best.pitch:null;
  if(last&&last.index===id&&Math.abs(last.end-start)<.0001){last.end=end;last.duration=end-last.start}
  else{
   last={index:id,start,end,duration:end-start,midi:pitch,confidence:best?((best.octaveStatus==='corrected'||best.octaveStatus==='review'||best.qualityStatus==='corrected'||best.qualityStatus==='review')?Math.min(.75,Math.max(.25,best.amplitude)):Math.max(.25,best.amplitude)):1,octaveStatus:best?.octaveStatus||'unchecked',qualityStatus:best?.qualityStatus||'unchecked',points:[]};
   timeline.push(last);
  }
 }
 const first=timeline.find(n=>n.midi!==null),lastPitch=[...timeline].reverse().find(n=>n.midi!==null);
 if(!first||!lastPitch)return [];
 const start=first.start,end=lastPitch.end;
 return timeline.filter(n=>n.end>start&&n.start<end).map(n=>({
  start:Math.max(0,n.start-start),end:Math.min(end-start,n.end-start),
  duration:Math.min(end,n.end)-Math.max(start,n.start),
  midi:n.midi,confidence:n.confidence,octaveStatus:n.octaveStatus,qualityStatus:n.qualityStatus,points:n.midi===null?[]:[{t:0,midi:n.midi,confidence:n.confidence}]
 })).filter(n=>n.duration>=.025).slice(0,256);
}

export async function recognise(audioBuffer,onProgress=()=>{},pitchEstimator=null){
 if(!audioBuffer)throw Error('No recorded audio to analyse');
 onProgress('Preparing audio for Spotify Basic Pitch…');
 const audio=resampleMono(audioBuffer,20);
 onProgress('Loading Spotify Basic Pitch (first use needs a network connection)…');
 const {library,model}=await engine();
 const frames=[],onsets=[];
 onProgress('Analysing melody with Spotify Basic Pitch…');
 await model.evaluateModel(audio,(f,o,_contours)=>{frames.push(...f);onsets.push(...o)},
  pct=>onProgress('Analysing Spotify Basic Pitch… '+Math.round(pct*100)+'%'));
 const raw=library.noteFramesToTime(library.outputToNotesPoly(frames,onsets,.25,.25,5));
 onProgress('Verifying pitch, pauses and note boundaries against the recording…');
 const verified=verifyPerformance(raw,audio,22050,pitchEstimator);
 const melody=toSingleMelody(verified.notes,20);
 if(!melody.some(n=>n.midi!==null))throw Error('Spotify Basic Pitch could not detect clear melody notes');
 return {events:melody,rawNoteCount:raw.length,engine:'Spotify Basic Pitch 1.0.1',octaveCheck:{checked:verified.summary.checked,corrected:verified.summary.octavesCorrected,review:verified.summary.review},verification:verified.summary};
}
