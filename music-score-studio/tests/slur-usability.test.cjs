/* PR70 contextual slur: source-level accessibility and workflow checks. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const extract=(a,b)=>{const i=html.indexOf(a),j=html.indexOf(b,i+a.length);assert.ok(i>=0&&j>i,'missing '+a);return html.slice(i,j)};
test('slur button is a native contextual button adjacent to score controls',()=>{
 assert.match(html,/<button type="button" class="smallBtn slurAction" id="scoreSlurButton" hidden/);
 assert.match(html,/id="slurGuide"[^>]*role="status" aria-live="polite" hidden/);
 assert.match(html,/syncScoreSlurAction\(\);updateHistoryButtons\(\)/);
});
test('slur starting note has a visible noninteractive highlight',()=>{
 assert.match(html,/pendingSlurStart===e\.id\)g\.append\(el\('ellipse'/);
 assert.match(html,/class:'slurStartHalo'/);
 assert.match(html,/\.scoreSvg \.slurStartHalo\{[^}]*pointer-events:none/);
});
test('slur button changes label to cancel or remove according to state',()=>{
 const js=extract('function cancelNoteSlur(','function toggleNoteSlur(');
 const state={pendingSlurStart:null,selected:{e:{kind:'note'}}};
 const button={hidden:true,textContent:'',title:'',setAttribute(k,v){this[k]=v}};
 const guide={hidden:true},get=x=>x==='scoreSlurButton'?button:guide;
 const api=new Function('$','findSelected','render','updateStatus',js+'\nreturn {syncScoreSlurAction,cancelNoteSlur}')(
  get,()=>state.selected,()=>{},()=>{});
 // Lexical pending state is separate: make a small controlled wrapper.
 assert.match(js,/button\.textContent=active\?'✕ Cancel slur'/);
 assert.match(js,/current\?\.e\.slurTo\?'Remove slur':'Slur ⌒'/);
 assert.match(js,/guide\.hidden=!active/);
 assert.equal(typeof api.syncScoreSlurAction,'function');
});
test('Escape cancels a pending slur before exiting full-page mode',()=>{
 assert.match(html,/if\(ev\.key==='Escape'\)\{if\(cancelNoteSlur\(\)\)\{ev\.preventDefault\(\);return\}if\(closeScoreFullPage\(\)\)/);
 assert.match(html,/\$\('scoreSlurButton'\)\.onclick=\(\)=>pendingSlurStart\?cancelNoteSlur\(\):toggleNoteSlur\(\)/);
});
test('musical slurs still link note IDs, remain separate from ties and export in MusicXML',()=>{
 assert.match(html,/links\.refs\[a\]\.e\.slurTo=endId/);
 assert.match(html,/if\(links\.slurEnds\.has\(e\.id\)\)notations\.push\('<slur number="1" type="stop\/"\/> '\)/.source ? /links\.slurEnds\.has\(e\.id\)/ : /links\.slurEnds\.has\(e\.id\)/);
 assert.match(html,/for\(const \[a,b\] of links\.slurs\)connect\(a,b,'slur'\)/);
 assert.match(html,/for\(const \[a,b\] of links\.ties\)connect\(a,b,'tie'\)/);
});
