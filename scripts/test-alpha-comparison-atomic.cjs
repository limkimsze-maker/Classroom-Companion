'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(!p.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.readFile(p,(err,data)=>{if(err)return res.writeHead(404).end();res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.html')?'text/html':'application/octet-stream');res.end(data)});
});
const fixture=fs.readFileSync(path.join(root,'experimental/math-structure/fixtures/documents/pages.pdf'));
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const width of [1365,390]){
   const ctx=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'}),page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:'+server.address().port+'/whiteboard.html',{waitUntil:'load'});
   await page.waitForFunction(()=>document.body.classList.contains('toolbar-ready'));
   const seed=async(kind)=>{
    await page.evaluate(kind=>{
     // A distant annotation on the whiteboard must never be consumed by the
     // comparison recogniser just because it was already in strokes.
     const mk=coords=>({colour:'#17324d',size:5,points:coords.map(([x,y])=>({x:x/900,y:y/1200}))});
     const rect=(x,y,w,h)=>mk([[x,y+2],[x+w*.3,y],[x+w,y+2],[x+w+2,y+h],[x+w*.5,y+h+2],[x,y+h],[x,y+2]]);
     const pieces=(x,y,w,h)=>[mk([[x,y],[x+w,y]]),mk([[x+w,y],[x+w,y+h]]),mk([[x+w,y+h],[x,y+h]]),mk([[x,y+h],[x,y]])];
     window.__comparisonUnrelated=mk([[30,1100],[78,1115]]);
     window.__comparisonExpected=[];
     strokes=[window.__comparisonUnrelated];
     const top=kind==='fragments'?pieces(145,355,500,60):[rect(145,355,500,60)];
     const bottom=kind==='fragments'?pieces(145,500,300,60):[rect(145,500,300,60)];
     window.__comparisonExpected=[...top,...bottom];
     if(kind!=='after')strokes.push(...window.__comparisonExpected);
     redraw();syncUi();
    },kind);
   };
   const choose=async()=>{
    await page.locator('#smartMathBtn').click();
    const bar=page.getByRole('button',{name:'Bar Model',exact:true});
    await bar.click();
    await page.locator('#smartBarTypeMenu').getByRole('button',{name:'Comparison',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__smartBarType),'comparison');
   };
   const finish=async()=>{
    await page.locator('#smartMathBtn + button').click();
    await page.waitForFunction(()=>strokes.some(s=>s?.smartType==='barModel'&&s.smartBarType==='comparison'));
    return page.evaluate(()=>{
      const obj=strokes.find(s=>s?.smartType==='barModel'&&s.smartBarType==='comparison');
      return {models:strokes.filter(s=>s?.smartType==='barModel'&&s.smartBarType==='comparison').length,
        raw:strokes.filter(s=>Array.isArray(s?.points)).length,
        originals:obj?.smartOriginal?.length,
        count:obj?.barCount,
        unrelated:strokes.includes(window.__comparisonUnrelated),
        remnants:window.__comparisonExpected.filter(s=>strokes.includes(s)).length,
        pendingTemp:strokes.some(s=>s?.__predrawnComparisonFallback)};
    });
   };
   for(const kind of ['before','after','fragments']){
    await seed(kind);
    if(kind==='after'){await choose();await page.evaluate(()=>{strokes.push(...window.__comparisonExpected);redraw();syncUi()})}
    else await choose();
    const result=await finish();
    assert.equal(result.models,1,'Exactly one generated comparison model '+kind);
    assert.equal(result.raw,1,'Only unrelated raw ink should remain '+kind);
    assert.equal(result.unrelated,true,'Distant unrelated ink must survive '+kind);
    assert.equal(result.remnants,0,'Every selected rough-bar stroke must be removed '+kind);
    assert.equal(result.pendingTemp,false,'No synthetic recognition rectangle can remain '+kind);
    assert.equal(result.originals,kind==='fragments'?8:2,'smartOriginal must preserve the true raw drawing '+kind);
    assert.equal(result.count,2,'2-bar comparison must remain a 2-bar model '+kind);
    console.log('PASS',width,kind,'atomic first-attempt conversion',JSON.stringify(result));
    const history=await page.evaluate(()=>window.__smartBarLastHistory);
    assert(history?.before?.length>=3,'Atomic undo history preserves original drawing');
    assert(history.before.filter(s=>Array.isArray(s.points)).length=== (kind==='fragments'?9:3));
    await page.locator('#undoBtn').click();
    const undone=await page.evaluate(()=>({
      raw:strokes.filter(x=>Array.isArray(x.points)).length,
      models:strokes.filter(x=>x.smartType==='barModel'&&x.smartBarType==='comparison').length,
      allOriginals:window.__comparisonExpected.every(x=>strokes.some(y=>JSON.stringify(x)===JSON.stringify(y))),
      unrelated:strokes.some(y=>JSON.stringify(y)===JSON.stringify(window.__comparisonUnrelated))
    }));
    assert.equal(undone.models,0,'Undo removes beautified comparison');
    assert.equal(undone.raw,kind==='fragments'?9:3,'Undo restores all rough sketch strokes');
    assert(undone.allOriginals&&undone.unrelated,'Undo restores source ink and leaves unrelated ink');
    console.log('PASS',width,kind,'single Undo restores all original rough bars');
   }
   // Never destroy a partial one-bar sketch just because the teacher
   // pressed Finished prematurely.
   await seed('after');await choose();
   await page.evaluate(()=>{strokes.push(window.__comparisonExpected[0]);redraw();syncUi()});
   await page.locator('#smartMathBtn + button').click();
   const partial=await page.evaluate(()=>({
     raw:strokes.filter(q=>Array.isArray(q.points)).length,
     models:strokes.filter(q=>q.smartType==='barModel'&&q.smartBarType==='comparison').length,
     original:strokes.includes(window.__comparisonExpected[0]),
     other:strokes.includes(window.__comparisonUnrelated)
   }));
   assert.equal(partial.models,0,'One bar must not become a false two-bar comparison');
   assert.equal(partial.raw,2,'Failed recognition keeps all original ink');
   assert(partial.original&&partial.other,'Incomplete model cannot discard ink');
   console.log('PASS',width,'Incomplete one-bar comparison retains original sketch');
   // Verify model conversion also cleans strokes drawn over an opened PDF.
   await page.locator('input[type=file][accept="*/*"]').setInputFiles({name:'Teaching.pdf',mimeType:'application/pdf',buffer:fixture});
   await page.waitForFunction(()=>window.CCDocumentAnnotations?.ready(),null,{timeout:15000});
   await seed('before');await choose();
   const inPdf=await finish();
   assert.equal(inPdf.models,1);assert.equal(inPdf.remnants,0);assert.equal(inPdf.raw,1);
   console.log('PASS',width,'PDF document comparison replaces all bar ink');
   assert.deepEqual(errors,[],'No browser runtime errors');
   await ctx.close();
  }
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
