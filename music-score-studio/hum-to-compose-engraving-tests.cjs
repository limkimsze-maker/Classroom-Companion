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
async function engraved(signature,notes){
 const raw=JSON.stringify({meter:signature,tempo:96,notes});
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
 console.log(passed+' SVG music engraving checks passed.');
 if(process.exitCode)process.exit(1);
})().catch(err=>{console.error(err);process.exit(1)});
