# Priority 4 component consensus verification — 20 October 2026

Build: `20261020-priority4-consensus1`. Published baseline: `46eaec8d818c8b6111582613149a091478aa5f24` (825/924). Diagnostic branch baseline: `074cda9bea50fb675f5eca429bb573b3ddb2b726`; its recognition code is identical to the published baseline.

## Changes

- Within an independently validated measurement prefix, the existing mixed-character and pen models may agree on a numeric family (such as 5/S/s) even when their first label is a letter. Require both family totals at least 0.95 and both margins at least 0.90. Explicit letter mode remains unchanged.
- Component decoding remains first. When it abstains, a complete two-letter unit may receive a review reading from the existing full-unit prototypes only with a score of at least 0.82, margin at least 0.06, independently supported letters and at least one strong character anchor. Cursive ml additionally requires a prototype score at least 0.85, a trusted short m and a taller narrow final stroke. These fallback readings are always flagged for review.
- Legacy measurement grammars retain their text when a strong pen-digit vote or a strong non-equivalent letter vote contradicts the numeric prefix, but those disputed tokens now receive review flags. This exposes the remaining incorrect measurement without inventing its answer.

No new training examples, writer-specific recognition rules, fixed quantities, weights, cloud calls or V2 integration were added. New-value checks use the same rules.

## Frozen results

| Category | Before | After | Cases |
| --- | ---: | ---: | ---: |
| Numbers | 433 | 433 | 440 |
| Ordinary measurements | 127 | 131 | 132 |
| Powered measurements | 86 | 87 | 88 |
| Arithmetic | 86 | 86 | 88 |
| Arithmetic with units | 42 | 42 | 44 |
| Isolated letters | 51 | 51 | 132 |

Overall: **825/924 (89.29%) → 830/924 (89.83%)**. Numbers, units and arithmetic excluding isolated letters: **779/792 (98.36%)**. Ordinary measurements: **131/132 (99.24%)**.

All 825 previously correct cases remain correct. Five readings improve: two 8 ml compositions, 35 cm, one 97 kg composition and 35 cm². Of the five cases identified in the other chat, four now read correctly; the fifth remains `924 g` and is explicitly flagged. Total flagged readings: 241 → 244. Unflagged wrong readings: 63 → 59.

Reader SHA-256: `765acb28dba135abf4984df732e6cc98e15a437d62701f8a7af7de1a30c50fd5`.

These are correlated UJI V1 glyph compositions with generated operators. They have been inspected during development; the scores are not independent real-world handwriting accuracy estimates.

## Verification and limits

The new targeted tests pass for the five improvements, the remaining-prefix review flag, different quantities (28 ml, 175 ml, 53 cm, 105 cm, 27 kg), explicit uppercase letter mode, 22 non-unit shape controls, weak/tied-prototype rejection and personal-correction/Undo priority. Earlier measurement, detached-four, crossed-seven and powered-unit tests also pass.

Of 25 existing checks run on both revisions, 18 pass on each; the same seven fail on each. No new existing-check failures were introduced:

- `test-unit-components.cjs`
- `test-unit-first-exponent.cjs`
- `test-unit-first-exponent-zero.cjs`
- `test-authoritative-m2m3.cjs`
- `test-raised-three-reconcile.cjs`
- `test-equation-units.cjs`
- `test-handwriting-context-review.cjs`

The old stretched-four disagreement and the unavailable private teacher corpus remain limitations. The local final benchmark was compared case by case against the frozen 825-correct baseline. Its fixture contains only IDs and correctness outcomes, not pen strokes or training data.

## Reproduce

```sh
node scripts/test-priority4-consensus.cjs
node scripts/diagnose-remaining-measurements.cjs
node scripts/benchmark-handwriting-simulations.cjs --split all --out beta-handwriting-current-results.json
node scripts/verify-handwriting-baseline.cjs scripts/fixtures/handwriting-priority4-baseline.json beta-handwriting-current-results.json
node scripts/compare-handwriting-engines.cjs
```

The GitHub workflow runs the targeted checks, original full benchmark, case-by-case regression gate, five-case diagnostic and paired engine comparison. The experimental branch must pass before promotion to main.
