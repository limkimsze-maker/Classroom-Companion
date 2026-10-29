# Chinese handwriting regression

`wo-shi-hao-ren.png` contains only the ink from the teacher-provided failure
example, “我是好人”. Browser chrome, controls and the incorrect OCR result are
excluded. The test replays the same handwriting at different scales/paddings and
as two lines. Expected text is used only by the test, never by the recogniser.

Before the fix, the 2× case with 24px padding detected only a fragment (七),
covering approximately 16% of the ink. With no extra padding, 2× and 3× cases
also returned fragments. Empty results already triggered direct recognition;
nonempty partial results incorrectly bypassed it. The new ink-coverage check
and normalized full-line fallback recover the complete reading.
