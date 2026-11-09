/* Human recording comparison — TEST only, original code © 2026 Music Score Studio.
   Uses user-supplied reference scores, not model-generated pseudo-ground-truth.
   No sound samples or human audio are included, sent or stored. AGPL-3.0. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.HumHumanCheck=api})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 const MAX_NOTES=350,MAX_SECONDS=120;
 function referenceEvents(data,core){
  if(!core?.validateScore||!core?.beatSeconds)throw Error('Music score support is unavailable');
  const notes=core.validateScore(data),secondsPerBeat=core.beatSeconds(Number(data.tempo),data.meter);
  if(!Number.isFinite(secondsPerBeat)||secondsPerBeat<=0)throw Error('Invalid score tempo');
  const events=[];let cursor=0;
  for(const note of notes){
   const duration=note.beats*secondsPerBeat;
   if(note.midi!==null)events.push({start:cursor,end:cursor+duration,midi:note.midi});
   cursor+=duration;
   if(cursor>MAX_SECONDS+.0001)throw Error('Use a reference excerpt of up to 2 minutes');
  }
  if(events.length<2)throw Error('Reference needs at least two notes');
  if(events.length>MAX_NOTES)throw Error('Reference has too many notes for this comparison');
  const origin=events[0].start;
  return events.map(e=>({...e,start:e.start-origin,end:e.end-origin}));
 }
 function compare(truth,found){
  const expected=(Array.isArray(truth)?truth:[]).filter(n=>Number.isFinite(n.midi));
  const actual=(Array.isArray(found)?found:[]).filter(n=>Number.isFinite(n.midi));
  if(expected.length<2||expected.length>MAX_NOTES||actual.length>MAX_NOTES)
   throw Error('Choose a short melody with 2–350 recognised notes');
  const n=expected.length,m=actual.length,score=Array.from({length:n+1},()=>new Uint16Array(m+1));
  for(let i=0;i<=n;i++)score[i][0]=i;
  for(let j=0;j<=m;j++)score[0][j]=j;
  for(let i=1;i<=n;i++)for(let j=1;j<=m;j++){
   const sub=score[i-1][j-1]+(Math.round(expected[i-1].midi)===Math.round(actual[j-1].midi)?0:1);
   score[i][j]=Math.min(sub,score[i-1][j]+1,score[i][j-1]+1);
  }
  let i=n,j=m,matched=0,incorrect=0,missing=0,extra=0,octaveErrors=0;
  const differences=[],pairs=[];
  while(i>0||j>0){
   const same=i>0&&j>0&&Math.round(expected[i-1].midi)===Math.round(actual[j-1].midi);
   if(same&&score[i][j]===score[i-1][j-1]){matched++;pairs.unshift({expected:i-1,actual:j-1,difference:0});i--;j--;continue}
   if(i>0&&j>0&&score[i][j]===score[i-1][j-1]+1){
    incorrect++;const difference=Math.round(actual[j-1].midi-expected[i-1].midi);
    differences.push(difference);if(Math.abs(difference)===12)octaveErrors++;
    pairs.unshift({expected:i-1,actual:j-1,difference});i--;j--;continue;
   }
   if(i>0&&score[i][j]===score[i-1][j]+1){missing++;i--;continue}
   if(j>0&&score[i][j]===score[i][j-1]+1){extra++;j--;continue}
   throw Error('Cannot align note sequence');
  }
  const shiftCounts=new Map();
  for(const p of pairs)shiftCounts.set(p.difference,(shiftCounts.get(p.difference)||0)+1);
  const shifts=[...shiftCounts].sort((a,b)=>b[1]-a[1]||Math.abs(a[0])-Math.abs(b[0]));
  const dominant=shifts[0],likelyShift=dominant&&pairs.length>=3&&dominant[0]!==0&&
   dominant[1]/pairs.length>=.75?dominant[0]:null;
  return {expected:n,recognised:m,matched,incorrect,missing,extra,octaveErrors,
   accuracy:matched/Math.max(n,m,1),editDistance:score[n][m],likelyShift,
   alignedPairs:pairs};
 }
 return {MAX_NOTES,MAX_SECONDS,referenceEvents,compare};
});
