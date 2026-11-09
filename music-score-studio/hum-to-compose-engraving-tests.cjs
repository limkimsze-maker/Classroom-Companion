/* Hum to Compose TEST — deterministic SVG engraving verification.
   No browser hardware, microphones, Spotify model or audio assets used.
   Executes the actual single-page renderer with a minimal fake DOM. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('./hum-to-compose-core.js');
const html=fs.readFileSync(path.join(__dirname,'hum-to-compose-test.html'),'utf8');
const script=html.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'The Hum TEST inline application script must be present');
const elements=new Map();
function elem(id){
 if(!elements.has(id))elements.set(id,{
  id,value:id==='meter'?'4/4':id==='tempo'?'96':id==='scoreVolume'?'160':
   id==='instrument'?'piano':'',disabled:false,textContent:'',innerHTML:'',style:{},
  handlers:{},setAttribute(k,v){this[k]=v},getAttribute(k){return this[k]},
  addEventListener(k,fn){this.handlers[k]=fn},click(){return this.handlers.click?.()}
 });
 return elements.get(id);
}
const document={getElementById:elem,querySelectorAll:()=>[],
 querySelector:()=>null,createElement:()=>({style:{},click(){}})};
class FakeAudio{constructor(){this.paused=true;this.src='';this.currentTime=0}
 pause(){this.paused=true}addEventListener(){}}
const window={HumCore:C,isSecureContext:true,addEventListener(){},
 performance:{now:()=>0},location:{search:''}};
const URL={createObjectURL:()=> 'blob:test',revokeObjectURL(){}};
const memory={getItem(){return null},setItem(){}};
new Function('document','window','Audio','URL','localStorage','setTimeout','clearTimeout',script)(
 document,window,FakeAudio,URL,memory,()=>0,()=>{});
async function engraved(signature,notes,options={}){
 const raw=JSON.stringify({meter:signature,tempo:96,notes,...options});
 await elem('file').handlers.change({target:{files:[{
  size:raw.length,text:async()=>raw}],value:''}});
 assert.ok(elem('status').textContent.includes('opened'),elem('status').textContent);
 return elem('score').innerHTML;
}
const events=(svg,type)=>[...svg.matchAll(new RegExp('<g class="event '+type+'[^"]*"[^>]*>[\\s\\S]*?<\\/g>','g'))].map(m=>m[0]);
function notePosition(svg){
 return events(svg,'note').map(g=>{
  const head=g.match(/<ellipse class="head" cx="([^"]+)" cy="([^"]+)"/);
  const stem=g.match(/<line x1="([^"]+)" x2="([^"]+)" y1="([^"]+)" y2="([^"]+)"/);
  return {headX:Number(head?.[1]),headY:Number(head?.[2]),
   stemX:Number(stem?.[1]),stemY1:Number(stem?.[3]),stemY2:Number(stem?.[4])};
 });
}
let passed=0;async function check(name,fn){
 try{await fn();console.log('PASS '+name);passed++}
 catch(err){console.error('FAIL '+name+': '+err.message);process.exitCode=1}
}
(async()=>{
 await check('High quavers have down-stems on the left',async()=>{
  const svg=await engraved('4/4',[{midi:76,beats:.5},{midi:77,beats:.5},{midi:79,beats:3}]);
  const pos=notePosition(svg).slice(0,2);
  assert.equal(pos.length,2);
  assert.ok(pos.every(n=>n.stemX<n.headX&&n.stemY2>n.stemY1));
  assert.match(svg,/class="beam"/);
 });
 await check('Low quavers have up-stems on the right',async()=>{
  const svg=await engraved('4/4',[{midi:60,beats:.5},{midi:62,beats:.5},{midi:64,beats:3}]);
  const pos=notePosition(svg).slice(0,2);
  assert.equal(pos.length,2);
  assert.ok(pos.every(n=>n.stemX>n.headX&&n.stemY2<n.stemY1));
 });
 await check('Cross-bar ties on high notes curve upwards',async()=>{
  const svg=await engraved('4/4',[{midi:76,beats:4.5},{midi:76,beats:1}]);
  const path=svg.match(/<path class="tie" d="([^"]+)"/)?.[1];
  assert.ok(path);
  const numbers=(path.match(/-?\d+(?:\.\d+)?/g)||[]).map(Number);
  assert.ok(numbers.length>=6&&numbers[3]<numbers[1],path);
 });
 await check('Tie begins beyond a dotted note augmentation dot',async()=>{
  const svg=await engraved('4/4',[{midi:76,beats:3.5}]);
  const dot=svg.match(/<circle class="augmentation-dot" cx="([^"]+)"/)?.[1];
  const tie=svg.match(/<path class="tie" d="M ([^ ]+) /)?.[1];
  assert.ok(dot&&tie);
  assert.ok(Number(tie)>Number(dot),'Tie intersects the dot');
 });
 await check('Cross-bar tied sharp leaves following untied sharp visible',async()=>{
  const svg=await engraved('4/4',[{midi:61,beats:4.5},{midi:61,beats:1}]);
  const g=events(svg,'note');
  assert.equal(g.length,3);
  assert.match(g[0],/class="accidental"[^>]*>♯<\/text>/);
  assert.doesNotMatch(g[1],/class="accidental"/);
  assert.match(g[2],/class="accidental"[^>]*>♯<\/text>/);
 });
 await check('Bass clef and G2 bottom stave position are correct',async()=>{
  const svg=await engraved('4/4',[{midi:43,beats:1},{midi:45,beats:1},{midi:47,beats:1}]);
  assert.ok(svg.includes('𝄢'),'Bass clef missing');
  assert.equal(notePosition(svg)[0].headY,79);
 });
 for(const metre of ['2/4','3/4','4/4','6/8']){
  await check('Whole-measure rest in '+metre+' hangs below the fourth line',async()=>{
   const svg=await engraved(metre,[{midi:null,beats:C.METERS[metre].beats}]);
   assert.match(svg,/aria-label="Select full-bar rest/);
   assert.match(svg,/<rect class="rest-symbol"[^>]*y="49"/);
  });
 }
 await check('Note augmentation dots sit in spaces instead of on staff lines',async()=>{
  const svg=await engraved('4/4',[{midi:64,beats:1.5},{midi:65,beats:1.5}]);
  const g=events(svg,'note');
  assert.equal(g.length,2);
  const head=g.map(x=>Number(x.match(/class="head"[^>]*cy="([^"]+)"/)?.[1]));
  const dot=g.map(x=>Number(x.match(/class="augmentation-dot"[^>]*cy="([^"]+)"/)?.[1]));
  assert.equal(dot[0],head[0]-5);
  assert.equal(dot[1],head[1]);
 });
 await check('Time signature appears once; continuation systems repeat the clef',async()=>{
  const svg=await engraved('4/4',Array.from({length:16},()=>({midi:64,beats:1})));
  assert.equal((svg.match(/<text x="68"/g)||[]).length,2,'Time signature repeated');
  assert.equal((svg.match(/𝄞/g)||[]).length,2,'Continuation clef missing');
  assert.doesNotMatch(svg,/<line class="barline" x1="100"/,'Redundant opening barline');
 });
 await check('40-bar score remains complete across paginated staves',async()=>{
  const melody=Array.from({length:40},(_,i)=>({midi:60+i%7,beats:4}));
  await engraved('4/4',melody);
  assert.match(elem('scoreHint').textContent,/40 bars/);
  assert.equal(elem('pageStatus').textContent,'Bars 1–12 of 40 · Page 1/4');
  let notes=0,bars=0;
  for(let page=0;page<4;page++){
   const svg=elem('score').innerHTML;
   notes+=events(svg,'note').length;
   bars+=(svg.match(/class="barline"/g)||[]).length;
   assert.ok(events(svg,'note').length<=12,'Too many staves rendered at once');
   if(page>0)assert.doesNotMatch(svg,/<text x="68"[^>]*>4<\/text>/,'Time signature repeated');
   if(page<3)elem('nextPage').click();
  }
  assert.equal(notes,40,'Notes missing across pages');
  assert.equal(bars,40,'Barlines missing across pages');
  assert.equal(elem('pageStatus').textContent,'Bars 37–40 of 40 · Page 4/4');
  elem('prevPage').click();
  assert.equal(elem('pageStatus').textContent,'Bars 25–36 of 40 · Page 3/4');
 });
 await check('A held note crossing page boundary retains continuation ties',async()=>{
  const svg=await engraved('4/4',[{midi:60,beats:49}]);
  assert.equal(elem('pageStatus').textContent,'Bars 1–12 of 13 · Page 1/2');
  assert.ok((svg.match(/class="tie"/g)||[]).length>=12,'Page-end tie missing');
  elem('nextPage').click();
  const later=elem('score').innerHTML;
  assert.equal(elem('pageStatus').textContent,'Bars 13–13 of 13 · Page 2/2');
  assert.ok((later.match(/class="tie"/g)||[]).length>=1,'Page-start continuation tie missing');
 });
 await check('Extreme high bass pitch uses 8va without a tower of ledger lines',async()=>{
  const svg=await engraved('4/4',[
   {midi:55,beats:1},{midi:71,beats:1,uncertain:true},{midi:57,beats:2}
  ],{clefMode:'bass'});
  const notes=events(svg,'note');
  assert.equal(notes.length,3);
  const unusual=notes[1];
  assert.match(unusual,/class="octave-mark"[^>]*>8va<\/text>/);
  assert.ok((unusual.match(/class="ledger"/g)||[]).length<=2,'Excessive ledger lines remained');
  assert.match(unusual,/class="uncertain-ring"/);
  assert.doesNotMatch(unusual,/>\?<\/text>/,'Question marks must not be printed on each note');
  assert.equal(elem('clefMode').value,'bass','Manual bass clef was overridden');
  assert.match(elem('scoreHint').textContent,/1 uncertain/,'Review marker lost');
 });
 await check('Automatic clef minimises awkward ledger-line pitches',async()=>{
  const svg=await engraved('4/4',[
   {midi:59,beats:1},{midi:71,beats:1},{midi:71,beats:1},{midi:74,beats:1}
  ],{clefMode:'auto'});
  assert.match(svg,/𝄞/,'Expected treble for pitches mostly above bass stave');
  assert.doesNotMatch(svg,/class="octave-mark"[^>]*>8va<\/text>/,'Unnecessary 8va in treble clef');
 });
 await check('Low note uses 8vb without losing its sounding pitch',async()=>{
  const svg=await engraved('4/4',[{midi:43,beats:1},{midi:64,beats:3}],{clefMode:'treble'});
  assert.match(svg,/class="octave-mark"[^>]*>8vb<\/text>/);
  assert.equal(notePosition(svg).length,2);
  assert.equal(elem('clefMode').value,'treble');
 });
 await check('System spacing accommodates very high and low notes without clipping',async()=>{
  const svg=await engraved('4/4',[
   {midi:95,beats:4,uncertain:true},{midi:36,beats:4,uncertain:true},
   {midi:57,beats:4}
  ],{clefMode:'bass'});
  const view=elem('score').viewBox.split(' ').map(Number),height=view[3];
  const staffYs=[...svg.matchAll(/<line class="staff"[^>]*y1="([^"]+)"/g)].map(x=>Number(x[1]));
  const positions=notePosition(svg);
  assert.equal(positions.length,3);
  assert.equal(staffYs.length,10,'Expected two systems');
  const y1=Math.min(...staffYs.slice(0,5)),y2=Math.min(...staffYs.slice(5,10));
  assert.ok(y1>25,'First system is too close to top edge');
  assert.ok(y2-y1>=140,'Extreme notes cause systems to overlap');
  assert.ok(positions.every(p=>p.headY>15&&p.headY<height-20),'Notehead clipped');
 });
 console.log(passed+' SVG music engraving checks passed.');
 if(process.exitCode)process.exit(1);
})().catch(err=>{console.error(err);process.exit(1)});
