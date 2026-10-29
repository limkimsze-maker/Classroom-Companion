# Local Read Aloud voices

This directory contains the standalone fallback speech engine used by Classroom
Companion's Read Board feature. It synthesises PCM audio in a Web Worker and
loads only same-origin files. The built-in engine never uploads document text.
The reader prefers a matching local device voice when one is available; these
built-in formant voices ensure English, Mandarin Chinese, Malay and Tamil still
work when the device has no matching voice installed. Formant speech sounds more
synthetic than the device's natural voices.

Chinese reading uses the browser-provided **Google 普通话（中国大陆）** voice
without a voice chooser. It ignores previous saved voice choices, retains the
chosen reading pace, and reads whiteboard/document text through that Google
voice. The panel labels it as online and explains that reading text is processed
by the browser-provided Google speech service. No API credentials or neural
model files are added.

The browser must expose that voice. A short cancellable wait handles a voice
list that is still loading. When the voice is unavailable or playback fails,
the reader displays a message instead of substituting another speaker. English,
Malay and Tamil retain their existing device voices and built-in fallbacks.

## Pinned source and licence

- Spellophone: `@spelling-creator/spellophone` **0.2.1**, GPL-3.0-or-later.
- Underlying eSpeak NG: **1.52.0**, GPL-3.0-or-later.
- Spellophone source and reproducible build instructions:
  https://github.com/Spelling-Creator/spellophone
- eSpeak NG corresponding source:
  https://github.com/espeak-ng/espeak-ng/tree/1.52.0
- The distributed licence is in `LICENSE-GPL-3.0.txt`.
- Published package archive:
  https://registry.npmjs.org/@spelling-creator/spellophone/-/spellophone-0.2.1.tgz
- Archive SHA-256:
  `87b689c9676ad68170133a4f230302d892a036e68b38aa7c08c0219a06763544`
- npm integrity:
  `sha512-VIqceoh9+mdm63S2pY1FGGVH5nateiLZY0PoD+ADFqKWl+zYLnY13zeywVDzc/w+hv9uLTItSC96sHbHBiNPtA==`

## Reproducing the vendored subset

Unpack the pinned package. Copy `dist/browser.js` and
`dist/core-w4y-vCu9.js` here, removing their source-map comments. Change the
browser module's import from `../wasm/espeak-ng.js` to `./espeak-ng.js`.
Copy `wasm/espeak-ng.js`, `wasm/espeak-ng.wasm`, the package `LICENSE`,
`espeak-ng-data/core.bin.gz`, and the `en`, `cmn`, `ms`, `ta` dictionary `.gz`
files. Copy `espeak-ng-data/manifest.json`, retaining only those four entries in
its `dictionaries` object. Engine code, core data and pronunciation dictionaries
are otherwise unchanged. `worker.js` is the small app-owned message adapter.

The fallback assets total approximately 1.6 MB; only the chosen language's
pronunciation dictionary is downloaded on demand. No paid API, account, browser
extension or device installation is required.
