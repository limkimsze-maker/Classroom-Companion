# Local mathematical handwriting

Pretrained model: [m4jkiuwr/htt-mini](https://huggingface.co/m4jkiuwr/htt-mini),
revision `58170cc16748a5652e5e58caf93019fb8b0603c4`. The model card declares MIT.
The encoder and decoder are already quantized by the original authors.
The supplied vocabulary contains 258 entries, including four special tokens.

Feature extraction and cached autoregressive decoding are adapted from
[Hand-to-TeX](https://github.com/Projekt-Deep-Learning-2026/hand-to-tex),
revision `cf27b992950eba3b1d3600bf18be44868d217917`, MIT; see
`HAND-TO-TEX-LICENSE`. The authors report training on MathWriting and additional
symbol examples. This release performs inference with their trained weights;
it does not claim a new training run or a benchmark accuracy for this app.

For ONNX Runtime 1.18 compatibility, two encoder ConvInteger weight tensors
and their zero points are shifted from signed int8 to unsigned uint8 by 128.
Their centered integer values are unchanged. No learned parameter is retrained.
Reproduce this with `scripts/prepare-handwriting-math-model.py`.

Inference uses ONNX Runtime Web 1.18.0, Microsoft, MIT; see
`ONNX-RUNTIME-LICENSE`. SIMD and baseline WASM binaries are supplied locally.
Mathematical SVG rendering uses MathJax 3.2.2 (Apache-2.0), supplied under
`vendor/mathjax/` with its license. Only base and AMS TeX packages are enabled;
SVG uses local path definitions and does not request web fonts or extensions.

Only the explicitly selected ink is read. Model files are fetched from this
site inside a dedicated worker, with an allowlist for GET requests and no
upload body. Workers terminate on completion, Cancel, mode change or timeout.
The main document retains its original network-blocking CSP and local guard.
Math recognition is selected with Read → Math formulas. Ordinary letter and
digit recognition remains available separately. Units such as cm2, cm²,
m³, 250 mL, 3.5 kg and m/s² can be corrected or inserted in the review.
No numerical unit conversion is performed.

The decoder may confuse individual symbols, limits or multi-level structures.
Its token probabilities are not calibrated accuracy estimates. Preview and
confirmation remain mandatory. Math corrections are not stored as individual
letter training examples, because expression-to-stroke alignment is unknown.
This is broad mathematical support, not a claim to recognise every possible
symbol or to have world-leading accuracy. Unsupported or invalid notation
leaves the original ink intact and can be corrected manually.

`manifest.json` records SHA-256 hashes and sizes of the shipped assets.
