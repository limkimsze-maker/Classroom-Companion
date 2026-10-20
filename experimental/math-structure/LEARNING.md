# Portable symbol learning in the V2 trial

The existing example learner is unchanged. A V2-only extension adds reusable
examples of `=`, `+`, `−`, `×` and `÷`. It updates an example memory, not neural
model weights. No new UJI data or weights are introduced.

Select a symbol by itself, correct its reading in Auto, then Learn & Test Again
and Apply. A correction inside a full equation also teaches its symbol when the
token-to-stroke mapping identifies one unambiguous operator edit. A split minus
and multiplication reading can map to the two original equals strokes. If digits
also need correction, operand lengths and the other operator runs must stay
aligned. Ambiguous edits retain the existing whole-selection learning without
guessing a symbol label. Apply keeps examples; Cancel and Beautify Undo remove
the provisional/committed examples from that action.

Taught symbols are proposed from bounded groups of one to three strokes using
raster similarity, aspect ratio, stroke count, operator geometry, competing
labels, and exclusion of omitted marks in the operator column. Reuse is limited
to clear inline numeric expressions in Auto. Structured layouts and explicit
reading modes retain their existing paths. No answer is calculated to select a
symbol or digit. Test a newly written, different equation to assess transfer:
the immediate Learn & Test Again check reuses the original ink.

Learning in the toolbar exports a JSON pack with the schema
`classroom-handwriting-learning-v1`, version 1. It includes normalized symbol
traces, character features and whole-selection features with corrected readings.
It contains no board documents or full raw equation traces. Files can still
contain personal corrected text: users explicitly choose whether to share them.
Import validates the complete pack before merging it, skips exact-shape conflicts
in favour of local examples, and respects storage limits. Bad files do not change
learning. Export before clearing browser data. Existing whole-selection memories
cannot retrospectively supply individual symbol strokes; teach those symbols
again to obtain reusable examples.

The trial's existing storage wrapper keeps writes separate from V1. Examples are
not automatically uploaded, pooled or published. To benefit everyone through the
public website, review an explicitly shared export, test its symbol examples on
fresh handwriting plus the frozen regressions, then distribute a verified pack
or a separately versioned shared-symbol bundle. Import supports sharing the pack
between browsers immediately; it does not establish population accuracy.

Baseline: main `fde629487572753ce51471613997927633050ffd`, reader SHA256
`9aba1a68779f36e36e20eacbbd833bd2ba7b8044917a5e18693a85d5d0e6f9d2`.
The protected V1 reader remains SHA256
`8f65225b10916834a4740353eb652b5bedf56f26144d523fdb384aa26718713f`.
