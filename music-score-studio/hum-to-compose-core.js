/* Hum to Compose TEST — pure signal/music functions, no microphone or network access.
   Experimental: return uncertainty instead of claiming infallible transcription. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.HumCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const METERS={'2/4':{beats:2,upper:2,lower:4,pulse:1},'3/4':{beats:3,upper:3,lower:4,pulse:1},'4/4':{beats:4,upper:4,lower:4,pulse:1},'6/8':{beats:3,upper:6,lower:8,pulse:1.5}};
// The isolated recogniser supports up to 40 notated bars, not a fixed 64 beats.
// In particular, a 20-second 6/8 recording at a fast tempo can exceed 64 beats.
const MAX_TRANSCRIPTION_BARS=40;
function maxTranscriptionBeats(meter){return METERS[meter].beats*MAX_TRANSCRIPTION_BARS}
const LENGTHS=[4,3,2,1.5,1,.75,.5,.375,.25,.125];
const NAMES={'0.125':'Demisemiquaver','0.25':'Semiquaver','0.375':'Dotted semiquaver','0.5':'Quaver','0.75':'Dotted quaver','1':'Crotchet','1.5':'Dotted crotchet','2':'Minim','3':'Dotted minim','4':'Semibreve'};
const NATURAL=[0,2,4,5,7,9,11],SHARP=[[0,0],[0,1],[1,0],[1,1],[2,0],[3,0],[3,1],[4,0],[4,1],[5,0],[5,1],[6,0]],FLAT=[[0,0],[1,-1],[1,0],[2,-1],[2,0],[3,0],[4,-1],[4,0],[5,-1],[5,0],[6,-1],[6,0]];
function beatSeconds(bpm,meter){if(!METERS[meter]||!(bpm>0))throw Error('Invalid tempo or metre');return 60/bpm*(meter==='6/8'?2/3:1)}
function rmsOf(buf){let x=0;for(let i=0;i<buf.length;i++)x+=buf[i]*buf[i];return Math.sqrt(x/buf.length)}
function estimatePitch(buf,rate,previousMidi=null){
 const rms=rmsOf(buf);if(rms<.012)return {midi:null,confidence:0,rms,reason:'silence'};
 const minLag=Math.max(2,Math.floor(rate/850)),maxLag=Math.min(Math.floor(rate/90),Math.floor(buf.length/3));
 const count=Math.min(1500,buf.length-maxLag-2);if(maxLag<=minLag+2||count<100)return {midi:null,confidence:0,rms,reason:'buffer'};
 const yin=new Float32Array(maxLag+1);let sum=0;
 for(let lag=1;lag<=maxLag;lag++){let diff=0;for(let i=0;i<count;i++){const d=buf[i]-buf[i+lag];diff+=d*d}sum+=diff;yin[lag]=diff*lag/(sum||1)}
 let first=-1,best=-1,min=Infinity;
 for(let lag=minLag;lag<maxLag;lag++){if(yin[lag]<min){min=yin[lag];best=lag}
  if(first<0&&yin[lag]<.16&&yin[lag]<=yin[lag-1]&&yin[lag]<=yin[lag+1])first=lag}
 let lag=first>=0?first:best;if(lag<0||yin[lag]>.23)return {midi:null,confidence:Math.max(0,1-min),rms,reason:'noise'};
 // Consider a subharmonic only when the octave-down correlation is also convincing.
 const twice=lag*2;
 if(twice<maxLag-1&&yin[twice]<.19&&yin[twice]-yin[lag]<.065){
  if(previousMidi!==null){const original=69+12*Math.log2(rate/lag/440),lower=original-12;
   if(Math.abs(lower-previousMidi)+2<Math.abs(original-previousMidi))lag=twice}
  else if(yin[twice]+.015<yin[lag])lag=twice;
 }
 let refined=lag;
 if(lag>minLag&&lag<maxLag-1){const a=yin[lag-1],b=yin[lag],c=yin[lag+1],den=2*(a-2*b+c);if(Math.abs(den)>1e-10)refined+=(a-c)/den}
 const hz=rate/refined;
 if(!(hz>=90&&hz<=850))return {midi:null,confidence:0,rms,reason:'range'};
 const raw=69+12*Math.log2(hz/440);
 const rounded=Math.round(raw),cents=Math.abs(raw-rounded)*100,confidence=Math.max(0,Math.min(1,1-yin[lag]-(cents>45?.06:0)));
 return {midi:raw,confidence,rms,hz,uncertain:confidence<.86||cents>38};
}
function pitchName(m){if(m===null)return 'Rest';const n=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];return n[((m%12)+12)%12]+(Math.floor(m/12)-1)}
function spelling(midi,preferFlat=false){const cls=((midi%12)+12)%12,octave=Math.floor(midi/12)-1;
 const [step,alter]=(preferFlat?FLAT:SHARP)[cls];return {step,alter,octave}}
function midiFromSpelling(s){return 12*(s.octave+1)+NATURAL[s.step]+s.alter}
function changeAccidental(note,alter){if(note.midi===null)return note;const s=note.spelling?{...note.spelling}:spelling(note.midi);s.alter=alter;
 const midi=midiFromSpelling(s);return {...note,midi,spelling:s,uncertain:false,reviewed:true}}
function roundGrid(x){return Math.round(x*4)/4}
function transcribe(input,bpm,meter='4/4'){
 if(!input||!input.length)return [];
 const dt=beatSeconds(bpm,meter),raw=input.slice().filter(f=>Number.isFinite(f.t)).sort((a,b)=>a.t-b.t).map(f=>({...f,pitch:f.pitch==null?null:Math.round(f.pitch),confidence:typeof f.confidence==='number'?f.confidence:.75,rms:f.rms||0}));
 if(!raw.length)return [];
 const intervals=raw.slice(1).map((f,i)=>f.t-raw[i].t).filter(t=>t>0&&t<.2).sort((a,b)=>a-b);
 const step=intervals.length?intervals[Math.floor(intervals.length/2)]:.03;
 // Only interpolate brief likely detector dropouts when acoustic energy was present.
 for(let i=1;i<raw.length-1;i++)if(raw[i].pitch===null&&raw[i].rms>.016&&raw[i-1].pitch!==null&&raw[i+1].pitch===raw[i-1].pitch&&raw[i+1].t-raw[i-1].t<.105){
  raw[i].pitch=raw[i-1].pitch;raw[i].confidence=Math.min(raw[i-1].confidence,raw[i+1].confidence,.7);raw[i].interpolated=true;
 }
 // Remove isolated unvoiced pitch glitches only when both immediate neighbours agree.
 for(let i=1;i<raw.length-1;i++)if(raw[i].pitch!==null&&raw[i-1].pitch===raw[i+1].pitch&&raw[i].pitch!==raw[i-1].pitch&&raw[i+1].t-raw[i-1].t<.12){
  raw[i].pitch=raw[i-1].pitch;raw[i].confidence=Math.min(raw[i].confidence,.69);
 }
 const spans=[];let start=0;
 function flush(i){const slice=raw.slice(start,i);const dur=(i<raw.length?raw[i].t:raw[i-1].t+step)-raw[start].t;
  if(dur<Math.max(.045,step*1.5))return;
  const pitched=slice.filter(f=>f.pitch!==null);const mean=pitched.length?pitched.reduce((a,b)=>a+b.confidence,0)/pitched.length:1;
  spans.push({begin:raw[start].t,end:(i<raw.length?raw[i].t:raw[i-1].t+step),midi:raw[start].pitch,confidence:mean,interpolated:slice.some(f=>f.interpolated),rms:Math.max(...slice.map(f=>f.rms))});
 }
 for(let i=1;i<=raw.length;i++){
  const prev=raw[i-1],curr=raw[i],last=raw[start],different=i===raw.length||curr.pitch!==last.pitch;
  const samePitchNewAttack=!different&&i<raw.length&&curr.pitch!==null&&i-start>=2&&curr.onset===true&&curr.t-raw[start].t>=.065;
  const acousticAttack=!different&&i<raw.length&&curr.pitch!==null&&i-start>=3&&curr.rms>.02&&prev.rms>.006&&curr.rms>prev.rms*1.9&&prev.rms<raw[i-2].rms*.8&&curr.t-raw[start].t>=.085;
  if(different||samePitchNewAttack||acousticAttack){flush(i);start=i}
 }
 const voiced=spans.filter(s=>s.midi!==null);if(!voiced.length)return [];
 const begin=voiced[0].begin,tail=voiced[voiced.length-1].end;let cursor=0;const result=[];
 for(const s of spans){if(s.end<=begin||s.begin>=tail)continue;
  const first=Math.max(0,roundGrid((s.begin-begin)/dt)),last=Math.max(first+.25,roundGrid((s.end-begin)/dt));
  if(first>cursor+.125)result.push({midi:null,beats:roundGrid(first-cursor),confidence:1,uncertain:false});
  const startBeat=Math.max(first,cursor);
  if(last<=startBeat)continue;
  const beats=roundGrid(last-startBeat);
  if(beats>=.25)result.push({midi:s.midi,beats,confidence:+s.confidence.toFixed(2),uncertain:s.midi!==null&&(s.confidence<.86||s.interpolated||Math.abs((s.end-s.begin)/dt-beats)>.22)});
  cursor=Math.max(cursor,last);
 }
 // Explicitly never merge equal adjacent notes: a separate attack matters.
 const limit=maxTranscriptionBeats(meter);let total=0;
 return result.filter(n=>{total+=n.beats;return n.beats>0&&total<=limit+.001}).map(n=>({...n,reviewed:false}));
}
function lengthParts(beats){let remaining=Math.round(beats*8)/8;const parts=[];
 while(remaining>.0001&&parts.length<100){const v=LENGTHS.find(x=>x<=remaining+.0001);if(v){parts.push(v);remaining-=v}else{parts.push(.125);remaining-=.125}}
 return parts;
}
function measures(notes,meter='4/4'){
 const spec=METERS[meter];if(!spec)throw Error('Invalid metre');
 const bars=[[]];let used=0;
 notes.forEach((note,origin)=>{
  if(!Number.isFinite(note.beats)||note.beats<=0||note.beats>64)throw Error('Invalid or unsupported note duration');
  let remaining=Math.max(0,Math.round(note.beats*8)/8),first=true;
  // Every valid bar must be rendered and exported; do not silently truncate longer scores.
  while(remaining>.0001){
   if(spec.beats-used<.0001){bars.push([]);used=0}
   const available=Math.min(remaining,spec.beats-used),parts=lengthParts(available);
   for(const part of parts){const bar=bars[bars.length-1],prior=bar[bar.length-1],event={...note,beats:part,origin,tiePrev:!first&&note.midi!==null,tieNext:false};
    if(prior&&prior.origin===origin&&note.midi!==null)prior.tieNext=true;
    bar.push(event);first=false;used+=part;
   }
   // Link the final event in the previous bar to the next bar's first event.
   if(remaining-available>.0001&&note.midi!==null)bars[bars.length-1][bars[bars.length-1].length-1].tieNext=true;
   remaining-=available;
  }
 });
 if(bars.length>1&&bars[bars.length-1].length===0)bars.pop();
 // A whole-measure rest uses the semibreve rest symbol in any metre.
 // Keep the real crotchet-beat duration unchanged for playback.
 for(const bar of bars)if(bar.length===1&&bar[0].midi===null&&
   Math.abs(bar[0].beats-spec.beats)<.0001)bar[0].fullMeasureRest=true;
 return bars;
}
/* Key signatures are explicit teacher choices; no automatic guessing of key.
   The defaults are the conventional circle-of-fifths alterations.
   Per-bar accidental memory resets, except a tie which applies only to the
   held note and never to subsequent untied notes. */
const SHARP_STEPS=[3,0,4,1,5,2,6],FLAT_STEPS=[6,2,5,1,4,0,3];
const KEY_NAMES={'-7':'C♭ major','-6':'G♭ major','-5':'D♭ major','-4':'A♭ major','-3':'E♭ major','-2':'B♭ major','-1':'F major','0':'C major / A minor','1':'G major','2':'D major','3':'A major','4':'E major','5':'B major','6':'F♯ major','7':'C♯ major'};
function keyDefaults(fifths=0){
 if(!Number.isInteger(fifths)||fifths<-7||fifths>7)throw Error('Invalid key signature');
 const map=[0,0,0,0,0,0,0],steps=fifths>0?SHARP_STEPS:FLAT_STEPS;
 for(let i=0;i<Math.abs(fifths);i++)map[steps[i]]=fifths>0?1:-1;
 return map;
}
/* Choose the nearest conventional written spelling for the selected key.
   A key signature changes note spelling, never the sounding MIDI pitch.
   Do not overwrite any teacher-supplied note.spelling. The automatic key
   convention also handles C-flat, F-flat, B-sharp and E-sharp correctly. */
function spellingForKey(midi,fifths=0){
 if(!Number.isInteger(midi)||midi<0||midi>127)throw Error('Invalid MIDI pitch');
 const defaults=keyDefaults(fifths);
 if(fifths===0)return spelling(midi);
 const oct=Math.floor(midi/12)-1,prefer=spelling(midi,fifths<0),candidates=[];
 for(let o=oct-1;o<=oct+1;o++)for(let step=0;step<7;step++)
  for(let alter=-1;alter<=1;alter++){
   const candidate={step,alter,octave:o};
   if(midiFromSpelling(candidate)!==midi)continue;
   const distance=Math.abs(alter-defaults[step]);
   const opposing=alter!==0&&Math.sign(alter)!==Math.sign(fifths);
   const defaultMatch=candidate.step===prefer.step&&candidate.octave===prefer.octave;
   const score=distance*10+(opposing?3:0)+(defaultMatch?0:.5);
   candidates.push({candidate,score});
  }
 candidates.sort((a,b)=>a.score-b.score);
 return candidates[0]?.candidate||prefer;
}
function displayAccidentals(bars,fifths=0){const defaults=keyDefaults(fifths);return bars.map(bar=>{const active=new Map();

 return bar.map(n=>{if(n.midi===null)return {...n,displayAccidental:null};
   const s=n.spelling||spellingForKey(n.midi,fifths);
   const key=s.step+':'+s.octave,old=active.has(key)?active.get(key):defaults[s.step];
   // A tied accidental carries across the barline only to the tied note.
   // It must NOT affect the next untied note's accidental state.
   if(n.tiePrev)return {...n,spelling:s,displayAccidental:null};
   const show=s.alter!==old?(s.alter===1?'♯':s.alter===-1?'♭':'♮'):null;
   active.set(key,s.alter);return {...n,spelling:s,displayAccidental:show};
 })})}
/* Fit total notated duration to the first-to-last voiced span.
   This estimates playback speed only; it cannot fix individual rhythm or pitch errors. */
function matchRecordedTempo(notes,frames,meter='4/4'){
 if(!METERS[meter]||!Array.isArray(notes)||!Array.isArray(frames)||!notes.length)return null;
 const voiced=frames.filter(f=>Number.isFinite(f.t)&&f.pitch!==null&&Number.isFinite(f.pitch)&&f.confidence>=.55);
 if(voiced.length<3)return null;
 const first=voiced[0].t,last=voiced[voiced.length-1].t;
 const gaps=frames.slice(1).map((f,i)=>f.t-frames[i].t).filter(g=>g>.005&&g<.15).sort((a,b)=>a-b);
 const step=gaps.length?gaps[Math.floor(gaps.length/2)]:.03;
 const seconds=last-first+step,beats=notes.reduce((sum,n)=>sum+n.beats,0);
 if(!(seconds>=.15&&beats>=.25))return null;
 const tempo=Math.round((meter==='6/8'?40:60)*beats/seconds);
 return tempo>=40&&tempo<=200?tempo:null;
}

/* Preserve detected absolute timing and fractional MIDI, separate from quantised notation.
   A synthetic playback can follow these, while Original hum replays the actual audio. */
function performanceFromFrames(frames){
 if(!Array.isArray(frames)||!frames.length)return [];
 const raw=frames.filter(f=>Number.isFinite(f.t)&&f.t>=0)
  .sort((a,b)=>a.t-b.t).map(f=>({
   t:f.t, midi:Number.isFinite(f.rawMidi)?f.rawMidi:(Number.isFinite(f.pitch)?f.pitch:null),
   confidence:Number.isFinite(f.confidence)?Math.max(0,Math.min(1,f.confidence)):.75,
   rms:Number.isFinite(f.rms)?f.rms:.1,onset:f.onset===true
  })).filter(f=>f.midi===null||f.midi>=36&&f.midi<=95);
 if(!raw.length)return [];
 const gaps=raw.slice(1).map((f,i)=>f.t-raw[i].t).filter(x=>x>.003&&x<.16).sort((a,b)=>a-b);
 const step=gaps.length?gaps[Math.floor(gaps.length/2)]:.03;
 // Isolated low-confidence outliers and short high-energy detector dropouts
 // should not create extra attacks or pauses.
 for(let i=1;i<raw.length-1;i++){
  const p=raw[i-1],f=raw[i],n=raw[i+1],close=n.t-p.t<.11;
  if(!close||p.midi===null||n.midi===null||Math.abs(p.midi-n.midi)>.65)continue;
  if(f.midi===null&&f.rms>.016||f.midi!==null&&Math.abs(f.midi-p.midi)>2){
   f.midi=(p.midi+n.midi)/2;f.confidence=Math.min(.68,p.confidence,n.confidence);
  }
 }
 // Hold pitch changes long enough to reject one-frame vibrato/glitches, unless
 // a clear onset occurs. Explicit attacks preserve repeated same-pitch notes.
 const segments=[];let start=0;
 const same=(a,b)=>a.midi===null&&b.midi===null||a.midi!==null&&b.midi!==null&&Math.abs(a.midi-b.midi)<.75;
 function flush(i){
  const part=raw.slice(start,i),end=i<raw.length?raw[i].t:raw[i-1].t+step;
  if(!part.length||end-raw[start].t<Math.min(.045,step*1.5))return;
  const pitched=part.filter(x=>x.midi!==null),midi=pitched.length
   ?pitched.map(x=>x.midi).sort((a,b)=>a-b)[Math.floor(pitched.length/2)]:null;
  const confidence=pitched.length?pitched.reduce((x,f)=>x+f.confidence,0)/pitched.length:1;
  segments.push({start:raw[start].t,end,midi,confidence,
   points:pitched.map(p=>({t:p.t-raw[start].t,midi:p.midi,confidence:p.confidence}))});
 }
 for(let i=1;i<=raw.length;i++){
  const last=raw[start],current=raw[i],prev=raw[i-1];
  if(i===raw.length){flush(i);break}
  const pitchSwitch=!same(current,last)&&
   (i+1===raw.length||same(current,raw[i+1])||current.onset);
  const renewed=!!(current.onset&&current.midi!==null&&same(current,last)&&current.t-last.t>=.065);
  const volumeAttack=current.midi!==null&&last.midi!==null&&same(current,last)&&i>=3&&i-start>=3
   &&current.rms>.025&&prev.rms>.006&&current.rms>prev.rms*2.1
   &&prev.rms<raw[i-2].rms*.75&&current.t-last.t>=.09;
  // Silence needs at least two frames before it is treated as a rest.
  const silence=last.midi!==null&&current.midi===null&&i+1<raw.length&&raw[i+1].midi===null;
  if(pitchSwitch||renewed||volumeAttack||silence){flush(i);start=i}
 }
 const first=segments.find(x=>x.midi!==null),last=[...segments].reverse().find(x=>x.midi!==null);
 if(!first||!last)return [];
 const origin=first.start,tail=last.end;
 const result=[];let cursor=0;
 for(const e of segments){
  if(e.end<=origin||e.start>=tail)continue;
  const start=Math.max(0,e.start-origin),end=Math.min(tail-origin,e.end-origin);
  if(start>cursor+.03)result.push({start:cursor,end:start,duration:start-cursor,midi:null,confidence:1,points:[]});
  if(end>start+.025)result.push({start,end,duration:end-start,midi:e.midi,confidence:e.confidence,
    points:e.points.filter(p=>e.start+p.t>=origin).map(p=>({t:p.t,midi:p.midi,confidence:p.confidence}))});
  cursor=Math.max(cursor,end);
 }
 return result;
}
/* Infer a basic musical pulse from short performed note durations, not
   from total length of an already-quantised score. Mark ambiguity rather
   than promising an objectively correct metre or tempo. */

/* Quantise stabilised performed note/rest events, instead of re-splitting
   noisy frame-by-frame pitch readings. Original event timing is unchanged
   and remains available for detected-melody playback. */
function transcribeDetectedEvents(events,bpm,meter='4/4'){
 if(!Array.isArray(events)||!events.length)return [];
 const beat=beatSeconds(bpm,meter),out=[],limit=maxTranscriptionBeats(meter);let used=0;
 for(const event of events){
  if(!Number.isFinite(event.duration)||event.duration<.025)continue;
  const midi=event.midi===null?null:Math.round(event.midi);
  if(midi!==null&&(midi<36||midi>95))continue;
  const rawBeats=event.duration/beat;
  const beats=Math.max(.25,roundGrid(rawBeats));
  if(used+beats>limit+.001)break;
  const pts=event.points||[];
  const drifting=midi!==null&&pts.length>2&&
    (Math.max(...pts.map(x=>x.midi))-Math.min(...pts.map(x=>x.midi))>1.2);
  const confidence=Number.isFinite(event.confidence)?Math.min(1,Math.max(0,event.confidence)):.75;
  out.push({midi,beats,confidence:+confidence.toFixed(2),
   uncertain:midi!==null&&(confidence<.86||drifting||Math.abs(beats-rawBeats)>.20),
   reviewed:false});
  used+=beats;
 }
 return out.some(x=>x.midi!==null)?out:[];
}
/* Fit an edited score's total duration to the actual detected performance.
   Does not change the pitches or rhythms; useful after importing audio. */
function matchPerformanceTempo(notes,events,meter='4/4'){
 if(!METERS[meter]||!Array.isArray(notes)||!Array.isArray(events))return null;
 const pitches=events.filter(e=>e.midi!==null&&Number.isFinite(e.start)&&Number.isFinite(e.end)&&e.end>e.start);
 if(pitches.length<2)return null;
 const beginning=Math.min(...pitches.map(e=>e.start)),ending=Math.max(...pitches.map(e=>e.end));
 const duration=ending-beginning,beats=notes.reduce((total,n)=>total+(Number(n.beats)||0),0);
 if(duration<.15||beats<.25)return null;
 const candidate=Math.round((meter==='6/8'?40:60)*beats/duration);
 return candidate>=40&&candidate<=200?candidate:null;
}
/* Align note/rest boundaries to ONE shared musical grid.
   Quantising each duration independently accumulates drift. Using absolute
   onset/end positions preserves repeated notes and measured silent gaps,
   while marking large rounding changes for teacher review. */
function transcribeAlignedEvents(events,bpm,meter='4/4'){
 if(!Array.isArray(events)||!events.length||!METERS[meter])return [];
 const beat=beatSeconds(bpm,meter),grid=x=>Math.round(4*x)/4,limit=maxTranscriptionBeats(meter);
 const sorted=events.filter(e=>Number.isFinite(e.start)&&Number.isFinite(e.end)&&
   Number.isFinite(e.duration)&&e.end>e.start+.02)
  .slice().sort((a,b)=>a.start-b.start);
 const out=[];let used=0;
 function insert(midi,length,event,drift){
  if(length<.249||used>=limit)return;
  const beats=Math.min(length,limit-used);
  if(beats<.249)return;
  const confidence=midi===null?1:Number.isFinite(event?.confidence)?Math.min(1,Math.max(0,event.confidence)):.7;
  out.push({midi,beats:+beats.toFixed(2),confidence:+confidence.toFixed(2),
   uncertain:midi!==null&&(confidence<.86||drift||event?.qualityStatus==='review'||
   event?.qualityStatus==='corrected'||event?.octaveStatus==='review'||event?.octaveStatus==='corrected'),
   reviewed:false});
  used+=beats;
 }
 for(const event of sorted){
  if(used>=limit-.001)break;
  const midi=event.midi===null?null:Math.round(event.midi);
  if(midi!==null&&(midi<36||midi>95))continue;
  const begin=Math.max(used,Math.max(0,grid(event.start/beat)));
  if(begin>used+.125)insert(null,begin-used,null,false);
  const quantEnd=Math.max(begin+.25,grid(event.end/beat));
  const finished=Math.max(used+.25,quantEnd);
  const actualLength=event.duration/beat,assigned=finished-used;
  const onsetChanged=Math.abs(begin-event.start/beat)>.20;
  const durationChanged=Math.abs(assigned-actualLength)>.22;
  const pushed=begin>event.start/beat+.24;
  insert(midi,assigned,event,onsetChanged||durationChanged||pushed);
 }
 return out.some(e=>e.midi!==null)?out:[];
}
/* Validate generated score duration and pitch against the 40-bar metre-aware
   transcription limit. Explicit Infinity continues to permit longer teacher scores. */
function auditScore(score,meter,maxBeats=null){
 if(!METERS[meter]||!Array.isArray(score))return {ok:false,reason:'Invalid notation input'};
 const limit=maxBeats===null?maxTranscriptionBeats(meter):maxBeats;
 let beats=0;for(const note of score){
  if(!Number.isFinite(note.beats)||note.beats<.25||Math.round(note.beats*8)!==note.beats*8)
   return {ok:false,reason:'Invalid note or rest duration'};
  if(note.midi!==null&&(!Number.isInteger(note.midi)||note.midi<36||note.midi>95))
   return {ok:false,reason:'Invalid note pitch'};
  beats+=note.beats;
  if(beats>limit+.001)return {ok:false,reason:'Score exceeds the '+limit+'-beat limit'};
 }
 return {ok:score.some(x=>x.midi!==null),beats,reason:!score.length?'Empty score':score.every(x=>x.midi===null)?'No pitched notes':'OK'};
}
/* Adapter for Spotify Basic Pitch NoteEventTime output.
   Keeps this app's monophonic score and playback constraints; concurrent
   pitches are reduced to the loudest active model event, never silently
   treated as a multi-stave score. No Spotify code is copied here. */
function basicPitchToPerformance(noteEvents,maxSeconds=20){
 if(!Array.isArray(noteEvents)||!(maxSeconds>0))return [];
 const candidates=noteEvents.map((e,id)=>({
  id,start:Math.max(0,Number(e.startTimeSeconds)),end:Math.min(maxSeconds,Number(e.startTimeSeconds)+Number(e.durationSeconds)),
  midi:Number(e.pitchMidi),amplitude:Number.isFinite(e.amplitude)?e.amplitude:0
 })).filter(e=>Number.isFinite(e.start)&&Number.isFinite(e.end)&&Number.isFinite(e.midi)&&
   e.midi>=36&&e.midi<=95&&e.end-e.start>=.06&&e.start<maxSeconds);
 if(!candidates.length)return [];
 const first=Math.min(...candidates.map(e=>e.start));
 const boundaries=[...new Set(candidates.flatMap(e=>[e.start,e.end]))].sort((a,b)=>a-b);
 const segments=[];
 for(let i=0;i<boundaries.length-1;i++){
  const begin=boundaries[i],end=boundaries[i+1];
  if(end-begin<.001)continue;
  const active=candidates.filter(e=>e.start<end-.0001&&e.end>begin+.0001)
   .sort((a,b)=>b.amplitude-a.amplitude||a.start-b.start);
  const chosen=active[0]||null,previous=segments.at(-1);
  if(previous&&previous.id===(chosen?chosen.id:null)&&Math.abs(previous.end-begin)<.001){
   previous.end=end;previous.duration=end-previous.start;continue;
  }
  segments.push({id:chosen?chosen.id:null,start:begin,end,duration:end-begin,
   midi:chosen?chosen.midi:null,confidence:chosen?.midi===undefined?1:.8,points:[],
   source:'basic-pitch'});
 }
 return segments.filter(e=>e.end-e.start>=.025).map(e=>({
  start:e.start-first,end:e.end-first,duration:e.duration,midi:e.midi,
  confidence:e.confidence,points:e.midi===null?[]:[{t:0,midi:e.midi,confidence:e.confidence}],
  source:e.source
 }));
}
function estimateNaturalTempo(events,meter='4/4'){
 if(!METERS[meter]||!Array.isArray(events))return {bpm:null,confidence:0};
 const voiced=events.filter(e=>e.midi!==null&&Number.isFinite(e.duration)&&e.duration>=.07);
 if(voiced.length<3)return {bpm:null,confidence:0};
 const durations=events.map(e=>e.duration).filter(d=>Number.isFinite(d)&&d>=.08);
 const preferred=[.25,.5,.75,1,1.5,2,3,4];
 const complexity={'0.25':.08,'0.5':.03,'0.75':.065,'1':0,'1.5':.035,'2':.04,'3':.07,'4':.08};
 const candidates=[];
 for(let bpm=40;bpm<=200;bpm++){
  const beat=beatSeconds(bpm,meter);
  let error=0;
  for(const duration of durations){
   const b=duration/beat;
   // Most simple hummed phrases contain crotchets. Favour conventional
   // beat-level rhythms over arbitrary 3/4 beat subdivisions on ties.
   const cost=v=>Math.pow((b-v)/Math.max(.25,v),2)+(complexity[String(v)]||0);
   error+=Math.min(...preferred.map(cost));
  }
  // Gentle prior only: ambiguous half/double-time remains flagged to teachers.
  error=error/durations.length+.0008*Math.pow((bpm-105)/60,2);
  candidates.push({bpm,error});
 }
 candidates.sort((a,b)=>a.error-b.error);
 const winner=candidates[0],runner=candidates.find(x=>Math.abs(x.bpm-winner.bpm)>12)||candidates[1];
 const separation=runner?Math.max(0,runner.error-winner.error):0;
 return {bpm:winner.bpm,confidence:Math.min(.95,Math.max(.22,separation*8)),ambiguous:separation<.018};
}
/* Portable single-stave MusicXML 4.0 export. Divisions count crotchets,
   including 6/8's dotted-crotchet tempo marking. This faithfully represents
   the verified written notation; it does not pretend to preserve raw audio. */
function scoreToMusicXML(notes,meter='4/4',bpm=96,options={}){
 const clef=options.clef==='bass'?'bass':'treble',fifths=options.fifths??0;
 keyDefaults(fifths);
 if(!Number.isFinite(bpm)||bpm<40||bpm>200)throw Error('Invalid export tempo');
 const quality=auditScore(notes,meter,Infinity);
 if(!quality.ok)throw Error('Cannot export invalid written score: '+quality.reason);
 const escapeXML=text=>String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
 const title=escapeXML(options.title||'My melody'),beats=meter.split('/');
 const durationType=value=>{
  const dotted=[.375,.75,1.5,3].includes(value);
  const undotted=dotted?value/1.5:value;
  const type=({4:'whole',2:'half',1:'quarter',.5:'eighth',.25:'16th',.125:'32nd'})[String(undotted)];
  if(!type)throw Error('Unrepresentable note value: '+value);
  return {type,dotted};
 };
 const bars=displayAccidentals(measures(notes,meter),fifths),letters=['C','D','E','F','G','A','B'];
 let output='<?xml version="1.0" encoding="utf-8"?>\n<!DOCTYPE score-partwise  PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">\n';
 output+='<score-partwise version="4.0"><work><work-title>'+title+'</work-title></work><movement-title>'+title+'</movement-title>';
 output+='<identification><creator type="software">Music Score Studio Hum to Compose TEST</creator></identification>';
 output+='<defaults><scaling><millimeters>7</millimeters><tenths>40</tenths></scaling></defaults>';
 output+='<part-list><score-part id="P1"><part-name>Melody</part-name><part-abbreviation>Mel.</part-abbreviation><score-instrument id="Ib"> <instrument-name>Voice</instrument-name></score-instrument></score-part></part-list><part id="P1">';
 for(let i=0;i<bars.length;i++){
  output+='<measure implicit="no" number="'+(i+1)+'">';
  if(i===0){
   output+='<attributes><divisions>480</divisions><key><fifths>'+fifths+'</fifths><mode>major</mode></key>';
   output+='<time><beats>'+beats[0]+'</beats><beat-type>'+beats[1]+'</beat-type></time>';
   output+='<clef><sign>'+(clef==='bass'?'F':'G')+'</sign><line>'+(clef==='bass'?4:2)+'</line></clef></attributes>';
   const beatUnit=meter==='6/8'?'<beat-unit>quarter</beat-unit><beat-unit-dot/>':'<beat-unit>quarter</beat-unit>';
   output+='<direction placement="above"><direction-type><metronome parentheses="no">'+beatUnit+'<per-minute>'+bpm+'</per-minute></metronome></direction-type><sound tempo="'+(meter==='6/8'?Math.round(bpm*1.5):bpm)+'"/></direction>';
  }
  for(const n of bars[i]){
   const {type,dotted}=durationType(n.fullMeasureRest?4:n.beats);
   const dur=Math.round(n.beats*480);
   output+='<note>';
   if(n.midi===null)output+=n.fullMeasureRest?'<rest measure="yes"/>':'<rest/>';
   else{
    const spell=n.spelling||spellingForKey(n.midi,fifths);
    if(midiFromSpelling(spell)!==n.midi)throw Error('Score has inconsistent note spelling');
    output+='<pitch><step>'+letters[spell.step]+'</step>';
    if(spell.alter)output+='<alter>'+spell.alter+'</alter>';
    output+='<octave>'+spell.octave+'</octave></pitch>';
   }
   output+='<duration>'+dur+'</duration><type>'+type+'</type>';
   if(dotted&&!n.fullMeasureRest)output+='<dot/>';
   if(n.midi!==null){
    if(n.displayAccidental)output+='<accidental>'+({'♯':'sharp','♭':'flat','♮':'natural'}[n.displayAccidental])+'</accidental>';
    if(n.tiePrev)output+='<tie type="stop"/>';
    if(n.tieNext)output+='<tie type="start"/>';
    if(n.tiePrev||n.tieNext){
     output+='<notations>';
     if(n.tiePrev)output+='<tied type="stop"/>';
     if(n.tieNext)output+='<tied type="start"/>';
     output+='</notations>';
    }
   }
   output+='</note>';
  }
  output+='</measure>';
 }
 return output+'</part></score-partwise>';
}
function validateScore(data){if(!data||!METERS[data.meter]||!(data.tempo>=30&&data.tempo<=240)||!Array.isArray(data.notes)||data.notes.length>256)throw Error('Unsupported score file');
 return data.notes.map(n=>{if(n.midi!==null&&(!Number.isInteger(n.midi)||n.midi<36||n.midi>95))throw Error('Invalid pitch');
 if(!Number.isFinite(n.beats)||n.beats<.25||n.beats>64||Math.abs(n.beats*8-Math.round(n.beats*8))>.001)throw Error('Invalid length');
 const s=n.spelling;if(s&&(s.step<0||s.step>6||s.alter<-1||s.alter>1||midiFromSpelling(s)!==n.midi))throw Error('Invalid accidental');
 return {midi:n.midi,beats:n.beats,confidence:typeof n.confidence==='number'?Math.min(1,Math.max(0,n.confidence)):1,uncertain:!!n.uncertain,reviewed:!!n.reviewed,...(s?{spelling:{...s}}:{})};
 })}
return {METERS,LENGTHS,NAMES,KEY_NAMES,keyDefaults,spellingForKey,beatSeconds,rmsOf,estimatePitch,pitchName,spelling,midiFromSpelling,changeAccidental,transcribe,lengthParts,measures,displayAccidentals,scoreToMusicXML,matchRecordedTempo,performanceFromFrames,transcribeDetectedEvents,transcribeAlignedEvents,auditScore,matchPerformanceTempo,basicPitchToPerformance,estimateNaturalTempo,validateScore};
});