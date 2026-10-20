# Detached-four grouping verification — 20 October 2026

Build: `20261020-detached-four1`. Baseline commit: `ac514a86ae1096da880db79e7a770557437a99c9`.

## Cause and change

A two-stroke open 4 has a small horizontal gap between its left section and narrow upright. The left section starts higher, while the upright extends lower. The segmenter previously emitted the two strokes as 6 and 1; both existing classifiers identify the combined glyph as 4.

A narrow grouping exception now requires the staggered heights, a small gap, vertical overlap, a narrow vertical upright, plausible total dimensions, an image-model top prediction of 4 with probability at least 0.80, and a pen-model top prediction of 4 with probability at least 0.985 and margin at least 0.95. The normal grouping rule, model weights and training data are unchanged. Both original strokes remain in the resulting token. Personal whole-ink corrections retain priority.

## Frozen benchmark results

| Category | Before | After | Cases |
| --- | ---: | ---: | ---: |
| numbers | 431 | 433 | 440 |
| units | 119 | 119 | 132 |
| powers | 82 | 82 | 88 |
| arithmetic | 84 | 86 | 88 |
| measuredArithmetic | 41 | 42 | 44 |
| letters | 51 | 51 | 132 |

Full exact-match accuracy: **808/924 (87.45%) → 813/924 (87.99%)**. Per-case comparison found **five gains and zero regressions**. Unflagged wrong readings: 78 → 73. Numbers, units and arithmetic excluding isolated letters: **762/792 (96.21%)**.

All five corrected readings share one writer's same detached-four glyph across different compositions. They cover an isolated 4, 1234, two arithmetic equations and an equation with a powered unit. These are correlated UJI V1 compositions with generated operators, not a real-world handwriting accuracy estimate.

Reader SHA-256: `f0c00866a82170d9005fda8a184a368218a9e645f29956ac9c472d6a3563fe75`.

## Checks and limits

The new actual-model checks pass for the five targeted readings, movement, uniform scaling, reversed pen order, retained original strokes, genuine operators, a false equation containing a genuine 61, wide-gap rejection, classifier disagreement, personal correction priority and Undo.

308 adjacent-digit boundary controls cover 61, 41, 11, 71, 64, 14 and 12, all eleven fixture writers, both repetitions and two scales. None merge strokes across genuine digit boundaries. This is a grouping check and does not claim that every numeral is correctly classified.

An anisotropically stretched version makes the image model prefer 6 and the pen model prefer 4. The new grouping declines that merge and the old two-token reading remains; this variant is unresolved. The test explicitly records this limit rather than weakening the agreement requirement.

Of 23 existing checks run on both revisions, 16 pass on each. The same seven fail on each; there are no new existing-check failures:

- `test-unit-components.cjs`
- `test-unit-first-exponent.cjs`
- `test-unit-first-exponent-zero.cjs`
- `test-authoritative-m2m3.cjs`
- `test-raised-three-reconcile.cjs`
- `test-equation-units.cjs`
- `test-handwriting-context-review.cjs`

The private teacher corpus was unavailable for replay. No V2 integration or new training data was added.

## Reproduce

```sh
node scripts/test-detached-four-grouping.cjs
node scripts/test-crossed-seven-grouping.cjs
node scripts/test-powered-component-priority.cjs
node scripts/test-recognition-learning-priority.cjs
node scripts/test-recognition-engine-trace.cjs
node scripts/benchmark-handwriting-simulations.cjs --split all --out beta-handwriting-current-results.json
node scripts/compare-handwriting-engines.cjs
```

GitHub Actions runs the targeted checks, full benchmark and paired comparison, and uploads the complete per-case outputs.
