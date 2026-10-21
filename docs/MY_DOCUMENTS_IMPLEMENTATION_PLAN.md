# My Documents — implementation plan (manual save)

Status: **planning only; not deployed**. Branch: `feature/my-documents-manual-save-plan-20261021`, based on approved freeze `918415e4868c149783068126935750b907541564`.

## Non-negotiable preservation
- Never change frozen branches or approved snapshot.
- Do not modify recognition, comparison, three-bar detection, segment guides, brackets, speech-to-text, insertion, clear-panel, or whiteboard drawing behavior.
- Frozen V2 HTML does not load later speech-to-text; do not silently change that. Preserve its existing implementation elsewhere.
- Integrate on isolated feature branch; test before user-approved merge.

## User choice
Manual saving only: uploading opens document normally; nothing persists in library until user explicitly selects **Save to My Documents** and the save transaction completes.

## MVP
1. Separate IndexedDB `classroom-companion-documents` with `documents` object store: stable UUID, filename, MIME type, size, createdAt, updatedAt, lastOpenedAt, folderId, favourite, checksum, Blob, deletedAt.
2. **My Documents** panel with search, recently opened, sorting, favourites, folders, file counts and storage estimate.
3. Save currently opened original file via a small document-loader adapter; retain a reference to the original Blob/File without altering document rendering. Reopen using the existing loader; release object URLs appropriately.
4. Delete with confirmation to Recycle Bin; restore; permanent delete; bulk selection.
5. Detect duplicate content by digest, offering Keep Both or Cancel; never silently overwrite.
6. Export/import library backup with manifest, files and validation. Browser data is not a guaranteed backup; offer storage persistence where supported.
7. Surface quota/storage failures and handle unsupported or private-mode browser limitations.

## Performance and constraints
- No arbitrary document-count cap; limited by device/browser quota and file sizes.
- Store binary Blob in IndexedDB, never `localStorage` or data URI; list metadata without loading document contents.
- Use pagination or virtualization for large collections; indexes for names, folder, last opened, deleted and favourite.
- Original file saving only in MVP; annotations and whiteboard state are separate, later opt-in features.
- No cloud, server costs, or cross-device sync.

## Stages and verification
A. Read and document existing PDF/Office/image loader and lifecycle; capture baseline comparison (2 and 3 bars), segment, and speech-to-text behavior where present.
B. Implement IndexedDB repository with unit tests for add/retrieve/rename/search/delete/restore/quota/duplicates.
C. Build My Documents UI and integrate with document loader using isolated adapter, not changes to recognition modules.
D. Test Chromebook, Android and desktop; large file, 100+ documents, offline reopening, browser refresh, data clearing warnings, backup restore.
E. Compare against baseline and get explicit user approval before deployment.

## Acceptance criteria
- Upload alone does not save.
- Save button stores file and reports success only after IndexedDB commit.
- Reopen original without reupload; rename, favourite, folder, search, delete and restore work.
- 2/3-bar comparison, segments, speech-to-text (where present), and existing drawing/document annotation workflows show no regressions.
- Approved freeze branch remains untouched.
