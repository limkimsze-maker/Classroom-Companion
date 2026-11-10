/* Live browser smoke test for the ACTUAL Spotify Basic Pitch model.
 * Uses only locally generated audio. No microphone, uploads, paid APIs or
 * production Music Score Studio files are involved.
 * Distinct from seeded-note synthetic verification tests.
 */
'use strict';
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');

const root=path.resolve(__dirname,'..');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.cjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
let browser,server;
async function main(){
 server=http.createServer(async(req,res)=>{
  try{
   const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
   const file=path.resolve(root,'.'+pathname);
   if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
   const bytes=await fs.promises.readFile(file);
   res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'}).end(bytes);
  }catch(_){res.writeHead(404).end('Not found')}
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
 const port=server.address().port;
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 // Exercise real Chromium Save/Open flows, not a mocked DOM or a phone microphone.
 for(const width of [390,1280]){
  const ctx=await browser.newContext({viewport:{width,height:844},acceptDownloads:true});
  const saving=await ctx.newPage(),pageErrors=[];
  saving.on('pageerror',error=>pageErrors.push(error.message));
  await saving.goto('http://127.0.0.1:'+port+'/music-score-studio/hum-to-compose-test.html');
  assert.equal(await saving.locator('#record').innerText(),'🎤 Record');
  assert.equal(await saving.locator('#finish').count(),0,'Duplicate Finish button returned');
  assert.equal(await saving.locator('#loadLocal').count(),0,'Duplicate library launcher returned');
  assert.equal(await saving.locator('#play').innerText(),'▶ Play my music score');
  await saving.locator('#examples summary').click();
  await saving.locator('#example').click();
  // The default visible score uses the exact OSMD 2.1.3 backend used by
  // the published Music Score Studio, not the approximation SVG.
  await saving.waitForFunction(()=>{
   const view=document.getElementById('professionalScore');
   const host=document.getElementById('professionalScoreHost');
   return !view.hidden&&host.querySelector('svg path,svg line,svg use')&&
    document.getElementById('engravingStatus').textContent.startsWith('Professional notation');
  },null,{timeout:60000});
  assert.equal(await saving.locator('#comparePlayback').evaluate(e=>e.open),false);
  await saving.locator('#comparePlayback summary').click();
  assert.equal(await saving.locator('#original').isVisible(),true);
  assert.equal(await saving.locator('#faithful').innerText(),'▶ Hear what AI detected');
  await saving.locator('#comparePlayback summary').click();
  await saving.locator('#calibration > summary').click();
  await saving.locator('#advancedRhythm summary').click();
  assert.equal(await saving.locator('#rebuild').isVisible(),true);
  await saving.locator('#advancedRhythm summary').click();
  await saving.locator('#transposeSteps').selectOption('1');
  await saving.locator('#transpose').click();
  await saving.locator('#undo').click();
  await saving.locator('#calibration > summary').click();
  assert.equal(await saving.locator('#editableScoreArea').isVisible(),false);
  assert.ok(await saving.locator('#professionalScoreHost svg').count()>0,'OSMD did not engrave a readable score');
  await saving.locator('#play').click();
  await saving.waitForFunction(()=>document.querySelectorAll('#professionalScoreHost .engravedPlayingNotehead').length>0,null,{timeout:10000});
  await saving.locator('#stop').click();
  assert.equal(await saving.locator('#professionalScoreHost .engravedPlayingNotehead').count(),0,
   'Engraved highlights should clear when playback stops');
  await saving.locator('#showEditable').click();
  assert.equal(await saving.locator('#editableScoreArea').isVisible(),true);
  assert.ok(await saving.locator('#score g.event.note').count()>0,'Editable notes disappeared');
  await saving.locator('#showEngraved').click();
  await saving.waitForFunction(()=>{
   return !document.getElementById('professionalScore').hidden&&
    document.getElementById('engravingStatus').textContent.startsWith('Professional notation');
  },null,{timeout:60000});
  console.log('PASS: published-Studio OSMD printed engraving and reversible edit view at '+width+'px');
  await saving.locator('#scoreName').fill('Morning Music');
  await saving.locator('#save').click();
  assert.match(await saving.locator('#status').innerText(),/Saved “Morning Music”/);
  await saving.locator('#clear').click();
  await saving.locator('#example').click();
  await saving.locator('#scoreName').fill('Evening Music');
  await saving.locator('#save').click();
  await saving.reload();await saving.locator('#scoreLibrary summary').click();
  assert.equal(await saving.locator('#savedCount').innerText(),'2');
  await saving.locator('#savedScoreChoice').selectOption({label:'Morning Music'});
  await saving.locator('#openSaved').click();
  assert.equal(await saving.locator('#scoreName').inputValue(),'Morning Music');
  assert.equal(await saving.locator('#scoreTitle').innerText(),'Morning Music');
  assert.equal(await saving.locator('#undo').isDisabled(),true,
   'Loading a saved score must clear Undo history from the previous document');
  await saving.locator('#clear').click();
  await saving.locator('#undo').click();
  await saving.locator('#save').click();
  assert.equal(await saving.locator('#savedCount').innerText(),'2',
   'Undo + Save must update Morning Music, not create a duplicate');
  assert.match(await saving.locator('#scoreHint').innerText(),/note groups/);
  await saving.locator('#exportOptions summary').click();
  const pending=saving.waitForEvent('download');
  await saving.locator('#download').click();
  const file=await pending;
  assert.equal(file.suggestedFilename(),'Morning Music.music-score.json');
  const exported=JSON.parse(await fs.promises.readFile(await file.path(),'utf8'));
  assert.equal(exported.name,'Morning Music');assert.equal(exported.notes.length,6);
  await saving.locator('#file').setInputFiles({
   name:'Reopened.music-score.json',mimeType:'application/json',
   buffer:Buffer.from(JSON.stringify({...exported,name:'Imported Music'}))
  });
  await saving.waitForFunction(()=>document.getElementById('scoreName').value==='Imported Music',null,{timeout:10000});
  assert.equal(await saving.locator('#scoreName').inputValue(),'Imported Music');
  await saving.locator('#save').click();
  await saving.reload();await saving.locator('#scoreLibrary summary').click();
  assert.equal(await saving.locator('#savedCount').innerText(),'3');
  await saving.locator('#savedScoreChoice').selectOption({label:'Evening Music'});
  await saving.locator('#openSaved').click();
  assert.equal(await saving.locator('#scoreName').inputValue(),'Evening Music');
  assert.equal(await saving.locator('#undo').isDisabled(),true,'Opening Evening Music cannot undo into Imported Music');
  // Recreate the reported high bass-note screenshot in actual Chromium.
  const outlier={meter:'4/4',tempo:96,name:'High bass review',clefMode:'bass',
   notes:[{midi:55,beats:1},{midi:71,beats:1,uncertain:true},{midi:57,beats:2}]};
  await saving.locator('#file').setInputFiles({
   name:'outlier.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(outlier))
  });
  await saving.waitForFunction(()=>document.getElementById('scoreName').value==='High bass review',null,{timeout:10000});
  const highNote=saving.locator('#score g.event.note').nth(1);
  assert.equal(await highNote.locator('.octave-mark').textContent(),'8va');
  assert.ok(await highNote.locator('.ledger').count()<=2,'High bass note still has excessive ledger lines');
  assert.equal(await highNote.locator('.uncertain-ring').count(),1,'Teacher-review indicator lost');
  assert.equal(await saving.locator('#score text').filter({hasText:/^\?$/}).count(),0,'Unnecessary question marks remain');
  const pageBounds=await saving.evaluate(()=>{
   const svg=document.querySelector('#score');
   return {height:svg.viewBox.baseVal.height,
    ys:[...svg.querySelectorAll('ellipse.head')].map(n=>Number(n.getAttribute('cy')))};
  });
  assert.ok(pageBounds.ys.every(y=>y>=20&&y<pageBounds.height-20),'Notehead clipped');
  await saving.locator('#exportOptions summary').click();
  const xmlReady=saving.waitForEvent('download');
  await saving.locator('#xml').click();
  const xmlFile=await xmlReady,xml=await fs.promises.readFile(await xmlFile.path(),'utf8');
  assert.match(xml,/<octave-shift type="down" number="1" size="8"\/>/);
  assert.match(xml,/<step>B<\/step><octave>4<\/octave>/);
  console.log('PASS: Chromium '+width+'px high bass pitch uses 8va, preserves review ring and MusicXML pitch');
  // Only the active 12-bar slice should be engraved, even if the score spans
  // many bars; page changes must re-engrave instead of showing stale notation.
  const fourteen={meter:'4/4',tempo:96,name:'Fourteen-bar test',clefMode:'treble',
   notes:Array.from({length:14},(_,i)=>({midi:60+i%7,beats:4}))};
  await saving.locator('#file').setInputFiles({
   name:'fourteen.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fourteen))
  });
  await saving.waitForFunction(()=>document.getElementById('engravingStatus').textContent.includes('Page 1/2'),null,{timeout:60000});
  assert.match(await saving.locator('#pageStatus').innerText(),/Bars 1–12 of 14/);
  await saving.locator('#nextPage').click();
  await saving.waitForFunction(()=>document.getElementById('engravingStatus').textContent.includes('Page 2/2'),null,{timeout:60000});
  assert.match(await saving.locator('#pageStatus').innerText(),/Bars 13–14 of 14/);
  assert.ok(await saving.locator('#professionalScoreHost svg').count()>0,'OSMD failed on continuation page');
  await saving.locator('#prevPage').click();
  await saving.waitForFunction(()=>document.getElementById('engravingStatus').textContent.includes('Page 1/2'),null,{timeout:60000});
  console.log('PASS: Chromium '+width+'px professionally engraved notation navigates all pages');
  assert.deepEqual(pageErrors,[],'Save/Open browser errors at '+width+'px');
  console.log('PASS: Chromium '+width+'px named save, reopen, download and import');
  await ctx.close();
 }
 // Real-browser WAV-to-score timing calibration, with test-only model output.
 // The separate benchmark below still exercises the unmodified Spotify model.
 {
  const ctx=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true});
  const calibrationPage=await ctx.newPage(),errors=[];
  calibrationPage.on('pageerror',e=>errors.push(e.message));
  await calibrationPage.goto('http://127.0.0.1:'+port+'/music-score-studio/hum-to-compose-test.html?regression=tempo');
  const pitches=[60,62,64,65,67,69],rate=22050,bpm=112,beat=60/bpm;
  const count=Math.ceil(pitches.length*beat*rate),wav=Buffer.alloc(44+count*2);
  wav.write('RIFF',0);wav.writeUInt32LE(36+count*2,4);
  wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);
  wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);
  wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);
  wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);
  wav.write('data',36);wav.writeUInt32LE(count*2,40);
  for(let i=0;i<count;i++){
   const t=i/rate,slot=Math.min(pitches.length-1,Math.floor(t/beat));
   const hz=440*Math.pow(2,(pitches[slot]-69)/12);
   wav.writeInt16LE(Math.round(.28*Math.sin(2*Math.PI*hz*t)*32767),44+i*2);
  }
  await calibrationPage.evaluate(()=>{
   window.HumCore.estimateNaturalTempo=()=>({bpm:120,confidence:.4,ambiguous:true});
   const beat=60/112,pitches=[60,62,64,65,67,69];
   window.__humTestAdapter={recognise:async()=>({
    events:pitches.map((midi,i)=>({
     start:i*beat,end:(i+1)*beat,duration:beat,midi,confidence:.98,
     qualityStatus:'matched',points:[{t:0,midi,confidence:.98}]
    })),
    verification:{octavesCorrected:0,pitchCorrected:0,noteSplits:0,pausesRestored:0,review:0}
   })};
  });
  await calibrationPage.locator('#audioFile').setInputFiles({
   name:'six-notes.wav',mimeType:'audio/wav',buffer:wav
  });
  await calibrationPage.waitForFunction(()=>
   document.getElementById('status').textContent.includes('Calibrated score timing'),
   null,{timeout:30000});
  const calibratedBpm=Number(await calibrationPage.locator('#tempo').inputValue());
  assert.ok(Math.abs(calibratedBpm-bpm)<=2,'End-to-end BPM wrong: '+calibratedBpm);
  await calibrationPage.locator('#exportOptions summary').click();
  const pending=calibrationPage.waitForEvent('download');
  await calibrationPage.locator('#download').click();
  const exported=await pending;
  const saved=JSON.parse(await fs.promises.readFile(await exported.path(),'utf8'));
  assert.deepEqual(saved.notes.filter(n=>n.midi!==null).map(n=>n.midi),pitches,
   'Calibration changed original pitches or octaves');
  const seconds=saved.notes.reduce((sum,n)=>
   sum+n.beats*(60/saved.tempo*(saved.meter==='6/8'?2/3:1)),0);
  assert.ok(Math.abs(seconds-pitches.length*beat)<.06,
   'Calibrated score duration disagrees with original recording');
  assert.deepEqual(errors,[],'Unexpected browser errors during calibrated transcription');
  console.log('PASS: Chromium WAV import corrected 120→'+calibratedBpm+
   ' BPM, preserved every pitch, and matched score duration to original');
  await ctx.close();
 }
 const page=await browser.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+port+'/music-score-studio/hum-to-compose-benchmark.html',{waitUntil:'domcontentloaded'});
 assert.equal(await page.locator('#runSpotify').count(),1,'Spotify benchmark button must exist');
 await page.locator('#runSpotify').click();
 await page.waitForFunction(()=>{
  const result=document.querySelector('#spotifyResult')?.textContent||'';
  return result.includes('ACTUAL Spotify Basic Pitch inference')||result.includes('Real Spotify benchmark stopped after');
 },null,{timeout:600000});
 const result=await page.locator('#spotifyResult').innerText();
 console.log('\n'+result+'\n');
 assert.ok(result.startsWith('ACTUAL Spotify Basic Pitch inference'), 'Spotify model run failed: '+result+'\nPage errors: '+errors.join(' | '));
 const completed=/Melodies successfully analysed:\s*(\d+)\/(\d+)/.exec(result);
 assert.ok(completed,'Missing real-model completion count');
 assert.equal(Number(completed[1]),8,'Not all eight generated melodies were analysed');
 assert.equal(Number(completed[2]),8);
 const f1=/One-to-one note F1:\s*([\d.]+)%/.exec(result);
 assert.ok(f1,'Missing measured real-model F1');
 assert.ok(Number.isFinite(Number(f1[1])),'Non-numeric real-model F1');
 console.log('PASS: actual Spotify neural inference completed for 8/8 synthetic clips; F1='+f1[1]+'%.');
 // One uninterrupted hum must be ONE attack, even when the neural model
 // emits multiple same-pitch fragments due to vibrato/timbre fluctuations.
 const heldHum=await page.evaluate(async()=>{
  const adapter=await import('./hum-to-compose-basic-pitch-adapter.js');
  const rate=22050,duration=3.2,pcm=new Float32Array(Math.floor(duration*rate));
  let phase=0;
  for(let i=0;i<pcm.length;i++){
   const t=i/rate,freq=220*Math.pow(2,(.14*Math.sin(2*Math.PI*4.1*t))/12);
   phase+=2*Math.PI*freq/rate;
   const envelope=Math.max(0,Math.min(1,t/.12,(duration-t)/.13));
   const richness=Math.sin(phase)+.34*Math.sin(2*phase)+.14*Math.sin(3*phase);
   pcm[i]=.22*envelope*(1+.13*Math.sin(2*Math.PI*2.3*t))*richness;
  }
  const audio={sampleRate:rate,length:pcm.length,duration,numberOfChannels:1,getChannelData:()=>pcm};
  const out=await adapter.recognise(audio,()=>{},window.HumCore.estimatePitch);
  return out.events.map(e=>({start:e.start,end:e.end,midi:e.midi}));
 });
 const heldNotes=heldHum.filter(e=>e.midi!==null);
 assert.equal(heldNotes.length,1,
  'One sustained, vibrato-rich hum produced repeated notes: '+JSON.stringify(heldHum));
 console.log('PASS: real Spotify model returned ONE note for uninterrupted humming with vibrato.');
 // Exercise the REAL model beyond the previous 20-second audio limit.
 // Synthetic audio only. This is not a human humming or device performance test.
 const longModel=await page.evaluate(async()=>{
  const adapter=await import('./hum-to-compose-basic-pitch-adapter.js');
  const rate=22050,duration=25,data=new Float32Array(rate*duration);
  for(let i=0;i<data.length;i++){
   const t=i/rate;
   const midi=t<7?69:t<13?67:72;
   const active=t<6.8||t>7.2&&t<12.8||t>13.2&&t<24.8;
   if(active)data[i]=.35*Math.sin(2*Math.PI*440*Math.pow(2,(midi-69)/12)*t);
  }
  const audio={sampleRate:rate,length:data.length,duration,numberOfChannels:1,getChannelData:()=>data};
  const out=await adapter.recognise(audio,()=>{},window.HumCore.estimatePitch);
  return out.events.map(e=>({start:e.start,end:e.end,midi:e.midi}));
 });
 assert.ok(longModel.some(e=>e.midi!==null&&e.end>20),
  'Real Basic Pitch 25-second recording lost notes after 20 seconds: '+JSON.stringify(longModel));
 console.log('PASS: actual Spotify model recognised notes after 20 seconds using sequential overlapping sections.');

 // End-to-end reference-score comparison: input files are generated locally.
 // Real human audio is deliberately NOT claimed by this synthetic smoke test.
 const humanPitches=[60,62,64,65],humanBeat=.5,rate=22050;
 const samples=Math.round(humanPitches.length*humanBeat*rate),wav=Buffer.alloc(44+samples*2);
 wav.write('RIFF',0);wav.writeUInt32LE(36+samples*2,4);
 wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);
 wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);
 wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);
 wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);
 wav.write('data',36);wav.writeUInt32LE(samples*2,40);
 for(let i=0;i<samples;i++){
  const t=i/rate,slot=Math.min(humanPitches.length-1,Math.floor(t/humanBeat));
  const within=t-slot*humanBeat,hz=440*Math.pow(2,(humanPitches[slot]-69)/12);
  const envelope=Math.min(1,within/.025,(humanBeat-within)/.035);
  wav.writeInt16LE(Math.round(.3*Math.max(0,envelope)*Math.sin(2*Math.PI*hz*t)*32767),44+i*2);
 }
 await page.locator('#runHuman').click();
 assert.match(await page.locator('#humanResult').innerText(),/Choose both/);
 await page.locator('#humanAudio').setInputFiles({name:'test-synthetic.wav',mimeType:'audio/wav',buffer:wav});
 await page.locator('#humanScore').setInputFiles({
  name:'known-score.music-score.json',mimeType:'application/json',
  buffer:Buffer.from(JSON.stringify({name:'Known melody',meter:'4/4',tempo:120,
   notes:humanPitches.map(midi=>({midi,beats:1}))}))
 });
 await page.locator('#runHuman').click();
 await page.waitForFunction(()=>{
  const result=document.querySelector('#humanResult')?.textContent||'';
  return result.startsWith('Real-recording comparison complete')||
   result.startsWith('Real humming check could not finish');
 },null,{timeout:60000});
 const humanResult=await page.locator('#humanResult').innerText();
 assert.ok(humanResult.startsWith('Real-recording comparison complete'),
  'Reference-score benchmark failed: '+humanResult+'; page errors '+errors.join(' | '));
 assert.match(humanResult,/Reference melody: 4 notes/);
 assert.match(humanResult,/Timing-sensitive one-to-one F1:/);
 assert.deepEqual(errors,[],'Console error in real-recording comparison UI');
 console.log('PASS: real Spotify model completed browser file-upload vs reference-score comparison with generated waveform.');
 console.log('This does NOT prove human humming or Samsung microphone reliability.');
}
main().catch(e=>{console.error('LIVE SPOTIFY BROWSER TEST FAILED:',e);process.exitCode=1})
 .finally(async()=>{if(browser)await browser.close().catch(()=>{});if(server)await new Promise(resolve=>server.close(resolve))});
