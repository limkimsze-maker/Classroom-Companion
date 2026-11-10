/* Hum to Compose TEST: independent MusicXML well-formedness and musical
 * duration integrity checks with Python's standard XML parser.
 * No external packages, assets or network. Intended for GitHub CI.
 */
'use strict';
const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const core=require('./hum-to-compose-core.js');
const parser=String.raw`import sys,xml.etree.ElementTree as ET
root=ET.fromstring(sys.stdin.read())
assert root.tag=='score-partwise'
measures=root.findall('./part/measure')
assert len(measures)>0
for measure in measures:
 notes=measure.findall('note')
 assert len(notes)>0
 for note in notes:
  duration=note.findtext('duration')
  assert duration and int(duration)>0
  assert note.findtext('type')
`;
let count=0;
for(const metre of ['2/4','3/4','4/4','6/8']){
 for(const fifths of [-7,-2,-1,0,1,2,7]){
  for(const clef of ['treble','bass']){
   const notes=[{midi:70,beats:1},{midi:61,beats:.75},{midi:null,beats:.25},
    {midi:64,beats:4.5},{midi:64,beats:1.5}];
   const xml=core.scoreToMusicXML(notes,metre,96,{clef,fifths,
    title:'Example & <safe> "'+metre+'"'}); 
   const result=spawnSync('python3',['-c',parser],{input:xml,encoding:'utf8',timeout:10000});
   assert.equal(result.status,0,'Invalid MusicXML for '+metre+' key '+fifths+' '+clef+': '+result.stderr);
   assert.match(xml,/<score-partwise version="4.0">/);
   assert.ok(xml.includes('<fifths>'+fifths+'</fifths>'));
   assert.ok(xml.includes('<sound tempo="'));
   count++;
  }
 }
}
console.log('PASS '+count+' MusicXML files parsed successfully across clefs, keys and metres');
