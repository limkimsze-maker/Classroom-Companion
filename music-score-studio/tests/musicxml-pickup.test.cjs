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
const parserText = extract('function parseMusicXML(source){', '\nfunction pianoSVG(');
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
const attributes = () => element('attributes', [
  word('divisions', 1),
  element('time', [word('beats', 4), word('beat-type', 4)])
]);
const musicNote = (step, octave, duration) => element('note', [
  element('pitch', [word('step', step), word('octave', octave)]),
  word('duration', duration)
]);
function bar(duration, implicit, first = false, step = 'C', octave = 4) {
  return element('measure', [
    ...(first ? [attributes()] : []),
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
