# General mathematical handwriting recognition — design contract

Status: **target specification, not implemented or verified**. Keep on experimental branch until real-ink tests pass.

## Requirements

1. Parse handwriting as components and spatial relationships, not a growing set of hard-coded whole-equation templates.
2. Support radicals of arbitrary practical length: use the full roof span and its endpoints to group the radicand, regardless of stroke order, including a separately drawn hook and roof.
3. Support multiple radicals, nested radicals, fractions, exponents, units, brackets, variables, digits and arithmetic operators; preserve spatial layout and operator precedence.
4. Build an expression tree before rendering. Distinguish `√(25+36)+7` from `√(25+36+7)` using geometry. Ambiguous roof boundaries must not be silently guessed.
5. Separate (a) recognition/transcription, (b) structural and mathematical validation, (c) optional automatic mathematical correction. Beautify should preserve teacher intent unless correction is explicitly enabled.
6. Remain free to run for Singapore teachers, prioritising local/offline inference without per-use cloud costs.
7. Preserve the current working whiteboard while developing and validating on the experimental branch.

## Release gates

- Replay real teacher handwriting samples, including the previously misread five-stroke `√49`, as well as varied stroke order, roof lengths, gaps and slopes.
- Test short, long, nested, multiple, ambiguous and malformed radical expressions; test boundary cases with operators outside the roof.
- Test actual browser rendering, Undo and Apply on both whiteboards, desktop and mobile.
- Re-run existing frozen handwriting benchmarks; report category-specific accuracy and regressions, not unsupported 100% claims.
- Deploy only after passing tests and user approval; provide a working HTML link that genuinely points to the tested build.
