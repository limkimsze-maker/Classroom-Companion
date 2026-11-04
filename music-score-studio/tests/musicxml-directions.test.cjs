/* Regression checks for MusicXML direction parsing.
 * Run with: node --test music-score-studio/tests/musicxml-directions.test.cjs
 * Only built-in Node modules are used; no browser or audio test is implied.
 */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const start = html.indexOf('function parseMusicXML(source){');
const end = html.indexOf('\nfunction pianoSVG(', start);
assert.ok(start !== -1 && end > start, 'MusicXML parser was not found in index.html');
const parserSource = html.slice(start, end);

function node(localName, children = [], attributes = {}, ownText = null) {
  return {
    localName, children,
    get textContent() { return ownText ?? children.map(child => child.textContent).join(''); },
    getAttribute(name) { return attributes[name] ?? null; }
  };
}
const word = (tag, text) => node(tag, [], {}, String(text));
const child = (parent, tag) => (parent?.children || []).find(x => x.localName === tag) || null;
const children = (parent, tag) => (parent?.children || []).filter(x => x.localName === tag);
const nodeText = (parent, tag) => (child(parent, tag)?.textContent || '').trim();

function parsedNote(directionTypes, soundLevel) {
  const direction = node('direction', [
    ...directionTypes.map(type => node('direction-type', [type])),
    ...(soundLevel === undefined ? [] : [node('sound', [], { dynamics: String(soundLevel) })])
  ]);
  const note = node('note', [
    node('pitch', [word('step', 'C'), word('octave', '4')]),
    word('duration', '1')
  ]);
  const attributes = node('attributes', [
    word('divisions', '1'),
    node('time', [word('beats', '4'), word('beat-type', '4')])
  ]);
  const measure = node('measure', [attributes, direction, note]);
  const root = node('score-partwise', [
    node('part-list', [node('score-part', [word('part-name', 'Piano')], { id: 'P1' })]),
    node('part', [measure], { id: 'P1' })
  ]);
  class TestDOMParser {
    parseFromString() {
      return { documentElement: root, getElementsByTagName: () => [] };
    }
  }
  const factory = new Function(
    'DOMParser', 'child', 'children', 'nodeText', 'readImportedBarMarks',
    'directionQuarterBpm', 'MUSICAL_DYNAMICS',
    parserSource + '\nreturn parseMusicXML;'
  );
  const parseMusicXML = factory(TestDOMParser, child, children, nodeText,
    () => ({}), () => NaN, { p: 0.4, f: 1.2, mf: 0.79 });
  return parseMusicXML('<score-partwise/>').notes[0];
}

test('recognises a dynamic in the second direction-type', () => {
  assert.equal(parsedNote([word('words', 'Allegro'), node('dynamics', [node('f')])]).gain, 1.2);
});
test('recognises a crescendo wedge in the second direction-type', () => {
  const gain = parsedNote([word('words', 'cresc.'), node('wedge', [], { type: 'crescendo' })]).gain;
  assert.ok(Math.abs(gain - 0.79 * 1.1) < 1e-10);
});
test('sound dynamics still override printed dynamics', () => {
  assert.equal(parsedNote([word('words', 'dolce'), node('dynamics', [node('f')])], 45).gain, 0.5);
});
test('first direction-type dynamics still work', () => {
  assert.equal(parsedNote([node('dynamics', [node('p')])]).gain, 0.4);
});
test('unrecognised direction leaves default volume', () => {
  assert.equal(parsedNote([word('words', 'unrecognised')]).gain, 0.79);
});
