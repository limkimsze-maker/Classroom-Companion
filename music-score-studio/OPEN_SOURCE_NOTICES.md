# Music Score Studio — Open-source notices (2026-11-04)

This notice applies to `music-score-studio/` only. It **does not automatically change the licensing of other tools** in the Classroom Companion repository.

## License and source

**Music Score Studio original code and adaptations:** © 2026 Lim Kim Sze. Original Studio contributions are made available under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. This grant concerns contributions for which Lim Kim Sze holds the necessary rights; it does not purport to license material owned by others without their permission. The full source for this application is published at https://github.com/limkimsze-maker/Classroom-Companion/tree/main/music-score-studio. Read the license at `LICENSE`. Existing copyright statements and separate licenses of third-party materials remain intact.

**AI music reader:** Modified from [Partsong](https://github.com/pzfreo/partsong) © 2026 Paul Fremantle. Partsong incorporates [homr](https://github.com/liebharc/homr) by Christian Liebhardt and [homr-rs](https://github.com/pzfreo/homr-rs). The reader and modifications are AGPL-3.0; the complete modified web source and licensing notices are at `ai/`, with rebuild instructions in `ai/SOURCE.md` and `ai-bridge-patch.py`. Changes include a same-origin photo/MusicXML bridge, progress reporting, adapted UI and removal of optional analytics.

**Noto Music:** The fixed vector treble and bass clef outlines in the editor derive from Noto Music (The Noto Project Authors), licensed under the SIL Open Font License 1.1. The notice and complete OFL text are included in `NOTO_MUSIC_OFL.txt`, with the original source at https://github.com/notofonts/music.

Other third-party components retain their own terms: OpenSheetMusicDisplay (BSD-3-Clause), ONNX Runtime Web (MIT), pdf.js (Apache-2.0), and the original Partsong dependencies listed in its About screen and README.

## Your rights

Under AGPL-3.0, users may inspect, run, modify and redistribute the covered software on the license terms. This software is provided **without warranty**, to the extent permitted by law. Review the complete license for your rights and obligations, including source-code availability and disclosure of changes.

**Upstream projects do not endorse this fork.** Credits acknowledge code provenance, not ongoing involvement or responsibility.

Model-weight rights and their training datasets require separate attention: homr's maintainers discuss potential limitations in [their license FAQ](https://github.com/liebharc/homr/blob/main/LICENSE_FAQ.md). The app should not be represented as having a legal clearance opinion for all model-training material.

## Source and license locations

- [Music Score Studio source](https://github.com/limkimsze-maker/Classroom-Companion/tree/main/music-score-studio)
- [Full AGPL-3.0 license](LICENSE)
- [Reader source and build/modification record](ai/SOURCE.md)
- [Reader's own license](ai/LICENSE)
- [Rebuild workflow](https://github.com/limkimsze-maker/Classroom-Companion/blob/main/.github/workflows/build-music-studio-omr.yml)
- [Noto Music OFL notice](NOTO_MUSIC_OFL.txt)

This is a good-faith licensing notice, **not legal advice**. The exact reach of AGPL to a larger software combination and the completeness of independently rebuildable WASM corresponding source have not been assessed by counsel.
