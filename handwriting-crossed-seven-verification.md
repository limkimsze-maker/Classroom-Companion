# Crossed-seven grouping verification — 20 October 2026

Build: `20261020-crossed-seven1`. Baseline commit: `e0cfd0c7c59a1132369e5095916221af1f088bcb`.

## Cause and change

The separately drawn crossbar on two wide UJI V1 sevens exceeded the segmenter's ordinary combined-width limit. Its ink was emitted as a separate minus. Both the image model and the pen model already recognized the complete crossed glyph as 7.

A narrow grouping exception now requires a bar across the middle of a single-stroke body, actual ink intersection or pen-width proximity, plausible size and overlap, image-model probability at least 0.97 for the joined 7, and pen-model probability at least 0.985 with a margin of at least 0.95. The ordinary grouping width limit and model weights are unchanged. Personal whole-ink corrections retain priority.

## Frozen benchmark results

| Category | Before | After | Cases |
| --- | ---: | ---: | ---: |
| numbers | 423 | 431 | 440 |
| units | 117 | 119 | 132 |
| powers | 82 | 82 | 88 |
| arithmetic | 82 | 84 | 88 |
| measuredArithmetic | 39 | 41 | 44 |
| letters | 51 | 51 | 132 |

Full exact-match accuracy: **794/924 (85.93%) → 808/924 (87.45%)**. Per-case comparison found **14 gains and zero regressions**. Unflagged wrong readings: 88 → 78. Numbers, units and arithmetic excluding isolated letters: **757/792 (95.58%)**.

The original 12 readings with an extra minus are all corrected. Two additional full equations with units recover because their numeric prefixes now parse correctly. All 14 gains reuse one writer's two crossed-seven glyphs across composed expressions. They do not provide an independent real-world accuracy estimate.

Reader SHA-256: `ea6ebccaeb3fc1c53d950d37ae637fd2c8dab850a79d91c71bb299343227464a`.

## Checks

The new actual-model checks pass for full 7/97/507/972 readings and an equation; movement, uniform and non-uniform scaling, reversed pen order, preservation of both original strokes, genuine minus/plus/multiply/divide/equals operators, disjoint nearby bars and abstention when the models disagree. Powered-unit component priority and personal-correction/reload/undo checks also pass.

Of 22 existing checks run on both revisions, 15 pass on each. The same seven fail on each; no new existing-check failures were introduced:

- `test-unit-components.cjs`
- `test-unit-first-exponent.cjs`
- `test-unit-first-exponent-zero.cjs`
- `test-authoritative-m2m3.cjs`
- `test-raised-three-reconcile.cjs`
- `test-equation-units.cjs`
- `test-handwriting-context-review.cjs`

Those existing failures are retained as unresolved checks. The private teacher corpus was unavailable for replay.

## Reproduce

```sh
node scripts/test-crossed-seven-grouping.cjs
node scripts/test-powered-component-priority.cjs
node scripts/test-recognition-learning-priority.cjs
node scripts/test-recognition-engine-trace.cjs
node scripts/benchmark-handwriting-simulations.cjs --split all --out beta-handwriting-current-results.json
node scripts/compare-handwriting-engines.cjs
```

GitHub Actions runs these targeted checks, the full benchmark and paired comparison, and uploads the complete per-case results. The benchmark uses UJI Pen Characters V1 glyph compositions with generated operator geometry; no new training data or V2 integration was added.
