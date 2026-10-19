# Local handwriting context check — 20 October 2026

Build `20261020-context1` adds a small statistical notation language model to
Auto reading. It ranks complete measurement hypotheses using the existing
independent visual classifiers and the learned likelihood of notation sequences.
This is a local language model, not an LLM or a general document/question reader.
No handwriting, whiteboard content or corrections are sent to a server.

## Training and scope

`python scripts/train-handwriting-context.py` deterministically generates 48,000
notation strings and fits interpolated character trigram counts. Operands and
answers are sampled independently. Runtime normalization replaces whole numeric
values with a neutral marker: `6 − 2 = 4` and `6 − 2 = 5` receive identical
language scores. Arithmetic correctness cannot choose a digit or answer.
The generated strings reduce to 105 notation patterns after numeric normalization;
48,000 is the generated sample count, not a count of distinct expression structures.

The training script does not read pen trajectories, benchmark labels, writer
IDs or private teacher examples. Handwriting classifier weights and the imported
teacher templates are unchanged. Generated counts occupy about 2 KB; inference
is ordinary browser JavaScript without a new runtime dependency or API key.

The context check searches plausible number/unit boundaries and raised exponent
positions, consumes all selected ink, and compares visual alternatives for valid
units. A learned sequence score supplements the visual evidence. Clear numeric
expressions, Math mode and personal whole-ink corrections are protected. Confirmed
individual-character examples constrain unit candidates. A valid complete reading
from the trained measurement route is retained; substantial competing visual
evidence can be offered for review.

The current scope is numeric measurements and arithmetic followed by a unit.
It does not infer the case of an isolated ambiguous letter, interpret surrounding
PDF text, understand an area/volume question, or evaluate the mathematics.

## Review behavior

When evidence remains ambiguous, the existing Beautify dialog displays possible
readings beside the original ink. Selecting a reading updates only the preview.
Apply confirms and retains learning; Cancel leaves the ink and discards provisional
learning; Undo restores the ink and reverses the Apply transaction. An alternative
uses its own stroke/token alignment for learning. Manual edits hide stale choices.
Context corrections remain flagged for review. A failed optional context check
retains the completed original reading; cancellation still aborts the request.

## Measured change

On the unchanged 924-case simulation benchmark, exact complete readings rise
from 765/924 (82.8%) to 767/924 (83.0%). Development is 369/420 (87.9%);
verification is 398/504 (79.0%). Two readings improve and none of the 765
previously correct readings regress. The two corrected cases are a `97 kg`
quantity and a `20 cm³` quantity written with existing labelled fixture glyphs.

There are 25 additional review flags, all on incorrect readings in this frozen
run, reducing wrong readings without a flag from 136 to 111. The main measured
gain is exposing uncertainty rather than a large automatic accuracy increase.
This result does not establish real-world accuracy or meet the 99% target.

The benchmark composes separately written UJI V1 glyphs with generated operators;
glyphs recur across cases. The writer partition is for evaluating these decision
changes and does not establish writer-disjoint upstream model training. See
`handwriting-context-report.html` and `handwriting-context-results.json` for the
complete comparison with commit `2ccb7c4`.

## Validation and reproduction

`scripts/test-handwriting-context-model.cjs` uses actual offline classifiers and
labelled development ink to check a context correction, complete stroke coverage,
personal correction priority, preservation of a written incorrect arithmetic
answer, neutral numeric priors and failure fallback.
`scripts/test-handwriting-context-review.cjs` executes the actual review controller
with a DOM event fixture and checks alternatives, preview, Apply token alignment,
return to Pen, Undo, manual edits and Cancel.

```sh
python scripts/train-handwriting-context.py
node scripts/test-handwriting-context-model.cjs
node scripts/test-handwriting-context-review.cjs
node scripts/benchmark-handwriting-simulations.cjs --split all --out /tmp/all-context.json
```

The owner-provided teacher and diagnostic corpora remain outside the repository.
`benchmark-trained-handwriting-controls.cjs` compares them with an earlier reader;
`benchmark-measured-handwriting-controls.cjs` replays the numeric-prefix unit
controls and diagnostic exports. The report generator accepts `--context` and
requires matching reader hashes and passing compatibility/control summaries.

Final validation passes 29 code/model/controller checks. All 152 numeric-prefix
measurement controls and five diagnostic exports still read correctly. The full
1,024-example teacher compatibility comparison preserves all 492 readings that
were correct in the previous Beta, with zero regressions. This training corpus
is a compatibility control and is not an independent accuracy estimate.
