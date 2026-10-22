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
      mathjaxReady:typeof window.MathJax?.tex2svg==='function',
      modelReady:!!window.WhiteboardCharacterModels,
      handwritingReaderReady:!!window.WhiteboardHandwritingMath,
      pen:!!document.getElementById('penBtn'),
      documentControls:!!document.getElementById('ccPermanentSaveBtn')
    };
   });
   assert(perf.pen&&perf.documentControls,'core controls ready');
   assert(perf.mathjaxReady,'MathJax available after startup');
   assert.deepEqual(errors,[],'no JavaScript runtime errors');
   console.log('STARTUP',width,JSON.stringify({...perf,requestCount:requests.length,errors}));
   await context.close();
  }
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
