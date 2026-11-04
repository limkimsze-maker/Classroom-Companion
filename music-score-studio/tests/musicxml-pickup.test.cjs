/* Music Score Studio: MusicXML pickup and bar-timing regression tests.
 * Run from the repository root:
 *   node --test music-score-studio/tests/musicxml-pickup.test.cjs
 * This parser-level fixture uses no third-party packages or browser audio.
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
function extract(start, end) {
  const from = html.indexOf(start), to = html.indexOf(end, from);
  assert.ok(from >= 0 && to > from, 'Expected parser or timing function in index.html');
  return html.slice(from, to);
}
// PR #64 adds a dynamics helper immediately before the parser. Include it
// when both reviewed changes are combined; keep the pickup-only branch runnable.
const parserStart = html.includes('function applyImportedDynamicEvents(')
  ? 'function applyImportedDynamicEvents(' : 'function parseMusicXML(source){';
const parserText = extract(parserStart, '\nfunction pianoSVG(');
const timingText = extract('function createImportedRepeatedTiming(score,secondsPerTick,order){', '\nasync function playPiano(){');
function element(localName, children = [], attributes = {}, ownText = null) {
  return {
    localName, children,
    get textContent() { return ownText ?? children.map(e => e.textContent).join(''); },
    getAttribute(key) { return attributes[key] ?? null; },
    hasAttribute(key) { return Object.prototype.hasOwnProperty.call(attributes, key); }
  };
}
const word = (tag, text) => element(tag, [], {}, String(text));
const child = (e, name) => (e?.children || []).find(n => n.localName === name) || null;
const children = (e, name) => (e?.children || []).filter(n => n.localName === name);
const nodeText = (e, name) => (child(e, name)?.textContent || '').trim();
const attributes = (beats = 4, beatType = 4) => element('attributes', [
  word('divisions', 1),
  element('time', [word('beats', beats), word('beat-type', beatType)])
]);
const musicNote = (step, octave, duration) => element('note', [
  element('pitch', [word('step', step), word('octave', octave)]),
  word('duration', duration)
]);
function bar(duration, implicit, first = false, step = 'C', octave = 4, meter = [4, 4]) {
  return element('measure', [
    ...(first ? [attributes(...meter)] : []),
    ...(duration ? [musicNote(step, octave, duration)] : [])
  ], implicit === null ? {} : { implicit: implicit ? 'yes' : 'no' });
}
function documentFor(parts) {
  const root = element('score-partwise', [
    element('part-list', parts.map((part, i) => element('score-part', [
      word('part-name', part.name || 'Piano')
    ], { id: 'P' + (i + 1) }))),
    ...parts.map((part, i) => element('part', part.bars, { id: 'P' + (i + 1) }))
  ]);
  return { documentElement: root, getElementsByTagName: () => [] };
}
function parse(parts) {
  const xmlDocument = documentFor(parts);
  class TestDOMParser { parseFromString() { return xmlDocument; } }
  const makeParser = new Function(
    'DOMParser', 'child', 'children', 'nodeText', 'readImportedBarMarks',
    'directionQuarterBpm', 'MUSICAL_DYNAMICS', parserText + '\nreturn parseMusicXML;'
  );
  const parseMusicXML = makeParser(
    TestDOMParser, child, children, nodeText, () => ({}), () => NaN, { mf: .79 }
  );
  return parseMusicXML('<score-partwise/>');
}
const onePart = (first, second) => parse([{ bars: [first, second] }]);
const noteAtSecondBar = score => score.notes.find(n => n.measure === 1);

test('one-crotchet implicit pickup advances to the next bar after one beat', () => {
  const result = onePart(bar(1, true, true), bar(4, null));
  assert.deepEqual(result.measureLength, [960, 3840]);
  assert.deepEqual(result.measureStart, [0, 960]);
  assert.equal(noteAtSecondBar(result).start, 960);
});
test('ordinary incomplete-looking bar still consumes the full 4/4 bar', () => {
  const result = onePart(bar(1, null, true), bar(4, null));
  assert.deepEqual(result.measureLength, [3840, 3840]);
  assert.equal(noteAtSecondBar(result).start, 3840);
});
test('explicit implicit=no still consumes the full bar', () => {
  const result = onePart(bar(1, false, true), bar(4, null));
  assert.equal(noteAtSecondBar(result).start, 3840);
});
test('complete implicit bar keeps its full duration', () => {
  const result = onePart(bar(4, true, true), bar(4, null));
  assert.equal(noteAtSecondBar(result).start, 3840);
});
test('empty implicit bar still reserves the nominal duration', () => {
  const result = onePart(bar(0, true, true), bar(4, null));
  assert.equal(noteAtSecondBar(result).start, 3840);
});
test('overfull implicit bar preserves its notated duration', () => {
  const result = onePart(bar(5, true, true), bar(4, null));
  assert.equal(noteAtSecondBar(result).start, 4800);
});
test('two simultaneous parts remain aligned after an implicit pickup', () => {
  const result = parse([
    { name: 'Treble', bars: [bar(1, true, true, 'G', 4), bar(4, null, false, 'C', 5)] },
    { name: 'Bass', bars: [bar(1, true, true, 'G', 3), bar(4, null, false, 'C', 3)] }
  ]);
  assert.deepEqual(result.measureStart, [0, 960]);
  assert.equal(result.notes.filter(n => n.measure === 1 && n.start === 960).length, 2);
});
test('imported playback starts the second bar one second after a 60 BPM crotchet pickup', () => {
  const score = onePart(bar(1, true, true), bar(4, null));
  const createTiming = new Function('MUSICAL_DYNAMICS', 'CLASSROOM_TEMPOS',
    timingText + '\nreturn createImportedRepeatedTiming;')({ mf: .79 }, {});
  const timing = createTiming(score, 1 / 960, [0, 1]);
  const next = timing.notes.find(x => x.e.measure === 1);
  assert.ok(Math.abs(next.onset - 1) < 1e-9);
  assert.ok(Math.abs(timing.total - 5) < 1e-9);
});

function tiedBar(duration, implicit, first, tieType, step='C', octave=4) {
 const measure = bar(duration,implicit,first,step,octave);
 const target = measure.children.find(n=>n.localName==='note');
 target.children.push(element('tie',[],{type:tieType}));
 return measure;
}
function timingFor(score,order=score.measureLength.map((_,i)=>i),bpm=60) {
 const createTiming = new Function('MUSICAL_DYNAMICS','CLASSROOM_TEMPOS',
  timingText+'\nreturn createImportedRepeatedTiming;')({mf:.79},{});
 return createTiming(score,60/bpm/score.TPQ,order);
}
function nearly(actual,expected,label) {
 assert.ok(Math.abs(actual-expected)<1e-7,(label||'timing')+': expected '+expected+' got '+actual);
}

test('tie from one-crotchet pickup sustains without reattack into the next bar',()=>{
 const score=onePart(tiedBar(1,true,true,'start'),tiedBar(1,null,false,'stop'));
 assert.deepEqual(score.measureStart,[0,960]);
 assert.equal(score.notes.length,1,'one combined sounding note');
 assert.equal(score.notes[0].duration,1920);
 const timing=timingFor(score);
 assert.equal(timing.notes.length,1);
 nearly(timing.notes[0].onset,0,'tie onset');
 nearly(timing.notes[0].duration,2,'two crotchets at 60 BPM');
 nearly(timing.events.find(e=>!e.on).at,2,'visual note-off');
 nearly(timing.total,5,'full two-bar performance length');
});
test('tie across pickup respects a tempo change in the following bar',()=>{
 const score=onePart(tiedBar(1,true,true,'start'),tiedBar(1,null,false,'stop'));
 score.barMarks[1]={tempoBpm:120};
 const timing=timingFor(score);
 nearly(timing.notes[0].duration,1.5,'one second plus half-second continuation');
 nearly(timing.events.find(e=>!e.on).at,1.5,'tie release at changed tempo');
});
test('empty implicit accompaniment does not pad a one-crotchet pickup',()=>{
 const score=parse([
  {name:'Melody',bars:[bar(1,true,true,'G',4),bar(4,null,false,'C',5)]},
  {name:'Silent bass pickup',bars:[bar(0,true,true),bar(4,null,false,'G',3)]}
 ]);
 assert.deepEqual(score.measureLength,[960,3840]);
 assert.deepEqual(score.measureStart,[0,960]);
 const notes=score.notes.filter(n=>n.measure===1);
 assert.equal(notes.length,2);
 assert.ok(notes.every(n=>n.start===960));
 const timing=timingFor(score);
 nearly(timing.notes.find(x=>x.e.part===0&&x.e.measure===1).onset,1);
 nearly(timing.notes.find(x=>x.e.part===1&&x.e.measure===1).onset,1);
});
test('silent accompaniment appearing first still does not dictate pickup length',()=>{
 const score=parse([
  {name:'Silent bass pickup',bars:[bar(0,true,true),bar(4,null,false,'G',3)]},
  {name:'Melody',bars:[bar(1,true,true,'G',4),bar(4,null,false,'C',5)]}
 ]);
 assert.deepEqual(score.measureLength,[960,3840]);
 const timing=timingFor(score);
 assert.equal(timing.notes.filter(x=>x.e.measure===1&&Math.abs(x.onset-1)<1e-8).length,2);
});
test('combined silent accompaniment and tied pickup maintain both parts in sync',()=>{
 const score=parse([
  {name:'Melody',bars:[tiedBar(1,true,true,'start','C',4),tiedBar(1,null,false,'stop','C',4)]},
  {name:'Accompaniment',bars:[bar(0,true,true),bar(4,null,false,'G',3)]}
 ]);
 assert.deepEqual(score.measureStart,[0,960]);
 const timing=timingFor(score);
 const melody=timing.notes.find(x=>x.e.part===0);
 const bass=timing.notes.find(x=>x.e.part===1);
 assert.equal(timing.notes.length,2);
 nearly(melody.onset,0);nearly(melody.duration,2);
 nearly(bass.onset,1);nearly(timing.total,5);
 assert.equal(timing.events.filter(x=>x.on).length,2);
});
test('repeated pickup visits sustain only into their contiguous following bar',()=>{
 const score=onePart(tiedBar(1,true,true,'start'),tiedBar(1,null,false,'stop'));
 const timing=timingFor(score,[0,1,0,1]);
 assert.equal(timing.notes.length,2);
 nearly(timing.notes[0].duration,2);
 nearly(timing.notes[1].onset,5);
 nearly(timing.notes[1].duration,2);
});
test('a navigation jump does not sustain a tie across non-adjacent bar visits',()=>{
 const score=onePart(tiedBar(1,true,true,'start'),tiedBar(1,null,false,'stop'));
 const timing=timingFor(score,[0,0,1]);
 assert.equal(timing.notes.length,2);
 nearly(timing.notes[0].duration,1);
 nearly(timing.notes[1].duration,2);
});

for(const [beats,beatType,nominal] of [[2,4,1920],[3,4,2880],[6,8,2880]]){
 test('entirely empty implicit '+beats+'/'+beatType+' bar uses its own nominal ticks',()=>{
  const score=onePart(bar(0,true,true,'C',4,[beats,beatType]),bar(1,null));
  assert.deepEqual(score.measureLength,[nominal,nominal]);
  assert.deepEqual(score.measureStart,[0,nominal]);
  assert.equal(noteAtSecondBar(score).start,nominal);
  assert.equal(score.total,nominal*2);
  const timing=timingFor(score);
  nearly(timing.notes[0].onset,nominal/960,'first sounding onset');
  nearly(timing.total,nominal*2/960,'total playback at 60 BPM');
 });
}
test('two empty implicit 6/8 parts share one nominal bar, not two',()=>{
 const score=parse([
  {name:'Melody',bars:[bar(0,true,true,'C',4,[6,8]),bar(1,null,false,'C',5)]},
  {name:'Bass',bars:[bar(0,true,true,'C',3,[6,8]),bar(1,null,false,'G',3)]}
 ]);
 assert.deepEqual(score.measureLength,[2880,2880]);
 assert.deepEqual(score.measureStart,[0,2880]);
 assert.equal(score.notes.filter(n=>n.measure===1&&n.start===2880).length,2);
 const playback=timingFor(score);
 assert.equal(playback.notes.filter(n=>n.e.measure===1&&Math.abs(n.onset-3)<1e-8).length,2);
 nearly(playback.total,6);
});
for(const [beats,beatType,nominal] of [[2,4,1920],[3,4,2880],[6,8,2880]]){
 test('silent first-part implicit pickup stays one beat in '+beats+'/'+beatType,()=>{
  const score=parse([
   {name:'Silent accompaniment',bars:[bar(0,true,true,'C',3,[beats,beatType]),bar(1,null,false,'G',3)]},
   {name:'Melody',bars:[bar(1,true,true,'C',4,[beats,beatType]),bar(1,null,false,'D',4)]}
  ]);
  assert.deepEqual(score.measureLength,[960,nominal]);
  assert.deepEqual(score.measureStart,[0,960]);
  assert.equal(score.notes.filter(n=>n.measure===1&&n.start===960).length,2);
  const playback=timingFor(score);
  const sounding=playback.notes.filter(n=>n.e.measure===1);
  assert.equal(sounding.length,2);
  sounding.forEach(n=>nearly(n.onset,1,'aligned simultaneous note onset'));
  nearly(playback.total,1+nominal/960,'total pickup score at 60 BPM');
 });
}
