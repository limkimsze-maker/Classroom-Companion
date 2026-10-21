const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const {chromium}=require('playwright');const root=path.resolve(__dirname,'..');
const scripts=file=>Array.from(fs.readFileSync(path.join(root,file),'utf8').matchAll(/<script[^>]+src="([^"]+)"/g),m=>m[1]);
assert.deepEqual(scripts('whiteboard.html').slice(1).filter(src=>!src.startsWith('whiteboard-speech-to-text-experiment.js?')),scripts('whiteboard-v2-trial.html').slice(1),'Alpha must load the exact approved V2 bundle in the same order');
const server=http.createServer((req,res)=>{const p=path.join(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname));fs.readFile(p,(e,d)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',p.endsWith('.js')?'application/javascript':p.endsWith('.html')?'text/html':'application/octet-stream');res.end(d)})});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,args:['--no-sandbox']});try{for(const width of [1365,390]){const context=await browser.newContext({viewport:{width,height:900}});await context.addInitScript(()=>{
 window.SpeechRecognition=class {
  start(){window.__speechTest=this;this.started=true;}
  stop(){this.onend?.();}
  abort(){this.aborted=true;}
 };
});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));const base='http://127.0.0.1:'+server.address().port;
await page.goto(base+'/whiteboard-v2-trial.html');await page.evaluate(()=>localStorage.setItem('__promotion_probe','v2-learning'));
await page.goto(base+'/whiteboard.html?edition=en');await page.waitForFunction(()=>document.body.classList.contains('toolbar-ready'));
assert.equal(await page.evaluate(()=>localStorage.getItem('__promotion_probe')),'v2-learning');assert.equal(await page.title(),'Whiteboard V2 • Classroom Companion');await page.locator('#handwritingBeautifyBtn').waitFor({state:'visible'});
await page.locator('#penBtn').click();const b=await page.locator('#board').boundingBox();await page.mouse.move(b.x+25,b.y+50);await page.mouse.down();await page.mouse.move(b.x+110,b.y+95,{steps:6});await page.mouse.up();assert(await page.evaluate(()=>strokes.some(s=>s.points?.length>1)));await page.locator('#undoBtn').click();
await page.locator('#mainSettingsBtn').click();await page.locator('#mainSettingsDialog').waitFor();await page.locator('#mainSettingsDialog').getByRole('button',{name:'Close',exact:true}).click();
// Exercise the existing protected speech controller through its visible controls.
const speech=page.getByRole('button',{name:'🎙 Speech to Text',exact:true});
assert.equal(await speech.count(),1);await speech.click();
const transcript=page.getByRole('textbox',{name:'Speech transcript',exact:true});await transcript.waitFor({state:'visible'});
await transcript.fill('80 / 2 = 40');await page.getByRole('button',{name:'Convert maths',exact:true}).click();assert.equal(await transcript.inputValue(),'80 ÷ 2 = 40');
const count=await page.evaluate(()=>strokes.length);
await page.getByRole('button',{name:'Insert',exact:true}).click();
assert.equal(await page.evaluate(()=>strokes.length),count+1);assert.equal(await page.evaluate(()=>strokes.at(-1).text),'80 ÷ 2 = 40');assert.equal(await transcript.isVisible(),false);
await page.locator('#undoBtn').click();assert.equal(await page.evaluate(()=>strokes.length),count,'Speech insertion remains undoable');
await speech.click();await page.getByRole('button',{name:'🎙 Listen',exact:true}).click();
assert.equal(await page.evaluate(()=>window.__speechTest.started),true);
await page.evaluate(()=>window.__speechTest.onresult({results:[[{transcript:'ten times four equals forty'}]]}));
assert.equal(await transcript.inputValue(),'10 × 4 = 40');
await page.getByRole('button',{name:'Insert',exact:true}).click();assert.equal(await page.evaluate(()=>strokes.at(-1).text),'10 × 4 = 40');
await speech.click();await transcript.fill('Clear this transcript');await page.getByRole('button',{name:'Clear panel',exact:true}).click();assert.equal(await transcript.inputValue(),'');assert.equal(await page.evaluate(()=>window.__speechTest.aborted),true);
await page.screenshot({path:'/tmp/alpha-v2-speech-'+width+'.png'});
await page.getByRole('button',{name:'Close',exact:true}).click();assert.equal(await transcript.isVisible(),false);
console.log('PASS',width,'Speech button, panel, maths conversion, simulated recognition, insertion, Undo, Clear panel and Close');
await page.locator('input[type=file][accept="*/*"]').setInputFiles({name:'promotion-check.txt',mimeType:'text/plain',buffer:Buffer.from('V2 promotion check')});await page.waitForFunction(()=>document.body.classList.contains('document-open-mode'));await page.locator('#ccPermanentSaveBtn').waitFor({state:'visible'});await page.locator('#ccPermanentExitBtn').waitFor({state:'visible'});assert.equal(await page.locator('#ccPermanentSaveBtn').count(),1);await page.screenshot({path:'/tmp/alpha-v2-'+width+'.png'});await page.locator('#ccPermanentExitBtn').click();await page.waitForFunction(()=>!document.body.classList.contains('document-open-mode'));
assert.deepEqual(errors,[]);console.log('PASS',width,'V2 loader, shared learning, pen/undo, Settings, document Save/Exit, no script errors');await context.close();}}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});
