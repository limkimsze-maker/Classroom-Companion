# Classroom Companion — MOE-safe local document review build

Date: 17 Oct 2026
Scope: `whiteboard-smart-beta.html`

## Purpose

This beta is intentionally hardened for review of the local-document workflow. It is designed so that selecting a supported teaching file does not cause Classroom Companion application code to transmit the document to a server.

## Review-build controls

1. **Local browser file access only**
   - The file picker accepts PDF, image and plain-text formats only.
   - PDF and image files are displayed through browser-local `blob:` object URLs.
   - Text files are read with the browser File API (`file.text()`).
   - The review build does not use an upload endpoint.

2. **No third-party document-processing libraries**
   - The previous jsDelivr PDF/Word/PowerPoint/Excel dependencies are not loaded by the MOE-safe beta.
   - PDF display uses the browser's built-in PDF handling through a local `blob:` URL.
   - Office formats are deliberately disabled in this review build.

3. **Third-party analytics removed from the beta**
   - Counter.dev is not loaded by `whiteboard-smart-beta.html` in MOE-safe mode.

4. **Outbound application connections blocked**
   - The page Content Security Policy sets `connect-src 'none'`.
   - The local-only guard also disables application calls through `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource` and `navigator.sendBeacon`.
   - App scripts are restricted to the same GitHub Pages origin by `script-src 'self'`.

5. **Document bytes are not persisted by the document viewer**
   - The document viewer does not write document bytes to `localStorage`, IndexedDB, cookies or a backend.
   - Page annotations are kept in an in-memory `Map` for the current document session.
   - `blob:` object URLs are revoked when a document is closed or replaced.
   - Closing the browser tab also releases browser-session memory.

6. **Existing teaching logic remains separate**
   - Smart Math and the frozen bar-model files are not modified by this security hardening.
   - A pre-hardening rollback snapshot exists on branch `working-baseline-frozen-2026-10-17`.

## Suggested verification for ETD

Use a harmless sample PDF rather than a protected MOE document for the technical demonstration.

1. Open Chrome DevTools → Network and clear the log.
2. Open `whiteboard-smart-beta.html`.
3. Select the sample PDF with **Open File**.
4. Change PDF pages and annotate with the whiteboard tools.
5. Confirm that opening and using the document does not produce a document-upload request.
6. Repeat with the device network disconnected after the page has loaded. The local PDF/image/text workflow and whiteboard annotations should continue without requiring a server connection.
7. Inspect the page source and CSP to confirm that third-party analytics and third-party document libraries are absent from the review page.

## Important policy caveat

This technical design does not override MOE DLP policy. A managed device may still classify selecting a protected file on an external-origin webpage as “FILE UPLOAD TO WEB” even when the application does not transmit the file. The purpose of this build is to give ETD a constrained implementation that can be independently reviewed and, if appropriate, considered for an approved exception or deployment route.
