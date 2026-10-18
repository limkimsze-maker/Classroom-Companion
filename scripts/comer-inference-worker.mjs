/* Bundled into vendor/comer/comer-worker.js by scripts/build-comer-vendor.sh.
   Inference executes entirely inside a same-origin Web Worker. */
import * as ort from 'onnxruntime-web';
import { InferenceEngine, preprocessStrokes, isStrokeMeaningful, loadVocab } from 'ink-on/core';

ort.env.wasm.numThreads = 1; // GitHub Pages normally has no COOP/COEP shared-memory headers.
ort.env.wasm.simd = true;
ort.env.wasm.wasmPaths = new URL('./', self.location.href).href;

let enginePromise = null;
let vocabPromise = null;

function getEngine() {
  if (!enginePromise) {
    enginePromise = (async () => {
      const engine = new InferenceEngine({
        encoderUrl: new URL('./encoder_int8.onnx', self.location.href).href,
        decoderUrl: new URL('./decoder_int8.onnx', self.location.href).href,
        executionProvider: 'wasm',
        beamWidth: 2,
        maxDecodeSteps: 65
      });
      await engine.init();
      return engine;
    })().catch(error => { enginePromise = null; throw error; });
  }
  return enginePromise;
}

function getVocab() {
  if (!vocabPromise) {
    vocabPromise = loadVocab(new URL('./vocab.json', self.location.href).href)
      .catch(error => { vocabPromise = null; throw error; });
  }
  return vocabPromise;
}

self.onmessage = async ({ data }) => {
  const { id, strokes, mode } = data || {};
  if (!Number.isSafeInteger(id)) return;
  try {
    if (!isStrokeMeaningful(strokes)) {
      throw new Error('Draw a mathematical expression with several clear pen points.');
    }
    const [engine, vocab] = await Promise.all([getEngine(), getVocab()]);
    const result = await engine.recognize(
      preprocessStrokes(strokes),
      vocab,
      mode === 'number' ? 'number' : 'expression'
    );
    self.postMessage({ id, latex: result.latex, totalMs: result.totalMs });
  } catch (error) {
    self.postMessage({ id, error: error?.message || 'CoMER recognition failed' });
  }
};