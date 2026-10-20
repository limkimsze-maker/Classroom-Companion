# Structural V2 — isolated optional trial

Protected V1 source snapshot: `531b6659a07694161d30f4be57903936905301fb`.
Existing readers, whiteboard pages, controllers, models, samples and recognition rules
remain unchanged. `whiteboard-v2-trial.html` is a separate optional entry point.
V2 refers to this engine revision. No UJI Pen Characters V2 dataset is introduced.

## Implemented

- Original recursive spatial parser for composed numeric fractions, roots, bracketed
  expressions, inline arithmetic and scripts, including structures inside structures.
- Bounded hypothesis search: retain four candidates per region and combine existing
  digit and alternate-image alternatives with numeric syntax and geometric layout evidence.
- Exact stroke accounting: no selected stroke dropped or used twice. Symbols and
  R/A/B/I/Sup/Sub relations can be exported in direct CROHME label-graph syntax.
- Preserve personal ink, component corrections, Undo, explicit modes, units, existing
  recognisers and cancellation/failure fallback.
- Checksum-guarded candidate build and trial reader/controller with matching cache
  versions. Trial corrections use separate storage, initially reading existing samples.

Public sources, adaptations and boundaries: [RESEARCH.md](RESEARCH.md).
No proprietary MyScript engine, paid API, new dataset or new training is included.
This is not a complete MyScript-equivalent recogniser.

### Measurement consensus repair

`measurement-patches.json` permits a dollar-shaped open 4 in an explicitly numeric
measurement prefix only when both existing image classifiers strongly agree on 4.
The alternate-raster classifier disagreement remains flagged. This lets independently recognised
unit letters and a raised exponent combine with the full number instead of falling
back to a coarse uncertain whole-unit template. Original stroke references remain
attached to the measurement tokens. No exact quantity or unit label is memorised.

`test-measurement-consensus.cjs` replays the teacher's 45 cm² failure, four geometric
variants, five changed quantities, non-measurement ambiguity, explicit modes and
personal correction/Undo. Browser tests additionally replay this measurement through
Beautify and Apply at desktop and mobile sizes.

### Whole-glyph and compound-unit review

`glyph-review.js` compares the existing mixed, alphabet and alternate-raster
classifiers on a complete compact glyph before accepting a fragmented reading.
It also reviews wide single-stroke letters. Candidate disagreements keep a visible
warning and selectable character alternatives. Numeral/letter and case ambiguities
are not converted into perfect confidence. Explicit reading modes and personal
corrections remain authoritative. A completed glyph review is not overwritten by
the later word-case layer.

Case pairs that share a contour, such as c/C and k/K, retain the prior reading with
choices. A stronger default lowercase bias improved the narrow benchmark but harmed
uppercase controls, so it was rejected. `compound-review.js` provides a bounded
component-based cm/km/kg/mg fallback, with a separate validated numeric prefix and
visible disagreement; it does not bypass prototype-backed ml/L handling.

## Verification

| Check | Protected V1 | Structural V2 |
| --- | --- | --- |
| Frozen 924-case UJI V1 composition benchmark | 840/924 (90.9%) | 881/924 (95.35%) |
| Previously correct frozen cases lost | — | 0 |
| Newly hidden incorrect-reading uncertainty | — | 0 |
| Incorrect readings without a warning in the frozen benchmark | 55 | 0 |
| Broader uppercase/lowercase development audit (520 glyphs; overlaps some cases) | 306/520 | 351/520; 0 previously correct readings lost |
| Twelve new composed layouts and one transformed variant each | 0/24 | 24/24 |
| Existing teacher root expression and five variants | 0/6 | 6/6 |
| Existing regression suites | Loader/version failure reproduced | 25 pass, 1 inherited failure, 0 new failures |

The new layouts compose existing labelled UJI V1 glyphs into invented layouts. They
cover roots of fractions, roots in denominators, nested fractions and roots, bracketed
sums, powers in fractions, inline fraction sums, numerator arithmetic, changed digits,
unreduced fractions and zero denominators. Tests also verify stroke/graph coverage,
personal correction/Undo, cancellation and outside-ink rejection.

Of the original 84 failed whole readings, 41 now read exactly correctly. The 43
remaining failures are all letters: 34 are case differences and 9 are other shape
confusions. All 43 are flagged; a warning or a selectable alternative is not counted
as a correct recognition. The mathematical categories total 792/792 in this fixed
simulation suite; this is not a universal mathematical handwriting accuracy claim.

These are correlated development simulations, not naturally written expressions from
unfamiliar teachers. No real-world accuracy percentage or official CROHME score is
claimed. Candidate scores are ranking heuristics, not calibrated probabilities.
Search is bounded to 96 strokes, depth 8 and 180 regions. Incomplete search or optional
parser failure falls back to the existing reader.

The inherited `test-recognition-engine-trace` failure concerns the existing CoMER
controller expecting `20261020-stacked-fraction1` while the protected reader declares
`20261020-structural-parser8`. Both logs are retained; the failure is not counted as a
pass. The new trial uses its own matching controller. The standard CoMER page remains
unchanged.

## Reproduce

From the repository root:

```sh
node experimental/math-structure/check-preservation.cjs
node experimental/math-structure/build-preview.cjs --check
mkdir -p /tmp/classroom-v2-validation
node experimental/math-structure/test-candidate.cjs /tmp/classroom-v2-validation/teacher.json
node experimental/math-structure/test-structural-parser.cjs /tmp/classroom-v2-validation/nested.json
node experimental/math-structure/test-glyph-review.cjs /tmp/classroom-v2-validation/glyphs.json
node experimental/math-structure/paired-alphabet.cjs /tmp/classroom-v2-validation/alphabet.json
node experimental/math-structure/regressions.cjs /tmp/classroom-v2-validation/regressions.json
node experimental/math-structure/paired-benchmark.cjs /tmp/classroom-v2-validation/paired.json
```

`build-preview.cjs` regenerates the trial HTML, reader and controller. `preload.cjs`
runs existing tests unchanged against fresh candidate contexts and storage. The paired
benchmark checks source hashes, case identity and every correctness/uncertainty loss.

GitHub Actions additionally runs desktop/mobile browser checks for the trial loader,
Beautify recognition, Apply, return to pen and storage separation. Complete benchmark
records, regression logs and browser captures are uploaded as workflow artifacts.

## Use and remaining work

Open `whiteboard-v2-trial.html` to opt into V2. The usual whiteboard link remains available.
This adds a trial entry point; it does not switch the existing whiteboard to V2.

Remaining work: broader natural-expression evaluation, matrices, arbitrary integral
and summation layouts, general algebraic leaves, trained relation classifiers, graph
normalization and actual official CROHME evaluation. Direct graph exports need
inherited-edge normalization before official LgEval scoring.
