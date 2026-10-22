'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),pdf=path.join(root,'experimental/math-structure/fixtures/documents/pages.pdf');
const server=http.createServer((req,res)=>{
 const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(!p.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.readFile(p,(err,data)=>{if(err)return res.writeHead(404).end();res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.html')?'text/html':'application/octet-stream');res.end(data)});
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const width of [1365,390]){
   const ctx=await browser.newContext({viewport:{width,height:900}});
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:'+server.address().port+'/whiteboard.html',{waitUntil:'load'});
   await page.waitForFunction(()=>document.body.classList.contains('toolbar-ready'));
   await page.locator('input[type=file][accept="*/*"]').setInputFiles({name:'pages.pdf',mimeType:'application/pdf',buffer:fs.readFileSync(pdf)});
   await page.waitForFunction(()=>window.CCDocumentAnnotations?.ready()&&document.getElementById('documentPdfCanvas')?.width>80,null,{timeout:18000});
   const info=()=>page.evaluate(()=>({page:window.CCDocumentAnnotations.currentPage(),pages:window.CCDocumentAnnotations.pageCount(),ready:window.CCDocumentAnnotations.ready(),count:strokes.length}));
   const first=await info();
   assert(first.pages>=2,'Fixture must have at least two pages');
   await page.locator('#documentTouchNavBtn').click();
   const board=await page.locator('#board').boundingBox();
   assert(board&&board.height>450,'Canvas is large enough to drag');
   const x=board.x+board.width*.42;
   const mouseDrag=async(y1,y2,dx=0)=>{
    await page.mouse.move(x,y1);await page.mouse.down();
    await page.mouse.move(x+dx,y2,{steps:14});await page.mouse.up();
   };
   await page.evaluate(()=>{strokes.push({colour:'#17324d',size:3,points:[{x:.14,y:.16},{x:.25,y:.26}]});redraw();syncUi()});
   assert.equal((await info()).count,1);
   await mouseDrag(board.y+board.height*.72,board.y+board.height*.72-186);
   await page.waitForFunction(()=>window.CCDocumentAnnotations?.ready()&&window.CCDocumentAnnotations.currentPage()===2,null,{timeout:10000});
   assert.equal((await info()).count,0,'Page 2 starts without page 1 ink');
   console.log('PASS',width,'Hand drag up navigates from page 1 to page 2');
   await mouseDrag(board.y+board.height*.29,board.y+board.height*.29+186);
   await page.waitForFunction(()=>window.CCDocumentAnnotations?.ready()&&window.CCDocumentAnnotations.currentPage()===1,null,{timeout:10000});
   assert.equal((await info()).count,1,'Page 1 annotation remains after drag navigation');
   console.log('PASS',width,'Hand drag down returns to previous page with annotations intact');
   await mouseDrag(board.y+board.height*.66,board.y+board.height*.66-42);
   assert.equal((await info()).page,1,'Short drag must not change page');
   await mouseDrag(board.y+board.height*.55,board.y+board.height*.55-35,155);
   assert.equal((await info()).page,1,'Mostly horizontal drag must not change page');
   console.log('PASS',width,'Short/sideways drags do not accidentally change pages');
   await page.locator('#documentPenModeBtn').click();
   const inkBefore=(await info()).count;
   await mouseDrag(board.y+board.height*.70,board.y+board.height*.70-186);
   assert.equal((await info()).page,1,'Drawing in Pen mode must not change page');
   assert((await info()).count>inkBefore,'Pen mode drag creates ink');
   await page.locator('#undoBtn').click();
   assert.equal((await info()).count,inkBefore,'Pen Undo remains functional');
   console.log('PASS',width,'Pen strokes and Undo remain protected');
   if(width===390){
    await page.locator('#documentTouchNavBtn').click();
    const cdp=await ctx.newCDPSession(page);
    await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2});
    const sx=Math.round(x),startY=Math.round(board.y+board.height*.75);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:sx,y:startY}]});
    for(let i=1;i<=9;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:sx,y:startY-i*13}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await page.waitForFunction(()=>window.CCDocumentAnnotations?.ready()&&window.CCDocumentAnnotations.currentPage()===2,null,{timeout:10000});
    await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:false});
    console.log('PASS',width,'Finger swipe up navigates to next page');
   }
   assert.deepEqual(errors,[],'No uncaught runtime errors');
   await ctx.close();
  }
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});