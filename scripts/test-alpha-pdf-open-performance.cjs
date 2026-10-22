'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),pdf=fs.readFileSync(path.join(root,'experimental/math-structure/fixtures/documents/pages.pdf'));
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const p=path.resolve(root,'.'+pathname);
 if(!p.startsWith(root+path.sep))return res.writeHead(403).end();
 const serve=()=>fs.readFile(p,(err,data)=>{
  if(err)return res.writeHead(404).end();
  res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.html')?'text/html':p.endsWith('.pdf')?'application/pdf':'application/octet-stream');
  res.end(data);
 });
 // Deliberate same-origin network delay, to reveal unnecessary sequential waits.
 // This does not stand in for a real school Wi-Fi benchmark.
 if(pathname.endsWith('/vendor/moe/pdf.min.js'))setTimeout(serve,380);
 else if(pathname.endsWith('/vendor/moe/pdf.worker.min.js'))setTimeout(serve,180);
 else serve();
});
(async()=>{
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{for(const width of [1365,390]){
  const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});
  await context.addInitScript(()=>{
    const native=Blob.prototype.arrayBuffer;
    Blob.prototype.arrayBuffer=function(...args){
      if(this.type==='application/pdf')return new Promise(done=>setTimeout(done,340)).then(()=>native.apply(this,args));
      return native.apply(this,args);
    };
  });
  const page=await context.newPage(),requests=[],errors=[];
  page.on('request',r=>requests.push(new URL(r.url()).pathname));
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/whiteboard.html',{waitUntil:'load'});
  await page.waitForFunction(()=>document.body.classList.contains('toolbar-ready'));
  assert.equal(await page.evaluate(()=>!!window.pdfjsLib),false,'PDF engine should not block initial startup');
  const input=page.locator('input[type=file][accept="*/*"]');
  const openPdf=async name=>{
    await page.evaluate(()=>{window.__startPdf=performance.now()});
    await input.setInputFiles({name,mimeType:'application/pdf',buffer:pdf});
    await page.waitForFunction(()=>document.body.classList.contains('document-open-mode')&&window.CCDocumentAnnotations?.ready()&&document.getElementById('documentPdfCanvas')?.width>80,null,{timeout:18000});
    return page.evaluate(()=>Math.round(performance.now()-window.__startPdf));
  };
  const coldMs=await openPdf('First Lesson.pdf');
  assert.equal(await page.evaluate(()=>window.CCDocumentAnnotations.pageCount()),2);
  await page.evaluate(()=>{strokes.push({colour:'#17324d',size:3,points:[{x:.2,y:.2},{x:.28,y:.26}]});redraw();syncUi()});
  await page.locator('#ccPermanentSaveBtn').click();
  await page.waitForFunction(()=>document.getElementById('ccPermanentSaveBtn').textContent.includes('Saved to My Documents'));
  await page.locator('#ccPermanentExitBtn').click();
  await page.waitForFunction(()=>!document.body.classList.contains('document-open-mode'));
  const warmMs=await openPdf('Second Lesson.pdf');
  assert.equal(await page.evaluate(()=>window.CCDocumentAnnotations.pageCount()),2);
  await page.locator('#ccPermanentExitBtn').click();
  await page.waitForFunction(()=>!document.body.classList.contains('document-open-mode'));
  assert.equal(requests.filter(s=>s.endsWith('/vendor/moe/pdf.min.js')).length,1,'PDF engine must be requested only once');
  assert.deepEqual(errors,[],'No uncaught JavaScript errors');
  console.log('PDF-OPEN',width,JSON.stringify({coldMs,warmMs,engineRequests:requests.filter(s=>s.endsWith('/vendor/moe/pdf.min.js')).length,
    workerRequests:requests.filter(s=>s.endsWith('/vendor/moe/pdf.worker.min.js')).length,
    simulatedFileReadDelayMs:340,simulatedEngineDelayMs:380,simulatedWorkerDelayMs:180}));
  await context.close();
 }}finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
