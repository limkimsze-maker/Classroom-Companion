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
 assert.match(html,/links\.refs\[a\]\.e\.slurTo=links\.refs\[b\]\.e\.id/);
 assert.match(html,/if\(links\.slurEnds\.has\(e\.id\)\)notations\.push\('<slur number="1" type="stop\/"\/> '\)/.source ? /links\.slurEnds\.has\(e\.id\)/ : /links\.slurEnds\.has\(e\.id\)/);
 assert.match(html,/for\(const \[a,b\] of links\.slurs\)connect\(a,b,'slur'\)/);
 assert.match(html,/for\(const \[a,b\] of links\.ties\)connect\(a,b,'tie'\)/);
});

test('tap a slur endpoint completes before pointerdown redraw can detach note target',()=>{
 const fn=extract('function captureSlurNoteTap(','function pointerDown(');
 let completed=null,blocked=false,prevented=false,cleared=false;
 const handler=new Function('pendingSlurStart','piano','svgPoint','nearestMusicNote',
  'clearMusicLongPress','selectEvent',fn+'\nreturn captureSlurNoteTap;')(
  'start',null,()=>({x:210,y:130}),()=>({type:'note',id:'end'}),
  ()=>{cleared=true},id=>{completed=id});
 handler({button:0,preventDefault(){prevented=true},stopImmediatePropagation(){blocked=true}});
 assert.equal(completed,'end');assert.ok(prevented&&blocked&&cleared);
 assert.match(html,/\$\('scrollZone'\)\.addEventListener\('pointerdown',captureSlurNoteTap,true\)/);
});
test('slur target tap ignores empty staff and keeps the pending slur',()=>{
 const fn=extract('function captureSlurNoteTap(','function pointerDown(');
 let chosen=null;
 const handler=new Function('pendingSlurStart','piano','svgPoint','nearestMusicNote',
  'clearMusicLongPress','selectEvent',fn+'\nreturn captureSlurNoteTap;')(
  'start',null,()=>({x:210,y:130}),()=>null,()=>{},id=>{chosen=id});
 handler({button:0,preventDefault(){throw Error('unexpected preventDefault')},
  stopImmediatePropagation(){throw Error('unexpected stop')}});
 assert.equal(chosen,null);
});
test('slur mode switches to cursor selection and retains musical links',()=>{
 assert.match(html,/document\.querySelector\('\[data-annotation-tool="cursor"\]'\)\?\.click\(\)/);
 assert.match(html,/setMode\('select'\);\s*pendingSlurStart=found\.e\.id/);
 assert.match(html,/links\.refs\[a\]\.e\.slurTo=links\.refs\[b\]\.e\.id/);
});

test('slur creation works whether the first or last note is tapped first',()=>{
 const fn=extract('function finishNoteSlur(','function addNoteMarkButtons(');
 for(const [start,end] of [['first','last'],['last','first']]){
  const one={id:'first',kind:'note'},two={id:'last',kind:'note'};
  const refs=[{e:one},{e:two}],indices=new Map([['first',0],['last',1]]);
  const output=new Function('refs','indices','start','end',fn+
   '\nlet pendingSlurStart=start,selected=null;'+
   '\nconst musicalLinks=()=>({refs,indices,slurs:new Map()});'+
   '\nfunction change(){} function commit(){} function render(){} function flash(){}'+
   '\nconst handled=finishNoteSlur(end);return {handled,first:refs[0].e.slurTo,selected};'
  )(refs,indices,start,end);
  assert.equal(output.handled,true);
  assert.equal(output.first,'last');
  assert.equal(output.selected,end);
 }
});
