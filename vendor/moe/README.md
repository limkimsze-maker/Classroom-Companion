# MOE-safe local document engines

These browser bundles are pinned and served from this repository so the Classroom Companion MOE Safe Beta does not fetch third-party code at runtime.

- Mammoth 1.8.0 — DOCX to HTML — BSD-2-Clause
- SheetJS xlsx 0.18.5 — spreadsheet parsing — Apache-2.0
- @aiden0z/pptx-renderer 1.3.0 browser ESM — PPTX rendering — see upstream licence

The PowerPoint viewer is configured without optional PDF.js fallback, so it does not attempt external runtime resolution.
