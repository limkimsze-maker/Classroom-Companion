# Music Score Studio – modified Partsong reader: source and license notices

This directory is the **Classroom Companion-adapted** on-device music recogniser. It is a modified copy of **Partsong**, © 2026 Paul Fremantle, which incorporates the **homr** and **homr-rs** projects. The reader and modifications are distributed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**, without warranty. Original authors retain their copyrights.

## Source available to users

- **This modified reader:** https://github.com/limkimsze-maker/Classroom-Companion/tree/main/music-score-studio/ai
- **Entire Music Score Studio (including the calling score editor):** https://github.com/limkimsze-maker/Classroom-Companion/tree/main/music-score-studio
- **License copy:** https://github.com/limkimsze-maker/Classroom-Companion/blob/main/music-score-studio/ai/LICENSE
- **Local integration patch:** https://github.com/limkimsze-maker/Classroom-Companion/blob/main/music-score-studio/ai-bridge-patch.py
- **Rebuild / distribution workflow:** https://github.com/limkimsze-maker/Classroom-Companion/blob/main/.github/workflows/build-music-studio-omr.yml
- **Original Partsong source, fixed upstream revision:** https://github.com/pzfreo/partsong/tree/e7cbd9112763aa31e45abaea2d1bbe09159a8f1b
- **homr (AGPL-3.0):** https://github.com/liebharc/homr
- **homr-rs (AGPL-3.0):** https://github.com/pzfreo/homr-rs

## Modifications to upstream Partsong (2026-11-04 notice update)

Based on Partsong revision `e7cbd9112763aa31e45abaea2d1bbe09159a8f1b` (recorded in the build workflow). Changes made for Classroom Companion:

1. Added a same-origin `postMessage` bridge that accepts classroom photos and returns recognised MusicXML to the host editor (`app.js`); recogniser still runs locally in the browser.
2. Added reading-progress and error events, a CPU-only diagnostics option, and the simplified automatic scan entry point.
3. Removed the upstream optional GoatCounter analytics script, changed the title for the embedded reader and updated About-screen attribution, source links and legal explanations.
4. The separate hosting page (`../index.html`) imports the MusicXML and presents it with teacher-focused score editing and playback controls.

These edits are documented in `../ai-bridge-patch.py`, in the modified source files published in this directory, and in the Git history. Nothing in this notice claims authorship of Partsong, homr or their models.

## How the published reader is assembled

1. The GitHub Actions workflow checks out the fixed Partsong source commit above and copies selected web/OMR files to `music-score-studio/ai/`.
2. `python3 music-score-studio/ai-bridge-patch.py` applies the local modifications to the upstream JavaScript, About screen and source notices.
3. `bash music-score-studio/ai/scripts/fetch-models.sh` fetches the three official homr ONNX checkpoints from its `onnx_checkpoints` release. The published fork also contains the corresponding `.onnx` assets.
4. The `omr/*.wasm` files come from that pinned Partsong revision. Its `omr-rs/` and `scripts/build-omr.sh` sources and build directions are available in the fixed upstream commit above, including its pinned homr-rs dependency. The build is not independently verified as bit-for-bit reproducible here.
5. The workflow verifies required files and publishes the reader. The source links above provide the build scripts, patched source, upstream source and component references.

## Other notices and caveats

- **homr and homr-rs:** AGPL-3.0. homr's model-weight licensing and training-data limitations are described in https://github.com/liebharc/homr/blob/main/LICENSE_FAQ.md.
- **ONNX Runtime Web:** MIT; **pdf.js:** Apache-2.0; **OpenSheetMusicDisplay:** BSD-3-Clause, as credited in the original Partsong About page.
- **Noto Music engraved clefs in the main editor:** SIL Open Font License 1.1, documented separately in `../NOTO_MUSIC_OFL.txt`.
- **No endorsement:** Partsong, homr and their contributors have not been represented as sponsors or maintainers of this adaptation.
- The original Partsong `privacy.html` and `terms.html` are preserved as upstream files; they describe the original Partsong service and should not be treated as terms for this separately hosted classroom adaptation.

**This notice is not a legal opinion.** A compliance review should still check complete corresponding build source for the precompiled WASM artifacts, software-license scope of the host integration and any model-training data rights.

## Automatic printed-term recognition

- The new `ai/expression-ocr.js` is an AGPL-3.0 classroom-specific addition that matches OCR text to recognised musical directions; its source is distributed here.
- **Tesseract.js 5.1.1** (Apache-2.0): https://github.com/naptha/tesseract.js ; loaded only when a photo needs OCR from https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js .
- Photos are interpreted in the user's browser. The JavaScript library and language data must be downloaded initially, but images are not uploaded.
- Printed words and estimated bar positions can be incorrect, and the underlying homr model can still miss small note-level signs. Users can review and correct suggestions in the score player.
