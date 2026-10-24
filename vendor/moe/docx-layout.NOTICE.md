# Local Word layout engine

`docx-layout.js` is vendored from loadfix/docxjs, version 0.4.0, commit
`e04c420dcc11829e5fe71139e585515bcb0901e1` (dist/docx-preview.js).
Upstream: https://github.com/loadfix/docxjs
License: Apache-2.0; see docx-layout.LICENSE.txt.

Local changes, 24 October 2026:

- Honor direct paragraph pageBreakBefore properties as well as style properties.
- Apply the default tab grid after clearing inherited stops, and measure hanging
  indents from the actual paragraph origin.
- Use measured inline tab widths without an extra nonbreaking-space advance.
- Expose the existing standard shape geometry helper to the local adapter.
- Mark PAGE and NUMPAGES field results, section numbering starts and number
  formats for updating after pagination.

JSZip 3.10.1 is vendored separately under its MIT license.
Its original license is in jszip.LICENSE.txt.

The fonts directory contains WOFF conversions of unmodified Liberation and
Carlito fonts distributed with LibreOffice. Their SIL OFL licenses and embedded
copyright notices are included in that directory. These provide local, metric
compatible fallback fonts; the document is never sent to a conversion service.

Comic Neue Latin fonts are vendored from @fontsource/comic-neue 5.2.7,
under SIL OFL-1.1, as a fallback when Comic Sans MS is unavailable.
See fonts/ComicNeue-LICENSE.txt. Upstream: https://github.com/crozynski/comicneue
