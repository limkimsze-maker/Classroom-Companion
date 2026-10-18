/* Experimental CoMER adapter. Only loaded by whiteboard-comer-beta.html.
   Default remains the existing UJI V1 / local MathWriting reader.
   No stroke data leaves this browser. Apache-2.0 upstream ink-on library. */
(function () {
  'use strict';
  const previous = window.WhiteboardMathReader;
  if (!previous || !document.querySelector('.tools')) return;

  let enabled = false;
  let worker = null;
  let pending = null;
  let serial = 0;
  let operation = 0; // invalidates outstanding composite reads on Cancel or mode switch

  function abort(reason) {
    serial += 1;
    if (worker) worker.terminate();
    worker = null;
    if (pending) {
      clearTimeout(pending.timer);
      pending.reject(Object.assign(new Error(reason || 'Reading cancelled'), { name: 'AbortError' }));
      pending = null;
    }
  }

  function cancel() {
    operation++;
    abort('Reading cancelled');
    previous.cancel?.();
  }

  function prepare(strokes, W, H) {
    if (!Array.isArray(strokes) || strokes.length === 0 || strokes.length > 180) {
      throw new Error('Select a shorter handwritten expression.');
    }
    let pointCount = 0;
    return strokes.map(s => {
      if (!Array.isArray(s.points) || !s.points.length) {
        throw new Error('Invalid pen stroke.');
      }
      const points = s.points.map(p => {
        if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) {
          throw new Error('Invalid handwriting coordinates.');
        }
        pointCount += 1;
        return { x: p.x * W, y: p.y * H };
      });
      if (pointCount > 16000) throw new Error('Select fewer pen points.');
      return { points, lineWidth: Math.max(1, Math.min(24, Number(s.size) || 3)) };
    });
  }

  function recognizeCoMER(strokes, W, H, options = {}) {
    if (pending) abort('A newer handwriting read started');
    const id = ++serial;
    const raw = prepare(strokes, W, H);
    const prep = window.WhiteboardCoMERPreprocess;
    if (!prep?.preprocessStrokes || !prep?.isStrokeMeaningful) {
      return Promise.reject(new Error('CoMER preprocessor missing; refresh the experimental page.'));
    }
    if (!prep.isStrokeMeaningful(raw)) {
      return Promise.reject(new Error('Draw a clearer expression and select its strokes.'));
    }
    const input = prep.preprocessStrokes(raw);
    if (typeof Worker !== 'function') {
      return Promise.reject(new Error('CoMER requires browser Web Worker support.'));
    }
    return new Promise((resolve, reject) => {
      try {
        if (!worker) worker = new Worker('vendor/comer/comer-worker.js?v=20261018-lab1');
        const currentWorker = worker;
        const timer = setTimeout(() => {
          if (pending?.id !== id) return;
          abort('CoMER timed out');
          reject(new Error('CoMER took too long. Switch it off to use the existing local reader.'));
        }, 120000);
        pending = { id, resolve, reject, timer };
        currentWorker.onmessage = event => {
          const message = event.data || {};
          if (!pending || pending.id !== id || message.id !== id) return;
          clearTimeout(pending.timer);
          pending = null;
          if (message.error) {
            reject(new Error(String(message.error)));
          } else if (typeof message.latex === 'string' && message.latex.trim()) {
            resolve({ text: message.latex, tokens: [], uncertain: [{ score: 0 }],
              engine: 'local-comer-experimental', format: 'latex', durationMs: message.totalMs });
          } else {
            reject(new Error('CoMER returned no mathematical expression. Check the selection or switch CoMER off.'));
          }
        };
        currentWorker.onerror = () => {
          if (!pending || pending.id !== id) return;
          abort('CoMER worker failed');
          reject(new Error('CoMER assets may be missing. Use the existing Math formulas reader or complete the local asset setup.'));
        };
        currentWorker.postMessage({ id, input, mode: options.comerMode === 'number' ? 'number' : 'expression' });
      } catch (error) {
        if (pending?.id === id) {
          clearTimeout(pending.timer);
          pending = null;
        }
        reject(error);
      }
    });
  }


  const cancelled = () => Object.assign(new Error('Reading cancelled'), { name: 'AbortError' });
  // For a quantity, preserve the model's complete result if it is already well-formed.
  // Otherwise try a small number of geometry-derived number/unit partitions,
  // asking CoMER to read BOTH parts rather than substituting a guessed label.
  async function recognizeWithMeasurements(strokes, W, H, options = {}) {
    const ticket = ++operation;
    const grammar = window.WhiteboardCoMERQuantity;
    const check = () => { if (!enabled || ticket !== operation) throw cancelled(); };
    const full = await recognizeCoMER(strokes, W, H, options).catch(error => {
      if (error.name === 'AbortError') throw error;
      return {text:'', error:error.message};
    });
    check();
    if (!grammar) {
      if (full.text) return full;
      throw new Error(full.error || 'CoMER measurement grammar is unavailable.');
    }
    const good = grammar.whole(full.text || '');
    if (good) {
      return {...full, text: good.text, engine:'local-comer-quantity'};
    }
    const candidates = grammar.splitCandidates(strokes);
    // This is conservative: if the script is a full equation such as 2+3,
    // do not accept a coincidental guessed unit without clear number/unit spacing.
    for (const partition of candidates.slice(0, 4)) {
      check();
      try {
        const number = await recognizeCoMER(partition.prefix, W, H, {...options,comerMode:'number'});
        check();
        const value = grammar.numeric(number.text);
        if (!value) continue;
        const unit = await recognizeCoMER(partition.suffix, W, H, {...options,comerMode:'expression'});
        check();
        const joined = grammar.combine(value, unit.text);
        if (joined) {
          return {text:joined.text,tokens:[],uncertain:[{score:0}],
            engine:'local-comer-quantity-split',format:'unit',
            components:{number:value, unit:unit.text}};
        }
      } catch (error) {
        check();
        if (error.name === 'AbortError') throw error;
      }
    }
    if (full.text) return full;
    throw new Error(full.error || 'CoMER could not read this measurement. Correct the text in the preview.');
  }

  // Reuse the existing Beautify panel, its confirmation and Undo semantics.
  // The recognizer calls this reader only for the explicit Math formulas mode.
  window.WhiteboardMathReader = Object.freeze({
    recognize(strokes, W, H, options = {}) {
      if (!enabled) return previous.recognize(strokes, W, H, options);
      return recognizeWithMeasurements(strokes, W, H, options);
    },
    cancel,
    traces: previous.traces
  });

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn';
  button.id = 'comerExperimentalToggle';
  button.setAttribute('aria-pressed', 'false');
  button.title = 'Experimental whole-expression reader, only in Math formulas mode. Default V1 reader remains available.';
  function update() {
    button.textContent = enabled ? '🧠 CoMER: ON' : '🧠 CoMER: OFF';
    button.classList.toggle('active', enabled);
    button.setAttribute('aria-pressed', String(enabled));
  }
  button.addEventListener('click', () => {
    cancel();
    enabled = !enabled;
    update();
    if (typeof say === 'function') {
      say(enabled ? 'CoMER enabled for Math formulas. Check every result before applying.' :
        'CoMER disabled. Original handwriting recognition restored.');
    }
  });
  document.querySelector('.tools').insertBefore(button, document.getElementById('undoBtn'));
  update();
})();