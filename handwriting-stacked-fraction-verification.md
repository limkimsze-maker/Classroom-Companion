# Stacked fraction repair

Build: `20261020-stacked-fraction1`.

Auto previously let a whole-symbol template replace a clearly stacked 3/4 with ¼. The late fraction detector also used digit-only inference (reading that denominator as 9), and rejected the gently curved bar in 12/5. The repair identifies a complete numerator/bar/denominator layout before whole-ink templates and reads each row with the existing numeric ensemble. It accepts modest bar wobble/retrace, retains every stroke, and carries numeric uncertainty into review. Personal corrections still win. No model weights, private exemplars or fixed answer phrases were added.

Unsigned integer rows of one to six digits are supported. All other selected strokes must belong to the structure; surrounding operators are not discarded. Fractions remain as written, including improper/unreduced fractions and a written zero denominator. This is recognition, not mathematical validation or simplification. Explicit letter modes and the explicit Math recognizer retain their existing dispatch.

## Evidence

- Supplied natural teacher batch: original frozen blind baseline 17/24; preceding operator repair 22/24; current development replay 24/24. Both fraction samples now match their intended LaTeX. This reused batch informed development and is **not independent accuracy evidence**. Six correct readings still request review.
- Actual production browser worker agrees with Node on all 24 texts, engines and review flags, using isolated storage and no outside requests.
- Both whiteboards: actual Auto review, Apply, stacked MathJax fraction rendering, retained original ink and Undo verified for both samples.
- All 40 Node checks pass. New generated UJI V1 controls cover different values, improper/unreduced/zero-denominator fractions, curved bars, scaling, placement, stroke order, all-ink coverage, uncertainty, inline maths, surrounding ink, explicit modes and personal correction/Undo. These are synthetic checks, not natural validation.
- Frozen full composed UJI V1 benchmark: 840/924 (90.91%); maths excluding isolated letters 789/792 (99.62%). All 924 output texts unchanged; all 840 protected successes retained. The benchmark contains no fraction category; fraction checks above are separate.
- Frozen natural-ink browser workflow passes. Its reader bundle, protocol, scoring and original 17/24 baseline remain unchanged. The Whiteboard navigation link alone points to the current build.

`handwriting-stacked-fraction-checks.json` contains outcome-only evidence and the reader hash. Private teacher stroke data is excluded from the repository.
