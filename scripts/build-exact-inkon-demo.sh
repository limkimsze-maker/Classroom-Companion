#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
UPSTREAM_SHA="2585994ee11fe2ed98065c555c4aae8ee9096209"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
git clone --quiet https://github.com/kimseungdae/ink-on.git "$WORK/ink-on"
cd "$WORK/ink-on"
git checkout --quiet "$UPSTREAM_SHA"
test "$(git rev-parse HEAD)" = "$UPSTREAM_SHA"
npm ci --ignore-scripts --no-audit --no-fund

# This is the official Vue demo, not the ink-on npm library or our custom reader.
# The only source adjustment changes where GitHub Pages serves the SAME upstream
# ONNX/vocab files. Upstream preprocessing, worker, beam search and mode remain intact.
python3 - <<'PY'
from pathlib import Path
p=Path('src/App.vue')
s=p.read_text()
assert s.count("'/models/comer/")==3, 'Unexpected upstream App.vue model paths; review changes'
s=s.replace("'/models/comer/", "'/Classroom-Companion/vendor/inkon-demo/models/comer/")
p.write_text(s)
PY

# Use Vite's original build, just changing the GitHub Pages subdirectory prefix.
npx vite build --base /Classroom-Companion/vendor/inkon-demo/

cd -
mkdir -p vendor/inkon-demo
cp -a "$WORK/ink-on/dist/." vendor/inkon-demo/
cp "$WORK/ink-on/LICENSE" vendor/inkon-demo/UPSTREAM-LICENSE.txt
cat > vendor/inkon-demo/UPSTREAM-PROVENANCE.txt <<EOF
Original repository: https://github.com/kimseungdae/ink-on
Pinned Git commit: $UPSTREAM_SHA
Demo: https://vue-math-handwrite.vercel.app/
Upstream Apache-2.0. Use of CoMER model weights requires provenance review.
The only source adaptation is the 3 model URL prefixes for GitHub Pages.
All upstream mathematical recognition logic, 50 decode steps,
adaptive beam-width, automatic mode, stroke input and Vue UI are unchanged.
No third-party runtime download is required. The upstream app is separately
embedded in the experimental Beta page, not wired into school whiteboard ink.
EOF

test -s vendor/inkon-demo/index.html
test -s vendor/inkon-demo/models/comer/encoder_int8.onnx
test -s vendor/inkon-demo/models/comer/decoder_int8.onnx
test -s vendor/inkon-demo/models/comer/vocab.json
test -s vendor/inkon-demo/ort/ort-wasm-simd-threaded.jsep.wasm
du -sh vendor/inkon-demo
