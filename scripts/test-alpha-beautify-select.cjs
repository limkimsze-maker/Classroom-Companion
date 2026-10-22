'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(!p.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.readFile(p,(err,data)=>{if(err)return res.writeHead(404).end();res.setHeader('Content-Type',p.endsWith('.js')?'application/javascript':p.endsWith('.html')?'text/html':'application/octet-stream');res.end(data)})
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{for(const width of [1365,390]){
  const ctx=await browser.newContext({viewport:{width,height:900}});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/whiteboard.html',{waitUntil:'load'});
  await page.waitForFunction(()=>document.body.classList.contains('toolbar-ready'));
  await page.evaluate(()=>{
   document.getElementById('penBtn').click();
   strokes.push({colour:'#17324d',size:3,points:[{x:.17,y:.24},{x:.17,y:.31},{x:.17,y:.38}]});
   redraw();syncUi();
  });
  assert.equal(await page.evaluate(()=>tool),'pen','Starting mode is Pen');
  await page.locator('#handwritingBeautifyBtn').click();
  await page.waitForFunction(()=>document.getElementById('boardWrap')?.classList.contains('handwriting-selecting'));
  const r=await page.locator('#board').boundingBox();
  const x=r.x+r.width*.11,y=r.y+r.height*.18;
  await page.mouse.move(x,y);await page.mouse.down();
  await page.mouse.move(r.x+r.width*.31,r.y+r.height*.49,{steps:14});
  await page.mouse.up();
  const input=page.locator('#handwritingReadText');await input.waitFor({state:'visible',timeout:12000});
  await input.fill('1 + 1 = 2');
  const apply=page.locator('.handwriting-review .handwriting-apply');
  await apply.waitFor({state:'visible'});
  await page.waitForFunction(()=>!document.querySelector('.handwriting-review .handwriting-apply')?.disabled,null,{timeout:12000});
  await apply.click();
  await page.waitForFunction(()=>!document.querySelector('.handwriting-review-backdrop'));
  const result=await page.evaluate(()=>({
   tool,selectActive:document.getElementById('selectBtn')?.classList.contains('active'),
   penActive:document.getElementById('penBtn')?.classList.contains('active'),
   strokeCount:strokes.length,
   beautified:strokes[0]?.handwritingBeautified===true,
   objectType:strokes[0]?.type
  }));
  assert.equal(result.tool,'select','Beautify Apply must switch to Select');
  assert.equal(result.selectActive,true,'Select button must reflect current tool');
  assert.equal(result.penActive,false,'Pen must not remain highlighted');
  assert.equal(result.strokeCount,1,'One beautified object should replace selected handwriting');
  assert.equal(result.beautified,true,'Converted object should be marked beautified');
  console.log('PASS',width,'Beautify Apply selects Select tool and preserves beautified object',JSON.stringify(result));
  await page.locator('#undoBtn').click();
  const undone=await page.evaluate(()=>({tool,number:strokes.length,originalInk:Array.isArray(strokes[0]?.points)&&strokes[0].points.length===3,beautified:strokes[0]?.handwritingBeautified===true}));
  assert.equal(undone.number,1);
  assert.equal(undone.originalInk,true,'Undo must restore handwritten stroke');
  assert.equal(undone.beautified,false,'Beautified object must be removed by Undo');
  assert.deepEqual(errors,[],'No browser exceptions');
  console.log('PASS',width,'Beautify Undo restores original handwriting',JSON.stringify(undone));
  await ctx.close();
 }}finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
