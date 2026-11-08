/* Hum to Compose TEST — teacher workflow and export regression.
   No real browser, microphone, music player, downloaded model or network.
   Exercises the actual single-page app in a minimal simulated DOM. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const C=require('./hum-to-compose-core.js');
const html=fs.readFileSync(path.join(__dirname,'hum-to-compose-test.html'),'utf8');
const script=html.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'Cannot find inline app JavaScript');
const elements=new Map(),blobs=new Map(),downloads=[],storage=new Map(),scheduled=[];
let sequence=0;
function elem(id){
 if(!elements.has(id))elements.set(id,{
  id,value:id==='meter'?'4/4':id==='tempo'?'96':id==='scoreVolume'?'160':
   id==='instrument'?'piano':id==='clefMode'?'auto':id==='keyFifths'?'0':'',
  textContent:'',innerHTML:'',style:{},disabled:false,handlers:{},
  setAttribute(k,v){this[k]=v},getAttribute(k){return this[k]},
  addEventListener(k,fn){this.handlers[k]=fn},click(){return this.handlers.click?.()},
  get selectedOptions(){return [{text:'Warm piano'}]}
 });
 return elements.get(id);
}
const document={getElementById:elem,querySelectorAll:()=>[],
 querySelector:()=>null,createElement:tag=>({
  click(){if(tag==='a')downloads.push({href:this.href,name:this.download})}
 })};
class FakeAudio{
 constructor(){this.paused=true;this.currentTime=0;this.src=''}
 pause(){this.paused=true}addEventListener(){}
}
class FakeAudioContext{
 constructor(){this.currentTime=0;this.destination={};this.sampleRate=48000}
 async resume(){}
 createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}}}
 createOscillator(){return {type:'sine',frequency:{setValueAtTime(f){scheduled.push(f)}},
  connect(){},start(){},stop(){}}}
 async close(){}
}
const window={HumCore:C,AudioContext:FakeAudioContext,isSecureContext:true,
 location:{search:''},performance:{now:()=>0},addEventListener(){}};
const URL={createObjectURL(blob){const key='blob:test-'+ ++sequence;blobs.set(key,blob);return key},
 revokeObjectURL(){}};
const localStorage={getItem(key){return storage.get(key)||null},setItem(key,value){storage.set(key,value)}};
new Function('window','document','Audio','URL','localStorage','setTimeout','clearTimeout',script)(
 window,document,FakeAudio,URL,localStorage,()=>0,()=>{});
let passed=0;
async function test(name,run){
 try{await run();console.log('PASS '+name);passed++}
 catch(error){process.exitCode=1;console.error('FAIL '+name+': '+error.message)}
}
async function importJSON(data){
 const content=JSON.stringify(data);
 await elem('file').handlers.change({target:{files:[{size:content.length,text:async()=>content}],value:''}});
}
async function downloadedText(){
 const latest=downloads.at(-1);
 assert.ok(latest,'No file was downloaded');
 return {name:latest.name,content:await blobs.get(latest.href).text()};
}
(async()=>{
 await test('Manual B-flat key retains pitch and displays two key signs',async()=>{
  await importJSON({format:'music-score-studio-hum-test-v2',meter:'4/4',tempo:96,
   fifths:-2,clefMode:'treble',notes:[
    {midi:70,beats:1,confidence:.75,uncertain:true},
    {midi:71,beats:1,confidence:.95},{midi:60,beats:2}
   ]});
  const svg=elem('score').innerHTML;
  assert.equal(elem('keyFifths').value,'-2');
  assert.equal((svg.match(/class="key-signature"/g)||[]).length,2);
  assert.equal((svg.match(/class="accidental"/g)||[]).length,1);
  assert.match(svg,/Select B♭4 Crotchet/);
 });
 await test('User-locked bass clef changes notation without shifting pitch',async()=>{
  elem('clefMode').value='bass';elem('clefMode').handlers.change();
  assert.ok(elem('score').innerHTML.includes('𝄢'));
  elem('save').click();
  const saved=JSON.parse((await downloadedText()).content);
  assert.equal(saved.notes[0].midi,70);
  assert.equal(saved.clefMode,'bass');
  assert.equal(saved.fifths,-2);
 });
 await test('MusicXML export preserves B-flat and chosen bass clef',async()=>{
  elem('xml').click();
  const saved=await downloadedText();
  assert.equal(saved.name,'hum-to-compose.musicxml');
  assert.match(saved.content,/<fifths>-2<\/fifths>/);
  assert.match(saved.content,/<step>B<\/step><alter>-1<\/alter>/);
  assert.match(saved.content,/<clef><sign>F<\/sign><line>4<\/line><\/clef>/);
 });
 await test('Selecting a note shows its confidence, name and a playback button',async()=>{
  elem('score').handlers.click({target:{closest:selector=>selector==='g[data-origin]'?{
   getAttribute:k=>k==='data-origin'?'0':null}:null}});
  assert.equal(elem('playSelected').disabled,false);
  assert.match(elem('reviewInfo').textContent,/75%/);
  assert.match(elem('reviewInfo').textContent,/B♭4/,'Review label differs from written key spelling');
  await elem('playSelected').click();
  assert.ok(scheduled.length>=3,'No instrument oscillators scheduled');
  assert.ok(Math.abs(scheduled[0]-440*Math.pow(2,(70-69)/12))<.01);
  elem('stop').click();
 });
 await test('Marking one note checked preserves pitch and removes its question mark',async()=>{
  const old=elem('score').innerHTML.match(/class="uncertain-ring"/g)?.length||0;
  elem('markReviewed').click();
  const now=elem('score').innerHTML.match(/class="uncertain-ring"/g)?.length||0;
  assert.ok(now<old);
  elem('save').click();
  const saved=JSON.parse((await downloadedText()).content);
  assert.equal(saved.notes[0].midi,70);
  assert.equal(saved.notes[0].reviewed,true);
 });
 await test('Portable session without recording saves readable editable score',async()=>{
  await elem('saveSession').click();
  const saved=JSON.parse((await downloadedText()).content);
  assert.equal(saved.format,'music-score-studio-hum-session-v1');
  assert.equal(saved.clefMode,'bass');
  assert.equal(saved.fifths,-2);
  assert.equal(saved.notes[0].midi,70);
 });
 await test('A full session reopens original recording and detected melody',async()=>{
  await importJSON({format:'music-score-studio-hum-session-v1',meter:'4/4',tempo:96,
   fifths:0,clefMode:'treble',notes:[{midi:60,beats:1}],
   detectedEvents:[{start:0,end:.5,duration:.5,midi:60,confidence:.95,points:[]}],
   originalAudioBase64:'AQIDBA==',originalAudioType:'audio/wav'});
  assert.match(elem('status').textContent,/original audio/);
  assert.equal(elem('original').disabled,false);
  assert.equal(elem('faithful').disabled,false);
  await elem('saveSession').click();
  const saved=JSON.parse((await downloadedText()).content);
  assert.equal(saved.originalAudioBase64,'AQIDBA==');
  assert.equal(saved.detectedEvents[0].midi,60);
 });
 await test('Local save/reopen keeps chosen key, clef and notes',async()=>{
  elem('keyFifths').value='1';elem('keyFifths').handlers.change();
  elem('clefMode').value='bass';elem('clefMode').handlers.change();
  elem('saveLocal').click();
  elem('clear').click();
  elem('loadLocal').click();
  assert.equal(elem('keyFifths').value,'1');
  assert.equal(elem('clefMode').value,'bass');
  assert.match(elem('scoreHint').textContent,/note groups/);
 });
 await test('Invalid key signatures cannot overwrite the current score',async()=>{
  const before=elem('score').innerHTML;
  await importJSON({meter:'4/4',tempo:96,fifths:8,notes:[{midi:64,beats:1}]});
  assert.match(elem('status').textContent,/Could not open score/);
  assert.equal(elem('score').innerHTML,before);
 });
 await test('No global keyboard shortcut captures Tab or button activation',async()=>{
  assert.ok(!/window\.addEventListener\(['"]keydown/.test(script));
  assert.ok(script.includes("e.key==='Enter'||e.key===' '"));
 });
 await test('No-singing benchmark page has optional Spotify inference without microphone',async()=>{
  const bench=fs.readFileSync(path.join(__dirname,'hum-to-compose-benchmark.html'),'utf8');
  const js=bench.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(js,'Benchmark browser code missing');
  assert.doesNotThrow(()=>new Function(js),'Benchmark browser JavaScript syntax invalid');
  assert.ok(bench.includes('runSpotify')&&bench.includes('adapter.recognise(audio'));
  assert.ok(bench.includes('<strong>not</strong> run Spotify Basic Pitch'));
  assert.ok(html.includes('hum-to-compose-benchmark.html'),'Benchmark link absent from TEST');
 });
 console.log(passed+' teacher feature and file round-trip checks passed');
 if(process.exitCode)process.exit(1);
})();
