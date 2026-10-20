# Measurement consensus verification — 20 October 2026

Build: `20261020-measurement-consensus1`. Baseline commit: `63a2e0154b4f8454f5177a750420507907c38a37`.

## Causes and changes

- A whole-selection word silhouette could override a spatially complete numeric prefix and unit. Independently read baseline measurements now get a turn before that generic notation match. Standalone taught powered units and personal whole-ink corrections retain their priority.
- The closed-zero rule also matched some clearly read 8s. It now preserves a nonzero digit when the existing pen and mixed-character models independently support that same digit strongly.
- Unit letters m/l could be rejected despite strong pen evidence, or an agreed g could narrowly miss the single-model cutoff. Complete measurement context now accepts those narrowly defined alternatives while retaining weak image scores in the review flags. A pen-only l in ml also needs a taller, plausibly narrow shape.
- A three-stroke k could remain split into separate letter fragments. Compact alternative groups are accepted only when the mixed-character and pen models strongly agree on k/m; ordinary gaps between separate letters remain excluded.

No model weights or training data changed. The component rules apply to arbitrary quantities rather than fixed number/unit phrases.

## Frozen benchmark results

| Category | Before | After | Cases |
| --- | ---: | ---: | ---: |
| numbers | 433 | 433 | 440 |
| units | 119 | 127 | 132 |
| powers | 82 | 86 | 88 |
| arithmetic | 86 | 86 | 88 |
| measuredArithmetic | 42 | 42 | 44 |
| letters | 51 | 51 | 132 |

Full exact-match accuracy: **813/924 (87.99%) → 825/924 (89.29%)**. Per-case comparison found **12 gains and zero regressions**: eight ordinary measurements and four powered measurements. Numbers, units and arithmetic excluding isolated letters: **774/792 (97.73%)**. Ordinary measurements: **127/132 (96.21%)**.

Unflagged wrong readings: 73 → 63. Total flagged readings: 234 → 241; weak/conflicting image evidence remains visible even where the pen-model reading is correct.

Reader SHA-256: `c49a1b1f042614abbd20481dfeaee9cdeba07ec3abb81bf53c73272877e3689a`.

These are fixed UJI Pen Characters V1 glyph compositions with generated operator geometry. The cases share glyphs across expressions and have been inspected during development. Their scores are not an independent real-world accuracy estimate. V2 and new training data were not added.

## Checks and unresolved cases

The new actual-model tests pass for all twelve corrected readings, review flags, complete disconnected k strokes, the zero/8 distinction, novel quantities (28 ml, 109 kg, 603 cm), separate c/m letters, non-unit controls, pen disagreement and personal-correction/Undo priority. The existing crossed-seven, detached-four and powered-unit priority checks also pass.

Five ordinary measurement cases remain incorrect:

- `uji-2-0-units-8ml`: `8ml` → `8Me`.
- `uji-2-1-units-8ml`: `8ml` → `8MC`.
- `uji-9-1-units-35cm`: `35cm` → `3SCM`.
- `uji-10-0-units-97kg`: `97kg` → `924 g`.
- `uji-11-0-units-97kg`: `97kg` → `9769`.

These remaining cases require stronger character or numeric-prefix evidence; the patch does not force them into the expected unit. The unresolved stretched-four variant from the previous verification is also retained.

Of 24 existing checks run on both revisions, 17 pass on each. The same seven fail on each; no newly failing existing checks were introduced:

- `test-unit-components.cjs`
- `test-unit-first-exponent.cjs`
- `test-unit-first-exponent-zero.cjs`
- `test-authoritative-m2m3.cjs`
- `test-raised-three-reconcile.cjs`
- `test-equation-units.cjs`
- `test-handwriting-context-review.cjs`

The private teacher corpus was unavailable for replay.

## Reproduce

```sh
node scripts/test-measurement-consensus.cjs
node scripts/test-detached-four-grouping.cjs
node scripts/test-crossed-seven-grouping.cjs
node scripts/test-powered-component-priority.cjs
node scripts/test-recognition-learning-priority.cjs
node scripts/test-recognition-engine-trace.cjs
node scripts/benchmark-handwriting-simulations.cjs --split all --out beta-handwriting-current-results.json
node scripts/compare-handwriting-engines.cjs
```

GitHub Actions automatically runs these targeted checks, the full benchmark and paired engine comparison, then uploads all per-case results.
