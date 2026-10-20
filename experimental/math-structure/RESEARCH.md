# Public principles adapted for structural V2

Reviewed 20 October 2026. This is an original JavaScript implementation using the
existing local classifiers. No third-party recogniser source or weights are copied.

| Primary source | Public principle | Implementation and limits |
| --- | --- | --- |
| DPRL CROHME 2014, Hu, Davila, Alvaro and Zanibbi: https://github.com/DPRL/CROHME_2014 | Recursively identify dominant vertical structures, baselines and nested regions; classify spatial relations | `structural-parser.js` recursively enumerates fractions, roots, bracket groups, inline splits and scripts. It retains a beam of four candidates. This is a geometry-based adaptation, not their SVM/MST system. |
| Zanibbi and Mouchère, CROHMELib/LgEval documentation: https://www.cs.rit.edu/~dprl/old/CROHMELib_LgEval_Doc.html | Distinguish stroke segmentation, symbol labels and directed R/A/B/I/Sup/Sub relationships | Each selected stroke is consumed once; multi-stroke symbols have segmentation links. `reading.labelGraph` and `reader.structuralV2.toLg(reading)` export direct layout graphs. Inherited edges still need normalization for official LgEval. No official CROHME accuracy result is claimed. |
| Ung et al., A Transformer-based Math Language Model for Handwritten Math Expression Recognition, 2021: https://arxiv.org/abs/2108.05002 | Retain competing recognition hypotheses and rerank with expression context | Existing digit/image/pen model candidates enter a bounded search with numeric grammar and spatial consistency checks. No Transformer or trained language model is added. Scores are ranking heuristics, not calibrated correctness probabilities. |
| MyScript public iinkTS integration: https://github.com/MyScript/iinkTS and SDK/pricing: https://developer.myscript.com/pricing | Capture online strokes; preserve editable ink; recognise math through a separate recognition service | Existing capture, correction, preview and confirmation remain. No MyScript engine, cloud service, API key or SDK dependency is added. Their proprietary internal joint recogniser is not reimplemented or claimed. Older public REST documentation URLs returned errors during this review. |

## Deliberate boundaries

- Existing UJI V1 fixture and model assets, existing CROHME-derived models, all trained
  teacher samples, rules and correction storage remain untouched.
- Only supported numeric arithmetic and composed fraction/root/group/script layouts
  enter the new search. Ordinary units and inline writing retain existing dispatch.
- Grammar checks syntax, not whether an arithmetic answer is true. Existing teacher
  arithmetic-preview correction remains a separate user-controlled feature.
- Maximum 96 strokes, depth 8, 180 regions and four hypotheses bound the search.
  Cancellation propagates; incomplete search or optional-parser failure falls back.
- Matrix layout, arbitrary integrals/summation limits, general algebraic leaves,
  trained spatial-relation models and broad unfamiliar-writer validation remain outside
  this implementation. This is not a complete MyScript-equivalent engine.

## Evidence

The new paired development suite composes existing labelled UJI V1 glyphs into
12 mathematical layouts and a scaled/reordered/reversed variant of each. It is
separate from the frozen 924-case suite, but not a natural-writing or held-out-writer
benchmark. Known teacher radical controls remain independently replayed.
