'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),zlib=require('node:zlib'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
function makeScannedPdf(){
 const width=1300,height=1700,raw=crypto.randomBytes(width*height*3);
 const encoded=zlib.deflateSync(raw,{level:1}),parts=[],offsets=[0];
 let size=0;
 const push=buf=>{const b=Buffer.isBuffer(buf)?buf:Buffer.from(buf,'binary');parts.push(b);size+=b.length};
 const obj=(n,header,stream)=>{
  offsets[n]=size;push(n+' 0 obj\n');
  if(stream){push(header+'\nstream\n');push(stream);push('\nendstream\n');}
  else push(header+'\n');
  push('endobj\n');
 };
 push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
 obj(1,'<< /Type /Catalog /Pages 2 0 R >>');
 obj(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
 obj(3,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>');
 const instructions=Buffer.from('q\n612 0 0 792 0 0 cm\n/Im0 Do\nQ\n');
 obj(4,'<< /Length '+instructions.length+' >>',instructions);
 obj(5,'<< /Type /XObject /Subtype /Image /Width '+width+' /Height '+height+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length '+encoded.length+' >>',encoded);
 const xref=size;push('xref\n0 6\n0000000000 65535 f \n');
 for(let i=1;i<=5;i++)push(String(offsets[i]).padStart(10,'0')+' 00000 n \n');
 push('trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n');
 return Buffer.concat(parts);
}
const fixture=makeScannedPdf();
assert(fixture.length>400000,'Test fixture must exercise large-document preview');
const server=http.createServer((req,res)=>{
 const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(!p.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.readFile(p,(err,data)=>{if(err)return res.writeHead(404).end();
  res.setHeader('Content-Type',p.endsWith('.js')?'application/javascript':p.endsWith('.html')?'text/html':'application/octet-stream');res.end(data)});
});
(async()=>{
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{for(const density of [1,2]){
  const context=await browser.newContext({viewport:{width:1200,height:900},deviceScaleFactor:density,serviceWorkers:'block'});
  // Give the test a deterministic window to inspect the preview before the
  // browser's idle callback upgrades backing pixels. Production timing is unchanged.
  await context.addInitScript(()=>{
   window.requestIdleCallback=callback=>setTimeout(()=>callback({didTimeout:false,timeRemaining:()=>50}),1000);
   window.cancelIdleCallback=id=>clearTimeout(id);
  });
  const page=await context.newPage(),errors=[],consoleErrors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',msg=>{if(msg.type()==='error')consoleErrors.push(msg.text())});
  await page.goto('http://127.0.0.1:'+server.address().port+'/whiteboard.html',{waitUntil:'load'});
  await page.waitForFunction(()=>document.body.classList.contains('toolbar-ready'));
  await page.locator('input[type=file][accept="*/*"]').setInputFiles({name:'Large Scan.pdf',mimeType:'application/pdf',buffer:fixture});
  await page.waitForFunction(()=>window.CCDocumentAnnotations?.ready()&&window.CCPdfOpenDiagnostics?.preview===true,null,{timeout:9000}).catch(async err=>{
   const details=await page.evaluate(()=>({
    mode:document.body.classList.contains('document-open-mode'),
    kind:window.CCDocumentAnnotations?.isOpen(),
    ready:window.CCDocumentAnnotations?.ready(),
    diag:window.CCPdfOpenDiagnostics,
    canvas:{w:document.getElementById('documentPdfCanvas')?.width,h:document.getElementById('documentPdfCanvas')?.height},
    toast:document.getElementById('toast')?.textContent,
    pdfLib:!!window.pdfjsLib
   }));
   console.log('PDF-SCAN-DEBUG',density,JSON.stringify({details,errors,consoleErrors}));
   throw err;
  });
  const before=await page.evaluate(()=>{
   const c=document.getElementById('documentPdfCanvas'),r=c.getBoundingClientRect();
   strokes.push({colour:'#17324d',size:4,points:[{x:.21,y:.23},{x:.33,y:.38}]});redraw();syncUi();
   return {pixels:[c.width,c.height],css:[r.width,r.height,r.left,r.top],strokes:JSON.stringify(strokes),
     diagnostic:JSON.parse(JSON.stringify(window.CCPdfOpenDiagnostics))};
  });
  assert.equal(before.diagnostic.quality,'preview');
  await page.waitForFunction(()=>window.CCPdfOpenDiagnostics?.quality==='full',null,{timeout:15000});
  const after=await page.evaluate(()=>{
   const c=document.getElementById('documentPdfCanvas'),r=c.getBoundingClientRect();
   return {pixels:[c.width,c.height],css:[r.width,r.height,r.left,r.top],strokes:JSON.stringify(strokes),
    diagnostic:JSON.parse(JSON.stringify(window.CCPdfOpenDiagnostics))};
  });
  assert(after.pixels[0]>before.pixels[0], 'Background sharpness refresh must increase backing resolution');
  assert.deepEqual(after.css,before.css,'High quality refresh must not change PDF location or display size');
  assert.equal(after.strokes,before.strokes,'Annotations remain unchanged during sharpening');
  assert.deepEqual(errors,[],'No JavaScript errors during large PDF render');
  console.log('PDF-FIRST-PAINT',density,JSON.stringify({
   fixtureMB:+(fixture.length/1048576).toFixed(2),
   firstVisibleMs:before.diagnostic.firstVisibleMs,
   getPageMs:before.diagnostic.getPageMs,
   renderMs:before.diagnostic.renderMs,
   fullQualityRefineMs:after.diagnostic.refineMs,
   cssStable:true,inkStable:true,previewPixels:before.pixels,fullPixels:after.pixels}));
  await context.close();
 }}finally{await browser.close();server.close()}
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
