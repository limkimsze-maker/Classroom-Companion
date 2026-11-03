# Classroom Companion on-device Music Reader
This independent component is based on Partsong by Paul Fremantle:
https://github.com/pzfreo/partsong

Upstream source pinned by the repository's build workflow. Licensed under GNU AGPL-3.0.
Local changes: a same-origin postMessage photo-in / MusicXML-out bridge, status
updates, and removal of optional analytics. All code and patches are published
in the Classroom Companion GitHub repository. See LICENSE in this directory.

Recognition: homr / homr-rs by their respective authors (AGPL-3.0).
Models: homr's official ONNX release checkpoints. All photos and recognised
scores remain on the local device; no image-upload service is used.
External CDNs may supply onnxruntime-web and the score display library.
