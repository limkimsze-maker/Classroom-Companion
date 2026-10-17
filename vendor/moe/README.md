# MOE-safe local document engines

These pinned browser bundles are served from this repository so the Classroom Companion MOE Safe Beta does not fetch third-party code at runtime.

- PDF.js 3.11.174 — PDF rendering — Apache-2.0
- Mammoth 1.8.0 — DOCX to HTML — BSD-2-Clause
- SheetJS xlsx 0.18.5 — spreadsheet parsing — Apache-2.0
- @aiden0z/pptx-renderer 1.3.0 browser ESM — PPTX rendering — upstream licence

The PowerPoint viewer is configured with pdfjs:false so optional external PDF.js fallback resolution is disabled.
