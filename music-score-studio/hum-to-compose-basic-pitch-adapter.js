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

/* Basic Pitch can return simultaneous notes. This is an experimental
   single-stave monophonic adapter: keep the strongest active note per
   interval. Preserve separate attacks even when the repeated pitch matches. */
export function toSingleMelody(noteEvents,maxDuration=20){
 if(!Array.isArray(noteEvents))return [];
 const clean=noteEvents.map((n,index)=>{
  const start=Math.max(0,Number(n.startTimeSeconds));
  const duration=Number(n.durationSeconds),pitch=Math.round(Number(n.pitchMidi));
  const end=Math.min(maxDuration,start+duration);
  return {index,start,end,pitch,octaveStatus:n.octaveStatus||'unchecked',amplitude:Math.max(0,Math.min(1,Number(n.amplitude)||0))};
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
   last={index:id,start,end,duration:end-start,midi:pitch,confidence:best?(best.octaveStatus==='corrected'||best.octaveStatus==='review'?Math.min(.75,Math.max(.25,best.amplitude)):Math.max(.25,best.amplitude)):1,octaveStatus:best?.octaveStatus||'unchecked',points:[]};
   timeline.push(last);
  }
 }
 const first=timeline.find(n=>n.midi!==null),lastPitch=[...timeline].reverse().find(n=>n.midi!==null);
 if(!first||!lastPitch)return [];
 const start=first.start,end=lastPitch.end;
 return timeline.filter(n=>n.end>start&&n.start<end).map(n=>({
  start:Math.max(0,n.start-start),end:Math.min(end-start,n.end-start),
  duration:Math.min(end,n.end)-Math.max(start,n.start),
  midi:n.midi,confidence:n.confidence,octaveStatus:n.octaveStatus,points:n.midi===null?[]:[{t:0,midi:n.midi,confidence:n.confidence}]
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
 onProgress('Checking octaves against the original audio…');
 const octaveCheck=verifyOctaves(raw,audio,22050,pitchEstimator);
 const melody=toSingleMelody(octaveCheck.notes,20);
 if(!melody.some(n=>n.midi!==null))throw Error('Spotify Basic Pitch could not detect clear melody notes');
 return {events:melody,rawNoteCount:raw.length,engine:'Spotify Basic Pitch 1.0.1',octaveCheck:{checked:octaveCheck.checked,corrected:octaveCheck.corrected,review:octaveCheck.review}};
}
