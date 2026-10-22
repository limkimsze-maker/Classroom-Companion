const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const {chromium}=require('playwright');const root=path.resolve(__dirname,'..');
const scripts=file=>Array.from(fs.readFileSync(path.join(root,file),'utf8').matchAll(/<script[^>]+src="([^"]+)"/g),m=>m[1]);
// Approved Alpha includes changes and additions beyond the earlier V2 trial.
 // Validate dependencies and key modules, not obsolete byte-identical bundles.
 const alpha=scripts('whiteboard.html').map(src=>src.split('?')[0]);
 const required=['whiteboard-core.js','experimental/math-structure/whiteboard-text-drag-resizable-v2.js',
 'whiteboard-classroom-pro.js','whiteboard-bar-move-handle-beta.js',
 'experimental/math-structure/smart-math-recognition-v2.js',
 'smart-math-comparison-segment-options-v3.js','whiteboard-document-open-my-documents-test.js',
 'whiteboard-document-right-rail-v1.js','experimental/math-structure/main-settings-v2.js',
 'my-documents-v1.js','whiteboard-speech-to-text-experiment.js'];
 for(const file of required)assert.equal(alpha.filter(x=>x===file).length,1,'Alpha requires one '+file);
 const mustPrecede=[['whiteboard-core.js','experimental/math-structure/whiteboard-text-drag-resizable-v2.js'],
 ['whiteboard-classroom-pro.js','experimental/math-structure/smart-math-recognition-v2.js'],
 ['whiteboard-document-open-my-documents-test.js','whiteboard-document-right-rail-v1.js']];
 for(const [a,b] of mustPrecede)assert(alpha.indexOf(a)<alpha.indexOf(b),a+' must load before '+b);
 console.log('PASS Alpha approved modules present, unique and ordered');

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
// Additional Alpha performance and bar-model controls smoke test.
await page.locator('#penBtn').click();
const penCursor=await page.locator('#board').evaluate(e=>getComputedStyle(e).cursor);
assert(penCursor.includes('data:image/svg+xml'),'Pen should show the cute pencil cursor');
await page.locator('#eraserBtn').click();
const eraserCursor=await page.locator('#board').evaluate(e=>getComputedStyle(e).cursor);
assert(eraserCursor.includes('data:image/svg+xml'),'Eraser should show an eraser cursor');
await page.locator('#selectBtn').click();
await page.evaluate(()=>{
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="900" height="440" viewBox="0 0 900 440"><rect x="180" y="60" width="650" height="58" rx="2" fill="#ffffff" stroke="#17324d" stroke-width="8"/><rect x="180" y="205" width="455" height="58" rx="2" fill="#ffffff" stroke="#17324d" stroke-width="8"/></svg>';
 const o={type:'image',smartType:'barModel',smartBarType:'comparison',smartId:'alpha-smoke-bar',x:.09,y:.10,w:.56,h:.53,barCount:2,barCompareWidths:[1,.7],src:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)};
 strokes.push(o);redraw();syncUi();
});
const grip=page.locator('#barModelScaleGrip');
await grip.waitFor({state:'visible',timeout:6000});
const beforeBar=await page.evaluate(()=>{const o=strokes.find(s=>s.smartId==='alpha-smoke-bar');return{w:o.w,h:o.h}});
const bb=await grip.boundingBox();assert(bb?.width>=30&&bb?.height>=30,'Green bar resize grip must be visible');
await page.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2);await page.mouse.down();
await page.mouse.move(bb.x+bb.width/2+46,bb.y+bb.height/2+24,{steps:12});await page.mouse.up();
const afterBar=await page.evaluate(()=>{const o=strokes.find(s=>s.smartId==='alpha-smoke-bar');return{w:o.w,h:o.h}});
assert(afterBar.w>beforeBar.w&&afterBar.h>beforeBar.h,'Bar drag grip must enlarge the whole model');
assert(Math.abs(afterBar.w/beforeBar.w-afterBar.h/beforeBar.h)<.001,'Bar model resize must be proportional');
const paint=await page.evaluate(async()=>{
 const t=performance.now();
 for(let i=0;i<25;i++)redraw();
 const synchronous=Math.round((performance.now()-t)*10)/10;
 await new Promise(ok=>requestAnimationFrame(()=>requestAnimationFrame(ok)));
 return {synchronousMs:synchronous,totalMs:Math.round((performance.now()-t)*10)/10,objects:strokes.length};
});
console.log('PASS',width,'pencil/eraser cursor, visible comparison-bar grip and proportional resize');
console.log('PERF',width,JSON.stringify({redraw25:paint,baselinePixelWidth:beforeBar.w,resizedPixelWidth:afterBar.w}));
await page.evaluate(()=>{strokes=strokes.filter(s=>s.smartId!=='alpha-smoke-bar');redraw();syncUi()});
await page.locator('input[type=file][accept="*/*"]').setInputFiles({name:'promotion-check.txt',mimeType:'text/plain',buffer:Buffer.from('V2 promotion check')});await page.waitForFunction(()=>document.body.classList.contains('document-open-mode'));await page.locator('#ccPermanentSaveBtn').waitFor({state:'visible'});await page.locator('#ccPermanentExitBtn').waitFor({state:'visible'});assert.equal(await page.locator('#ccPermanentSaveBtn').count(),1);await page.screenshot({path:'/tmp/alpha-v2-'+width+'.png'});await page.locator('#ccPermanentExitBtn').click();await page.waitForFunction(()=>!document.body.classList.contains('document-open-mode'));
assert.deepEqual(errors,[]);console.log('PASS',width,'V2 loader, shared learning, pen/undo, Settings, document Save/Exit, no script errors');await context.close();}}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});
