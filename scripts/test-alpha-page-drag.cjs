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
   await page.addInitScript(()=>{
    window.__gestureProbe={};
    for(const type of ['pointerdown','pointermove','pointerup','pointercancel','touchstart','touchmove','touchend']){
     window.addEventListener(type,e=>{
      const p=window.__gestureProbe;
      p[type]=(p[type]||0)+1;
      if(type==='pointerdown'){p.target=e.target?.id||e.target?.tagName;p.kind=e.pointerType}
     },{capture:true,passive:true});
    }
   });
   await page.goto('http://127.0.0.1:'+server.address().port+'/whiteboard.html',{waitUntil:'load'});
   await page.waitForFunction(()=>document.body.classList.contains('toolbar-ready'));
   await page.locator('input[type=file][accept="*/*"]').setInputFiles({name:'pages.pdf',mimeType:'application/pdf',buffer:fs.readFileSync(pdf)});
   await page.waitForFunction(()=>window.CCDocumentAnnotations?.ready()&&document.getElementById('documentPdfCanvas')?.width>80,null,{timeout:18000});
   const state=()=>page.evaluate(()=>{
    const b=document.getElementById('boardWrap').getBoundingClientRect();
    const e=window.WhiteboardDocumentView.panElement(),r=e?.getBoundingClientRect();
    const pan=parseFloat((e?.style.translate||'0px 0px').split(' ')[1])||0;
    const limit=r?Math.max(36,(r.height-b.height)/2+36):36;
    return {page:window.CCDocumentAnnotations.currentPage(),pages:window.CCDocumentAnnotations.pageCount(),
     ready:window.CCDocumentAnnotations.ready(),ink:strokes.length,pan,limit,
     bottom:pan<=-limit+12,top:pan>=limit-12,fullPageFits:r?.height<=b.height-16,
     pageHeight:r?.height,boardHeight:b.height};
   });
   assert((await state()).pages>=2,'Fixture must have multiple pages');
   await page.locator('#documentTouchNavBtn').click();
   const board=await page.locator('#board').boundingBox();
   assert(board&&board.height>460,'Board must allow a long drag');
   const x=board.x+board.width*.40,downStart=board.y+board.height*.28,upStart=board.y+board.height*.73;
   const mouseDrag=async(y1,y2,dx=0)=>{
    await page.mouse.move(x,y1);await page.mouse.down();
    await page.mouse.move(x+dx,y2,{steps:14});await page.mouse.up();
    await page.waitForTimeout(460);
   };
   const readyPage=async n=>page.waitForFunction(n=>window.CCDocumentAnnotations?.ready()&&window.CCDocumentAnnotations.currentPage()===n,n,{timeout:12000});
   const zoomIn=page.locator('#documentQuickBar button[title="Zoom in"]');
   for(let i=0;i<10;i++){await zoomIn.click();await page.waitForFunction(()=>window.CCDocumentAnnotations?.ready(),null,{timeout:10000})}
   const initial=await state();
   assert(!initial.fullPageFits,'The high-zoom test page must extend beyond viewport: '+JSON.stringify(initial));
   await page.evaluate(()=>{strokes.push({colour:'#17324d',size:3,points:[{x:.14,y:.16},{x:.25,y:.26}]});redraw();syncUi()});
   assert.equal((await state()).ink,1);
   await mouseDrag(upStart,upStart-215);
   assert.equal((await state()).page,1,'First large drag within a zoomed page must pan, not navigate');
   console.log('PASS',width,'Zoomed page first drag pans without jumping to next page');
   await mouseDrag(upStart,upStart-38);
   assert.equal((await state()).page,1,'Short drag never navigates');
   await mouseDrag(upStart,upStart-42,160);
   assert.equal((await state()).page,1,'Horizontal drag never navigates');
   // Bring bottom of current page into view. No gesture that starts away from
   // the edge should ever navigate, even if it ends beyond the edge.
   for(let i=0;i<12&&!(await state()).bottom;i++){
    const before=await state();
    await mouseDrag(upStart,upStart-225);
    assert.equal((await state()).page,1,'Panning to bottom must stay on the current page (step '+i+')');
   }
   assert((await state()).bottom,'Can actually reach the bottom of the current PDF page');
   console.log('PASS',width,'The bottom of a zoomed page remains accessible before turning');
   await mouseDrag(upStart,upStart-215);
   await readyPage(2);
   assert.equal((await state()).ink,0,'Page 2 should not inherit Page 1 annotation');
   console.log('PASS',width,'A second long upward drag from the bottom turns to next page');
   await mouseDrag(downStart,downStart+215);
   assert.equal((await state()).page,2,'First downward drag on zoomed page pans instead of switching pages');
   for(let i=0;i<12&&!(await state()).top;i++){
    await mouseDrag(downStart,downStart+225);
    assert.equal((await state()).page,2,'Can pan to top before previous-page navigation');
   }
   assert((await state()).top,'Can reach the top of the PDF');
   await mouseDrag(downStart,downStart+215);
   await readyPage(1);
   assert.equal((await state()).ink,1,'Page 1 annotation remains after previous-page navigation');
   console.log('PASS',width,'The top of a page is visible; a second long downward drag returns to previous page');
   await page.locator('#documentPenModeBtn').click();
   const inkBefore=(await state()).ink;
   await mouseDrag(upStart,upStart-225);
   assert.equal((await state()).page,1,'Pen mode must never turn pages');
   assert((await state()).ink>inkBefore,'Pen mode must still draw ink');
   await page.locator('#undoBtn').click();
   assert.equal((await state()).ink,inkBefore,'Pen Undo remains functional');
   console.log('PASS',width,'Pen input and Undo remain protected');
   await page.locator('#documentTouchNavBtn').click();
   // Trackpad wheel scroll first pans the current page, without flipping.
   await page.mouse.move(x,upStart);
   for(let i=0;i<3;i++)await page.mouse.wheel(0,115);
   await page.waitForTimeout(460);
   assert.equal((await state()).page,1,'Mid-page trackpad scrolling must not flip page');
   for(let i=0;i<14&&!(await state()).bottom;i++){
    await page.mouse.wheel(0,135);
    await page.waitForTimeout(335);
    assert.equal((await state()).page,1,'Trackpad should pan to the document edge');
   }
   assert((await state()).bottom,'Trackpad can reveal the bottom of the PDF');
   await page.waitForTimeout(360);
   for(let i=0;i<4;i++)await page.mouse.wheel(0,115);
   await readyPage(2);
   console.log('PASS',width,'Trackpad scroll pans freely and a separate edge gesture navigates');
   if(width===390){
    const cdp=await ctx.newCDPSession(page);
    await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2});
    const sx=Math.round(x),sY=Math.round(downStart);
    console.log('TOUCH-START',width,JSON.stringify(await page.evaluate(({sx,sy})=>{
      window.__gestureProbe={};
      const el=document.elementFromPoint(sx,sy),hand=document.getElementById('documentTouchNavBtn');
      const canvas=document.getElementById('board');
      return {target:el?.id||el?.tagName,cssPointer:canvas.style.pointerEvents,mode:hand?.getAttribute('aria-pressed'),touchAction:getComputedStyle(el).touchAction,coords:{sx,sy}};
    },{sx,sy:sY})));
    const swipe=async delta=>{
     await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:sx,y:sY}]});
     for(let i=1;i<=12;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:sx,y:sY+delta*i/12}]});
     await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
     await page.waitForTimeout(450);
    };
    await swipe(210);
    assert.equal((await state()).page,2,'First touch swipe should pan the zoomed page');
    const touchStates=[await state()];
    for(let i=0;i<12&&!(await state()).top;i++){
      await swipe(210);
      const st=await state();touchStates.push(st);
      assert.equal(st.page,2,'Touch can reveal the top before turning');
    }
    console.log('TOUCH-EDGE-DETAIL',width,JSON.stringify(touchStates.map(z=>({page:z.page,pan:+z.pan.toFixed(1),limit:+z.limit.toFixed(1),top:z.top,fullPageFits:z.fullPageFits}))));
    console.log('TOUCH-EVENTS',width,JSON.stringify(await page.evaluate(()=>window.__gestureProbe)));
    assert((await state()).top,'Touch can reach page top');
    await swipe(210);
    await readyPage(1);
    console.log('PASS',width,'Touch swipes respect edge-before-turn and keep annotations');
    await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:false});
   }
   assert.deepEqual(errors,[],'No uncaught JavaScript errors');
   await ctx.close();
  }
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});