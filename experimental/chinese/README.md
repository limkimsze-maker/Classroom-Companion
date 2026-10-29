# Simplified Chinese whiteboard trial

Entry point: `../../whiteboard-chinese-trial.html`. This separate page copies the
current Alpha shell at commit `2dfaf0b679dd5004cc82370a14cd8dd484a003c3`.
Lim Kim Sze confirmed promotion on 29 October 2026. Alpha now loads this
handwriting feature only at `whiteboard-smart-beta.html?edition=zh`, through
`alpha-integration.js`. English and other editions do not load the feature.
The separate trial remains available with its own storage namespace.

The Alpha integration preserves its original editor, toolbar, speech-to-text,
document tools and saved-data handling. Chinese replacements use Alpha's
existing handwriting edit history for one-step Undo. The Alpha stylesheet
styles only the new Chinese handwriting button, picker and review dialog.

Write in Pen, press **美化汉字**, enclose complete characters, check the editable
recognition result and press **应用到白板**. Cancel retains the ink. Apply creates
an editable text object in the same location. Undo restores the original strokes.
Point and Select work with the new text object; double-click changes text, or
select it and press 美化汉字 to reopen the Chinese appearance controls.
The existing mathematical recognition remains available separately.

## Isolation

The bootstrap uses the prefix `cc-chinese-trial-v1:` for localStorage,
sessionStorage and IndexedDB names, without reading Alpha's data. The original
JavaScript files remain read-only dependencies. Four presentation/editor scripts
are copied here so the Chinese text insertion can use the editor's native Undo
history without modifying the shared editor or toolbar.

## Local recognition and appearance

All model, runtime, dictionary and font assets are served from this repository.
Selected ink is rasterised in memory and processed in a local Web Worker. The
page allows only same-origin resource GET/HEAD requests; no recognition service
or API key is used. Initial downloads total roughly 63 MiB. Larger binary assets
are stored in parts and reassembled in memory by the worker loader. Model accuracy and
performance need evaluation on real teacher handwriting, especially joined
characters, isolated characters and mixed Chinese/English text.

* PaddleOCR.js **0.4.2**, pinned official worker, minified with esbuild 0.25.12;
  Apache-2.0. A `recognize-crop` message adds direct recognition of a selected
  crop when the line detector misses an isolated character. The transport adapter
  follows the published worker's request/response protocol.
* **PP-OCRv5_mobile_det** and **PP-OCRv5_mobile_rec**, official ONNX inference
  archives from `paddle-model-ecology.bj.bcebos.com/paddlex/official_inference_model/paddle3.0.0/`;
  Apache-2.0. Single-thread WASM avoids requiring cross-origin isolation headers.
* ONNX Runtime Web **1.24.3** matching the prebuilt worker; MIT. Its JSEP SIMD
  WASM module and loader are included, with CPU WASM inference selected. The worker also contains OpenCV.js
  and helper libraries distributed by PaddleOCR.js; copyright notices retained.
* OpenCC-js **1.0.5**, traditional-to-Simplified Chinese dictionary; MIT. It
  normalises script only; it does not rewrite grammar or supply missing words.
* **LXGW WenKai GB Regular**, from `lxgw/LxgwWenKaiGB`, converted from TTF to WOFF2
  with fontTools, without editing glyphs; SIL OFL 1.1. Font licence is in `fonts`.
  This is a handwriting-style font, not a claim of Singapore textbook approval.

Preserve the included licence files when redistributing. The visible trial label
must remain until the handwriting results have been reviewed.
