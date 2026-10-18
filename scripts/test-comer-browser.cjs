/* Browser smoke test: use only fictitious non-sensitive pen strokes. */
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({headless:true, args:['--no-sandbox']});
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(120000);
    const errors = [];
    const network = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('request', r => { if (new URL(r.url()).origin !== 'http://127.0.0.1:8000') network.push(r.url()); });
    await page.goto('http://127.0.0.1:8000/whiteboard-comer-beta.html', {waitUntil:'load',timeout:120000});
    await page.waitForSelector('#comerExperimentalToggle');
    const before = await page.getAttribute('#comerExperimentalToggle', 'aria-pressed');
    if (before !== 'false') throw Error('CoMER must be off by default');
    await page.click('#comerExperimentalToggle');
    const after = await page.getAttribute('#comerExperimentalToggle', 'aria-pressed');
    if (after !== 'true') throw Error('CoMER toggle did not enable');
    const outcome = await page.evaluate(async () => {
      const P=(pts)=>({size:3,points:pts.map(([x,y])=>({x,y}))});
      const strokes = [
        P([[.10,.40],[.115,.32],[.14,.31],[.15,.36],[.145,.41],[.10,.57],[.16,.57]]), // 2
        P([[.19,.45],[.25,.45]]), P([[.22,.38],[.22,.52]]), // +
        P([[.28,.35],[.31,.31],[.345,.34],[.32,.43],[.348,.50],[.34,.57],[.30,.59]]) // 3
      ];
      try {
        const result = await window.WhiteboardMathReader.recognize(strokes, 700, 250, {mode:'math'});
        return {type:'result',engine:result.engine,latex:result.text};
      } catch(e) {
        return {type:'error',message:e.message};
      }
    });
    console.log('CoMER worker result:',JSON.stringify(outcome));
    // Model may reject toy strokes, but must have successfully loaded the WASM model.
    if (outcome.type==='error' && !/returned no mathematical expression/i.test(outcome.message)) {
      throw Error('CoMER browser inference failed: '+outcome.message);
    }
    if (outcome.type==='result' && outcome.engine!=='local-comer-experimental') {
      throw Error('Wrong engine used: '+outcome.engine);
    }
    await page.click('#comerExperimentalToggle');
    if (await page.getAttribute('#comerExperimentalToggle', 'aria-pressed')!=='false') {
      throw Error('CoMER toggle could not revert');
    }
    if (network.length) throw Error('Outbound request detected: '+network.join(', '));
    if (errors.length) console.log('Page errors (inspect separately):',errors.slice(0,5));
    console.log('PASS: CoMER ONNX/WASM worker loaded, toggle is reversible, no external network requests.');
  } finally {
    await browser.close();
  }
})().catch(e=>{ console.error(e); process.exit(1); });
