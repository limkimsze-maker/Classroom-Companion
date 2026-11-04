# Music Score Studio — AI specialist team

This playbook coordinates AI-assisted enhancement of Music Score Studio in this repository. It does not create separate running agents by itself. Use these roles as consecutive independent review passes, or delegate them to separate agents where a capable orchestration environment exists.

## Coordinator
- Locate and inspect the latest `music-score-studio/index.html` and relevant `ai/` files before making changes.
- Restate the specific request and determine what *must not* change.
- Assign reviews to the Subject, Curriculum, Developer and Quality specialists as relevant.
- Apply the smallest change that meets the request. Review the resulting diff before publishing.
- Never claim a live deployment or browser test without verifying it.

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
