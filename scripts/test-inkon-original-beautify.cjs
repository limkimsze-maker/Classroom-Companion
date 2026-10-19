/* Integration smoke test for the exact upstream demo recognizer behind Beautify. */
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:820}});
  page.setDefaultTimeout(120000);
  const outside=[],errors=[];
  page.on('request',r=>{if(new URL(r.url()).origin!=='http://127.0.0.1:8000')outside.push(r.url())});
  page.on('pageerror',e=>errors.push(e.message));
  page.on('requestfailed',r=>errors.push('Request failed '+r.url()+': '+r.failure()?.errorText));
  page.on('console',m=>{if(m.type()==='error')console.log('BROWSER CONSOLE:',m.text())});
  await page.goto('http://127.0.0.1:8000/whiteboard-comer-beta.html',{waitUntil:'load'});
  await page.locator('#handwritingBeautifyBtn').waitFor();
  const checks=await page.evaluate(()=>({
    exact:!!window.WhiteboardInkOnOriginalDemo?.recognize,
    beautify:!!document.getElementById('handwritingBeautifyBtn'),
    originalToggle:!!document.getElementById('comerExperimentalToggle'),
    uji:!!window.WhiteboardUjiReader,
    handwriting:!!window.WhiteboardHandwritingMath?.recognize
  }));
  console.log('Preserved tools:',JSON.stringify(checks));
  if(!checks.exact||!checks.beautify||!checks.uji||!checks.handwriting||checks.originalToggle){
    throw Error('Beautify or exact demo replacement incorrect');
  }
  const outcome=await page.evaluate(async()=>{
    const P=points=>({size:3,points:points.map(([x,y])=>({x,y}))});
    const strokes=[
      P([[.10,.40],[.115,.32],[.14,.31],[.15,.36],[.145,.41],[.10,.57],[.16,.57]]),
      P([[.19,.45],[.25,.45]]),
      P([[.22,.38],[.22,.52]]),
      P([[.28,.35],[.31,.31],[.345,.34],[.32,.43],[.348,.50],[.34,.57],[.30,.59]])
    ];
    try {
      const result=await window.WhiteboardHandwritingMath.recognize(strokes,700,250,{mode:'math'});
      return {engine:result.engine,text:result.text};
    }catch(e){return {error:e.message}}
  });
  console.log('Original demo worker inside Beautify:',JSON.stringify(outcome));
  if(outcome.error)throw Error('Actual upstream worker failed: '+outcome.error);
  if(outcome.engine!=='inkon-original-demo')throw Error('Incorrect recognizer: '+outcome.engine);
  if(!outcome.text.trim())throw Error('Demo returned empty latex');
  // Mobile regression: create a harmless local pen stroke and open the ACTUAL
  // Beautify review dialog, then assert the visible dropdown starts in Auto.
  // Open selection at desktop width; inspect the same modal at phone width.
  const seeded=await page.evaluate(()=>{
    const group={erase:false,colour:'#17324d',size:4,points:[
      {x:.23,y:.31},{x:.245,y:.31},{x:.26,y:.34},{x:.27,y:.39},{x:.26,y:.44}
    ]};
    if(typeof strokes==='undefined'||typeof redraw!=='function')return false;
    strokes.push(group);redraw();syncUi();return true;
  });
  if(!seeded)throw Error('Cannot seed test handwriting');
  // Exercise the real Beautify dialog with a known in-memory selection.
  // Selection geometry is independent of which reader starts as the default.
  await page.evaluate(()=>{
    const latest=strokes.at(-1);
    if (!latest || !window.WhiteboardMarqueeSelection) throw Error('No pen data');
    window.WhiteboardMarqueeSelection.get=()=>[latest];
  });
  await page.locator('#handwritingBeautifyBtn').click();
  await page.locator('#handwritingReadMode').waitFor({timeout:20000});
  await page.setViewportSize({width:390,height:844});
  const defaultMode=await page.locator('#handwritingReadMode').inputValue();
  console.log('Mobile Beautify default read mode:', defaultMode);
  if(defaultMode!=='auto')throw Error('Beautify must default to Auto, got '+defaultMode);
  await page.locator('#handwritingReadMode').selectOption('math');
  if(await page.locator('#handwritingReadMode').inputValue()!=='math')
    throw Error('Math formulas option no longer accessible');
  console.log('PASS: mobile Beautify starts on Auto; Math formulas remains selectable');

  if(errors.length)throw Error('Browser errors: '+errors.slice(0,6).join('; '));
  if(outside.length)throw Error('Unexpected external requests: '+outside.join('; '));
  console.log('PASS: original ink-on demo worker, Auto/beam candidates, same-origin assets, original Beautify and existing UJI');
 } finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
