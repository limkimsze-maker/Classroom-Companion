# Classroom Companion — MOE-safe local document review build

Date: 17 Oct 2026
Scope: `whiteboard-smart-beta.html`

## Purpose

This beta is intentionally hardened for review of the local-document workflow. Selecting a supported teaching file gives browser-side code access to that file for rendering, but the Classroom Companion application does not transmit the selected document to an upload endpoint or third-party document service.

## Supported local formats

- PDF
- Word: DOCX
- PowerPoint: PPTX, PPTM, PPSX, POTX
- Spreadsheets: XLSX, XLS, XLSM, XLSB, ODS, CSV
- Images supported by the browser
- HTML and plain-text formats
- Browser-supported audio/video formats

Legacy `.doc` and `.ppt` are not claimed as reliable in this review build.

## Review-build controls

1. **Local browser file access only**
   - Files are obtained through the browser File API.
   - PDF, Word, PowerPoint and spreadsheet bytes are passed directly to browser-side renderers as `ArrayBuffer` data.
   - Images/media and browser-native previews use local `blob:` object URLs where appropriate.
   - The review build has no document-upload endpoint.

2. **Document engines are pinned and self-hosted**
   - PDF.js 3.11.174, Mammoth 1.8.0, SheetJS xlsx 0.18.5 and @aiden0z/pptx-renderer 1.3.0 are stored under `vendor/moe/` in this repository.
   - The browser does not retrieve these engines from jsDelivr, npm or another third-party CDN at runtime.
   - PowerPoint rendering is configured with `pdfjs:false` so its optional external PDF fallback is disabled.

3. **Third-party analytics removed from the beta**
   - Counter.dev is not loaded by `whiteboard-smart-beta.html` in MOE-safe mode.

4. **Outbound application connections blocked**
   - The page Content Security Policy sets `connect-src 'none'`.
   - The local-only guard disables application calls through `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource` and `navigator.sendBeacon`.
   - Scripts, workers, images, media and frames are restricted to the same GitHub Pages origin plus browser-local `data:`/`blob:` resources as required.

5. **Document bytes are not persisted by the document viewer**
   - The viewer does not write selected document bytes to `localStorage`, IndexedDB, cookies or a backend.
   - Per-page whiteboard annotations are held in an in-memory `Map` for the current document session.
   - Local `blob:` URLs are revoked when replaced or closed.
   - Closing the browser tab releases browser-session memory.

6. **Existing teaching logic remains separate**
   - Smart Math and the frozen bar-model files are not modified by this security hardening.
   - A pre-hardening rollback snapshot exists on branch `working-baseline-frozen-2026-10-17`.

## Suggested verification for ETD

Use harmless sample files rather than protected MOE material for the technical demonstration.

1. Open Chrome DevTools → Network and let the app finish loading its own static assets.
2. Clear the Network log.
3. Open a sample PDF, DOCX, PPTX and XLSX with **Open File**.
4. Navigate pages/slides/sheets and annotate with the whiteboard tools.
5. Confirm there is no request containing document bytes and no request to an upload/document-conversion service.
6. Confirm the document engines resolve only from the same Classroom Companion GitHub Pages origin; there should be no jsDelivr/npm document-engine request.
7. After the page and its static app assets have loaded, disconnect the network and repeat with a local sample document. Browser-side document rendering should continue for formats whose required engine assets are already loaded/cached.
8. Inspect the page source/CSP and the `vendor/moe/` directory as independent evidence of the constrained design.

## Important policy caveat

This technical design does not override MOE DLP policy. A managed device may still classify selecting a protected file on an external-origin webpage as “FILE UPLOAD TO WEB” even when application code does not transmit the file. The purpose of this build is to give ETD a constrained implementation that can be independently reviewed and, if appropriate, considered for an approved exception or deployment route.
