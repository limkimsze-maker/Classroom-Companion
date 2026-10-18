# Primary Mathematics handwriting recognition — Beta benchmark

**Date:** 18 October 2026
**Scope:** Free browser-local recognition of teachers' handwriting for Singapore P1–P6 mathematics.

## What is shipped

- A reusable primary-school measurement-unit decoder combining pretrained numeral and alphabet models.
- A high-confidence numeral/arithmetic grammar so mathematical digits are not unnecessarily replaced by letters.
- Existing stacked fractions, raised units, mathematical-expression worker, handwritten letter model, local correction memory, preview, and Undo remain available as fallbacks or independent modes.
- No new neural-network training has occurred in this revision. No private pen strokes are uploaded.

## Synthetic regression test

Source: `scripts/handwriting-primary-regression-beta.js`.

Nine hand-authored ink examples were tested under four fixed affine transforms each (unchanged, smaller, larger with negative slant, and positive slant), using the actual bundled JavaScript digit and letter inference models.

| Revision | Exact whole-reading matches |
| --- | --- |
| Beta before general grammar (commit `176d85e8ccc0a6f54a09bf007ff578d48d507e48`) | 16 / 36 |
| New primary grammar + digit/arithmetic context | 35 / 36 |

In the first general-grammar revision, 19 changed from failing to passing, none regressed, and positive-slant `97 ×` remained wrong. In the subsequent slanted-cross geometry fix, the same **36/36** synthetic cases passed, with no regressions in this limited test.

A separate UJI online-ink reader was then added as a *conservative second opinion*, not a replacement for MNIST/EMNIST. The synthetic suite also passed **36/36** with UJI. Removing UJI still yielded **36/36** on this suite: therefore these tests alone do **not** establish an additional accuracy gain from the UJI model. Independent unfamiliar-writer tests remain essential.

This is **not** a held-out adult-writer benchmark or a real-world accuracy estimate. These fixtures reuse the same few stroke shapes and affine perturbations and cannot establish an accuracy claim such as 99%. More authentic test samples are needed for handwriting generalization, digit/letter disambiguation, fractions, ratio, comparisons, geometry notation, and classroom latency.

## External labelled stroke datasets suitable for independent evaluation

- **UJI Pen Characters v2**, 11,640 digital-ink character samples from 60 writers, CC BY 4.0: https://archive.ics.uci.edu/dataset/177/uji+pen+characters+version+2. Credit: Prat, Castro, Llorens, Marzal and Vilar (2008), DOI 10.24432/C5FG8S. Verify writer-disjoint train/test split.
- **Google MathWriting**, online mathematical-expression ink: https://github.com/google-research/google-research/tree/master/mathwriting. Its dataset is CC BY-NC-SA 4.0. Review the conditions before using its samples for model training or redistributing resulting artefacts.
- **CROHME 2023**, InkML with trace and LaTeX ground truth: https://doi.org/10.5281/zenodo.8428035. Review use rights before incorporation.

The datasets **have not been downloaded, incorporated into model training, or evaluated** in this change. Access to an external archive in this execution environment was not successful. The bundled pretrained model licences are documented in `handwriting-model-notes.md` and `vendor/handwriting/math/NOTICE.md`.


## Additional independent pen-stroke model

Vendor files: `vendor/handwriting/uji/reader-beta.js`, `reader-weights-beta.js`, `NOTICE.md`, `LICENSE-APACHE-2.0.txt`.

- Adapted from Vahini Technologies / imu2text, Apache 2.0 licensed code, with attribution.
- Weights were already trained upstream on **UJI Pen Characters v2** (CC BY 4.0); Classroom Companion did **not** train these weights.
- Upstream reports **78.1%** exact case-sensitive isolated-character recognition across 62 classes on a writer-disjoint split (20 unseen writers); **89.6%** case-insensitive. These are *not* our full-expression scores.
- The added recogniser is used conservatively to corroborate a handwritten **digit** when the mixed alphabet model disagrees with the digit model. Its own output cannot automatically become an arbitrary formula or override an explicit teacher correction.
- Local, browser-only inference; approximately 90 KB model weights, plus inference JS.

## Next evaluation gate

Before claiming the system is generally reliable for adults, measure exact-expression accuracy, character/structure accuracy, false unit interpretations, and latency on writer-disjoint **real teacher pen strokes**. Keep the conserved GitHub recovery branch unchanged, and only deploy subsequent improvements after comparing against the frozen benchmark.
