/*
 * Music Score Studio Hum to Compose TEST — Spotify Basic Pitch integration adapter.
 * Adapter copyright (c) 2026 Music Score Studio contributors, AGPL-3.0.
 *
 * Spotify Basic Pitch is Copyright 2022 Spotify AB, licensed Apache-2.0:
 * https://github.com/spotify/basic-pitch-ts/blob/main/LICENSE
 * A full licence copy is included in hum-to-compose-basic-pitch-LICENSE.txt.
 * No Spotify code is copied into this adapter. Spotify does not endorse this tool.
 *
 * The pinned library and model are fetched only when the user chooses the
 * experimental engine. Recorded audio is decoded and inferred in this browser.
 */

export const BASIC_PITCH_VERSION = '@spotify/basic-pitch@1.0.1';
export const BASIC_PITCH_MODULE = 'https://esm.sh/@spotify/basic-pitch@1.0.1?bundle';
export const BASIC_PITCH_MODEL =
 'https://cdn.jsdelivr.net/gh/spotify/basic-pitch-ts@2d498f82b61c71898edf0e8dd661b99076676c8b/model/model.json';

let cachedEngine=null;
async function engine(){
 if(!cachedEngine){
  cachedEngine=(async()=>{
   const library=await import(BASIC_PITCH_MODULE);
   if(!library.BasicPitch||!library.outputToNotesPoly||!library.noteFramesToTime)
    throw Error('Spotify Basic Pitch module exports were not available');
   const model=new library.BasicPitch(BASIC_PITCH_MODEL);
   await model.model; // Fail immediately if the model or weights cannot be loaded.
   return {library,model};
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

/* Basic Pitch can return simultaneous notes. This is an experimental
   single-stave monophonic adapter: keep the strongest active note per
   interval. Preserve separate attacks even when the repeated pitch matches. */
export function toSingleMelody(noteEvents,maxDuration=20){
 if(!Array.isArray(noteEvents))return [];
 const clean=noteEvents.map((n,index)=>{
  const start=Math.max(0,Number(n.startTimeSeconds));
  const duration=Number(n.durationSeconds),pitch=Math.round(Number(n.pitchMidi));
  const end=Math.min(maxDuration,start+duration);
  return {index,start,end,pitch,amplitude:Math.max(0,Math.min(1,Number(n.amplitude)||0))};
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
   last={index:id,start,end,duration:end-start,midi:pitch,confidence:best?Math.max(.25,best.amplitude):1,points:[]};
   timeline.push(last);
  }
 }
 const first=timeline.find(n=>n.midi!==null),lastPitch=[...timeline].reverse().find(n=>n.midi!==null);
 if(!first||!lastPitch)return [];
 const start=first.start,end=lastPitch.end;
 return timeline.filter(n=>n.end>start&&n.start<end).map(n=>({
  start:Math.max(0,n.start-start),end:Math.min(end-start,n.end-start),
  duration:Math.min(end,n.end)-Math.max(start,n.start),
  midi:n.midi,confidence:n.confidence,points:n.midi===null?[]:[{t:0,midi:n.midi,confidence:n.confidence}]
 })).filter(n=>n.duration>=.025).slice(0,256);
}

export async function recognise(audioBuffer,onProgress=()=>{}){
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
 const melody=toSingleMelody(raw,20);
 if(!melody.some(n=>n.midi!==null))throw Error('Spotify Basic Pitch could not detect clear melody notes');
 return {events:melody,rawNoteCount:raw.length,engine:'Spotify Basic Pitch 1.0.1'};
}
