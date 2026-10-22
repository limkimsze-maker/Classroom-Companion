'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const fixture=path.join(root,'experimental/math-structure/fixtures/documents/pages.pdf');
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(!file.startsWith(root+'/'))return res.writeHead(403).end();
 fs.readFile(file,(err,data)=>{if(err)return res.writeHead(404).end();res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.html')?'text/html':'application/octet-stream');res.end(data)});
});
async function storage(page){
 return page.evaluate(async()=>{
  const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('cc-my-documents-v1');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
  return await new Promise((resolve,reject)=>{const r=db.transaction('files').objectStore('files').getAll();r.onsuccess=()=>resolve(r.result.map(v=>({id:v.id,name:v.name,pages:v.annotations?.pages||{},hasBlob:!!v.blob})));r.onerror=()=>reject(r.error)});
 });
}
function ink(y){
 return {colour:'#17324d',size:3,points:[{x:.19,y},{x:.32,y:y+.045},{x:.39,y:y+.07}]};
}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{for(const width of [1365,390]){
  const ctx=await browser.newContext({viewport:{width,height:900}});
  const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const url='http://127.0.0.1:'+server.address().port+'/whiteboard.html?edition=en';
  await page.goto(url,{waitUntil:'load'});await page.waitForFunction(()=>document.body.classList.contains('toolbar-ready'));
  await page.locator('input[type=file][accept="*/*"]').setInputFiles({name:'pages.pdf',mimeType:'application/pdf',buffer:fs.readFileSync(fixture)});
  await page.waitForFunction(()=>document.body.classList.contains('document-open-mode')&&document.getElementById('documentPdfCanvas')?.width>80);
  await page.waitForFunction(()=>window.CCDocumentAnnotations?.ready(),null,{timeout:15000});
  await page.waitForTimeout(220);
  assert.equal(await page.locator('#ccAnnotationActionsBtn').count(),1,'Annotation actions menu exists');
  const menu=page.locator('#ccAnnotationActionsDialog');
  const openMenu=async()=>{await page.locator('#ccAnnotationActionsBtn').click();await menu.waitFor({state:'visible'})};
  const closeMenu=async()=>{await menu.getByRole('button',{name:'✕ Close'}).click();await menu.waitFor({state:'hidden'})};
  const goto=async n=>{
   await page.locator('#documentQuickBar input[type=number]').evaluate((el,v)=>{el.value=String(v);el.dispatchEvent(new Event('change',{bubbles:true}))},n);
   await page.waitForTimeout(580);
  };
  await page.evaluate(fn=>{strokes.push(fn);redraw();syncUi()},ink(.18));
  assert.equal(await page.evaluate(()=>strokes.length),1,'Page 1 annotation created');
  await openMenu();await menu.getByRole('button',{name:'💾 Save this page'}).click();
  await page.waitForTimeout(450);
  console.log('SAVE-DIAGNOSTIC',width,JSON.stringify(await page.evaluate(()=>({
    status:document.getElementById('ccAnnotationActionStatus')?.textContent,
    controller:!!window.CCDocumentAnnotations,
    isOpen:window.CCDocumentAnnotations?.isOpen(),
    docTitle:document.title,
    toolbarButton:document.getElementById('ccPermanentSaveBtn')?.textContent,
    saveButtonDisabled:[...document.querySelectorAll('#ccAnnotationActionsDialog button')].find(b=>b.textContent.includes('Save this page'))?.disabled,
    saveHandler:[...document.querySelectorAll('#ccAnnotationActionsDialog button')].find(b=>b.textContent.includes('Save this page'))?.onclick?.toString().slice(0,120),
    modalHidden:document.getElementById('ccAnnotationActionsDialog')?.hidden
  }))));
  await page.waitForFunction(()=>document.getElementById('ccAnnotationActionStatus')?.textContent.includes('Saved locally'),{timeout:4000});
  let docs=await storage(page);
  assert.equal(docs.length,1);
  assert.equal(docs[0].pages['pdf:1']?.length,1);
  assert(docs[0].hasBlob,'original document saved');
  console.log('PASS',width,'Save this page stores original document and page 1 annotations');
  await closeMenu();
  await goto(2);
  assert.equal(await page.evaluate(()=>strokes.length),0,'Page 2 has no page 1 ink');
  await page.evaluate(fn=>{strokes.push(fn);redraw();syncUi()},ink(.25));
  await openMenu();await menu.getByRole('button',{name:'💾 Save whole document'}).click();
  await page.waitForFunction(()=>document.getElementById('ccAnnotationActionStatus')?.textContent.includes('all pages'));
  docs=await storage(page);
  assert.equal(docs[0].pages['pdf:1']?.length,1);
  assert.equal(docs[0].pages['pdf:2']?.length,1);
  console.log('PASS',width,'Save whole document persists both pages without duplicates');
  page.once('dialog',d=>d.accept('Renamed Lesson'));
  await menu.getByRole('button',{name:'✏️ Rename document'}).click();
  await page.waitForFunction(()=>document.getElementById('ccAnnotationActionStatus')?.textContent.includes('Renamed to'));
  docs=await storage(page);
  assert.equal(docs.length,1);
  assert.equal(docs[0].name,'Renamed Lesson.pdf');
  console.log('PASS',width,'Rename preserves file extension and saved annotations');
  page.once('dialog',d=>d.accept());
  await menu.getByRole('button',{name:'🗑 Delete page annotations'}).click();
  await page.waitForFunction(()=>document.getElementById('ccAnnotationActionStatus')?.textContent.includes('Page annotations deleted'));
  assert.equal(await page.evaluate(()=>strokes.length),0);
  docs=await storage(page);
  assert.equal(docs[0].pages['pdf:1']?.length,1);
  assert.equal(docs[0].pages['pdf:2']?.length,0);
  console.log('PASS',width,'Delete page annotations removes page 2 only, including stored copy');
  await closeMenu();
  await page.locator('#ccPermanentExitBtn').click();
  await page.waitForFunction(()=>!document.body.classList.contains('document-open-mode'));
  await page.getByRole('button',{name:/My Documents/}).first().click();
  await page.locator('#ccDocsDialog').waitFor({state:'visible'});
  await page.locator('#ccDocsDialog').getByRole('button',{name:'Open'}).first().click();
  await page.waitForFunction(()=>document.body.classList.contains('document-open-mode')&&document.getElementById('documentPdfCanvas')?.width>80);
  await page.waitForFunction(()=>window.CCDocumentAnnotations?.ready(),null,{timeout:15000});
  await page.waitForFunction(()=>strokes.length===1,null,{timeout:5500}).catch(()=>{});
  console.log('REOPEN-DIAGNOSTIC',width,JSON.stringify(await page.evaluate(async()=>{
    const snap=await window.CCDocumentAnnotations.export('all');
    return {strokeCount:strokes.length,kind:snap.kind,keys:Object.keys(snap.pages),items:Object.fromEntries(Object.entries(snap.pages).map(([k,v])=>[k,v.length])),
      canvasWidth:document.getElementById('documentPdfCanvas')?.width,documentName:window.CCDocumentAnnotations.name()};
  })));
  assert.equal(await page.evaluate(()=>strokes.length),1,'Page 1 restored after reopening');
  await goto(2);
  assert.equal(await page.evaluate(()=>strokes.length),0,'Cleared page 2 stays blank after reopening');
  console.log('PASS',width,'Reopen restores page 1 and keeps page 2 deleted');
  await openMenu();
  page.once('dialog',d=>d.accept());
  await menu.getByRole('button',{name:'🗑 Delete all document annotations'}).click();
  await page.waitForFunction(()=>document.getElementById('ccAnnotationActionStatus')?.textContent.includes('All document annotations deleted'));
  docs=await storage(page);
  assert.equal(Object.keys(docs[0].pages).length,0);
  await closeMenu();
  await goto(1);
  assert.equal(await page.evaluate(()=>strokes.length),0);
  console.log('PASS',width,'Delete all clears all pages and persisted records without deleting file');
  assert.deepEqual(errors,[],'No uncaught browser script errors');
  await ctx.close();
 }}finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
