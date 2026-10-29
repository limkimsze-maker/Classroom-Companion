const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),fixtures=path.join(__dirname,'fixtures/read-aloud');
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.woff2':'font/woff2','.wasm':'application/wasm','.json':'application/json'};
const sample='同学们，大家好。我们一起学习。',storage='cc-whiteboard-chinese-reader-voice-v1';
function mockSpeech(){
 window.__spoken=[];window.__cancelled=0;window.__voiceBehavior={};const timers=new Set(),listeners=[];
 window.__allVoices=[
  {voiceURI:'huihui',name:'Microsoft Huihui Desktop',lang:'zh-CN',localService:true},
  {voiceURI:'xiaoxiao-online',name:'Microsoft Xiaoxiao Online (Natural)',lang:'zh-CN',localService:false},
  {voiceURI:'google-mandarin',name:'Google 普通话（中国大陆）',lang:'zh-CN',localService:false},
  {voiceURI:'male',name:'Microsoft Kangkang',lang:'zh-CN',localService:true},
  {voiceURI:'cantonese',name:'Cantonese female',lang:'zh-HK',localService:true},
  {voiceURI:'english',name:'English device',lang:'en-GB',localService:true}
 ];
 window.__voiceData=new URLSearchParams(location.search).has('late')?[]:[...__allVoices];
 window.__emitVoices=()=>listeners.forEach(fn=>fn());
 const later=(fn,ms)=>{const timer=setTimeout(()=>{timers.delete(timer);fn()},ms);timers.add(timer)};
 Object.defineProperty(window,'SpeechSynthesisUtterance',{value:class {constructor(text){this.text=text}}});
 Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>__voiceData,resume(){},cancel(){__cancelled++;for(const timer of timers)clearTimeout(timer);timers.clear()},addEventListener(name,fn){if(name==='voiceschanged')listeners.push(fn)},speak(u){
  __spoken.push({text:u.text,uri:u.voice?.voiceURI,local:u.voice?.localService,rate:u.rate,pitch:u.pitch});
  const behavior=__voiceBehavior[u.voice?.voiceURI]||{};
  if(behavior.fail){later(()=>u.onerror?.({error:'network'}),10);return}
  later(()=>{u.onstart?.();later(()=>u.onend?.(),behavior.duration||20)},behavior.startDelay||10);
 }}});
 window.__audioOutputs=[];const C=window.AudioContext;
 window.AudioContext=new Proxy(C,{construct(Target,args){const context=new Target(...args),original=context.createBufferSource.bind(context);context.createBufferSource=()=>{const source=original(),start=source.start.bind(source);source.start=(...args)=>{if(source.buffer){let peak=0;for(const value of source.buffer.getChannelData(0))peak=Math.max(peak,Math.abs(value));__audioOutputs.push({peak,samples:source.buffer.length})}return start(...args)};return source};return context}});
}
async function writeText(page,text){
 await page.locator('#textBtn').click();const board=await page.locator('#board').boundingBox();await page.mouse.click(board.x+70,board.y+80);
 const editor=page.locator('#boardWrap>textarea');await editor.fill(text);await editor.press('Escape');await page.locator('#ccFingerPointerBtn').click();
 assert.equal(await page.evaluate(()=>ClassroomObjectSelection.hasSelection()),false);
}
async function idle(page){await page.waitForFunction(()=>CCReadAloud.state().state==='idle')}
function card(page,name){return page.locator('.cc-reader-voice-card').filter({hasText:name})}
(async()=>{
 const server=http.createServer((request,response)=>{const p=path.join(root,new URL(request.url,'http://local').pathname.replace(/^\/Classroom-Companion\//,''));if(!p.startsWith(root)||!fs.existsSync(p)||fs.statSync(p).isDirectory()){response.writeHead(404).end();return}response.setHeader('Content-Type',mime[path.extname(p)]||'application/octet-stream');fs.createReadStream(p).pipe(response)});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port+'/Classroom-Companion/whiteboard-smart-beta.html?edition=zh';
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--autoplay-policy=document-user-activation-required']});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),errors=[],requests=[];
  await context.addInitScript(mockSpeech);await context.route('https://cdn.counter.dev/**',r=>r.abort());await context.route('https://t.counter.dev/**',r=>r.abort());
  context.on('request',r=>requests.push(r.url()));context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
  const page=await context.newPage();await page.goto(base);await page.waitForSelector('#ccReadAloudBtn');
  const text='这是白板内容，请保留。';await writeText(page,text);const signature=await page.evaluate(()=>JSON.stringify(strokes));
  await page.locator('#ccReadAloudBtn').click();await idle(page);
  assert.equal(await page.evaluate(()=>__spoken.at(-1).uri),'huihui');assert.equal(await page.evaluate(()=>__spoken.some(x=>!x.local)),false);
  await page.locator('#ccChineseTryVoices').click();assert.equal(await page.locator('.cc-reader-voice-card').count(),3);
  assert.ok((await page.locator('#ccChineseVoicePicker').textContent()).includes('语音服务'));
  assert.equal(await card(page,'Kangkang').count(),0);assert.equal(await card(page,'Cantonese').count(),0);
  const online=card(page,'Microsoft Xiaoxiao Online');
  await online.locator('[data-chinese-voice-action=audition]').click();await idle(page);
  assert.deepEqual(await page.evaluate(()=>__spoken.at(-1)),{text:sample,uri:'xiaoxiao-online',local:false,rate:.85,pitch:1});
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),storage),null);
  assert.equal(await page.locator('#ccReadAloudText').inputValue(),text);assert.equal(await page.evaluate(()=>JSON.stringify(strokes)),signature);
  await page.locator('#ccReadAloudPanel [data-read-action=repeat]').click();await idle(page);assert.equal(await page.evaluate(()=>__spoken.at(-1).text),text);assert.equal(await page.evaluate(()=>__spoken.at(-1).uri),'huihui');
  const spokenCount=await page.evaluate(()=>__spoken.length);
  await online.locator('[data-chinese-voice-action=use]').click();assert.equal(await page.evaluate(()=>__spoken.length),spokenCount);
  let saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),storage);assert.equal(saved.kind,'voice');assert.equal(saved.online,true);assert.ok(!JSON.stringify(saved).includes(text));
  await page.locator('#ccReadAloudPanel [data-read-action=read]').click();await idle(page);assert.equal(await page.evaluate(()=>__spoken.at(-1).uri),'xiaoxiao-online');assert.equal(await page.evaluate(()=>__spoken.at(-1).text),text);
  assert.ok((await page.locator('#ccChineseCurrentVoice').textContent()).includes('在线'));
  console.log('CHINESE_VOICE_AUDITION_EXPLICIT_ONLINE_CHOICE_OK');

  // Reordering the browser's list cannot switch a saved voice to another speaker.
  await page.evaluate(()=>{__voiceData.reverse();__emitVoices()});
  await page.locator('#ccReadAloudPanel [data-read-action=read]').click();await idle(page);assert.equal(await page.evaluate(()=>__spoken.at(-1).uri),'xiaoxiao-online');
  await page.locator('#ccReadAloudSpeed').selectOption('1');
  await page.goto(base+'&late=1');await page.waitForSelector('#ccReadAloudBtn');await writeText(page,'恢复后的白板文字。');
  await page.locator('#ccReadAloudBtn').click();assert.equal(await page.locator('#ccReadAloudVoice').inputValue(),'saved-unavailable');assert.equal(await page.evaluate(()=>__spoken.length),0);assert.equal(await page.evaluate(()=>__audioOutputs.length),0);
  assert.ok((await page.locator('#ccReadAloudStatus').textContent()).includes('上次选择'));
  await page.evaluate(()=>{__voiceData=[...__allVoices].reverse();__emitVoices()});assert.equal(await page.evaluate(()=>__spoken.length),0);
  await page.locator('#ccReadAloudPanel [data-read-action=read]').click();await idle(page);assert.equal(await page.evaluate(()=>__spoken.at(-1).uri),'xiaoxiao-online');assert.equal(await page.evaluate(()=>__spoken.at(-1).rate),1);
  console.log('VOICE_PREFERENCE_RELOAD_REORDER_AND_LATE_VOICES_OK');

  // Document reading uses the chosen voice; samples leave document text/ink alone.
  await page.locator('#ccReadAloudPanel [data-read-action=close]').click();
  await page.locator('input[type=file][accept="*/*"]').setInputFiles(path.join(fixtures,'zh.docx'));await page.waitForFunction(()=>CCDocumentText.snapshot().ready);
  await page.evaluate(()=>{strokes.push({colour:'#2563eb',size:4,erase:false,points:[{x:.2,y:.2},{x:.35,y:.3}]});redraw();syncUi()});
  const annotation=await page.evaluate(()=>JSON.stringify(CCDocumentAnnotations.export()));await page.locator('#ccDocumentReadBtn').click();await page.waitForFunction(()=>document.getElementById('ccReadAloudText').value.length>0);await idle(page);
  const documentText=fs.readFileSync(path.join(fixtures,'zh.txt'),'utf8');assert.equal(await page.locator('#ccReadAloudText').inputValue(),documentText);assert.equal(await page.evaluate(()=>__spoken.at(-1).uri),'xiaoxiao-online');
  await page.locator('#ccChineseTryVoices').click();
  await page.evaluate(()=>{__voiceBehavior['xiaoxiao-online']={duration:5000}});await card(page,'Microsoft Xiaoxiao Online').locator('[data-chinese-voice-action=audition]').click();
  await page.waitForFunction(()=>CCReadAloud.state().state==='reading');await page.locator('#ccReadAloudPanel [data-read-action=stop]').click();assert.equal(await page.evaluate(()=>CCReadAloud.state().state),'idle');
  assert.equal(await page.locator('#ccReadAloudText').inputValue(),documentText);assert.equal(await page.evaluate(()=>JSON.stringify(CCDocumentAnnotations.export())),annotation);
  console.log('VOICE_PREVIEW_STOP_AND_DOCUMENT_PRESERVATION_OK');

  // Failed samples stay silent instead of substituting the synthetic backup.
  await page.evaluate(()=>{__voiceBehavior['xiaoxiao-online']={fail:true}});const audioCount=await page.evaluate(()=>__audioOutputs.length);
  await card(page,'Microsoft Xiaoxiao Online').locator('[data-chinese-voice-action=audition]').click();await idle(page);
  assert.equal(await page.evaluate(()=>__audioOutputs.length),audioCount);assert.equal(await card(page,'Microsoft Xiaoxiao Online').locator('[data-chinese-voice-action=use]').isDisabled(),true);
  assert.ok((await page.locator('#ccReadAloudStatus').textContent()).includes('暂时无法播放'));
  // A normal read still has a visible, working basic backup if a chosen voice fails.
  await page.locator('#ccReadAloudPanel [data-read-action=read]').click();await page.waitForFunction(n=>__audioOutputs.length>n&&CCReadAloud.state().state==='idle',audioCount,{timeout:30000});
  assert.ok((await page.locator('#ccChineseCurrentVoice').textContent()).includes('内置女声'));
  assert.ok(await page.evaluate(()=>__audioOutputs.at(-1).peak>.01));
  console.log('FAILED_VOICE_PREVIEW_AND_VISIBLE_READING_BACKUP_OK');

  await page.evaluate(()=>{__voiceBehavior.huihui={startDelay:2200}});await card(page,'Microsoft Huihui').locator('[data-chinese-voice-action=audition]').click();await idle(page);
  assert.ok((await card(page,'Microsoft Huihui').textContent()).includes('响应较慢'));
  await page.locator('#ccReadAloudPanel summary').click();await page.locator('#ccReadAloudVoice').selectOption('auto');
  const calls=await page.evaluate(()=>__spoken.length);await page.locator('#ccReadAloudPanel [data-read-action=read]').click();await idle(page);assert.equal(await page.evaluate(()=>__spoken.length),calls,'Automatic local mode should avoid a voice already measured to be slow');
  console.log('SLOW_VOICE_FEEDBACK_AND_AUTOMATIC_AVOIDANCE_OK');
  if(process.env.CC_VOICE_CHOOSER_SCREENSHOT){
   await page.addStyleTag({content:"@font-face{font-family:QACJK;src:url('experimental/chinese/fonts/LXGWWenKaiGB-Regular.woff2')}#ccReadAloudPanel,#ccReadAloudPanel *{font-family:system-ui,QACJK,sans-serif!important}"});
   await page.evaluate(()=>document.fonts.load('16px QACJK'));
   await page.locator('#ccReadAloudPanel').evaluate(el=>el.scrollTop=0);
   await page.screenshot({path:process.env.CC_VOICE_CHOOSER_SCREENSHOT.replace(/\.png$/, '-desktop.png')});
  }
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(100);
  const bounds=await page.locator('#ccReadAloudPanel').boundingBox();assert.ok(bounds.x>=0&&bounds.x+bounds.width<=391);
  assert.equal(await page.locator('#ccReadAloudPanel').evaluate(el=>el.scrollWidth>el.clientWidth),false);
  await page.locator('#ccReadAloudPanel').evaluate(el=>el.scrollTop=el.scrollHeight);
  const stopBounds=await page.locator('#ccReadAloudPanel [data-read-action=stop]').boundingBox();assert.ok(stopBounds.y>=bounds.y&&stopBounds.y+stopBounds.height<=bounds.y+bounds.height,'Stop must stay visible while scrolling voice samples');
  if(process.env.CC_VOICE_CHOOSER_SCREENSHOT)await page.screenshot({path:process.env.CC_VOICE_CHOOSER_SCREENSHOT});
  assert.deepEqual(requests.filter(url=>url.includes('/vendor/chinese-reader/')||url.includes('model-data.part')),[]);
  assert.deepEqual(errors,[]);console.log('LIGHTWEIGHT_MOBILE_VOICE_CHOOSER_OK');console.log('ALL_CHINESE_VOICE_CHOOSER_CHECKS_PASSED');
 }finally{await browser.close();server.close()}
})().catch(error=>{console.error(error);process.exit(1)});
