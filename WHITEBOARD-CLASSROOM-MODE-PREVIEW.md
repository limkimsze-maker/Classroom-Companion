# Whiteboard Smart · Classroom Mode (implementation preview)

**Authoring goal:** extend Classroom Companion without altering the running Math Fluency Arena or the original, locally secured Whiteboard Smart Beta. **Status:** interactive front-end demo and undeployed backend source. **Not school-approved, production tested, or deployed.**

## Included files

- `whiteboard-classroom-mode.html`: one-file teacher/pupil/projector front end. Demonstration works without a server (pupil activity in teacher demo is explicitly simulated). Live multi-device sessions work only after deploying the Worker.
- `whiteboard-smart-with-classroom-button.html`: safe optional launch **wrapper** that embeds the existing `whiteboard-smart-beta.html` and adds an external Classroom Mode button. The existing beta source is not modified. This wrapper only works after these files are placed alongside the existing beta in the same website.
- `whiteboard-classroom-launch-button.js`: optional button injector for a separate development copy of the existing Whiteboard Smart. Do **not** load it in a frozen build without review.
- `worker/src/index.js`: independent Cloudflare Worker + Durable Objects code.
- `worker/wrangler.toml`: Cloudflare deployment configuration, **SQLite-backed** Durable Objects with `new_sqlite_classes`.

## What works in preview

Teacher: start 45-pupil simulated demo; choose fill-in, 2–4 option MCQ or True/False; crop a question from an image; on the actual Classroom Companion site, use its existing self-hosted PDF.js engine to crop the first PDF page; set a timer and three display modes; launch; inspect a 45-tile status overview; inspect working and replay strokes; show an anonymous replay in the preview/modal; download CSV report; open a separate projection window.

Pupil: join separate live class after backend deployment, or open a local drawing demo; pen, eraser, colours, stroke thickness, undo/redo, clear; typed answer/MCQ/True-False; feedback for attempts.

Projector: separate window in Extend Display; receives question and teacher-triggered stroke replay in live mode. Projection token grants display access only, not teacher dashboard access.

## Cloudflare setup (requires your own explicit login)

1. Do not use the Math Fluency Arena Worker, hostname, or Durable Object binding. These are separate resources.
2. In a terminal with Node.js and Cloudflare Wrangler, go to `worker/`. Run `npx wrangler login` (browser authorisation required).
3. Run `npx wrangler deploy`. Wrangler creates a new Worker `whiteboard-classroom-live` and **two independent SQLite-backed Durable Object namespaces**. Cloudflare may require the user to confirm account/subdomain details. Read costs/quotas before deployment.
4. Copy the new `https://...workers.dev` Worker URL into the **Teacher > Classroom Worker address** field. This URL is saved in the teacher browser's local storage (not a pupil's answer key).
5. Upload `whiteboard-classroom-mode.html` into the *root* of `limkimsze-maker/Classroom-Companion` alongside existing `whiteboard-smart-beta.html`, and leave `vendor/moe/pdf.min.js` and `vendor/moe/pdf.worker.min.js` in their original paths. GitHub Pages then provides `https://limkimsze-maker.github.io/Classroom-Companion/whiteboard-classroom-mode.html` **only after you commit and publish it**.
6. On a reviewed development copy of Whiteboard Smart Beta only, include `<script defer src="whiteboard-classroom-launch-button.js"></script>` near the end of its HTML (and upload the JS alongside it), or use the wrapper HTML without changing the beta at all.
7. For testing, use harmless sample worksheets and non-identifiable pupil labels, and 2 devices first, then test 45 simultaneous pupil connections, Wi-Fi blocking/reconnection, session ending, and Cloudflare usage limits.

## Security and privacy notes

- Your existing `whiteboard-smart-beta.html` intentionally blocks outbound app connections for MOE-safe local documents. It has **not** been changed. The new Classroom Mode **does** transmit the selected question crop, answers and pen-stroke history to a new Cloudflare endpoint in live mode. The full uploaded worksheet remains local to the teacher browser.
- The teacher answer key is checked by the server; public question payloads omit it. Teacher and projector have **separate randomly generated access tokens**; student work is sent to the teacher, not broadcast to all pupil devices.
- Sessions expire after six hours, and the teacher can end a room. The backend caps each room at 45 pupils and has a configurable initial limit of 20 concurrent public rooms. All values can be changed in the Worker source before deployment.
- **Not independently audited:** Do not use identifiable pupil records or protected school materials until school/MOE cybersecurity, privacy, DLP, consent and vendor approvals are obtained. Further testing and hardening are necessary for school deployment, including rate limits, login/teacher identity, long-session storage sizing, accessibility, browser compatibility, usage metering, and penetration testing.
- **No guarantee of free operation:** Cloudflare Durable Objects/Workers quotas may be shared with other projects in your account; use spending controls and monitor dashboard usage.

## Development notes / outstanding limitations

- This is a usable interactive prototype; it is **not** a 45-device test result. The teacher demo shows **simulated** pupil tiles and responses. Multi-device communication depends on successful Cloudflare deployment and network permissions.
- PDF rendering uses the existing same-origin `vendor/moe/pdf.min.js` and `pdf.worker.min.js` *when hosted in Classroom Companion*. In a standalone downloaded HTML preview, use a screenshot/image rather than a PDF.
- Current demo creates one active question at a time and displays only PDF page 1; multi-page PDF question picker, multiple-question lesson archive, role-based audit logging, and richer analytics are follow-up engineering tasks.
- Stroke replay stores operation events (including corrections), and drawing history is retained within a session. Pen movement is updated after each stroke, not streamed continuously while the pen is held down.
- Explicitly preserving the original Math Fluency Arena is a design constraint. No files from Math Fluency Arena have been edited or deployed.

## Quick test without Cloudflare

Open `whiteboard-classroom-mode.html`, click **Try demo**, then **Launch question**, click a pupil tile, then **Replay** or **Project replay**. To test pupil drawing in the same file, click **Pupil** then **Open demo working board**. This does not connect across 45 laptops, which requires the new Worker.