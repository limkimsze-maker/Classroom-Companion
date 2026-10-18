# CoMER Beta Lab — isolated experiment

This is a **separate testing page**, `whiteboard-comer-beta.html`. The normal
`whiteboard-smart-beta.html` and its local-document CSP/guard are unchanged.

## How to use

1. Open the CoMER Beta Lab build only for non-sensitive test handwriting.
2. Draw a small expression using Pen.
3. Switch **CoMER: OFF** to **CoMER: ON** (off is the safe default).
4. Select the writing using the original Beautify action.
5. In the confirmation panel, choose **Math formulas** as the reading mode.
6. Review the proposed LaTeX and preview. Correct if needed and only then Apply.
7. Turn CoMER OFF to restore the existing local MathWriting reader.

UJI Pen Characters **V1**, the digit and letter models, local correction learning,
bar models, PDF/document handling, colour selection, Undo and Pen restoration remain
unchanged. Automatic routing is not enabled in this experiment.

## Offline inference and safety boundaries

The page's *experimental-only* CSP allows `connect-src 'self'` so the WASM
runtime and bundled model assets can load from the **same GitHub Pages origin**.
It also allows `'wasm-unsafe-eval'` solely for WebAssembly compilation.
No runtime API calls are required. The production MOE-safe whiteboard
remains `connect-src 'none'` with its original hard guard.

**Never test this Beta with confidential MOE content until its security
and third-party model provenance are formally reviewed.** The experimental page
must not be described as MOE-approved.

## Provenance and licensing review

- Browser library: [ink-on v0.1.0](https://github.com/kimseungdae/ink-on),
  declared Apache-2.0; attribution `Copyright 2025 kimseungdae`.
- Algorithm: [CoMER (ECCV 2022)](https://github.com/Green-Wood/CoMER).
- Model files: upstream [ink-on v0.1.0 release](https://github.com/kimseungdae/ink-on/releases/tag/v0.1.0),
  pinned by published SHA-256 digests in `scripts/build-comer-vendor.sh`.
- Runtime: `onnxruntime-web@1.24.2`; retain applicable MIT notices
  if binary assets are redistributed.
- **Important**: The CoMER origin repository does not explicitly state
  a model-weights redistribution licence in its README. Upstream ink-on
  lists Apache-2.0 for its project, but clarify the adapted model
  weights' provenance and licence before wider deployment.
- Compare actual numerical benchmarks on real P1–P6 handwriting before
  relying on recognition to grade or mark answers.

## Build

The feature-branch workflow `.github/workflows/build-comer-beta.yml`
fetches and SHA-verifies model assets at build time and vendors compatible
WebAssembly binaries. Browser inference is local and same-origin.

```sh
bash scripts/build-comer-vendor.sh
```

Model files are purposely **not** downloaded from a third-party host
at runtime. No CROHME source dataset is deployed.

## Quick test matrix

- Desktop Chrome: 23+17=40, 3/4, 125×4, a+b=c, and 97 kg.
- Select Math formulas explicitly. Check signs, fraction bars, and scripts.
- Toggle CoMER OFF: original recognizer must work.
- Cancel before Apply: original strokes must remain.
- Apply and Undo: original strokes restored.
- Close the panel during processing and switch mode: no stale prediction.
- Make sure GitHub Pages only requests resources from its own origin.
- Android/Chromebook: large-expression recognition, speed, memory and layout.

The CoMER Lab is **not proof of correctness** until the above browser checks pass.
