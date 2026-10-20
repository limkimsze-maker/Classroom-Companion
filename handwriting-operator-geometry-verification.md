# Natural-ink operator geometry repair — 20 October 2026

Build: `20261020-operator-geometry1`. Previous production build: `20261020-priority5-audit1` at `db4ee6dc968eac7e217bc648d28c32e333cd47d8`.

## Natural whole-expression replay

The original blind teacher batch scored **17/24 (70.83%)** with the frozen Priority 5 reader. That baseline remains unchanged. After inspecting the failures and developing this fix, the same original pen traces score **22/24 (91.67%)** with the candidate reader, with zero correct-to-wrong regressions. This is a development replay on one writer's inspected batch, not a new independent accuracy estimate.

| Category | Original frozen baseline | Current development replay |
| --- | ---: | ---: |
| Numbers | 4/4 | 4/4 |
| Arithmetic | 2/6 | 6/6 |
| Ordinary measurements | 6/6 | 6/6 |
| Powered expressions | 5/6 | 6/6 |
| Stacked fractions | 0/2 | 0/2 |

Five readings improve: `24+38=62`, `16×4=64`, `6−2=5`, `9+7=15`, and `8+6=14m²`. Recovering the operators lets the existing numeral/unit/context paths finish their work. Written false equations remain false in recognition; no arithmetic solver is used for this comparison.

Seven readings remain flagged, including two corrected expressions with weak character evidence. The two remaining errors are fractions: 3/4 is read as 1/4 without a flag, and 12/5 is read as inline characters with a flag. Fraction recognition was not changed in this round.

The original teacher export was replayed locally. Its strokes and identifying metadata are not included in this repository. The frozen collection page and reader bundle retain their original protocol and score. Its Whiteboard link points to the updated production page.

## General rules

The strict original line classifier remains in place for existing digits, unit strokes and character geometry. A separate operator stroke check tolerates limited curvature/retracing only when its chord spans at least 82% of the stroke's extent, path/chord ratio is at most 1.50, and ink stays in a narrow corridor.

Crossed strokes must intersect through the interior of both chords. The same horizontal/vertical or opposing-diagonal structure distinguishes + and ×. A thin horizontal stroke can remain − despite moderate pen wobble. New relaxed candidates require independently supported adjacent numerals from the existing image/pen models. Explicit letter-mode segmentation does not enable the new relaxed rules.

Tiny marks inside a recognized +/× are attached only when close to its actual stroke path. Their original points remain in the token. Separate decimal points, dots, division dots, digit crossbars and genuine neighbouring strokes stay separate. Personal ink corrections retain their existing priority.

A recovered operator does not justify inventing a numeral from an unsupported residual letter/unit shape; the numeric ensemble abstains when the new operator route lacks character support. No fixed expressions, teacher identifiers, private pen exemplars, new weights, training samples, V2 data or network inference were added to the recognizer.

## Verification

- Full frozen UJI V1 composition run: **840/924 (90.91%)**, exactly unchanged. All 924 texts are unchanged, with all 840 previous successes retained. Maths excluding isolated letters remains **789/792 (99.62%)**, a development simulation rate.
- The strengthened CI fixture now protects all 840 prior correct outcomes, rather than 830.
- All **39 local Node checks pass**; detailed outputs are in `handwriting-operator-geometry-checks.json`.
- New generated-geometry checks cover curved +/−/×/÷ in full equations; a tap retained with a crossed sign; exact stroke coverage; scale, placement and reversed pen order; changed values and false answers; powered units; separate dots; isolated letter shapes; explicit uppercase mode; and 4, crossed 7, adjacent digits and division controls.
- The private 24-item batch is also checked with the production browser's actual character worker, against the Node replay, for exact text, engine and review-flag agreement. Browser inference makes no requests outside the local test origin.
- Reader/controller/HTML build agreement, personal corrections, reload, Undo, word review and stalled-read recovery remain covered by existing tests. The original frozen natural-ink workflow remains independently checked.

The 924 compositions have been used in development. The 24-item natural batch has now informed this fix. Neither is a fresh holdout for claiming general classroom accuracy. Later confirmation needs different natural handwriting.

```sh
node scripts/test-natural-operator-geometry.cjs
node scripts/replay-natural-ink-current.cjs PRIVATE-TEACHER-EXPORT.json --out private-development-comparison.json
node scripts/benchmark-handwriting-simulations.cjs --split all --out beta-handwriting-current-results.json
node scripts/verify-handwriting-baseline.cjs scripts/fixtures/handwriting-operator-baseline.json beta-handwriting-current-results.json
```

Reader SHA-256: `4aed9f39a94a5e0ea05c4e23d2ab93ef6a6aa3f5e286afc29eeac70d452a56ff`.
