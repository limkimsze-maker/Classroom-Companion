/* UI smoke checks use synthetic pointer input, never teacher accuracy data.
 * Starts its own local test server. Optional PLAYWRIGHT_CHROMIUM_EXECUTABLE.
 */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawnSync}=require('node:child_process');
const url='http://127.0.0.1:8000/handwriting-teacher-validation.html';
const http=require('node:http');
const server=http.createServer((req,res)=>{const target=path.resolve(process.cwd(),'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!target.startsWith(process.cwd()+path.sep)){res.writeHead(403);res.end();return;}fs.readFile(target,(error,data)=>{if(error){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',target.endsWith('.js')?'text/javascript':target.endsWith('.json')?'application/json':target.endsWith('.html')?'text/html':'application/octet-stream');res.end(data);});});
(async()=>{await new Promise(resolve=>server.listen(8000,'127.0.0.1',resolve));const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{})});
try{
 const page=await browser.newPage({viewport:{width:1280,height:1000},acceptDownloads:true}),errors=[],outside=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(new URL(r.url()).origin!=='http://127.0.0.1:8000')outside.push(r.url());});
 await page.addInitScript(()=>{window.__readerMessages=[];const original=Worker.prototype.postMessage;Worker.prototype.postMessage=function(message,...args){window.__readerMessages.push(message);return original.call(this,message,...args);};});
 await page.goto(url);await page.waitForFunction(()=>document.getElementById('status').textContent.startsWith('Ready.'));
 assert(await page.locator('#start').isDisabled());await page.locator('#teacher').check();await page.locator('#fresh').check();await page.locator('#start').click();
 let box=await page.locator('#ink').boundingBox();await page.mouse.click(box.x+65,box.y+80);await page.mouse.move(box.x+100,box.y+60);await page.mouse.down();await page.mouse.move(box.x+100,box.y+210,{steps:8});await page.mouse.up();
 let captured=await page.evaluate(()=>JSON.parse(localStorage.getItem('classroom-natural-ink-priority6-v1')));assert.equal(captured.records[0].strokes.length,2);assert.equal(captured.records[0].strokes[0].points.length,1,'short taps retain decimal-point ink');
 const points=JSON.stringify(captured.records[0].strokes),width=captured.records[0].width;
 await page.setViewportSize({width:390,height:900});await page.waitForTimeout(60);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 captured=await page.evaluate(()=>JSON.parse(localStorage.getItem('classroom-natural-ink-priority6-v1')));assert.equal(captured.records[0].width,width);assert.equal(JSON.stringify(captured.records[0].strokes),points,'resizing preserves original ink geometry');
 if(process.env.VALIDATION_SCREENSHOT_DIR){fs.mkdirSync(process.env.VALIDATION_SCREENSHOT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.VALIDATION_SCREENSHOT_DIR,'teacher-test-mobile.png'),fullPage:true});}
 await page.locator('#undo').click();captured=await page.evaluate(()=>JSON.parse(localStorage.getItem('classroom-natural-ink-priority6-v1')));assert.equal(captured.records[0].strokes.length,1);
 await page.locator('#save').click();assert(await page.locator('#results').isHidden());assert(await page.locator('#seal').isHidden());
 await page.reload();await page.waitForFunction(()=>document.getElementById('progressText').textContent.startsWith('Item 2'));
 page.on('dialog',dialog=>dialog.accept('Synthetic UI skip, not handwriting data'));
 for(let i=1;i<24;i++)await page.locator('#skip').click();
 assert(await page.locator('#seal').isVisible());assert(await page.locator('#results').isHidden());
 await page.locator('#seal').click();assert(await page.locator('#capture').isHidden());
 await page.locator('#score').click();await page.waitForFunction(()=>document.getElementById('status').textContent.startsWith('Scoring finished.'),{timeout:60000});
 captured=await page.evaluate(()=>JSON.parse(localStorage.getItem('classroom-natural-ink-priority6-v1')));assert.equal(captured.report.summary.total,24);assert.equal(captured.report.summary.attempted,1);assert.equal(captured.report.summary.skipped,23);
 const messages=await page.evaluate(()=>window.__readerMessages);assert.equal(messages.length,1);assert.deepEqual(Object.keys(messages[0]).sort(),['height','id','strokes','width']);
 const downloadPromise=page.waitForEvent('download');await page.locator('#download').click();const download=await downloadPromise,tmp=fs.mkdtempSync(path.join(os.tmpdir(),'teacher-validation-smoke-')),exportPath=path.join(tmp,'synthetic-batch.json');await download.saveAs(exportPath);
 const imported=JSON.parse(fs.readFileSync(exportPath));assert.deepEqual(imported.records,captured.records,'downloads retain the original sealed pen traces');
 const replayPath=path.join(tmp,'replayed.json'),replay=spawnSync(process.execPath,['scripts/benchmark-natural-teacher-ink.cjs',exportPath,'--out',replayPath],{encoding:'utf8'});assert.equal(replay.status,0,replay.stderr);const replayed=JSON.parse(fs.readFileSync(replayPath));assert.deepEqual(replayed.reports[0].summary,captured.report.summary,'independent Node replay matches browser scoring');
 await page.setViewportSize({width:1280,height:1000});if(process.env.VALIDATION_SCREENSHOT_DIR)await page.screenshot({path:path.join(process.env.VALIDATION_SCREENSHOT_DIR,'teacher-test-results.png'),fullPage:true});
 const restored=await browser.newPage();await restored.goto(url);await restored.locator('#import').setInputFiles(exportPath);await restored.waitForFunction(()=>document.getElementById('status').textContent.startsWith('Test file loaded.'));assert(await restored.locator('#capture').isHidden());assert(await restored.locator('#results').isHidden(),'imported predictions are discarded and must be independently re-scored');
 await restored.route('**/validation/priority6/reader-frozen.js',route=>route.fulfill({status:200,body:'tampered reader',contentType:'text/javascript'}));await restored.locator('#score').click();await restored.waitForFunction(()=>document.getElementById('status').textContent.includes('verification failed'));assert(await restored.locator('#results').isHidden());assert(await restored.locator('#download').isEnabled());
 const privatePage=await browser.newPage({viewport:{width:390,height:900}});await privatePage.addInitScript(()=>{Storage.prototype.getItem=function(){throw Error('blocked')};Storage.prototype.setItem=function(){throw Error('blocked')};});await privatePage.goto(url);await privatePage.waitForFunction(()=>document.getElementById('status').textContent.startsWith('Ready.'));await privatePage.locator('#teacher').check();await privatePage.locator('#fresh').check();await privatePage.locator('#start').click();assert(await privatePage.locator('#capture').isVisible());assert((await privatePage.locator('#saveNote').innerText()).includes('unavailable'));
 assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);
 console.log('PASS browser natural-ink workflow: desktop/mobile, dot/pen strokes, original dimensions on resize, undo, resume, blind capture, sealing, skipped denominator, real isolated worker, label-free inference, download, independent replay, tamper rejection and blocked-storage recovery. Synthetic checks only.');
}finally{await browser.close();server.close();}})().catch(e=>{server.close();console.error(e);process.exitCode=1});
