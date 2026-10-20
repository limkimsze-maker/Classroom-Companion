# Priority 5 error audit — 20 October 2026

Build: `20261020-priority5-audit1`. Baseline: `216da42840f694958e8fe85c52df084b075b3a37` (830/924).

## Verified results

| Category | Previously correct | Now correct / total |
| --- | ---: | ---: |
| Numbers | 433 | 438/440 |
| Ordinary measurements | 131 | 131/132 |
| Powered measurements | 87 | 88/88 |
| Arithmetic | 86 | 88/88 |
| Arithmetic with units | 42 | 44/44 |
| Isolated letters | 51 | 51/132 |

Overall **840/924 (90.91%)**, up ten, with zero correct-to-wrong regressions across the same 924 IDs. Maths excluding isolated letters: **789/792 (99.62%)**, previously 779/792 (98.36%). Powered measurements, arithmetic and arithmetic with units are all correct on their frozen cases. The paired 132-expression engine comparison is 130/132 for components, 17/132 for whole units, and 132/132 for the combined reader.

Three frozen maths errors remain: isolated 4 is read Y, isolated 5 is read S, and one 97 kg is read 924 g. All three are flagged. Isolated 4/5 lack the numeric neighbourhood that supports disambiguation in full expressions; the kg sample has substantial disagreement at the digit/unit boundary. Total flagged cases: 241. Unflagged wrong cases: 55, all isolated letters.

These are correlated compositions of UJI V1 glyphs with generated operators, reused during development. They are not untouched holdouts or naturally written full equations, and the percentages are not classroom accuracy estimates. An additional changed-value probe, 405, was read as 40 s; a final S-shaped 5 can still resemble a seconds unit. Changed-value controls do not establish generalisation to all quantities.

## Supported fixes

- Reject the cursive-L shortcut when independent pen and image evidence agree on a different numeric family. This recovers hooked 1 and 3 without forcing an isolated S/5 into a digit.
- Apply existing digit-family consensus within a numeric neighbourhood established by operators, a measurement prefix, or a separately corroborated numeral. In that context a pen-digit vote at least 0.90 with margin at least 0.85 can use mixed-model support at least 0.05; retain the weak support as a review score. No equation is evaluated to choose a glyph.
- For a genuinely raised 2/3, strong pen evidence may use mixed-character support as well as the digit-only model. Keep the low support in the exponent confidence.
- Join almost exactly shared endpoints of separately lifted unit strokes. Compare superscript height with the tallest baseline glyph while retaining its vertical lift, rightward position and baseline clearance checks. The six-stroke m plus three-stroke ² fixture now reads 1 m².
- Flag isolated letter/digit disagreements in Auto rather than returning a confident Y when the pen model strongly favours 4. Explicit letter modes and personal corrections retain priority.

The page audit also found the UI loaders still required build `20261020-words2`. Both page/controller pairs now request and accept the current reader build. A regression checks the HTML/controller/reader version agreement; the stalled-read fixture exercises reloading a cached old reader and successfully starting recognition.

No training samples, weights, paid services, writer-specific cases or fixed equations were added to the reader.

## Seven older failing checks

| Check | Finding and repair |
| --- | --- |
| test-unit-components | Accept a correct independent raised-suffix route, retain complete token assertions; fix the genuine many-stroke unit grouping/height defect. |
| test-unit-first-exponent | Its dependency now tests the intended whole-unit function directly. |
| test-unit-first-exponent-zero | Remove obsolete expectations that unsupported cube evidence wins; assert conflict abstention, strongly supported square retention and zero recovery. |
| test-authoritative-m2m3 | Same dependency repaired; existing stroke-boundary checks remain. |
| test-raised-three-reconcile | Same dependency repaired; contour checks remain separately covered. |
| test-equation-units | Preserve exact text and token coverage; allow justified weak-token/context review instead of requiring every synthetic glyph to be certain. |
| test-handwriting-context-review | Add the DOM text-node method used by the current UI. |

The broader local suite runs 37 Node checks. It also repairs the same missing DOM method in the stalled-read fixture, tests that word review preserves its actual incoming reading, updates the build trace, and verifies that Undo restores the actual pre-correction reading when component priority changes it. Detailed check output is in `handwriting-priority5-checks.json`. The separate Playwright InkOn integration and its legacy alias are excluded; no UI layout or InkOn runtime was changed.

Targeted new checks replay all ten improvements, different quantities, deliberately false equations, isolated review flags, explicit S/Y letter modes, and the remaining kg review. Existing grouping controls, personal learning, reload, Undo and cancellation checks remain enabled.

The workflow gates all 830 previously correct cases using an immutable outcome-only fixture, includes the repaired seven checks and the added word/recovery checks, and repeats the full benchmark and paired comparison before promotion.

## Reproduce

```sh
node scripts/test-priority5-audit.cjs
node scripts/test-unit-components.cjs
node scripts/benchmark-handwriting-simulations.cjs --split all --out beta-handwriting-current-results.json
node scripts/verify-handwriting-baseline.cjs scripts/fixtures/handwriting-priority5-baseline.json beta-handwriting-current-results.json
node scripts/compare-handwriting-engines.cjs
```

Reader SHA-256: `a6d7ae440512ab2733fb073c896ea6753918ab6f973006ea4e20b2ebf7272ae4`.
