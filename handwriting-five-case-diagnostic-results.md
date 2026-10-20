# Five-case measurement diagnostic — 20 October 2026

Source: [successful GitHub Actions run 39383532431](https://github.com/limkimsze-maker/Classroom-Companion/actions/runs/39383532431) on experiment/measurement-prefix-recovery, commit 896a05bd879505235c22f092f63a49c37d7784f0.

## Verified results

- Full frozen UJI V1 benchmark: **825/924 (89.2857%)**.
- Five previously failing ordinary measurements: **0/5 corrected** (diagnostic confirms failures, not new regressions).
- Existing measurement-consensus, detached-four, crossed-seven, component-priority, personal-correction, and engine-trace tests: all pass.
- Controlled identical-ink comparison (132 cases): component-only 126/132, whole-unit 17/132, combined 128/132.

| Case | Actual | Engine | Evidence |
| --- | --- | --- | --- |
| writer 2 rep 0, 8ml | 8Me | local-emnist-cnn | 8 .999996; M .998933; e .976547 |
| writer 2 rep 1, 8ml | 8MC | local-emnist-cnn | 8 .999984; M .998082; C .850102 |
| writer 9 rep 1, 35cm | 3SCM | local-emnist-cnn | 3 .999566; S .844797; C .996089; M .869839 |
| writer 10 rep 0, 97kg | 924 g | local-general-primary-grammar | 9 .999943; 2 .999646 (2 strokes); 4 .963408 (2 strokes); g .918669 |
| writer 11 rep 0, 97kg | 9769 | local-primary-digit-sequence | 9 .999790; 7 .999927 (2 strokes); 6 .996987 (2 strokes); 9 .995372 |

## Interpretation

- **8ml:** The fallback EMNIST path interprets the unit letters as uppercase M plus e/C; the unit-first component path abstains. Do not blindly rewrite all Me/MC to ml; inspect isolated pen-reader and letter-reader agreement and spatial segmentation first.
- **35cm:** An isolated 5 is misread as S and the unit as uppercase. Preserve strong digit-model evidence for the prefix before unit decoding; inspect candidate prefix splits.
- **97kg:** Two distinct failures: one writer's 7/k ink is split into 2 and 4; another writer's k/g ink is read as 6/9. Need explicit independent evidence for suffix boundaries, not a literal 97kg override.
- Existing benchmark includes isolated lowercase letters with much lower accuracy, so overall 89.29% is not real-world accuracy.

## Acceptance criteria for next code change

1. Preserve 825/924 correct or improve, with **zero new benchmark regressions**.
2. Preserve existing powered-unit cases, arbitrary measurements, and personal correction/Undo tests.
3. Fix cases by model consensus and geometry, not by hardcoding these literal words or writer IDs.
4. Run full GitHub Actions workflow on the experimental branch and only promote after checking logs.
