# V2 shared letter matching

V2 adds a conservative whole-glyph review for isolated lowercase l, k and g. It uses 12 teacher-labelled raster features per letter. A further 157 non-target features only veto misleading matches; they cannot output a digit or another letter. The source contains no example IDs, timestamps or raw pen strokes. V1 and browser learning storage are unchanged.

Every third example of each target label was withheld before implementation: 18 stored features total. With the same remaining examples, the existing personal matching rule accepts 13/18 correctly. The shared matcher accepts 16/18 correctly, abstains on two, and assigns no incorrect target label. This is a small same-writer feature comparison, not a fresh-ink or general handwriting accuracy estimate.

An extended match requires two supporting examples and a larger margin against competing shapes. Confident standalone numbers require a near-exact match before they can be changed. Personal learning, explicit math/digits modes, multi-character expressions and uppercase litre L keep priority. Wider matches remain flagged for review.

Run `node experimental/math-structure/test-shared-letters-v2.cjs` for the held-out comparison, original UJI glyph controls, digit protection and learning-priority checks. Run the full frozen simulation separately with `node scripts/benchmark-handwriting-simulations.cjs --split all --reader experimental/math-structure/reader-v2.js --out /tmp/v2-shared-report.json`. No UJI benchmark examples were added to training.

Fresh before/after runs both scored 915/924 (99.03%), with identical readings and no regressions. All 792 maths-related cases passed; the same nine non-case letter failures remain flagged. The teacher feature gain above does not resolve those different handwriting styles.
