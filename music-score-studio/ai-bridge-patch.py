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
once(
    "    if (!rereading && !scanSettings.systemsChecked) await checkSystems(stopped);",
    "    if (!companionMode() && !rereading && !scanSettings.systemsChecked) await checkSystems(stopped);",
    "automatic camera recognition without manual confirmation"
)
once(
    'worker.postMessage({ type: "init", exact: exactEncoder(), threads: tunedThreads(), gpu: tunedGpu() });',
    'worker.postMessage({ type: "init", noGpu: new URLSearchParams(location.search).has("cpu"), exact: exactEncoder(), threads: tunedThreads(), gpu: tunedGpu() });',
    "CPU-only fallback for browser diagnostics"
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
code="/* Partsong AI reader: original source © 2026 Paul Fremantle (AGPL-3.0).\n * Classroom Companion bridge and local modifications © 2026 Lim Kim Sze.\n * Modified 2026-11-04: same-origin score-photo/MusicXML integration, progress\n * reporting, diagnostic options, local classroom attribution and no analytics.\n * Modified source, build details and license: music-score-studio/ai/SOURCE.md\n * No warranty; upstream authors do not endorse this adaptation.\n */\n"+code
SRC.write_text(code,encoding="utf-8")
page=html.read_text(encoding="utf-8")
if not page.startswith("<!doctype html>\\n"):
    raise SystemExit("Unexpected Partsong HTML doctype; update source notices manually")
page=page.replace("<!doctype html>\\n","<!doctype html>\\n"+"<!-- Partsong reader adapted for Classroom Companion by Lim Kim Sze on 2026-11-04; GNU AGPL-3.0. Original © 2026 Paul Fremantle. Source and changes: ./SOURCE.md. No warranty. -->\n",1)
page=page.replace('<link rel="canonical" href="https://partsong.app/">','<link rel="canonical" href="https://limkimsze-maker.github.io/Classroom-Companion/music-score-studio/ai/">',1)
page, count=re.subn(r'\s*<script data-goatcounter="[^"]*"[^>]*></script>','',page)
if count!=1:
    raise SystemExit("Cannot remove optional upstream analytics script")
page=page.replace('<title>Partsong', '<title>Partsong Music Reader for Classroom Companion | Partsong')
about_before="      <p>Source code: <a href=\"https://github.com/pzfreo/partsong\" target=\"_blank\" rel=\"noopener\">github.com/pzfreo/partsong</a></p>\n      <p><a href=\"privacy.html\">Privacy notice</a> · <a href=\"terms.html\">Terms of use</a></p>"
about_after="      <p><strong>Classroom Companion adaptation:</strong> Modifications © 2026 Lim Kim Sze. This is a modified, independently hosted Partsong reader; it is not operated or endorsed by Partsong or the homr developers. All original copyrights remain with their respective owners.</p>\n      <p><strong>Source of this modified reader:</strong> <a href=\"https://github.com/limkimsze-maker/Classroom-Companion/tree/main/music-score-studio/ai\" target=\"_blank\" rel=\"noopener\">Classroom Companion AI reader and modification files</a> · <a href=\"https://github.com/limkimsze-maker/Classroom-Companion/blob/main/music-score-studio/ai/SOURCE.md\" target=\"_blank\" rel=\"noopener\">Build details and changes</a></p>\n      <p><strong>Original source:</strong> <a href=\"https://github.com/pzfreo/partsong/tree/e7cbd9112763aa31e45abaea2d1bbe09159a8f1b\" target=\"_blank\" rel=\"noopener\">Partsong by Paul Fremantle (pinned source revision)</a>.</p>\n      <p><a href=\"https://github.com/limkimsze-maker/Classroom-Companion/blob/main/music-score-studio/LICENSE\" target=\"_blank\" rel=\"noopener\">Read GNU AGPL-3.0 license</a> · <a href=\"https://github.com/limkimsze-maker/Classroom-Companion/blob/main/music-score-studio/OPEN_SOURCE_NOTICES.md\" target=\"_blank\" rel=\"noopener\">Open-source notices</a>. This adapted reader is provided without warranty.</p>\n      <p>Original Partsong service: <a href=\"https://partsong.app/privacy.html\" target=\"_blank\" rel=\"noopener\">upstream privacy notice</a> and <a href=\"https://partsong.app/terms.html\" target=\"_blank\" rel=\"noopener\">upstream terms</a> (those concern the separate Partsong service, not this classroom adaptation).</p>"
if page.count(about_before)!=1:
    raise SystemExit("Partsong About/source-credit anchor changed; audit upstream before publishing")
page=page.replace(about_before,about_after,1)
html.write_text(page,encoding="utf-8")
# Normalize only escaped angle brackets in upstream's plaintext GNU license.
# This preserves the actual standard license URLs in the distributed copy.
license_file=AI/"LICENSE"
license_file.write_text(license_file.read_text(encoding="utf-8").replace("&lt;","<").replace("&gt;",">"),encoding="utf-8")
(AI/"SOURCE.md").write_text("# Music Score Studio – modified Partsong reader: source and license notices\n\nThis directory is the **Classroom Companion-adapted** on-device music recogniser. It is a modified copy of **Partsong**, © 2026 Paul Fremantle, which incorporates the **homr** and **homr-rs** projects. The reader and modifications are distributed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**, without warranty. Original authors retain their copyrights.\n\n## Source available to users\n\n- **This modified reader:** https://github.com/limkimsze-maker/Classroom-Companion/tree/main/music-score-studio/ai\n- **Entire Music Score Studio (including the calling score editor):** https://github.com/limkimsze-maker/Classroom-Companion/tree/main/music-score-studio\n- **License copy:** https://github.com/limkimsze-maker/Classroom-Companion/blob/main/music-score-studio/ai/LICENSE\n- **Local integration patch:** https://github.com/limkimsze-maker/Classroom-Companion/blob/main/music-score-studio/ai-bridge-patch.py\n- **Rebuild / distribution workflow:** https://github.com/limkimsze-maker/Classroom-Companion/blob/main/.github/workflows/build-music-studio-omr.yml\n- **Original Partsong source, fixed upstream revision:** https://github.com/pzfreo/partsong/tree/e7cbd9112763aa31e45abaea2d1bbe09159a8f1b\n- **homr (AGPL-3.0):** https://github.com/liebharc/homr\n- **homr-rs (AGPL-3.0):** https://github.com/pzfreo/homr-rs\n\n## Modifications to upstream Partsong (2026-11-04 notice update)\n\nBased on Partsong revision `e7cbd9112763aa31e45abaea2d1bbe09159a8f1b` (recorded in the build workflow). Changes made for Classroom Companion:\n\n1. Added a same-origin `postMessage` bridge that accepts classroom photos and returns recognised MusicXML to the host editor (`app.js`); recogniser still runs locally in the browser.\n2. Added reading-progress and error events, a CPU-only diagnostics option, and the simplified automatic scan entry point.\n3. Removed the upstream optional GoatCounter analytics script, changed the title for the embedded reader and updated About-screen attribution, source links and legal explanations.\n4. The separate hosting page (`../index.html`) imports the MusicXML and presents it with teacher-focused score editing and playback controls.\n\nThese edits are documented in `../ai-bridge-patch.py`, in the modified source files published in this directory, and in the Git history. Nothing in this notice claims authorship of Partsong, homr or their models.\n\n## How the published reader is assembled\n\n1. The GitHub Actions workflow checks out the fixed Partsong source commit above and copies selected web/OMR files to `music-score-studio/ai/`.\n2. `python3 music-score-studio/ai-bridge-patch.py` applies the local modifications to the upstream JavaScript, About screen and source notices.\n3. `bash music-score-studio/ai/scripts/fetch-models.sh` fetches the three official homr ONNX checkpoints from its `onnx_checkpoints` release. The published fork also contains the corresponding `.onnx` assets.\n4. The `omr/*.wasm` files come from that pinned Partsong revision. Its `omr-rs/` and `scripts/build-omr.sh` sources and build directions are available in the fixed upstream commit above, including its pinned homr-rs dependency. The build is not independently verified as bit-for-bit reproducible here.\n5. The workflow verifies required files and publishes the reader. The source links above provide the build scripts, patched source, upstream source and component references.\n\n## Other notices and caveats\n\n- **homr and homr-rs:** AGPL-3.0. homr's model-weight licensing and training-data limitations are described in https://github.com/liebharc/homr/blob/main/LICENSE_FAQ.md.\n- **ONNX Runtime Web:** MIT; **pdf.js:** Apache-2.0; **OpenSheetMusicDisplay:** BSD-3-Clause, as credited in the original Partsong About page.\n- **Noto Music engraved clefs in the main editor:** SIL Open Font License 1.1, documented separately in `../NOTO_MUSIC_OFL.txt`.\n- **No endorsement:** Partsong, homr and their contributors have not been represented as sponsors or maintainers of this adaptation.\n- The original Partsong `privacy.html` and `terms.html` are preserved as upstream files; they describe the original Partsong service and should not be treated as terms for this separately hosted classroom adaptation.\n\n**This notice is not a legal opinion.** A compliance review should still check complete corresponding build source for the precompiled WASM artifacts, software-license scope of the host integration and any model-training data rights.\n",encoding="utf-8")
print("Patched Partsong OMR bridge and preserved upstream licensing.")
