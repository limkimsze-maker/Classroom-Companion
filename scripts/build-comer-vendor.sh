#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

mkdir -p vendor/comer
npm install --no-save --no-package-lock --ignore-scripts --no-audit --no-fund \
  ink-on@0.1.0 onnxruntime-web@1.24.2 esbuild@0.25.11

npx --no-install esbuild scripts/comer-inference-worker.mjs \
  --bundle --minify --platform=browser --format=iife --target=es2022 \
  --outfile=vendor/comer/comer-worker.js

# Models are fetched at build-time only, never from pupil browsers.
base="https://github.com/kimseungdae/ink-on/releases/download/v0.1.0"
for name in encoder_int8.onnx decoder_int8.onnx vocab.json; do
  curl --fail --location --retry 4 --retry-delay 2 \
    "$base/$name" -o "vendor/comer/$name"
done

# Digests published by the upstream GitHub release; abort on changes.
(
  cd vendor/comer
  printf '%s\n' \
    "272f17c7b120db61db6cd8d77e695d0139144044abd57d9b23284435a5d916fa  encoder_int8.onnx" \
    "658901d81ca3aa4b62b0da262e8fe67ebcfdac19cfb52ca2cfd076bebd481088  decoder_int8.onnx" \
    "6ef75b588049981d2b5b2ceedcc7066dddcbb0c7d04ee2cbfb0ec861f192a850  vocab.json" \
    | sha256sum -c -
)

# Self-host the matching ONNX Runtime WASM assets required by this bundle.
find node_modules/onnxruntime-web/dist -maxdepth 1 -name '*.wasm' -exec cp {} vendor/comer/ \;
# ONNX Runtime 1.24 also loads a companion ES module dynamically.
find node_modules/onnxruntime-web/dist -maxdepth 1 -name 'ort-wasm*.mjs' -exec cp {} vendor/comer/ \;
test -s vendor/comer/comer-worker.js
test -s vendor/comer/encoder_int8.onnx
test -s vendor/comer/decoder_int8.onnx
test -s vendor/comer/vocab.json
ls -lh vendor/comer/
