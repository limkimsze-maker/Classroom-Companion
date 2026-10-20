'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{cases,ink}=require('./layout-fixtures.cjs');
const root=path.resolve(__dirname,'../..'),output=process.argv[2]||'/tmp/v2-browser';
const mime={'.js':'application/javascript','.css':'text/css','.wasm':'application/wasm','.json':'application/json','.html':'text/html','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(file,(error,data)=>{if(error){res.writeHead(404).end();return;}
  res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(data);
 });
});
(async()=>{
 fs.mkdirSync(output,{recursive:true});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const address='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const viewport of [{width:1365,height:900},{width:390,height:844}]){
   const context=await browser.newContext({viewport}),page=await context.newPage(),errors=[];
   await context.addInitScript(()=>{if(localStorage.getItem('__v2_storage_probe')===null)localStorage.setItem('__v2_storage_probe','protected');});
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(address+'/whiteboard-v2-trial.html',{waitUntil:'load'});
   await page.waitForFunction(()=>window.WhiteboardHandwritingMath?.build==='20261020-v2-structural-beam1');
   await page.locator('#handwritingBeautifyBtn').waitFor({state:'visible'});
   assert.equal(await page.evaluate(()=>localStorage.getItem('__v2_storage_probe')),'protected');
   await page.evaluate(()=>localStorage.setItem('__v2_storage_probe','trial'));
   assert.equal(await page.evaluate(()=>localStorage.getItem('__v2_storage_probe')),'trial');
   const standard=await context.newPage();await standard.goto(address+'/whiteboard-smart-beta.html',{waitUntil:'domcontentloaded'});
   assert.equal(await standard.evaluate(()=>localStorage.getItem('__v2_storage_probe')),'protected','V1 storage must not change');await standard.close();
   const strokes=ink(cases()[0][1]);
   await page.evaluate(ink=>{
    strokes=ink.map(s=>({...s,colour:'#17324d',points:s.points.map(p=>({x:p.x*1800/cssW,y:p.y*1200/cssH}))}));
    redraw();syncUi();
   },strokes);
   await page.locator('#handwritingBeautifyBtn').click();
   const board=await page.locator('#board').boundingBox(),node=cases()[0][1];
   await page.mouse.move(board.x+75,board.y+45);await page.mouse.down();
   await page.mouse.move(board.x+node.w+105,board.y+node.h+75,{steps:10});await page.mouse.up();
   await page.waitForFunction(()=>document.getElementById('handwritingReadText')?.value==='\\sqrt{\\frac{3}{4}}',{},{timeout:20000});
   const apply=page.locator('.handwriting-apply');await apply.waitFor({state:'visible'});
   await page.waitForFunction(()=>!document.querySelector('.handwriting-apply')?.disabled,{},{timeout:20000});
   await page.screenshot({path:path.join(output,`preview-${viewport.width}.png`)});
   await apply.click();
   assert.equal(await page.locator('.handwriting-review-backdrop').count(),0,'Apply completes');
   assert.equal(await page.locator('#penBtn').getAttribute('class').then(c=>c.includes('active')),true,'Returns to pen');
   assert.deepEqual(errors,[],'No browser script errors');
   console.log('PASS browser preview, matched loader, nested recognition, Apply, pen return and isolated storage:',viewport.width);
   await context.close();
  }
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>server.close());
