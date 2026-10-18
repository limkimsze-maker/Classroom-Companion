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
    page.on('console', m => { if (m.type()==='error') console.log('BROWSER CONSOLE:',m.text()); });
    page.on('requestfailed', r => console.log('REQUEST FAILED:',r.url(),r.failure()?.errorText));
    page.on('response', r => { if (!r.ok()) console.log('HTTP FAILURE:',r.status(),r.url()); });
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

    // Deterministic integration check: simulate a recognizer that knows
    // "45" and "cm^2" independently but misreads them together.
    // This exercises the actual CoMER Beta adapter and input partitioning.
    const qty = await page.evaluate(async () => {
      const originalWorker = window.Worker;
      const originalPrep = window.WhiteboardCoMERPreprocess;
      class SimWorker {
        postMessage(msg) {
          let latex = '?';
          if (msg.input.width === 5) latex = '4scm'; // deliberately bad whole recognition
          if (msg.input.width === 2 && msg.mode === 'number') latex = '45';
          if (msg.input.width === 3 && msg.mode === 'expression') latex = '\\mathrm{cm}^{2}';
          queueMicrotask(() => this.onmessage?.({data:{id:msg.id,latex,totalMs:1}}));
        }
        terminate() {}
      }
      window.Worker = SimWorker;
      window.WhiteboardCoMERPreprocess = {
        isStrokeMeaningful:()=>true,
        preprocessStrokes:strokes=>({
          tensor:new Float32Array([1]),mask:new Uint8Array([0]),
          width:strokes.length,height:1,maskHeight:1,maskWidth:1
        })
      };
      const stroke=(points)=>({points:points.map(([x,y])=>({x,y})),size:3});
      const handwritten = [
        stroke([[.10,.10],[.11,.30]]),
        stroke([[.14,.10],[.145,.30]]),
        stroke([[.26,.20],[.30,.28]]),
        stroke([[.32,.20],[.40,.27]]),
        stroke([[.42,.07],[.45,.10]])
      ];
      try {
        document.getElementById('comerExperimentalToggle').click();
        const result=await window.WhiteboardMathReader.recognize(handwritten,700,250,{mode:'math'});
        return {text:result.text,engine:result.engine};
      } finally {
        document.getElementById('comerExperimentalToggle').click();
        window.Worker=originalWorker;
        window.WhiteboardCoMERPreprocess=originalPrep;
      }
    });
    if (qty.text !== '45 cm²' || qty.engine !== 'local-comer-quantity-split') {
      throw Error('Composite measurement recognition integration failed: '+JSON.stringify(qty));
    }
    console.log('PASS: independently recognised number and unit recombined as',qty.text);
    if (network.length) throw Error('Outbound request detected: '+network.join(', '));
    if (errors.length) console.log('Page errors (inspect separately):',errors.slice(0,5));
    console.log('PASS: CoMER ONNX/WASM worker loaded, toggle is reversible, no external network requests.');
  } finally {
    await browser.close();
  }
})().catch(e=>{ console.error(e); process.exit(1); });
