'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{cases,ink,number}=require('./layout-fixtures.cjs');
const measurement=require('./fixtures/teacher-open-four-area.json');
const build=fs.readFileSync(path.join(__dirname,'reader-v2.js'),'utf8').match(/WhiteboardHandwritingMath\.build='([^']+)'/)[1];
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
   await page.waitForFunction(build=>window.WhiteboardHandwritingMath?.build===build,build);
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
   // Returning to Pen must draw actual ink, not merely highlight the button.
   const penBoard=await page.locator('#board').boundingBox(),penCount=await page.evaluate(()=>strokes.length);
   assert.equal(await page.evaluate(()=>tool),'pen');
   assert.equal(await page.locator('#board').evaluate(el=>el.style.cursor),'crosshair');
   await page.mouse.move(penBoard.x+20,penBoard.y+penBoard.height-45);await page.mouse.down();
   await page.mouse.move(penBoard.x+65,penBoard.y+penBoard.height-25,{steps:5});await page.mouse.up();
   assert.equal(await page.evaluate(()=>strokes.length),penCount+1,'Pen draws a new stroke after Beautify');
   assert(await page.evaluate(()=>strokes.at(-1).points?.length>=2),'Pen stroke contains ink');

   // Replay the actual teacher's measurement through the same visible flow.
   await page.evaluate(sample=>{
    strokes=sample.strokes.map(s=>({...s,colour:'#17324d',points:s.points.map(p=>({x:p.x*sample.width/cssW,y:p.y*sample.height/cssH}))}));
    redraw();syncUi();
   },measurement);
   await page.locator('#handwritingBeautifyBtn').click();
   await page.mouse.move(board.x+55,board.y+85);await page.mouse.down();
   await page.mouse.move(board.x+315,board.y+225,{steps:10});await page.mouse.up();
   await page.waitForFunction(()=>document.getElementById('handwritingReadText')?.value==='45 cm²',{},{timeout:20000});
   await page.waitForFunction(()=>!document.querySelector('.handwriting-apply')?.disabled,{},{timeout:20000});
   await page.screenshot({path:path.join(output,`measurement-${viewport.width}.png`)});
   await page.locator('.handwriting-apply').click();
   assert.equal(await page.locator('.handwriting-review-backdrop').count(),0,'Measurement Apply completes');
   assert.equal(await page.locator('#penBtn').getAttribute('class').then(c=>c.includes('active')),true,'Measurement returns to pen');
   // The user can resolve an ambiguous character through a visible choice.
   const glyph=number('c');
   await page.evaluate(ink=>{
    strokes=ink.map(s=>({...s,colour:'#17324d',points:s.points.map(p=>({x:p.x*1800/cssW,y:p.y*1200/cssH}))}));
    redraw();syncUi();
   },ink(glyph));
   await page.locator('#handwritingBeautifyBtn').click();
   const glyphBoard=await page.locator('#board').boundingBox();
   await page.mouse.move(glyphBoard.x+75,glyphBoard.y+45);await page.mouse.down();
   await page.mouse.move(glyphBoard.x+glyph.w+105,glyphBoard.y+glyph.h+75,{steps:10});await page.mouse.up();
   const upper=page.getByRole('button',{name:'Use reading C',exact:true}),lower=page.getByRole('button',{name:'Use reading c',exact:true});
   await upper.waitFor({state:'visible',timeout:20000});await lower.waitFor({state:'visible'});
   await upper.click();assert.equal(await page.locator('#handwritingReadText').inputValue(),'C');
   await page.screenshot({path:path.join(output,`glyph-choices-${viewport.width}.png`)});
   await page.locator('.handwriting-apply').click();
   assert.equal(await page.locator('.handwriting-review-backdrop').count(),0,'Chosen character Apply completes');
   assert.equal(await page.locator('#penBtn').getAttribute('class').then(c=>c.includes('active')),true,'Chosen character returns to pen');

   // Check current teacher flows using the actual shipped reader/controller.
   await page.evaluate(ink=>{
    strokes=ink.map(s=>({...s,colour:'#17324d',points:s.points.map(p=>({x:p.x*1800/cssW,y:p.y*1200/cssH}))}));
    delete window.WhiteboardHandwritingMath; // exercise ensureReader recovery
    redraw();syncUi();
   },ink(number('1')));
   await page.locator('#handwritingBeautifyBtn').click();
   let bb=await page.locator('#board').boundingBox();
   await page.mouse.move(bb.x+65,bb.y+35);await page.mouse.down();
   await page.mouse.move(bb.x+160,bb.y+145,{steps:8});await page.mouse.up();
   await page.waitForFunction(()=>document.getElementById('handwritingReadText')?.value?.trim(),null,{timeout:20000});
   await page.locator('#handwritingCorrectArithmetic').uncheck();
   await page.locator('#handwritingReadText').fill('1 + 1');
   await page.waitForFunction(()=>!document.querySelector('.handwriting-apply')?.disabled);
   await page.locator('.handwriting-apply').click();
   const original=await page.evaluate(()=>{
    const s=strokes.find(s=>s.type==='image');return {x:s.x,y:s.y,w:s.w,h:s.h,src:s.src};
   });
   assert(original.src.startsWith('data:image/svg+xml'),'Arithmetic is an editable-size SVG object');
   await page.locator('#selectBtn').click();
   await page.mouse.click(bb.x+(original.x+original.w/2)*bb.width,bb.y+(original.y+original.h/2)*bb.height);
   async function dragScale(factor,pointerType){
    await page.waitForTimeout(120); // wait for responsive selection toolbar to settle
    bb=await page.locator('#board').boundingBox();
    const before=await page.evaluate(()=>{const s=strokes.find(s=>s.type==='image');return{x:s.x,y:s.y,w:s.w,h:s.h};});
    const sx=bb.x+(before.x+before.w)*bb.width+7,sy=bb.y+(before.y+before.h)*bb.height+7;
    const ex=sx+before.w*bb.width*(factor-1),ey=sy+before.h*bb.height*(factor-1);
    if(pointerType==='mouse'){
     await page.mouse.move(sx,sy);await page.mouse.down();await page.mouse.move(ex,ey,{steps:8});await page.mouse.up();
    }else{
     await page.evaluate(({sx,sy,ex,ey})=>{
      const c=document.getElementById('board');
      for(const [type,x,y,buttons] of [['pointerdown',sx,sy,1],['pointermove',ex,ey,1],['pointerup',ex,ey,0]])
       c.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerType:'touch',pointerId:61,isPrimary:true,clientX:x,clientY:y,button:0,buttons}));
     },{sx,sy,ex,ey});
    }
    const after=await page.evaluate(()=>{const s=strokes.find(s=>s.type==='image');return{x:s.x,y:s.y,w:s.w,h:s.h};});
    console.log('RESIZE GEOMETRY',JSON.stringify({viewport:viewport.width,pointerType,before,after,bb,sx,sy,ex,ey,dimensions:await page.evaluate(()=>({cssW,cssH,rect:document.getElementById('board').getBoundingClientRect().toJSON(),tool}))}));
    assert(Math.abs(after.w/after.h-before.w/before.h)<.0001,'Preserve equation aspect ratio');
    assert.equal(after.x,before.x,'Keep left anchor');assert.equal(after.y,before.y,'Keep top anchor');
    assert(factor>1?after.w>before.w:after.w<before.w,pointerType+' resize changes size in intended direction');
    return before;
   }
   await dragScale(1.12,'mouse');
   const beforeShrink=await dragScale(.75,'touch');
   await page.locator('#undoBtn').click();
   const undone=await page.evaluate(()=>{const s=strokes.find(s=>s.type==='image');return {w:s.w,h:s.h};});
   assert(Math.abs(undone.w-beforeShrink.w)<1e-9&&Math.abs(undone.h-beforeShrink.h)<1e-9,'Undo restores resized dimensions');
   await page.screenshot({path:path.join(output,'resize-'+viewport.width+'.png')});
   console.log('PASS shipped reader recovery, unchecked arithmetic Apply, mouse enlarge, touch shrink, ratio, anchor and Undo:',viewport.width);


   // Selected-object Eraser removes only that object and retains an undo snapshot.
   await page.evaluate(()=>{strokes.push({type:'text',text:'Keep',x:.72,y:.75,w:.22,h:.12,size:22,font:'Arial',colour:'#17324d'});redraw();syncUi();});
   await page.locator('#selectBtn').click();
   await page.waitForTimeout(120);
   let eraseBoard=await page.locator('#board').boundingBox();
   let target=await page.evaluate(()=>{const s=strokes.find(s=>s.type==='image');return{x:s.x,y:s.y,w:s.w,h:s.h};});
   await page.mouse.click(eraseBoard.x+(target.x+target.w/2)*eraseBoard.width,eraseBoard.y+(target.y+target.h/2)*eraseBoard.height);
   await page.locator('#eraserBtn').click();
   assert.equal(await page.evaluate(()=>strokes.filter(s=>s.type==='image').length),0,'Eraser deletes selected image');
   assert.equal(await page.evaluate(()=>strokes.find(s=>s.text==='Keep')?.text),'Keep','Unselected object preserved');
   await page.locator('#undoBtn').click();
   assert.equal(await page.evaluate(()=>strokes.filter(s=>s.type==='image').length),1,'Undo restores erased image');
   await page.locator('#selectBtn').click();await page.waitForTimeout(120);
   eraseBoard=await page.locator('#board').boundingBox();
   target=await page.evaluate(()=>{const s=strokes.find(s=>s.text==='Keep');return{x:s.x,y:s.y,w:s.w,h:s.h};});
   await page.mouse.click(eraseBoard.x+(target.x+target.w/2)*eraseBoard.width,eraseBoard.y+(target.y+target.h/2)*eraseBoard.height);
   await page.locator('#eraserBtn').click();
   assert.equal(await page.evaluate(()=>strokes.some(s=>s.text==='Keep')),false,'Eraser deletes selected text');
   await page.locator('#undoBtn').click();
   assert.equal(await page.evaluate(()=>strokes.some(s=>s.text==='Keep')),true,'Undo restores erased text');
   // With no selection Eraser remains the normal freehand eraser tool.
   await page.locator('#penBtn').click();
   await page.locator('#eraserBtn').click();
   assert.equal(await page.evaluate(()=>tool),'eraser','No selection switches to normal eraser');
   console.log('PASS actual pen drawing after Beautify, selected image/text Eraser, retained objects and delete Undo:',viewport.width);
   assert.deepEqual(errors,[],'No browser script errors');
   console.log('PASS browser preview, matched loader, nested recognition, Apply, pen return and isolated storage:',viewport.width);
   await context.close();
  }
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>server.close());
