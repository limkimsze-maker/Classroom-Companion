# Beta handwriting recognition

## Unit-first repair — 19 October 2026

The experimental `whiteboard-comer-beta.html` loads build
`20261019-unitfirst-v2`. It compares complete trained area/volume unit suffixes
before reading the numeric prefix. Competing suffix boundaries are ranked before
any digits are consumed. Small finishing strokes belong to the unit body, and
multi-stroke superscripts use the complete unit prediction rather than the
single-stroke exponent classifier. Closed oval zero recovery remains active in
the isolated numeric prefix.

The seven area/volume labels use 56 quantized 16×16 centroids derived from 152
of the existing 1,024 labelled teacher examples, grouped by actual stroke count.
The other unit/operator scores retain their existing model. Rebuild these
centroids with `node scripts/build-teacher-units.cjs /path/to/training.json`.
Only compact features are bundled; the original teacher traces are not included.
UJI Pen Characters V1 remains integrated; V2 has not been added.

Validation: all four supplied diagnostic exports replay as `10 m³`, including
the earlier `15 m?` result. All 152 area/volume training examples composed with
the diagnostic numeric prefix produce the expected quantity and unit. These
reuse training examples and are regression checks, not held-out accuracy.
Synthetic controls cover small body finishing strokes, two-stroke powers,
competing suffix boundaries, square/cube ambiguity and closed-zero recovery.
All 872 non-area training examples retain their previous per-label scores.
The broader synthetic suite remains 35/36 and the UJI composite suite remains
76/132, with no before/after changed outcomes. The pre-existing slanted `97 ml`
failure and other broad recognition limitations remain. Validation used the
actual local JavaScript models; a browser interaction pass was not available.

The Beautify action recognises separately written Latin letters, digits 0–9,
decimal points, dollar signs, and + − × ÷ =. It always opens an editable confirmation before
replacing ink. Cancel preserves the original writing; Undo restores the complete
pre-conversion board. Connected handwriting, unusual digit shapes, and overlapping
characters can require correction. Words with separated letters are supported;
connected/cursive word recognition is outside this character-based recognizer.

All recognition runs locally in JavaScript. The app loads its bundled model as a
same-origin script. It does not upload handwriting, request a third-party OCR
service, require the browser's experimental handwriting API, use `eval`, or relax
the MOE Safe Mode network policy.

## Pretrained letter and mixed-character models

The Beta bundles two licensed pretrained EMNIST CNNs. Letters no longer depend on
personal examples. The models are downloaded at build time and converted to
per-output-channel signed int8 weights with floating biases. Batch normalization
is folded into preceding linear convolutions where valid; normalization after
ReLU remains a separate affine operation. Neither Keras nor ONNX is executed in
the browser. The two model payloads total approximately 1 MB of JavaScript.

Sources and attribution:

- [EMNIST dataset, NIST](https://www.nist.gov/itl/products-and-services/emnist-dataset),
  Cohen, Afshar, Tapson and van Schaik, "EMNIST: an extension of MNIST to handwritten letters" (2017).
- Radu Dogaru and Ioana Dogaru, [NL-CNN](https://github.com/radu-dogaru/NL-CNN-a-compact-fast-trainable-convolutional-neural-net),
  checkpoint `nlcnn_emnist_90_45.h5`, 47 EMNIST classes including digits and letters.
  MIT notice: `vendor/handwriting/NL-CNN-LICENSE.txt`.
- Hannah How, [Handwritten Letter Recognition with CNNs](https://github.com/c0smo-55/emnist-cnn-letter-classifier),
  checkpoint `models/improved_model_best.h5`, 26 letter classes. Its documented
  training augmentation includes rotation, shift and zoom variations.
  MIT notice: `vendor/handwriting/LETTERS-CNN-LICENSE.txt`.

The converter `scripts/build-handwriting-cnn-models.py` checks the downloaded
checkpoint SHA-256 hashes before converting them:

| Checkpoint filename passed to converter | SHA-256 |
| --- | --- |
| nlcnn-emnist.h5 | 05aec3037fbedceedddf5dcac722ecd4dfe9f2fb15bc2f71f664ed0ca2644d44 |
| letters-cnn.h5 | 11a41fe3e7d25463559645c0e9a6e10b498c536e92388fca113f5c759b148f61 |

Validation used the official EMNIST ByClass test IDX files, mirrored at
`Royc30ne/emnist-byclass`, revision `cb159e07d5b743e2579859e6f890671b35ce5ad6`.
The image archive SHA-256 is
`5ec835bd5d5b1a66378a132e727fef20fe994b3cc666899befcca5ac766f50cd`;
the label archive SHA-256 is
`501e305eeeacb093b162592d80e8a2632040872360fa6d85cfcb2200d91ca92a`.
EMNIST IDX images are transposed to upright orientation before evaluation.

The converted mixed model correctly classified 105,295 / 116,323 test characters
(90.52%, ignoring letter case). The dedicated letter model correctly classified
55,391 / 58,405 test letters (94.84%, ignoring case). These tests used the converted
quantized weights. Separate JavaScript inference checks classified 246 / 260
sampled test letters correctly. Direct whiteboard-stroke fixtures passed 72 / 72
size, position, slant, and pen-thickness variants. Benchmark figures concern
isolated characters, not whole-word, segmentation, or individual-user accuracy.

The review offers Auto, Letters a–z, Letters A–Z, and Numbers. The dedicated letter
model folds letter case, so explicit letter modes set the desired output case.
Auto uses the mixed model, switches to the letter model for clear text selections,
and retains mathematical operators; Numbers uses the original digit model.
Similar shapes such as I/l, O/0 and x/× can still require review or a reading mode.
Low-confidence glyphs get a second, slightly resized/thickened inference view.
Character spacing is used to retain word gaps without rearranging the writing.

CNN recognition runs in a same-origin Worker, with progress and immediate
cancellation. If Workers are unavailable, a local fallback yields between glyphs.
Cancel, closing a review and switching reading modes invalidate older jobs;
outdated predictions cannot overwrite edits. Apply waits for the active read.
Personal examples remain local and retain priority; mode selection can override
digit-versus-letter interpretation without deleting those examples.

## Digit model

The bundled model was trained on the 60,000-image MNIST training split. Source:
[MNIST via Keras](https://keras.io/api/datasets/mnist/), credited to Yann LeCun,
Corinna Cortes and Christopher J. C. Burges. Build-time data archive:
https://storage.googleapis.com/tensorflow/tf-keras-datasets/mnist.npz

The model is a 784 → 96 ReLU → 10 network trained with scikit-learn's
MLPClassifier, seed 181026, learning rate 0.002, batch size 256, alpha 0.0001,
maximum 24 epochs, 10% training validation split and early stopping. Weights are
quantized independently per layer to signed 8-bit integers; biases remain floats.
The shipped model is about 103 KB and uses no runtime ML library.

The quantized model classified 97.71% of the separate official 10,000-image MNIST
test split correctly. JavaScript inference independently passed 978 of 1,000
images sampled from that test split. These are isolated-digit benchmarks, not a
claim about equation accuracy or a particular user's handwriting. Stroke grouping,
currency and operator handling are separate geometry steps. Hand-drawn vector
equation fixtures exercise those steps, including money, decimals, multiplication
and division. Every prediction remains subject to user review.

## Formatting and integration

The confirmation preview and final object call WhiteboardEquationFormatter.createHandwriting,
using the Equation parser, renderer and font. Individual symbols such as +, −, ×,
÷, =, $, decimal points and brackets are accepted as handwriting without requiring
a complete equation. The typed Equation action retains its equation validation.
Standalone = and ÷ use their horizontal stroke width to group their marks when
no digit is selected; a single dot is read as a decimal point. Beautify always keeps the writing horizontal
in the original selected ink area, preserving its position and dimensions instead
of rearranging it into vertical or long-division working. Currency, decimal places
and a trailing equals sign are retained. The transparent SVG fits the visible
glyph bounds to the writing area without an extra margin or white background.
The first release uses `window.WhiteboardMarqueeSelection` from the Beta marquee
script to read selected strokes. Without a selection, Beautify offers its own
temporary selection rectangle. The frozen bar-model scripts and production
whiteboard are unchanged.

## Learning from confirmed corrections

Apply beautify quietly saves normalized examples of confirmed digits and Latin
letters A–Z / a–z on this browser and device. Subsequent recognition uses
sufficiently similar personal examples alongside the pretrained CNNs and
unchanged digit model. Uppercase/lowercase and lookalikes such as O/0, l/1 and x/×
still need review. This is for separately written characters and math expressions,
not cursive word recognition. Dots above narrow i/j stems are grouped with them.

Only confirmed Apply actions teach the system; opening a review, typing, Cancel,
invalid text and stale selections do not. Learning requires a one-to-one alignment
of character groups and corrected characters (an optional final = is ignored).
Insertions/deletions and changed separator symbols skip learning rather than
assigning uncertain labels. Matching uses centered, downsampled character rasters;
distant shapes and closely conflicting labels fall back to normal recognition.

The versioned localStorage record holds only character labels and 14×14 quantized
shape features, at most 360 examples and 18 per character. No original strokes,
full equations or board images are saved for learning or uploaded. Refreshing the
same browser retains examples; clearing site data removes them. Blocked/full storage
falls back to this session's memory, with an accurate confirmation message. Undo
restores the ink and removes that Apply's new examples, preserving prior examples
and changes from another tab. The large bundled model is never retrained.

The review has a compact Colour dropdown, initially using the selected ink colour.
The preview and applied transparent SVG use the chosen colour while retaining the
Equation font and original writing bounds. Colour changes do not affect learning.

## Whole-expression mathematics and units — 18 October 2026

Beautify now offers an explicit Math formulas reading mode using the existing
MIT-licensed htt-mini MathWriting model. This replaces isolated-character
segmentation for mathematical layouts, preserving fraction bars, scripts, roots,
integrals and other structures in the recognition output. It does not evaluate
or rearrange an expression into vertical working. The math SVG fits the exact
selected ink rectangle and supports the existing colour dropdown and Undo.

Ordinary text and unit quantities retain the Equation font. cm2/cm^2/cm²,
mm²/m²/km², cubic units, mass, capacity, time, temperature and compound units
are supported as display notation; values are never converted automatically.
The Insert menu offers correction templates and common units.

Source revisions, licenses, asset hashes, compatibility conversion and limits
are recorded in `vendor/handwriting/math/NOTICE.md` and its manifest.

Validation uses the actual ONNX WebAssembly runtime in worker threads and
MathJax 3.2.2 rendering. Fraction 1/2, x² and √2 stroke fixtures read correctly;
a drawn integral is also identified. The compact model can still misread
individual letters/digits: on illustrative fixtures 2+3 read as 2+2 and a+b=c
as 0+b=c, so the previous character reader remains the default for ordinary
writing and every math reading requires preview and confirmation. No broad
accuracy rate or world-leading performance is claimed for this integration.
DOM/event integration tests cover selection, actual worker completion, units,
font, colour, cancellation, manual corrections and Undo. All five frozen bar
model systems retain their original code and pass their existing checks.
A live browser visual pass was not available in this environment.
