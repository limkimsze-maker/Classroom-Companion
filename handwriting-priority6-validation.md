# Priority 6: fresh teacher whole-expression validation

Status: collection and independent replay are ready. **No eligible fresh teacher batch has been collected or scored yet.** There is no new classroom accuracy percentage to report.

The saved pen-stroke exports found during this task are earlier diagnostic/training-era exports from 18–19 October. They are excluded from fresh validation. No private pen traces were added to this repository. Generated glyph compositions and automated UI pen input are excluded from natural-handwriting accuracy evidence.

## Use the test

Open `handwriting-teacher-validation.html` on the device and input method normally used for teaching. Give a teacher code rather than a name, attest to the source and freshness, and write the 24 displayed items naturally as complete expressions. Copy the displayed answers even when deliberately false. Do not assemble separately written glyphs.

The test covers four numbers, six arithmetic expressions, six quantities with units, six powered measurements/expressions and two stacked fractions. The prompt list is fixed before collection in `validation/priority6/protocol.json`. This is a small prompted challenge set, not a random sample of classroom use.

Predictions remain hidden during capture. Progress is saved under a dedicated key on this browser. Download a backup to move devices or protect against cleared browser storage. Before finishing, teachers may review and edit ink; edits and input methods are retained. Every item needs ink or a stated skip reason. Skips stay in the denominator.

Finishing locks the pen traces. Scoring downloads and verifies the frozen reader, then performs inference locally. Download the resulting JSON file and share it for independent replay. No ink is uploaded automatically. After seeing results, do not treat redrawn versions as untouched validation. The JSON provenance is self-attested; the software cannot independently prove teacher identity or whether a person has seen previous feedback.

## Frozen reader and scoring

Baseline: commit `dc14aa448706f68e57d95a596f321e24bce0fe7b`, Priority 5 build `20261020-priority5-audit1`.

Reader SHA-256: `a6d7ae440512ab2733fb073c896ea6753918ab6f973006ea4e20b2ebf7272ae4`.

Frozen bundle SHA-256: `cb82ef1ba7ef38d726b377df6ac2777c64d1def24c64eedc22383cdb3d07b57d`.

The frozen bundle contains exact copies of the 20 existing offline dependency/reader files listed in the protocol, with isolated in-memory learning storage and nested workers disabled. It uses the same local inference fallback as the Node benchmark. It remains stable when the production reader changes. The bundle and worker driver are checked before execution; mismatches stop scoring and retain the ink.

Inference receives only case ID, original strokes and original writing dimensions. Expected labels stay outside the recognizer. Scoring uses Auto, preserves unit case and deliberately false arithmetic, and applies no automatic answer correction or personal examples. Spaces, minus variants, common LaTeX operation forms and power syntax are normalized; equations are never solved to mark recognition correct.

The export retains a protocol checksum, bundle checksum, baseline, anonymous teacher code, session ID, attestations, timestamps, original normalized points, original dimensions, skips, edits, input methods and results. The independent Node runner ignores exported predictions and reads the original ink again. It rejects altered labels/protocol checksums, incomplete case sets, invalid coordinates, duplicate sessions and repeated ink.

## Interpret the result

Report exact full-expression matches, character error, review flags, unflagged errors, skips and category counts. Keep all 24 planned prompts in the denominator. Inspect the actual ink to identify accidental copying mistakes or protocol deviations; do not silently relabel a failed case.

One batch measures that teacher and that prompted set. Collect separate fresh batches from several teachers and devices before making broader claims. Five teachers would provide 120 prompted items, but responses from each writer remain correlated; this is not a basis for claiming a population accuracy percentage without a suitable sampling design. Keep original writer-level scores alongside pooled counts.

If a batch later guides a code change, it becomes development evidence. Freeze a new reader and collect a different fresh validation batch to assess that change.

## Verification

`test-natural-teacher-validation.cjs` verifies frozen hashes and loading, isolated personal storage, full denominators, arithmetic/case preservation, malformed/altered/duplicate rejection, and labels excluded from inference messages.

The Playwright test exercises actual desktop/mobile pointer drawing, one-point dots, original geometry across resize, Undo, local resume, hidden predictions, sealing, the actual isolated reader worker, JSON download, browser-to-Node replay agreement, import without trusting old predictions, checksum rejection and blocked-storage recovery. Requests remain on the local test origin. These automated pen traces are synthetic test inputs, not teacher samples or recognition accuracy measurements. Browser screenshots were inspected for desktop and phone layout.

The production reader is unchanged. Its prior frozen simulation result remains 840/924 overall and 789/792 for maths excluding isolated letters; those are development simulation rates, not the pending natural-ink result.

```sh
node scripts/test-natural-teacher-validation.cjs
node scripts/test-natural-teacher-validation-browser.cjs
node scripts/benchmark-natural-teacher-ink.cjs teacher-maths-EXPORTED-ID.json --out natural-ink-results.json
```

The browser test requires Playwright and Chromium; the dedicated GitHub workflow installs pinned test tooling. No real teacher export is included in CI or this repository.
