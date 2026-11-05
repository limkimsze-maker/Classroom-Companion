/* Consolidated Music Score Studio TEST source-level acceptance guards.
 * Native browser/audio/touch/phone verification remains independent.
 * node --test music-score-studio/tests/consolidated-preservation.test.cjs
 */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const one=fs.readFileSync(path.join(__dirname,'..','consolidated-test.html'),'utf8');
const two=fs.readFileSync(path.join(__dirname,'..','consolidated-two-hand-test.html'),'utf8');
const approved='Special thanks to Mdm Hsu Yuh Fui for her valuable advice and guidance on music notation. Any errors or inaccuracies in Music Score Studio are solely my responsibility.';
const ids=h=>[...h.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);
function inkModel(data,positions){
 const start=one.indexOf('function scoreInkNoteCentres('),end=one.indexOf('function staffLayout(',start);
 assert.ok(start>0&&end>start,'Actual note-linked ink code must exist');
 return new Function('data','eventPositions','noteIndex','bottomIndex',one.slice(start,end)+'\nreturn {scoreInkNoteCentres,reprojectScoreInk};')(data,positions,()=>0,()=>0);
}
const note=id=>({id,kind:'note',step:'C',octave:4,den:4,dot:false});
const box=(left=144,top=100,width=400)=>({cells:[{bar:0,left,top,width}]});

test('Both modes are linked and use one Music Score Studio identity',()=>{
 assert.match(one,/href="\.\/consolidated-two-hand-test\.html"/);
 assert.match(two,/href="\.\/consolidated-test\.html"/);
 assert.match(one,/aria-current="page">♫ Single stave<\/span>/);
 assert.match(two,/aria-current="page">🎹 Two hands<\/span>/);
 for(const h of [one,two])assert.match(h,/<h1>Music Score Studio<\/h1>/);
});
test('No duplicate real element IDs in either HTML and save formats remain independent',()=>{
 for(const h of [one,two]){const all=ids(h);assert.equal(all.length,new Set(all).size)}
 assert.match(one,/cc-music-score-studio/);assert.match(two,/cc-music-score-studio-twohand/);
});
test('Approved acknowledgement and AGPL attribution preserved verbatim',()=>{
 for(const h of [one,two]){assert.ok(h.includes(approved));assert.match(h,/GNU AGPL-3\.0/);assert.match(h,/OPEN_SOURCE_NOTICES\.md/)}
});
test('Production dynamics, pickup and simultaneous imported-score playback functions preserved',()=>{
 for(const f of ['applyImportedDynamicEvents','parseMusicXML','createImportedRepeatedTiming'])
  assert.match(one,new RegExp('function '+f+'\\('));
 assert.match(one,/emptyImplicitNominals/);
 assert.match(one,/if\(volume>0\)events\.push/);
});
test('Existing photo recognition, MusicXML imports, page controls and recognition review remain',()=>{
 for(const id of ['omrCameraButton','omrChooseButton','omrImportButton','fullPageEditor','fullPageImported','fullPageZoomEditor','fullPageZoomImported','score','scrollZone'])
 assert.match(one,new RegExp('id="'+id+'"'));
 assert.match(one,/ai\/index\.html\?cc-bridge=1/);
});
test('Quick composition, rhythmic engraving, slur usability and hidden redundant Terms maintained',()=>{
 for(const f of ['setQuickKeyboard','resetQuickCursor','quickEnter','engravingGap','eventPositions','captureSlurNoteTap','drawMusicConnections'])
 assert.match(one,new RegExp('function '+f+'\\('));
 assert.match(one,/id="quickKeyboardToggle"/);
 assert.match(one,/#musicTermsPanel\{display:none!important\}/);
});
test('Two-hand annotations remain independent from musical slurs and ties',()=>{
 for(const mode of ['cursor','select','hand','arrow','pen','highlighter','circle','eraser'])
 assert.match(two,new RegExp('data-annotation-tool="'+mode+'"'));
 for(const f of ['drawAnnotations','annotationAnchorPreservingNote','toggleTie','toggleSlur','performance'])
 assert.match(two,new RegExp('function '+f+'\\('));
});
test('Two-hand illustrated note values, Undo Redo Add Bar and volume visible without menus',()=>{
 const dock=two.slice(two.indexOf('class="studioDock"'),two.indexOf('class="panel quickValuesPanel"'));
 const values=two.slice(two.indexOf('class="panel quickValuesPanel"'),two.indexOf('class="panel scorePanel"'));
 for(const id of ['undo','redo','addBar','volume'])assert.match(dock,new RegExp('id="'+id+'"'));
 for(const id of ['values','kind','dotted','acc'])assert.match(values,new RegExp('id="'+id+'"'));
 assert.match(two,/NOTE_ILLUSTRATIONS\[den\]/);
});
test('Only one dominant Two-hand Play in normal view, full-page score Play retained',()=>{
 assert.match(two,/#sheetPlay\{display:none!important\}/);
 assert.match(two,/\.fullpage #sheetPlay\{display:inline-flex!important\}/);
 assert.match(two,/id="sheetPlay"/);
});
test('Music-ink near one unique notehead moves with its stable note ID when spacing changes',()=>{
 const data={bars:[[note('c')]]},api=inkModel(data,bar=>bar.length===1?[260]:[225,295]),layout=box(),prior=api.scoreInkNoteCentres(layout);
 const ink={kind:'music',headX:260,headY:172,points:[[260,172],[262,174]]};
 data.bars[0].push(note('d'));
 api.reprojectScoreInk([ink],layout,layout,[[[260,172],[262,174]]],prior);
 assert.equal(ink.headX,225);assert.equal(ink.points[0][0],225);
});
test('Ambiguous music sketches retain safe bar alignment instead of guessing a note',()=>{
 const data={bars:[[note('a'),note('b')]]},api=inkModel(data,()=>[250,270]),layout=box();
 const ink={kind:'music',headX:260,headY:172,points:[[260,172],[261,173]]},prior=api.scoreInkNoteCentres(layout);
 api.reprojectScoreInk([ink],layout,layout,[ink.points.map(p=>p.slice())],prior);
 assert.equal(ink.headX,260);
});
test('Unlinked handwriting still follows its bar on system reflow',()=>{
 const data={bars:[[note('c')]]},api=inkModel(data,()=>[260]);
 const old=box(),next=box(150,302,450),ink={kind:'music',headX:420,headY:172,points:[[420,172],[422,174]]};
 api.reprojectScoreInk([ink],old,next,[ink.points.map(p=>p.slice())],api.scoreInkNoteCentres(old));
 assert.equal(ink.headY,374);assert.ok(ink.headX>420);
});
