/* Adapter for the pinned PaddleOCR.js 0.4.2 worker transport. */
(function () {
  'use strict';
  if (!window.__CC_CHINESE_TRIAL__) return;
  const base = new URL('./', document.currentScript.src);
  let worker = null, ready = null, sequence = 0, queue = Promise.resolve();
  const pending = new Map();
  const simplify = () => {
    const converter = window.OpenCC.Converter({ from: 't', to: 'cn' });
    return value => converter(String(value));
  };
  let convert;
  function reset(reason) {
    worker?.terminate(); worker = null; ready = null;
    for (const job of pending.values()) { clearTimeout(job.timer); job.reject(reason); }
    pending.clear();
  }
  function request(type, payload, transfer = [], timeout = 90000) {
    if (!worker) {
      worker = new Worker(new URL('vendor/paddle-worker-loader.js', base), { type: 'module' });
      worker.onmessage = ({ data }) => {
        if (data?.kind !== 'worker-transport-response') return;
        const job = pending.get(data.requestId);
        if (!job) return;
        pending.delete(data.requestId); clearTimeout(job.timer);
        if (data.status === 'success') job.resolve(data.payload);
        else job.reject(new Error(data.error?.message || '汉字识别失败。'));
      };
      worker.onerror = event => { event.preventDefault(); reset(new Error(event.message || '识别引擎无法启动。')); };
      worker.onmessageerror = () => reset(new Error('识别引擎返回了无法读取的结果。'));
    }
    const requestId = ++sequence;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reset(new Error('识别用时过长。原笔迹仍然保留，请重试或手动输入。')), timeout);
      pending.set(requestId, { resolve, reject, timer });
      try { worker.postMessage({ kind: 'worker-transport-request', requestId, type, payload }, transfer); }
      catch (error) { pending.delete(requestId); clearTimeout(timer); reject(error); }
    });
  }
  function load() {
    if (!ready) ready = request('init', { options: {
      pipelineConfig: {
        pipelineName: 'OCR', warnings: [], unsupportedFeatures: [],
        modelSelection: { textDetectionModelName: 'PP-OCRv5_mobile_det', textRecognitionModelName: 'PP-OCRv5_mobile_rec' },
        assets: { det: { url: new URL('models/PP-OCRv5_mobile_det.tar', base).href },
          rec: { url: new URL('models/PP-OCRv5_mobile_rec.tar', base).href } },
        runtimeDefaults: { text_det_limit_side_len: 960, text_det_limit_type: 'max', text_det_max_side_limit: 4000,
          text_det_thresh: .3, text_det_box_thresh: .6, text_det_unclip_ratio: 2, text_rec_score_thresh: 0 },
        pipelineBatchSize: 1, textDetectionBatchSize: 1, textRecognitionBatchSize: 1
      },
      ortOptions: { backend: 'wasm', numThreads: 1, proxy: false,
        wasmPaths: new URL('vendor/', base).href }
    }}).catch(error => { reset(error); throw error; });
    return ready;
  }
  function lines(items) {
    const rows = items.map(item => {
      const points = item.poly || [], xs = points.map(p => p[0]), ys = points.map(p => p[1]);
      return { text: item.text || '', score: item.score,
        x: Math.min(...xs), y: (Math.min(...ys) + Math.max(...ys)) / 2,
        h: Math.max(1, Math.max(...ys) - Math.min(...ys)) };
    }).filter(row => row.text.trim());
    rows.sort((a, b) => Math.abs(a.y - b.y) < Math.min(a.h, b.h) * .55 ? a.x - b.x : a.y - b.y);
    const output = [];
    for (const row of rows) {
      const previous = output.at(-1);
      if (previous && Math.abs(row.y - previous.y) < Math.min(row.h, previous.h) * .55) previous.text += row.text;
      else output.push({ ...row });
    }
    return output.map(row => row.text).join('\n');
  }
  window.CCChineseRecognizer = {
    load,
    simplify(value) { convert ||= simplify(); return convert(value); },
    recognize(canvas) {
      const task = queue.catch(() => {}).then(async () => {
        await load();
        const bitmap = await createImageBitmap(canvas);
        let results = await request('predict', { sources: [{ kind: 'imageBitmap', imageBitmap: bitmap }],
          params: { textDetLimitSideLen: 1280, textRecScoreThresh: 0 } }, [bitmap], 45000);
        let cropFallback = false;
        // A line detector can miss a single isolated character. Read the selected
        // crop directly with the same recognition model in that case.
        if (!results[0]?.items?.length) {
          const crop = await createImageBitmap(canvas);
          results = await request('recognize-crop', { sources: [{ kind: 'imageBitmap', imageBitmap: crop }] }, [crop], 45000);
          cropFallback = true;
        }
        const items = results[0]?.items || [];
        return { text: this.simplify(lines(items)), items,
          uncertain: cropFallback || items.some(item => item.score < .85), metrics: results[0]?.metrics };
      });
      queue = task; return task;
    }
  };
})();
