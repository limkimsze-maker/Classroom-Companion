'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{reported,normalise}=require('./fraction-bar-fixtures.cjs'),{makeDocx}=require('./word-layout-fixtures.cjs');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!p.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(p,(e,d)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.html')?'text/html':'application/octet-stream');res.end(d)})});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});let activePage;
 try{for(const pageName of ['whiteboard-v2-trial.html','whiteboard.html'].filter(p=>!process.env.FRACTION_PAGE||p===process.env.FRACTION_PAGE))for(const width of [1365,390].filter(w=>!process.env.FRACTION_WIDTH||w===+process.env.FRACTION_WIDTH)){
  const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),errors=[];
  activePage=page;page.setDefaultTimeout(8000);page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  await page.goto('http://127.0.0.1:'+server.address().port+'/'+pageName+'?fraction_check=1');
  await page.waitForFunction(()=>document.body.classList.contains('toolbar-ready')&&window.ClassroomFractionBars);await page.evaluate(()=>{window.__fractionClickTrace=[];for(const type of ['pointerdown','pointerup','click'])window.addEventListener(type,e=>{if(e.target!==canvas)return;const r=canvas.getBoundingClientRect(),m=strokes.find(s=>s.smartType==='fractionBar');window.__fractionClickTrace.push({type,x:e.clientX,y:e.clientY,rect:r.toJSON(),model:m&&{x:m.x,y:m.y,w:m.w,h:m.h},tool});if(window.__fractionClickTrace.length>12)window.__fractionClickTrace.shift()},true)});
  const model=()=>page.evaluate(()=>strokes.find(s=>s.smartType==='fractionBar'));
  const reset=async()=>page.evaluate(()=>{document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));strokes=[];WhiteboardAnnotationHistory.set([]);redraw();syncUi()});
  const choose=async()=>{await page.locator('#smartMathBtn').click();await page.getByRole('button',{name:'Fraction Bar',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Fraction Bar',exact:true}).isVisible(),false,'Menu closes');assert.equal(await page.evaluate(()=>ClassroomFractionBars.isActive()&&tool==='pen'),true);if(await page.evaluate(()=>CCDocumentAnnotations.isOpen()))assert.equal(await page.locator('#documentTouchNavBtn').getAttribute('aria-pressed'),'false','Fraction Bar releases Hand navigation')};
  const draw=async fixture=>{const b=await page.locator('#board').boundingBox();for(const s of normalise(fixture.paths,b.width,b.height)){const ps=s.points.map(p=>[b.x+p.x*b.width,b.y+p.y*b.height]);await page.mouse.move(...ps[0]);await page.mouse.down();for(const p of ps.slice(1))await page.mouse.move(...p,{steps:2});await page.mouse.up()}};
  const finish=async fixture=>{await page.locator('#smartFractionFinishBtn').click();assert.equal((await model())?.fractionParts,fixture.parts,fixture.name+' correct parts');assert.equal(await page.evaluate(()=>strokes.filter(s=>s.smartType==='fractionBar').length),1);assert.equal(await page.evaluate(()=>strokes.filter(s=>s.points).length),0,'All source ink replaced');};
  for(const mode of ['blank','word'].filter(m=>!process.env.FRACTION_MODE||m===process.env.FRACTION_MODE)){
   if(mode==='word'){await page.locator('input[type=file][accept="*/*"]').setInputFiles({name:'fractions.docx',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',buffer:await makeDocx()});await page.waitForFunction(()=>CCDocumentAnnotations.ready())}
   for(const fixture of reported){
    await reset();await choose();await draw(fixture);await finish(fixture);
    await page.locator('#undoBtn').click();assert.equal(await model(),undefined,'One Undo restores raw sketch');assert((await page.evaluate(()=>strokes.length))>0);
    // Re-select Fraction Bar after drawing/Undo. Existing ink is a supported input.
    await choose();await finish(fixture);
   }
   // Switching to an older Smart Math controller must release this mode.
   await reset();await choose();await page.locator('#smartMathBtn').click();await page.getByRole('button',{name:'Counters',exact:true}).click();assert.equal(await page.evaluate(()=>ClassroomFractionBars.isActive()),false);assert.equal(await page.locator('#smartFractionFinishBtn').isVisible(),false);await choose();await draw(reported[1]);await finish(reported[1]);
   // Clear and erasing change array indices while Fraction Bar remains armed.
   await reset();await page.evaluate(()=>{strokes=Array.from({length:7},(_,i)=>({points:[{x:.03,y:.7+i*.01},{x:.05,y:.71+i*.01}],colour:'#17324d',size:3}));redraw();syncUi()});await choose();await page.locator('#clearBtn').click();await draw(reported[1]);await finish(reported[1]);
   // A failed attempt retains all ink and can succeed after its missing divider.
   await reset();await choose();const b=await page.locator('#board').boundingBox(),ink=normalise(reported[1].paths,b.width,b.height);await page.evaluate(items=>{strokes=items.slice(0,1);redraw();syncUi()},ink);const old=await page.evaluate(()=>JSON.stringify(strokes));await page.locator('#smartFractionFinishBtn').click();assert.equal(await page.evaluate(()=>JSON.stringify(strokes)),old);await page.evaluate(s=>{strokes.push(s);redraw();syncUi()},ink[1]);await finish(reported[1]);
   // Unrelated page ink is preserved by conversion.
   await reset();await choose();await page.evaluate(items=>{strokes=[{colour:'#dc2626',size:3,points:[{x:.02,y:.85},{x:.07,y:.86}]},...items];redraw();syncUi()},ink);await page.locator('#smartFractionFinishBtn').click();assert.equal((await model())?.fractionParts,2);assert.equal(await page.evaluate(()=>strokes.filter(s=>s.points).length),1);
   // Colouring, move and resize use the same Undo order as the rest of the page.
   await reset();await choose();await draw(reported[1]);await finish(reported[1]);
   let m=await model(),r=await page.locator('#board').boundingBox();await page.mouse.click(r.x+(m.x+m.w*.25)*r.width,r.y+(m.y+m.h*.5)*r.height);await page.locator('#smartFractionColourPanel').getByRole('button',{name:'Red',exact:true}).click();assert.equal((await model()).fractionFills[0],'#dc2626');await page.locator('#undoBtn').click();assert.equal((await model()).fractionFills[0],'#ffffff');
   await page.locator('#selectBtn').click();m=await model();r=await page.locator('#board').boundingBox();const x=r.x+(m.x+m.w*.4)*r.width,y=r.y+(m.y+m.h*.5)*r.height;await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+25,y+22,{steps:6});await page.mouse.up();let moved=await model();assert(Math.abs(moved.x-m.x)>.005,'Fraction bar moves');assert.equal(await page.locator('#smartFractionColourPanel').count(),0,'Dragging does not open colour chooser');await page.locator('#undoBtn').click();assert(Math.abs((await model()).x-m.x)<1e-6,'Undo move');
   m=await model();r=await page.locator('#board').boundingBox();await page.mouse.click(r.x+(m.x+m.w*.4)*r.width,r.y+(m.y+m.h*.5)*r.height);await page.locator('#selectBtn').click();await page.mouse.move(r.x+(m.x+m.w)*r.width+7,r.y+(m.y+m.h)*r.height+7);await page.mouse.down();await page.mouse.move(r.x+(m.x+m.w)*r.width+30,r.y+(m.y+m.h)*r.height+24,{steps:6});await page.mouse.up();assert((await model()).w>m.w,'Fraction bar resizes');await page.locator('#undoBtn').click();assert(Math.abs((await model()).w-m.w)<1e-6,'Undo resize');
   await page.screenshot({path:'/tmp/fraction-bars-'+pageName.replace('.html','')+'-'+mode+'-'+width+'.png'});
   console.log('PASS',pageName,width,mode,'three reported shapes, draw/choose order, Clear/retry, unrelated ink, colour, move, resize and Undo');
   if(mode==='word'){
    // Page changes cancel a pending fraction; a later page cannot convert old ink.
    await choose();await page.locator('#documentQuickBar input[type=number]').evaluate(el=>{el.value='2';el.dispatchEvent(new Event('change',{bubbles:true}))});await page.waitForFunction(()=>CCDocumentAnnotations.ready()&&CCDocumentAnnotations.currentPage()===2);assert.equal(await page.evaluate(()=>ClassroomFractionBars.isActive()),false);assert.equal(await page.evaluate(()=>strokes.length),pageName==='whiteboard.html'?0:1,'Paged Word separates ink; Beta continuous Word preserves its document ink');
   }
  }
  assert.deepEqual(errors,[]);await context.close();
 }}catch(err){if(activePage){await activePage.screenshot({path:'/tmp/fraction-workflow-failure.png'});console.log('FAILURE STATE',JSON.stringify(await activePage.evaluate(()=>({tool,board:canvas.getBoundingClientRect().toJSON(),models:strokes.filter(s=>s.smartType==='fractionBar'),panel:document.getElementById('smartFractionColourPanel')?.outerHTML,toast:document.getElementById('toast').textContent,trace:window.__fractionClickTrace})),null,2));}throw err}finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
