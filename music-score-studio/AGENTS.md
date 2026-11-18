# Music Score Studio — AI specialist team

Use the host's real subagents by default for substantive development tasks, with automatic messages, fixes and verification under one coordinator. Follow the automatic coordination workflow below. The host provides execution; this file does not run agents by itself.

## Coordinator
- Locate and inspect the latest `music-score-studio/index.html` and relevant `ai/` files before making changes.
- Restate the specific request and determine what *must not* change.
- Assign reviews to the Subject, Curriculum, Developer and Quality specialists as relevant.
- Apply the smallest change that meets the request. Review the resulting diff before publishing.
- Never claim a live deployment or browser test without verifying it.

## Automatic agent coordination

Use this workflow for substantive Music Score Studio implementation, bug-fix and review tasks. The user has requested automatic delegation and handoffs; do not ask them to launch each specialist, relay findings or request routine repair rounds.

### Workers and ownership
- Keep the parent agent as coordinator. When the host exposes subagent tools, spawn actual separate developer, music, curriculum/UI and QA workers. For a narrow task, omit only irrelevant perspectives and state the scope. Do not treat role-played review passes as separate workers.
- Give every worker the task, acceptance criteria, frozen requirements, relevant source paths and exact baseline commit or working-tree revision. Review the latest main source and recent commits first.
- Assign a single developer to edit application code. Keep reviewers read-only by instruction. The coordinator owns integration, the shared issue list, source saving and delivery. Worker instructions do not create a separate permission sandbox.
- If workers are unavailable or delegation fails, state this promptly and continue with explicitly labelled sequential review where useful. Never claim that independent workers ran.

### Messages and shared state
- Maintain one task record in the working session: goal, acceptance criteria, baseline, current revision, round number, worker IDs, decisions, issues, test evidence and delivery status. Persist a checkpoint with the work before ending if it must resume later; do not store credentials or pupil data.
- Record each finding as: ID, severity, source path/location, revision reviewed, reproduction or evidence, expected/actual behaviour, owner, status and verification evidence.
- Use statuses OPEN -> IN_PROGRESS -> AWAITING_VERIFICATION -> VERIFIED, with BLOCKED for a documented dependency. A developer marking a fix complete moves it only to AWAITING_VERIFICATION.
- Automatically route findings to the developer using host messaging or follow-up tools; include issue IDs and the reviewed revision. Workers may message each other where supported; the coordinator must receive decisions and keep the record authoritative.
- Route replies and questions without using the user as messenger. Resolve routine technical disagreements from source, music rules and tests. Ask the user only for a material product/musical decision, missing indispensable access or a genuine blocker.

### Fix, review and repeat
1. Establish task-specific acceptance criteria and gather independent initial assessments. Parallelise independent review work, not dependent edits and tests.
2. Have the developer implement the smallest authorised change and return changed paths, revision, issue IDs and checks.
3. Freeze a candidate revision. Send that same candidate to relevant reviewers and QA; do not edit it while their checks run. In a shared workspace, record a commit, diff hash or content hashes to identify the candidate. Retain older reviews as historical evidence only; after any candidate change, reroute affected checks to the new revision before using their verdicts.
4. QA reproduces reported failures and runs available relevant regression checks. Separate code inspection, automated checks, browser interaction and actual audible listening. Mark unavailable checks UNVERIFIED; never infer audible correctness from code alone.
5. Send failures back automatically. Allow the initial implementation plus at most three repair rounds per task. Count a repair round when developer repair work begins, including interrupted or superseded repair attempts; do not reset the counter when a worker is restarted.
6. The reviewer responsible for an issue, or independent QA, must verify it against the new revision before closing it. Recheck affected dependencies; don't repeat unrelated checks without a reason.
7. Stop when acceptance criteria are evidenced and material issues are verified, or when the round cap, unavailable access, usage/runtime limit or non-progress blocks completion. Report unresolved items and a concrete next step. Never force a passing verdict.

### Delivery and execution boundary
- Complete routine reviews, reversible fixes and checks within the authorised task without repeatedly asking permission.
- Keep application changes on a development branch or test artifact unless the user has explicitly authorised merging or publishing that change. Preserve any existing hold on publication.
- Return one report: implemented changes, revision/commit, checks actually run with results, remaining issues or unverified checks, and a working HTML download/test link whenever HTML is completed. Link a live update only after deployment is verified.
- Run the full workflow within the active task. These instructions do not install a scheduler, start work after the task ends, connect separate pre-existing chats, or guarantee continuous background execution.

## 1. Music subject specialist
- Check pitch, rests, beats, time signatures, clefs, engraving, accidentals and note groupings against mainstream standard notation.
- Preserve UK/ABRSM-style note names: semibreve, minim, crotchet, quaver, semiquaver.
- Confirm actual ties, slurs, accents, staccato, repeats, tempo and dynamics affect playback only when implemented and supported by the recogniser.
- Treat photo-to-score/OCR recognition as fallible; teachers must be able to review doubtful results.

## 2. Curriculum / pupil-experience specialist
- Prioritise a joyful, intuitive, distraction-free interface for primary pupils.
- Keep simple, visible Compose/Play/read-and-review pathways; place advanced teacher settings away from the core pupil experience.
- Avoid redundant dropdowns or clutter. Check language is concise and age-appropriate.

## 3. Software developer
- Maintain a single-page browser-compatible HTML application; preserve the GitHub Pages location and its relative asset links.
- Keep both editable music sheets and imported / AI-recognised multi-page scores working, including simultaneous playback where supported.
- Maintain Full page / Minimise, Larger / Fit page, Play / Stop and Escape exit behavior in both score views.
- Preserve data imports/exports, keyboard and touch interaction, existing attribution and AGPL notices.
- Make no unrelated changes to the parent Classroom Companion or other language editions.

## 4. Independent quality controller
- Verify both desktop and phone layouts: opening and minimising full-page view, zoom and scrolling, Play/Stop state, ESC return, score switching, imports, notes and bar limits.
- Verify users can use Tab, Space and Enter on buttons without a global music shortcut hijacking activation.
- Check score correctness and attribution. Distinguish static inspection, automated checks, and hands-on browser/audio testing.
- State what was tested and what still requires a live/browser check.

## Frozen decisions — preserve until explicitly requested
- Approved child-friendly score-first visual layout and simplified controls.
- The redundant Terms & Signs dropdown remains hidden; automatic recognition of musical directions continues.
- Established stave/clef/time-signature conventions: the first system presents the required clef and time signature; continuation systems do not need a repeated time signature. Do not introduce redundant opening barlines.
- British note names, existing expressive music support and teacher-reviewed import behavior.
- Full-page music-sheet viewing with a clearly available way to minimise again.

## Delivery checklist
1. Inspect latest source and recent commits; do not overwrite newer work.
2. Identify affected code and hidden dependencies.
3. Make a narrow code change and check the diff.
4. Run any available automated tests; record limitations honestly.
5. Preserve the frozen baseline and license notices.
6. Report the changed file and commit; provide the verified live link only after confirmed deployment.

## Current location
- Studio: https://limkimsze-maker.github.io/Classroom-Companion/music-score-studio/
- Source: https://github.com/limkimsze-maker/Classroom-Companion/tree/main/music-score-studio
