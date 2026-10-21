'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),fixtures=path.join(__dirname,'fixtures/documents'),output=process.argv[2]||'/tmp/document-annotations-v2';
const mime={'.html':'text/html','.js':'application/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.wasm':'application/wasm'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root+'/'))return res.writeHead(403).end();fs.readFile(file,(err,data)=>{if(err)return res.writeHead(404).end();if(process.env.DOCUMENT_BASELINE&&file.endsWith('/whiteboard-v2-trial.html'))data=Buffer.from(data.toString().replace('whiteboard-document-open-v2-trial.js?v=20261021-page-follow2','whiteboard-document-open-moe-v2.js'));res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(data)});});
const selectors={pdf:'#documentPdfCanvas',word:'#documentWordPaper',pptx:'#documentPptViewport > div',sheet:'#documentSheetPaper',image:'.documentGenericImage',text:'.documentGenericText',html:'.documentGenericFrame'};
(async()=>{
 fs.mkdirSync(output,{recursive:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{for(const viewport of [{width:1365,height:900},{width:390,height:844}]){
  const page=await browser.newPage({viewport}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/whiteboard-v2-trial.html',{waitUntil:'load'});
  await page.locator('#openDocumentBtn').waitFor();await page.locator('#mainSettingsBtn').click();await page.getByRole('dialog').waitFor();await page.getByRole('button',{name:'Close',exact:true}).click();
  // Draw through the actual Pen handler; the blank board and its Undo must survive.
  await page.locator('#penBtn').click();let box=await page.locator('#board').boundingBox();await page.mouse.move(box.x+30,box.y+30);await page.mouse.down();await page.mouse.move(box.x+80,box.y+60,{steps:4});await page.mouse.up();const blank=await page.evaluate(()=>JSON.stringify(strokes));
  for(const [kind,file] of [['pdf','pages.pdf'],['word','pages.docx'],['pptx','pages.pptx'],['sheet','pages.xlsx'],['image','page.svg'],['text','page.txt'],['html','page.html']]){
   const choosing=page.waitForEvent('filechooser');await page.locator('#openDocumentBtn').click();await(await choosing).setFiles(path.join(fixtures,file));
   await page.waitForFunction(sel=>{const el=document.querySelector(sel);return el&&getComputedStyle(el).display!=='none'&&el.getBoundingClientRect().width>10},selectors[kind]);
   if(kind==='pdf')await page.waitForFunction(()=>document.getElementById('documentPdfCanvas').width>300);
   if(kind==='image')await page.waitForFunction(()=>document.querySelector('.documentGenericImage').complete);
   await page.waitForTimeout(300);
   assert.equal(await page.evaluate(()=>strokes.length),0,kind+' starts without blank-board ink');
   // Page-relative pen + text + a real beautified equation image.
   await page.evaluate(sel=>{
    const r=document.querySelector(sel).getBoundingClientRect(),b=canvas.getBoundingClientRect(),x=(r.left-b.left+r.width*.25)/b.width,y=(r.top-b.top+Math.min(r.height*.2,120))/b.height;
    const math=window.WhiteboardMathRenderer?.create?.('\\frac{1}{2}',{x:x+.03,y:y+.03,w:.12,h:.08},'#17324d');
    strokes=[{colour:'#17324d',size:4,points:[{x,y},{x:x+.03,y:y+.025}]},{type:'text',text:'Anchor',font:'Arial',bold:false,size:24,colour:'#17324d',x,y,w:.15,h:.08},math||{type:'image',src:'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40"><text y="30">1 + 1 = 2</text></svg>'),x,y,w:.12,h:.06,smartGenerated:true,smartType:'equation'}];redraw();syncUi();
   },selectors[kind]);
   const read=()=>page.evaluate(sel=>{let r=document.querySelector(sel).getBoundingClientRect();const b=canvas.getBoundingClientRect(),el=document.querySelector(sel);if(el.tagName==='IFRAME'){const sc=el.contentDocument.scrollingElement,z=r.width/el.clientWidth;r={left:r.left-sc.scrollLeft*z,top:r.top-sc.scrollTop*z,width:Math.max(sc.scrollWidth,el.clientWidth)*z,height:Math.max(sc.scrollHeight,el.clientHeight)*z}}return strokes.map(s=>{const p=s.points?.[0]||s;return{x:(p.x*b.width+b.left-r.left)/r.width,y:(p.y*b.height+b.top-r.top)/r.height,w:s.w==null?null:s.w*b.width/r.width,h:s.h==null?null:s.h*b.height/r.height,size:s.size==null?null:s.size/r.width}})},selectors[kind]);
   if(kind==='html')await page.waitForFunction(()=>document.querySelector('.documentGenericFrame').contentDocument?.scrollingElement.scrollHeight>1000);
   const anchor=await read();
   async function check(label){const actual=await read();assert.equal(actual.length,3,kind+' '+label+' objects retained');for(let i=0;i<3;i++)for(const k of ['x','y','w','h','size'])if(anchor[i][k]!=null)assert(Math.abs(anchor[i][k]-actual[i][k])<.002,`${kind} ${label} object ${i} ${k}: ${anchor[i][k]} != ${actual[i][k]}`);}
   await page.locator('#documentQuickBar button[title="Zoom in"]').click();await page.waitForTimeout(600);await check('zoom');
   await page.setViewportSize({width:viewport.width-80,height:viewport.height-120});await page.waitForTimeout(700);await check('resize');
   if(kind==='html'){
    assert.equal(await page.evaluate(()=>window.__documentScriptRan),undefined,'HTML document scripts remain blocked');
    await page.locator('.documentGenericFrame').evaluate(el=>el.contentWindow.scrollTo(0,160));await page.waitForTimeout(200);await check('HTML scroll');
   }
   if(kind==='pdf'){
    await page.locator('#documentTouchNavBtn').click();box=await page.locator('#board').boundingBox();await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5);await page.mouse.down();await page.mouse.move(box.x+box.width*.5+45,box.y+box.height*.5+30,{steps:6});await page.mouse.up();await page.waitForTimeout(900);await check('hand pan');await page.locator('#documentPenModeBtn').click();
   }
   if(['pdf','word','pptx','sheet'].includes(kind)){
    const input=page.locator('#documentQuickBar input[type=number]');await input.fill('2');await input.dispatchEvent('change');await page.waitForTimeout(650);
    if(kind!=='word')assert.equal(await page.evaluate(()=>strokes.length),0,kind+' second page isolated');
    // Drawing on page 2 and undoing cannot reveal page 1 or blank-board ink.
    await page.locator('#penBtn').click();box=await page.locator('#board').boundingBox();const count=await page.evaluate(()=>strokes.length);await page.mouse.move(box.x+30,box.y+30);await page.mouse.down();await page.mouse.move(box.x+60,box.y+55,{steps:4});await page.mouse.up();assert.equal(await page.evaluate(()=>strokes.length),count+1);await page.locator('#undoBtn').click();assert.equal(await page.evaluate(()=>strokes.length),count);
    await input.fill('1');await input.dispatchEvent('change');await page.waitForTimeout(650);await check('page return');
   }
   if(kind==='pdf'){
    // Multiple zoom clicks and page requests while PDF rendering is pending.
    await page.evaluate(()=>{const bar=document.getElementById('documentQuickBar');for(let i=0;i<4;i++)bar.querySelector('[title="Zoom in"]').click();const p=bar.querySelector('input');for(const v of [2,1,2,1]){p.value=v;p.dispatchEvent(new Event('change'))}});await page.waitForTimeout(1500);await check('rapid navigation');
   }
   await page.screenshot({path:path.join(output,kind+'-'+viewport.width+'.png')});
   await page.locator('#documentQuickBar button[title="Close document"]').click();assert.equal(await page.evaluate(()=>JSON.stringify(strokes)),blank,'blank-board ink restored after '+kind);
   await page.setViewportSize(viewport);console.log('PASS',viewport.width,kind,'zoom/resize/page ownership/objects/undo/blank restoration');
  }
  assert.deepEqual(errors,[],'no runtime errors');await page.close();
 }}finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
