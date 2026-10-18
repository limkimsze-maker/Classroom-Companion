/* Adapter preserving the original ink-on Vue demo recognition pipeline.
   This file is copied into the pinned upstream repository and bundled there,
   importing its ORIGINAL preprocessing, vocabulary, repair and validation code.
   The surrounding whiteboard uses its existing Beautify confirmation UI. */
import katex from 'katex';
import {
  preprocessStrokes, isStrokeMeaningful, loadVocab, decodeToTokenArray,
  repairLatex, isCompleteExpression
} from './src/core/index';

const ROOT = 'vendor/inkon-original/';
const IDLE_MS = 1200; // Original Vue canvas debounce; not used for explicit Beautify requests.
const MAX_DECODE_STEPS = 50;
let worker = null, vocab = null, loading = null, job = null, serial = 0;
const uri = name => new URL(ROOT + name, document.baseURI).href;

function isKaTeXValid(latex) {
  if (!latex.trim()) return false;
  try {
    katex.renderToString(latex, {throwOnError: true});
    return true;
  } catch {return false}
}

// Faithfully taken from upstream src/App.vue selectBestCandidate.
function selectBestCandidate(candidates, mode) {
  for (const c of candidates) {
    const tokens = decodeToTokenArray(c.ids, vocab);
    const repaired = repairLatex(tokens);
    const latex = repaired.join(' ');
    if (mode === 'auto' && !isCompleteExpression(repaired)) continue;
    if (isKaTeXValid(latex)) return {latex,tokenIds:c.ids};
  }
  if (candidates.length > 0) {
    const tokens = decodeToTokenArray(candidates[0].ids,vocab);
    const repaired = repairLatex(tokens);
    const latex = repaired.join(' ');
    if (isKaTeXValid(latex)) return {latex,tokenIds:candidates[0].ids};
  }
  return {latex:'',tokenIds:[]};
}
const abortError = () => Object.assign(new Error('Reading cancelled'),{name:'AbortError'});

function cancel() {
  serial++;
  if (job) {
    clearTimeout(job.timer);
    job.reject(abortError());
    job=null;
  }
  if (worker) worker.terminate();
  worker=null;
  loading=null;
}
async function init() {
  if (worker && vocab && !loading) return;
  if (loading) return loading;
  loading = (async () => {
    vocab = await loadVocab(uri('models/comer/vocab.json'));
    const w = new Worker(uri('inference.worker.js'));
    worker = w;
    await new Promise((resolve,reject) => {
      const timer=setTimeout(()=>reject(new Error('ink-on model initialization timed out.')),90000);
      w.onmessage=e=>{
        const m=e.data||{};
        if (m.type==='init-done'){clearTimeout(timer);resolve()}
        else if(m.type==='init-error'){clearTimeout(timer);reject(new Error(String(m.error)))}
      };
      w.onerror=e=>{clearTimeout(timer);reject(new Error('ink-on demo worker could not start.'))};
      w.postMessage({
        type:'init',
        encoderUrl:uri('models/comer/encoder_int8.onnx'),
        decoderUrl:uri('models/comer/decoder_int8.onnx'),
        executionProvider:'wasm'
      });
    });
  })();
  try {await loading;loading=null}
  catch(error) {worker?.terminate();worker=null;loading=null;throw error}
}
function adaptWhiteboardStrokes(strokes,W,H) {
  if (!Array.isArray(strokes)||strokes.length===0||strokes.length>180) {
    throw new Error('Select a shorter handwritten mathematical expression.');
  }
  let pointsCount=0;
  return strokes.map(s=>{
    if (!Array.isArray(s.points)||s.points.length===0) throw new Error('Invalid handwriting.');
    return {
      lineWidth:Math.max(1,Math.min(24,Number(s.size)||3)),
      points:s.points.map(p=>{
        if (!Number.isFinite(p.x)||!Number.isFinite(p.y)||++pointsCount>16000) {
          throw new Error('Invalid or excessively long handwriting.');
        }
        return {x:p.x*W,y:p.y*H};
      })
    };
  });
}
async function recognize(strokes,W,H,options={}) {
  if (job||loading) cancel();
  const ticket=++serial;
  const adapted=adaptWhiteboardStrokes(strokes,W,H);
  if (!isStrokeMeaningful(adapted)) throw new Error('Draw a clearer mathematical expression.');
  const input=preprocessStrokes(adapted); // Unmodified upstream preprocessing
  await init();
  if (ticket!==serial) throw abortError();
  const cores=navigator.hardwareConcurrency||2;
  const mem=navigator.deviceMemory||4;
  const beamWidth=mem<=2||cores<=2?1:cores<=4?2:3; // Unmodified demo settings
  // Math formulas mode intentionally uses upstream Auto as its default.
  const mode='auto';
  return await new Promise((resolve,reject)=>{
    const id=ticket;
    const timeout=setTimeout(()=>{
      if (job?.id!==id) return;
      cancel();
      reject(new Error('ink-on reading timed out. You can correct the formula manually.'));
    },120000);
    job={id,reject,timer:timeout};
    worker.onmessage=e=>{
      const m=e.data||{};
      if (!job||job.id!==id||ticket!==serial||m.id!==id)return;
      if(m.type!=='recognize-done'&&m.type!=='recognize-error')return;
      clearTimeout(job.timer);job=null;
      if(m.type==='recognize-error'){reject(new Error(String(m.error)));return}
      try {
        const selected=selectBestCandidate(m.candidates||[],mode);
        if(!selected.latex) {
          reject(new Error('No valid mathematical expression was recognised. Correct the text manually.'));
          return;
        }
        resolve({
          text:selected.latex,tokens:[],uncertain:[{score:0}],
          engine:'inkon-original-demo',format:'latex',
          durationMs:m.totalMs
        });
      } catch(e){reject(e)}
    };
    worker.onerror=()=>{if (job?.id===id){cancel();reject(new Error('ink-on worker failed.'))}};
    worker.postMessage({
      type:'recognize',id,
      tensor:input.tensor,mask:input.mask,
      height:input.height,width:input.width,
      maskHeight:input.maskHeight,maskWidth:input.maskWidth,
      vocabSize:vocab.vocab_size,
      sos:vocab.special_tokens.sos,
      eos:vocab.special_tokens.eos,
      beamWidth,maxSteps:MAX_DECODE_STEPS,mode
    });
  });
}
window.WhiteboardInkOnOriginalDemo=Object.freeze({recognize,cancel});
