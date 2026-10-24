# Alpha Word viewer

Alpha reads the original DOCX's section sizes, margins, paragraph and run styles,
tab stops, page breaks, tables, headers, footers and drawing anchor coordinates.
The same importer is used for every DOCX. No question text, document name,
paragraph number or template-specific position is used to lay out a document.

The old Mammoth conversion produced a continuous HTML article. Alpha now uses
the local DOCX page engine and keeps its page count stable through zoom and
viewport changes. Floating drawings use their source extent, rotation, shape
geometry and coordinate reference. Long paragraphs and tables split across
pages after font and tab measurements settle. Saved Word page annotations use
the same relative page coordinates as the other document viewers.

Files are read on the device. Rendering uses an in-memory copy of the package;
My Documents stores the original File bytes. The adapter, engines and compatible
fallback fonts are same-origin assets loaded when a Word file is opened.

Previously saved Word files with continuous-surface annotations retain their
previous viewer geometry so existing notes are not moved. Opening an original
DOCX afresh uses the page viewer. The Beta HTML does not load the new adapter.

Browser DOCX layout is not Microsoft Word's typesetting engine. Missing fonts,
unsupported Office objects and more complex wrapping can still differ. This
change improves the general importer; it does not claim pixel-identical support
for every possible Word feature. Legacy binary .doc files are not DOCX packages.

Run `node scripts/test-alpha-word-layout.cjs` with Playwright Chromium installed.
The synthetic fixtures cover portrait A4, landscape Letter, inherited cleared
tabs, hanging indents, positioned shapes, fields, explicit/cached page breaks,
automatic flowing pages, a long paragraph, a table spanning pages, zoom,
original file byte preservation, and saved annotation reopening on desktop and
mobile. Uploaded teacher documents are not included in the repository.

The release run exposed a pre-existing comparison regression assertion:
`smartOriginal` contains 11 entries instead of 8 for fragmented bars. The same
assertion fails when rerunning unchanged main commit
`6c545579b97e42fe82a7e817b7b16b19386b07d2` (workflow run 39889071476,
rerun job 120766390781). Comparison source files are unchanged by this Word fix.
Independent Word, speech, document and annotation checks continue after this
failure; the comparison assertion and overall failed job status are retained.
