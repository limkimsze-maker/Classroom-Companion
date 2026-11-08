# Music Score Studio — Independent AI Team (proposed)

A **GitHub Actions** review coordinator for Music Score Studio pull requests. This is separate from the live music app, its HTML, and your ChatGPT Project/plugin.

## What one review run does

1. The Project Manager loads the chosen open PR and the actual changed-file patches, with source excerpts from that PR's exact commit.
2. Four **independent API calls** run the Music Subject, Curriculum, QA and UI/UX reviews. None sees another reviewer's findings.
3. A Developer Correction Planner turns unresolved findings into a prioritised engineering checklist (without changing code).
4. A separate Project Manager AI call consolidates evidence, disagreements, missing tests and release readiness.
5. One consolidated report, including all four original reviews and the developer checklist, appears as a **comment on the pull request**.

**No automatic merging, approval, deployment, PR modifications, test execution from the PR, or publication.** This workflow does *not* communicate with separate ChatGPT conversations; instead, the specialists communicate through the automated coordinator and its GitHub report.

## First-time setup — owner action needed

1. Review and approve the **separate automation installation pull request**. Merging this infrastructure PR is required before GitHub lists its workflow. It does not change Music Score Studio's HTML or deploy PR #64 or #65. Your usual GitHub Pages build might still run on a merge to main.
2. Create a separately billed OpenAI API key at https://platform.openai.com/api-keys . ChatGPT Plus is not API billing. Set your own API spending limits. **Never paste your key into ChatGPT, issues or source code.**
3. In GitHub: **Classroom-Companion → Settings → Secrets and variables → Actions → New repository secret**. Name it exactly OPENAI_API_KEY and paste the key there.
4. In GitHub: **Actions → Music Studio - independent AI review → Run workflow**. Enter PR number **64** first. Once settled, run against **65**. The workflow posts its consolidated review as a PR comment.
5. Optional: under **Actions → Secrets and variables → Actions → Variables**, set MUSIC_STUDIO_AI_MODEL to an API model accessible to your account (default: gpt-6.1-terra).

The workflow is **manually triggered**, not every commit, to prevent unplanned API charges. It needs a paid API account, Actions enabled, and a repository workflow merged to main to run. API and GitHub privileges determine whether commenting succeeds.

## Security and limitations

- Credentials are GitHub Actions secrets, never stored in repository code.
- The runner checks out **trusted main** and does **not** fetch or execute PR scripts with credentials. PR source is fetched as *data*, with its instructions explicitly treated as untrusted.
- Source changes beyond music-score-studio/ or an excessively large or incomplete PR are rejected or treated conservatively.
- The workflow's Python unit tests test orchestration logic only. They do **not** prove actual music playback, visual display, ABRSM conformance, OCR accuracy, imported score timing or accessibility.
- Reviews come from four **separate model calls using distinct instructions**, not four separately trained models or humans. Their judgments may share model-related blind spots.
- The release gate is conservative. A single REQUEST CHANGES or missing source blocks merging; even unanimous approval still requires real device and music playback testing and your explicit approval.
- For changes in either PR #64 or #65, rerun to review the new exact commit. Avoid mixing both until each is reviewed and the developer has tested their combined behaviour.
- The AI coordinator does not itself create code fixes. It supplies a written correction plan for your developer and produces the PR comment so you no longer have to relay specialist reports.

## Files

- review.py — independent reviewers, developer correction planner, manager and GitHub PR comment integration, using only Python standard library.
- test_review.py — offline orchestration/regression tests.
- .github/workflows/music-studio-agent-review.yml — manual GitHub Actions trigger (proposed installation).

## Usage outside Actions (advanced)

With OPENAI_API_KEY, GITHUB_TOKEN and GITHUB_REPOSITORY set in a trusted execution environment:

    python music-score-studio/agent-team/review.py --pr 64

Do not put credentials in a local file committed to GitHub.

## Cost and ownership

Each review typically creates **four independent specialist calls**, **one manager call**, and (if corrections/testing are requested) **one developer correction-planner call**. Tokens and costs depend on the diff and model; no exact cost is guaranteed. Review the API usage dashboard after your first run.
