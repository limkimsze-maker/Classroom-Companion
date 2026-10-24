'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{makeDocx}=require('./word-layout-fixtures.cjs');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
 if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.readFile(file,(err,data)=>{if(err)return res.writeHead(404).end();res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.html')?'text/html':file.endsWith('.woff')?'font/woff':'application/octet-stream');res.end(data)});
});
const near=(a,b,label)=>assert(Math.abs(a-b)<2,`${label}: ${a} vs ${b}`);
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
 try{
  for(const width of [1365,390]){
   const ctx=await browser.newContext({viewport:{width,height:900}}),page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:'+server.address().port+'/whiteboard.html?word_layout_check=1');
   await page.waitForFunction(()=>document.body.classList.contains('toolbar-ready'));
   const before=await page.evaluate(()=>!!window.docx);assert.equal(before,false,'Word engine loads on demand');
   const open=async(options)=>{
    const bytes=await makeDocx(options);
    await page.locator('input[type=file][accept="*/*"]').setInputFiles({name:'layout-check.docx',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',buffer:bytes});
    await page.waitForFunction(()=>window.CCDocumentAnnotations?.ready()&&document.querySelector('#documentWordPaper.cc-word-paged [data-word-page]'),null,{timeout:20000});
    return bytes;
   };
   const go=async n=>{
    await page.locator('#documentQuickBar input[type=number]').evaluate((el,n)=>{el.value=String(n);el.dispatchEvent(new Event('change',{bubbles:true}))},n);
    await page.waitForFunction(n=>CCDocumentAnnotations.ready()&&CCDocumentAnnotations.currentPage()===n,n);
   };
   const exit=async()=>{await page.locator('#ccPermanentExitBtn').click();await page.waitForFunction(()=>!CCDocumentAnnotations.isOpen())};
   const original=await open({});assert.equal(await page.evaluate(()=>CCDocumentAnnotations.pageCount()),3);
   const metrics=await page.evaluate(()=>{
    const s=document.querySelector('section.ccword'),scale=s.getBoundingClientRect().width/s.offsetWidth;
    const ps=s.querySelectorAll('article>p'),box=s.querySelector('.ccword-floating-object'),sr=s.getBoundingClientRect();
    function textStart(p){const span=[...p.querySelectorAll('span')].find(e=>e.textContent.startsWith('Text after'));return (span.getBoundingClientRect().left-sr.left)/scale}
    return {w:s.offsetWidth,h:parseFloat(getComputedStyle(s).minHeight),hanging:textStart(ps[1]),ordinary:textStart(ps[2]),shapeX:(box.getBoundingClientRect().left-sr.left)/scale,shapeW:parseFloat(box.style.width),fill:box.querySelector('svg>*').getAttribute('fill'),footer:s.querySelector('footer').textContent};
   });
   near(metrics.w,793.733,'A4 width');near(metrics.h,1122.533,'A4 height');near(metrics.hanging,120,'Hanging tab');near(metrics.ordinary,168,'Cleared inherited tabs retain the default grid');near(metrics.shapeX,120,'Drawing margin offset');near(metrics.shapeW,192,'Drawing size');assert.equal(metrics.fill,'#FFF2CC');assert.equal(metrics.footer,'Page 1 of 3');assert(await page.evaluate(()=>{const s=document.querySelector('section.ccword'),r=s.getBoundingClientRect();return (s.querySelector('footer').getBoundingClientRect().top-r.top)/r.height>.9}),'Footer follows the original bottom margin');
   await page.evaluate(()=>{const r=WhiteboardDocumentView.panElement().getBoundingClientRect(),b=document.querySelector('#board').getBoundingClientRect();strokes.push({colour:'#17324d',size:3,points:[{x:(r.x+r.width*.2-b.x)/b.width,y:(r.y+r.height*.25-b.y)/b.height},{x:(r.x+r.width*.3-b.x)/b.width,y:(r.y+r.height*.3-b.y)/b.height}]});redraw();syncUi()});
   const ink=await page.evaluate(async()=>{const s=await CCDocumentAnnotations.export();return s.pages['word:1']});
   await go(2);assert.equal(await page.evaluate(()=>strokes.length),0);assert.equal(await page.locator('section.ccword:visible footer').textContent(),'Page 2 of 3');
   await page.getByTitle('Zoom in',{exact:true}).click();
   await page.waitForFunction(()=>CCDocumentAnnotations.ready());assert.equal(await page.evaluate(()=>CCDocumentAnnotations.pageCount()),3,'Zoom does not repaginate Word');
   await go(1);const inkAgain=await page.evaluate(async()=>{const s=await CCDocumentAnnotations.export();return s.pages['word:1']});assert(Math.abs(inkAgain[0].points[0].x-ink[0].points[0].x)<1e-6,'Ink x after zoom');assert(Math.abs(inkAgain[0].points[0].y-ink[0].points[0].y)<1e-6,'Ink y after zoom');
   await page.locator('#ccPermanentSaveBtn').click();
   await page.waitForTimeout(250);
   const saved=await page.evaluate(async()=>{
    const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('cc-my-documents-v1');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
    const item=await new Promise((resolve,reject)=>{const r=db.transaction('files').objectStore('files').getAll();r.onsuccess=()=>resolve(r.result[0]);r.onerror=()=>reject(r.error)});
    return {bytes:Array.from(new Uint8Array(await item.blob.arrayBuffer())),pages:item.annotations.pages};
   });assert.deepEqual(Buffer.from(saved.bytes),original,'Saving retains the original DOCX bytes');assert.equal(saved.pages['word:1'].length,1);assert.equal(saved.pages['word:2'].length,0);
   await exit();await page.getByRole('button',{name:/My Documents/}).first().click();await page.locator('#ccDocsDialog').getByRole('button',{name:'Open',exact:true}).first().click();await page.waitForFunction(()=>CCDocumentAnnotations.ready()&&document.querySelector('#documentWordPaper.cc-word-paged [data-word-page]'));assert.equal(await page.evaluate(()=>strokes.length),1,'Word ink reopens on its own page');await exit();
   await open({landscape:true,preset:'star5',start:4});assert.equal(await page.evaluate(()=>CCDocumentAnnotations.pageCount()),3);const land=await page.evaluate(()=>{const s=document.querySelector('section.ccword');return {w:s.offsetWidth,h:parseFloat(getComputedStyle(s).minHeight),footer:s.querySelector('footer').textContent}});near(land.w,1056,'Landscape Letter width');near(land.h,816,'Landscape Letter height');assert.equal(land.footer,'Page 4 of 3');await exit();
   for(const kind of ['flow','long-paragraph','table','full-floating','cached-break']){
    await open({kind});const info=await page.evaluate(()=>({count:CCDocumentAnnotations.pageCount(),text:[...document.querySelectorAll('section.ccword>article')].map(e=>e.textContent).join(' ')}));assert(info.count>=2,kind+' uses multiple original pages');
    if(kind==='flow')assert(info.text.includes('Flow paragraph 85.'));if(kind==='long-paragraph')assert.equal(info.text.replace(/\s+/g,' ').trim(),Array.from({length:1200},(_,i)=>'word'+i).join(' '));if(kind==='table'||kind==='full-floating')assert.equal((info.text.match(/Second column/g)||[]).length,90);if(kind==='full-floating')assert(info.text.includes('After the floating table'));if(kind==='cached-break')assert.equal(info.count,2);
    for(let n=1;n<=info.count;n++){
     await go(n);const clipped=await page.evaluate(()=>{const s=[...document.querySelectorAll('section.ccword')].find(e=>e.style.display!=='none'),r=s.getBoundingClientRect(),scale=r.width/s.offsetWidth,limit=r.bottom-parseFloat(getComputedStyle(s).paddingBottom)*scale;return [...s.querySelectorAll('article>p,article>table')].some(e=>e.getBoundingClientRect().bottom>limit+2)});assert.equal(clipped,false,kind+' page '+n+' has no clipped body block');
    }
    await exit();
   }
   assert.deepEqual(errors,[]);await page.screenshot({path:'/tmp/alpha-v2-word-'+width+'.png'});
   console.log('PASS',width,'DOCX paper sizes, page breaks, tabs, drawings, fields, flow, tables, zoom, original bytes and saved per-page ink');await ctx.close();
  }
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
