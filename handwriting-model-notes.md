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

The confirmation preview and final object call WhiteboardEquationFormatter.create,
the same parser and SVG renderer used by Equation. Font, decimal alignment,
currency preservation and vertical/long-division layouts therefore stay in sync.
The first release uses `window.WhiteboardMarqueeSelection` from the Beta marquee
script to read selected strokes. Without a selection, Beautify offers its own
temporary selection rectangle. The frozen bar-model scripts and production
whiteboard are unchanged.
