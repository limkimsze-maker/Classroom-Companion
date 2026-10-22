'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..');
const fixtures=[
 {name:'Test Lesson.pdf',type:'application/pdf',format:'Opening PDF…',content:fs.readFileSync(path.join(root,'experimental/math-structure/fixtures/documents/pages.pdf'))},
 {name:'Test Lesson.docx',type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',format:'Opening Word document…',content:fs.readFileSync(path.join(root,'experimental/math-structure/fixtures/documents/pages.docx'))},
 {name:'Test Lesson.pptx',type:'application/vnd.openxmlformats-officedocument.presentationml.presentation',format:'Opening PowerPoint…',content:fs.readFileSync(path.join(root,'experimental/math-structure/fixtures/documents/pages.pptx'))}
];
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
    if(this.type?.startsWith('application/'))return new Promise(resolve=>setTimeout(resolve,800)).then(()=>native.apply(this,args));
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
  for(const [index,fixture] of fixtures.entries()){
    if(index===0){
      // Click the actual UI control and verify feedback BEFORE a file is selected.
      const chooserEvent=page.waitForEvent('filechooser');
      await page.locator('#openDocumentBtn').click();
      const chooser=await chooserEvent;
      const immediately=await page.locator('#ccDocumentLoading').evaluate(el=>({
       visible:!el.hidden&&getComputedStyle(el).display!=='none',
       text:el.innerText,
       detail:el.querySelector('#ccLoadingDetail')?.textContent,
       tip:el.querySelector('#ccLoadingTip')?.textContent
      }));
      assert(immediately.visible,'Open File must show loading message before the file is selected');
      assert(immediately.text.includes('Loading...Please wait.'));
      assert(immediately.detail.includes('Choose a PDF, PowerPoint, Word or other file'));
      assert(immediately.tip.includes('reopen a local copy'));
      console.log('PASS',width,'Open button shows Loading...Please wait. BEFORE selecting a document');
      await chooser.setFiles({name:fixture.name,mimeType:fixture.type,buffer:fixture.content});
    }else await input.setInputFiles({name:fixture.name,mimeType:fixture.type,buffer:fixture.content});
    await page.waitForFunction(()=>document.body.classList.contains('document-open-mode')&&document.getElementById('ccDocumentLoading')&&!document.getElementById('ccDocumentLoading').hidden,null,{timeout:6000});
    const visible=await page.locator('#ccDocumentLoading').evaluate(el=>({
      text:el.innerText,detail:el.querySelector('#ccLoadingDetail')?.textContent,tip:el.querySelector('#ccLoadingTip')?.textContent
    }));
    assert(visible.text.includes('Loading...Please wait.'),'Core loading wording retained for '+fixture.name);
    assert.equal(visible.detail,fixture.format,'File type displayed for '+fixture.name);
    assert(visible.tip.includes('Save to My Documents for quicker access next time'),'Saving benefit is access, not claimed guaranteed speed');
    assert(visible.tip.includes('still requires processing'),'Rendering caveat is explicit');
    console.log('PASS',width,fixture.name,'visible type-specific progress and technically accurate save tip');
    await page.waitForFunction(()=>window.CCDocumentAnnotations?.ready()&&document.getElementById('ccDocumentLoading')?.hidden,null,{timeout:20000});
    const summary=await page.evaluate(()=>({
      mode:document.body.classList.contains('document-open-mode'),
      pageCount:window.CCDocumentAnnotations.pageCount(),
      visible:!document.getElementById('ccDocumentLoading').hidden
    }));
    assert(summary.mode&&summary.pageCount>=1&&!summary.visible,'Ready '+fixture.name+' must hide loading overlay');
    console.log('PASS',width,fixture.name,'loading overlay hidden after page ready');

    if(fixture.name.endsWith('.pdf')){
      await page.locator('#ccPermanentSaveBtn').click();
      await page.waitForFunction(()=>document.getElementById('ccPermanentSaveBtn').textContent.includes('Saved to My Documents'));
    }
    await page.locator('#ccPermanentExitBtn').click();
    await page.waitForFunction(()=>!document.body.classList.contains('document-open-mode'));
    assert.equal(await page.locator('#ccDocumentLoading').isHidden(),true,'Exit must hide document status');
  }
  // A cancelled file picker must not leave an overlay blocking the whiteboard.
  const cancelEvent=page.waitForEvent('filechooser');
  await page.locator('#openDocumentBtn').click();
  const cancelledChooser=await cancelEvent;
  assert.equal(await page.locator('#ccDocumentLoading').isVisible(),true,'Loading feedback visible while file picker is open');
  await cancelledChooser.setFiles([]);
  // Simulate a native cancel event for compatibility across automation engines.
  await input.dispatchEvent('cancel');
  await page.waitForFunction(()=>document.getElementById('ccDocumentLoading')?.hidden,null,{timeout:4000});
  assert.equal(await page.locator('#ccDocumentLoading').isHidden(),true,'Cancel must clear the loading overlay');
  console.log('PASS',width,'Cancel File picker hides loading feedback');
    await page.getByRole('button',{name:/My Documents/}).first().click();
  await page.locator('#ccDocsDialog').waitFor({state:'visible'});
  await page.locator('#ccDocsDialog').getByRole('button',{name:'Open',exact:true}).first().click();
  await page.waitForFunction(()=>document.body.classList.contains('document-open-mode')&&!document.getElementById('ccDocumentLoading')?.hidden,null,{timeout:7000});
  const savedTip=await page.locator('#ccLoadingTip').innerText();
  assert(savedTip.includes('saved copy from My Documents'),'Saved file status describes local copy');
  assert(savedTip.includes('may still take time to process and display'),'No false promise of faster rendering');
  await page.waitForFunction(()=>window.CCDocumentAnnotations?.ready()&&document.getElementById('ccDocumentLoading')?.hidden,null,{timeout:16000});
  console.log('PASS',width,'Saved My Documents copy shows accurate local reuse message, then clears');
  await page.locator('#ccPermanentExitBtn').click();
  await page.waitForFunction(()=>!document.body.classList.contains('document-open-mode'));
  assert.deepEqual(errors,[],'No uncaught browser errors');
  await context.close();
 }}finally{await browser.close();server.close()}
})().catch(err=>{console.error(err);server.close();process.exitCode=1});
