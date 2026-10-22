'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..');
const fixture=fs.readFileSync(path.join(root,'experimental/math-structure/fixtures/documents/pages.pdf'));
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const p=path.resolve(root,'.'+pathname);
 if(!p.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.readFile(p,(err,data)=>{if(err)return res.writeHead(404).end();
 res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.html')?'text/html':'application/octet-stream');res.end(data)});
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{for(const width of [1365,390]){
  const context=await browser.newContext({viewport:{width,height:850},serviceWorkers:'block'});
  await context.addInitScript(()=>{
   const native=Blob.prototype.arrayBuffer;
   Blob.prototype.arrayBuffer=function(...args){
    if(this.type==='application/pdf')return new Promise(resolve=>setTimeout(resolve,750)).then(()=>native.apply(this,args));
    return native.apply(this,args);
   };
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/whiteboard-core.js?*',async route=>{await new Promise(r=>setTimeout(r,500));await route.continue()});
  const url='http://127.0.0.1:'+server.address().port+'/whiteboard.html';
  const navigation=page.goto(url,{waitUntil:'load'});
  await page.waitForFunction(()=>{
   const el=document.querySelector('#ccStartupLoading');
   return !!el&&getComputedStyle(el).display!=='none'&&el.textContent.includes('Loading...Please wait.');
  },null,{timeout:15000});
  console.log('PASS',width,'Startup message visible while whiteboard dependencies load');
  await navigation;await page.waitForFunction(()=>document.body.classList.contains('toolbar-ready'));
  assert.equal(await page.locator('#ccStartupLoading').evaluate(el=>getComputedStyle(el).display),'none','Startup message must vanish when toolbar ready');
  console.log('PASS',width,'Startup message dismissed when whiteboard is ready');
  const input=page.locator('input[type=file][accept="*/*"]');
  await input.setInputFiles({name:'Test Lesson.pdf',mimeType:'application/pdf',buffer:fixture});
  await page.waitForFunction(()=>document.body.classList.contains('document-open-mode')&&document.getElementById('ccDocumentLoading')&&!document.getElementById('ccDocumentLoading').hidden,null,{timeout:6000});
  assert.equal(await page.locator('#ccDocumentLoading').innerText(),'Loading...Please wait.');
  console.log('PASS',width,'Document message visible while PDF reads and renders');
  await page.waitForFunction(()=>window.CCDocumentAnnotations?.ready()&&document.getElementById('ccDocumentLoading')?.hidden,null,{timeout:16000});
  assert.equal(await page.locator('#ccDocumentLoading').isHidden(),true,'Document loading message disappears after annotations ready');
  const drawing=await page.evaluate(()=>({buttons:!!document.getElementById('penBtn'),pages:window.CCDocumentAnnotations.pageCount(),canv:document.getElementById('documentPdfCanvas')?.width}));
  assert(drawing.pages>=2&&drawing.canv>40,'PDF still opened and rendered');
  console.log('PASS',width,'Document message dismissed only after first PDF page and annotations are ready');
  await page.locator('#ccPermanentExitBtn').click();
  await page.waitForFunction(()=>!document.body.classList.contains('document-open-mode'));
  assert.equal(await page.locator('#ccDocumentLoading').isHidden(),true,'Exit hides document loading');
  console.log('PASS',width,'Exit leaves no loading overlay behind');
  assert.deepEqual(errors,[],'No uncaught browser errors');
  await context.close();
 }}finally{await browser.close();server.close()}
})().catch(err=>{console.error(err);server.close();process.exitCode=1});
