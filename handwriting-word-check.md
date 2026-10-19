# Word-level handwriting checking — 20 October 2026

Build `20261020-words1` adds offline English word and letter-case suggestions to
the existing Beautify review dialog. Select handwriting, choose Auto, compare
the original ink with the proposed readings, select a choice, then Apply.
An isolated ambiguous `c`/`C` can now offer both cases. Explicit Letters a–z
and Letters A–Z modes constrain word suggestions to the requested case.

## What the checker does

The browser combines the existing EMNIST alphabet classifier (65%) and the
existing pen classifier (35%) for each grouped glyph. A vocabulary prefix
search retains at most 64 candidates per position, considers at most five
visually supported letters per position, and scores complete words using
their average log shape support and a small vocabulary-level preference.
It offers at most four complete readings, including the unchanged original.
No character may be inserted or deleted to make a word, and every selected
stroke must belong to a proposed glyph. Word boundaries come from pen spacing.

The dictionary contains 40,194 lowercase words from the English, British and
American SCOWL size 10/20/35 lists, plus the single-letter words a and I.
It includes British spellings such as colour and recognise. The data is
packaged locally with the page. It uses no API, API key or remote word service.
This is vocabulary-constrained review using the existing classifiers, not a
new neural handwriting model or a general-purpose language model.

The original reading stays selected. A candidate requires support at every
letter position. Alternative capitalisation accounts for a selection that
may begin a sentence; it does not assume that every selection starts one.
Names, initials and case-sensitive identifiers remain available as the original
reading even when absent from the vocabulary. The checker never claims that
every sequence of letters is an English word.

Whole-ink personal corrections retain priority. Confirmed individual glyphs
and imported confusable-character corrections constrain word candidates,
including their case. Ordinary numeric expressions, Math mode, standalone
units and superscripts continue through their existing readers. If an older
unit route reads an entire word as a measurement, competing word suggestions
require at least three independently clear, non-digit-like letters. The
measurement stays available and is never automatically replaced.

Choosing a word changes the preview only. Apply uses the chosen reading's
stroke alignment for local learning; Cancel teaches nothing; Undo reverses
Apply and its learning transaction. A missing word service preserves the
original recogniser result. Cancellation still propagates.

## Limits

The checker supports separated print letters on one line, up to 48 glyphs,
eight words and 20 letters per word. It does not split a connected cursive
stroke into multiple letters, read surrounding PDF text, understand a question,
or perform grammatical or semantic sentence analysis. Punctuation-heavy text,
unknown names and weak letter shapes may receive no suggestion. The underlying
recogniser can still misread the original selection. Suggestions assist human
review; they are not a claim of 99% automatic recognition accuracy.

## Sources and reproducibility

Vocabulary source: <https://wordlist.aspell.net/>. The pinned input is
`scowl-2020.12.07.tar.gz`, SHA256
`5587667caa20c4891390c2d42dbb4d5c4c3f41bee77af1457ece3ba23fb859cc`.
The unmodified source README, including its copyright and redistribution
terms, is retained in `vendor/handwriting/words/SCOWL-README.txt`.

Word simulation fixtures are the labelled UJI Pen Characters **V1** archive,
DOI <https://doi.org/10.24432/C5731G>, CC BY 4.0, by D. Llorens, F. Prat,
A. Marzal and J. M. Vilar. No V2 dataset is added. The preparation script
removes consecutive duplicate points and packages the original isolated
glyphs in a deterministic gzip JSON fixture. Word simulations compose those
independent glyphs; they are not naturally written words. Writers 1–5 guide
development; writers 6–11 provide a separate verification partition. Glyphs
recur, so rates are correlated and do not establish real-world accuracy or
writer-disjoint upstream classifier training. These fixtures are never used
to fit the word vocabulary or handwriting classifiers.

```sh
python scripts/build-handwriting-word-list.py /path/scowl-2020.12.07.tar.gz
python scripts/prepare-handwriting-word-fixtures.py /path/uji-v1.zip
node scripts/test-handwriting-words.cjs
node scripts/test-handwriting-context-review.cjs
node scripts/benchmark-handwriting-words.cjs --split all --out /tmp/word-results.json
node scripts/benchmark-handwriting-simulations.cjs --split all --out /tmp/original-924.json
```

Word test cases include lowercase, sentence case, multiple words, an isolated
c/C, initials and a chemical formula. Exact original recognition and the
availability of the intended reading in alternatives are reported separately.

## Validation results

All 30 code, model and review-controller checks pass. All 924 original
simulation readings are identical to the previous context build (767/924
exact, 83.0%). The new case choices flag 19 additional incorrect readings.
The 1,024-example teacher compatibility control preserves its previous 492
correct readings, with zero regressions. All 152 measurement controls and
five saved diagnostic exports still pass.

In the separate 352-case word/case simulation, the unchanged original is
exact in 75 cases. The intended case-sensitive reading is available either
as the original or an offered choice in 242/352 cases (68.8%). Development
is 113/160; verification is 129/192. This is suggestion coverage requiring
human review, not automatic recognition accuracy. The original text is
never automatically rewritten. All per-case readings and suggestions are
in `handwriting-word-check-results.json`. The 99% target remains unmet.
