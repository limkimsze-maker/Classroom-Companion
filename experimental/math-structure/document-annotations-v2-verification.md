# V2 document annotation verification — 21 October 2026

Baseline: `504e2230ed5c1c6b240acf6509066611c9d21f87`.

The original 42-check document browser suite reproduced 27 failures in the
previous implementation. The corrected implementation passes 72 unique
document checks: 60 desktop/mobile checks across seven document categories,
plus 12 checks covering audio and video previews. The existing jog-dial document suite, learning import/export tests, and shipped
handwriting browser checks and mathematical symbol/learning controls pass.

## Corrected behavior

- Pen points, stroke thickness, image/text bounds, font size and retained
  original handwriting use the rendered document as their coordinate frame.
- PowerPoint uses the actual rendered slide, including its fit and zoom.
- Word annotations attach to the continuous content rather than a numbered
  viewport slice that changes meaning with zoom.
- Hand panning preserves the renderer's own transforms for every preview.
- PDF pages, PowerPoint slides and spreadsheet sheets retain separate notes
  and Undo histories. Returning to the whiteboard restores its earlier content
  and Undo history.
- Beautified equations remain aligned after zoom, panning, viewport resize and
  page navigation; Undo restores the original ink in the current view.
- HTML previews permit same-origin geometry inspection while keeping scripts
  disabled by the iframe sandbox. Their internal scroll offset moves the ink.
- Settings is pinned to the top-right of the header. The blue Learn button is
  directly below Apply, and the guide describes the current separate actions.

## Reproduce

Use Node 22 and Playwright 1.55.0 with Chromium installed:

```sh
node experimental/math-structure/test-signs-v2.cjs
node experimental/math-structure/test-symbol-learning-v2.cjs
node experimental/math-structure/test-document-anchors-v2.cjs
node experimental/math-structure/test-shipped-browser.cjs /tmp/v2-browser
```

The document test opens the bundled PDF, DOCX, PPTX, XLSX, SVG, text, HTML,
WAV and WebM fixtures in the actual local renderers at 1365×900 and 390×844.
It compares document-relative geometry independently of the production
coordinate-conversion helper. It also performs real pen gestures, Beautify,
Apply, page changes, Undo, and Settings UI checks. Fixtures are synthetic.
Set `DOCUMENT_TEST_OUTPUT` to save browser screenshots.

`.github/workflows/v2-document-annotations.yml` repeats these checks after
relevant pushes and pull requests.

## Scope and preservation

The V2 HTML loads separate document, gesture and Smart Math controllers.
The existing V1 HTML and its document/gesture/Smart Math source are unchanged.
The mathematical recognizer, UJI V1/CROHME resources and training data are
unchanged. The browser-only document-rendering and connection restrictions
remain in place.

Annotations are retained for navigation within the currently open document
session. Closing/reopening a document or reloading the page does not restore
them. Unknown browser-native previews and legacy DOC/PPT formats are not
covered by the reliable-format tests.
