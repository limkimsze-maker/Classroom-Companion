#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
REPO_ROOT="$PWD"
UPSTREAM_SHA="2585994ee11fe2ed98065c555c4aae8ee9096209"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

git clone --quiet https://github.com/kimseungdae/ink-on.git "$WORK/upstream"
cd "$WORK/upstream"
git checkout --quiet "$UPSTREAM_SHA"
test "$(git rev-parse HEAD)" = "$UPSTREAM_SHA"
npm ci --ignore-scripts --no-audit --no-fund

# The ink-on demo app's ORIGINAL inference.worker.ts is compiled verbatim
# except for same-origin WASM file location, required by the static-site build.
python3 - <<'PY'
from pathlib import Path
p=Path("src/core/inference.worker.ts")
s=p.read_text()
needle="ort.env.wasm.simd = true;"
assert s.count(needle)==1, "Upstream worker changed: review before building"
s=s.replace(needle,needle+"\nort.env.wasm.wasmPaths = new URL('./', self.location.href).href;")
p.write_text(s)
PY

cp "$REPO_ROOT/scripts/inkon-original-beautify-adapter.mjs" ./integrate-beautify.mjs
mkdir -p "$REPO_ROOT/vendor/inkon-original/models/comer"

# Original demo worker, including its exact beam search and mode masking.
./node_modules/.bin/esbuild src/core/inference.worker.ts \
  --bundle --minify --platform=browser --format=iife --target=es2022 \
  --outfile="$REPO_ROOT/vendor/inkon-original/inference.worker.js"

# Original demo preprocessing + tokenization + candidate-selection (KaTeX).
./node_modules/.bin/esbuild integrate-beautify.mjs \
  --bundle --minify --platform=browser --format=iife --target=es2022 \
  --outfile="$REPO_ROOT/vendor/inkon-original/beautify-adapter.js"

cp public/models/comer/encoder_int8.onnx "$REPO_ROOT/vendor/inkon-original/models/comer/"
cp public/models/comer/decoder_int8.onnx "$REPO_ROOT/vendor/inkon-original/models/comer/"
cp public/models/comer/vocab.json "$REPO_ROOT/vendor/inkon-original/models/comer/"
cp LICENSE "$REPO_ROOT/vendor/inkon-original/UPSTREAM-LICENSE.txt"
cp node_modules/onnxruntime-web/dist/ort-wasm*.wasm "$REPO_ROOT/vendor/inkon-original/"
cp node_modules/onnxruntime-web/dist/ort-wasm*.mjs "$REPO_ROOT/vendor/inkon-original/"

cat > "$REPO_ROOT/vendor/inkon-original/UPSTREAM-PROVENANCE.txt" <<EOF
Original source: https://github.com/kimseungdae/ink-on
Demo: https://vue-math-handwrite.vercel.app/
Pinned upstream source revision: $UPSTREAM_SHA
Built directly from the demo's original inference.worker.ts, preprocessing.ts,
tokenizer.ts and latex-repair.ts.
Demo's original 50 decoder steps, dynamic beam width, Auto mode and KaTeX
candidate validation are preserved.
Only the ONNX WASM runtime location is added to worker initialization.
Separate adapter converts existing whiteboard strokes to the demo's input.
The existing Beautify confirmation and Undo logic are NOT replaced.
Upstream code licence: Apache-2.0. CoMER model weights require
separate licence/provenance review before broader school deployment.
EOF

test -s "$REPO_ROOT/vendor/inkon-original/models/comer/encoder_int8.onnx"
test -s "$REPO_ROOT/vendor/inkon-original/models/comer/decoder_int8.onnx"
test -s "$REPO_ROOT/vendor/inkon-original/models/comer/vocab.json"
test -s "$REPO_ROOT/vendor/inkon-original/inference.worker.js"
test -s "$REPO_ROOT/vendor/inkon-original/beautify-adapter.js"
ls -lh "$REPO_ROOT/vendor/inkon-original/" | tail -15
