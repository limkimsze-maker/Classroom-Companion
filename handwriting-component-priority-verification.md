# Powered-unit component priority verification — 20 October 2026

Build: `20261020-components-first1`. Baseline commit: `9e7430ff46c571e3e0a64068f450d22018c0ab7f`.

The Auto reader now tries independent numeric prefix, unit letters and complete raised exponent before trained whole-unit measurement matching. Existing personal corrections and standalone taught powered units retain priority. Whole-unit matching remains available when components abstain. No models, thresholds or training data changed.

## Frozen benchmark results

| Category | Before | After | Cases |
| --- | ---: | ---: | ---: |
| numbers | 423 | 423 | 440 |
| units | 117 | 117 | 132 |
| powers | 73 | 82 | 88 |
| arithmetic | 82 | 82 | 88 |
| measuredArithmetic | 38 | 39 | 44 |
| letters | 51 | 51 | 132 |

Full exact-match accuracy: **784/924 (84.85%) → 794/924 (85.93%)**. Comparing all IDs against the baseline found ten gains and zero regressions. Unflagged wrong readings: 91 → 88.

On the same 132 powered-unit compositions, the complete reader improved from **111/132 (84.09%) to 121/132 (91.67%)**. The diagnostic component-only path remains 119/132; whole-unit-only remains 17/132. These denominators include abstentions.

Reader SHA-256: `dae0e903d98539f707cc15e29a287a6c07ecde971c96e121886a4d2bb519005f`.

## Compatibility checks

The new eight-case actual-model priority regression check passes. Existing personal-correction, reload, undo, explicit Math-mode priority and runtime-diagnostic checks pass. Of 21 existing checks run on both revisions, 14 pass on each and the same seven fail on each; there are no newly failing existing checks. The pre-existing failures are:

- `test-unit-components.cjs`
- `test-unit-first-exponent.cjs`
- `test-unit-first-exponent-zero.cjs`
- `test-authoritative-m2m3.cjs`
- `test-raised-three-reconcile.cjs`
- `test-equation-units.cjs`
- `test-handwriting-context-review.cjs`

Those failures cover existing engine-route expectations, exponent-arbitration expectations, uncertainty expectations and an incomplete DOM test stub. They are recorded here rather than counted as passing. The unavailable private teacher corpus was not replayed.

## Scope and reproduction

These are fixed compositions of separately written UJI Pen Characters V1 glyphs, with generated operators. They are correlated simulations, not naturally handwritten full expressions or a real-world accuracy estimate. The same cases were inspected during development; the verification partition is not a new untouched holdout. V2 was not added.

```sh
node scripts/test-powered-component-priority.cjs
node scripts/test-recognition-learning-priority.cjs
node scripts/test-recognition-engine-trace.cjs
node scripts/benchmark-handwriting-simulations.cjs --split all --out beta-handwriting-current-results.json
node scripts/compare-handwriting-engines.cjs
```

GitHub Actions automatically runs the priority checks, full benchmark and paired comparison on reader changes. The complete per-case benchmark outputs are uploaded as workflow artifacts.
