# Local Read Aloud voices

This directory contains the standalone fallback speech engine used by Classroom
Companion's Read Board feature. It synthesises PCM audio in a Web Worker and
loads only same-origin files. The built-in engine never uploads document text.
The reader prefers a matching local device voice when one is available; these
built-in formant voices ensure English, Mandarin Chinese, Malay and Tamil still
work when the device has no matching voice installed. Formant speech sounds more
synthetic than the device's natural voices.

Mandarin automatic mode prefers recognised adult female device voices (such as
Huihui, Yaoyao, Xiaoxiao or Tingting), with natural/enhanced versions ranked first.
Automatic mode uses only local device voices. If no recognised female voice is exposed,
it uses the bundled `cmn+f2` female variant at pitch 48 and volume 92, instead of
guessing that an unnamed Mandarin voice is female. The Chinese edition defaults
to 0.85× speed; teachers can still change the speed and choose another voice.
This calmer female preset retains the synthetic sound of eSpeak. Other languages keep their existing
voice and speed defaults.

The Chinese voice chooser also lists Mandarin voices exposed by the browser,
including online voices. Online voices are labelled and used for board/document
reading only after the teacher explicitly selects one. Previews always use the
same fixed example sentence, never the document or board text. A versioned local
preference stores only voice identity and pace, not reading text. Stable voice
identity avoids switching speakers when the browser reorders its voice list.
If a saved voice is missing, the reader asks for another choice. A failed sample
does not substitute another speaker; a failed normal read has a visibly labelled
built-in backup. Preview response times identify slow voices for automatic mode.
Availability and sound depend on voices provided by the browser/device. This
chooser adds no neural model, API credentials, or app-hosted speech endpoint.

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
