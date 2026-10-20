# Numeric square-root structure

Build: `20261020-square-root1`.

The reported Auto result was `JJq = 7` for a handwritten square root covering 49, followed by `= 7`. Auto had no dedicated radical structure route. Grouping the radical with nearby numeral strokes let the character reader return letters. Generated controls reproduce the old failure family (`J − 4q = 7` for a split radical, or `549 = 7` for a joined radical).

The new route detects a two-leg radical hook joined to a roof, partitions all remaining ink into a numeric radicand and optional complete numeric equality, then reads the numbers independently with the existing local ensemble. It supports a one-stroke radical or separately drawn hook and roof, including modest curvature, reversed pen direction and stroke order. It emits a braced LaTeX radicand, retains all original strokes, propagates numerical uncertainty and respects personal corrections and explicit letter/Math modes. No arithmetic answer is used to choose digits. Non-square numbers and false written equalities remain as written.

Typed Unicode `√49` now braces the complete number before MathJax rendering, and Unicode root expressions in Auto use the mathematical renderer. The standalone `√` symbol retains its previous behavior.

This route covers numeric roots and a complete numeric equality. Indexed/nested radicals, algebraic radicands, missing roof/hook, incomplete equality and extra selected ink are not added to its grammar; unmatched ink stays with the existing readers. Negative controls include a long-division bracket, ordinary inline maths, missing radical parts and extra/index ink.

## Verification

- 56/56 generated radical cases using public UJI V1 digits and invented pen geometry; 16 retain a review flag. Values include 49, 64, 81, 100, a non-square 2, arithmetic inside the radical and a false written result. These are development controls, not independent natural handwriting accuracy.
- Actual full Auto dialog on both whiteboards, desktop and mobile: recognition, production worker/Node parity, MathJax `msqrt`, whole-number Unicode correction, Apply, original ink retention, Undo and return to pen pass. No outside requests. The reproducible browser test runs in GitHub Actions.
- All 41 Node checks pass. Both previous private fractions still pass the full Auto Apply/Undo browser flow.
- Existing 24-sample natural batch remains 24/24 on development replay. It contains no square roots and cannot establish square-root accuracy. The screenshots have no source pen traces, so the exact reported pen input has not been replayed; fresh pen testing remains needed.
- Full frozen composed UJI V1 benchmark remains 840/924 (90.91%), or 789/792 for maths excluding isolated letters. All 924 output texts are unchanged and all 840 protected successes are retained. It has no square-root category.
- Frozen natural reader, protocol and original blind baseline remain unchanged. Its browser workflow still passes.

See `handwriting-square-root-checks.json` for outcome-only evidence and the reader hash. No screenshot or private pen trace is included in this change.
