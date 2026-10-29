const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),fixtures=path.join(__dirname,'fixtures/read-aloud');
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.woff2':'font/woff2','.wasm':'application/wasm','.json':'application/json','.gz':'application/octet-stream'};
function audioObserver(){
 window.__audioOutputs=[];const C=window.AudioContext;window.AudioContext=new Proxy(C,{construct(Target,args){const c=new Target(...args),create=c.createBufferSource.bind(c);c.createBufferSource=()=>{const s=create(),start=s.start.bind(s);s.start=(...args)=>{if(s.buffer){let peak=0;const samples=s.buffer.getChannelData(0);for(const v of samples)peak=Math.max(peak,Math.abs(v));__audioOutputs.push({peak,samples:samples.length,rate:s.buffer.sampleRate})}return start(...args)};return s};return c}});
}
function mockVoices(){
 window.__spoken=[];window.__cancelled=0;window.__nativeSilent=false;window.__nativeDelay=15;let active=null;
 Object.defineProperty(window,'SpeechSynthesisUtterance',{value:class {constructor(text){this.text=text}}});
 window.__voiceData=[{name:'Microsoft Sonia Online (Natural)',lang:'en-GB',localService:false},{name:'Microsoft Kangkang',lang:'zh-SG',localService:true},{name:'Chinese device',lang:'zh-CN',localService:true},{name:'Google 普通话（中国大陆）',lang:'zh-CN',localService:false},{name:'Microsoft Xiaoxiao Online (Natural)',lang:'zh-CN',localService:false},{name:'Microsoft Huihui Desktop',lang:'zh-CN',localService:true},{name:'Microsoft Xiaoxiao Natural',lang:'zh-CN',localService:true},{name:'Cantonese female',lang:'zh-HK',localService:true},{name:'Microsoft Yasmin Online (Natural)',lang:'ms-MY',localService:false},{name:'Microsoft Venba Online (Natural)',lang:'ta-SG',localService:false}];
 Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>__voiceData,resume(){},cancel(){window.__cancelled++;if(active){clearTimeout(active);active=null}},speak(u){__spoken.push({text:u.text,lang:u.lang,rate:u.rate,voice:u.voice?.name});if(window.__nativeSilent)return;u.onstart?.();active=setTimeout(()=>{active=null;u.onend?.()},window.__nativeDelay)},addEventListener(){}}});
}
(async()=>{
 const server=http.createServer((q,s)=>{const u=new URL(q.url,'http://local'),p=path.join(root,u.pathname.replace(/^\/Classroom-Companion\//,''));if(!p.startsWith(root)||!fs.existsSync(p)||fs.statSync(p).isDirectory()){s.writeHead(404).end();return}s.setHeader('Content-Type',mime[path.extname(p)]||'application/octet-stream');fs.createReadStream(p).pipe(s)});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--autoplay-policy=document-user-activation-required']});
 const base='http://127.0.0.1:'+server.address().port;
 const errors=[];
 try{
 const context=await browser.newContext({viewport:{width:1440,height:1000}});await context.route('https://cdn.counter.dev/**',route=>route.abort());await context.route('https://t.counter.dev/**',route=>route.abort());context.on('page',p=>p.on('pageerror',e=>{errors.push(e.message);console.log('PAGEERROR',e.message)}));
 for(const [code,label,sample] of [['en','Read all whiteboard text','Today we learn together.'],['zh','朗读白板全部文字','今天我们一起学习。'],['ms','Baca semua teks papan putih','Hari ini kita belajar bersama.'],['ta','வெண்பலகையின் முழு உரையையும் வாசி','இன்று நாம் ஒன்றாகக் கற்கிறோம்.']]){
  const page=await context.newPage();await page.addInitScript(mockVoices);await page.goto(base+'/Classroom-Companion/whiteboard-smart-beta.html?edition='+code);await page.waitForFunction(()=>!!CCReadAloud&&!!document.getElementById('ccReadAloudBtn'));
  await page.locator('#textBtn').click();const box=await page.locator('#board').boundingBox();await page.mouse.click(box.x+70,box.y+80);
  const editor=page.locator('#boardWrap>textarea');await editor.fill(sample);await editor.press('Escape');await page.locator('#ccFingerPointerBtn').click();
  assert.equal(await page.evaluate(()=>ClassroomObjectSelection.hasSelection()),false);
  const original=await page.evaluate(()=>JSON.stringify(strokes));
  await page.getByRole('button',{name:label,exact:true}).first().click();assert.equal(await page.locator('#ccReadAloudText').inputValue(),sample);assert.equal(await page.locator('#ccReadAloudLanguage').inputValue(),code);await page.waitForFunction(()=>CCReadAloud.state().state==='idle'&&__spoken.length>0);assert.equal(await page.evaluate(()=>__spoken.map(x=>x.text).join('')),sample);
  assert.equal(await page.evaluate(()=>__spoken[0].rate),code==='zh'?.85:1);
  if(code==='zh'){assert.equal(await page.evaluate(()=>__spoken[0].voice),'Google 普通话（中国大陆）');assert.equal(await page.locator('#ccReadAloudVoice').inputValue(),'google-mandarin');assert.equal(await page.locator('#ccChineseTryVoices').count(),0);console.log('GOOGLE_MANDARIN_DEFAULT_OK')}
  assert.equal(await page.locator('#ccReadAloudPanel').isVisible(),false);
  if(code!=='zh')assert.equal(await page.evaluate(()=>__spoken[0].voice),({en:'Microsoft Sonia Online (Natural)',ms:'Microsoft Yasmin Online (Natural)',ta:'Microsoft Venba Online (Natural)'})[code]);
  const pdfSamples={
   en:['The teacher began\nreading to the children.','The teacher began reading to the children.'],
   ms:['Cikgu membaca cerita\nkepada murid di kelas.','Cikgu membaca cerita kepada murid di kelas.'],
   ta:['ஆசிரியர் மாணவர்களுக்கு\nகதை வாசித்தார்.','ஆசிரியர் மாணவர்களுக்கு கதை வாசித்தார்.']
  };
  if(code!=='zh'){
   const [input,expected]=pdfSamples[code];const reflowed=await page.evaluate(([source,locale])=>CCReadAloud.reflowPdfForSpeech(source,locale),[input,code]);assert.equal(reflowed,expected);
   assert.equal(await page.evaluate(text=>CCReadAloud.splitText(text,document.getElementById('ccReadAloudLanguage').value).length,expected),1);
  }
  await page.evaluate(()=>{__spoken=[]});
  if(code==='zh'){
   assert.equal(await page.locator('#ccReadAloudPanel').isVisible(),false);
   assert.equal(await page.locator('#ccReadAloudQuickSpeed').inputValue(),'0.85');
   await page.locator('#ccReadAloudQuickSpeed').selectOption('0.85');
   await page.locator('#ccReadAloudBtn').click();await page.waitForFunction(()=>CCReadAloud.state().state==='idle'&&__spoken.length>0);
   const spoken=await page.evaluate(()=>__spoken);assert.equal(spoken[0].text,sample);assert.equal(spoken[0].rate,.85);
   await page.evaluate(()=>{window.__nativeDelay=3000});await page.locator('#ccReadAloudBtn').click();
   assert.equal(await page.evaluate(()=>CCReadAloud.state().state),'reading');
   assert.equal(await page.locator('#ccReadAloudBtn').getAttribute('aria-pressed'),'true');
   await page.locator('#ccReadAloudBtn').click();assert.equal(await page.evaluate(()=>CCReadAloud.state().state),'idle');
   assert.equal(await page.locator('#ccReadAloudBtn').getAttribute('aria-pressed'),'false');
   assert.equal(await page.locator('#ccReadAloudPanel').isVisible(),false);await page.evaluate(()=>{window.__nativeDelay=15});
  }else{
   // The full reader is retained for advanced/internal tests, but hidden from ordinary users.
   await page.evaluate(()=>CCReadAloud.open());
   await page.locator('#ccReadAloudSpeed').selectOption('0.85');await page.locator('#ccReadAloudPanel [data-read-action=read]').click();await page.waitForFunction(()=>CCReadAloud.state().state==='idle'&&__spoken.length>0);
   let spoken=await page.evaluate(()=>__spoken);assert.equal(spoken[0].text,sample);assert.equal(spoken[0].rate,.85);assert.ok(spoken[0].lang.startsWith(code));
   const target=sample.slice(0,code==='ta'?5:4);await page.locator('#ccReadAloudText').evaluate((el,n)=>{el.focus();el.setSelectionRange(0,n)},target.length);await page.locator('#ccReadAloudPanel [data-read-action=read]').click();await page.waitForFunction(()=>CCReadAloud.state().state==='idle');spoken=await page.evaluate(()=>__spoken);assert.equal(spoken.at(-1).text,target);
   await page.locator('#ccReadAloudPanel [data-read-action=repeat]').click();await page.waitForFunction(()=>CCReadAloud.state().state==='idle');assert.equal(await page.evaluate(()=>__spoken.at(-1).text),target);
   await page.evaluate(()=>{window.__nativeDelay=3000});await page.locator('#ccReadAloudPanel [data-read-action=read]').click();await page.locator('#ccReadAloudPanel [data-read-action=stop]').click();assert.equal(await page.evaluate(()=>CCReadAloud.state().state),'idle');await page.evaluate(()=>{window.__nativeDelay=15});
  }
  assert.equal(await page.evaluate(()=>JSON.stringify(strokes)),original);
  if(code!=='zh')await page.locator('#ccReadAloudText').press('Escape');assert.equal(await page.locator('#ccReadAloudPanel').isVisible(),false);assert.equal(await page.evaluate(()=>tool),'finger');
  // Speech-to-text output uses the same read-only selection bridge and stays undoable.
  const inserted=sample+'\n'+sample;await page.evaluate(text=>{const detail={text};document.dispatchEvent(new CustomEvent('whiteboard-insert-speech-text',{detail}));if(!detail.inserted)throw Error('Speech insertion failed')},inserted);
  await page.locator('#ccReadAloudBtn').click();assert.ok((await page.locator('#ccReadAloudText').inputValue()).includes(inserted));await page.waitForFunction(()=>CCReadAloud.state().state==='idle');assert.equal(await page.locator('#ccReadAloudPanel').isVisible(),false);await page.locator('#undoBtn').click();assert.equal(await page.evaluate(()=>JSON.stringify(strokes)),original);
  // Open actual Word files, then select passages in the extracted original text.
  await page.locator('input[type=file][accept="*/*"]').setInputFiles(path.join(fixtures,code+'.docx'));await page.waitForFunction(()=>CCDocumentText.snapshot().ready);
  await page.evaluate(()=>{strokes.push({colour:'#2563eb',size:4,erase:false,points:[{x:.2,y:.2},{x:.35,y:.3}]});redraw();syncUi()});const before=await page.evaluate(()=>JSON.stringify(CCDocumentAnnotations.export()));
  await page.locator('#ccDocumentReadBtn').click();await page.waitForFunction(()=>document.getElementById('ccReadAloudText').value.length>0);
  assert.equal((await page.locator('#ccReadAloudText').inputValue()).trim(),fs.readFileSync(path.join(fixtures,code+'.txt'),'utf8'));
  await page.waitForFunction(()=>CCReadAloud.state().state==='idle');assert.equal(await page.locator('#ccReadAloudPanel').isVisible(),false);assert.equal(await page.evaluate(()=>JSON.stringify(CCDocumentAnnotations.export())),before);
  await page.locator('#ccPermanentExitBtn').click();assert.equal(await page.evaluate(()=>JSON.stringify(strokes)),original);
  console.log('NATIVE_VOICE_AND_WORD_OK',code,label);
  if(code==='en'){
   await page.locator('input[type=file][accept="*/*"]').setInputFiles(path.join(fixtures,'text.pdf'));await page.waitForFunction(()=>CCDocumentText.snapshot().ready);await page.locator('#ccDocumentReadBtn').click();await page.waitForFunction(()=>document.getElementById('ccReadAloudText').value.includes('first page')&&CCReadAloud.state().state==='idle');await page.evaluate(()=>CCReadAloud.open());await page.waitForFunction(()=>!document.getElementById('ccReadAloudPanel').hidden&&document.getElementById('ccReadAloudText').value.includes('first page'));
   assert.ok(!(await page.locator('#ccReadAloudText').inputValue()).includes('Second'));
   await page.evaluate(()=>{window.__nativeDelay=5000});await page.locator('#ccReadAloudPanel [data-read-action=read]').click();assert.equal(await page.evaluate(()=>CCReadAloud.state().state),'reading');
   await page.locator('#documentRailZoomRow').getByRole('button',{name:'+',exact:true}).click();await page.waitForFunction(()=>CCDocumentText.snapshot().ready);assert.equal(await page.evaluate(()=>CCReadAloud.state().state),'reading');
   await page.evaluate(()=>{const input=document.querySelector('#documentQuickBar input[type=number]');input.value='2';input.dispatchEvent(new Event('change',{bubbles:true}))});await page.waitForFunction(()=>CCDocumentText.snapshot().ready&&CCDocumentText.snapshot().page===2);assert.equal(await page.evaluate(()=>CCReadAloud.state().state),'idle');assert.equal(await page.locator('#ccReadAloudText').inputValue(),'');
   await page.locator('#ccReadAloudPanel [data-read-action=document]').click();await page.waitForFunction(()=>document.getElementById('ccReadAloudText').value.includes('Second page'));
   await page.locator('#ccReadAloudPanel [data-read-action=close]').click();await page.locator('#ccPermanentExitBtn').click();
   await page.locator('input[type=file][accept="*/*"]').setInputFiles(path.join(fixtures,'scan.pdf'));await page.waitForFunction(()=>CCDocumentText.snapshot().ready);await page.locator('#ccDocumentReadBtn').click();await page.waitForFunction(()=>document.getElementById('ccReadAloudStatus').textContent.includes('OCR'));assert.equal(await page.locator('#ccReadAloudText').inputValue(),'');await page.locator('#ccReadAloudPanel [data-read-action=close]').click();await page.locator('#ccPermanentExitBtn').click();
   console.log('PDF_PAGE_AND_SCAN_HANDLING_OK');
  }
  await page.close();
 }
 // A single click reads every text box with no selected object, in visual order.
 const board=await context.newPage();await board.addInitScript(mockVoices);await board.addInitScript(audioObserver);await board.goto(base+'/Classroom-Companion/whiteboard-smart-beta.html?edition=en');await board.waitForSelector('#ccReadAloudBtn');
 for(const [text,x,y] of [['Bottom sentence.',80,300],['Top right.',600,80],['Top left.',80,80]]){
  await board.locator('#textBtn').click();const box=await board.locator('#board').boundingBox();await board.mouse.click(box.x+x,box.y+y);const editor=board.locator('#boardWrap>textarea');await editor.fill(text);await editor.press('Escape');
 }
 await board.locator('#ccFingerPointerBtn').click();assert.equal(await board.evaluate(()=>ClassroomObjectSelection.hasSelection()),false);const signature=await board.evaluate(()=>JSON.stringify(strokes));
 await board.locator('#ccReadAloudBtn').click();await board.waitForFunction(()=>CCReadAloud.state().state==='idle'&&__spoken.length===1);assert.deepEqual(await board.evaluate(()=>__spoken.map(x=>x.text).join('')),'Top left.\nTop right.\nBottom sentence.');assert.equal(await board.evaluate(()=>JSON.stringify(strokes)),signature);
 assert.equal(await board.locator('#ccReadAloudPanel').isVisible(),false);await board.locator('#ccReadAloudBtn').focus();await board.locator('#ccReadAloudBtn').press('Enter');await board.waitForFunction(()=>CCReadAloud.state().state==='idle'&&__spoken.length===2);assert.equal(await board.evaluate(()=>tool),'finger');
 await board.evaluate(()=>{__nativeSilent=true});await board.locator('#ccReadAloudBtn').click();await board.waitForFunction(()=>__audioOutputs.length>=1&&CCReadAloud.state().state==='idle',null,{timeout:25000});assert.equal(await board.evaluate(()=>__spoken.length),3,'A stalled device voice should be attempted only once before local fallback');assert.equal(await board.evaluate(()=>JSON.stringify(strokes)),signature);console.log('READ_WHOLE_BOARD_WITHOUT_SELECTION_OK');console.log('STALLED_DEVICE_VOICE_FALLBACK_OK');await board.close();
 // A missing Google voice stays unavailable rather than substituting another speaker.
 const mandarin=await context.newPage();await mandarin.addInitScript(mockVoices);await mandarin.addInitScript(audioObserver);await mandarin.goto(base+'/Classroom-Companion/whiteboard-smart-beta.html?edition=zh');await mandarin.waitForSelector('#ccReadAloudBtn');
 await mandarin.evaluate(()=>{__voiceData=__voiceData.filter(v=>!v.name.startsWith('Google'));strokes.push({type:'text',text:'同学们，请慢慢地读。',x:.1,y:.1,w:.5,h:.2,size:24,font:'Arial',colour:'#111'});redraw();syncUi()});
 await mandarin.locator('#ccReadAloudBtn').click();await mandarin.waitForFunction(()=>CCReadAloud.state().state==='idle');assert.equal(await mandarin.evaluate(()=>__spoken.length),0);assert.equal(await mandarin.evaluate(()=>__audioOutputs.length),0);assert.ok((await mandarin.locator('#ccReadAloudStatus').textContent()).includes('Google'));
 await mandarin.evaluate(()=>{__voiceData.push({name:'Google 普通话（中国大陆）',lang:'zh-CN',localService:false})});await mandarin.locator('#ccReadAloudBtn').click();await mandarin.waitForFunction(()=>CCReadAloud.state().state==='idle'&&__spoken.length>0);assert.equal(await mandarin.evaluate(()=>__spoken.at(-1).voice),'Google 普通话（中国大陆）');console.log('GOOGLE_MANDARIN_MISSING_AND_LATE_VOICE_OK');await mandarin.close();
 // Real local synthesis and playback, without any installed/system voice.
 const local=await context.newPage();local.on('console',m=>{if(m.type()==='warning')console.log('LOCAL_WARNING',m.text())});await local.addInitScript(audioObserver);await local.goto(base+'/Classroom-Companion/whiteboard-smart-beta.html?edition=en');await local.waitForSelector('#ccReadAloudBtn');
 await local.evaluate(()=>{const obj={type:'text',text:'Hello.',x:.1,y:.1,w:.5,h:.2,size:24,font:'Arial',colour:'#111'};strokes.push(obj);tool='select';syncUi();ClassroomObjectSelection.select(obj)});await local.evaluate(()=>CCReadAloud.open());await local.locator('#ccReadAloudPanel summary').click();
 const unsupportedRequests=[];local.on('request',r=>{if(!new URL(r.url()).hostname.match(/127\.0\.0\.1|counter\.dev/))unsupportedRequests.push(r.url())});
 for(const [code,text] of [['en','Hello, class.'],['ms','Selamat pagi.'],['ta','வணக்கம்.']]){
  await local.evaluate(text=>{document.getElementById('ccReadAloudText').value=text},text);await local.locator('#ccReadAloudLanguage').selectOption(code);await local.locator('#ccReadAloudVoice').selectOption('builtin');await local.locator('#ccReadAloudSpeed').selectOption('1.3');
  const count=await local.evaluate(()=>__audioOutputs.length);await local.locator('#ccReadAloudPanel [data-read-action=read]').click();await local.waitForFunction(n=>__audioOutputs.length>n,count,{timeout:45000});await local.waitForFunction(()=>CCReadAloud.state().state==='idle',null,{timeout:20000});const audio=await local.evaluate(()=>__audioOutputs.at(-1));assert.ok(audio.peak>.01&&audio.samples>1000);console.log('REAL_LOCAL_VOICE_OK',code,JSON.stringify(audio));
 }
 assert.deepEqual(unsupportedRequests,[]);console.log('NO_EXTERNAL_TEXT_REQUESTS');
 // Chunking preserves Tamil graphemes and long text exactly (apart from whitespace).
 const chunks=await local.evaluate(()=>CCReadAloud.splitText('நாம் தமிழில் படிக்கிறோம். '.repeat(90),'ta'));assert.ok(chunks.length>10);assert.ok(chunks.every(x=>x.text.length<1200));assert.equal(chunks.map(x=>x.text).join('').replace(/\s/g,''),'நாம் தமிழில் படிக்கிறோம். '.repeat(90).replace(/\s/g,''));
 await local.setViewportSize({width:390,height:844});await local.waitForTimeout(250);const bounds=await local.locator('#ccReadAloudPanel').boundingBox();assert.ok(bounds.x>=0&&bounds.x+bounds.width<=391);if(process.env.CC_READ_ALOUD_SCREENSHOT)await local.screenshot({path:process.env.CC_READ_ALOUD_SCREENSHOT});console.log('MOBILE_READER_OK');
 assert.deepEqual(errors,[]);console.log('NO_PAGE_ERRORS');console.log('ALL_READ_ALOUD_CHECKS_PASSED');
 }finally{await browser.close();server.close()}
})().catch(error=>{console.error(error);process.exit(1)});
