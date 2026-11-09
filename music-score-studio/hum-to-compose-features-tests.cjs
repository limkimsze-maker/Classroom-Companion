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
let denyStorageWrite=false,confirmDelete=true;
let sequence=0;
function elem(id){
 if(!elements.has(id))elements.set(id,{
  id,value:id==='meter'?'4/4':id==='tempo'?'96':id==='scoreVolume'?'160':
   id==='instrument'?'piano':id==='clefMode'?'auto':id==='keyFifths'?'0':'',
  textContent:'',innerHTML:'',style:{},disabled:false,handlers:{},
   focus(){this.focused=true},
  setAttribute(k,v){this[k]=v},getAttribute(k){return this[k]},
  addEventListener(k,fn){this.handlers[k]=fn},click(){return this.handlers.click?.()},
  get selectedOptions(){return [{text:'Warm piano'}]}
 });
 return elements.get(id);
}
const document={body:{appendChild(a){return a}},getElementById:elem,querySelectorAll:()=>[],
 querySelector:()=>null,createElement:tag=>({
  click(){if(tag==='a')downloads.push({href:this.href,name:this.download})},remove(){}
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
 location:{search:''},performance:{now:()=>0},confirm:()=>confirmDelete,addEventListener(){}};
const URL={createObjectURL(blob){const key='blob:test-'+ ++sequence;blobs.set(key,blob);return key},
 revokeObjectURL(){}};
const localStorage={getItem(key){return storage.get(key)||null},setItem(key,value){if(denyStorageWrite)throw Error('Storage blocked');storage.set(key,value)}};
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
  elem('download').click();
  const saved=JSON.parse((await downloadedText()).content);
  assert.equal(saved.notes[0].midi,70);
  assert.equal(saved.clefMode,'bass');
  assert.equal(saved.fifths,-2);
 });
 await test('Undo and Redo reverse a teacher-chosen clef without moving notes',async()=>{
  elem('undo').click();assert.equal(elem('clefMode').value,'treble');
  elem('redo').click();assert.equal(elem('clefMode').value,'bass');
  elem('download').click();
  const saved=JSON.parse((await downloadedText()).content);
  assert.equal(saved.notes[0].midi,70);
 });
 await test('MusicXML export preserves B-flat and chosen bass clef',async()=>{
  elem('xml').click();
  const saved=await downloadedText();
  assert.equal(saved.name,'My melody.musicxml');
  assert.match(saved.content,/<work-title>My melody<\/work-title>/);
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
  elem('download').click();
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
  assert.equal(saved.name,'My melody');
  assert.equal(saved.detectedEvents[0].midi,60);
 });
 await test('Local save/reopen keeps chosen key, clef and notes',async()=>{
  elem('keyFifths').value='1';elem('keyFifths').handlers.change();
  elem('clefMode').value='bass';elem('clefMode').handlers.change();
  elem('scoreName').value='Saved in browser';
  elem('save').click();
  elem('clear').click();
  elem('scoreName').value='Unsaved name';
  elem('loadLocal').click();
  elem('openSaved').click();
  assert.equal(elem('scoreName').value,'Saved in browser');
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
 await test('Save Score downloads a portable file with the chosen name',async()=>{
  const title='Moonlight & Morning';
  elem('scoreName').value=title;elem('download').click();
  const downloaded=await downloadedText(),saved=JSON.parse(downloaded.content);
  assert.equal(downloaded.name,title+'.music-score.json');
  assert.equal(saved.name,title);
  assert.equal(saved.notes[0].midi,60);
  assert.equal(saved.clefMode,'bass');
  assert.equal(saved.fifths,1);
  elem('scoreName').value='Draft name';elem('clear').click();
  await importJSON(saved);
  assert.equal(elem('scoreName').value,title);
  assert.equal(elem('clefMode').value,'bass');
  assert.equal(elem('keyFifths').value,'1');
  assert.ok(elem('score').innerHTML.includes('class="head"'));
 });
 await test('Names including non-English characters save safely',async()=>{
  elem('scoreName').value='中文旋律: My / Song?';
  elem('download').click();
  const file=await downloadedText(),saved=JSON.parse(file.content);
  assert.equal(saved.name,'中文旋律: My / Song?');
  assert.equal(file.name,'中文旋律- My - Song-.music-score.json');
  await importJSON(saved);
  assert.equal(elem('scoreName').value,'中文旋律: My / Song?');
  elem('scoreName').value='   ';elem('download').click();
  assert.equal(JSON.parse((await downloadedText()).content).name,'My melody');
  assert.equal((await downloadedText()).name,'My melody.music-score.json');
 });
 await test('Open legacy untitled score; MusicXML and sessions use current name',async()=>{
  await importJSON({format:'music-score-studio-hum-test-v2',meter:'4/4',tempo:96,
   clefMode:'treble',fifths:0,notes:[{midi:60,beats:1}]});
  assert.equal(elem('scoreName').value,'My melody');
  elem('scoreName').value='The New Score';
  elem('xml').click();
  const xml=await downloadedText();
  assert.equal(xml.name,'The New Score.musicxml');
  assert.match(xml.content,/<work-title>The New Score<\/work-title>/);
  await elem('saveSession').click();
  const session=await downloadedText();
  assert.equal(session.name,'The New Score-session.json');
  assert.equal(JSON.parse(session.content).name,'The New Score');
 });
 await test('Invalid file title cannot overwrite the current score',async()=>{
  const before=elem('score').innerHTML;
  await importJSON({name:'a'.repeat(81),format:'music-score-studio-hum-test-v2',
   meter:'4/4',tempo:96,notes:[{midi:72,beats:1}]});
  assert.match(elem('status').textContent,/Could not open score/);
  assert.equal(elem('score').innerHTML,before);
  assert.equal(elem('scoreName').value,'The New Score');
 });
 await test('Saving separate named melodies keeps both accessible and editable',async()=>{
  await importJSON({meter:'4/4',tempo:96,notes:[{midi:60,beats:1}],name:'First Song'});
  elem('save').click();
  let all=JSON.parse(storage.get('hum-to-compose-scores-v1'));
  const a=all.find(e=>e.name==='First Song');assert.ok(a);
  elem('clear').click();elem('example').click();
  elem('scoreName').value='Second Song';elem('save').click();
  all=JSON.parse(storage.get('hum-to-compose-scores-v1'));
  assert.equal(all.filter(e=>e.name==='First Song'||e.name==='Second Song').length,2);
  const b=all.find(e=>e.name==='Second Song');assert.ok(b);
  assert.equal(b.score.notes.length,6);
  elem('savedScoreChoice').value=a.id;elem('openSaved').click();
  assert.equal(elem('scoreName').value,'First Song');
  elem('scoreName').value='First Song updated';
  elem('save').click();
  all=JSON.parse(storage.get('hum-to-compose-scores-v1'));
  assert.equal(all.find(e=>e.id===a.id).name,'First Song updated','Save should update same document');
  assert.equal(all.find(e=>e.id===b.id).name,'Second Song','Saving one score must not overwrite another');
  elem('savedScoreChoice').value=b.id;elem('openSaved').click();
  assert.equal(elem('scoreName').value,'Second Song');
  assert.match(elem('scoreHint').textContent,/note groups/);
 });
 await test('Delete requires confirmation and leaves displayed music unchanged',async()=>{
  const all=JSON.parse(storage.get('hum-to-compose-scores-v1'));
  const toDelete=all.find(e=>e.name==='First Song updated');
  const before=elem('score').innerHTML;assert.ok(toDelete);
  elem('savedScoreChoice').value=toDelete.id;confirmDelete=false;elem('deleteSaved').click();
  assert.equal(JSON.parse(storage.get('hum-to-compose-scores-v1')).length,all.length);
  confirmDelete=true;elem('deleteSaved').click();
  assert.equal(JSON.parse(storage.get('hum-to-compose-scores-v1')).length,all.length-1);
  assert.equal(elem('score').innerHTML,before);
 });
 await test('Previous single-slot score can still be opened and migrated safely',async()=>{
  const existing=storage.get('hum-to-compose-scores-v1');
  storage.delete('hum-to-compose-scores-v1');
  const legacy={meter:'3/4',tempo:100,name:'My earlier tune',notes:[{midi:67,beats:1}]};
  storage.set('hum-to-compose-test-v2',JSON.stringify(legacy));
  elem('loadLocal').click();assert.equal(elem('savedCount').textContent,'1');
  elem('savedScoreChoice').value='legacy-v2';elem('openSaved').click();
  assert.equal(elem('scoreName').value,'My earlier tune');
  assert.equal(elem('meter').value,'3/4');
  elem('save').click();assert.ok(storage.get('hum-to-compose-test-v2'),'Old save must remain intact');
  assert.equal(JSON.parse(storage.get('hum-to-compose-scores-v1')).length,1);
  storage.set('hum-to-compose-scores-v1',existing);
 });
 await test('Unavailable browser storage reports an error without false save success',async()=>{
  await importJSON({meter:'4/4',tempo:96,name:'Unstored score',notes:[{midi:60,beats:1}]});
  denyStorageWrite=true;elem('save').click();denyStorageWrite=false;
  assert.match(elem('status').textContent,/Could not save in this browser/);
  const all=JSON.parse(storage.get('hum-to-compose-scores-v1'));
  assert.ok(!all.some(e=>e.name==='Unstored score'));
  elem('download').click();
  assert.equal((await downloadedText()).name,'Unstored score.music-score.json');
 });
 await test('One sustained written note schedules exactly one piano attack',async()=>{
  await importJSON({format:'music-score-studio-hum-test-v2',name:'One sustained hum',
   meter:'4/4',tempo:96,notes:[{midi:60,beats:3,confidence:1}]});
  const prior=scheduled.length;
  await elem('play').click();
  // One warm piano strike consists of three simultaneous sine partials;
  // three oscillators are not three sequential notes.
  assert.equal(scheduled.length-prior,3,'One written note was replayed or retriggered');
  elem('stop').click();
 });
 await test('Long 10-minute score opens, paginates, saves and exports all 1,000 bars',async()=>{
  const events=Array.from({length:3000},(_,i)=>({midi:60+i%8,beats:1}));
  await importJSON({format:'music-score-studio-hum-test-v2',name:'Ten-minute melody',
   meter:'6/8',tempo:200,notes:events});
  assert.match(elem('scoreHint').textContent,/1,000 bars|1000 bars/);
  assert.match(elem('pageStatus').textContent,/Bars 1–12 of 1000/);
  assert.equal(elem('nextPage').disabled,false);
  elem('nextPage').click();
  assert.match(elem('pageStatus').textContent,/Bars 13–24 of 1000/);
  elem('prevPage').click();
  elem('save').click();
  const saved=JSON.parse(storage.get('hum-to-compose-scores-v1'));
  const record=saved.find(x=>x.name==='Ten-minute melody');
  assert.ok(record);
  assert.equal(record.score.notes.length,3000);
  elem('clear').click();elem('loadLocal').click();
  elem('savedScoreChoice').value=record.id;elem('openSaved').click();
  assert.equal(elem('scoreName').value,'Ten-minute melody');
  assert.match(elem('scoreHint').textContent,/1000 bars/);
  elem('xml').click();
  assert.equal(((await downloadedText()).content.match(/<measure /g)||[]).length,1000);
 });
 await test('Ten-minute session restores detected notes near the end',async()=>{
  await importJSON({format:'music-score-studio-hum-session-v1',name:'Late melody',
   meter:'4/4',tempo:96,notes:[{midi:62,beats:1}],
   detectedEvents:[{start:560,end:562,duration:2,midi:62,confidence:.94,points:[]}]});
  assert.equal(elem('faithful').disabled,false);
  await elem('saveSession').click();
  const saved=JSON.parse((await downloadedText()).content);
  assert.equal(saved.detectedEvents[0].start,560);
  assert.equal(saved.detectedEvents[0].end,562);
  assert.equal(saved.name,'Late melody');
 });
 await test('Recording-first UI does not require choosing metre or tempo before singing',async()=>{
  const recordingSection=html.slice(html.indexOf('<section class="card" aria-label="Record melody">'),
   html.indexOf('</section>',html.indexOf('<section class="card" aria-label="Record melody">')));
  assert.ok(recordingSection.includes('Hum, sing or play one melody at your own speed.'));
  assert.ok(!recordingSection.includes('id="meter"'),'Meter belongs in advanced score setup');
  assert.ok(!recordingSection.includes('id="tempo"'),'Tempo belongs in advanced score setup');
  const settings=html.slice(html.indexOf('<details id="scoreSetup"'),html.indexOf('</details>',html.indexOf('<details id="scoreSetup"')));
  assert.ok(settings.includes('id="meter"')&&settings.includes('id="tempo"'),
   'Teachers must still be able to change time and tempo after recording');
  assert.equal((html.match(/id="meter"/g)||[]).length,1);
  assert.equal((html.match(/id="tempo"/g)||[]).length,1);
  assert.equal(elem('meter').value,'4/4');
  assert.equal(elem('tempo').value,'96');
 });
 await test('Changing time signature after recording preserves real playback seconds',async()=>{
  await importJSON({format:'music-score-studio-hum-test-v2',meter:'4/4',tempo:120,
   notes:[{midi:60,beats:1},{midi:62,beats:.5},{midi:null,beats:.5}]});
  const baseline=JSON.stringify([{midi:60,beats:1},{midi:62,beats:.5},{midi:null,beats:.5}]);
  const before=C.beatSeconds(120,'4/4')*2;
  elem('meter').value='6/8';elem('meter').handlers.change();
  assert.equal(elem('meter').value,'6/8');
  assert.equal(elem('tempo').value,'80','6/8 uses dotted crotchet BPM');
  assert.ok(Math.abs(C.beatSeconds(80,'6/8')*2-before)<.001);
  assert.match(elem('status').textContent,/playback timing are preserved/);
  elem('download').click();
  let saved=JSON.parse((await downloadedText()).content);
  assert.equal(JSON.stringify(saved.notes.map(n=>({midi:n.midi,beats:n.beats}))),baseline);
  elem('undo').click();assert.equal(elem('meter').value,'4/4');assert.equal(elem('tempo').value,'120');
  elem('redo').click();assert.equal(elem('meter').value,'6/8');assert.equal(elem('tempo').value,'80');
  elem('meter').value='3/4';elem('meter').handlers.change();
  assert.equal(elem('tempo').value,'120','Switching back from 6/8 should preserve seconds per beat');
  assert.ok(Math.abs(C.beatSeconds(120,'3/4')*2-before)<.001);
 });
 await test('Unsupported time-signature tempo change cannot silently alter playback',async()=>{
  await importJSON({format:'music-score-studio-hum-test-v2',meter:'6/8',tempo:180,
   notes:[{midi:60,beats:1}]});
  const start=C.beatSeconds(180,'6/8');
  elem('meter').value='4/4';elem('meter').handlers.change();
  assert.equal(elem('meter').value,'6/8');
  assert.equal(elem('tempo').value,'180');
  assert.ok(Math.abs(C.beatSeconds(Number(elem('tempo').value),elem('meter').value)-start)<.0001);
  assert.match(elem('status').textContent,/outside the supported 40–200 BPM range/);
 });
 await test('Recording-led detailed rhythm supports undo, save and portable MusicXML',async()=>{
  const beat=C.beatSeconds(120,'4/4'),dur=.125*beat;
  const detected=[60,62,64,65].map((midi,i)=>({
   start:i*dur,end:(i+1)*dur,duration:dur,midi,confidence:.97,points:[]
  }));
  await importJSON({format:'music-score-studio-hum-session-v1',
   name:'Fast hummed motif',meter:'4/4',tempo:120,
   notes:[{midi:60,beats:.5,confidence:.85}],detectedEvents:detected});
  assert.equal(elem('rebuildDetailed').disabled,false);
  assert.equal(elem('rhythmFit').hidden,false);
  assert.match(elem('rhythmFit').textContent,/detected notes differ/);
  elem('rebuildDetailed').click();
  assert.match(elem('status').textContent,/shorter note values/);
  elem('download').click();
  let saved=JSON.parse((await downloadedText()).content);
  assert.equal(saved.notes.filter(n=>n.midi!==null).length,4);
  assert.deepEqual(saved.notes.filter(n=>n.midi!==null).map(n=>n.beats),[.125,.125,.125,.125]);
  assert.ok(saved.notes.every(n=>n.midi!==null));
  assert.match(elem('rhythmFit').textContent,/close to the written score/);
  elem('xml').click();
  const xml=(await downloadedText()).content;
  assert.equal((xml.match(/<type>32nd<\/type>/g)||[]).length,4);
  elem('undo').click();
  elem('download').click();
  saved=JSON.parse((await downloadedText()).content);
  assert.equal(saved.notes.length,1);
  elem('redo').click();
  elem('download').click();
  saved=JSON.parse((await downloadedText()).content);
  assert.equal(saved.notes.length,4);
  await importJSON(saved);
  assert.equal(elem('duration').disabled,true,'Imported score must remain editable through note selection');
  assert.equal(elem('rhythmFit').hidden,true,'Score-only import cannot claim matching source audio');
 });
 await test('Recording controls retain ten-minute timer and time-based stop',async()=>{
  assert.ok(html.includes('MAX_SECONDS=600'));
  assert.ok(html.includes('0:00 / 10:00'));
  assert.ok(html.includes('recordingDeadline=setTimeout(finish,MAX_SECONDS*1000)'));
  assert.ok(html.includes('clearTimeout(recordingDeadline)'));
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
