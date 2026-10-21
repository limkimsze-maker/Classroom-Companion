'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),fixtures=path.join(__dirname,'fixtures/document-anchors');
const mime={'.html':'text/html','.js':'application/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.wasm':'application/wasm'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root+'/'))return res.writeHead(403).end();fs.readFile(file,(e,data)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(data)});});
const failures=[];
const output=process.env.DOCUMENT_TEST_OUTPUT;
if(output)fs.mkdirSync(output,{recursive:true});
async function check(name,fn){try{await fn();console.log('PASS',name)}catch(e){failures.push({name,error:e.message});console.log('FAIL',name,e.message)}}
function near(a,b,label){assert(Math.abs(a-b)<.003,`${label}: expected ${b}, got ${a}`)}
async function geometry(page,kind){return page.evaluate(kind=>{
 let el=document.querySelector({pdf:'#documentPdfCanvas',word:'#documentWordPaper',pptx:'#documentPptViewport > div',sheet:'#documentSheetPaper',image:'#documentGenericViewport img',text:'#documentGenericViewport pre',html:'#documentGenericViewport iframe',audio:'#documentGenericViewport audio',video:'#documentGenericViewport video'}[kind]);
 let r=el.getBoundingClientRect(),c=canvas.getBoundingClientRect();
 if(kind==='html'){const body=el.contentDocument?.body;if(body){const br=body.getBoundingClientRect(),sx=r.width/el.clientWidth,sy=r.height/el.clientHeight;r={left:r.left+br.left*sx,top:r.top+br.top*sy,width:br.width*sx,height:br.height*sy}}}
 const x=s=>(s*cssW+c.left-r.left)/r.width,y=s=>(s*cssH+c.top-r.top)/r.height;
 return {rect:{x:r.left,y:r.top,w:r.width,h:r.height},ink:strokes.map(s=>s.points?{x:x(s.points[0].x),y:y(s.points[0].y),size:s.size/r.width}:{x:x(s.x),y:y(s.y),w:s.w*cssW/r.width,h:s.h*cssH/r.height,size:(s.size||0)/r.width}),count:strokes.length};
 },kind)}
function same(a,b,label){assert.equal(b.count,a.count,label+' item count');for(let i=0;i<a.ink.length;i++)for(const key of Object.keys(a.ink[i]))near(b.ink[i][key],a.ink[i][key],label+' '+i+'.'+key)}
async function seed(page){await page.evaluate(()=>{
 const p={x:.35,y:.25};strokes=[{colour:'#17324d',size:5,points:[p,{x:.44,y:.31}]},{type:'image',x:.4,y:.32,w:.12,h:.07,src:'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60"><text y="45" font-size="40">1 + 1 = 2</text></svg>'),handwritingBeautified:true,smartGenerated:true,smartType:'equation',smartOriginal:[{size:5,points:[{x:.4,y:.32},{x:.5,y:.37}]}]},{type:'text',x:.35,y:.45,w:.16,h:.1,size:24,font:'Arial',text:'Page note',colour:'#17324d'}];redraw();syncUi();
})}
async function pageNumber(page,n){await page.locator('#documentQuickBar input[type=number]').evaluate((el,n)=>{el.value=String(n);el.dispatchEvent(new Event('change',{bubbles:true}))},n);await page.waitForTimeout(750)}
async function open(page,file,kind){await page.locator('input[type=file][accept="*/*"]').setInputFiles(path.join(fixtures,file));await page.waitForFunction(kind=>{
 const ids={pdf:'documentPdfCanvas',word:'documentWordViewport',pptx:'documentPptViewport',sheet:'documentSheetViewport',image:'documentGenericViewport',text:'documentGenericViewport',html:'documentGenericViewport',audio:'documentGenericViewport',video:'documentGenericViewport'};const e=document.getElementById(ids[kind]);return document.body.classList.contains('document-open-mode')&&e&&e.style.display!=='none'&&(kind!=='pptx'||e.children.length>0)&&(kind!=='image'||e.querySelector('img')?.complete);
 },kind);await page.waitForTimeout(550);}
async function zoom(page){await page.locator('#documentQuickBar button[title="Zoom in"]').click();await page.waitForTimeout(350)}
async function drawLine(page){await page.locator('#penBtn').click();const b=await page.locator('#board').boundingBox();await page.mouse.move(b.x+b.width*.3,b.y+b.height*.25);await page.mouse.down();await page.mouse.move(b.x+b.width*.4,b.y+b.height*.28,{steps:6});await page.mouse.up()}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{for(const viewport of [{width:1365,height:900},{width:390,height:844}]){
 const context=await browser.newContext({viewport}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+'/whiteboard-v2-trial.html',{waitUntil:'load'});await page.waitForFunction(()=>document.body.classList.contains('toolbar-ready'));
 await check(`${viewport.width} Settings top-right and guide`,async()=>{
  const settings=await page.locator('#mainSettingsBtn').boundingBox(),header=await page.locator('.top').boundingBox();assert(settings.y-header.y<=12);assert(header.x+header.width-settings.x-settings.width<=13);
  await page.locator('#mainSettingsBtn').click();await page.locator('#mainSettingsDialog').waitFor();assert((await page.locator('#mainSettingsDialog').innerText()).includes('Import learning merges'));assert.equal(await page.getByRole('button',{name:'Export Learning JSON',exact:true}).count(),1);await page.locator('#mainSettingsDialog').getByRole('button',{name:'Close',exact:true}).click();
  if(output)await page.screenshot({path:path.join(output,'settings-'+viewport.width+'.png')});
 });
 if(!process.argv.includes('--flows-only'))for(const [file,kind] of [['pages.pdf','pdf'],['pages.docx','word'],['pages.pptx','pptx'],['sheets.xlsx','sheet'],['page.svg','image'],['page.txt','text'],['page.html','html'],['page.wav','audio'],['page.webm','video']].filter(([,kind])=>!process.argv.includes('--media-only')||['audio','video'].includes(kind))){
  await open(page,file,kind);await seed(page);const before=await geometry(page,kind);
  await check(`${viewport.width} ${kind} zoom: ink, equation dimensions and text`,async()=>{await zoom(page);same(before,await geometry(page,kind),'zoom')});
  await check(`${viewport.width} ${kind} viewport resize`,async()=>{const start=await geometry(page,kind);await page.setViewportSize({width:viewport.width-70,height:viewport.height-60});await page.waitForTimeout(550);same(start,await geometry(page,kind),'resize');await page.setViewportSize(viewport);await page.waitForTimeout(550)});
  if(['pdf','pptx','sheet'].includes(kind))await check(`${viewport.width} ${kind} page isolation and return`,async()=>{const start=await geometry(page,kind);await pageNumber(page,2);assert.equal(await page.evaluate(()=>strokes.length),0);await pageNumber(page,1);same(start,await geometry(page,kind),'page return')});
  if(kind==='word')await check(`${viewport.width} word notes follow content across views`,async()=>{const start=await geometry(page,kind);await pageNumber(page,2);same(start,await geometry(page,kind),'word next view');await pageNumber(page,1);same(start,await geometry(page,kind),'word return')});
  await check(`${viewport.width} ${kind} hand pan`,async()=>{const start=await geometry(page,kind);await page.locator('#documentTouchNavBtn').click();const b=await page.locator('#board').boundingBox();await page.mouse.move(b.x+b.width*.4,b.y+b.height*.4);await page.mouse.down();await page.mouse.move(b.x+b.width*.4+35,b.y+b.height*.4+8,{steps:10});await page.mouse.up();await page.waitForTimeout(500);const after=await geometry(page,kind);assert(Math.abs(after.rect.x-start.rect.x)>5,'document actually moved');same(start,after,'pan')});
  if(kind==='html')await check(`${viewport.width} HTML internal scroll`,async()=>{const start=await geometry(page,kind);await page.locator('#documentGenericViewport iframe').evaluate(el=>el.contentWindow.scrollTo(0,200));await page.waitForTimeout(100);same(start,await geometry(page,kind),'HTML scroll')});
  await page.locator('#documentQuickBar button[title="Close document"]').click();assert.equal(await page.evaluate(()=>strokes.length),0,'original blank board restored');
 }
 await check(`${viewport.width} real pen, page-specific Undo, zoomed Undo and board restoration`,async()=>{
  await drawLine(page);const boardInk=await page.evaluate(()=>JSON.stringify(strokes));await open(page,'pages.pdf','pdf');await drawLine(page);const first=await geometry(page,'pdf');assert.equal(first.count,1);
  await pageNumber(page,2);assert.equal(await page.evaluate(()=>strokes.length),0);assert(await page.locator('#undoBtn').isDisabled(),'page 2 has no page 1 history');await page.evaluate(()=>document.getElementById('undoBtn').click());assert.equal(await page.evaluate(()=>strokes.length),0);
  await drawLine(page);assert.equal(await page.evaluate(()=>strokes.length),1);await page.locator('#undoBtn').click();assert.equal(await page.evaluate(()=>strokes.length),0);
  await pageNumber(page,1);same(first,await geometry(page,'pdf'),'return to pen');await zoom(page);same(first,await geometry(page,'pdf'),'zoomed pen');await page.locator('#undoBtn').click();assert.equal(await page.evaluate(()=>strokes.length),0,'Undo deletes only the page note');
  await page.locator('#documentQuickBar button[title="Close document"]').click();assert.equal(await page.evaluate(()=>JSON.stringify(strokes)),boardInk);await page.locator('#undoBtn').click();assert.equal(await page.evaluate(()=>strokes.length),0,'original board Undo preserved');
 });
 await check(`${viewport.width} Beautify, blue Learn below Apply, page return and transformed Undo`,async()=>{
  await open(page,'pages.pdf','pdf');await page.locator('#documentPenModeBtn').click();const f=require('./sign-fixtures.cjs');
  await page.evaluate(({ink,W,H})=>{strokes=ink.map(s=>({...s,colour:'#17324d',points:s.points.map(p=>({x:p.x*W/cssW,y:p.y*H/cssH}))}));redraw();syncUi()},{ink:f.equation('10','2','5',undefined,.7),W:f.W,H:f.H});const raw=await geometry(page,'pdf');
  await page.locator('#handwritingBeautifyBtn').click();const b=await page.locator('#board').boundingBox();await page.mouse.move(b.x+5,b.y+75);await page.mouse.down();await page.mouse.move(b.x+Math.min(b.width-6,345),b.y+160,{steps:8});await page.mouse.up();await page.waitForFunction(()=>!!document.getElementById('handwritingReadText')?.value&&document.getElementById('handwritingStopReadBtn')?.hidden);
  await page.locator('#handwritingReadText').fill('10 ÷ 2 = 5');const apply=await page.locator('.handwriting-apply').boundingBox(),learn=await page.locator('.handwriting-learn').boundingBox();assert(learn.y>apply.y&&learn.y-apply.y-apply.height<=10,'Learn directly below Apply');assert.equal(await page.locator('.handwriting-learn').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(37, 99, 235)');
  const learningBefore=await page.evaluate(()=>JSON.stringify((({createdAt,...data})=>data)(window.WhiteboardHandwritingLearning.exportPack())));await page.locator('.handwriting-apply').click();assert.equal(await page.evaluate(()=>JSON.stringify((({createdAt,...data})=>data)(window.WhiteboardHandwritingLearning.exportPack()))),learningBefore,'Apply does not train');assert.equal(await page.evaluate(()=>tool),'pen');const pretty=await geometry(page,'pdf');assert.equal(pretty.count,1);
  await zoom(page);same(pretty,await geometry(page,'pdf'),'beautified zoom');await pageNumber(page,3);assert.equal(await page.evaluate(()=>strokes.length),0);await pageNumber(page,1);same(pretty,await geometry(page,'pdf'),'beautified return');
  if(output)await page.screenshot({path:path.join(output,'equation-document-'+viewport.width+'.png')});await page.locator('#undoBtn').click();same(raw,await geometry(page,'pdf'),'beautify Undo after document changes');await page.locator('#documentQuickBar button[title="Close document"]').click();
 });
 await check(`${viewport.width} no JavaScript errors`,()=>assert.deepEqual(errors,[]));await context.close();
 }
 }finally{await browser.close();server.close()}
 if(failures.length){console.log(JSON.stringify({failures},null,2));process.exitCode=1}else console.log('All document annotation regressions passed.');
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
