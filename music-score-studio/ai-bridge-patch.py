#!/usr/bin/env python3
"""Integrate Partsong's AGPL licensed OMR into Music Score Studio.
Upstream: https://github.com/pzfreo/partsong
This patch preserves credits, license, and the upstream source link.
"""
from pathlib import Path
import re

ROOT=Path(__file__).resolve().parent
AI=ROOT/"ai"
SRC=AI/"app.js"
html=AI/"index.html"
code=SRC.read_text(encoding="utf-8")

def once(before,after,name):
    global code
    before=before.replace(chr(92)+"`","`").replace(chr(92)+"${","${")
    after=after.replace(chr(92)+"`","`").replace(chr(92)+"${","${")
    if code.count(before)!=1:
        raise SystemExit("Patch anchor mismatch: "+name+" ("+str(code.count(before))+")")
    code=code.replace(before,after,1)

once(
    '  $("status").textContent = [engineStatus, pageStatus].filter(Boolean).join("\\n");',
    '  $("status").textContent = [engineStatus, pageStatus].filter(Boolean).join("\\n");\n'
    '  companionSend({type:"status",message:[engineStatus,pageStatus].filter(Boolean).join(" · ")});',
    "progress events"
)
once(
    '    setPageStatus(\`Couldn\'t read page \${pages.findIndex((p) => !p.xml) + 1}: \${why}\`);',
    '    setPageStatus(\`Couldn\'t read page \${pages.findIndex((p) => !p.xml) + 1}: \${why}\`);\n'
    '    companionSend({type:"error",message:why});',
    "read errors"
)
once(
    "  const entry = scanEntry(false);",
    "  const entry = scanEntry(false);\n"
    '  if (companionMode()) {\n'
    '    const recognized = entry.pages.filter(p => typeof p === "string" && p.includes("score-partwise"));\n'
    '    if (recognized.length) companionSend({type:"result",pages:recognized,title:entry.title});\n'
    '    else companionSend({type:"error",message:"No readable music was found. Try a sharper, straight-on photo."});\n'
    '  }',
    "recognized scores"
)
code += """
// Classroom Companion same-origin integration, added under the AGPL-3.0.
// This code does not upload photos; the File is transferred to this iframe in memory.
const CC_CHANNEL = "cc-music-omr-v1";
function companionMode() {
  return new URLSearchParams(location.search).has("cc-bridge") && window.parent !== window;
}
let companionJobId = null;
function companionSend(payload) {
  if (!companionMode()) return;
  try { window.parent.postMessage({channel:CC_CHANNEL,jobId:companionJobId,...payload},location.origin); } catch (e) {
    console.warn("Classroom Companion bridge message failed", e);
  }
}
let ccScanBusy = false;
window.addEventListener("message", async event => {
  const msg=event.data;
  if (!companionMode() || event.origin !== location.origin ||
      event.source !== window.parent || msg?.channel !== CC_CHANNEL ||
      msg.type !== "scan") return;
  if (ccScanBusy || reading) {
    companionSend({type:"error",message:"The music reader is busy. Try again after this score finishes."});
    return;
  }
  ccScanBusy=true;
  companionJobId=msg.jobId;
  try {
    if(noReader) throw Error("Recognition is not supported on this iPhone or iPad. Try Android or Chrome/Edge on a computer.");
    if(!Array.isArray(msg.files) || !msg.files.length || msg.files.length > 8)
      throw Error("Choose 1 to 8 clear score pictures.");
    const pictures=msg.files.filter(f => f instanceof File && f.size>0 && f.size<18*1024*1024);
    if(pictures.length!==msg.files.length) throw Error("One photo is missing or larger than 18 MB.");
    loadScan();
    $("scan-name").value=String(msg.title||"Classroom music score").slice(0,100);
    companionSend({type:"status",message:"Opening photo and preparing music reader…"});
    if(!await addFiles(pictures) || !pages.length) throw Error("Could not open the selected photo.");
    await readScan();
  } catch(e) {
    companionSend({type:"error",message:String(e.message||e)});
  } finally {
    ccScanBusy=false;
  }
});
companionSend({type:"ready"});
"""
SRC.write_text(code,encoding="utf-8")
page=html.read_text(encoding="utf-8")
page, count=re.subn(r'\s*<script data-goatcounter="[^"]*"[^>]*></script>','',page)
if count!=1:
    raise SystemExit("Cannot remove optional upstream analytics script")
page=page.replace('<title>Partsong', '<title>Partsong Music Reader for Classroom Companion | Partsong')
html.write_text(page,encoding="utf-8")
(AI/"SOURCE.md").write_text(
"""# Classroom Companion on-device Music Reader
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
""",encoding="utf-8")
print("Patched Partsong OMR bridge and preserved upstream licensing.")
