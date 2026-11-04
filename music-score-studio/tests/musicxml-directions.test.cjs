/* Music Score Studio — MusicXML directions and scheduled-volume regressions.
 * Run: node --test music-score-studio/tests/musicxml-directions.test.cjs
 * Uses the real parser and the real imported-score scheduling function.
 * The document is a small synthetic DOM; no browser audio is claimed.
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
function slice(start, end) {
 const a = html.indexOf(start), b = html.indexOf(end, a);
 assert.ok(a >= 0 && b > a, 'Could not locate imported music code');
 return html.slice(a, b);
}
const parserCode = slice('function directionQuarterBpm(', 'function pianoSVG(');
const performanceCode = slice('function createImportedRepeatedTiming(', 'async function playPiano(){');
const dynamics = { pp:.25, p:.4, mp:.55, mf:.79, f:1.2, ff:1.4 };
const allowed = { dynamic:['pp','p','mp','mf','f','ff','fp','crescendo','diminuendo'], tempo:[], expression:[] };
function n(localName, kids=[], attrs={}, ownText=null) {
 return {
  localName, children:kids,
  get textContent() { return ownText ?? kids.map(x=>x.textContent).join(''); },
  getAttribute(k) { return attrs[k] ?? null; },
  hasAttribute(k) { return Object.prototype.hasOwnProperty.call(attrs,k); }
 };
}
const word = (tag,v) => n(tag,[],{},String(v));
const child = (e,k) => (e?.children||[]).find(x=>x.localName===k)||null;
const children = (e,k) => (e?.children||[]).filter(x=>x.localName===k);
const nodeText = (e,k) => (child(e,k)?.textContent||'').trim();
const attr = () => n('attributes',[word('divisions',4),n('time',[word('beats',4),word('beat-type',4)])]);
const pitch = (step,octave) => n('pitch',[word('step',step),word('octave',octave)]);
const note = (step,staff=1,duration=4) => n('note',[pitch(step,staff===1?4:3),word('duration',duration),word('staff',staff)]);
const dyn = name => n('dynamics',[n(name)]);
const wedge = type => n('wedge',[],{type});
const sound = value => n('sound',[],{dynamics:String(value)});
const backup = duration => n('backup',[word('duration',duration)]);
const forward = duration => n('forward',[word('duration',duration)]);
function dir(marks=[],opts={}) {
 return n('direction',[
  ...marks.map(mark => n('direction-type',Array.isArray(mark)?mark:[mark])),
  ...(opts.offset===undefined?[]:[word('offset',opts.offset)]),
  ...(opts.staff===undefined?[]:[word('staff',opts.staff)]),
  ...(opts.sound===undefined?[]:[sound(opts.sound)])
 ]);
}
function xml(parts) {
 const root = n('score-partwise',[
  n('part-list',parts.map((_,i)=>n('score-part',[word('part-name','Part '+(i+1))],{id:'P'+(i+1)}))),
  ...parts.map((bars,i)=>n('part',bars.map((bar,j)=>n('measure',[...(j===0?[attr()]:[]),...bar])),{id:'P'+(i+1)}))
 ]);
 return {documentElement:root,getElementsByTagName:()=>[]};
}
function parse(parts) {
 const document = xml(parts);
 class DOMParserMock { parseFromString() {return document;} }
 const parser = new Function('DOMParser','child','children','nodeText','MUSICAL_DYNAMICS','ALLOWED_MARKS',
  parserCode+'\nreturn parseMusicXML;')(DOMParserMock,child,children,nodeText,dynamics,allowed);
 return parser('<score-partwise/>');
}
const perform = new Function('MUSICAL_DYNAMICS','CLASSROOM_TEMPOS',
 performanceCode+'\nreturn createImportedRepeatedTiming;')(dynamics,{});
function scheduled(parts,order=null) {
 const score = parse(parts);
 const timing = perform(score,60/96/score.TPQ,order||score.measureLength.map((_,i)=>i));
 return {score,timing,notes:timing.notes};
}
function near(actual,expected,label='value') {
 assert.ok(Number.isFinite(actual)&&Math.abs(actual-expected)<1e-8,
  label+': expected '+expected+'; received '+actual);
}
function gainBy(notes,step,staff=1,part=0) {
 const hit=notes.find(x=>x.e.step===step&&x.e.staff===staff&&x.e.part===part);
 assert.ok(hit,'Missing scheduled '+step+' on staff '+staff+' in part '+part);
 return hit.volume;
}
const scaled = gain => .68*gain;

test('later direction-type forte reaches the final scheduled note',()=>{
 const x=scheduled([[[dir([word('words','Allegro'),dyn('f')]),note('C')]]]);
 near(gainBy(x.notes,'C'),scaled(1.2));
 assert.equal(x.score.barMarks[0].dynamic,undefined);
});
test('explicit sound dynamics overrides the printed mark in playback',()=>{
 const x=scheduled([[[dir([dyn('f')],{sound:45}),note('C')]]]);
 near(gainBy(x.notes,'C'),scaled(.5));
});
test('explicit sound dynamics zero schedules silence',()=>{
 const x=scheduled([[[dir([dyn('f')],{sound:0}),note('C')]]]);
 near(gainBy(x.notes,'C'),0);
});
test('standalone sound dynamics applies at its exact position',()=>{
 const x=scheduled([[[note('C'),sound(45),note('D')]]]);
 near(gainBy(x.notes,'C'),scaled(.79));
 near(gainBy(x.notes,'D'),scaled(.5));
});
test('directions within a bar affect only subsequent notes',()=>{
 const x=scheduled([[[note('C'),dir([dyn('f')]),note('D')]]]);
 near(gainBy(x.notes,'C'),scaled(.79));
 near(gainBy(x.notes,'D'),scaled(1.2));
});
test('direction offset locates its dynamic at a later beat',()=>{
 const x=scheduled([[[dir([dyn('f')],{offset:4}),note('C'),note('D')]]]);
 near(gainBy(x.notes,'C'),scaled(.79));
 near(gainBy(x.notes,'D'),scaled(1.2));
});
test('same-time printed marks retain their original sequence',()=>{
 const x=scheduled([[[dir([[dyn('f'),dyn('p')]]),note('C')]]]);
 near(gainBy(x.notes,'C'),scaled(.4));
});
test('crescendo ramps to the following dynamic at its wedge stop',()=>{
 const x=scheduled([[[dir([dyn('p'),wedge('crescendo')]),note('C'),note('D'),
  dir([[wedge('stop'),dyn('f')]]),note('E')]]]);
 near(gainBy(x.notes,'C'),scaled(.4));
 near(gainBy(x.notes,'D'),scaled(.8));
 near(gainBy(x.notes,'E'),scaled(1.2));
});
test('stop, new dynamic, and new diminuendo are processed in sequence',()=>{
 const x=scheduled([[[dir([dyn('p'),wedge('crescendo')]),note('C'),note('D'),
  dir([[wedge('stop'),dyn('f'),wedge('diminuendo')]]),note('E'),note('F'),
  dir([[wedge('stop'),dyn('p')]]),note('G')]]]);
 for(const [step,gain] of [['C',.4],['D',.8],['E',1.2],['F',.8],['G',.4]])
  near(gainBy(x.notes,step),scaled(gain),step);
});
test('consecutive wedge changes without intermediate dynamics keep both transitions',()=>{
 const x=scheduled([[[dir([wedge('crescendo')]),note('C'),note('D'),
  dir([[wedge('stop'),wedge('diminuendo')]]),note('E'),note('F'),
  dir([wedge('stop')]),note('G')]]]);
 const c=gainBy(x.notes,'C'),d=gainBy(x.notes,'D'),e=gainBy(x.notes,'E'),f=gainBy(x.notes,'F'),g=gainBy(x.notes,'G');
 assert.ok(c<d&&d<e&&e>f&&f>g,'Wedge direction changes should reverse the volume trend');
});
test('wedge continues across measure boundary to an explicit destination',()=>{
 const x=scheduled([[
  [dir([dyn('p'),wedge('crescendo')]),note('C'),note('D'),note('E'),note('F')],
  [dir([[wedge('stop'),dyn('f')]]),note('G')]
 ]]);
 for(const [step,gain] of [['C',.4],['D',.6],['E',.8],['F',1],['G',1.2]])
  near(gainBy(x.notes,step),scaled(gain),step);
});
test('staff-specific dynamics do not leak to the other staff',()=>{
 const x=scheduled([[[dir([dyn('f')],{staff:1}),note('C',1),backup(4),note('G',2)]]]);
 near(gainBy(x.notes,'C',1),scaled(1.2));
 near(gainBy(x.notes,'G',2),scaled(.79));
});
test('an unstaffed direction remains part-wide within a grand staff',()=>{
 const x=scheduled([[[dir([dyn('f')]),note('C',1),backup(4),note('G',2)]]]);
 near(gainBy(x.notes,'C',1),scaled(1.2));
 near(gainBy(x.notes,'G',2),scaled(1.2));
});
test('dynamics in one musical part do not leak into another',()=>{
 const x=scheduled([
  [[dir([dyn('f')]),note('C')]],
  [[note('G')]]
 ]);
 near(gainBy(x.notes,'C',1,0),scaled(1.2));
 near(gainBy(x.notes,'G',1,1),scaled(.79));
});
test('word-only crescendo still plays automatically at its written position',()=>{
 const x=scheduled([[[dir([word('words','cresc.')]),note('C'),note('D')]]]);
 assert.equal(x.score.barMarks[0].dynamic,undefined);
 near(gainBy(x.notes,'C'),scaled(.79));
 near(gainBy(x.notes,'D'),scaled(.79+(.79*1.4-.79)*.25));
});
test('word-only dynamic stays within the named staff and part',()=>{
 const x=scheduled([
  [[dir([word('words','cresc.')],{staff:1}),note('C',1),note('D',1),
    backup(8),note('G',2),note('A',2)]],
  [[note('C'),note('D')]]
 ]);
 assert.ok(gainBy(x.notes,'D',1,0)>gainBy(x.notes,'C',1,0));
 near(gainBy(x.notes,'A',2,0),scaled(.79));
 near(gainBy(x.notes,'D',1,1),scaled(.79));
});
test('word-only diminuendo begins at a mid-bar position',()=>{
 const x=scheduled([[[note('C'),dir([word('words','dim.')]),note('D'),note('E')]]]);
 near(gainBy(x.notes,'C'),scaled(.79));
 near(gainBy(x.notes,'D'),scaled(.79));
 assert.ok(gainBy(x.notes,'E')<gainBy(x.notes,'D'));
});
test('sound dynamics after a wedge stop determines the ramp endpoint',()=>{
 const x=scheduled([[[dir([dyn('p'),wedge('crescendo')]),note('C'),note('D'),
  dir([[wedge('stop'),dyn('f')]],{sound:90}),note('E')]]]);
 near(gainBy(x.notes,'C'),scaled(.4));
 near(gainBy(x.notes,'D'),scaled(.7));
 near(gainBy(x.notes,'E'),scaled(1));
});
test('an incomplete wedge retains the previous conservative playback behaviour',()=>{
 const x=scheduled([[[dir([wedge('crescendo')]),note('C')]]]);
 near(gainBy(x.notes,'C'),scaled(.79*1.10));
});
test('a repeated score visit schedules the same explicit sound level again',()=>{
 const x=scheduled([[[dir([dyn('f')],{sound:45}),note('C')]]],[0,0]);
 assert.equal(x.notes.length,2);
 near(x.notes[0].volume,scaled(.5));
 near(x.notes[1].volume,scaled(.5));
 assert.ok(x.notes[1].onset>x.notes[0].onset);
});
test('OCR/teacher bar direction can override native scheduled gain when applied',()=>{
 const x=scheduled([[[dir([dyn('f')]),note('C')]]]);
 x.score.barMarks[0].dynamic='p';
 const timing=perform(x.score,60/96/x.score.TPQ,[0]);
 near(timing.notes[0].volume,scaled(.4));
});

test('playPiano dispatch honours sound dynamics and omits silent oscillators',async()=>{
 const score=parse([[[dir([dyn('f')],{sound:0}),note('C'),
  dir([],{sound:45}),note('D')]]]);
 const calls=[];
 const playCode=slice('async function playPiano(){','/* Five pictured note stamps.');
 const factory=new Function(
  'piano','context','window','playing','stopPlayback','flash','ensureAudioBus',
  '$','expandMarkedBarOrder','MUSICAL_DYNAMICS','CLASSROOM_TEMPOS',
  'updateScoreFocusButtons','tone','startPianoTracking','setTimeout','updateStatus',
  'let stopTimer=null;\n'+performanceCode+'\n'+playCode+'\nreturn playPiano;'
 );
 const play=factory(score,{currentTime:5,resume:async()=>{}},{},false,
  ()=>{},()=>{},()=>{},id=>id==='pianoTempo'?{value:'96'}:{},
  count=>Array.from({length:count},(_,i)=>i),dynamics,{},()=>{},
  (...args)=>calls.push(args),()=>{},()=>0,()=>{}
 );
 await play();
 assert.equal(calls.length,1,'a zero-dynamic note should never reach the oscillator');
 near(calls[0][3],scaled(.5),'actual tone dispatch volume');
});

test('scheduled zero-volume notes do not produce visual note-on or note-off events',()=>{
 const x=scheduled([[[dir([dyn('f')],{sound:0}),note('C'),
  dir([],{sound:45}),note('D')]]]);
 assert.equal(x.notes.length,2,'silent note remains in the parsed score');
 near(gainBy(x.notes,'C'),0);
 near(gainBy(x.notes,'D'),scaled(.5));
 assert.equal(x.timing.events.filter(e=>e.on).length,1,'only audible note is highlighted');
 assert.equal(x.timing.events.filter(e=>!e.on).length,1,'only audible note gets an off event');
 assert.equal(x.timing.events[0].index,x.score.notes.findIndex(e=>e.step==='D'));
});
test('silent-only imported score does not schedule visual sounding events',()=>{
 const x=scheduled([[[dir([],{sound:0}),note('C'),note('D')]]]);
 assert.equal(x.timing.notes.length,2);
 assert.equal(x.timing.events.length,0);
 assert.ok(x.timing.total>0,'the silent measure still has timeline duration');
});
test('tracking keeps the cursor moving through silence and highlights only audible notes',()=>{
 const x=scheduled([[[dir([],{sound:0}),note('C'),
  dir([],{sound:45}),note('D')]]]);
 const classes=()=>({items:new Set(),add(x){this.items.add(x)},remove(x){this.items.delete(x)},contains(x){return this.items.has(x)}});
 const displays=x.score.notes.map(()=>({classList:classes()}));
 const chips=x.score.notes.map(()=>({classList:classes()}));
 const paneStatus={textContent:''},cursorTicks=[],scheduledFrames=[];
 const context={currentTime:0};
 const trackingCode=slice('function startPianoTracking(', 'function ensureOSMD(');
 const makeTracking=new Function(
  'resetPianoTracking','pianoTrackingToken','pianoTrackingFrame',
  'piano','playing','context','pianoNoteNodes','simpleNoteNodes','pianoActiveIndices',
  'document','requestAnimationFrame','performance','moveEngravedPlaybackCursor',
  'pianoSVG','renderSimpleNoteStrip','followPianoElement','simplePageStart','simpleCurrentMeasure',
  trackingCode+'\nreturn startPianoTracking;'
 );
 const document={
  getElementById(id){return id==='pianoNowPlaying'?paneStatus:id==='followNotes'?{checked:false}:null;},
  querySelector(){return null;}
 };
 const active=new Set();
 const startTracking=makeTracking(
  ()=>{},1,0,x.score,true,context,
  new Map(displays.map((e,i)=>[i,e])),
  new Map(chips.map((e,i)=>[i,e])),
  active,document,fn=>{scheduledFrames.push(fn);return scheduledFrames.length},
  {now:()=>0},tick=>cursorTicks.push(tick),()=>{},()=>{},()=>{},0,0
 );
 startTracking(0,60/96/x.score.TPQ,x.timing);
 const frameAt=time=>{
  assert.ok(scheduledFrames.length>0,'expected a tracking frame');
  context.currentTime=time;scheduledFrames.shift()();
 };
 const silentIndex=x.score.notes.findIndex(e=>e.step==='C');
 const audibleIndex=x.score.notes.findIndex(e=>e.step==='D');
 frameAt(.10);
 assert.equal(paneStatus.textContent,'Following the score · no notes sounding');
 assert.equal(displays[silentIndex].classList.contains('is-playing'),false);
 assert.equal(chips[silentIndex].classList.contains('active'),false);
 const ticksBefore=cursorTicks.length;
 frameAt(.35);
 assert.ok(cursorTicks.length>ticksBefore,'cursor must advance without note-on events');
 assert.ok(cursorTicks.at(-1)>cursorTicks[0]);
 frameAt(.70);
 assert.equal(displays[audibleIndex].classList.contains('is-playing'),true);
 assert.equal(chips[audibleIndex].classList.contains('active'),true);
 assert.match(paneStatus.textContent,/1 note sounding/);
 assert.equal(displays[silentIndex].classList.contains('is-playing'),false);
 frameAt(1.50);
 assert.equal(displays[audibleIndex].classList.contains('is-playing'),false);
 assert.equal(chips[audibleIndex].classList.contains('active'),false);
 assert.equal(paneStatus.textContent,'Following the score · no notes sounding');
 const afterRelease=cursorTicks.length;
 frameAt(1.80);
 assert.ok(cursorTicks.length>afterRelease,'cursor must advance after audible notes release');
});
