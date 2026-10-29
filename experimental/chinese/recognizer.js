/* Adapter for the pinned PaddleOCR.js 0.4.2 worker transport. */
(function () {
  'use strict';
  if (!window.__CC_CHINESE_TRIAL__ && !window.__CC_CHINESE_ALPHA__) return;
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
  // A detector can return a confident radical or punctuation mark while
  // missing the rest of a handwritten line. A nonempty result is not proof
  // that the selected ink was read. Check coverage against the actual pixels.
  function inkMap(canvas) {
    const w = canvas.width, h = canvas.height;
    const pixels = canvas.getContext('2d').getImageData(0, 0, w, h).data;
    const rows = new Uint32Array(h), points = [];
    let left = w, top = h, right = -1, bottom = -1;
    for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) {
      const i = (y * w + x) * 4;
      if (pixels[i + 3] < 128 || pixels[i] + pixels[i + 1] + pixels[i + 2] > 480) continue;
      points.push([x, y]); rows[y]++;
      left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y);
    }
    return { points, rows, left, top, right: right + 2, bottom: bottom + 2 };
  }
  function coverage(ink, items) {
    if (!ink.points.length) return 1;
    const boxes = items.map(item => {
      const poly = item.poly || [], xs = poly.map(p => p[0]), ys = poly.map(p => p[1]);
      return { l: Math.min(...xs) - 3, r: Math.max(...xs) + 3, t: Math.min(...ys) - 3, b: Math.max(...ys) + 3 };
    });
    return ink.points.filter(([x, y]) => boxes.some(b => x >= b.l && x <= b.r && y >= b.t && y <= b.b)).length / ink.points.length;
  }
  function lineCrops(canvas, ink) {
    if (!ink.points.length) return [];
    const runs = [];
    for (let y = ink.top; y < ink.bottom; y += 2) {
      if (!ink.rows[y]) continue;
      const previous = runs.at(-1);
      if (previous && y - previous.bottom <= 10) previous.bottom = y + 2;
      else runs.push({ top: y, bottom: y + 2 });
    }
    // Thin horizontal strokes/radicals are not separate lines of writing.
    const bands = [];
    for (const row of runs) {
      const previous = bands.at(-1), height = row.bottom - row.top;
      if (previous && (height < 14 || previous.bottom - previous.top < 14 ||
          row.top - previous.bottom < Math.max(14, Math.min(height, previous.bottom - previous.top) * .3))) previous.bottom = row.bottom;
      else bands.push({ ...row });
    }
    if (bands.length > 12) return [];
    return bands.map(band => {
      const points = ink.points.filter(p => p[1] >= band.top && p[1] < band.bottom);
      let left = canvas.width, right = 0;
      for (const point of points) { left = Math.min(left, point[0]); right = Math.max(right, point[0] + 2); }
      const height = Math.max(2, band.bottom - band.top), width = Math.max(2, right - left);
      // Canonical line height avoids detector sensitivity to board zoom/DPI.
      const scale = Math.min(96 / height, 1600 / width), padding = 14;
      const crop = document.createElement('canvas');
      crop.width = Math.max(48, Math.ceil(width * scale) + padding * 2); crop.height = Math.ceil(height * scale) + padding * 2;
      const c = crop.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, crop.width, crop.height);
      c.drawImage(canvas, left, band.top, width, height, padding, padding, width * scale, height * scale);
      return { canvas: crop, band, left, right };
    });
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
        const detected = results[0]?.items || [], ink = inkMap(canvas);
        const covered = coverage(ink, detected);
        const weak = !detected.length || covered < .85 ||
          detected.some(item => !Number.isFinite(item.score) || item.score < .8) ||
          !/\p{Script=Han}/u.test(lines(detected));
        let items = detected, cropFallback = false;
        if (weak && ink.points.length) {
          const crops = lineCrops(canvas, ink), readings = [];
          for (const crop of crops) {
            const bitmap = await createImageBitmap(crop.canvas);
            const result = await request('recognize-crop', { sources: [{ kind: 'imageBitmap', imageBitmap: bitmap }] }, [bitmap], 45000);
            const reading = result[0]?.items?.[0];
            if (reading?.text?.trim()) readings.push({ text: reading.text, score: reading.score,
              poly: [[crop.left, crop.band.top], [crop.right, crop.band.top], [crop.right, crop.band.bottom], [crop.left, crop.band.bottom]] });
          }
          const average = list => list.reduce((sum, item) => sum + (Number(item.score) || 0), 0) / Math.max(1, list.length);
          // Prefer a full-line reading when the detector omitted ink; otherwise
          // require a stronger recognition score before replacing its output.
          if (readings.length && (!detected.length || covered < .85 || average(readings) > average(detected) + .03)) {
            items = readings; cropFallback = true;
          }
        }
        const text = this.simplify(lines(items));
        return { text, items, uncertain: cropFallback || covered < .85 || items.some(item => item.score < .85),
          metrics: { ...results[0]?.metrics, inkCoverage: covered, lineFallback: cropFallback } };
      });
      queue = task; return task;
    }
  };
})();
