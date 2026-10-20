/* Full Auto review/Apply/Undo with generated radicals and public UJI V1 ink. CI rerun after CSP polling correction. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const ctx=require('./helpers/handwriting-context.cjs')(),{make,W,H}=require('./helpers/square-root-fixtures.cjs')(ctx);
// Poll through the protocol: older Playwright waitForFunction injects eval,
// which the real whiteboard correctly rejects under its unchanged CSP.
async function waitFor(page,predicate){
 const end=Date.now()+30000;
 while(Date.now()<end){if(await page.evaluate(predicate))return;await new Promise(r=>setTimeout(r,50));}
 throw Error('Timed out waiting for the square-root UI');
}
const root=process.cwd(),server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
 fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return}
 res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'text/javascript; charset=utf-8':file.endsWith('.wasm')?'application/wasm':'application/octet-stream');res.end(data)});
});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{})});
 try{
 for(const html of ['whiteboard-smart-beta.html','whiteboard-comer-beta.html'])for(const mobile of [false,true]){
  const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1280,height:900}}),errors=[],outside=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url())&&new URL(r.url()).origin!==origin)outside.push(r.url())});
  await page.goto(origin+'/'+html);await waitFor(page,()=>typeof MathJax.tex2svg==='function');
  const ink=make('49','7',{curved:true,joined:mobile}).ink;
  const baseline=await ctx.WhiteboardHandwritingMath.recognize(ink,W,H,{mode:'auto'});
  const parity=await page.evaluate(async({ink,W,H})=>{const r=await WhiteboardHandwritingMath.recognize(ink,W,H,{mode:'auto'});return {text:r.text,engine:r.engine,flagged:!!r.uncertain.length}},{ink,W,H});
  assert.deepEqual(parity,{text:baseline.text,engine:baseline.engine,flagged:!!baseline.uncertain.length},'production worker and Node agree');
  await page.evaluate(({ink,W,H})=>{strokes=ink.map(s=>({...s,points:s.points.map(p=>({x:(p.x*W+20)/cssW,y:(p.y*H-100)/cssH}))}));redraw();syncUi();WhiteboardMarqueeSelection.get=()=>strokes.slice();},{ink,W,H});
  await page.locator('#handwritingBeautifyBtn').click();await waitFor(page,()=>document.getElementById('handwritingReadText')?.value==='\\sqrt{49} = 7');
  assert.equal(await page.locator('#handwritingReadMode').inputValue(),'auto');
  await page.getByText('✓ Apply beautify',{exact:true}).click();
  const result=await page.evaluate(()=>({n:strokes.length,latex:strokes[0].equationLatex,svg:decodeURIComponent(strokes[0].src.split(',').slice(1).join(',')),original:strokes[0].smartOriginal.length,tool}));
  assert.equal(result.n,1);assert.equal(result.latex,'\\sqrt{49} = 7');assert(result.svg.includes('data-mml-node="msqrt"'));assert.equal(result.original,ink.length);assert.equal(result.tool,'pen');
  await page.locator('#undoBtn').click();assert.equal(await page.evaluate(()=>strokes.length),ink.length);
  await page.locator('#handwritingBeautifyBtn').click();await waitFor(page,()=>document.getElementById('handwritingReadText')?.value==='\\sqrt{49} = 7');
  await page.locator('#handwritingReadText').fill('√49 = 7');await page.getByText('✓ Apply beautify',{exact:true}).click();
  assert.equal(await page.evaluate(()=>strokes[0].equationLatex),'\\sqrt{49} = 7','Unicode correction covers both digits under the radical');
  await page.locator('#undoBtn').click();assert.equal(await page.evaluate(()=>strokes.length),ink.length);
  assert(await page.evaluate(()=>!!WhiteboardEquationFormatter.createHandwriting('√',{x:.1,y:.1,w:.1,h:.1},'#17324d')),'standalone root symbol remains valid');
  assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);await page.close();
  console.log('PASS '+html+' '+(mobile?'mobile':'desktop')+': Auto square root, worker parity, full radicand rendering, Unicode correction, Apply/Undo and return to pen; no outside requests');
 }
 }finally{await browser.close();server.close();}
})().catch(e=>{server.close();console.error(e);process.exitCode=1});
