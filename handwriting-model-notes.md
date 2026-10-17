# Beta handwriting recognition

The Beautify action recognises separately written digits 0–9, decimal points,
dollar signs, and + − × ÷ =. It always opens an editable confirmation before
replacing ink. Cancel preserves the original writing; Undo restores the complete
pre-conversion board. Connected handwriting, unusual digit shapes, and overlapping
characters can require correction. This is a first version for numbers and math,
not a general handwriting-to-words recognizer.

All recognition runs locally in JavaScript. The app loads its bundled model as a
same-origin script. It does not upload handwriting, request a third-party OCR
service, require the browser's experimental handwriting API, use `eval`, or relax
the MOE Safe Mode network policy.

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

The confirmation preview and final object call WhiteboardEquationFormatter.createInline,
using the Equation parser and font. Beautify always keeps the writing horizontal
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
letters A–Z / a–z on this browser and device. Letters have no bundled general
alphabet model: correct a new letter's first reading and Apply to teach its shape.
Subsequent recognition uses sufficiently similar personal examples alongside the
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
