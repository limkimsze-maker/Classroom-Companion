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

  function recognizeCoMER(strokes, W, H) {
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
        currentWorker.postMessage({ id, input, mode: 'expression' });
      } catch (error) {
        if (pending?.id === id) {
          clearTimeout(pending.timer);
          pending = null;
        }
        reject(error);
      }
    });
  }

  // Reuse the existing Beautify panel, its confirmation and Undo semantics.
  // The recognizer calls this reader only for the explicit Math formulas mode.
  window.WhiteboardMathReader = Object.freeze({
    recognize(strokes, W, H, options = {}) {
      if (!enabled) return previous.recognize(strokes, W, H, options);
      return recognizeCoMER(strokes, W, H);
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