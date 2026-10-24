'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{makeDocx}=require('./word-layout-fixtures.cjs');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
 if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.readFile(file,(err,data)=>{if(err)return res.writeHead(404).end();res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.html')?'text/html':'application/octet-stream');res.end(data)});
});
async function checkToolbar(page,label){
 const hidden=await page.evaluate(()=>{
  const tools=document.querySelector('.tools'),tr=tools.getBoundingClientRect(),bad=[];
  for(const el of tools.querySelectorAll('button,input')){
   const r=el.getBoundingClientRect(),s=getComputedStyle(el);
   if(s.display==='none'||s.visibility==='hidden'||!r.width||!r.height)continue;
   const name=el.id||el.getAttribute('aria-label')||el.textContent;
   if(r.left<Math.max(0,tr.left)-1||r.right>Math.min(innerWidth,tr.right)+1||r.top<tr.top-1||r.bottom>Math.min(innerHeight,tr.bottom)+1)bad.push(name+' is clipped');
   const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
   if(hit&&!el.contains(hit)&&!hit.contains(el))bad.push(name+' is covered');
  }
  return bad;
 });
 assert.deepEqual(hidden,[],label+': every available toolbar control is visible');
 for(const id of ['penBtn','highlighterBtn','textBtn','speechToTextBtn','eraserBtn','smartMathBtn','undoBtn','gridBtn','clearBtn'])assert(await page.locator('#'+id).isVisible(),label+': '+id);
 const documentOpen=await page.evaluate(()=>document.body.classList.contains('document-open-mode'));
 assert((await page.locator('#board').boundingBox()).height>(documentOpen?100:0),label+': board still has usable space');
}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const width of [1365,800,390,320]){
   const context=await browser.newContext({viewport:{width,height:width<400?640:900}}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('dialog',dialog=>dialog.accept());
   await page.goto('http://127.0.0.1:'+server.address().port+'/whiteboard.html?edition=en');
   await page.waitForFunction(()=>document.body.classList.contains('toolbar-ready'));
   await checkToolbar(page,width+' blank whiteboard');
   for(const kind of ['text','word']){
    const buffer=kind==='word'?await makeDocx():Buffer.from('All teaching tools remain visible.');
    await page.locator('input[type=file][accept="*/*"]').setInputFiles({name:'toolbar-check.'+(kind==='word'?'docx':'txt'),mimeType:kind==='word'?'application/vnd.openxmlformats-officedocument.wordprocessingml.document':'text/plain',buffer});
    await page.waitForFunction(()=>document.body.classList.contains('document-open-mode')&&window.CCDocumentAnnotations?.ready());
    await checkToolbar(page,width+' '+kind);
    await page.locator('#smartMathBtn').click();
    await page.getByRole('button',{name:'Bar Model',exact:true}).click();
    await page.locator('#smartBarTypeMenu').getByRole('button',{name:'Comparison',exact:true}).click();
    await checkToolbar(page,width+' '+kind+' comparison active');
    assert(await page.locator('#smartMathBtn + button').isVisible(),'Finished bar model is present');
    await page.keyboard.press('Escape');
    await page.evaluate(()=>{strokes.push({colour:'#17324d',size:3,points:[{x:.3,y:.3},{x:.4,y:.4}]});redraw();syncUi()});
    await page.locator('#clearBtn').click();
    assert.equal(await page.evaluate(()=>strokes.length),0,'Clear removes the page ink');
    await page.screenshot({path:'/tmp/alpha-v2-toolbar-'+kind+'-'+width+'.png'});
    await page.locator('#ccPermanentExitBtn').click();
    await page.waitForFunction(()=>!document.body.classList.contains('document-open-mode'));
   }
   assert.deepEqual(errors,[]);console.log('PASS',width,'all toolbar controls, Smart Math menu/Finished, Clear and usable document space');
   await context.close();
  }
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
