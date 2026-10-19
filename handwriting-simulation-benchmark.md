# Handwriting simulation benchmark — 19 October 2026

Build `20261019-simulations1` improves exact complete readings from 541/924
(58.5%) to 765/924 (82.8%). **The general 99% target is not reached.**
There are 230 newly correct readings and six previously correct readings that
regress (four isolated letters, one powered unit and one equation with a unit).

| Task | Correct / cases after | Exact accuracy |
| --- | ---: | ---: |
| Numbers | 423/440 | 96.1% |
| Baseline measurement units | 117/132 | 88.6% |
| Square and cube units | 61/88 | 69.3% |
| Arithmetic | 82/88 | 93.2% |
| Arithmetic followed by a unit | 31/44 | 70.5% |
| Isolated c, m, k, g, l, L | 51/132 | 38.6% |

The benchmark uses the existing labelled UJI Pen Characters V1 fixtures:
11 writers, two samples of each glyph, and 42 fixed expressions per sample.
The expressions combine separately written real glyphs with generated operator
strokes. All cases use Auto mode with empty personal correction storage.
Whitespace is ignored; case matters; ASCII hyphens are canonicalized to minus.
The models never evaluate an equation to choose its answer.

| Partition | Cases | Before | After |
| --- | ---: | ---: | ---: |
| Development: writers 1–5 | 420 | 245 (58.3%) | 368 (87.6%) |
| Verification: writers 6–11 | 504 | 296 (58.7%) | 397 (78.8%) |

Writers 1–5 are the 420-case development partition; writers 6–11 form the
504-case verification partition. This partition checks the new decision rules;
it does not prove that the unchanged upstream neural models were trained on
different writers. Glyphs repeat across compositions, so the 924 cases are
correlated simulations. Naturally written full equations, the complete alphabet,
cursive words, fractions, integrals and full pages need separate evaluation.

No new dataset, benchmark glyphs, neural weights or personal correction examples
were added. The changes combine the existing independent model evidence, repair
disconnected open 4s conservatively, preserve full compound units, prioritize
complete raised measurements, and retain known teacher corrections and symbols.
Weak evidence remains visible for review. There are still 136 incorrect readings
without a review flag; an unflagged result is not a correctness guarantee.

The comparison and all individual readings are in
`handwriting-simulation-report.html` and `handwriting-simulation-results.json`.
The JSON records labels, fixture writer IDs and results, without raw teacher ink.
Its reader SHA-256 identifies the exact evaluated source.

## Reproduce the frozen comparison

Run from the repository root with Node.js and Python 3. The scripts use the actual
bundled offline classifiers, without extra packages or a training step.

```sh
mkdir -p /tmp/handwriting-simulations
git show e2ab6ba61d3fafd324b1b30c7d98cb27381ed0b5:whiteboard-handwriting-recognition-beta.js > /tmp/handwriting-simulations/reader-baseline.js
node scripts/benchmark-handwriting-simulations.cjs --split development --reader /tmp/handwriting-simulations/reader-baseline.js --out /tmp/handwriting-simulations/development-baseline.json
node scripts/benchmark-handwriting-simulations.cjs --split validation --reader /tmp/handwriting-simulations/reader-baseline.js --out /tmp/handwriting-simulations/validation-baseline.json
node scripts/benchmark-handwriting-simulations.cjs --split all --out /tmp/handwriting-simulations/final-all.json
```

`benchmark-trained-handwriting-controls.cjs` optionally compares an owner-provided
teacher corpus with the baseline. The private corpus and diagnostic exports are
not bundled. Report generation additionally requires the local compatibility and
measurement-control summaries, so it cannot silently publish stale or failing
controls. The committed JSON is the reviewable complete comparison.

For a real-world 99% claim, define the supported tasks and exact-match scoring
first, then collect a fresh, representative set of naturally written expressions
from writers not used to develop the rules. Report every case, including rejected
or uncertain readings, and keep that collection out of tuning.
