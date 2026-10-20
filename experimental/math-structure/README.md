# Isolated V2 parser validation — 20 October 2026

Protected V1 and production remain at `531b6659a07694161d30f4be57903936905301fb`.
No production reader, page, controller, trained model, sample, or existing test is changed here.
V2 means the experimental engine revision. No UJI Pen Characters V2 dataset is introduced.

## What failed before this change

GitHub Actions run `39431027541` passed the spatial-graph check and the real `√49`
control but failed complete recognition of the existing nine-stroke teacher expression.
V1 produced `V − 8 + 11J` instead of `\sqrt{8+(10)}`. The successful geometry-only
test was not a successful expression-recognition test.

## Candidate changes

`candidate.cjs` builds a separate reader in memory from the exact protected V1 source.
It refuses a different V1 checksum, missing edit, ambiguous edit, or an attempt to
write over the production reader. `parser-patches.json` records every source edit.

- Reject nearly straight strokes as parenthesis candidates, preserving a narrow `1`.
- Parse balanced bracket spans as groups and retain digit and bracket tokens.
- Allow a gently sloped radical roof using both roof width and hook height.
- In numeric brackets only, combine near-closed-loop geometry with existing pen-model
  `0/O/o` evidence when the digit-image reader abstains. Keep these predictions flagged.
  The stricter existing zero-closure threshold remains the default elsewhere.
- Correct the escaped digit checks in the geometric-plus fallback.

The spatial graph remains a diagnostic. The candidate repair uses the existing local
models and structural parser; it is not a newly trained model or a replacement engine.

## Verified local results

| Check | V1 | Isolated V2 |
| --- | --- | --- |
| Frozen 924-case UJI V1 composition benchmark | 840/924 (90.9%) | 840/924 (90.9%) |
| Previously correct benchmark cases lost | — | 0 |
| Newly hidden incorrect-reading uncertainty | — | 0 |
| Existing nine-stroke expression and five geometric/order variants | 0/6 | 6/6 |
| Existing `√49` and complete-expression structural suite | `√49` passes; nine-stroke expression fails | Both suites pass |
| Additional regression suites, including the two structural suites above | Loader/version mismatch independently reproduced | 25 pass; 1 inherited failure |

All six variants are correlated controls derived from one existing teacher expression.
They are development checks, not six independent writers or a real-world accuracy estimate.
The 924 expressions reuse labelled glyphs and generated operators, not naturally written
whole expressions. No broad accuracy increase is claimed.

The inherited `test-recognition-engine-trace` failure is a real integration blocker:
the controllers expect `20261020-stacked-fraction1`, while the protected reader declares
`20261020-structural-parser8`. It fails identically without the V2 preload. The isolated
workflow reports inherited failures with both logs and rejects any newly failing suite.
An isolated CI success does not mean that production is ready to integrate.

Results are in `results/paired-report.json`, `results/structure-paired.json`, and
`results/regressions.json`. GitHub CI also uploads the complete 924-case per-reader records.

## Reproduce

From the repository root:

```sh
node experimental/math-structure/check-preservation.cjs
node experimental/math-structure/test-graph.cjs
mkdir -p /tmp/classroom-v2-validation
node experimental/math-structure/test-candidate.cjs /tmp/classroom-v2-validation/structure-paired.json
node experimental/math-structure/regressions.cjs /tmp/classroom-v2-validation/regressions.json
node experimental/math-structure/paired-benchmark.cjs /tmp/classroom-v2-validation/paired-report.json
```

`preload.cjs` runs existing tests unchanged against fresh candidate contexts and storage.
The paired benchmark uses separate V1/V2 contexts, checks source hashes and exact case
identity, and rejects every loss of a previously correct reading even if other gains offset it.

## Integration status

Experimental only. Resolve and verify the loader/version issue in a separate integration
candidate, then test additional unfamiliar natural whole-expression ink. Keep V1 available
for rollback. No merge, production activation, or claim of general accuracy improvement
is included in this change.
