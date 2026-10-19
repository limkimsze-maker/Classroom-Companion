"""Build a self-contained, reproducible before/after report from frozen runs."""
import hashlib
import json
import pathlib
import sys

folder = pathlib.Path(sys.argv[1])
root = pathlib.Path(__file__).resolve().parent.parent
context_mode = '--context' in sys.argv
prefix = 'handwriting-context' if context_mode else 'handwriting-simulation'
if context_mode:
    archived = json.loads((root / 'handwriting-simulation-results.json').read_text())
    before = [row | {'actual': row['after'], 'correct': row['afterCorrect'], 'flagged': row['afterFlagged']}
              for row in archived['records']]
else:
    before = sum((json.loads((folder / name).read_text())["records"] for name in
                  ("development-baseline.json", "validation-baseline.json")), [])
after_run = json.loads((folder / ("all-context.json" if context_mode else "final-all.json")).read_text())
assert hashlib.sha256((root / "whiteboard-handwriting-recognition-beta.js").read_bytes()).hexdigest() == after_run["readerSha256"], "Rerun the benchmark after changing the reader"
compatibility = json.loads((folder / ("teacher-final.json" if context_mode else "teacher-compatibility-final.json")).read_text())
measurements = json.loads((folder / ("measured-final.json" if context_mode else "measured-controls-final.json")).read_text())
assert compatibility["readerSha256"] == measurements["readerSha256"] == after_run["readerSha256"], "Control summaries must use the evaluated reader"
assert not compatibility["regressions"]
assert not measurements["failures"] and all(row["correct"] for row in measurements["diagnostics"])
after = after_run["records"]
lookup = {row["id"]: row for row in before}
assert len(lookup) == len(after) == 924
assert set(lookup) == {row["id"] for row in after}
rows = []
for row in after:
    old = lookup[row["id"]]
    assert row["expected"] == old["expected"]
    rows.append({key: row[key] for key in ("id", "writer", "partition", "category", "expected")}
                | {"before": old["actual"], "after": row["actual"],
                   "beforeCorrect": old["correct"], "afterCorrect": row["correct"],
                   "beforeFlagged": old["flagged"], "afterFlagged": row["flagged"]})
data = {"schema": "classroom-simulation-comparison-v1", "build": after_run["build"],
        "readerSha256": after_run["readerSha256"], "baselineCommit": "2ccb7c45ae610b7750413d21e0c9b70ee0d801ce" if context_mode else "e2ab6ba61d3fafd324b1b30c7d98cb27381ed0b5",
        "method": after_run["method"], "targetPercent": 99,
        "compatibility": {"teacherExamples": compatibility["total"],
                          "previouslyCorrect": compatibility["beforeCorrect"],
                          "correctAfter": compatibility["afterCorrect"], "regressions": 0,
                          "measuredControls": measurements["total"],
                          "measuredControlsCorrect": measurements["correct"],
                          "diagnosticExports": len(measurements["diagnostics"]),
                          "method": "Existing training examples and targeted replay controls, not independent accuracy estimates."},
        "records": rows}
if context_mode:
    data['contextSources'] = {name: hashlib.sha256((root / name).read_bytes()).hexdigest()
                              for name in ['whiteboard-handwriting-context-model-beta.js', 'whiteboard-handwriting-context-beta.js']}
    data['contextMethod'] = 'Small statistical notation language model fitted to 48,000 generated strings, fused with independent visual evidence. Personal corrections and valid trained measurements are protected; no equation solving or network requests.'
(root / (prefix + '-results.json')).write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
template = r'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Handwriting simulation results · Classroom Companion</title>
<style>
:root{--navy:#17324d;--teal:#0f766e;--soft:#e7f7f4;--muted:#526476;--line:#d8e1e8;--amber:#975b08}*{box-sizing:border-box}body{margin:0;background:#f2f6f8;color:var(--navy);font:16px/1.55 system-ui,sans-serif}main{max-width:1160px;margin:auto;padding:38px 24px 70px}h1{font-size:clamp(29px,4vw,44px);line-height:1.13;letter-spacing:-.04em;margin:10px 0 18px}h2{font-size:22px;margin:0 0 15px}p{max-width:930px}a{color:var(--teal);font-weight:650}.eyebrow{text-transform:uppercase;letter-spacing:.14em;font-size:12px;font-weight:750;color:var(--teal)}.intro{color:var(--muted);max-width:850px}.badge{display:inline-block;background:#fff1d6;color:var(--amber);padding:5px 12px;border-radius:30px;font-size:13px;font-weight:750}.panel,.card{background:white;border:1px solid var(--line);border-radius:16px;padding:24px}.panel{margin-top:22px}.tabs{display:flex;gap:8px;flex-wrap:wrap;margin:26px 0 18px}button,select,input{font:inherit}button{cursor:pointer;border:1px solid var(--line);border-radius:10px;background:white;padding:10px 16px;color:var(--navy);font-weight:650}button[aria-pressed="true"]{background:var(--teal);color:white;border-color:var(--teal)}button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #79bdb4;outline-offset:2px}.cards{display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:14px}.big{font-size:44px;line-height:1.2;letter-spacing:-.04em;font-weight:750;margin:8px 0}.label,.small{font-size:13px;color:var(--muted)}.delta{color:var(--teal);font-weight:750}.target{position:relative;height:15px;background:#edf2f5;border-radius:10px;margin:16px 0 8px;overflow:hidden}.target:after{content:"";position:absolute;left:99%;height:100%;top:0;width:2px;background:var(--amber)}.bar{display:block;background:var(--teal);height:100%;width:0}.target-label{display:flex;justify-content:space-between;font-size:12px;color:var(--muted)}.table-wrap{overflow:auto}table{border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums}th,td{padding:13px 12px;text-align:left;border-bottom:1px solid #e6edf1;vertical-align:top}th{font-size:12px;text-transform:uppercase;letter-spacing:.045em;color:var(--muted)}td.numeric,th.numeric{text-align:right;white-space:nowrap}.reading{font-size:17px;font-weight:650;white-space:nowrap}.filters{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:18px}select,input[type=search]{border:1px solid var(--line);border-radius:8px;padding:9px 11px;background:white;color:var(--navy)}input[type=search]{flex:1;min-width:200px}.note{border-left:4px solid var(--teal);background:#eef8f5;padding:14px 18px;margin:20px 0}.warning{color:var(--amber)}.improved{color:var(--teal)}.bad{color:#a13024}.foot{font-size:12px;color:var(--muted);margin-top:26px;overflow-wrap:anywhere}.actions{display:flex;gap:20px;align-items:center;flex-wrap:wrap;margin:22px 0}.count{font-size:13px;color:var(--muted)}@media(max-width:760px){main{padding:25px 14px}.cards{grid-template-columns:1fr}.card,.panel{padding:18px}.big{font-size:38px}th,td{padding:10px 8px}table{font-size:14px}}@media print{body{background:white}.tabs,.filters,.actions{display:none}main{padding:0}.panel,.card{break-inside:avoid}#detailPanel{display:none}}
</style></head><body><main>
<div class="eyebrow">Classroom Companion · 19 October 2026</div>
<h1>What the handwriting simulations actually show</h1>
<span class="badge">99% overall target not reached</span>
<p class="intro">A fixed 924-case benchmark of numbers, measurement units, powers, arithmetic and six isolated letters, using labelled UJI Pen Characters V1 glyphs. Every case uses Auto reading. Complete readings must match, including letter case; spacing is ignored.</p>
<div class="tabs" aria-label="Choose benchmark group"><button aria-pressed="true" data-split="validation">Verification · 6 writers</button><button aria-pressed="false" data-split="development">Development · 5 writers</button><button aria-pressed="false" data-split="all">All 924 simulations</button></div>
<div class="cards">
<section class="card"><div class="label">Complete readings after the changes</div><div class="big" id="accuracy"></div><div id="matches"></div><div class="target"><span class="bar" id="accuracyBar"></span></div><div class="target-label"><span>0%</span><span>99% target</span></div></section>
<section class="card"><div class="label">Before these changes</div><div class="big" id="before"></div><div class="delta" id="gain"></div><p class="small" id="changes"></p><p class="small">Same labels, layouts and source glyphs. Pretrained model weights are unchanged.</p></section>
<section class="card"><div class="label">Wrong readings without a review flag</div><div class="big" id="unflagged"></div><div id="flagCount"></div><p class="small">Flags prompt checking. They do not certify that an unflagged reading is correct.</p></section>
</div>
<section class="panel"><h2>Results by task</h2><div class="table-wrap"><table><thead><tr><th>Task</th><th class="numeric">Cases</th><th class="numeric">Before</th><th class="numeric">After</th><th class="numeric">Correct after</th></tr></thead><tbody id="categoryRows"></tbody></table></div>
<p class="small">Letters covers c, m, k, g, l and L. It does not cover the full alphabet. Powers are square and cube units; measured arithmetic has a unit at the end of the equation.</p></section>
<section class="panel"><h2>How to interpret the result</h2>
<div class="note">Verification writers were reserved while the decision rules were developed. This checks those rule changes; it does not establish that the upstream neural models were trained on disjoint writers.</div>
<p>These expressions are assembled from separately written real pen glyphs and generated operator strokes. Glyphs recur across combinations. They are simulations, rather than naturally written full expressions or independent classroom trials.</p>
<p>Fractions, long words, integrals and full pages need their own evaluation. The Math formulas mode was not scored here. A general 99% claim needs a fresh, independent collection of naturally written classroom expressions and an agreed definition of a correct reading.</p>
<p>The improvements combine independent model evidence for digits and letters, preserve complete compound units, keep uncertain symbols available for review and reuse loaded models. No benchmark glyphs were added to the trained examples or personal correction memory.</p>
<p id="compatibility"></p>
</section>
<section class="panel" id="detailPanel"><h2>Inspect the readings</h2><div class="filters"><select id="taskFilter" aria-label="Filter task"><option value="all">All tasks</option></select><label><input type="checkbox" id="onlyErrors" checked> Errors only</label><input type="search" id="search" placeholder="Search expected or recognised text" aria-label="Search readings"></div><div id="detailCount" class="count"></div><div class="table-wrap"><table><thead><tr><th>Expected</th><th>Before</th><th>After</th><th>Review</th></tr></thead><tbody id="detailRows"></tbody></table></div><button id="more" hidden>Show 100 more</button></section>
<div class="actions"><a href="whiteboard-comer-beta.html?v=20261019-simulations1">Open updated Whiteboard Beta</a><button id="download">Download full results JSON</button></div>
<p class="foot">Source glyphs: UJI Pen Characters, Llorens, Prat, Marzal &amp; Vilar. CC BY 4.0. <a href="https://doi.org/10.24432/C5731G">Dataset attribution</a>. Build: <span id="build"></span>. Baseline: e2ab6ba. All figures count every frozen case in the selected group. Evaluated reader SHA-256: <span id="readerHash"></span>.</p>
<script type="application/json" id="reportData">__DATA__</script>
<script>
'use strict';
const report=JSON.parse(document.getElementById('reportData').textContent);
const names={numbers:'Numbers',units:'Measurement units',powers:'Square / cube units',arithmetic:'Arithmetic',measuredArithmetic:'Arithmetic with a unit',letters:'Isolated letters (case-sensitive)'};
const el=id=>document.getElementById(id),escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let split='validation',limit=100;
const selected=()=>report.records.filter(r=>split==='all'||r.partition===split);
const percent=(correct,total)=>(100*correct/Math.max(1,total)).toFixed(1)+'%';
function render(){
 const rows=selected(),n=rows.length,before=rows.filter(r=>r.beforeCorrect).length,after=rows.filter(r=>r.afterCorrect).length,flagged=rows.filter(r=>r.afterFlagged).length;
 el('accuracy').textContent=percent(after,n);el('before').textContent=percent(before,n);el('matches').textContent=`${after} of ${n} readings correct`;
 el('accuracyBar').style.width=percent(after,n);el('gain').textContent=`+${(100*(after-before)/n).toFixed(1)} percentage points`;
 el('changes').textContent=`${rows.filter(r=>!r.beforeCorrect&&r.afterCorrect).length} readings corrected; ${rows.filter(r=>r.beforeCorrect&&!r.afterCorrect).length} previously correct readings regressed.`;
 el('unflagged').textContent=rows.filter(r=>!r.afterCorrect&&!r.afterFlagged).length;el('flagCount').textContent=`${flagged} readings carry a review flag`;
 el('categoryRows').innerHTML=Object.entries(names).map(([key,name])=>{const group=rows.filter(r=>r.category===key),a=group.filter(r=>r.afterCorrect).length,b=group.filter(r=>r.beforeCorrect).length;return `<tr><td>${escape(name)}</td><td class="numeric">${group.length}</td><td class="numeric">${percent(b,group.length)}</td><td class="numeric"><strong>${percent(a,group.length)}</strong></td><td class="numeric">${a} / ${group.length}</td></tr>`}).join('');
 renderDetails();
}
function renderDetails(){
 const term=el('search').value.trim().toLowerCase(),task=el('taskFilter').value;
 const rows=selected().filter(r=>(task==='all'||r.category===task)&&(!el('onlyErrors').checked||!r.afterCorrect)&&(!term||(r.expected+' '+r.before+' '+r.after).toLowerCase().includes(term)));
 el('detailCount').textContent=`Showing ${Math.min(limit,rows.length)} of ${rows.length} matching cases`;
 el('detailRows').innerHTML=rows.slice(0,limit).map(r=>`<tr><td class="reading">${escape(r.expected)}</td><td>${escape(r.before)}</td><td class="reading ${r.afterCorrect?'improved':'bad'}">${escape(r.after)}</td><td>${r.afterFlagged?'Check reading':'No flag'}<br><span class="small">Writer ${escape(r.writer)}</span></td></tr>`).join('');el('more').hidden=rows.length<=limit;
}
for(const [key,name]of Object.entries(names)){const option=document.createElement('option');option.value=key;option.textContent=name;el('taskFilter').appendChild(option)}
document.querySelectorAll('[data-split]').forEach(button=>button.addEventListener('click',()=>{split=button.dataset.split;limit=100;document.querySelectorAll('[data-split]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));render()}));
for(const id of ['taskFilter','onlyErrors','search'])el(id).addEventListener('input',()=>{limit=100;renderDetails()});
el('more').addEventListener('click',()=>{limit+=100;renderDetails()});el('build').textContent=report.build;el('readerHash').textContent=report.readerSha256;
const checks=report.compatibility;
el('compatibility').textContent=`Compatibility controls: ${checks.teacherExamples.toLocaleString()} existing teacher examples checked, with no regressions among the ${checks.previouslyCorrect} previously correct readings; ${checks.correctAfter} are correct after these changes. All ${checks.measuredControls} numeric-prefix measurement controls and ${checks.diagnosticExports} diagnostic exports pass. These are training compatibility and targeted replay checks, not independent accuracy estimates.`;
el('download').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download='handwriting-simulation-results.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
render();
</script></main></body></html>'''
encoded = json.dumps(data, ensure_ascii=False).replace("<", "\\u003c")
if context_mode:
    template = template.replace('19 October 2026', '20 October 2026').replace('What the handwriting simulations actually show', 'What the local context check changes')
    template = template.replace('Before these changes', 'Before context checking').replace('Pretrained model weights are unchanged.', 'Pretrained handwriting weights are unchanged.')
    template = template.replace('Baseline: e2ab6ba.', 'Baseline: 2ccb7c4.').replace('20261019-simulations1', '20261020-context1')
    template = template.replace('handwriting-simulation-results.json', 'handwriting-context-results.json')
    template = template.replace('<p id="compatibility"></p>', '<p>The added model is a small statistical notation language model trained on 48,000 generated strings. It compares complete measurements with the existing visual models and offers alternatives for review. It does not understand surrounding documents or natural-language questions, and it never evaluates an equation to choose its answer.</p><p id="compatibility"></p>')
    template = template.replace('<div id="flagCount"></div>', '<div id="flagCount"></div><p class="small" id="previousUnflagged"></p>')
    template = template.replace("el('accuracy').textContent=", "el('previousUnflagged').textContent='Before context: '+rows.filter(r=>!r.beforeCorrect&&!r.beforeFlagged).length+' unflagged wrong readings';el('accuracy').textContent=")
(root / (prefix + '-report.html')).write_text(template.replace("__DATA__", encoded) + "\n")
print("Built simulation report and comparison JSON for", len(rows), "cases")
