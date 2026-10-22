'use strict';
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=path.resolve(root,'.'+pathname);
  if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
  fs.readFile(file,(err,data)=>{
    if(err)return res.writeHead(404).end();
    res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.html')?'text/html':'application/octet-stream');
    res.end(data);
  });
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const width of [1365,390]){
   const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});
   const page=await context.newPage(),errors=[],requests=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>requests.push(new URL(r.url()).pathname));
   await page.goto('http://127.0.0.1:'+server.address().port+'/whiteboard.html?startup_check=1',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.body.classList.contains('toolbar-ready'),null,{timeout:20000});
   const perf=await page.evaluate(()=>{
    const nav=performance.getEntriesByType('navigation')[0]||{};
    const resources=performance.getEntriesByType('resource');
    const docPaths=['pdf.min.js','pdf.worker.min.js','mammoth.browser.min.js','xlsx.full.min.js','pptx-renderer.browser.es.js'];
    return {domReadyMs:+(nav.domContentLoadedEventEnd||0).toFixed(1),loadMs:+(nav.loadEventEnd||0).toFixed(1),
      resources:resources.length,encodedKB:Math.round(resources.reduce((s,x)=>s+x.encodedBodySize,0)/1024),
      decodedKB:Math.round(resources.reduce((s,x)=>s+x.decodedBodySize,0)/1024),
      documentPreloads:resources.filter(x=>docPaths.some(p=>new URL(x.name).pathname.endsWith('/'+p))).map(x=>new URL(x.name).pathname.split('/').at(-1)),
      mathjaxReady:typeof window.MathJax?.tex2svg==='function',wordListReady:!!window.WhiteboardHandwritingWordList?.levels,
      modelReady:!!window.WhiteboardCharacterModels,
      handwritingReaderReady:!!window.WhiteboardHandwritingMath,
      pen:!!document.getElementById('penBtn'),
      documentControls:!!document.getElementById('ccPermanentSaveBtn')
    };
   });
   // Confirm that the on-demand character model still loads when a teacher
   // actually opens Beautify and selects handwritten ink.
   await page.evaluate(()=>{
    strokes.push({colour:'#17324d',size:4,points:[{x:.12,y:.14},{x:.16,y:.18},{x:.19,y:.23}]});
    redraw();syncUi();
   });
   await page.locator('#handwritingBeautifyBtn').click();
   const board=await page.locator('#board').boundingBox();
   await page.mouse.move(board.x+board.width*.07,board.y+board.height*.08);
   await page.mouse.down();
   await page.mouse.move(board.x+board.width*.29,board.y+board.height*.31,{steps:6});
   await page.mouse.up();
   await page.waitForFunction(()=>!!window.WhiteboardCharacterModels,null,{timeout:20000});
   await page.waitForFunction(()=>typeof window.MathJax?.tex2svg==='function'&&!!window.WhiteboardHandwritingWordList?.levels&&typeof window.WhiteboardHandwritingWords?.check==='function',null,{timeout:25000});
   const advanced=await page.evaluate(()=>{
    const obj=window.WhiteboardMathRenderer.create('\\\\sqrt{9}',{x:.2,y:.2,w:.24,h:.12},'#17324d');
    return {mathLoaded:typeof window.MathJax?.tex2svg==='function',wordsLoaded:!!window.WhiteboardHandwritingWordList?.levels,
      lexicalCheckReady:typeof window.WhiteboardHandwritingWords?.check==='function',
      rendersAdvancedMath:obj?.type==='image'&&obj.src.startsWith('data:image/svg+xml')};
   });
   assert(advanced.mathLoaded&&advanced.wordsLoaded&&advanced.lexicalCheckReady&&advanced.rendersAdvancedMath,'On-demand maths and word engines must fully initialise and render');
   console.log('LAZY-ADVANCED',width,JSON.stringify(advanced));
   console.log('LAZY-MODEL',width,JSON.stringify({
    initiallyPresent:perf.modelReady,
    loadedOnBeautify:await page.evaluate(()=>!!window.WhiteboardCharacterModels),
    recognitionDialog:await page.locator('#handwritingReadText').count()
   }));
   assert(perf.pen&&perf.documentControls,'core controls ready');
   assert(!perf.mathjaxReady&&!perf.wordListReady,'Advanced maths and English dictionary are deferred until first use');
   assert.deepEqual(errors,[],'no JavaScript runtime errors');
   console.log('STARTUP',width,JSON.stringify({...perf,requestCount:requests.length,errors}));
   await context.close();
  }
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
