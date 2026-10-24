# Fraction Bar robustness — 24 October 2026

The previous controller counted strokes after a saved array index. Clearing,
erasing or undoing ink could change those indices and exclude the next bar.
It also depended on a single outer-outline stroke and left document Hand mode
active. Screenshots supplied during this fix show ordinary five-, two- and
six-part bars that should be accepted.

The replacement recognises sustained outline edges and crossing dividers,
independently of pen lifts or stroke order. It supports broken/retraced edges,
small corner gaps, sloping outlines, overshooting dividers, horizontal/vertical
bars and 2–12 parts. It groups duplicate dividers and preserves unrelated ink.
A complete existing sketch can be selected after drawing. Incomplete sketches
remain unchanged after a failed attempt.

Fraction mode releases the previous mode, closes its menu and activates document
Pen input. Colour, move and resize operations use the page's shared Undo stack;
page changes cancel a pending fraction. Height handles work only in Select.
A tapped part is captured before mobile editing-toolbar layout changes, so a
colour tap stays associated with the intended part.

Only `whiteboard-v2-trial.html` and `whiteboard.html` opt into the replacement
controller and height handles. Original controller files, comparison recognisers,
speech controllers and frozen Git branches are preserved. Beta also gains the
same hidden-loading-overlay CSS rule already used by Alpha, so a completed
file load releases pointer input.

Validation:

- `node scripts/test-fraction-bar-recognition.cjs`: 280 positive geometry cases
  plus eight rejection checks at desktop/phone sizes. These are regression
  fixtures, not a general handwriting accuracy benchmark.
- The old recogniser passes 211 of the same 280 positive fixtures. Run with
  `FRACTION_CONTROLLER=smart-math-fractions-v2.js FRACTION_BASELINE=1` to compare.
- The three supplied screenshot silhouettes are manually traced as geometric
  fixtures; screenshots do not provide the user's original pen-event sequence.
- `node scripts/test-fraction-bar-workflow.cjs`: actual mouse/pen paths on Beta V2
  and Alpha, desktop/phone, blank board and Word; part count, draw/choose order,
  mode switching, Clear/retry, preservation of unrelated ink, colour, move,
  proportional resize, Undo and document page behaviour.
- Existing comparison rendering/Undo and speech regression checks run separately.

Baseline: `e87bb9c4ab8f1d38f9ef0fe332018fb096097c5b`.
Development branch: `promote/v2-alpha-fraction-robust-20261024`.
